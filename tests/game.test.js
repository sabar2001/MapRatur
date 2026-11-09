import assert from "node:assert/strict";
import {
  DAILY_MYSTERY_CITIES,
  AUTOCOMPLETE_CITY_DIRECTORY,
  METRO_RADIUS_BUFFER_MI,
  MAX_BOUNDS_PAD_FACTOR,
  getCityViewingBounds,
  searchCitiesForAutocomplete,
  isCityGuessCorrect
} from "../src/cities.js";
import {
  getDailyChallengeNumber,
  getDailyCitiesForSeed
} from "../src/seed.js";
import {
  CITY_BONUS_POINTS,
  calculateDistance,
  evaluateProximityGuess,
  zoomToRadiusTelemetry,
  generateShareableSummary
} from "../src/scoring.js";
import {
  latLngToTileXYZ,
  preloadCityTiles
} from "../src/mapController.js";

console.log("Running MAPRATURE core & architectural verification suite...\n");

// 1. Verify Daily Seed Determinism & 5 Distinct Cities
{
  const seedA1 = getDailyCitiesForSeed("2026-11-09", 5);
  const seedA2 = getDailyCitiesForSeed("2026-11-09", 5);
  const seedB = getDailyCitiesForSeed("2026-11-10", 5);

  assert.equal(seedA1.length, 5, "Daily seed must return 5 cities");
  assert.deepEqual(
    seedA1.map((c) => c.id),
    seedA2.map((c) => c.id),
    "Same date seed must produce identical 5 daily cities for all players"
  );

  const uniqueIds = new Set(seedA1.map((c) => c.id));
  assert.equal(uniqueIds.size, 5, "All 5 daily cities must be distinct");

  assert.notDeepEqual(
    seedA1.map((c) => c.id),
    seedB.map((c) => c.id),
    "Adjacent dates must produce different daily city sequences"
  );

  const challengeNum = getDailyChallengeNumber("2026-11-09");
  assert.ok(challengeNum > 300, "Challenge number should increment from Jan 1, 2026");
  console.log("✓ Daily seed determinism & 5-round city selection verified");
}

// 2. Verify Dynamic Metro+20mi Radius, Area Math, Urban Core Default Zoom, and 1.4x Padded Bounds
{
  for (const city of DAILY_MYSTERY_CITIES) {
    assert.ok(
      typeof city.metroRadiusMi === "number" && city.metroRadiusMi >= 6 && city.metroRadiusMi <= 25,
      `City ${city.name} must have metroRadiusMi in [6, 25], got ${city.metroRadiusMi}`
    );

    const bounds = getCityViewingBounds(city);
    assert.equal(
      bounds.maxRadiusMiles,
      city.metroRadiusMi + METRO_RADIUS_BUFFER_MI,
      "maxRadiusMiles must equal city.metroRadiusMi + 20"
    );
    assert.ok(
      bounds.maxRadiusMiles >= 26 && bounds.maxRadiusMiles <= 45,
      "maxRadiusMiles must fall in [26, 45] miles"
    );

    const expectedArea = Math.round(Math.PI * Math.pow(bounds.maxRadiusMiles, 2) * 10) / 10;
    assert.equal(
      bounds.maxAreaSqMi,
      expectedArea,
      "maxAreaSqMi must equal Math.PI * (maxRadiusMiles ** 2)"
    );

    // Must start zoomed IN at tight urban core (~1.5 mi radius, zoom 14.75)
    assert.equal(bounds.defaultZoom, 14.75, "defaultZoom must start at 14.75 (urban core)");
    assert.equal(bounds.maxZoom, 16.5, "maxZoom must be 16.5");
    assert.equal((bounds.minZoom * 4) % 1, 0, "minZoom must be quantized to 0.25 steps");

    // Verify 1.4x padding decouples visual R_max perimeter from Leaflet setMaxBounds
    const perimLatSpan = bounds.perimeterBounds.maxLat - bounds.perimeterBounds.minLat;
    const paddedLatSpan = bounds.paddedMaxBounds.maxLat - bounds.paddedMaxBounds.minLat;
    assert.ok(
      Math.abs(paddedLatSpan / perimLatSpan - MAX_BOUNDS_PAD_FACTOR) < 1e-6,
      "paddedMaxBounds must be 1.4x the R_max perimeter bounds"
    );
  }

  // Verify zoomToRadiusTelemetry interpolation with cityBounds
  const paris = DAILY_MYSTERY_CITIES.find((c) => c.id === "paris-fr");
  const parisBounds = getCityViewingBounds(paris); // metroRadiusMi = 15 -> maxRadiusMiles = 35

  const streetView = zoomToRadiusTelemetry(parisBounds.maxZoom, parisBounds);
  const maxPerimView = zoomToRadiusTelemetry(parisBounds.minZoom, parisBounds);
  const startCoreView = zoomToRadiusTelemetry(parisBounds.defaultZoom, parisBounds);

  assert.equal(streetView.miles, 0.4, "Max zoom must correspond to 0.4 mi street-level radius");
  assert.equal(maxPerimView.miles, 35, "Min zoom for Paris must correspond to 35 mi (15 + 20) radius");
  assert.equal(startCoreView.miles, 1.5, "Starting urban core radius at defaultZoom=14.75 must be 1.5 mi");
  assert.equal(startCoreView.areaSqMi, 7.1, "Starting urban core area at defaultZoom=14.75 must be 7.1 sq mi");

  console.log("✓ Dynamic metroRadiusMi + 20 mi bounds, π·R² area math, urban core start, and 1.4x padded bounds verified");
}

// 3. Verify Fractional Zoom Integer Tile XYZ Conversion
{
  const tile1 = latLngToTileXYZ(48.8566, 2.3522, 14.75);
  const tile2 = latLngToTileXYZ(35.6762, 139.6503, 9.75);

  assert.equal(Number.isInteger(tile1.z), true, "Tile Z coordinate must be an integer");
  assert.equal(tile1.z, 14, "14.75 fractional zoom should floor to integer Z=14 in latLngToTileXYZ");
  assert.equal(Number.isInteger(tile1.x) && Number.isInteger(tile1.y), true);
  assert.equal(tile2.z, 9, "9.75 fractional zoom should floor to integer Z=9 in latLngToTileXYZ");

  // Mock global Image briefly to test preloadCityTiles URL formatting in Node
  const prevImage = globalThis.Image;
  globalThis.Image = class MockImage {
    set src(val) {
      this._src = val;
    }
  };
  try {
    const paris = DAILY_MYSTERY_CITIES.find((c) => c.id === "paris-fr");
    const urls = preloadCityTiles(paris);
    assert.ok(urls.length > 0, "preloadCityTiles should generate tile URLs");
    for (const url of urls) {
      const match = url.match(/\/tile\/([^/]+)\/([^/]+)\/([^/]+)$/);
      assert.ok(match, `Invalid Esri tile URL format: ${url}`);
      assert.equal(
        /^\d+$/.test(match[1]) && /^\d+$/.test(match[2]) && /^\d+$/.test(match[3]),
        true,
        `Tile URL coordinates must be strict integers, got: ${url}`
      );
    }
  } finally {
    globalThis.Image = prevImage;
  }

  console.log("✓ Integer XYZ tile pre-fetching for fractional zoom levels verified");
}

// 4. Verify Distance Scoring, 100% City Area Zone, 90%+ Immediate Qualification, and <90% Bonus Eligibility
{
  const seattle = DAILY_MYSTERY_CITIES.find((c) => c.id === "seattle-us"); // metroRadiusMi = 13
  const tokyo = DAILY_MYSTERY_CITIES.find((c) => c.id === "tokyo-jp"); // metroRadiusMi = 25

  // Exact hit -> 100% accuracy, 1000 base points
  const exact = evaluateProximityGuess(0, seattle);
  assert.equal(exact.accuracyPct, 100);
  assert.equal(exact.basePoints, 1000);
  assert.equal(exact.isHighAccuracy, true);
  assert.equal(exact.bonusEligible, false);

  // 6.2 miles off in Seattle (inside Seattle's 13 mi city area) -> MUST be 100% accuracy & 1,000 pts
  const seattleInCity = evaluateProximityGuess(6.2, seattle);
  assert.equal(seattleInCity.accuracyPct, 100, "Guess at 6.2 mi inside Seattle (13 mi radius) must be 100%");
  assert.equal(seattleInCity.basePoints, 1000, "Guess inside Seattle city area must award 1,000 pts");
  assert.equal(seattleInCity.isHighAccuracy, true);

  // 22 miles off in Tokyo (inside Tokyo's 25 mi city area) -> MUST be 100% accuracy & 1,000 pts
  const tokyoInCity = evaluateProximityGuess(22, tokyo);
  assert.equal(tokyoInCity.accuracyPct, 100, "Guess inside Tokyo's 25 mi city area must be 100%");
  assert.equal(tokyoInCity.basePoints, 1000);

  // Just outside Seattle's 13 mi city area (e.g., 15 mi) -> 99.8% / 998 pts (>= 90% auto-qualified)
  const justOutsideSeattle = evaluateProximityGuess(15, seattle);
  assert.ok(justOutsideSeattle.accuracyPct < 100 && justOutsideSeattle.accuracyPct >= 99.5);
  assert.equal(justOutsideSeattle.isHighAccuracy, true);

  // 50 miles off -> ~95% accuracy (>= 90%), awards base points immediately
  const closeGuess = evaluateProximityGuess(50, seattle);
  assert.ok(closeGuess.accuracyPct >= 90 && closeGuess.accuracyPct < 100);
  assert.equal(closeGuess.isHighAccuracy, true);
  assert.equal(closeGuess.bonusEligible, false);

  // Boundary at cityRadiusMi + 90 miles (13 + 90 = 103 mi for Seattle) -> 90.0% accuracy
  const boundaryGuess = evaluateProximityGuess(seattle.metroRadiusMi + 90, seattle);
  assert.equal(boundaryGuess.accuracyPct, 90);
  assert.equal(boundaryGuess.basePoints, 900);
  assert.equal(boundaryGuess.isHighAccuracy, true);

  // Under 90% accuracy (e.g., 250 miles off) -> triggers City Name Bonus opportunity (+150 pts)
  const under90Guess = evaluateProximityGuess(250, seattle);
  assert.ok(under90Guess.accuracyPct < 90 && under90Guess.accuracyPct > 50);
  assert.equal(under90Guess.isHighAccuracy, false);
  assert.equal(under90Guess.bonusEligible, true);

  // Far miss (4000 miles off) -> 0% accuracy, 0 base points, still eligible for +150 city name bonus
  const farMiss = evaluateProximityGuess(4000, seattle);
  assert.equal(farMiss.accuracyPct, 0);
  assert.equal(farMiss.basePoints, 0);
  assert.equal(farMiss.bonusEligible, true);

  console.log("✓ 100% City Area scoring, base points (0–1,000), and 90% threshold verified");
}

// 5. Verify Autocomplete, City Name Bonus Matching & Shareable Summary
{
  assert.ok(
    AUTOCOMPLETE_CITY_DIRECTORY.length >= 250,
    "Autocomplete directory should contain 250+ world cities"
  );

  const veniceResults = searchCitiesForAutocomplete("veni", 5);
  assert.ok(
    veniceResults.some((c) => c.name === "Venice" && c.country === "Italy"),
    "Autocomplete should return Venice, Italy for 'veni'"
  );

  const targetVenice = DAILY_MYSTERY_CITIES.find((c) => c.id === "venice-it");
  assert.equal(isCityGuessCorrect("Venice", targetVenice), true);
  assert.equal(isCityGuessCorrect("Venice, Italy", targetVenice), true);
  assert.equal(isCityGuessCorrect("venezia", targetVenice), true);
  assert.equal(isCityGuessCorrect("Milan", targetVenice), false);

  const dist = calculateDistance(45.4371, 12.3326, 45.4642, 9.19);
  assert.ok(dist.miles > 140 && dist.miles < 165);

  const sampleRounds = [
    { accuracyPct: 98.2, basePoints: 982, bonusAwarded: 0, totalPoints: 982, isHighAccuracy: true },
    { accuracyPct: 81.0, basePoints: 810, bonusAwarded: CITY_BONUS_POINTS, totalPoints: 960, isHighAccuracy: false },
    { accuracyPct: 64.5, basePoints: 645, bonusAwarded: CITY_BONUS_POINTS, totalPoints: 795, isHighAccuracy: false },
    { accuracyPct: 92.0, basePoints: 920, bonusAwarded: 0, totalPoints: 920, isHighAccuracy: true },
    { accuracyPct: 45.0, basePoints: 450, bonusAwarded: 0, totalPoints: 450, isHighAccuracy: false }
  ];

  const shareText = generateShareableSummary({
    challengeNumber: 313,
    dateSeed: "2026-11-09",
    rounds: sampleRounds
  });

  assert.ok(shareText.includes("MAPRATURE #313 (2026-11-09)"));
  assert.ok(shareText.includes("4,107 / 5,000 pts"));
  console.log("✓ Autocomplete, Haversine distance, and shareable emoji grid verified");
}

console.log("\nAll tests passed! ✨");
