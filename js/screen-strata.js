/* ============================================================
   screen-strata.js — Baudrillard Strata View (PRD v2 Act 3)
   4 geological bands (proportional height) · 55 keyword bubbles
   via d3-force · filter chips · hover-loaded GIFs from cache.
   Strata-mode only — no City Stack / Heatmap toggles.
   ============================================================ */

import { onScreenChange } from './screen-manager.js';
import { setScrollNavLocked, setNavLocked } from './nav.js';
import { getBubbles, getPhases, fetchGiphyGif } from './data.js';

const STRATA_SCREEN_INDEX = 6;   /* intro + 4 Orders + Phase Boot, then Strata */

const PHASE_ORDER = ['pre_covid', 'lockdown', 'deep_lockdown', 'post_covid'];

const PHASE_DISPLAY = {
  pre_covid:     { short: 'PRE-COVID',      band: 'Before the Fall'        },
  lockdown:      { short: 'LOCKDOWN',       band: 'The Cage Opens'         },
  deep_lockdown: { short: 'DEEP LOCKDOWN',  band: 'The Simulation Deepens' },
  post_covid:    { short: 'POST-COVID',     band: 'The New Normal'         },
};

const CLASSIFICATION_COLOR = {
  cage:      '#4FC3F7',
  respite:   '#FFB300',
  simulacra: '#AEEA00',
  medium:    '#9C27B0',
  neutral:   'rgba(255,255,255,0.35)',
};

const CLASSIFICATION_ORDER = ['cage', 'respite', 'simulacra', 'medium', 'neutral'];

/* Phase chip palette — subtle hues matching the band tints so the user
   can read a chip's meaning at a glance. */
const PHASE_CHIP_COLOR = {
  pre_covid:     '#4FA8E0',
  lockdown:      '#D08060',
  deep_lockdown: '#9CA3AF',
  post_covid:    '#A07ADC',
};

const CATEGORY_CHIP_COLOR = 'rgba(255, 255, 255, 0.85)';

const MIN_R = 22;
const MAX_R = 68;
const MIN_BAND_H = 260;   /* fits the centred header + breathing room for bubbles */
const COLLISION_PAD = 18;
const LABEL_VISIBLE_R = 22;
const LABEL_FULL_R = 30;
const SIM_TICKS = 450;
const PREWARM_COUNT = 10;

/* Canvas layout budget — content is scrollable, so we don't squeeze
   bubbles into viewport height. Target ~1700px of content height. */
const TARGET_CANVAS_H = 1700;
const PER_KEYWORD_H   = 110;   /* floor: every keyword gets ~110px band slice */

/* Bubble exclusion zones (px) */
const SIDE_PAD      = 48;      /* keep bubbles off the left/right edges + arrows */
const BAND_TOP_PAD  = 88;      /* reserves top of band for centred phase label   */
const BAND_BOT_PAD  = 32;

let sectionEl = null;
let scrollEl = null;
let bandsEl = null;
let bubblesEl = null;
let chipsEl = null;
let chipListEl = null;
let canvasEl = null;
let scrollHintEl = null;
let scrollHintDismissed = false;
let modalEl = null;
let modalGifEl = null;
let modalTermEl = null;
let modalClassEl = null;
let modalLastTrigger = null;
let savedScrollTop = 0;   /* preserved across filter apply/reset */
let visibilityObserver = null;

let built = false;
let nodes = [];
let bandBounds = {};

/* Multi-select filter state — each type holds a Set of selected values.
   A bubble matches if, for every non-empty set, its value is included. */
const filterState = {
  phase:          new Set(),
  classification: new Set(),
  category:       new Set(),
};

let resizeListener = null;
let resizeTimer = null;
let prewarmDone = false;

export function initScreenStrata() {
  sectionEl = document.getElementById('screen-strata');
  if (!sectionEl) return;

  scrollEl      = sectionEl.querySelector('.strata-scroll');
  bandsEl       = sectionEl.querySelector('.strata-bands');
  bubblesEl     = sectionEl.querySelector('.strata-bubbles');
  chipsEl       = sectionEl.querySelector('.strata-chips');
  chipListEl    = sectionEl.querySelector('.strata-chip-list');
  canvasEl      = sectionEl.querySelector('.strata-canvas');
  scrollHintEl  = sectionEl.querySelector('.strata-scroll-hint');
  modalEl       = sectionEl.querySelector('.bubble-modal');
  modalGifEl    = modalEl?.querySelector('.bubble-modal-gif');
  modalTermEl   = modalEl?.querySelector('.bubble-modal-term');
  modalClassEl  = modalEl?.querySelector('.bubble-modal-classification');

  /* Hide the scroll hint 1s after the user begins scrolling */
  scrollEl?.addEventListener('scroll', () => {
    if (scrollHintDismissed || scrollEl.scrollTop <= 40) return;
    scrollHintDismissed = true;
    setTimeout(() => scrollHintEl?.classList.add('hidden'), 1000);
  }, { passive: true });

  /* Modal dismissals */
  modalEl?.querySelector('.bubble-modal-close')?.addEventListener('click', closeModal);
  modalEl?.querySelectorAll('[data-role="close"]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl && !modalEl.hasAttribute('hidden')) closeModal();
  });

  onScreenChange((newIdx, prevIdx) => {
    if (newIdx === STRATA_SCREEN_INDEX) activate();
    else if (prevIdx === STRATA_SCREEN_INDEX) deactivate();
  });
}

/* ============================================================
   Lifecycle
   ============================================================ */
function activate() {
  if (!window.d3) {
    console.warn('screen-strata: d3 not loaded');
    return;
  }

  /* While on strata, wheel/touch should scroll the canvas, not advance screens.
     Arrow keys and dots still navigate (they stay active). */
  setScrollNavLocked(true);

  if (!built) {
    build();
    built = true;
  } else {
    /* Re-layout in case viewport changed while the screen was hidden */
    layout();
  }

  wireResizeListener();
  if (!prewarmDone) { schedulePrewarm(); prewarmDone = true; }
}

function deactivate() {
  setScrollNavLocked(false);
  if (resizeListener) {
    window.removeEventListener('resize', resizeListener);
    resizeListener = null;
  }
}

/* ============================================================
   Build: one-time setup of chips, bands, bubbles
   ============================================================ */
function build() {
  const bubbleData = getBubbles();
  if (!bubbleData.length) {
    console.warn('screen-strata: no bubble data');
    return;
  }

  nodes = bubbleData.map((b, i) => ({
    ...b,
    r: radiusForScore(b.codification_score),
    x: 0,
    y: 0,
    _idx: i,
  }));

  buildChips();
  layout();
  renderBubbles();
  applyFilters();
}

/* ============================================================
   Layout: compute band heights, bubble target positions,
   run simulation, position bubble DOM.
   ============================================================ */
function layout() {
  /* Width = scroll container's inner width (excludes scrollbar) */
  const scrollRect = scrollEl.getBoundingClientRect();
  const W = scrollEl.clientWidth || scrollRect.width;
  if (W <= 0) return;

  const phases = getPhases();
  const rawCounts = PHASE_ORDER.map(pk => phases[pk]?.keyword_terms?.length || 0);
  const total = rawCounts.reduce((a, b) => a + b, 0) || 1;

  /* Canvas total height = max(PER_KEYWORD_H × totalKeywords, TARGET_CANVAS_H).
     Using this instead of viewport means the content always has breathing
     room, and scroll kicks in on smaller screens. */
  const canvasH = Math.max(TARGET_CANVAS_H, PER_KEYWORD_H * total);

  let heights = rawCounts.map(c => (c / total) * canvasH);
  heights = heights.map(h => Math.max(MIN_BAND_H, h));

  /* Set canvas explicit height so the scroll container has content to scroll */
  canvasEl.style.height = `${heights.reduce((a, b) => a + b, 0)}px`;

  bandsEl.innerHTML = '';
  bandBounds = {};
  let y = 0;
  PHASE_ORDER.forEach((pk, i) => {
    const ph = phases[pk];
    const h = heights[i];
    const band = document.createElement('div');
    band.className = `strata-band strata-band-${pk}`;
    band.style.top = `${y}px`;
    band.style.height = `${h}px`;
    band.innerHTML = `
      <div class="band-label-group">
        <span class="band-phase-tag">PHASE 0${i + 1} · ${PHASE_DISPLAY[pk].short}</span>
        <span class="band-phase-name">${ph?.label || PHASE_DISPLAY[pk].band}</span>
        <span class="band-years">${ph?.years || ''}</span>
      </div>
    `;
    bandsEl.appendChild(band);
    bandBounds[pk] = { top: y, bottom: y + h, center: y + h / 2, height: h };
    y += h;
  });

  const xMin = SIDE_PAD;
  const xMax = W - SIDE_PAD;
  const xSpan = Math.max(xMax - xMin, 1);

  /* Deterministic X seed per term so bubbles have a stable home column —
     now spans the full width since the band label sits at the top-centre
     rather than in a left-side gutter. */
  nodes.forEach(n => {
    const bb = bandBounds[n.phase];
    if (!bb) return;
    const seed = (n.term.charCodeAt(0) * 31 + n.term.length * 7) % 100 / 100;
    n.homeX = xMin + n.r + 20 + seed * (xSpan - 2 * (n.r + 20));
    n.x = n.homeX;
    n.homeY = computeHomeY(n, bb);
    n.y = n.homeY;
  });

  /* Force simulation with clamp-after-each-tick */
  const clampNode = (n) => {
    const bb = bandBounds[n.phase];
    if (!bb) return;
    n.x = Math.max(xMin + n.r, Math.min(W - SIDE_PAD - n.r, n.x));
    n.y = Math.max(bb.top + n.r + BAND_TOP_PAD, Math.min(bb.bottom - n.r - BAND_BOT_PAD, n.y));
  };

  const sim = window.d3.forceSimulation(nodes)
    .force('x', window.d3.forceX(d => d.homeX).strength(0.08))
    .force('y', window.d3.forceY(d => d.homeY).strength(0.38))
    .force('collide', window.d3.forceCollide(d => d.r + COLLISION_PAD).strength(1.0))
    .stop();

  for (let i = 0; i < SIM_TICKS; i++) {
    sim.tick();
    nodes.forEach(clampNode);
  }
  sim.stop();

  /* Final pass just in case the last tick nudged anything out */
  nodes.forEach(clampNode);

  /* Snapshot band-layout positions so filter/reset can return bubbles home */
  nodes.forEach(n => { n.bandX = n.x; n.bandY = n.y; });

  if (bubblesEl.children.length) applyBubblePositions();
}

function computeHomeY(node, band) {
  /* Usable vertical space inside a band — below the centred label, above
     the band footer. Y-drift by classification lives inside this zone. */
  const zoneTop    = band.top + BAND_TOP_PAD;
  const zoneBottom = band.bottom - BAND_BOT_PAD;
  const zoneH      = Math.max(zoneBottom - zoneTop, 1);
  const mid        = (zoneTop + zoneBottom) / 2;

  if (node.classification === 'cage') {
    return zoneTop + zoneH * (0.72 + sinJitter(node.term) * 0.08);
  }
  if (node.classification === 'respite') {
    return zoneTop + zoneH * (0.28 + sinJitter(node.term) * 0.08);
  }
  return mid + (sinJitter(node.term) - 0.5) * zoneH * 0.6;
}

function sinJitter(term) {
  const n = (term.charCodeAt(0) * 31 + term.length * 7) % 100;
  return (Math.sin(n) + 1) / 2;
}

function radiusForScore(score) {
  const t = Math.max(0, Math.min(100, score)) / 100;
  return MIN_R + t * (MAX_R - MIN_R);
}

/* ============================================================
   Bubble DOM — one per node
   Structure:
     <div.strata-bubble>
       <div.bubble-circle>              ← visible circle, clips GIF
         <img.bubble-gif>
       </div>
       <span.bubble-label>term</span>   ← .inside OR .outside modifier
     </div>
   Labels go inside the circle when the bubble is large enough; otherwise
   they render below the circle (centered) so the full text is always
   readable. Filter mode forces outside labels + adds phase/classification
   to help the user identify clustered bubbles.
   ============================================================ */
function renderBubbles() {
  bubblesEl.innerHTML = '';
  nodes.forEach(n => {
    const el = document.createElement('div');
    el.className = 'strata-bubble';
    el.style.setProperty('--bubble-color', CLASSIFICATION_COLOR[n.classification] || CLASSIFICATION_COLOR.neutral);
    el.style.setProperty('--bubble-r', `${n.r}px`);
    el.setAttribute('role', 'listitem');
    el.setAttribute('tabindex', '0');
    el.setAttribute(
      'aria-label',
      `${n.term}, codification score ${Math.round(n.codification_score)}, ${PHASE_DISPLAY[n.phase]?.short || n.phase}`
    );
    el.dataset.term = n.term;
    el.dataset.phase = n.phase;
    el.dataset.classification = n.classification;
    el.dataset.category = n.category;

    const circle = document.createElement('div');
    circle.className = 'bubble-circle';

    const img = document.createElement('img');
    img.className = 'bubble-gif';
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'lazy';
    circle.appendChild(img);

    el.appendChild(circle);

    const label = document.createElement('span');
    label.className = 'bubble-label';
    el.appendChild(label);

    /* Hover on pointer devices: already-loaded GIF just shows via CSS.
       Click / Enter / Space: open the detail modal. */
    el.addEventListener('click',   () => openModal(n, el));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(n, el); }
    });

    bubblesEl.appendChild(el);
    n._el = el;
    n._img = img;
    n._label = label;
  });
  applyBubblePositions();
  wireVisibilityObserver();
}

/* ============================================================
   IntersectionObserver — loads each bubble's cached GIF when the
   bubble enters the viewport, unloads when it leaves. No network
   calls to Giphy's search API; images fetched directly from their
   CDN, so there's no rate limit. Keeps the decode budget bounded
   to the on-screen bubbles only.
   ============================================================ */
function wireVisibilityObserver() {
  if (visibilityObserver) { visibilityObserver.disconnect(); visibilityObserver = null; }
  if (!('IntersectionObserver' in window)) return;

  visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      const term = el.dataset.term;
      const node = nodes.find(n => n.term === term);
      if (!node) return;

      if (entry.isIntersecting) {
        revealGif(el, node);
      } else {
        /* Unload GIF to free memory — still keeps the cached URL in
           fetchGiphyGif() for instant re-load when user scrolls back. */
        if (node._img && node._img.src) {
          node._img.removeAttribute('src');
        }
        el.dataset.loaded = '0';
      }
    });
  }, {
    root: scrollEl,
    rootMargin: '220px 0px 220px 0px',   /* preload bubbles a bit above/below viewport */
    threshold: 0,
  });

  nodes.forEach(n => { if (n._el) visibilityObserver.observe(n._el); });
}

function applyBubblePositions() {
  const filtered = anyFilterActive();
  nodes.forEach(n => {
    if (!n._el) return;
    n._el.style.transform = `translate(${n.x - n.r}px, ${n.y - n.r}px)`;
    updateBubbleLabel(n, filtered);
  });
}

function updateBubbleLabel(n, filtered) {
  if (!n._label) return;
  /* Outside label when: filter mode active OR bubble too small for inside text */
  const forceOutside = filtered || n.r < LABEL_FULL_R;
  if (forceOutside) {
    n._label.className = 'bubble-label outside';
    if (filtered) {
      /* Two-line label: term on top, phase + classification on bottom.
         Stacking vertically keeps each line short so the pack radius
         (computed from the wider line) stays tight. */
      const phase = PHASE_DISPLAY[n.phase]?.short || n.phase;
      n._label.innerHTML =
        `<span class="bl-term">${escapeHtml(n.term)}</span>` +
        `<span class="bl-meta">${escapeHtml(phase)} · ${escapeHtml(n.classification)}</span>`;
    } else {
      n._label.textContent = n.term;
    }
  } else {
    n._label.className = 'bubble-label inside';
    n._label.textContent = n.term;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* ============================================================
   Hover GIF reveal — reads cached URL, no network
   ============================================================ */
function revealGif(el, node) {
  if (el.dataset.loaded === '1') return;
  const gif = fetchGiphyGif(node.term);
  if (!gif) { el.classList.add('no-gif'); return; }
  node._img.src = gif.src || gif.still || '';
  el.dataset.loaded = '1';
}

/* ============================================================
   Filter chips
   ============================================================ */
function buildChips() {
  const bubbleData = getBubbles();
  chipListEl.innerHTML = '';

  chipListEl.appendChild(chip('reset', '', 'RESET'));

  PHASE_ORDER.forEach(pk => {
    const chipEl = chip('phase', pk, PHASE_DISPLAY[pk].short);
    chipEl.style.setProperty('--chip-color', PHASE_CHIP_COLOR[pk] || 'rgba(255,255,255,0.85)');
    chipListEl.appendChild(chipEl);
  });

  CLASSIFICATION_ORDER.forEach(c => {
    if (bubbleData.some(b => b.classification === c)) {
      const chipEl = chip('classification', c, c.toUpperCase());
      chipEl.style.setProperty('--chip-color', CLASSIFICATION_COLOR[c]);
      chipListEl.appendChild(chipEl);
    }
  });

  [...new Set(bubbleData.map(b => b.category))].sort().forEach(cat => {
    if (cat) {
      const chipEl = chip('category', cat, cat.toUpperCase());
      chipEl.style.setProperty('--chip-color', CATEGORY_CHIP_COLOR);
      chipListEl.appendChild(chipEl);
    }
  });
}

function chip(type, value, label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `strata-chip chip-${type}`;
  btn.dataset.type = type;
  btn.dataset.value = value;
  btn.textContent = label;
  btn.addEventListener('click', () => onChipClick(type, value));
  return btn;
}

function onChipClick(type, value) {
  if (type === 'reset') {
    filterState.phase.clear();
    filterState.classification.clear();
    filterState.category.clear();
  } else {
    const s = filterState[type];
    if (s.has(value)) s.delete(value);
    else s.add(value);
  }
  syncChipUI();
  applyFilters();

  /* Dismiss the scroll hint once the user engages with filters */
  if (!scrollHintDismissed && anyFilterActive()) {
    scrollHintEl?.classList.add('hidden');
    scrollHintDismissed = true;
  }
}

function anyFilterActive() {
  return filterState.phase.size > 0
      || filterState.classification.size > 0
      || filterState.category.size > 0;
}

function matchesFilter(n) {
  return (filterState.phase.size          === 0 || filterState.phase.has(n.phase))
      && (filterState.classification.size === 0 || filterState.classification.has(n.classification))
      && (filterState.category.size       === 0 || filterState.category.has(n.category));
}

function syncChipUI() {
  const active = anyFilterActive();
  chipListEl.querySelectorAll('.strata-chip').forEach(btn => {
    const t = btn.dataset.type;
    const v = btn.dataset.value;
    if (t === 'reset') {
      btn.classList.toggle('active', active);
    } else {
      btn.classList.toggle('active', filterState[t]?.has(v));
    }
  });
}

/* ============================================================
   applyFilters — when any chip is active, dissolve the bands,
   fade out non-matching bubbles, and float the matches into a
   single cluster at the top of the canvas. Reset → restore
   band layout AND the user's scroll position from before the
   filter was first applied.
   ============================================================ */
function applyFilters() {
  const active = anyFilterActive();
  const wasFiltered = sectionEl.classList.contains('filtered');

  /* Snapshot scroll position at the moment we FIRST enter filter mode,
     so a later reset returns the user exactly where they were. */
  if (active && !wasFiltered) {
    savedScrollTop = scrollEl?.scrollTop ?? 0;
  }

  sectionEl.classList.toggle('filtered', active);

  if (!active) {
    /* Reset: bubbles float back to their band positions; scroll returns
       to the user's pre-filter position rather than snapping to top. */
    nodes.forEach(n => {
      if (!n._el) return;
      n._el.classList.remove('hidden', 'clustered');
      n.x = n.bandX;
      n.y = n.bandY;
    });
    applyBubblePositions();
    if (wasFiltered) {
      scrollEl?.scrollTo({ top: savedScrollTop, behavior: 'smooth' });
    }
    return;
  }

  /* Split matches/non-matches */
  const matches = [];
  nodes.forEach(n => {
    if (!n._el) return;
    if (matchesFilter(n)) {
      n._el.classList.remove('hidden');
      n._el.classList.add('clustered');
      matches.push(n);
    } else {
      n._el.classList.add('hidden');
      n._el.classList.remove('clustered');
    }
  });

  if (matches.length) clusterMatches(matches);
  applyBubblePositions();

  /* Float to top only on the FIRST filter apply so the cluster is visible.
     Subsequent chip clicks while already filtered don't disturb the view. */
  if (!wasFiltered) {
    scrollEl?.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* Cluster matching nodes using d3.packSiblings.

   Key trick: we don't pack just the BUBBLE — we pack the full "unit"
   of bubble + its label below. For each bubble we measure the rendered
   text width of both label lines, compute the minimum enclosing circle
   around the bubble+label rectangle, then hand those oversized circles
   to packSiblings. After packing we shift each bubble UP by half the
   label's vertical reach so the bubble (not the unit centre) lands at
   the packed position. Result: circles AND their labels never overlap.

   Refs: https://github.com/d3/d3-hierarchy#packSiblings
         SO 39120020 ("d3 circle pack without overlap, with labels") */

const _labelMeasureCanvas = typeof document !== 'undefined'
  ? document.createElement('canvas').getContext('2d')
  : null;

const CLUSTER_LABEL_FONT = '500 10.5px "Space Mono", ui-monospace, monospace';
const CLUSTER_META_FONT  = '500 9px "Space Mono", ui-monospace, monospace';
const LABEL_GAP_PX       = 3;    /* gap from bubble bottom to label top */
const LABEL_LINE_HEIGHT  = 11;   /* per-line height of outside label    */
const LABEL_WIDTH_CAP    = 140;  /* hard cap; longer labels truncate    */

function measureText(text, font) {
  if (!_labelMeasureCanvas) return text.length * 7;
  _labelMeasureCanvas.font = font;
  return _labelMeasureCanvas.measureText(text).width;
}

function clusterMatches(matches) {
  if (!matches.length) return;

  const W = scrollEl.clientWidth || canvasEl.clientWidth;
  const Y_ANCHOR = 140;

  const packable = matches
    .slice()
    .sort((a, b) => b.r - a.r)
    .map(n => {
      /* Measure the two label lines that updateBubbleLabel will render */
      const phase = PHASE_DISPLAY[n.phase]?.short || n.phase;
      const metaText = `${phase} · ${n.classification}`;
      const termW = measureText(n.term, CLUSTER_LABEL_FONT);
      const metaW = measureText(metaText, CLUSTER_META_FONT);
      const labelW = Math.min(180, Math.max(termW, metaW)) + 6;   /* side padding */
      const labelH = LABEL_LINE_HEIGHT * 2 + 2;                    /* 2 lines + 2px inter-line */

      /* Unit rectangle: width = max(2r, labelW), height = 2r + gap + labelH.
         The bubble sits at the top of the unit; label hangs below. */
      const unitW = Math.max(n.r * 2, labelW);
      const unitH = n.r * 2 + LABEL_GAP_PX + labelH;

      /* Unit centre is offset BELOW the bubble centre by half the
         "extra" vertical extent introduced by the label. */
      const offsetY = (LABEL_GAP_PX + labelH) / 2;

      /* Minimum enclosing circle of the unit rectangle. We SUBTRACT a
         small value from the formal enclosing-circle radius — the
         corners of the unit rectangle are empty space (bubble is
         round, label is narrow), so a tiny overlap at those corners
         is invisible. Net effect: cluster is ~15% tighter. */
      const packR = Math.sqrt(unitW * unitW + unitH * unitH) / 2 - 5;

      return { _node: n, r: packR, _offsetY: offsetY };
    });

  window.d3.packSiblings(packable);

  /* Bounding box of the packed result */
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  packable.forEach(c => {
    minX = Math.min(minX, c.x - c.r);
    maxX = Math.max(maxX, c.x + c.r);
    minY = Math.min(minY, c.y - c.r);
    maxY = Math.max(maxY, c.y + c.r);
  });
  const packCx = (minX + maxX) / 2;
  const packCy = (minY + maxY) / 2;
  const packH = maxY - minY;

  /* Translate so the pack is centred horizontally and its top is at Y_ANCHOR */
  const targetCx = W / 2;
  const targetCy = Y_ANCHOR + packH / 2;
  const dx = targetCx - packCx;
  const dy = targetCy - packCy;

  packable.forEach(c => {
    /* Bubble sits ABOVE the unit centre — shift up by offsetY */
    c._node.x = c.x + dx;
    c._node.y = c.y + dy - c._offsetY;
  });

  /* Soft horizontal clamp for narrow viewports; vertical overflow is
     handled by the scroll container. */
  const margin = 24;
  matches.forEach(n => {
    n.x = Math.max(margin + n.r, Math.min(W - margin - n.r, n.x));
    n.y = Math.max(Y_ANCHOR + n.r, n.y);
  });
}

/* ============================================================
   Resize: debounce → recompute band heights + rerun sim
   ============================================================ */
function wireResizeListener() {
  if (resizeListener) return;
  resizeListener = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => layout(), 200);
  };
  window.addEventListener('resize', resizeListener);
}

/* ============================================================
   Bubble detail modal — opens on bubble click with a big GIF,
   the term, and all relevant metadata. Cached data only.
   ============================================================ */
function openModal(node, triggerEl) {
  if (!modalEl) return;

  const gif   = fetchGiphyGif(node.term);
  const phases = getPhases();
  const phase  = phases[node.phase];

  if (gif) modalGifEl.src = gif.src || gif.still || '';
  else     modalGifEl.removeAttribute('src');

  modalTermEl.textContent = node.term;
  modalClassEl.textContent = (node.classification || 'neutral').toUpperCase();
  modalEl.style.setProperty('--bubble-color', CLASSIFICATION_COLOR[node.classification] || CLASSIFICATION_COLOR.neutral);

  setMetaField('phase',          PHASE_DISPLAY[node.phase]?.short || node.phase);
  setMetaField('years',          phase?.years || '—');
  setMetaField('category',       node.category || '—');
  setMetaField('classification', node.classification || 'neutral');
  setMetaField('total',          node.total_count?.toLocaleString?.() ?? node.total_count ?? '—');
  setMetaField('score',          `${Math.round(node.codification_score)} / 100`);
  setMetaField('gid',            gif?.id || '—', true);

  modalLastTrigger = triggerEl || null;
  modalEl.removeAttribute('hidden');
  modalEl.setAttribute('aria-hidden', 'false');
  /* Force reflow so the transition plays */
  // eslint-disable-next-line no-unused-expressions
  modalEl.offsetHeight;
  modalEl.classList.add('open');

  setNavLocked(true);
  modalEl.querySelector('.bubble-modal-close')?.focus();
}

function closeModal() {
  if (!modalEl || modalEl.hasAttribute('hidden')) return;
  modalEl.classList.remove('open');
  modalEl.setAttribute('aria-hidden', 'true');
  setNavLocked(false);
  setTimeout(() => {
    modalEl.setAttribute('hidden', '');
    if (modalGifEl) modalGifEl.removeAttribute('src');
    modalLastTrigger?.focus?.();
    modalLastTrigger = null;
  }, 220);
}

function setMetaField(field, value, mono = false) {
  const el = modalEl.querySelector(`dd[data-field="${field}"]`);
  if (!el) return;
  el.textContent = value;
  el.classList.toggle('mono', mono);
}

/* ============================================================
   Pre-warm the top 10 highest-score GIFs on idle, so the first
   hover of prominent bubbles is instant.
   ============================================================ */
function schedulePrewarm() {
  const fn = () => {
    const top = [...nodes]
      .sort((a, b) => b.codification_score - a.codification_score)
      .slice(0, PREWARM_COUNT);
    top.forEach(n => {
      const gif = fetchGiphyGif(n.term);
      if (gif?.src) {
        const img = new Image();
        img.decoding = 'async';
        img.src = gif.src;
      }
    });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 1500 });
  else setTimeout(fn, 800);
}
