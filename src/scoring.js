/**
 * Distance, accuracy, scoring, dynamic metro+20mi zoom-radius telemetry, and shareable emoji grid utilities.
 */

export const MAX_BASE_POINTS = 1000;
export const CITY_BONUS_POINTS = 150;
export const HIGH_ACCURACY_THRESHOLD_PCT = 90; // 90%+ accuracy skips bonus and awards base points immediately

// Default fractional zoom bounds (dynamically refined per city via getCityViewingBounds)
export const MIN_CLUE_ZOOM = 10.0;      // Dynamic per city (9.75 – 10.5 for 26–45 mi max radius)
export const MAX_CLUE_ZOOM = 16.5;      // 0.4 mi street-level radius (~0.5 sq mi)
export const DEFAULT_CLUE_ZOOM = 14.75; // ~1.5 mi tight urban core starting view

export const MIN_RADIUS_MILES = 0.4;
export const DEFAULT_MAX_RADIUS_MILES = 32; // Fallback when no cityBounds passed

const EARTH_RADIUS_MILES = 3958.7613;
const EARTH_RADIUS_KM = 6371.0088;

/**
 * Computes great-circle Haversine distance between two coordinates in miles and kilometers.
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));

  const miles = EARTH_RADIUS_MILES * c;
  const km = EARTH_RADIUS_KM * c;

  return {
    miles: Math.round(miles * 10) / 10,
    km: Math.round(km * 10) / 10,
    rawMiles: miles,
    rawKm: km
  };
}

/**
 * Calculates proximity accuracy (0% to 100%) and base points (0 to 1,000) from distance in miles
 * relative to the target city's actual area radius (`city.metroRadiusMi`).
 *
 * - Inside the city area (`d <= cityRadiusMi`) -> 100.0% (1,000 pts)
 * - Up to 90 miles outside the city boundary (`d <= cityRadiusMi + 90`) -> 99.9% down to 90.0% (900–999 pts, 90%+ auto-qualified)
 * - > 90 miles outside the city boundary -> smooth exponential decay from <90.0% down to 0.0% at 3,500+ mi
 */
export function evaluateProximityGuess(distanceMiles, cityOrRadius = null) {
  const d = Math.max(0, Number(distanceMiles) || 0);
  const cityRadiusMi =
    typeof cityOrRadius === "number"
      ? Math.max(6, cityOrRadius)
      : typeof cityOrRadius?.metroRadiusMi === "number"
      ? Math.max(6, cityOrRadius.metroRadiusMi)
      : 10;

  let rawAccuracy;

  if (d <= cityRadiusMi) {
    // Any guess landing within the actual city area receives a full 100% (1,000 base points)
    rawAccuracy = 100;
  } else {
    const overDistance = d - cityRadiusMi;
    const highAccuracyBufferMi = 90; // 90%+ zone extends 90 miles beyond the city boundary

    if (overDistance <= highAccuracyBufferMi) {
      rawAccuracy = Math.min(99.9, 100 - (overDistance / highAccuracyBufferMi) * 10);
    } else if (overDistance >= 3500) {
      rawAccuracy = 0;
    } else {
      const distPast90 = overDistance - highAccuracyBufferMi;
      const decay = 89.9 * Math.exp(-distPast90 / 850);
      const taper = Math.max(0, 1 - distPast90 / 3410);
      rawAccuracy = decay * Math.pow(taper, 0.25);
    }
  }

  const accuracyPct = Math.round(Math.max(0, Math.min(100, rawAccuracy)) * 10) / 10;
  const basePoints = Math.round((accuracyPct / 100) * MAX_BASE_POINTS);
  const isHighAccuracy = accuracyPct >= HIGH_ACCURACY_THRESHOLD_PCT;

  return {
    accuracyPct,
    basePoints,
    cityRadiusMi,
    isHighAccuracy,
    bonusEligible: !isHighAccuracy
  };
}

/**
 * Converts a clue map zoom level into the viewport radius (mi / km) and area (sq mi / sq km)
 * bounded between `minRadiusMiles` (0.4 mi at maxZoom 16.5) and `maxRadiusMiles` (city.metroRadiusMi + 20 at minZoom).
 */
export function zoomToRadiusTelemetry(zoom, cityBounds = null) {
  const minZoom = cityBounds?.minZoom ?? MIN_CLUE_ZOOM;
  const maxZoom = cityBounds?.maxZoom ?? MAX_CLUE_ZOOM;
  const defaultZoom = cityBounds?.defaultZoom ?? DEFAULT_CLUE_ZOOM;
  const minRadius = cityBounds?.minRadiusMiles ?? MIN_RADIUS_MILES;
  const defaultRadius = cityBounds?.defaultRadiusMiles ?? 1.5;
  const maxRadius = cityBounds?.maxRadiusMiles ?? DEFAULT_MAX_RADIUS_MILES;

  const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
  const zoomSpan = Math.max(0.25, maxZoom - minZoom);
  const tOverall = (maxZoom - clampedZoom) / zoomSpan; // 0 at maxZoom, 1 at minZoom

  // Two-stage logarithmic curve anchored at:
  // - maxZoom (16.5) -> minRadius (0.4 mi)
  // - defaultZoom (14.75) -> defaultRadius (1.5 mi urban core)
  // - minZoom -> maxRadius (city.metroRadiusMi + 20 mi)
  let rawMiles;
  if (clampedZoom >= defaultZoom) {
    const coreSpan = Math.max(0.25, maxZoom - defaultZoom);
    const tCore = (maxZoom - clampedZoom) / coreSpan;
    rawMiles = minRadius * Math.pow(defaultRadius / minRadius, tCore);
  } else {
    const metroSpan = Math.max(0.25, defaultZoom - minZoom);
    const tMetro = (defaultZoom - clampedZoom) / metroSpan;
    rawMiles = defaultRadius * Math.pow(maxRadius / defaultRadius, tMetro);
  }

  const miles = Math.max(
    minRadius,
    Math.min(maxRadius, rawMiles < 10 ? Math.round(rawMiles * 10) / 10 : Math.round(rawMiles))
  );
  const km = Math.round(miles * 1.60934 * 10) / 10;

  const rawAreaSqMi = Math.PI * Math.pow(miles, 2);
  const areaSqMi =
    rawAreaSqMi < 10 ? Math.round(rawAreaSqMi * 10) / 10 : Math.round(rawAreaSqMi);
  const areaSqKm =
    areaSqMi * 2.58999 < 10
      ? Math.round(areaSqMi * 2.58999 * 10) / 10
      : Math.round(areaSqMi * 2.58999);

  // Normalized progress (0% = maxRadiusMiles Metro+20mi view, 100% = 0.4 mi street view)
  const zoomInProgressPct = Math.round((1 - tOverall) * 100);

  let contextLabel = "URBAN CORE";
  if (miles <= 0.8) {
    contextLabel = "STREET GRID";
  } else if (miles <= 3.5) {
    contextLabel = "URBAN CORE";
  } else if (miles <= (cityBounds?.metroRadiusMi ?? 15)) {
    contextLabel = "METRO FOOTPRINT";
  } else {
    contextLabel = "METRO + 20 MI PERIMETER";
  }

  return {
    zoom: clampedZoom,
    miles,
    km,
    areaSqMi,
    areaSqKm,
    maxRadiusMiles: maxRadius,
    maxAreaSqMi: cityBounds?.maxAreaSqMi ?? Math.round(Math.PI * Math.pow(maxRadius, 2)),
    zoomInProgressPct,
    labelMiles: `${miles % 1 === 0 ? miles : miles.toFixed(1)} mi`,
    labelKm: `${km % 1 === 0 ? km : km.toFixed(1)} km`,
    labelAreaSqMi: `${areaSqMi.toLocaleString("en-US")} sq mi`,
    labelAreaSqKm: `${areaSqKm.toLocaleString("en-US")} sq km`,
    contextLabel
  };
}

/**
 * Formats a distance value according to the active unit ('mi' or 'km') or both.
 */
export function formatDistanceReadout(distanceObj, primaryUnit = "mi", includeSecondary = true) {
  if (!distanceObj) return "—";
  const miStr = `${distanceObj.miles.toLocaleString("en-US", { maximumFractionDigits: 1 })} mi`;
  const kmStr = `${distanceObj.km.toLocaleString("en-US", { maximumFractionDigits: 1 })} km`;

  if (!includeSecondary) {
    return primaryUnit === "km" ? kmStr : miStr;
  }
  return primaryUnit === "km" ? `${kmStr} (${miStr})` : `${miStr} (${kmStr})`;
}

/**
 * Generates a 5-block emoji accuracy bar for a single round.
 */
export function getRoundEmojiBar(roundResult) {
  const acc = roundResult.accuracyPct || 0;
  let blocks;
  if (acc >= 95) blocks = "🟩🟩🟩🟩🟩";
  else if (acc >= 90) blocks = "🟩🟩🟩🟩🟩";
  else if (acc >= 75) blocks = "🟩🟩🟩🟩🟨";
  else if (acc >= 60) blocks = "🟩🟩🟩🟨⬛";
  else if (acc >= 40) blocks = "🟩🟩🟨⬛⬛";
  else if (acc >= 20) blocks = "🟩🟨⬛⬛⬛";
  else if (acc > 0) blocks = "🟨⬛⬛⬛⬛";
  else blocks = "🟥⬛⬛⬛⬛";

  const badge = roundResult.isHighAccuracy
    ? "🎯"
    : roundResult.bonusAwarded > 0
    ? "🏷️"
    : "📍";

  return `${blocks} ${badge}`;
}

/**
 * Builds the shareable daily text summary for clipboard copying.
 */
export function generateShareableSummary({ challengeNumber, dateSeed, rounds, isPractice = false }) {
  const totalScore = rounds.reduce((sum, r) => sum + r.totalPoints, 0);
  const avgAccuracy =
    rounds.length > 0
      ? (rounds.reduce((sum, r) => sum + r.accuracyPct, 0) / rounds.length).toFixed(1)
      : "0.0";

  const headerTitle = isPractice
    ? `🛰️ MAPRATURE // PRACTICE RECON`
    : `🛰️ MAPRATURE #${challengeNumber} (${dateSeed})`;

  const lines = [
    headerTitle,
    `SCORE: ${totalScore.toLocaleString("en-US")} / 5,000 pts (${avgAccuracy}% avg)`,
    ""
  ];

  rounds.forEach((r, idx) => {
    const bar = getRoundEmojiBar(r);
    const bonusTag = r.bonusAwarded > 0 ? ` +${r.bonusAwarded}` : "";
    lines.push(
      `R${idx + 1}: ${bar} ${Math.round(r.accuracyPct)}% (${r.basePoints}${bonusTag} pts)`
    );
  });

  return lines.join("\n");
}
