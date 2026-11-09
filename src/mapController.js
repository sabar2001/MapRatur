import { getCityViewingBounds } from "./cities.js";
import {
  MIN_CLUE_ZOOM,
  MAX_CLUE_ZOOM,
  DEFAULT_CLUE_ZOOM,
  zoomToRadiusTelemetry
} from "./scoring.js";

const fallbackTileCache = new Map();
const preloadedTileUrls = new Set();

/**
 * Generates and memoizes a deterministic procedural satellite or vector map data URL tile
 * used as an automatic fallback if external tile servers are unreachable/offline.
 */
function createFallbackTileDataUrl(z, x, y, mode = "satellite") {
  const intZ = Math.max(1, Math.min(18, Math.round(Number(z) || 12)));
  const cacheKey =
    mode === "world"
      ? `world:${intZ}:${x}:${y}`
      : `${mode}:${intZ}:${Math.abs(x) % 8}:${Math.abs(y) % 8}`;
  if (fallbackTileCache.has(cacheKey)) {
    return fallbackTileCache.get(cacheKey);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const seed = ((intZ * 73856093) ^ (x * 19349663) ^ (y * 83492791)) >>> 0;
  const rand = (n) => {
    const v = Math.sin(seed + n * 12.9898) * 43758.5453;
    return v - Math.floor(v);
  };

  if (mode === "satellite") {
    const bgGrad = ctx.createLinearGradient(0, 0, 256, 256);
    bgGrad.addColorStop(0, "#12241d");
    bgGrad.addColorStop(0.55, "#192d23");
    bgGrad.addColorStop(1, "#0d1f2d");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.save();
    ctx.strokeStyle = "#0a2236";
    ctx.lineWidth = Math.max(14, (intZ - 4) * 5);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(rand(1) * 80, 0);
    ctx.bezierCurveTo(
      80 + rand(2) * 100,
      90,
      60 + rand(3) * 120,
      170,
      140 + rand(4) * 110,
      256
    );
    ctx.stroke();

    const density = Math.max(4, Math.floor((intZ - 4) * 2.5));
    const step = 256 / density;
    ctx.strokeStyle = "rgba(210, 198, 176, 0.16)";
    ctx.lineWidth = intZ >= 11 ? 1.2 : 0.6;

    for (let i = 0; i <= density; i++) {
      const pos = i * step;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos + (rand(i + 10) - 0.5) * 14, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(256, pos + (rand(i + 30) - 0.5) * 14);
      ctx.stroke();
    }

    if (intZ >= 9) {
      for (let b = 0; b < 28; b++) {
        const bx = rand(b * 3) * 230;
        const by = rand(b * 3 + 1) * 230;
        const bw = 6 + rand(b * 3 + 2) * 18;
        const bh = 6 + rand(b * 3 + 5) * 14;
        ctx.fillStyle =
          b % 3 === 0
            ? "rgba(186, 172, 152, 0.22)"
            : b % 3 === 1
            ? "rgba(130, 145, 128, 0.18)"
            : "rgba(38, 74, 52, 0.28)";
        ctx.fillRect(bx, by, bw, bh);
      }
    }
    ctx.restore();
  } else {
    ctx.fillStyle = "#0e1624";
    ctx.fillRect(0, 0, 256, 256);

    // Project WORLD_COASTLINE_POLYGONS onto Web Mercator tile (intZ, x, y) for offline fallback
    const n = Math.pow(2, intZ);
    const wrappedX = ((x % n) + n) % n;
    const latLngToTilePixel = (lat, lng) => {
      const clampedLat = Math.max(-85, Math.min(85, lat));
      const latRad = (clampedLat * Math.PI) / 180;
      const globalX = ((lng + 180) / 360) * n * 256;
      const globalY =
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * 256;
      return {
        px: globalX - wrappedX * 256,
        py: globalY - y * 256
      };
    };

    ctx.fillStyle = "#1e2e46";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
    ctx.lineWidth = 1.2;
    for (const poly of WORLD_COASTLINE_POLYGONS) {
      ctx.beginPath();
      poly.forEach(([lat, lng], idx) => {
        const { px, py } = latLngToTilePixel(lat, lng);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 256, 256);
  }

  const dataUrl = canvas.toDataURL("image/png");
  fallbackTileCache.set(cacheKey, dataUrl);
  return dataUrl;
}

/**
 * Converts (lat, lng, zoom) to integer Web Mercator XYZ tile coordinates.
 * Always floors/rounds zoom to an integer [1..17] so Esri's tile server never receives fractional floats.
 */
export function latLngToTileXYZ(lat, lng, zoom) {
  const intZ = Math.max(1, Math.min(17, Math.floor(Number(zoom) || 14)));
  const n = Math.pow(2, intZ);
  const clampedLat = Math.max(-85.0511, Math.min(85.0511, Number(lat) || 0));
  const latRad = (clampedLat * Math.PI) / 180;

  const x = Math.max(0, Math.min(n - 1, Math.floor(((lng + 180) / 360) * n)));
  const y = Math.max(
    0,
    Math.min(
      n - 1,
      Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n)
    )
  );

  return { z: intZ, x, y };
}

/**
 * Pre-warms Esri World Imagery tiles in the browser HTTP cache for a given city's
 * urban core starting view (`defaultZoom`) and regional perimeter view (`minZoom`).
 * Guarantees integer tile Z levels (`Math.floor` and `Math.round`) to avoid 404s.
 */
export function preloadCityTiles(city) {
  if (!city || typeof Image === "undefined") return [];
  const bounds = getCityViewingBounds(city);

  // Deduplicate integer zoom levels for urban core and regional perimeter
  const targetIntegerZooms = Array.from(
    new Set([
      Math.floor(bounds.defaultZoom),
      Math.round(bounds.defaultZoom),
      Math.floor(bounds.minZoom),
      Math.round(bounds.minZoom)
    ])
  ).map((z) => Math.max(1, Math.min(17, z)));

  const queuedUrls = [];

  for (const intZ of targetIntegerZooms) {
    const centerTile = latLngToTileXYZ(city.lat, city.lng, intZ);
    const maxIndex = Math.pow(2, intZ) - 1;

    // Pre-warm 3x3 center grid at each key integer zoom
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tx = Math.max(0, Math.min(maxIndex, centerTile.x + dx));
        const ty = Math.max(0, Math.min(maxIndex, centerTile.y + dy));
        const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${intZ}/${ty}/${tx}`;

        if (!preloadedTileUrls.has(url)) {
          preloadedTileUrls.add(url);
          queuedUrls.push(url);
          const img = new Image();
          img.decoding = "async";
          img.src = url;
        }
      }
    }
  }

  return queuedUrls;
}

/**
 * Simplified world coastline polygons for the built-in fallback interactive map.
 */
const WORLD_COASTLINE_POLYGONS = [
  [
    [70, -165], [71, -155], [68, -135], [60, -120], [60, -95], [62, -78], [52, -56],
    [45, -60], [41, -70], [35, -75], [25, -80], [29, -90], [26, -97], [19, -96],
    [8, -78], [9, -83], [16, -95], [23, -106], [32, -117], [38, -122.5], [48, -124],
    [58, -136], [61, -150], [55, -163], [64, -166]
  ],
  [
    [11, -75], [10, -62], [5, -52], [-1, -48], [-6, -35], [-13, -38], [-23, -43],
    [-34, -53], [-38, -57], [-54, -68], [-53, -73], [-42, -74], [-33, -71.5],
    [-18, -71], [-12, -77], [-5, -81], [2, -79]
  ],
  [
    [36, -9], [43, -9], [44, -1], [48, -4], [51, 2], [54, 8], [57, 8], [55, 12],
    [60, 5], [70, 20], [70, 31], [65, 40], [47, 39], [41, 29], [38, 24], [40, 18],
    [38, 15], [44, 12], [45, 9], [43, 5], [41, 2], [36, -5]
  ],
  [
    [36, -6], [37, 10], [32, 15], [31, 32], [22, 37], [12, 44], [12, 51], [2, 45],
    [-11, 40], [-26, 33], [-34, 25], [-34, 18], [-17, 12], [-6, 12], [4, 9],
    [5, -4], [10, -14], [15, -17], [21, -17], [28, -13]
  ],
  [
    [41, 29], [47, 39], [65, 40], [70, 70], [72, 110], [66, 170], [60, 160],
    [52, 141], [43, 132], [38, 126], [35, 129], [38, 121], [31, 121.5], [22, 114],
    [18, 109], [10, 106], [1, 104], [13, 100.5], [16, 97], [22, 88], [8, 77],
    [19, 73], [25, 67], [25, 56], [13, 45], [28, 34], [31, 32], [36, 36]
  ],
  [
    [31, 130], [34, 135], [35.6, 140], [41, 141], [40, 139], [35, 132]
  ],
  [
    [50, -5], [51, 1], [58, -3], [56, -6], [51, -5]
  ],
  [
    [-12, 131], [-12, 142], [-19, 146], [-28, 153], [-34, 151], [-38, 145],
    [-35, 136], [-32, 125], [-34, 115], [-22, 114], [-15, 124]
  ],
  [
    [-35, 173], [-37, 175], [-41, 175], [-46, 167], [-43, 170], [-38, 174]
  ]
];

/**
 * Creates a custom SVG DivIcon for Leaflet markers.
 */
function createLeafletSvgIcon(L, type, labelText = "") {
  if (type === "guess") {
    return L.divIcon({
      className: "maprature-custom-pin guess-pin-wrapper",
      iconSize: [34, 42],
      iconAnchor: [17, 38],
      html: `
        <div class="pin-marker pin-guess">
          <div class="pin-pulse-ring"></div>
          <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 2C9.268 2 3 8.268 3 16C3 26.25 17 39 17 39C17 39 31 26.25 31 16C31 8.268 24.732 2 17 2Z" fill="#F43F5E" stroke="#0B0F17" stroke-width="2.5"/>
            <circle cx="17" cy="16" r="5.5" fill="#F8FAFC"/>
          </svg>
          ${labelText ? `<span class="pin-floating-label guess-label">${labelText}</span>` : ""}
        </div>
      `
    });
  }

  if (type === "actual") {
    return L.divIcon({
      className: "maprature-custom-pin actual-pin-wrapper",
      iconSize: [36, 44],
      iconAnchor: [18, 40],
      html: `
        <div class="pin-marker pin-actual">
          <div class="pin-pulse-ring actual-pulse"></div>
          <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 2C9.716 2 3 8.716 3 17C3 27.8 18 41 18 41C18 41 33 27.8 33 17C33 8.716 26.284 2 18 2Z" fill="#10B981" stroke="#0B0F17" stroke-width="2.5"/>
            <circle cx="18" cy="17" r="6" fill="#0B0F17"/>
            <circle cx="18" cy="17" r="3" fill="#F8FAFC"/>
          </svg>
          ${labelText ? `<span class="pin-floating-label actual-label">${labelText}</span>` : ""}
        </div>
      `
    });
  }

  return L.divIcon({
    className: "maprature-target-reticle-icon",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `
      <div class="satellite-origin-reticle">
        <span class="reticle-ring"></span>
        <span class="reticle-crosshair"></span>
      </div>
    `
  });
}

/**
 * Fallback Canvas Interactive Map Engine when `window.L` (Leaflet) is unavailable.
 */
class FallbackCanvasMap {
  constructor(container, options = {}) {
    this.container = container;
    this.mode = options.mode || "satellite";
    this.center = { lat: options.center?.[0] || 0, lng: options.center?.[1] || 0 };
    this.zoom = options.zoom ?? 2;
    this.minZoom = options.minZoom ?? 1;
    this.maxZoom = options.maxZoom ?? 16.5;
    this.maxBounds = options.maxBounds || null;
    this.perimeterRadiusMiles = null;
    this.onZoomCallback = options.onZoom || null;
    this.onClickCallback = options.onClick || null;

    this.markers = [];
    this.connectorLine = null;

    this.canvas = document.createElement("canvas");
    this.canvas.className = "fallback-map-canvas";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.display = "block";
    this.container.innerHTML = "";
    this.container.appendChild(this.canvas);

    this.isDragging = false;
    this.dragMoved = false;
    this.dragStart = { x: 0, y: 0, lat: 0, lng: 0 };

    this._bindEvents();
    this.render();
  }

  _bindEvents() {
    this.canvas.addEventListener("pointerdown", (e) => {
      this.isDragging = true;
      this.dragMoved = false;
      this.dragStart = {
        x: e.clientX,
        y: e.clientY,
        lat: this.center.lat,
        lng: this.center.lng
      };
    });

    window.addEventListener("pointermove", (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        this.dragMoved = true;
      }
      const scale = Math.pow(2, this.zoom);
      const degPerPx = 360 / (256 * scale);
      let nextLat = this.dragStart.lat + dy * degPerPx * 0.75;
      let nextLng = this.dragStart.lng - dx * degPerPx;

      nextLat = Math.max(-80, Math.min(80, nextLat));
      if (this.maxBounds) {
        nextLat = Math.max(this.maxBounds.minLat, Math.min(this.maxBounds.maxLat, nextLat));
        nextLng = Math.max(this.maxBounds.minLng, Math.min(this.maxBounds.maxLng, nextLng));
      } else {
        if (nextLng > 180) nextLng -= 360;
        if (nextLng < -180) nextLng += 360;
      }

      this.center = { lat: nextLat, lng: nextLng };
      this.render();
    });

    window.addEventListener("pointerup", (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      if (!this.dragMoved && this.onClickCallback && e.target === this.canvas) {
        const rect = this.canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const coords = this.pixelToLatLng(px, py);
        this.onClickCallback(coords);
      }
    });

    this.canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.5 : -0.5;
        this.setZoom(this.zoom + delta);
      },
      { passive: false }
    );

    window.addEventListener("resize", () => this.render());
  }

  latLngToPixel(lat, lng) {
    const w = this.canvas.width || 800;
    const h = this.canvas.height || 600;
    const scale = Math.pow(2, this.zoom);
    const degPerPx = 360 / (256 * scale);
    const x = w / 2 + (lng - this.center.lng) / degPerPx;
    const y = h / 2 - (lat - this.center.lat) / (degPerPx * 0.8);
    return { x, y };
  }

  pixelToLatLng(x, y) {
    const w = this.canvas.width || 800;
    const h = this.canvas.height || 600;
    const scale = Math.pow(2, this.zoom);
    const degPerPx = 360 / (256 * scale);
    const lng = Math.max(-180, Math.min(180, this.center.lng + (x - w / 2) * degPerPx));
    const lat = Math.max(-82, Math.min(82, this.center.lat - (y - h / 2) * (degPerPx * 0.8)));
    return { lat, lng };
  }

  setView(lat, lng, zoom) {
    this.center = { lat, lng };
    if (typeof zoom === "number") {
      this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, Math.round(zoom * 4) / 4));
    }
    this.render();
    if (this.onZoomCallback) this.onZoomCallback();
  }

  setZoom(zoom) {
    const quantized = Math.round(zoom * 4) / 4;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, quantized));
    this.render();
    if (this.onZoomCallback) this.onZoomCallback();
  }

  getZoom() {
    return this.zoom;
  }

  invalidateSize() {
    this.render();
  }

  render() {
    const rect = this.container.getBoundingClientRect();
    const w = Math.max(300, Math.floor(rect.width || 800));
    const h = Math.max(220, Math.floor(rect.height || 600));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);

    if (this.mode === "satellite") {
      const bg = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) * 0.7);
      bg.addColorStop(0, "#1c2f24");
      bg.addColorStop(0.6, "#14241c");
      bg.addColorStop(1, "#0b1824");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const origin = this.latLngToPixel(
        this.targetOrigin?.lat ?? this.center.lat,
        this.targetOrigin?.lng ?? this.center.lng
      );
      const scaleFactor = Math.pow(2, this.zoom - 13);

      ctx.save();
      ctx.strokeStyle = "#0a2236";
      ctx.lineWidth = Math.max(18, 28 * scaleFactor);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(origin.x - 320 * scaleFactor, origin.y - 190 * scaleFactor);
      ctx.bezierCurveTo(
        origin.x - 60 * scaleFactor,
        origin.y + 40 * scaleFactor,
        origin.x + 80 * scaleFactor,
        origin.y - 50 * scaleFactor,
        origin.x + 340 * scaleFactor,
        origin.y + 180 * scaleFactor
      );
      ctx.stroke();

      const gridSpan = 20;
      const cellPx = 18 * scaleFactor;
      ctx.strokeStyle = "rgba(218, 206, 186, 0.22)";
      ctx.lineWidth = Math.max(0.7, 1.1 * Math.min(2, scaleFactor));

      for (let i = -gridSpan; i <= gridSpan; i++) {
        ctx.beginPath();
        ctx.moveTo(origin.x + i * cellPx, origin.y - gridSpan * cellPx);
        ctx.lineTo(origin.x + i * cellPx, origin.y + gridSpan * cellPx);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(origin.x - gridSpan * cellPx, origin.y + i * cellPx);
        ctx.lineTo(origin.x + gridSpan * cellPx, origin.y + i * cellPx);
        ctx.stroke();
      }

      // Draw dashed R_max perimeter circle if configured
      if (this.perimeterRadiusMiles && this.targetOrigin) {
        const edgeLat = this.targetOrigin.lat + this.perimeterRadiusMiles / 69.0;
        const edgePt = this.latLngToPixel(edgeLat, this.targetOrigin.lng);
        const radiusPx = Math.abs(origin.y - edgePt.y);
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, Math.max(20, radiusPx), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      ctx.fillStyle = "#09111e";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
      ctx.lineWidth = 1;
      for (let lng = -180; lng <= 180; lng += 30) {
        const p = this.latLngToPixel(0, lng);
        ctx.beginPath();
        ctx.moveTo(p.x, 0);
        ctx.lineTo(p.x, h);
        ctx.stroke();
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        const p = this.latLngToPixel(lat, 0);
        ctx.beginPath();
        ctx.moveTo(0, p.y);
        ctx.lineTo(w, p.y);
        ctx.stroke();
      }

      ctx.fillStyle = "#182436";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.lineWidth = 1.2;
      for (const poly of WORLD_COASTLINE_POLYGONS) {
        ctx.beginPath();
        poly.forEach(([lat, lng], idx) => {
          const pt = this.latLngToPixel(lat, lng);
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    if (this.connectorLine) {
      const p1 = this.latLngToPixel(this.connectorLine.from.lat, this.connectorLine.from.lng);
      const p2 = this.latLngToPixel(this.connectorLine.to.lat, this.connectorLine.to.lng);
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.restore();
    }

    for (const m of this.markers) {
      const pt = this.latLngToPixel(m.lat, m.lng);
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = m.type === "actual" ? "#10B981" : "#F43F5E";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#0B0F17";
      ctx.stroke();
      ctx.restore();
    }
  }
}

/**
 * Dual-Map Controller managing:
 * 1. The full-viewport unlabeled Satellite Clue Map (with dynamic metroRadiusMi + 20 mi perimeter & 1.4x padded bounds)
 * 2. The interactive World Guess Map overlay
 */
export class MapController {
  constructor({
    clueContainer,
    guessContainer,
    onTelemetryChange,
    onGuessPinChange
  }) {
    this.clueContainer = clueContainer;
    this.guessContainer = guessContainer;
    this.onTelemetryChange = onTelemetryChange;
    this.onGuessPinChange = onGuessPinChange;

    this.L = typeof window !== "undefined" ? window.L : null;
    this.currentCity = null;
    this.currentCityBounds = null;
    this.clueMap = null;
    this.guessMap = null;

    // Layers on the main viewport map
    this.satelliteTileLayer = null;
    this.summaryComparisonLayer = null;
    this.targetOriginReticle = null;
    this.perimeterCircleLayer = null;
    this.summaryGuessMarker = null;
    this.summaryActualMarker = null;
    this.summaryConnectorLine = null;
    this.isShowingComparisonView = false;

    // Layers on the Guess Map overlay
    this.activeGuessMarker = null;

    // rAF telemetry throttle state
    this._rafTelemetryId = null;

    this._initMaps();
  }

  _initMaps() {
    if (this.L) {
      this._initLeafletMaps();
    } else {
      this._initFallbackMaps();
    }
  }

  _initLeafletMaps() {
    const L = this.L;

    // 1. Initialize Clue Satellite Viewport with fractional zoom (zoomSnap: 0.25, zoomDelta: 0.5)
    // and elastic boundary viscosity (maxBoundsViscosity: 0.88)
    this.clueMap = L.map(this.clueContainer, {
      center: [20, 0],
      zoom: DEFAULT_CLUE_ZOOM,
      minZoom: MIN_CLUE_ZOOM,
      maxZoom: MAX_CLUE_ZOOM,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
      maxBoundsViscosity: 0.88,
      inertia: true,
      inertiaDeceleration: 3200,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true
    });

    // Unlabeled Esri World Imagery satellite layer tuned for zero-blank-edge panning
    this.satelliteTileLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxNativeZoom: 17,
        maxZoom: 18,
        keepBuffer: 6,
        updateWhenIdle: false,
        updateWhenZooming: false
      }
    );

    this.satelliteTileLayer.on("tileerror", (err) => {
      if (!err || !err.tile) return;
      const coords = err.coords || { z: 14, x: 0, y: 0 };
      const stage = Number(err.tile.dataset.fallbackStage || "0");
      if (stage === 0) {
        // Retry 1: Re-request real Esri World_Imagery tile
        err.tile.dataset.fallbackStage = "1";
        err.tile.src = `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${coords.z}/${coords.y}/${coords.x}`;
      } else if (stage === 1) {
        // Retry 2: USGS National Map Orthoimagery (real satellite/aerial photography)
        err.tile.dataset.fallbackStage = "2";
        err.tile.src = `https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/${coords.z}/${coords.y}/${coords.x}`;
      } else if (stage === 2 && !navigator.onLine) {
        err.tile.dataset.fallbackStage = "3";
        err.tile.src = createFallbackTileDataUrl(coords.z, coords.x, coords.y, "satellite");
      }
    });

    this.satelliteTileLayer.addTo(this.clueMap);

    // Clean unlabeled comparison base layer (used during Round Summary comparison view)
    // Uses Esri Canvas/World_Dark_Gray_Base (borders & coastlines only, 100% stripped of text labels)
    this.summaryComparisonLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        maxNativeZoom: 16,
        maxZoom: 18,
        keepBuffer: 4,
        updateWhenIdle: false
      }
    );

    this.summaryComparisonLayer.on("tileerror", (err) => {
      if (!err || !err.tile) return;
      const coords = err.coords || { z: 3, x: 0, y: 0 };
      const stage = Number(err.tile.dataset.fallbackStage || "0");
      if (stage === 0) {
        err.tile.dataset.fallbackStage = "1";
        err.tile.src = `https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${coords.z}/${coords.y}/${coords.x}`;
      } else if (stage === 1) {
        err.tile.dataset.fallbackStage = "2";
        err.tile.src = `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/${coords.z}/${coords.y}/${coords.x}`;
      } else if (stage === 2) {
        err.tile.dataset.fallbackStage = "3";
        err.tile.src = createFallbackTileDataUrl(coords.z, coords.x, coords.y, "world");
      }
    });

    // Separate `zoom` from `move` and gate with requestAnimationFrame
    this.clueMap.on("zoom zoomend", () => {
      this._scheduleTelemetryEmit();
    });

    // 2. Initialize Interactive World Guess Map Overlay
    // Uses Esri Canvas/World_Light_Gray_Base (clean borders, rivers & coastlines with all text labels stripped)
    this.guessMap = L.map(this.guessContainer, {
      center: [20, 10],
      zoom: 2,
      minZoom: 1.5,
      maxZoom: 12,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true
    });

    const guessTiles = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        maxNativeZoom: 16,
        maxZoom: 18,
        keepBuffer: 4,
        updateWhenIdle: false
      }
    );

    guessTiles.on("tileerror", (err) => {
      if (!err || !err.tile) return;
      const coords = err.coords || { z: 2, x: 0, y: 0 };
      const stage = Number(err.tile.dataset.fallbackStage || "0");
      if (stage === 0) {
        // Fallback 1: Secondary Esri mirror for unlabeled Light Gray Base
        err.tile.dataset.fallbackStage = "1";
        err.tile.src = `https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/${coords.z}/${coords.y}/${coords.x}`;
      } else if (stage === 1) {
        // Fallback 2: Esri unlabeled Dark Gray Base
        err.tile.dataset.fallbackStage = "2";
        err.tile.src = `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${coords.z}/${coords.y}/${coords.x}`;
      } else if (stage === 2) {
        // Fallback 3: Offline procedural world continents tile
        err.tile.dataset.fallbackStage = "3";
        err.tile.src = createFallbackTileDataUrl(coords.z, coords.x, coords.y, "world");
      }
    });

    guessTiles.addTo(this.guessMap);

    this.guessMap.on("click", (e) => {
      const wrapped = e.latlng.wrap();
      this.placeGuessPin(wrapped.lat, wrapped.lng);
    });
  }

  _initFallbackMaps() {
    this.clueMap = new FallbackCanvasMap(this.clueContainer, {
      mode: "satellite",
      center: [20, 0],
      zoom: DEFAULT_CLUE_ZOOM,
      minZoom: MIN_CLUE_ZOOM,
      maxZoom: MAX_CLUE_ZOOM,
      onZoom: () => this._scheduleTelemetryEmit()
    });

    this.guessMap = new FallbackCanvasMap(this.guessContainer, {
      mode: "world",
      center: [20, 10],
      zoom: 1.8,
      minZoom: 1,
      maxZoom: 10,
      onClick: ({ lat, lng }) => {
        this.placeGuessPin(lat, lng);
      }
    });
  }

  /**
   * Loads a mystery city onto the Clue Satellite Viewport:
   * - Starts zoomed IN at tight urban core (`defaultZoom = 14.75`, ~1.5 mi radius)
   * - Sets dynamic `minZoom` corresponding to `maxRadiusMiles = city.metroRadiusMi + 20`
   * - Renders dashed visual perimeter ring at `maxRadiusMiles` (`R_max`)
   * - Pads Leaflet `setMaxBounds()` by `1.4x` (`R_max * 1.4`)
   * - Pre-warms integer XYZ tiles for current city and schedules `nextCity` pre-warming via `requestIdleCallback`
   */
  loadRoundCity(city, nextCity = null) {
    this.currentCity = city;
    this.currentCityBounds = getCityViewingBounds(city);
    this.isShowingComparisonView = false;

    const boundsInfo = this.currentCityBounds;

    // Pre-warm current city's integer tiles immediately
    preloadCityTiles(city);

    // Pre-warm Round N+1 tiles during browser idle time
    if (nextCity && typeof window !== "undefined") {
      const scheduleIdle =
        window.requestIdleCallback || ((cb) => setTimeout(cb, 350));
      scheduleIdle(() => {
        preloadCityTiles(nextCity);
      });
    }

    if (this.L && this.clueMap) {
      const L = this.L;
      this.clearSummaryMarkers();

      if (this.clueMap.hasLayer(this.summaryComparisonLayer)) {
        this.clueMap.removeLayer(this.summaryComparisonLayer);
      }
      if (!this.clueMap.hasLayer(this.satelliteTileLayer)) {
        this.satelliteTileLayer.addTo(this.clueMap);
      }

      // Clear previous bounds before repositioning
      this.clueMap.setMaxBounds(null);
      this.clueMap.setMinZoom(boundsInfo.minZoom);
      this.clueMap.setMaxZoom(boundsInfo.maxZoom);

      // Start zoomed IN at urban core (~1.5 mi radius, defaultZoom = 14.75)
      this.clueMap.setView([city.lat, city.lng], boundsInfo.defaultZoom, { animate: false });

      // Apply 1.4x padded bounds to setMaxBounds() so widescreen/mobile aspect ratios
      // don't clamp minZoom and players can center landmarks near the R_max perimeter ring
      const paddedBounds = L.latLngBounds(
        [boundsInfo.paddedMaxBounds.minLat, boundsInfo.paddedMaxBounds.minLng],
        [boundsInfo.paddedMaxBounds.maxLat, boundsInfo.paddedMaxBounds.maxLng]
      );
      this.clueMap.setMaxBounds(paddedBounds);

      // Render dashed visual perimeter ring at exact R_max (metroRadiusMi + 20 mi)
      if (this.perimeterCircleLayer) {
        this.clueMap.removeLayer(this.perimeterCircleLayer);
      }
      this.perimeterCircleLayer = L.circle([city.lat, city.lng], {
        radius: boundsInfo.perimeterRadiusMeters,
        color: "#38BDF8",
        weight: 1.5,
        opacity: 0.45,
        fill: false,
        dashArray: "8, 8",
        interactive: false
      }).addTo(this.clueMap);

      // Subtle origin reticle at the exact city center
      if (this.targetOriginReticle) {
        this.clueMap.removeLayer(this.targetOriginReticle);
      }
      this.targetOriginReticle = L.marker([city.lat, city.lng], {
        icon: createLeafletSvgIcon(L, "origin"),
        interactive: false,
        keyboard: false
      }).addTo(this.clueMap);

      // Reset Guess Map
      if (this.activeGuessMarker) {
        this.guessMap.removeLayer(this.activeGuessMarker);
        this.activeGuessMarker = null;
      }
      this.guessMap.setView([20, 10], 2, { animate: false });
    } else if (this.clueMap) {
      this.clueMap.mode = "satellite";
      this.clueMap.targetOrigin = { lat: city.lat, lng: city.lng };
      this.clueMap.minZoom = boundsInfo.minZoom;
      this.clueMap.maxZoom = boundsInfo.maxZoom;
      this.clueMap.perimeterRadiusMiles = boundsInfo.maxRadiusMiles;
      this.clueMap.maxBounds = boundsInfo.paddedMaxBounds;
      this.clueMap.markers = [];
      this.clueMap.connectorLine = null;
      this.clueMap.setView(city.lat, city.lng, boundsInfo.defaultZoom);

      this.guessMap.markers = [];
      this.guessMap.setView(20, 10, 1.8);
    }

    this._emitTelemetry();
  }

  /**
   * Places or moves the player's Guess Pin on the Guess Map.
   */
  placeGuessPin(lat, lng) {
    const clampedLat = Math.max(-84, Math.min(84, Number(lat)));
    const clampedLng = ((((Number(lng) + 180) % 360) + 360) % 360) - 180;

    if (this.L && this.guessMap) {
      const L = this.L;
      if (!this.activeGuessMarker) {
        this.activeGuessMarker = L.marker([clampedLat, clampedLng], {
          icon: createLeafletSvgIcon(L, "guess"),
          draggable: true
        }).addTo(this.guessMap);

        this.activeGuessMarker.on("dragend", () => {
          const pos = this.activeGuessMarker.getLatLng().wrap();
          if (this.onGuessPinChange) {
            this.onGuessPinChange({ lat: pos.lat, lng: pos.lng });
          }
        });
      } else {
        this.activeGuessMarker.setLatLng([clampedLat, clampedLng]);
      }
    } else if (this.guessMap) {
      this.guessMap.markers = [{ lat: clampedLat, lng: clampedLng, type: "guess" }];
      this.guessMap.render();
    }

    if (this.onGuessPinChange) {
      this.onGuessPinChange({ lat: clampedLat, lng: clampedLng });
    }
  }

  /**
   * Zooms the Clue Map in or out by a fractional step within dynamic city bounds.
   */
  zoomClueBy(delta = 0.5) {
    if (!this.clueMap) return;
    const minZ = this.currentCityBounds?.minZoom ?? MIN_CLUE_ZOOM;
    const maxZ = this.currentCityBounds?.maxZoom ?? MAX_CLUE_ZOOM;
    const nextZoom = Math.max(
      minZ,
      Math.min(maxZ, Math.round((this.clueMap.getZoom() + delta) * 4) / 4)
    );
    this.clueMap.setZoom(nextZoom);
  }

  /**
   * Sets the Clue Map zoom directly from a normalized slider or preset (quantized to 0.25).
   */
  setClueZoom(zoom) {
    if (!this.clueMap) return;
    const minZ = this.currentCityBounds?.minZoom ?? MIN_CLUE_ZOOM;
    const maxZ = this.currentCityBounds?.maxZoom ?? MAX_CLUE_ZOOM;
    const quantized = Math.round(zoom * 4) / 4;
    const clamped = Math.max(minZ, Math.min(maxZ, quantized));
    this.clueMap.setZoom(clamped);
  }

  /**
   * Zooms the Guess Map in or out.
   */
  zoomGuessBy(delta) {
    if (!this.guessMap) return;
    this.guessMap.setZoom(this.guessMap.getZoom() + delta);
  }

  /**
   * Recenters the Clue Satellite Map back on the mystery city urban core.
   */
  recenterClueMap() {
    if (!this.currentCity || !this.clueMap) return;
    if (this.isShowingComparisonView) {
      this.setSummaryMapMode("satellite");
      return;
    }
    const targetZoom = this.currentCityBounds?.defaultZoom ?? DEFAULT_CLUE_ZOOM;
    if (this.L) {
      this.clueMap.flyTo([this.currentCity.lat, this.currentCity.lng], targetZoom, {
        duration: 0.55
      });
    } else {
      this.clueMap.setView(this.currentCity.lat, this.currentCity.lng, targetZoom);
    }
  }

  /**
   * Displays the Round Summary comparison view:
   * - Actual Pin (#10B981) vs. Guessed Pin (#F43F5E)
   * - Dashed telemetry geodesic line connecting the two pins
   */
  showRoundSummaryComparison({ guessLat, guessLng, actualCity }) {
    this.isShowingComparisonView = true;

    if (this.L && this.clueMap) {
      const L = this.L;
      this.clearSummaryMarkers();

      this.clueMap.setMaxBounds(null);
      this.clueMap.setMinZoom(1.5);
      this.clueMap.setMaxZoom(16.5);

      if (this.clueMap.hasLayer(this.satelliteTileLayer)) {
        this.clueMap.removeLayer(this.satelliteTileLayer);
      }
      if (!this.clueMap.hasLayer(this.summaryComparisonLayer)) {
        this.summaryComparisonLayer.addTo(this.clueMap);
      }

      this.summaryGuessMarker = L.marker([guessLat, guessLng], {
        icon: createLeafletSvgIcon(L, "guess", "YOUR GUESS")
      }).addTo(this.clueMap);

      this.summaryActualMarker = L.marker([actualCity.lat, actualCity.lng], {
        icon: createLeafletSvgIcon(L, "actual", `${actualCity.name.toUpperCase()}`)
      }).addTo(this.clueMap);

      // Subtle emerald ring showing the 100% Accuracy City Area (metroRadiusMi)
      const cityAreaRadiusMeters = (Number(actualCity.metroRadiusMi) || 10) * 1609.344;
      this.summaryCityZoneCircle = L.circle([actualCity.lat, actualCity.lng], {
        radius: cityAreaRadiusMeters,
        color: "#10B981",
        weight: 1.5,
        opacity: 0.55,
        fillColor: "#10B981",
        fillOpacity: 0.08,
        dashArray: "4, 6",
        interactive: false
      }).addTo(this.clueMap);

      this.summaryConnectorLine = L.polyline(
        [
          [guessLat, guessLng],
          [actualCity.lat, actualCity.lng]
        ],
        {
          color: "#38BDF8",
          weight: 2.5,
          opacity: 0.9,
          dashArray: "8, 8"
        }
      ).addTo(this.clueMap);

      const bounds = L.latLngBounds([
        [guessLat, guessLng],
        [actualCity.lat, actualCity.lng]
      ]);

      this.clueMap.fitBounds(bounds, {
        paddingTopLeft: [80, 90],
        paddingBottomRight: [80, 250],
        maxZoom: 10,
        animate: true,
        duration: 0.75
      });
    } else if (this.clueMap) {
      this.clueMap.mode = "world";
      this.clueMap.maxBounds = null;
      this.clueMap.minZoom = 1;
      this.clueMap.maxZoom = 16.5;
      this.clueMap.markers = [
        { lat: guessLat, lng: guessLng, type: "guess" },
        { lat: actualCity.lat, lng: actualCity.lng, type: "actual" }
      ];
      this.clueMap.connectorLine = {
        from: { lat: guessLat, lng: guessLng },
        to: { lat: actualCity.lat, lng: actualCity.lng }
      };
      const midLat = (guessLat + actualCity.lat) / 2;
      const midLng = (guessLng + actualCity.lng) / 2;
      const span = Math.max(
        Math.abs(guessLat - actualCity.lat),
        Math.abs(guessLng - actualCity.lng)
      );
      const fitZoom = span > 80 ? 2 : span > 35 ? 3 : span > 12 ? 4.5 : 7;
      this.clueMap.setView(midLat, midLng, fitZoom);
    }
  }

  /**
   * Allows toggling between the World Pin Comparison View and the Target Satellite View during Round Summary.
   */
  setSummaryMapMode(mode = "comparison") {
    if (!this.currentCity || !this.clueMap) return;

    if (mode === "satellite") {
      this.isShowingComparisonView = false;
      const boundsInfo = this.currentCityBounds || getCityViewingBounds(this.currentCity);
      const targetZoom = boundsInfo.defaultZoom ?? DEFAULT_CLUE_ZOOM;
      if (this.L) {
        const L = this.L;
        if (this.clueMap.hasLayer(this.summaryComparisonLayer)) {
          this.clueMap.removeLayer(this.summaryComparisonLayer);
        }
        if (!this.clueMap.hasLayer(this.satelliteTileLayer)) {
          this.satelliteTileLayer.addTo(this.clueMap);
        }
        this.clueMap.setMinZoom(boundsInfo.minZoom);
        this.clueMap.setMaxZoom(boundsInfo.maxZoom);
        const paddedBounds = L.latLngBounds(
          [boundsInfo.paddedMaxBounds.minLat, boundsInfo.paddedMaxBounds.minLng],
          [boundsInfo.paddedMaxBounds.maxLat, boundsInfo.paddedMaxBounds.maxLng]
        );
        this.clueMap.setMaxBounds(paddedBounds);
        this.clueMap.flyTo([this.currentCity.lat, this.currentCity.lng], targetZoom, {
          duration: 0.65
        });
      } else {
        this.clueMap.mode = "satellite";
        this.clueMap.minZoom = boundsInfo.minZoom;
        this.clueMap.maxZoom = boundsInfo.maxZoom;
        this.clueMap.maxBounds = boundsInfo.paddedMaxBounds;
        this.clueMap.setView(this.currentCity.lat, this.currentCity.lng, targetZoom);
      }
    } else if (this.lastComparisonCoords) {
      this.showRoundSummaryComparison(this.lastComparisonCoords);
    }
  }

  clearSummaryMarkers() {
    if (!this.L || !this.clueMap) return;
    if (this.summaryGuessMarker) {
      this.clueMap.removeLayer(this.summaryGuessMarker);
      this.summaryGuessMarker = null;
    }
    if (this.summaryActualMarker) {
      this.clueMap.removeLayer(this.summaryActualMarker);
      this.summaryActualMarker = null;
    }
    if (this.summaryConnectorLine) {
      this.clueMap.removeLayer(this.summaryConnectorLine);
      this.summaryConnectorLine = null;
    }
    if (this.summaryCityZoneCircle) {
      this.clueMap.removeLayer(this.summaryCityZoneCircle);
      this.summaryCityZoneCircle = null;
    }
  }

  invalidateGuessMapSize() {
    if (!this.guessMap) return;
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => this.guessMap.invalidateSize());
    }
    setTimeout(() => {
      this.guessMap.invalidateSize();
    }, 100);
    setTimeout(() => {
      this.guessMap.invalidateSize();
    }, 260);
  }

  /**
   * Schedules a single telemetry update on the next animation frame.
   */
  _scheduleTelemetryEmit() {
    if (this._rafTelemetryId !== null) return;
    if (typeof requestAnimationFrame === "function") {
      this._rafTelemetryId = requestAnimationFrame(() => {
        this._rafTelemetryId = null;
        this._emitTelemetry();
      });
    } else {
      this._emitTelemetry();
    }
  }

  _emitTelemetry() {
    if (!this.clueMap || !this.onTelemetryChange) return;
    const zoom = this.clueMap.getZoom();
    const telemetry = zoomToRadiusTelemetry(zoom, this.currentCityBounds);
    this.onTelemetryChange(telemetry);
  }
}
