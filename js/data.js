/* ============================================================
   data.js
   Chunk 01 stub. Real implementation lands in Chunk 07:
   - fetch data/keywords-cache.json
   - fall back to STATIC_FALLBACK (baked-in summary.csv values)
   - 24h staleness check via localStorage, background refresh
   ============================================================ */

const CACHE_PATH = 'data/keywords-cache.json';

export async function loadData() {
  try {
    const res = await fetch(CACHE_PATH, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = await res.json();
    return parsed;
  } catch (err) {
    console.warn('data.js: cache load failed, returning empty object.', err);
    return {};
  }
}
