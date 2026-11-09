import { DAILY_MYSTERY_CITIES } from "./cities.js";

const EPOCH_DATE_UTC = Date.UTC(2026, 0, 1); // Jan 1, 2026 = MAPRATURE #1

/**
 * Returns local calendar date formatted as YYYY-MM-DD.
 */
export function getLocalDateSeed(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Computes the Daily Challenge number (#1, #2, ...) from a YYYY-MM-DD seed string.
 */
export function getDailyChallengeNumber(dateSeed = getLocalDateSeed()) {
  const parts = dateSeed.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return 1;
  }
  const currentUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  const diffDays = Math.floor((currentUtc - EPOCH_DATE_UTC) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

/**
 * xmur3 string hash to 32-bit seed generator.
 */
export function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

/**
 * mulberry32 deterministic PRNG returning floats in [0, 1).
 */
export function mulberry32(seedInt) {
  let a = seedInt >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically selects 5 distinct cities for a given seed string (e.g. "2026-11-09").
 * Uses Fisher-Yates shuffle with the seeded PRNG and ensures diverse regional representation.
 */
export function getDailyCitiesForSeed(seedString = getLocalDateSeed(), count = 5) {
  const seedFn = xmur3(`MAPRATURE_DAILY_V1_${seedString}`);
  const rand = mulberry32(seedFn());

  // Copy pool and perform deterministic Fisher-Yates shuffle
  const pool = [...DAILY_MYSTERY_CITIES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
  }

  // Pick 5 distinct cities, prioritizing distinct countries and continents first
  const selected = [];
  const usedCountries = new Set();
  const continentCounts = new Map();

  for (const city of pool) {
    if (selected.length >= count) break;
    const cCount = continentCounts.get(city.continent) || 0;
    if (!usedCountries.has(city.country) && cCount < 2) {
      selected.push(city);
      usedCountries.add(city.country);
      continentCounts.set(city.continent, cCount + 1);
    }
  }

  // Fill any remaining slots if needed
  for (const city of pool) {
    if (selected.length >= count) break;
    if (!selected.some((s) => s.id === city.id)) {
      selected.push(city);
    }
  }

  return selected;
}
