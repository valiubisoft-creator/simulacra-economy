/* ============================================================
   data.js — Chunk 07: full data layer
   1. Load keywords-cache.json (pre-built from summary.csv)
   2. 24-hour staleness check via localStorage → background refresh
   3. Static fallback (baked in) so user never sees an error
   4. Runtime Giphy fetch on keyword node click
   ============================================================ */

const CACHE_PATH  = 'data/keywords-cache.json';
const STALE_MS    = 86_400_000; // 24 hours
const CACHE_TS_KEY = 'discombobulate_cache_ts';

/* ---- Static fallback (subset — enough to keep the UI alive) ---- */
const STATIC_FALLBACK = {
  fetched_at: 0,
  keywords: {
    lockdown:  { total_count: 500, codification_score: 100, phase: 'lockdown',     district: 3 },
    pandemic:  { total_count: 500, codification_score: 100, phase: 'lockdown',     district: 2 },
    loneliness:{ total_count: 500, codification_score: 100, phase: 'deep_lockdown',district: 4 },
    hope:      { total_count: 500, codification_score: 100, phase: 'lockdown',     district: 8 },
  }
};

let _cachedData = null;

/* ============================================================
   loadData — call once at boot from main.js
   ============================================================ */
export async function loadData() {
  try {
    const res  = await fetch(CACHE_PATH, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    _cachedData = await res.json();
  } catch (err) {
    console.warn('data.js: cache load failed, using static fallback.', err);
    _cachedData = STATIC_FALLBACK;
  }

  /* 24h staleness — background refresh (in-memory only on static host) */
  try {
    const lastFetched = Number(localStorage.getItem(CACHE_TS_KEY) || 0);
    const isStale = !lastFetched || Date.now() - lastFetched > STALE_MS;
    if (isStale) _backgroundRefresh();
  } catch (_) { /* localStorage blocked */ }

  return _cachedData;
}

export function getCachedData() { return _cachedData; }

/* ============================================================
   getDistrictData — returns filtered + computed stats for one district
   ============================================================ */
export function getDistrictData(districtId) {
  const data = _cachedData?.keywords || {};
  const entries = Object.entries(data).filter(([, v]) => v.district === districtId);
  if (!entries.length) return null;

  const totalGifs = entries.reduce((s, [, v]) => s + v.total_count, 0);
  const avgScore  = Math.round(entries.reduce((s, [, v]) => s + v.codification_score, 0) / entries.length);

  /* Peak phase: phase with highest avg codification score */
  const byPhase = {};
  entries.forEach(([, v]) => {
    byPhase[v.phase] = byPhase[v.phase] || [];
    byPhase[v.phase].push(v.codification_score);
  });
  const peakPhase = Object.entries(byPhase).reduce((best, [phase, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg > best.avg ? { phase, avg } : best;
  }, { phase: 'lockdown', avg: -1 }).phase;

  const PHASE_LABELS = {
    pre_covid:    'Pre-COVID',
    lockdown:     'Onset',
    deep_lockdown:'Peak',
    post_covid:   'Aftermath',
  };

  return {
    keywords: entries.map(([term, v]) => ({
      term,
      total_count: v.total_count,
      codification_score: v.codification_score,
      phase: v.phase,
      phase_label: PHASE_LABELS[v.phase] || v.phase,
    })),
    totalGifs,
    avgScore,
    peakPhase: PHASE_LABELS[peakPhase] || peakPhase,
    peakPhaseKey: peakPhase,
  };
}

/* ============================================================
   fetchGiphyGif — runtime call on keyword node click
   The ONLY runtime Giphy call in the experience.
   ============================================================ */
let _sessionRandomId = null;

export async function fetchGiphyGif(keyword) {
  const apiKey = window.GIPHY_API_KEY;
  if (!apiKey) { console.warn('data.js: GIPHY_API_KEY not set'); return null; }

  /* Get session random ID once */
  if (!_sessionRandomId) {
    try {
      const r = await fetch(`https://api.giphy.com/v1/randomid?api_key=${apiKey}`);
      const j = await r.json();
      _sessionRandomId = j?.data?.random_id || '';
    } catch (_) { _sessionRandomId = ''; }
  }

  try {
    const url = new URL('https://api.giphy.com/v1/gifs/search');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('q', keyword);
    url.searchParams.set('limit', '1');
    url.searchParams.set('rating', 'pg');
    url.searchParams.set('lang', 'en');
    url.searchParams.set('fields', 'id,images.fixed_width,images.fixed_width_still,analytics');

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Giphy HTTP ${res.status}`);
    const json = await res.json();
    const gif  = json?.data?.[0];
    if (!gif) return null;

    /* Fire analytics pingback (Giphy ToS) */
    const pingBase = gif.analytics?.onload?.url;
    if (pingBase) {
      const pingUrl = new URL(pingBase);
      pingUrl.searchParams.set('ts', Date.now().toString());
      if (_sessionRandomId) pingUrl.searchParams.set('random_id', _sessionRandomId);
      fetch(pingUrl.toString()).catch(() => {});
    }

    return {
      id:    gif.id,
      still: gif.images?.fixed_width_still?.url,
      src:   gif.images?.fixed_width?.webp || gif.images?.fixed_width?.mp4 || gif.images?.fixed_width?.url,
    };
  } catch (err) {
    console.warn('data.js: Giphy fetch failed', err);
    return null;
  }
}

/* ============================================================
   Background refresh — updates in-memory data only
   (GitHub Pages is static; cannot write back to disk)
   ============================================================ */
async function _backgroundRefresh() {
  const apiKey = window.GIPHY_API_KEY;
  if (!apiKey || !_cachedData?.keywords) return;

  const keywords = Object.keys(_cachedData.keywords);
  const updated  = {};

  for (const term of keywords) {
    try {
      const url = new URL('https://api.giphy.com/v1/gifs/search');
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('q', term);
      url.searchParams.set('limit', '1');
      url.searchParams.set('rating', 'pg');
      url.searchParams.set('lang', 'en');
      url.searchParams.set('fields', 'id');
      const res   = await fetch(url.toString());
      const json  = await res.json();
      const count = json?.pagination?.total_count ?? _cachedData.keywords[term].total_count;
      updated[term] = { ..._cachedData.keywords[term], total_count: count,
        codification_score: Math.min((count / 500) * 100, 100) };
      await _sleep(150);
    } catch (_) { updated[term] = _cachedData.keywords[term]; }
  }

  _cachedData = { ..._cachedData, keywords: updated, fetched_at: Date.now() };
  console.info('data.js: background refresh complete');

  try { localStorage.setItem(CACHE_TS_KEY, Date.now().toString()); } catch (_) {}
}

function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
