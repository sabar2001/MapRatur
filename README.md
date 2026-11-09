# MAPRATURE — Daily 5-Round Satellite City Guessing Game

Inspired by **MapTap** and **Imperatur’s** satellite city quizzes, **MAPRATURE** is a daily 5-round geospatial reconnaissance game where players inspect unlabeled satellite imagery of a mystery city, drop a location pin on a world map, and optionally claim a city-name bonus.

## Quick Start

```bash
npm start
# Opens local server at http://localhost:8080
```

Run the unit verification suite:

```bash
npm test
```

## Core Gameplay Loop & Architecture

1. **The Clue Viewport (Dynamic `Metro Radius + 20 mi` Cap):**
   - Full-viewport unlabeled satellite imagery (`Esri World Imagery` with memoized procedural fallback if offline) centered on each round's mystery city.
   - Starts zoomed IN at the city's tight urban core (`~1.5 mi` radius, `defaultZoom = 14.75`) so players explore outward from the street grid (`0.4 mi` radius, `maxZoom = 16.5`) up to the city's dynamic `maxRadiusMiles = city.metroRadiusMi + 20` (`26–45 mi` radius, `maxAreaSqMi = π * maxRadiusMiles²`).
   - Renders a dashed visual perimeter ring at `maxRadiusMiles` while padding Leaflet `setMaxBounds()` by `1.4x` (`maxRadiusMiles * 1.4`) so players can center landmarks near the perimeter ring without aspect-ratio zoom clamping.
   - Pre-warms integer XYZ satellite tiles (`Math.floor(zoom)` / `Math.round(zoom)`) for the active round and `Round N+1` via `requestIdleCallback`, and throttles zoom telemetry via `requestAnimationFrame`.
2. **Location Guess (`World Guess Map`):**
   - Toggle the **Open Guess Map** floating action button (or press `G`) to open the clean world map overlay, drop a pin (`#F43F5E`), and click **Confirm Guess**.
3. **Distance Scoring & City Name Bonus:**
   - Proximity accuracy scales from `0%` to `100%` (up to **1,000 base points** per round).
   - **90%+ Accuracy (`<= 100 mi`):** Base points are awarded immediately and the game advances directly to the Round Summary.
   - **Under 90% Accuracy (`> 100 mi`):** Reveals an optional city name input with live autocomplete (250+ global cities, alias & diacritic tolerant) for **+150 bonus points** before ending the round.
4. **Round Summary:**
   - Displays a comparative map framing the **Actual Pin** (`#10B981`) vs. **Guessed Pin** (`#F43F5E`) connected by a dashed geodesic line, distance off in `mi` and `km`, accuracy percentage, round score breakdown, and a **Next Round** button.
5. **Daily Seed & Shareable Results:**
   - Syncs the 5 daily locations deterministically via local calendar date seed (`YYYY-MM-DD` hashed with `xmur3` + `mulberry32`) so all players receive the exact same daily quiz.
   - After Round 5, displays the Final Daily Score Modal with a one-click **Share Score** button that copies a 5-row emoji telemetry grid and total score to the clipboard.
