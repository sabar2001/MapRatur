import {
  searchCitiesForAutocomplete,
  isCityGuessCorrect
} from "./cities.js";
import {
  getLocalDateSeed,
  getDailyChallengeNumber,
  getDailyCitiesForSeed
} from "./seed.js";
import {
  CITY_BONUS_POINTS,
  MIN_CLUE_ZOOM,
  MAX_CLUE_ZOOM,
  calculateDistance,
  evaluateProximityGuess,
  formatDistanceReadout,
  generateShareableSummary
} from "./scoring.js";
import { MapController } from "./mapController.js";

const STORAGE_PREFIX = "maprature_daily_state_v1_";
const TOTAL_ROUNDS = 5;

export class MapratureGame {
  constructor() {
    this.dateSeed = getLocalDateSeed();
    this.challengeNumber = getDailyChallengeNumber(this.dateSeed);
    this.isPracticeMode = false;
    this.activeSeed = this.dateSeed;

    this.unit = "mi"; // 'mi' | 'km'
    this.dailyCities = getDailyCitiesForSeed(this.activeSeed, TOTAL_ROUNDS);

    this.currentRoundIndex = 0; // 0 .. 4
    this.roundPhase = "EXPLORE"; // 'EXPLORE' | 'GUESS_MAP' | 'BONUS_PROMPT' | 'ROUND_SUMMARY' | 'FINAL_SUMMARY'
    this.roundsHistory = [];

    // Active round transient state
    this.pendingPin = null; // { lat, lng }
    this.pendingEvaluation = null; // { distance, accuracyPct, basePoints, isHighAccuracy, bonusEligible }
    this.autocompleteSuggestions = [];
    this.selectedAutocompleteIndex = -1;
    this.isGuessMapExpanded = false;

    // Cached HUD strings to avoid redundant DOM writes
    this._lastZoomValueText = "";
    this._lastZoomContextText = "";
    this._lastZoomSliderVal = "";

    this._cacheDom();
    this._initMapController();
    this._bindEvents();
    this._restoreOrStartDaily();
  }

  _cacheDom() {
    // HUD Top-Left Telemetry
    this.elChallengeBadge = document.getElementById("hud-challenge-badge");
    this.elRoundCounter = document.getElementById("hud-round-counter");
    this.elRoundPips = document.getElementById("hud-round-pips");
    this.elTotalScore = document.getElementById("hud-total-score");
    this.btnUnitToggle = document.getElementById("btn-unit-toggle");
    this.btnHowToPlay = document.getElementById("btn-how-to-play");

    // HUD Top-Right Scale / Zoom Pill (Dynamic Metro + 20 mi Radius)
    this.elZoomRadiusValue = document.getElementById("hud-zoom-radius-value");
    this.elZoomContextTag = document.getElementById("hud-zoom-context-tag");
    this.elZoomSlider = document.getElementById("hud-zoom-slider");
    this.elZoomMaxBoundLabel = document.getElementById("hud-zoom-max-bound");
    this.btnZoomIn = document.getElementById("btn-clue-zoom-in");
    this.btnZoomOut = document.getElementById("btn-clue-zoom-out");
    this.btnRecenter = document.getElementById("btn-clue-recenter");

    // Map containers
    this.elClueMapContainer = document.getElementById("clue-map-viewport");
    this.elGuessMapContainer = document.getElementById("guess-map-canvas");

    // Floating Action Button (Open Guess Map)
    this.btnToggleGuessMap = document.getElementById("btn-toggle-guess-map");
    this.elFabLabel = document.getElementById("fab-guess-label");

    // Guess Map Overlay Sheet (State 2)
    this.elGuessSheet = document.getElementById("guess-map-sheet");
    this.btnExpandGuessMap = document.getElementById("btn-expand-guess-map");
    this.btnCloseGuessMap = document.getElementById("btn-close-guess-map");
    this.btnGuessZoomIn = document.getElementById("btn-guess-zoom-in");
    this.btnGuessZoomOut = document.getElementById("btn-guess-zoom-out");
    this.elPinCoordsReadout = document.getElementById("guess-pin-coords");
    this.btnConfirmGuess = document.getElementById("btn-confirm-guess");

    // Under-90% City Name Bonus Overlay (State 3)
    this.elBonusCard = document.getElementById("bonus-prompt-card");
    this.elBonusAccuracyBadge = document.getElementById("bonus-accuracy-badge");
    this.elBonusDistanceSub = document.getElementById("bonus-distance-sub");
    this.elBonusInput = document.getElementById("city-bonus-input");
    this.elAutocompleteList = document.getElementById("city-autocomplete-list");
    this.btnSubmitBonus = document.getElementById("btn-submit-bonus");
    this.btnSkipBonus = document.getElementById("btn-skip-bonus");

    // Round Summary Card (State 4)
    this.elRoundSummaryCard = document.getElementById("round-summary-card");
    this.elSummaryRoundBadge = document.getElementById("summary-round-badge");
    this.elSummaryCityName = document.getElementById("summary-city-name");
    this.elSummarySignature = document.getElementById("summary-city-signature");
    this.elSummaryDistance = document.getElementById("summary-distance-value");
    this.elSummaryAccuracy = document.getElementById("summary-accuracy-value");
    this.elSummaryBasePoints = document.getElementById("summary-base-points");
    this.elSummaryBonusStatus = document.getElementById("summary-bonus-status");
    this.elSummaryTotalPoints = document.getElementById("summary-total-points");
    this.btnViewComparisonMap = document.getElementById("btn-view-comparison-map");
    this.btnViewSatelliteMap = document.getElementById("btn-view-satellite-map");
    this.btnNextRound = document.getElementById("btn-next-round");

    // Final Daily Score Modal (State 5)
    this.elFinalModalBackdrop = document.getElementById("final-modal-backdrop");
    this.elFinalSubtitle = document.getElementById("final-modal-subtitle");
    this.elFinalTotalScore = document.getElementById("final-total-score");
    this.elFinalAvgAccuracy = document.getElementById("final-avg-accuracy");
    this.elFinalRankBadge = document.getElementById("final-rank-badge");
    this.elFinalBreakdownList = document.getElementById("final-breakdown-list");
    this.elFinalEmojiPreview = document.getElementById("final-emoji-preview");
    this.btnShareScore = document.getElementById("btn-share-score");
    this.btnPlayPractice = document.getElementById("btn-play-practice");
    this.btnReplayDaily = document.getElementById("btn-replay-daily");

    // How-to-Play Modal
    this.elHelpModalBackdrop = document.getElementById("help-modal-backdrop");
    this.btnCloseHelp = document.getElementById("btn-close-help");

    // Toast notification
    this.elToast = document.getElementById("telemetry-toast");
  }

  _initMapController() {
    this.mapController = new MapController({
      clueContainer: this.elClueMapContainer,
      guessContainer: this.elGuessMapContainer,
      onTelemetryChange: (telemetry) => this._updateZoomHud(telemetry),
      onGuessPinChange: (coords) => this._handlePinPlaced(coords)
    });
  }

  _bindEvents() {
    // Unit toggle (MI / KM)
    this.btnUnitToggle.addEventListener("click", () => {
      this.unit = this.unit === "mi" ? "km" : "mi";
      this.btnUnitToggle.textContent = this.unit.toUpperCase();
      this._lastZoomValueText = "";
      this.mapController._emitTelemetry();
      this._refreshDisplayedDistances();
    });

    // Clue Zoom & Recenter Controls (0.5 step matching zoomDelta: 0.5)
    this.btnZoomIn.addEventListener("click", () => this.mapController.zoomClueBy(0.5));
    this.btnZoomOut.addEventListener("click", () => this.mapController.zoomClueBy(-0.5));
    this.btnRecenter.addEventListener("click", () => this.mapController.recenterClueMap());

    this.elZoomSlider.addEventListener("input", (e) => {
      const pct = Number(e.target.value) / 100; // 0 = minZoom (Metro+20mi), 1 = maxZoom (0.4 mi street grid)
      const minZ = this.mapController.currentCityBounds?.minZoom ?? MIN_CLUE_ZOOM;
      const maxZ = this.mapController.currentCityBounds?.maxZoom ?? MAX_CLUE_ZOOM;
      const targetZoom = minZ + pct * (maxZ - minZ);
      this.mapController.setClueZoom(targetZoom);
    });

    // Guess Map Toggle FAB & Controls
    this.btnToggleGuessMap.addEventListener("click", () => {
      if (this.roundPhase === "EXPLORE") {
        this._setPhase("GUESS_MAP");
      } else if (this.roundPhase === "GUESS_MAP") {
        this._setPhase("EXPLORE");
      }
    });

    this.btnCloseGuessMap.addEventListener("click", () => {
      if (this.roundPhase === "GUESS_MAP") {
        this._setPhase("EXPLORE");
      }
    });

    this.btnExpandGuessMap.addEventListener("click", () => {
      this.isGuessMapExpanded = !this.isGuessMapExpanded;
      this.elGuessSheet.classList.toggle("expanded", this.isGuessMapExpanded);
      this.btnExpandGuessMap.setAttribute(
        "aria-label",
        this.isGuessMapExpanded ? "Compact guess map" : "Expand guess map"
      );
      this.btnExpandGuessMap.title = this.isGuessMapExpanded ? "Compact View" : "Expand View";
      this.mapController.invalidateGuessMapSize();
    });

    this.btnGuessZoomIn.addEventListener("click", () => this.mapController.zoomGuessBy(1));
    this.btnGuessZoomOut.addEventListener("click", () => this.mapController.zoomGuessBy(-1));

    // Confirm Guess CTA
    this.btnConfirmGuess.addEventListener("click", () => this._confirmLocationGuess());

    // Under-90% City Name Bonus Autocomplete & Submission
    this.elBonusInput.addEventListener("input", (e) => {
      this._updateAutocompleteDropdown(e.target.value);
    });

    this.elBonusInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (this.autocompleteSuggestions.length > 0) {
          this.selectedAutocompleteIndex =
            (this.selectedAutocompleteIndex + 1) % this.autocompleteSuggestions.length;
          this._renderAutocompleteItems();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (this.autocompleteSuggestions.length > 0) {
          this.selectedAutocompleteIndex =
            (this.selectedAutocompleteIndex - 1 + this.autocompleteSuggestions.length) %
            this.autocompleteSuggestions.length;
          this._renderAutocompleteItems();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (
          this.selectedAutocompleteIndex >= 0 &&
          this.autocompleteSuggestions[this.selectedAutocompleteIndex]
        ) {
          const chosen = this.autocompleteSuggestions[this.selectedAutocompleteIndex];
          this.elBonusInput.value = `${chosen.name}, ${chosen.country}`;
          this._closeAutocomplete();
        } else {
          this._submitCityNameBonus(false);
        }
      } else if (e.key === "Escape") {
        this._closeAutocomplete();
      }
    });

    this.btnSubmitBonus.addEventListener("click", () => this._submitCityNameBonus(false));
    this.btnSkipBonus.addEventListener("click", () => this._submitCityNameBonus(true));

    // Round Summary Map Mode Toggle & Next Round
    this.btnViewComparisonMap.addEventListener("click", () => {
      this.btnViewComparisonMap.classList.add("active");
      this.btnViewSatelliteMap.classList.remove("active");
      this.mapController.setSummaryMapMode("comparison");
    });

    this.btnViewSatelliteMap.addEventListener("click", () => {
      this.btnViewSatelliteMap.classList.add("active");
      this.btnViewComparisonMap.classList.remove("active");
      this.mapController.setSummaryMapMode("satellite");
    });

    this.btnNextRound.addEventListener("click", () => this._advanceToNextRound());

    // Final Modal Actions
    this.btnShareScore.addEventListener("click", () => this._copyShareableResults());
    this.btnPlayPractice.addEventListener("click", () => this._startPracticeGame());
    this.btnReplayDaily.addEventListener("click", () => this._resetAndReplayDaily());

    // Help Modal
    this.btnHowToPlay.addEventListener("click", () => {
      this.elHelpModalBackdrop.classList.remove("hidden");
    });
    this.btnCloseHelp.addEventListener("click", () => {
      this.elHelpModalBackdrop.classList.add("hidden");
    });
    this.elHelpModalBackdrop.addEventListener("click", (e) => {
      if (e.target === this.elHelpModalBackdrop) {
        this.elHelpModalBackdrop.classList.add("hidden");
      }
    });

    // Global Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "KeyG") {
        if (this.roundPhase === "EXPLORE") {
          e.preventDefault();
          this._setPhase("GUESS_MAP");
        } else if (this.roundPhase === "GUESS_MAP") {
          e.preventDefault();
          this._setPhase("EXPLORE");
        }
      } else if (
        e.code === "KeyR" &&
        (this.roundPhase === "EXPLORE" || this.roundPhase === "GUESS_MAP")
      ) {
        e.preventDefault();
        this.mapController.recenterClueMap();
      } else if (e.code === "Enter" && this.roundPhase === "ROUND_SUMMARY") {
        e.preventDefault();
        this._advanceToNextRound();
      }
    });
  }

  _restoreOrStartDaily() {
    const savedRaw = localStorage.getItem(`${STORAGE_PREFIX}${this.dateSeed}`);
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw);
        if (parsed && Array.isArray(parsed.roundsHistory) && parsed.roundsHistory.length > 0) {
          this.roundsHistory = parsed.roundsHistory;
          if (this.roundsHistory.length >= TOTAL_ROUNDS) {
            this.currentRoundIndex = TOTAL_ROUNDS - 1;
            this.mapController.loadRoundCity(this.dailyCities[this.currentRoundIndex], null);
            this._updateTopLeftHud();
            this._showFinalSummaryModal();
            return;
          } else {
            this.currentRoundIndex = this.roundsHistory.length;
          }
        }
      } catch {
        // Ignore corrupted state
      }
    }

    this._startRound(this.currentRoundIndex);
  }

  _saveDailyProgress() {
    if (this.isPracticeMode) return;
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${this.dateSeed}`,
        JSON.stringify({
          dateSeed: this.dateSeed,
          roundsHistory: this.roundsHistory
        })
      );
    } catch {
      // Storage quota fallback
    }
  }

  _startRound(roundIdx) {
    this.currentRoundIndex = roundIdx;
    this.pendingPin = null;
    this.pendingEvaluation = null;

    // Reset Guess Sheet UI
    this.btnConfirmGuess.disabled = true;
    this.elPinCoordsReadout.textContent = "CLICK WORLD MAP TO DROP PIN";
    this.elPinCoordsReadout.classList.remove("pinned");

    // Reset Bonus Input UI
    this.elBonusInput.value = "";
    this._closeAutocomplete();

    const targetCity = this.dailyCities[this.currentRoundIndex];
    const nextCity =
      this.currentRoundIndex + 1 < TOTAL_ROUNDS
        ? this.dailyCities[this.currentRoundIndex + 1]
        : null;

    this.mapController.loadRoundCity(targetCity, nextCity);

    this._updateTopLeftHud();
    this._setPhase("EXPLORE");
  }

  _setPhase(phase) {
    this.roundPhase = phase;

    // Toggle Guess Map Sheet
    const showGuessSheet = phase === "GUESS_MAP";
    this.elGuessSheet.classList.toggle("visible", showGuessSheet);
    this.btnToggleGuessMap.classList.toggle("active", showGuessSheet);
    this.btnToggleGuessMap.classList.toggle(
      "hidden",
      phase === "BONUS_PROMPT" || phase === "ROUND_SUMMARY" || phase === "FINAL_SUMMARY"
    );

    if (showGuessSheet) {
      this.elFabLabel.textContent = "Hide Guess Map";
      this.mapController.invalidateGuessMapSize();
    } else {
      this.elFabLabel.textContent = this.pendingPin ? "Adjust Guess Pin" : "Open Guess Map";
    }

    // Toggle Bonus Prompt Card
    this.elBonusCard.classList.toggle("visible", phase === "BONUS_PROMPT");
    if (phase === "BONUS_PROMPT") {
      setTimeout(() => this.elBonusInput.focus(), 80);
    }

    // Toggle Round Summary Card
    this.elRoundSummaryCard.classList.toggle("visible", phase === "ROUND_SUMMARY");

    // Toggle Final Summary Modal
    this.elFinalModalBackdrop.classList.toggle("hidden", phase !== "FINAL_SUMMARY");
  }

  _handlePinPlaced({ lat, lng }) {
    this.pendingPin = { lat, lng };
    const latDir = lat >= 0 ? "N" : "S";
    const lngDir = lng >= 0 ? "E" : "W";
    this.elPinCoordsReadout.textContent = `PIN: ${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`;
    this.elPinCoordsReadout.classList.add("pinned");
    this.btnConfirmGuess.disabled = false;
  }

  _confirmLocationGuess() {
    if (!this.pendingPin) return;

    const targetCity = this.dailyCities[this.currentRoundIndex];
    const distance = calculateDistance(
      this.pendingPin.lat,
      this.pendingPin.lng,
      targetCity.lat,
      targetCity.lng
    );

    const evaluation = evaluateProximityGuess(distance.rawMiles, targetCity);
    this.pendingEvaluation = {
      distance,
      ...evaluation
    };

    if (evaluation.isHighAccuracy) {
      // 90%+ Accuracy: Award base points immediately and advance to the round summary
      this._finalizeRound({
        bonusAwarded: 0,
        bonusAttempted: false,
        bonusGuessedName: null,
        bonusCorrect: false
      });
    } else {
      // Under 90% Accuracy: Reveal optional city name input with autocomplete for +150 bonus points
      this.elBonusAccuracyBadge.textContent = `${evaluation.accuracyPct.toFixed(1)}% PROXIMITY • ${evaluation.basePoints} BASE PTS`;
      this.elBonusDistanceSub.textContent = `Your pin landed ${formatDistanceReadout(distance, this.unit, true)} from the target city. Identify the mystery city by name for +${CITY_BONUS_POINTS} bonus points.`;
      this._setPhase("BONUS_PROMPT");
    }
  }

  _updateAutocompleteDropdown(queryText) {
    const trimmed = queryText.trim();
    if (!trimmed) {
      this._closeAutocomplete();
      return;
    }

    this.autocompleteSuggestions = searchCitiesForAutocomplete(trimmed, 6);
    this.selectedAutocompleteIndex = this.autocompleteSuggestions.length > 0 ? 0 : -1;
    this._renderAutocompleteItems();
  }

  _renderAutocompleteItems() {
    this.elAutocompleteList.innerHTML = "";
    if (this.autocompleteSuggestions.length === 0) {
      this.elAutocompleteList.classList.add("hidden");
      return;
    }

    this.elAutocompleteList.classList.remove("hidden");
    this.autocompleteSuggestions.forEach((cityItem, idx) => {
      const li = document.createElement("li");
      li.className = `autocomplete-item${idx === this.selectedAutocompleteIndex ? " selected" : ""}`;
      li.setAttribute("role", "option");
      li.innerHTML = `
        <span class="ac-city-name">${cityItem.name}</span>
        <span class="ac-country-name">${cityItem.country}</span>
      `;
      li.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        this.elBonusInput.value = `${cityItem.name}, ${cityItem.country}`;
        this._closeAutocomplete();
        this.elBonusInput.focus();
      });
      this.elAutocompleteList.appendChild(li);
    });
  }

  _closeAutocomplete() {
    this.autocompleteSuggestions = [];
    this.selectedAutocompleteIndex = -1;
    this.elAutocompleteList.innerHTML = "";
    this.elAutocompleteList.classList.add("hidden");
  }

  _submitCityNameBonus(skipped = false) {
    const targetCity = this.dailyCities[this.currentRoundIndex];
    const userText = skipped ? "" : this.elBonusInput.value.trim();
    const isCorrect = !skipped && isCityGuessCorrect(userText, targetCity);
    const bonusAwarded = isCorrect ? CITY_BONUS_POINTS : 0;

    if (!skipped && userText) {
      this._showToast(
        isCorrect
          ? `✓ Correct! +${CITY_BONUS_POINTS} City Bonus Awarded`
          : `✗ Incorrect city guess — Target was ${targetCity.name}`
      );
    }

    this._finalizeRound({
      bonusAwarded,
      bonusAttempted: !skipped && Boolean(userText),
      bonusGuessedName: userText || null,
      bonusCorrect: isCorrect
    });
  }

  _finalizeRound({ bonusAwarded, bonusAttempted, bonusGuessedName, bonusCorrect }) {
    const targetCity = this.dailyCities[this.currentRoundIndex];
    const evalData = this.pendingEvaluation;
    const totalPoints = evalData.basePoints + bonusAwarded;

    const roundRecord = {
      roundNumber: this.currentRoundIndex + 1,
      city: {
        id: targetCity.id,
        name: targetCity.name,
        country: targetCity.country,
        lat: targetCity.lat,
        lng: targetCity.lng,
        signature: targetCity.signature
      },
      guessCoords: { ...this.pendingPin },
      distance: evalData.distance,
      accuracyPct: evalData.accuracyPct,
      basePoints: evalData.basePoints,
      isHighAccuracy: evalData.isHighAccuracy,
      bonusAwarded,
      bonusAttempted,
      bonusGuessedName,
      bonusCorrect,
      totalPoints
    };

    this.roundsHistory.push(roundRecord);
    this._saveDailyProgress();
    this._updateTopLeftHud();

    const comparisonPayload = {
      guessLat: this.pendingPin.lat,
      guessLng: this.pendingPin.lng,
      actualCity: targetCity
    };
    this.mapController.lastComparisonCoords = comparisonPayload;
    this.mapController.showRoundSummaryComparison(comparisonPayload);

    this.btnViewComparisonMap.classList.add("active");
    this.btnViewSatelliteMap.classList.remove("active");

    this._populateRoundSummaryCard(roundRecord);
    this._setPhase("ROUND_SUMMARY");
  }

  _populateRoundSummaryCard(record) {
    this.elSummaryRoundBadge.textContent = `ROUND ${record.roundNumber} / ${TOTAL_ROUNDS} SUMMARY`;
    this.elSummaryCityName.textContent = `${record.city.name}, ${record.city.country}`;
    this.elSummarySignature.textContent = record.city.signature;

    this.elSummaryDistance.textContent = formatDistanceReadout(record.distance, this.unit, true);
    this.elSummaryAccuracy.textContent = `${record.accuracyPct.toFixed(1)}%`;
    this.elSummaryBasePoints.textContent = `${record.basePoints.toLocaleString("en-US")} pts`;

    if (record.isHighAccuracy) {
      this.elSummaryBonusStatus.textContent = "90%+ PRECISION (AUTO-QUALIFIED)";
      this.elSummaryBonusStatus.className = "summary-metric-value highlight-emerald";
    } else if (record.bonusAwarded > 0) {
      this.elSummaryBonusStatus.textContent = `+${record.bonusAwarded} PTS (CITY IDENTIFIED)`;
      this.elSummaryBonusStatus.className = "summary-metric-value highlight-amber";
    } else if (record.bonusAttempted) {
      this.elSummaryBonusStatus.textContent = `0 PTS ("${record.bonusGuessedName}")`;
      this.elSummaryBonusStatus.className = "summary-metric-value highlight-muted";
    } else {
      this.elSummaryBonusStatus.textContent = "0 PTS (SKIPPED)";
      this.elSummaryBonusStatus.className = "summary-metric-value highlight-muted";
    }

    this.elSummaryTotalPoints.textContent = `+${record.totalPoints.toLocaleString("en-US")} PTS`;

    const isLastRound = record.roundNumber >= TOTAL_ROUNDS;
    this.btnNextRound.textContent = isLastRound
      ? "View Final Daily Score →"
      : `Next Round (${record.roundNumber + 1}/${TOTAL_ROUNDS}) →`;
  }

  _advanceToNextRound() {
    if (this.currentRoundIndex + 1 < TOTAL_ROUNDS) {
      this._startRound(this.currentRoundIndex + 1);
    } else {
      this._showFinalSummaryModal();
    }
  }

  _showFinalSummaryModal() {
    this._setPhase("FINAL_SUMMARY");

    const totalScore = this.roundsHistory.reduce((sum, r) => sum + r.totalPoints, 0);
    const avgAccuracy =
      this.roundsHistory.length > 0
        ? this.roundsHistory.reduce((sum, r) => sum + r.accuracyPct, 0) / this.roundsHistory.length
        : 0;

    this.elFinalSubtitle.textContent = this.isPracticeMode
      ? `PRACTICE RECONNAISSANCE • SEED ${this.activeSeed}`
      : `DAILY CHALLENGE #${this.challengeNumber} • ${this.dateSeed}`;

    this.elFinalTotalScore.textContent = totalScore.toLocaleString("en-US");
    this.elFinalAvgAccuracy.textContent = `${avgAccuracy.toFixed(1)}% AVG ACCURACY`;

    let rankTitle = "ORBITAL CADET";
    if (totalScore >= 4600) rankTitle = "SOVEREIGN CARTOGRAPHER";
    else if (totalScore >= 4000) rankTitle = "ORBITAL RECON SPECIALIST";
    else if (totalScore >= 3000) rankTitle = "GEOSPATIAL ANALYST";
    else if (totalScore >= 2000) rankTitle = "FIELD NAVIGATOR";
    this.elFinalRankBadge.textContent = rankTitle;

    this.elFinalBreakdownList.innerHTML = "";
    this.roundsHistory.forEach((r) => {
      const row = document.createElement("div");
      row.className = "final-round-row";
      const bonusPill = r.isHighAccuracy
        ? `<span class="round-tag tag-emerald">90%+🎯</span>`
        : r.bonusAwarded > 0
        ? `<span class="round-tag tag-amber">+${r.bonusAwarded}🏷️</span>`
        : "";

      row.innerHTML = `
        <div class="final-row-left">
          <span class="final-row-index">R${r.roundNumber}</span>
          <div class="final-row-city">
            <strong>${r.city.name}, ${r.city.country}</strong>
            <span>${formatDistanceReadout(r.distance, this.unit, true)} • ${r.accuracyPct.toFixed(1)}%</span>
          </div>
        </div>
        <div class="final-row-right">
          ${bonusPill}
          <span class="final-row-pts">${r.totalPoints.toLocaleString("en-US")} pts</span>
        </div>
      `;
      this.elFinalBreakdownList.appendChild(row);
    });

    const shareText = generateShareableSummary({
      challengeNumber: this.challengeNumber,
      dateSeed: this.dateSeed,
      rounds: this.roundsHistory,
      isPractice: this.isPracticeMode
    });
    this.elFinalEmojiPreview.textContent = shareText;
    this.btnShareScore.textContent = "Share Score (Copy Emoji Grid)";
    this.btnShareScore.classList.remove("copied");
  }

  async _copyShareableResults() {
    const shareText = generateShareableSummary({
      challengeNumber: this.challengeNumber,
      dateSeed: this.dateSeed,
      rounds: this.roundsHistory,
      isPractice: this.isPracticeMode
    });

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const temp = document.createElement("textarea");
        temp.value = shareText;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }
      this.btnShareScore.textContent = "Copied to Clipboard ✓";
      this.btnShareScore.classList.add("copied");
      this._showToast("✓ Daily telemetry grid copied to clipboard!");
    } catch {
      this._showToast("Clipboard copy ready in preview box above");
    }
  }

  _startPracticeGame() {
    this.isPracticeMode = true;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.activeSeed = `PRACTICE-${randomSuffix}`;
    this.dailyCities = getDailyCitiesForSeed(this.activeSeed, TOTAL_ROUNDS);
    this.roundsHistory = [];
    this.currentRoundIndex = 0;
    this._startRound(0);
    this._showToast("🛰️ Started new 5-round Practice Reconnaissance set");
  }

  _resetAndReplayDaily() {
    this.isPracticeMode = false;
    this.activeSeed = this.dateSeed;
    localStorage.removeItem(`${STORAGE_PREFIX}${this.dateSeed}`);
    this.dailyCities = getDailyCitiesForSeed(this.dateSeed, TOTAL_ROUNDS);
    this.roundsHistory = [];
    this.currentRoundIndex = 0;
    this._startRound(0);
    this._showToast(`🛰️ Reset Daily Challenge #${this.challengeNumber}`);
  }

  _updateTopLeftHud() {
    this.elChallengeBadge.textContent = this.isPracticeMode
      ? "PRACTICE"
      : `DAILY #${this.challengeNumber}`;

    const displayRound = Math.min(TOTAL_ROUNDS, this.currentRoundIndex + 1);
    this.elRoundCounter.textContent = `${displayRound} / ${TOTAL_ROUNDS}`;

    const runningScore = this.roundsHistory.reduce((sum, r) => sum + r.totalPoints, 0);
    this.elTotalScore.textContent = runningScore.toLocaleString("en-US");

    this.elRoundPips.innerHTML = "";
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const pip = document.createElement("span");
      pip.className = "round-pip";
      if (i < this.roundsHistory.length) {
        const r = this.roundsHistory[i];
        pip.classList.add(
          r.isHighAccuracy ? "pip-high" : r.bonusAwarded > 0 ? "pip-bonus" : "pip-done"
        );
        pip.title = `Round ${i + 1}: ${r.city.name} (${r.totalPoints} pts)`;
      } else if (i === this.currentRoundIndex) {
        pip.classList.add("pip-active");
      }
      this.elRoundPips.appendChild(pip);
    }
  }

  _updateZoomHud(telemetry) {
    if (!telemetry) return;
    const radiusStr = this.unit === "km" ? telemetry.labelKm : telemetry.labelMiles;
    const areaStr = this.unit === "km" ? telemetry.labelAreaSqKm : telemetry.labelAreaSqMi;
    const nextValueText = `${radiusStr} rad • ${areaStr}`;

    if (nextValueText !== this._lastZoomValueText) {
      this._lastZoomValueText = nextValueText;
      this.elZoomRadiusValue.textContent = nextValueText;
    }

    if (telemetry.contextLabel !== this._lastZoomContextText) {
      this._lastZoomContextText = telemetry.contextLabel;
      this.elZoomContextTag.textContent = telemetry.contextLabel;
    }

    const sliderStr = String(telemetry.zoomInProgressPct);
    if (sliderStr !== this._lastZoomSliderVal) {
      this._lastZoomSliderVal = sliderStr;
      this.elZoomSlider.value = sliderStr;
    }

    if (this.elZoomMaxBoundLabel) {
      const maxLabel =
        this.unit === "km"
          ? `${Math.round(telemetry.maxRadiusMiles * 1.60934)}km`
          : `${telemetry.maxRadiusMiles}mi`;
      if (this.elZoomMaxBoundLabel.textContent !== maxLabel) {
        this.elZoomMaxBoundLabel.textContent = maxLabel;
      }
    }
  }

  _refreshDisplayedDistances() {
    if (this.roundPhase === "BONUS_PROMPT" && this.pendingEvaluation) {
      this.elBonusDistanceSub.textContent = `Your pin landed ${formatDistanceReadout(
        this.pendingEvaluation.distance,
        this.unit,
        true
      )} from the target city. Identify the mystery city by name for +${CITY_BONUS_POINTS} bonus points.`;
    }
    if (this.roundPhase === "ROUND_SUMMARY" && this.roundsHistory.length > 0) {
      const latest = this.roundsHistory[this.roundsHistory.length - 1];
      this.elSummaryDistance.textContent = formatDistanceReadout(latest.distance, this.unit, true);
    }
    if (this.roundPhase === "FINAL_SUMMARY") {
      this._showFinalSummaryModal();
    }
  }

  _showToast(message) {
    if (!this.elToast) return;
    this.elToast.textContent = message;
    this.elToast.classList.add("visible");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.elToast.classList.remove("visible");
    }, 3200);
  }
}

// Initialize game when DOM is ready
if (typeof document !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    window.mapratureGame = new MapratureGame();
  });
}
