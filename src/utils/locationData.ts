// Lightweight runtime loaders for Maharashtra administrative locations.
// Uses public JSON sources and caches results in localStorage.

const DISTRICT_TALUKA_RAW =
  'https://gist.githubusercontent.com/tejas711/bc5aeb3f2ab3df517e69788359272239/raw';
const VILLAGES_RAW =
  'https://raw.githubusercontent.com/pranshumaheshwari/indian-cities-and-villages/master/By%20States/Maharashtra.json';

const CACHE_KEYS = {
  districtTaluka: 'mh_district_taluka_v1',
  villages: 'mh_villages_state_v1',
} as const;

// Minimal curated fallbacks
const FALLBACK_DISTRICT_TALUKA: Record<string, string[]> = {
  Palghar: ['Palghar', 'Vasai', 'Dahanu', 'Talasari', 'Jawhar', 'Mokhada', 'Vikramgad', 'Wada'],
};

type DistrictTalukaMap = Record<string, string[]>;

async function safeFetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function normalizeDistrictName(name: string): string {
  return (name || '').trim();
}

export async function loadDistrictTalukaMap(): Promise<DistrictTalukaMap> {
  const cached = readCache<DistrictTalukaMap>(CACHE_KEYS.districtTaluka);
  if (cached && Object.keys(cached).length) return cached;

  const data = await safeFetchJson(DISTRICT_TALUKA_RAW);
  let map: DistrictTalukaMap = {};

  if (Array.isArray(data)) {
    // Try several common shapes
    for (const row of data) {
      const d =
        row?.district ||
        row?.District ||
        row?.district_name ||
        row?.name ||
        row?.Name;
      const talukas: string[] =
        row?.talukas ||
        row?.tehsils ||
        row?.tahasils ||
        row?.subdistricts ||
        row?.Subdistricts ||
        [];
      if (typeof d === 'string' && Array.isArray(talukas) && talukas.length) {
        map[normalizeDistrictName(d)] = talukas.map((t: any) => String(t));
      }
    }
  } else if (data && typeof data === 'object') {
    // Already in { district: [talukas] } format
    for (const [d, list] of Object.entries(data as Record<string, any>)) {
      if (Array.isArray(list)) map[normalizeDistrictName(d)] = list.map(String);
    }
  }

  // Merge with curated fallbacks (ensures Palghar works even if fetch fails)
  map = { ...FALLBACK_DISTRICT_TALUKA, ...map };
  writeCache(CACHE_KEYS.districtTaluka, map);
  return map;
}

export async function listMaharashtraDistricts(): Promise<string[]> {
  const map = await loadDistrictTalukaMap();
  return Object.keys(map).sort();
}

export async function loadMaharashtraTalukas(district: string): Promise<string[]> {
  const map = await loadDistrictTalukaMap();
  const talukas = map[normalizeDistrictName(district)] || [];
  return talukas.sort();
}

export async function loadMaharashtraVillages(
  district: string,
  taluka: string
): Promise<string[]> {
  // Cache entire state villages for fast subsequent queries
  let data = readCache<any[]>(CACHE_KEYS.villages);
  if (!data) {
    data = (await safeFetchJson(VILLAGES_RAW)) || [];
    if (Array.isArray(data) && data.length) writeCache(CACHE_KEYS.villages, data);
  }

  const dLower = (district || '').toLowerCase();
  const tLower = (taluka || '').toLowerCase();

  const villages = new Set<string>();
  for (const row of data || []) {
    const rd = String(
      row?.district || row?.District || row?.district_name || row?.state_district || ''
    ).toLowerCase();
    const rt = String(
      row?.subDistrict || row?.SubDistrict || row?.taluka || row?.tehsil || ''
    ).toLowerCase();
    const rv =
      row?.village || row?.Village || row?.Name || row?.name || row?.city || row?.Town;
    if (rd === dLower && rt === tLower && typeof rv === 'string' && rv.trim()) {
      villages.add(rv.trim());
    }
  }

  return Array.from(villages).sort();
}


