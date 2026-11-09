/**
 * Curated database of satellite-recognizable world cities for daily rounds
 * plus an extended global cities index for the Under-90% City Name Bonus autocomplete.
 *
 * Each daily mystery city includes `metroRadiusMi` (estimated metropolitan radius in miles, 6–25 mi).
 * The allowed reconnaissance radius is `maxRadiusMiles = city.metroRadiusMi + 20` (26–45 mi),
 * corresponding to `maxAreaSqMi = Math.PI * (maxRadiusMiles ** 2)`.
 */

export const DAILY_MYSTERY_CITIES = [
  {
    id: "venice-it",
    name: "Venice",
    country: "Italy",
    continent: "Europe",
    lat: 45.4371,
    lng: 12.3326,
    metroRadiusMi: 8,
    aliases: ["venezia"],
    signature: "Crescent-shaped barrier islands and the S-curve of the Grand Canal inside the Venetian Lagoon."
  },
  {
    id: "cairo-eg",
    name: "Cairo",
    country: "Egypt",
    continent: "Africa",
    lat: 30.0444,
    lng: 31.2357,
    metroRadiusMi: 18,
    aliases: ["al-qahirah", "el cairo"],
    signature: "Dense urban fabric straddling the Nile just south of where the emerald Nile Delta fans out into the desert."
  },
  {
    id: "rio-br",
    name: "Rio de Janeiro",
    country: "Brazil",
    continent: "South America",
    lat: -22.9068,
    lng: -43.1729,
    metroRadiusMi: 16,
    aliases: ["rio"],
    signature: "Granite peaks, Rodrigo de Freitas Lagoon, and sweeping Atlantic beaches flanking the entrance to Guanabara Bay."
  },
  {
    id: "dubai-ae",
    name: "Dubai",
    country: "United Arab Emirates",
    continent: "Asia",
    lat: 25.2048,
    lng: 55.2708,
    metroRadiusMi: 15,
    aliases: ["dubayy"],
    signature: "Artificial palm-shaped archipelagos jutting into the turquoise Persian Gulf along a linear desert coast."
  },
  {
    id: "san-francisco-us",
    name: "San Francisco",
    country: "United States",
    continent: "North America",
    lat: 37.7749,
    lng: -122.4194,
    metroRadiusMi: 12,
    aliases: ["sf", "frisco"],
    signature: "Orthogonal street grid on a steep peninsula guarding the narrow Golden Gate strait and San Francisco Bay."
  },
  {
    id: "sydney-au",
    name: "Sydney",
    country: "Australia",
    continent: "Oceania",
    lat: -33.8688,
    lng: 151.2093,
    metroRadiusMi: 18,
    aliases: [],
    signature: "Deeply indented drowned-river valley of Port Jackson with coastal headlands and golden Tasman Sea beaches."
  },
  {
    id: "barcelona-es",
    name: "Barcelona",
    country: "Spain",
    continent: "Europe",
    lat: 41.3874,
    lng: 2.1686,
    metroRadiusMi: 11,
    aliases: ["bcn"],
    signature: "Cerdà's iconic chamfered octagonal blocks in the Eixample district wedged between Collserola ridge and the Mediterranean."
  },
  {
    id: "brasilia-br",
    name: "Brasília",
    country: "Brazil",
    continent: "South America",
    lat: -15.7975,
    lng: -47.8919,
    metroRadiusMi: 13,
    aliases: ["brasilia"],
    signature: "Lúcio Costa's monumental airplane-shaped Plano Piloto embraced by the artificial arms of Paranoá Lake."
  },
  {
    id: "amsterdam-nl",
    name: "Amsterdam",
    country: "Netherlands",
    continent: "Europe",
    lat: 52.3676,
    lng: 4.9041,
    metroRadiusMi: 10,
    aliases: [],
    signature: "Concentric half-moon 17th-century canal rings opening onto the IJ waterfront and reclaimed polder lands."
  },
  {
    id: "tokyo-jp",
    name: "Tokyo",
    country: "Japan",
    continent: "Asia",
    lat: 35.6762,
    lng: 139.6503,
    metroRadiusMi: 25,
    aliases: ["tokio"],
    signature: "Forested Imperial Palace moat at the heart of the Kanto metropolis wrapping around geometric reclaimed islands in Tokyo Bay."
  },
  {
    id: "istanbul-tr",
    name: "Istanbul",
    country: "Turkey",
    continent: "Europe",
    lat: 41.0082,
    lng: 28.9784,
    metroRadiusMi: 19,
    aliases: ["constantinople"],
    signature: "The winding Bosphorus Strait bisecting two continents between the Sea of Marmara and the Black Sea, plus the Golden Horn inlet."
  },
  {
    id: "new-orleans-us",
    name: "New Orleans",
    country: "United States",
    continent: "North America",
    lat: 29.9511,
    lng: -90.0715,
    metroRadiusMi: 11,
    aliases: ["nola"],
    signature: "Crescent bend of the Mississippi River nestled beneath the vast oval expanse of Lake Pontchartrain."
  },
  {
    id: "cape-town-za",
    name: "Cape Town",
    country: "South Africa",
    continent: "Africa",
    lat: -33.9249,
    lng: 18.4241,
    metroRadiusMi: 13,
    aliases: ["kaapstad"],
    signature: "City Bowl cradled beneath the flat plateau of Table Mountain at the northern end of the rocky Cape Peninsula."
  },
  {
    id: "hong-kong-cn",
    name: "Hong Kong",
    country: "China",
    continent: "Asia",
    lat: 22.3193,
    lng: 114.1694,
    metroRadiusMi: 12,
    aliases: ["hk", "xianggang"],
    signature: "Ultra-dense high-rise corridors hugging narrow coastal strips between emerald mountain peaks and Victoria Harbour."
  },
  {
    id: "vancouver-ca",
    name: "Vancouver",
    country: "Canada",
    continent: "North America",
    lat: 49.2827,
    lng: -123.1207,
    metroRadiusMi: 13,
    aliases: [],
    signature: "Forested Stanley Park peninsula jutting into Burrard Inlet with the Fraser River delta to the south and Coast Mountains to the north."
  },
  {
    id: "copenhagen-dk",
    name: "Copenhagen",
    country: "Denmark",
    continent: "Europe",
    lat: 55.6761,
    lng: 12.5683,
    metroRadiusMi: 10,
    aliases: ["kobenhavn", "københavn"],
    signature: "Star-shaped Kastellet fortress, linear lakes, and the Øresund Bridge-Tunnel stretching across the strait to Sweden."
  },
  {
    id: "mumbai-in",
    name: "Mumbai",
    country: "India",
    continent: "Asia",
    lat: 19.0760,
    lng: 72.8777,
    metroRadiusMi: 17,
    aliases: ["bombay"],
    signature: "Slender south-pointing claw peninsula enclosing Thane Creek and Back Bay along the Arabian Sea."
  },
  {
    id: "buenos-aires-ar",
    name: "Buenos Aires",
    country: "Argentina",
    continent: "South America",
    lat: -34.6037,
    lng: -58.3816,
    metroRadiusMi: 20,
    aliases: ["caba"],
    signature: "Massive radial-and-grid metropolis facing the sediment-rich, rust-colored estuary of the Río de la Plata."
  },
  {
    id: "lisbon-pt",
    name: "Lisbon",
    country: "Portugal",
    continent: "Europe",
    lat: 38.7223,
    lng: -9.1393,
    metroRadiusMi: 11,
    aliases: ["lisboa"],
    signature: "Hilly terracotta city perched on the northern narrows of the vast inland Mar da Palha basin of the Tagus estuary."
  },
  {
    id: "singapore-sg",
    name: "Singapore",
    country: "Singapore",
    continent: "Asia",
    lat: 1.3521,
    lng: 103.8198,
    metroRadiusMi: 12,
    aliases: ["sg"],
    signature: "Diamond-shaped island city-state ringed by container terminals, Changi reclaimed land, and hundreds of anchored ships in the Singapore Strait."
  },
  {
    id: "manhattan-ny-us",
    name: "New York City",
    country: "United States",
    continent: "North America",
    lat: 40.7128,
    lng: -74.0060,
    metroRadiusMi: 22,
    aliases: ["new york", "nyc", "manhattan"],
    signature: "Unmistakable rectangle of Central Park embedded within Manhattan Island between the Hudson and East rivers."
  },
  {
    id: "paris-fr",
    name: "Paris",
    country: "France",
    continent: "Europe",
    lat: 48.8566,
    lng: 2.3522,
    metroRadiusMi: 15,
    aliases: [],
    signature: "Meandering loop of the Seine through a compact limestone basin framed by Bois de Boulogne and Bois de Vincennes."
  },
  {
    id: "seoul-kr",
    name: "Seoul",
    country: "South Korea",
    continent: "Asia",
    lat: 37.5665,
    lng: 126.9780,
    metroRadiusMi: 19,
    aliases: [],
    signature: "Wide Han River spanned by dozens of bridges winding between wooded granite mountains and high-density apartment districts."
  },
  {
    id: "mexico-city-mx",
    name: "Mexico City",
    country: "Mexico",
    continent: "North America",
    lat: 19.4326,
    lng: -99.1332,
    metroRadiusMi: 21,
    aliases: ["cdmx", "ciudad de mexico"],
    signature: "Sprawling high-altitude megacity filling the ancient endorheic Valley of Mexico basin surrounded by volcanic peaks."
  },
  {
    id: "stockholm-se",
    name: "Stockholm",
    country: "Sweden",
    continent: "Europe",
    lat: 59.3293,
    lng: 18.0686,
    metroRadiusMi: 11,
    aliases: [],
    signature: "Fourteen islands where Lake Mälaren drains into the glacially carved maze of the Baltic Stockholm Archipelago."
  },
  {
    id: "dakar-sn",
    name: "Dakar",
    country: "Senegal",
    continent: "Africa",
    lat: 14.7167,
    lng: -17.4677,
    metroRadiusMi: 9,
    aliases: [],
    signature: "Hook-shaped Cap-Vert peninsula — the westernmost point of continental Africa — jutting sharply into the Atlantic."
  },
  {
    id: "auckland-nz",
    name: "Auckland",
    country: "New Zealand",
    continent: "Oceania",
    lat: -36.8485,
    lng: 174.7633,
    metroRadiusMi: 12,
    aliases: ["tamaki makaurau"],
    signature: "Narrow volcanic isthmus pinched between Waitematā Harbour and Manukau Harbour, guarded by circular Rangitoto Island."
  },
  {
    id: "st-petersburg-ru",
    name: "Saint Petersburg",
    country: "Russia",
    continent: "Europe",
    lat: 59.9343,
    lng: 30.3351,
    metroRadiusMi: 15,
    aliases: ["st petersburg", "st. petersburg", "petersburg", "leningrad"],
    signature: "Neva River delta islands emptying into the shallow eastern head of the Gulf of Finland."
  },
  {
    id: "montreal-ca",
    name: "Montreal",
    country: "Canada",
    continent: "North America",
    lat: 45.5017,
    lng: -73.5673,
    metroRadiusMi: 14,
    aliases: ["montréal"],
    signature: "Crescent-shaped river island at the confluence of the Saint Lawrence and Ottawa rivers with forested Mount Royal at its center."
  },
  {
    id: "athens-gr",
    name: "Athens",
    country: "Greece",
    continent: "Europe",
    lat: 37.9838,
    lng: 23.7275,
    metroRadiusMi: 12,
    aliases: ["athina"],
    signature: "Sun-bleached marble-white urban basin ringed by four mountains and opening southwest to Piraeus port and the Saronic Gulf."
  },
  {
    id: "lagos-ng",
    name: "Lagos",
    country: "Nigeria",
    continent: "Africa",
    lat: 6.5244,
    lng: 3.3792,
    metroRadiusMi: 17,
    aliases: [],
    signature: "Barrier beaches and coastal Lagos Lagoon separated from the Gulf of Guinea by Victoria Island and the Third Mainland Bridge."
  },
  {
    id: "bangkok-th",
    name: "Bangkok",
    country: "Thailand",
    continent: "Asia",
    lat: 13.7563,
    lng: 100.5018,
    metroRadiusMi: 19,
    aliases: ["krung thep"],
    signature: "Dramatic oxbow-like loops of the Chao Phraya River enclosing the green lung of Bang Kachao just north of the Gulf of Thailand."
  },
  {
    id: "chicago-us",
    name: "Chicago",
    country: "United States",
    continent: "North America",
    lat: 41.8781,
    lng: -87.6298,
    metroRadiusMi: 18,
    aliases: [],
    signature: "Relentless midwestern street grid and diagonal avenues meeting the sculpted parks and piers along the southwest shore of Lake Michigan."
  },
  {
    id: "lima-pe",
    name: "Lima",
    country: "Peru",
    continent: "South America",
    lat: -12.0464,
    lng: -77.0428,
    metroRadiusMi: 16,
    aliases: [],
    signature: "Hyper-arid coastal desert metropolis clinging to Pacific sea cliffs and creeping into the dry Andean foothills."
  },
  {
    id: "canberra-au",
    name: "Canberra",
    country: "Australia",
    continent: "Oceania",
    lat: -35.2809,
    lng: 149.1300,
    metroRadiusMi: 9,
    aliases: [],
    signature: "Walter Burley Griffin's geometric garden city of concentric hexagonal and circular avenues centered on Lake Burley Griffin."
  },
  {
    id: "valletta-mt",
    name: "Valletta",
    country: "Malta",
    continent: "Europe",
    lat: 35.8989,
    lng: 14.5146,
    metroRadiusMi: 6,
    aliases: [],
    signature: "Fortified limestone peninsula flanked by the finger-like inlets of Grand Harbour and Marsamxett Harbour in the central Mediterranean."
  },
  {
    id: "seattle-us",
    name: "Seattle",
    country: "United States",
    continent: "North America",
    lat: 47.6062,
    lng: -122.3321,
    metroRadiusMi: 13,
    aliases: [],
    signature: "Glacially sculpted hourglass isthmus wedged between the deep fjords of Puget Sound and freshwater Lake Washington."
  },
  {
    id: "osaka-jp",
    name: "Osaka",
    country: "Japan",
    continent: "Asia",
    lat: 34.6937,
    lng: 135.5023,
    metroRadiusMi: 17,
    aliases: [],
    signature: "Channelized river delta and rectangular artificial islands (including Kansai Airport offshore) lining the curve of Osaka Bay."
  },
  {
    id: "havana-cu",
    name: "Havana",
    country: "Cuba",
    continent: "North America",
    lat: 23.1136,
    lng: -82.3666,
    metroRadiusMi: 10,
    aliases: ["la habana"],
    signature: "Pouch-shaped natural harbor entered through a narrow fortified channel along the northern Caribbean coast."
  },
  {
    id: "geneva-ch",
    name: "Geneva",
    country: "Switzerland",
    continent: "Europe",
    lat: 46.2044,
    lng: 6.1432,
    metroRadiusMi: 7,
    aliases: ["geneve", "genève", "genf"],
    signature: "Tapered southwestern tip of crescent-shaped Lake Geneva where the Rhône exits between the Jura and the Alps."
  },
  {
    id: "taipei-tw",
    name: "Taipei",
    country: "Taiwan",
    continent: "Asia",
    lat: 25.0330,
    lng: 121.5654,
    metroRadiusMi: 13,
    aliases: [],
    signature: "Triangular alluvial basin laced by the Tamsui and Keelung rivers and hemmed in by lush emerald volcanic mountains."
  },
  {
    id: "santiago-cl",
    name: "Santiago",
    country: "Chile",
    continent: "South America",
    lat: -33.4489,
    lng: -70.6693,
    metroRadiusMi: 16,
    aliases: ["santiago de chile"],
    signature: "Vast circular basin floor abutting the snow-capped wall of the Andes Mountains to the east."
  },
  {
    id: "budapest-hu",
    name: "Budapest",
    country: "Hungary",
    continent: "Europe",
    lat: 47.4979,
    lng: 19.0402,
    metroRadiusMi: 12,
    aliases: [],
    signature: "North-to-south sweep of the Danube slicing between hilly Buda and concentric ring boulevards of flat Pest, embracing Margaret Island."
  },
  {
    id: "miami-us",
    name: "Miami",
    country: "United States",
    continent: "North America",
    lat: 25.7617,
    lng: -80.1918,
    metroRadiusMi: 15,
    aliases: [],
    signature: "Slender barrier islands of Miami Beach, Venetian causeways across Biscayne Bay, and the sharp western border against the Everglades."
  },
  {
    id: "doha-qa",
    name: "Doha",
    country: "Qatar",
    continent: "Asia",
    lat: 25.2854,
    lng: 51.5310,
    metroRadiusMi: 10,
    aliases: ["ad-dawhah"],
    signature: "Semicircular Corniche bay and the circular lagoons of The Pearl artificial island on the eastern coast of the Qatari Peninsula."
  },
  {
    id: "dublin-ie",
    name: "Dublin",
    country: "Ireland",
    continent: "Europe",
    lat: 53.3498,
    lng: -6.2603,
    metroRadiusMi: 10,
    aliases: ["baile atha cliath"],
    signature: "River Liffey bisecting the city into Dublin Bay, bookended by the rocky Howth Peninsula and vast green Phoenix Park."
  },
  {
    id: "shanghai-cn",
    name: "Shanghai",
    country: "China",
    continent: "Asia",
    lat: 31.2304,
    lng: 121.4737,
    metroRadiusMi: 24,
    aliases: [],
    signature: "S-bend of the Huangpu River around Lujiazui on the flat Yangtze River delta peninsula beside Chongming Island."
  },
  {
    id: "boston-us",
    name: "Boston",
    country: "United States",
    continent: "North America",
    lat: 42.3601,
    lng: -71.0589,
    metroRadiusMi: 14,
    aliases: [],
    signature: "Charles River basin meeting an island-studded harbor with Logan Airport's intersecting runways built right on the water."
  },
  {
    id: "cartagena-co",
    name: "Cartagena",
    country: "Colombia",
    continent: "South America",
    lat: 10.3910,
    lng: -75.4794,
    metroRadiusMi: 8,
    aliases: ["cartagena de indias"],
    signature: "High-rise Bocagrande spit and historic walled city enclosing a complex Caribbean lagoon system."
  },
  {
    id: "perth-au",
    name: "Perth",
    country: "Australia",
    continent: "Oceania",
    lat: -31.9505,
    lng: 115.8605,
    metroRadiusMi: 14,
    aliases: [],
    signature: "Broad estuary of the Swan River winding through coastal sand plains between the Darling Scarp and the Indian Ocean."
  }
];

export const METRO_RADIUS_BUFFER_MI = 20;
export const MIN_STREET_RADIUS_MI = 0.4; // ~0.5 sq mi tight street-level view at maxZoom 16.5
export const DEFAULT_CORE_RADIUS_MI = 1.5; // ~7.1 sq mi tight urban core starting view
export const MAX_STREET_ZOOM = 16.5;
export const DEFAULT_URBAN_CORE_ZOOM = 14.75;
export const MAX_BOUNDS_PAD_FACTOR = 1.4;

/**
 * Computes the dynamic viewing radius, area cap, fractional zoom bounds,
 * visual perimeter bounds (R_max), and 1.4x padded Leaflet maxBounds for a city.
 *
 * - maxRadiusMiles = city.metroRadiusMi + 20 (26–45 mi)
 * - maxAreaSqMi = Math.PI * (maxRadiusMiles ** 2)
 * - defaultZoom = 14.75 (~1.5 mi urban core starting radius)
 */
export function getCityViewingBounds(city) {
  const metroRadiusMi = Math.max(4, Number(city?.metroRadiusMi) || 12);
  const maxRadiusMiles = metroRadiusMi + METRO_RADIUS_BUFFER_MI;
  const minRadiusMiles = MIN_STREET_RADIUS_MI;

  const maxAreaSqMi = Math.round(Math.PI * Math.pow(maxRadiusMiles, 2) * 10) / 10;
  const minAreaSqMi = Math.round(Math.PI * Math.pow(minRadiusMiles, 2) * 10) / 10;

  // Web Mercator relationship: R(z) = minRadiusMiles * 2^(MAX_STREET_ZOOM - z)
  // Solve for minZoom where R(minZoom) = maxRadiusMiles, quantized to 0.25 steps
  const rawMinZoom = MAX_STREET_ZOOM - Math.log2(maxRadiusMiles / minRadiusMiles);
  const minZoom = Math.max(8.5, Math.min(12.5, Math.round(rawMinZoom * 4) / 4));
  const maxZoom = MAX_STREET_ZOOM;
  const defaultZoom = DEFAULT_URBAN_CORE_ZOOM;

  const lat = Number(city?.lat) || 0;
  const lng = Number(city?.lng) || 0;
  const cosLat = Math.max(0.2, Math.cos((lat * Math.PI) / 180));

  // 1 deg latitude ≈ 69.0 miles
  const perimeterLatDelta = maxRadiusMiles / 69.0;
  const perimeterLngDelta = maxRadiusMiles / (69.0 * cosLat);

  // 1.4x padded bounds for Leaflet setMaxBounds() so widescreen/mobile aspect ratios
  // don't clamp minZoom and players can center their camera on landmarks near the R_max ring
  const paddedLatDelta = perimeterLatDelta * MAX_BOUNDS_PAD_FACTOR;
  const paddedLngDelta = perimeterLngDelta * MAX_BOUNDS_PAD_FACTOR;

  return {
    metroRadiusMi,
    maxRadiusMiles,
    minRadiusMiles,
    defaultRadiusMiles: DEFAULT_CORE_RADIUS_MI,
    maxAreaSqMi,
    minAreaSqMi,
    minZoom,
    maxZoom,
    defaultZoom,
    perimeterRadiusMeters: maxRadiusMiles * 1609.344,
    perimeterBounds: {
      minLat: lat - perimeterLatDelta,
      maxLat: lat + perimeterLatDelta,
      minLng: lng - perimeterLngDelta,
      maxLng: lng + perimeterLngDelta
    },
    paddedMaxBounds: {
      minLat: lat - paddedLatDelta,
      maxLat: lat + paddedLatDelta,
      minLng: lng - paddedLngDelta,
      maxLng: lng + paddedLngDelta
    }
  };
}

/**
 * Extended global cities list for realistic autocomplete during the Under-90% City Name Bonus.
 */
const EXTRA_WORLD_CITIES = [
  { name: "Abidjan", country: "Côte d'Ivoire" },
  { name: "Abu Dhabi", country: "United Arab Emirates" },
  { name: "Abuja", country: "Nigeria" },
  { name: "Accra", country: "Ghana" },
  { name: "Addis Ababa", country: "Ethiopia" },
  { name: "Adelaide", country: "Australia" },
  { name: "Ahmedabad", country: "India" },
  { name: "Alexandria", country: "Egypt" },
  { name: "Algiers", country: "Algeria" },
  { name: "Almaty", country: "Kazakhstan" },
  { name: "Amman", country: "Jordan" },
  { name: "Anchorage", country: "United States" },
  { name: "Ankara", country: "Turkey" },
  { name: "Antananarivo", country: "Madagascar" },
  { name: "Antwerp", country: "Belgium" },
  { name: "ashgabat", nameDisplay: "Ashgabat", country: "Turkmenistan" },
  { name: "Asunción", country: "Paraguay", aliases: ["asuncion"] },
  { name: "Astana", country: "Kazakhstan", aliases: ["nur-sultan"] },
  { name: "Atlanta", country: "United States" },
  { name: "Austin", country: "United States" },
  { name: "Baghdad", country: "Iraq" },
  { name: "Baku", country: "Azerbaijan" },
  { name: "Baltimore", country: "United States" },
  { name: "Bamako", country: "Mali" },
  { name: "Bengaluru", country: "India", aliases: ["bangalore"] },
  { name: "Barranquilla", country: "Colombia" },
  { name: "Basel", country: "Switzerland" },
  { name: "Beijing", country: "China", aliases: ["peking"] },
  { name: "Beirut", country: "Lebanon" },
  { name: "Belfast", country: "United Kingdom" },
  { name: "Belgrade", country: "Serbia" },
  { name: "Belo Horizonte", country: "Brazil" },
  { name: "Bergen", country: "Norway" },
  { name: "Berlin", country: "Germany" },
  { name: "Bern", country: "Switzerland" },
  { name: "Bilbao", country: "Spain" },
  { name: "Birmingham", country: "United Kingdom" },
  { name: "Bishkek", country: "Kyrgyzstan" },
  { name: "Bogotá", country: "Colombia", aliases: ["bogota"] },
  { name: "Bologna", country: "Italy" },
  { name: "Bordeaux", country: "France" },
  { name: "Bratislava", country: "Slovakia" },
  { name: "Brazzaville", country: "Republic of the Congo" },
  { name: "Brisbane", country: "Australia" },
  { name: "Bristol", country: "United Kingdom" },
  { name: "Brussels", country: "Belgium", aliases: ["bruxelles"] },
  { name: "Bucharest", country: "Romania" },
  { name: "Busan", country: "South Korea" },
  { name: "Calgary", country: "Canada" },
  { name: "Cali", country: "Colombia" },
  { name: "Caracas", country: "Venezuela" },
  { name: "Cardiff", country: "United Kingdom" },
  { name: "Casablanca", country: "Morocco" },
  { name: "Cebu City", country: "Philippines" },
  { name: "Charlotte", country: "United States" },
  { name: "Chengdu", country: "China" },
  { name: "Chennai", country: "India", aliases: ["madras"] },
  { name: "Chiang Mai", country: "Thailand" },
  { name: "Chongqing", country: "China" },
  { name: "Christchurch", country: "New Zealand" },
  { name: "Cincinnati", country: "United States" },
  { name: "Cleveland", country: "United States" },
  { name: "Colombo", country: "Sri Lanka" },
  { name: "Cologne", country: "Germany", aliases: ["koln", "köln"] },
  { name: "Conakry", country: "Guinea" },
  { name: "Córdoba", country: "Argentina", aliases: ["cordoba"] },
  { name: "Curitiba", country: "Brazil" },
  { name: "Cusco", country: "Peru" },
  { name: "Da Nang", country: "Vietnam" },
  { name: "Dallas", country: "United States" },
  { name: "Damascus", country: "Syria" },
  { name: "Dar es Salaam", country: "Tanzania" },
  { name: "Darwin", country: "Australia" },
  { name: "Delhi", country: "India", aliases: ["new delhi"] },
  { name: "Denver", country: "United States" },
  { name: "Detroit", country: "United States" },
  { name: "Dhaka", country: "Bangladesh" },
  { name: "Djibouti", country: "Djibouti" },
  { name: "Dresden", country: "Germany" },
  { name: "Dubrovnik", country: "Croatia" },
  { name: "Durban", country: "South Africa" },
  { name: "Düsseldorf", country: "Germany", aliases: ["dusseldorf"] },
  { name: "Edinburgh", country: "United Kingdom" },
  { name: "Edmonton", country: "Canada" },
  { name: "Florence", country: "Italy", aliases: ["firenze"] },
  { name: "Fortaleza", country: "Brazil" },
  { name: "Frankfurt", country: "Germany" },
  { name: "Fukuoka", country: "Japan" },
  { name: "Gaborone", country: "Botswana" },
  { name: "Gdańsk", country: "Poland", aliases: ["gdansk"] },
  { name: "Genoa", country: "Italy", aliases: ["genova"] },
  { name: "Georgetown", country: "Guyana" },
  { name: "Glasgow", country: "United Kingdom" },
  { name: "Gothenburg", country: "Sweden", aliases: ["goteborg", "göteborg"] },
  { name: "Guadalajara", country: "Mexico" },
  { name: "Guangzhou", country: "China", aliases: ["canton"] },
  { name: "Guatemala City", country: "Guatemala" },
  { name: "Guayaquil", country: "Ecuador" },
  { name: "Haifa", country: "Israel" },
  { name: "Halifax", country: "Canada" },
  { name: "Hamburg", country: "Germany" },
  { name: "Hanoi", country: "Vietnam" },
  { name: "Hangzhou", country: "China" },
  { name: "Harare", country: "Zimbabwe" },
  { name: "Helsinki", country: "Finland" },
  { name: "Hiroshima", country: "Japan" },
  { name: "Ho Chi Minh City", country: "Vietnam", aliases: ["saigon"] },
  { name: "Hobart", country: "Australia" },
  { name: "Honolulu", country: "United States" },
  { name: "Houston", country: "United States" },
  { name: "Hyderabad", country: "India" },
  { name: "Incheon", country: "South Korea" },
  { name: "Indianapolis", country: "United States" },
  { name: "Islamabad", country: "Pakistan" },
  { name: "Izmir", country: "Turkey" },
  { name: "Jaipur", country: "India" },
  { name: "Jakarta", country: "Indonesia" },
  { name: "Jeddah", country: "Saudi Arabia" },
  { name: "Jerusalem", country: "Israel" },
  { name: "Johannesburg", country: "South Africa" },
  { name: "Kabul", country: "Afghanistan" },
  { name: "Kampala", country: "Uganda" },
  { name: "Kansas City", country: "United States" },
  { name: "Kaohsiung", country: "Taiwan" },
  { name: "Karachi", country: "Pakistan" },
  { name: "Kathmandu", country: "Nepal" },
  { name: "Khartoum", country: "Sudan" },
  { name: "Kigali", country: "Rwanda" },
  { name: "Kingston", country: "Jamaica" },
  { name: "Kinshasa", country: "DR Congo" },
  { name: "Kobe", country: "Japan" },
  { name: "Kolkata", country: "India", aliases: ["calcutta"] },
  { name: "Kraków", country: "Poland", aliases: ["krakow", "cracow"] },
  { name: "Kuala Lumpur", country: "Malaysia", aliases: ["kl"] },
  { name: "Kuwait City", country: "Kuwait" },
  { name: "Kyiv", country: "Ukraine", aliases: ["kiev"] },
  { name: "Kyoto", country: "Japan" },
  { name: "La Paz", country: "Bolivia" },
  { name: "Lahore", country: "Pakistan" },
  { name: "Las Vegas", country: "United States" },
  { name: "Leeds", country: "United Kingdom" },
  { name: "Leipzig", country: "Germany" },
  { name: "Lille", country: "France" },
  { name: "Liverpool", country: "United Kingdom" },
  { name: "Ljubljana", country: "Slovenia" },
  { name: "London", country: "United Kingdom" },
  { name: "Los Angeles", country: "United States", aliases: ["la"] },
  { name: "Luanda", country: "Angola" },
  { name: "Lusaka", country: "Zambia" },
  { name: "Luxembourg", country: "Luxembourg" },
  { name: "Lyon", country: "France" },
  { name: "Macau", country: "China", aliases: ["macao"] },
  { name: "Madrid", country: "Spain" },
  { name: "Málaga", country: "Spain", aliases: ["malaga"] },
  { name: "Malé", country: "Maldives", aliases: ["male"] },
  { name: "Malmö", country: "Sweden", aliases: ["malmo"] },
  { name: "Managua", country: "Nicaragua" },
  { name: "Manama", country: "Bahrain" },
  { name: "Manaus", country: "Brazil" },
  { name: "Manchester", country: "United Kingdom" },
  { name: "Manila", country: "Philippines" },
  { name: "Maputo", country: "Mozambique" },
  { name: "Marrakesh", country: "Morocco", aliases: ["marrakech"] },
  { name: "Marseille", country: "France" },
  { name: "Medellín", country: "Colombia", aliases: ["medellin"] },
  { name: "Melbourne", country: "Australia" },
  { name: "Milan", country: "Italy", aliases: ["milano"] },
  { name: "Milwaukee", country: "United States" },
  { name: "Minneapolis", country: "United States" },
  { name: "Minsk", country: "Belarus" },
  { name: "Mogadishu", country: "Somalia" },
  { name: "Mombasa", country: "Kenya" },
  { name: "Monaco", country: "Monaco" },
  { name: "Monterrey", country: "Mexico" },
  { name: "Montevideo", country: "Uruguay" },
  { name: "Moscow", country: "Russia", aliases: ["moskva"] },
  { name: "Munich", country: "Germany", aliases: ["munchen", "münchen"] },
  { name: "Muscat", country: "Oman" },
  { name: "Nagoya", country: "Japan" },
  { name: "Nairobi", country: "Kenya" },
  { name: "Nanjing", country: "China" },
  { name: "Nantes", country: "France" },
  { name: "Naples", country: "Italy", aliases: ["napoli"] },
  { name: "Nashville", country: "United States" },
  { name: "Nassau", country: "Bahamas" },
  { name: "Nice", country: "France" },
  { name: "Nicosia", country: "Cyprus" },
  { name: "Nouakchott", country: "Mauritania" },
  { name: "Novosibirsk", country: "Russia" },
  { name: "Nuremberg", country: "Germany", aliases: ["nurnberg", "nürnberg"] },
  { name: "Odesa", country: "Ukraine", aliases: ["odessa"] },
  { name: "Oslo", country: "Norway" },
  { name: "Ottawa", country: "Canada" },
  { name: "Palermo", country: "Italy" },
  { name: "Panama City", country: "Panama" },
  { name: "Paramaribo", country: "Suriname" },
  { name: "Philadelphia", country: "United States", aliases: ["philly"] },
  { name: "Phnom Penh", country: "Cambodia" },
  { name: "Phoenix", country: "United States" },
  { name: "Pittsburgh", country: "United States" },
  { name: "Podgorica", country: "Montenegro" },
  { name: "Port Louis", country: "Mauritius" },
  { name: "Port Moresby", country: "Papua New Guinea" },
  { name: "Port-au-Prince", country: "Haiti" },
  { name: "Portland", country: "United States" },
  { name: "Porto", country: "Portugal", aliases: ["oporto"] },
  { name: "Porto Alegre", country: "Brazil" },
  { name: "Prague", country: "Czechia", aliases: ["praha"] },
  { name: "Pretoria", country: "South Africa" },
  { name: "Pune", country: "India" },
  { name: "Pyongyang", country: "North Korea" },
  { name: "Qingdao", country: "China" },
  { name: "Quebec City", country: "Canada", aliases: ["quebec", "québec"] },
  { name: "Quito", country: "Ecuador" },
  { name: "Rabat", country: "Morocco" },
  { name: "Recife", country: "Brazil" },
  { name: "Reykjavik", country: "Iceland", aliases: ["reykjavík"] },
  { name: "Riga", country: "Latvia" },
  { name: "Riyadh", country: "Saudi Arabia" },
  { name: "Rome", country: "Italy", aliases: ["roma"] },
  { name: "Rosario", country: "Argentina" },
  { name: "Rotterdam", country: "Netherlands" },
  { name: "Salvador", country: "Brazil" },
  { name: "Salt Lake City", country: "United States" },
  { name: "Salzburg", country: "Austria" },
  { name: "San Antonio", country: "United States" },
  { name: "San Diego", country: "United States" },
  { name: "San Jose", country: "United States" },
  { name: "San José", country: "Costa Rica", aliases: ["san jose costa rica"] },
  { name: "San Juan", country: "Puerto Rico" },
  { name: "San Salvador", country: "El Salvador" },
  { name: "Sanaa", country: "Yemen" },
  { name: "Santo Domingo", country: "Dominican Republic" },
  { name: "São Paulo", country: "Brazil", aliases: ["sao paulo"] },
  { name: "Sapporo", country: "Japan" },
  { name: "Sarajevo", country: "Bosnia and Herzegovina" },
  { name: "Sendai", country: "Japan" },
  { name: "Seville", country: "Spain", aliases: ["sevilla"] },
  { name: "Shenzhen", country: "China" },
  { name: "Skopje", country: "North Macedonia" },
  { name: "Sofia", country: "Bulgaria" },
  { name: "Split", country: "Croatia" },
  { name: "St. Louis", country: "United States", aliases: ["saint louis"] },
  { name: "Strasbourg", country: "France" },
  { name: "Stuttgart", country: "Germany" },
  { name: "Suva", country: "Fiji" },
  { name: "Tallinn", country: "Estonia" },
  { name: "Tampa", country: "United States" },
  { name: "Tashkent", country: "Uzbekistan" },
  { name: "Tbilisi", country: "Georgia" },
  { name: "Tegucigalpa", country: "Honduras" },
  { name: "Tehran", country: "Iran" },
  { name: "Tel Aviv", country: "Israel" },
  { name: "Thessaloniki", country: "Greece" },
  { name: "Tianjin", country: "China" },
  { name: "Tijuana", country: "Mexico" },
  { name: "Tirana", country: "Albania" },
  { name: "Toronto", country: "Canada" },
  { name: "Toulouse", country: "France" },
  { name: "Trieste", country: "Italy" },
  { name: "Tripoli", country: "Libya" },
  { name: "Tunis", country: "Tunisia" },
  { name: "Turin", country: "Italy", aliases: ["torino"] },
  { name: "Ulaanbaatar", country: "Mongolia" },
  { name: "Utrecht", country: "Netherlands" },
  { name: "Valencia", country: "Spain" },
  { name: "Valparaíso", country: "Chile", aliases: ["valparaiso"] },
  { name: "Verona", country: "Italy" },
  { name: "Victoria", country: "Canada" },
  { name: "Vienna", country: "Austria", aliases: ["wien"] },
  { name: "Vientiane", country: "Laos" },
  { name: "Vilnius", country: "Lithuania" },
  { name: "Vladivostok", country: "Russia" },
  { name: "Warsaw", country: "Poland", aliases: ["warszawa"] },
  { name: "Washington, D.C.", country: "United States", aliases: ["washington dc", "washington"] },
  { name: "Wellington", country: "New Zealand" },
  { name: "Windhoek", country: "Namibia" },
  { name: "Winnipeg", country: "Canada" },
  { name: "Wrocław", country: "Poland", aliases: ["wroclaw"] },
  { name: "Wuhan", country: "China" },
  { name: "Xi'an", country: "China", aliases: ["xian"] },
  { name: "Yangon", country: "Myanmar", aliases: ["rangoon"] },
  { name: "Yaoundé", country: "Cameroon", aliases: ["yaounde"] },
  { name: "Yekaterinburg", country: "Russia" },
  { name: "Yerevan", country: "Armenia" },
  { name: "Yokohama", country: "Japan" },
  { name: "Zagreb", country: "Croatia" },
  { name: "Zanzibar City", country: "Tanzania", aliases: ["zanzibar"] },
  { name: "Zurich", country: "Switzerland", aliases: ["zürich"] }
];

/**
 * Normalize text for accent-insensitive, case-insensitive comparison.
 */
export function normalizeCityText(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Unified autocomplete directory combining all daily mystery cities and world cities without duplicates.
 */
export const AUTOCOMPLETE_CITY_DIRECTORY = (() => {
  const seen = new Set();
  const list = [];

  for (const city of DAILY_MYSTERY_CITIES) {
    const key = normalizeCityText(`${city.name}|${city.country}`);
    if (!seen.has(key)) {
      seen.add(key);
      list.push({
        name: city.name,
        country: city.country,
        aliases: city.aliases || [],
        normalizedName: normalizeCityText(city.name),
        normalizedCountry: normalizeCityText(city.country),
        normalizedAliases: (city.aliases || []).map(normalizeCityText)
      });
    }
  }

  for (const raw of EXTRA_WORLD_CITIES) {
    const displayName = raw.nameDisplay || raw.name;
    const key = normalizeCityText(`${displayName}|${raw.country}`);
    if (!seen.has(key)) {
      seen.add(key);
      list.push({
        name: displayName,
        country: raw.country,
        aliases: raw.aliases || [],
        normalizedName: normalizeCityText(displayName),
        normalizedCountry: normalizeCityText(raw.country),
        normalizedAliases: (raw.aliases || []).map(normalizeCityText)
      });
    }
  }

  return list.sort((a, b) => a.name.localeCompare(b.name));
})();

/**
 * Search the autocomplete city directory for a query string.
 */
export function searchCitiesForAutocomplete(query, limit = 7) {
  const q = normalizeCityText(query);
  if (!q) return [];

  const startsWithCity = [];
  const startsWithAliasOrWord = [];
  const containsMatch = [];

  for (const item of AUTOCOMPLETE_CITY_DIRECTORY) {
    if (item.normalizedName.startsWith(q)) {
      startsWithCity.push(item);
    } else if (
      item.normalizedAliases.some((a) => a.startsWith(q)) ||
      item.normalizedName.split(" ").some((w) => w.startsWith(q))
    ) {
      startsWithAliasOrWord.push(item);
    } else if (
      item.normalizedName.includes(q) ||
      item.normalizedCountry.startsWith(q) ||
      `${item.normalizedName} ${item.normalizedCountry}`.includes(q)
    ) {
      containsMatch.push(item);
    }
  }

  return [...startsWithCity, ...startsWithAliasOrWord, ...containsMatch].slice(0, limit);
}

/**
 * Check if a user's city name submission matches the target mystery city.
 */
export function isCityGuessCorrect(userGuess, targetCity) {
  if (!userGuess || !targetCity) return false;
  const rawPart = String(userGuess).split(",")[0];
  const guessNorm = normalizeCityText(rawPart);
  const fullNorm = normalizeCityText(userGuess);

  if (!guessNorm) return false;

  const targetNameNorm = normalizeCityText(targetCity.name);
  const targetWithCountryNorm = normalizeCityText(`${targetCity.name} ${targetCity.country}`);
  const targetCommaCountryNorm = normalizeCityText(`${targetCity.name}, ${targetCity.country}`);

  if (
    guessNorm === targetNameNorm ||
    fullNorm === targetNameNorm ||
    fullNorm === targetWithCountryNorm ||
    fullNorm === targetCommaCountryNorm
  ) {
    return true;
  }

  const aliases = (targetCity.aliases || []).map(normalizeCityText);
  return aliases.includes(guessNorm) || aliases.includes(fullNorm);
}
