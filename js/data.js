/* ============================================================
   data.js — cache-only data layer (post-PRD v2 refactor)

   Loads the pre-baked Giphy cache from data/keywords.enriched.json.
   Zero runtime Giphy API calls. The cache is refreshed monthly by
   .github/workflows/refresh-giphy-cache.yml and shipped with the site.

   Public surface:
     loadData()              — call once at boot
     getCachedData()         — raw cache object
     getDistrictData(id)     — back-compat for current Screen 05 + modal
     getBubbles()            — 55 phase-instances for the Strata View
     getPhases()             — phase metadata (labels, years, narrative)
     fetchGiphyGif(term)     — sync lookup by term (returns {id,still,src} or null)
     getFixedGif(slot)       — sync lookup of PRD v2 hardcoded GIFs
   ============================================================ */

const CACHE_PATH = 'data/keywords.enriched.json';

const STATIC_FALLBACK = {
  fetched_at: 0,
  schema_version: 2,
  keywords: {},
  bubbles: [],
  phases: {},
  fixed_gifs: {},
};

let _cachedData = null;

export async function loadData() {
  try {
    const res = await fetch(CACHE_PATH, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    _cachedData = await res.json();
  } catch (err) {
    console.warn('data.js: cache load failed, using empty fallback.', err);
    _cachedData = STATIC_FALLBACK;
  }
  return _cachedData;
}

export function getCachedData() { return _cachedData; }

export function getBubbles() { return _cachedData?.bubbles || []; }

export function getPhases() { return _cachedData?.phases || {}; }

/* ============================================================
   getDistrictData — back-compat for the current Screen 05 + District Modal.
   (Those surfaces are slated for removal in the Strata View refactor;
   this function stays until they're deleted.)
   ============================================================ */
const PHASE_LABELS = {
  pre_covid:     'Pre-COVID',
  lockdown:      'Onset',
  deep_lockdown: 'Peak',
  post_covid:   'Aftermath',
};

export function getDistrictData(districtId) {
  const data = _cachedData?.keywords || {};
  const entries = Object.entries(data).filter(([, v]) => v.district === districtId);
  if (!entries.length) return null;

  const totalGifs = entries.reduce((s, [, v]) => s + v.total_count, 0);
  const avgScore  = Math.round(entries.reduce((s, [, v]) => s + v.codification_score, 0) / entries.length);

  const byPhase = {};
  entries.forEach(([, v]) => {
    const p = v.primary_phase || v.phase;
    byPhase[p] = byPhase[p] || [];
    byPhase[p].push(v.codification_score);
  });
  const peakPhase = Object.entries(byPhase).reduce((best, [phase, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg > best.avg ? { phase, avg } : best;
  }, { phase: 'lockdown', avg: -1 }).phase;

  return {
    keywords: entries.map(([term, v]) => ({
      term,
      total_count: v.total_count,
      codification_score: v.codification_score,
      phase: v.primary_phase || v.phase,
      phase_label: PHASE_LABELS[v.primary_phase || v.phase] || (v.primary_phase || v.phase),
    })),
    totalGifs,
    avgScore,
    peakPhase: PHASE_LABELS[peakPhase] || peakPhase,
    peakPhaseKey: peakPhase,
  };
}

/* ============================================================
   fetchGiphyGif — SYNCHRONOUS local lookup (post-refactor).
   Shape preserved (id, still, src) so callers need only drop `await`.
   ============================================================ */
export function fetchGiphyGif(keyword) {
  const entry = _cachedData?.keywords?.[keyword];
  const gif   = entry?.gif;
  if (!gif) return null;
  firePingback(gif.onload_ping);
  return {
    id:    gif.id,
    still: gif.still,
    src:   gif.webp || gif.mp4 || gif.small || gif.still || '',
  };
}

/* ============================================================
   getFixedGif — lookup the 6 PRD v2 hardcoded GIFs by slot name.
   Slots: order_i | order_ii | order_iii | order_iv |
          closing_together | closing_loneliness
   Used by Act 1 (narrative screens) + Act 4 (closing) in the follow-up plan.
   ============================================================ */
export function getFixedGif(slot) {
  const gif = _cachedData?.fixed_gifs?.[slot];
  if (!gif || !(gif.webp || gif.mp4 || gif.still)) return null;
  firePingback(gif.onload_ping);
  return {
    id:    gif.id,
    still: gif.still,
    src:   gif.webp || gif.mp4 || gif.still || '',
  };
}

/* ============================================================
   Pingback — fire-and-forget analytics ping per Giphy ToS.
   URLs are pre-resolved at build time; dedupe per session to avoid
   double-counting when the same keyword is viewed multiple times.
   ============================================================ */
const _pinged = new Set();

function firePingback(url) {
  if (!url || _pinged.has(url)) return;
  _pinged.add(url);
  try {
    const u = new URL(url);
    u.searchParams.set('ts', Date.now().toString());
    fetch(u.toString()).catch(() => {});
  } catch (_) { /* malformed URL — silently drop */ }
}
