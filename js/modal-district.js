/* ============================================================
   modal-district.js — District Detail Modal
   D3 orbit visualisation · editorial data panel · district cycling
   ============================================================ */

import { DISTRICTS } from './districts-data.js';
import { setDistrictModalOpener, restoreDistrictCards } from './screen-05.js';
import { setNavLocked } from './nav.js';
import { getDistrictData, getCachedData, fetchGiphyGif, fetchGiphyGifs } from './data.js';
import { trapFocus } from './a11y.js';

const PHASE_LABELS = ['Pre-COVID', 'Onset', 'Peak', 'Aftermath'];

/* Phase → district keyword mapping (used for peak-phase calculation in Chunk 07) */
const PHASE_MAP = {
  pre_covid:    0,
  lockdown:     1,
  deep_lockdown: 2,
  post_covid:   3,
};

/* ============================================================
   Orbit animation state
   ============================================================ */
let orbitRaf = null;
let orbitNodes = [];   // [{el, angle, radius, speed}]
let orbitActive = false;

/* Keyword → {still, src} cache so re-opens skip the network */
const _orbitGifCache = {};

/* ============================================================
   initDistrictModal
   ============================================================ */
export function initDistrictModal() {
  const modal    = document.getElementById('district-modal');
  const closeBtn = document.getElementById('modal-close');
  const prevBtn  = document.getElementById('modal-prev');
  const nextBtn  = document.getElementById('modal-next');

  if (!modal) { console.warn('modal-district: #district-modal not found'); return; }

  let currentDistrictId = 1;
  let _releaseTrap = null;

  /* Wire opener into screen-05 */
  setDistrictModalOpener((id) => openModal(id));

  /* Close */
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft')  navigateModal(-1);
    if (e.key === 'ArrowRight') navigateModal(+1);
  });

  /* In-modal prev / next */
  prevBtn?.addEventListener('click', () => navigateModal(-1));
  nextBtn?.addEventListener('click', () => navigateModal(+1));

  /* ---- Open ---- */
  function openModal(districtId) {
    currentDistrictId = districtId;
    renderModal(districtId);
    modal.classList.add('modal-open');
    modal.removeAttribute('hidden');
    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('modal-overlay')?.classList.add('open');
    setNavLocked(true);
    _releaseTrap = trapFocus(modal);
    startOrbitAnimation();
    animateScoreBar();
  }

  /* ---- Close ---- */
  function closeModal() {
    stopOrbitAnimation();
    _releaseTrap?.(); _releaseTrap = null;
    modal.classList.remove('modal-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('hidden', '');
    document.getElementById('modal-overlay')?.classList.remove('open');
    setNavLocked(false);
    restoreDistrictCards();
  }

  /* ---- Navigate between districts inside modal ---- */
  function navigateModal(direction) {
    const idx = DISTRICTS.findIndex(d => d.id === currentDistrictId);
    const next = DISTRICTS[(idx + direction + DISTRICTS.length) % DISTRICTS.length];
    currentDistrictId = next.id;

    /* Fade content out, swap, fade in */
    const content = modal.querySelector('.modal-content');
    content.style.opacity = '0';
    content.style.transition = 'opacity 200ms ease';
    setTimeout(() => {
      renderModal(currentDistrictId);
      content.style.opacity = '1';
      stopOrbitAnimation();
      startOrbitAnimation();
      animateScoreBar();
    }, 200);
  }

  /* ---- Render modal content for a given district ---- */
  function renderModal(districtId) {
    const d = DISTRICTS.find(d => d.id === districtId);
    if (!d) return;

    /* Set CSS colour token */
    modal.style.setProperty('--modal-district-color', d.colour);

    /* Label */
    const labelEl = modal.querySelector('.modal-district-label');
    if (labelEl) labelEl.innerHTML = `<span>0${d.id} / ${d.name}</span>`;

    /* Name */
    const nameEl = modal.querySelector('.modal-district-name');
    if (nameEl) nameEl.textContent = d.name;

    /* Write-up */
    const writeupEl = modal.querySelector('.modal-writeup');
    if (writeupEl) writeupEl.textContent = d.writeup;

    /* Stats — from real keyword cache */
    const realData = getDistrictData(d.id);
    const totalGifs  = realData ? realData.totalGifs    : d.keywords.length * d.score * 5;
    const avgScore   = realData ? realData.avgScore     : d.score;
    const peakPhase  = realData ? realData.peakPhase    : PHASE_LABELS[1];
    const peakPhaseK = realData ? realData.peakPhaseKey : 'lockdown';

    const statEls = modal.querySelectorAll('.stat-value');
    if (statEls[0]) statEls[0].textContent = totalGifs.toLocaleString();
    if (statEls[1]) statEls[1].textContent = avgScore;
    if (statEls[2]) statEls[2].textContent = peakPhase;

    /* Phases — highlight peak */
    const PHASE_KEYS = ['pre_covid','lockdown','deep_lockdown','post_covid'];
    modal.querySelectorAll('.phase-item').forEach((el, i) => {
      el.classList.toggle('phase-active', PHASE_KEYS[i] === peakPhaseK);
    });

    /* Update orbit node sizes from real data if available */
    if (realData) d._realKeywords = realData.keywords;

    /* Score bar (reset; animateScoreBar() fires separately) */
    const fill = modal.querySelector('.orbit-score-fill');
    if (fill) { fill.style.width = '0'; fill.dataset.score = d.score; }

    /* Build D3 orbit */
    buildOrbit(d);
  }
}

/* ============================================================
   Score bar animation
   ============================================================ */
function animateScoreBar() {
  requestAnimationFrame(() => {
    const fill = document.querySelector('.orbit-score-fill');
    if (!fill) return;
    const score = Number(fill.dataset.score) || 0;
    requestAnimationFrame(() => { fill.style.width = `${score}%`; });
  });
}

/* ============================================================
   D3 orbit visualisation
   ============================================================ */
function buildOrbit(district) {
  const svgEl = document.getElementById('orbit-svg');
  if (!svgEl) return;
  svgEl.innerHTML = ''; // clear previous

  /* Use getBoundingClientRect for live dimensions */
  const { width, height } = svgEl.getBoundingClientRect();
  const cx = width / 2;
  const cy = height / 2;

  const ns = 'http://www.w3.org/2000/svg';

  /* --- Central symbol --- */
  const symG = document.createElementNS(ns, 'g');
  symG.setAttribute('class', 'orbit-center');
  symG.setAttribute('transform', `translate(${cx - 50}, ${cy - 50})`);
  symG.style.color = district.colour;
  /* Scale SVG string into a foreignObject or parse it */
  const temp = document.createElement('div');
  temp.innerHTML = district.symbol;
  const symSvg = temp.querySelector('svg');
  if (symSvg) {
    symSvg.setAttribute('width', '100');
    symSvg.setAttribute('height', '100');
    symSvg.style.color = district.colour;
    symSvg.style.filter = `drop-shadow(0 0 10px ${district.colour})`;
    /* Pulse animation on central symbol */
    symSvg.style.animation = 'orbit-center-pulse 3s ease-in-out infinite';
    symG.appendChild(symSvg);
  }
  svgEl.appendChild(symG);

  /* --- Keyword nodes (GIF thumbnail + label) --- */
  const keywords = district.keywords;
  const orbitR   = Math.min(cx, cy) * 0.74;
  const NODE     = 52;               // thumbnail size (px in SVG user units)
  const HALF     = NODE / 2;

  orbitNodes = keywords.map((kw, i) => {
    const startAngle = (i / keywords.length) * Math.PI * 2;
    const speed      = (0.8 + Math.random() * 0.4) * (Math.PI * 2 / 30);

    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'orbit-node');
    g.style.cursor = 'pointer';

    /* Background rect (visible while GIF is loading) */
    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('x', -HALF);
    bg.setAttribute('y', -HALF);
    bg.setAttribute('width', NODE);
    bg.setAttribute('height', NODE);
    bg.setAttribute('rx', '2');
    bg.setAttribute('fill', `${district.colour}14`);
    g.appendChild(bg);

    /* GIF thumbnail — populated asynchronously */
    const img = document.createElementNS(ns, 'image');
    img.setAttribute('x', -HALF);
    img.setAttribute('y', -HALF);
    img.setAttribute('width', NODE);
    img.setAttribute('height', NODE);
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    img.style.opacity = '0';
    img.style.transition = 'opacity 420ms ease';
    g.appendChild(img);

    /* Border rect — sits on top of the image */
    const border = document.createElementNS(ns, 'rect');
    border.setAttribute('x', -HALF);
    border.setAttribute('y', -HALF);
    border.setAttribute('width', NODE);
    border.setAttribute('height', NODE);
    border.setAttribute('rx', '2');
    border.setAttribute('fill', 'none');
    border.setAttribute('stroke', `${district.colour}66`);
    border.setAttribute('stroke-width', '1');
    border.style.pointerEvents = 'none';
    g.appendChild(border);

    /* Keyword label below thumbnail */
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('y', HALF + 12);
    text.style.fontFamily = 'var(--font-mono)';
    text.style.fontSize   = '9px';
    text.style.letterSpacing = '0.08em';
    text.style.fill       = 'rgba(255,255,255,0.7)';
    text.style.pointerEvents = 'none';
    text.textContent      = kw;
    g.appendChild(text);

    svgEl.appendChild(g);

    /* Async GIF fetch — cache by keyword across modal opens */
    const applyGif = (gif) => {
      if (!gif?.still && !gif?.src) return;
      const href = gif.still || gif.src;
      img.setAttribute('href', href);
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
      img.style.opacity = '1';
    };
    if (_orbitGifCache[kw]) {
      applyGif(_orbitGifCache[kw]);
    } else {
      fetchGiphyGif(kw)
        .then(gif => { if (gif) { _orbitGifCache[kw] = gif; applyGif(gif); } })
        .catch(() => {});
    }

    /* Tooltip / hover */
    const realKw = district._realKeywords?.find(k => k.term === kw);
    const count  = realKw ? realKw.total_count : '—';
    const score  = realKw ? Math.round(realKw.codification_score) : '—';
    g.addEventListener('mouseenter', (e) => showTooltip(e, kw, count, score, district));
    g.addEventListener('mousemove',  (e) => moveTooltip(e));
    g.addEventListener('mouseleave', hideTooltip);

    /* Multi-GIF panel on click */
    g.addEventListener('click', () => showGifsForKeyword(kw, district, svgEl));

    return { el: g, angle: startAngle, radius: orbitR, speed };
  });

  /* Store orbit centre for animation */
  orbitNodes._cx = cx;
  orbitNodes._cy = cy;
}

/* ---- Orbit animation loop ---- */
function startOrbitAnimation() {
  orbitActive = true;
  let last = performance.now();

  function tick(now) {
    if (!orbitActive) return;
    const dt = (now - last) / 1000;
    last = now;

    const cx = orbitNodes._cx || 0;
    const cy = orbitNodes._cy || 0;

    const reducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.body.classList.contains('reduced-motion');

    orbitNodes.forEach(node => {
      if (!reducedMotion) node.angle += node.speed * dt;
      const x = cx + Math.cos(node.angle) * node.radius;
      const y = cy + Math.sin(node.angle) * node.radius;
      node.el.setAttribute('transform', `translate(${x}, ${y})`);
    });

    orbitRaf = requestAnimationFrame(tick);
  }

  orbitRaf = requestAnimationFrame(tick);
}

function stopOrbitAnimation() {
  orbitActive = false;
  if (orbitRaf) { cancelAnimationFrame(orbitRaf); orbitRaf = null; }
}

/* ---- Tooltip helpers ---- */
function showTooltip(e, kw, count, score, district) {
  let tip = document.getElementById('orbit-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'orbit-tooltip';
    document.body.appendChild(tip);
  }
  tip.innerHTML = `
    <div class="tooltip-term">${kw}</div>
    <div class="tooltip-count">GIFs indexed: <span style="color:${district.colour}">${typeof count === 'number' ? count.toLocaleString() : count}</span></div>
    <div class="tooltip-count">Codification: <span style="color:${district.colour}">${score}</span></div>
  `;
  moveTooltip(e);
  tip.classList.add('visible');
}

/* ---- Multi-GIF panel on keyword click ----
   Count scales with codification score (3 min → 25 max).
   Panel overlays the orbit inside the left panel and has an explicit close button.
---- */
function _scoreToGifCount(score) {
  return Math.max(3, Math.min(25, Math.round((score / 100) * 25)));
}

async function showGifsForKeyword(keyword, district, svgEl) {
  const container = svgEl.parentElement;
  if (!container) return;

  /* Remove any existing panel */
  container.querySelector('.orbit-gif-panel')?.remove();

  /* Figure out count from cached codification score */
  const cache = getCachedData()?.keywords || {};
  const score = cache[keyword]?.codification_score ?? 50;
  const count = _scoreToGifCount(score);

  /* Build panel scaffolding first (shows while fetch is in flight) */
  const panel = document.createElement('div');
  panel.className = 'orbit-gif-panel';
  panel.innerHTML = `
    <div class="orbit-gif-panel-header">
      <div class="orbit-gif-panel-meta">
        <span class="orbit-gif-panel-keyword">${keyword}</span>
        <span class="orbit-gif-panel-sub">${count} gifs · codification ${Math.round(score)}</span>
      </div>
      <button class="orbit-gif-panel-close" type="button" aria-label="Close GIFs">
        <i class="ph ph-x"></i>
      </button>
    </div>
    <div class="orbit-gif-panel-grid" aria-live="polite">
      <div class="orbit-gif-panel-loading">loading…</div>
    </div>
  `;
  panel.style.setProperty('--panel-color', district.colour);
  container.appendChild(panel);
  requestAnimationFrame(() => panel.classList.add('panel-open'));

  /* Wire close */
  const closeBtn = panel.querySelector('.orbit-gif-panel-close');
  const closePanel = () => {
    panel.classList.remove('panel-open');
    setTimeout(() => panel.remove(), 220);
  };
  closeBtn?.addEventListener('click', closePanel);

  /* Fetch & render */
  const gifs = await fetchGiphyGifs(keyword, count);
  const grid = panel.querySelector('.orbit-gif-panel-grid');
  grid.innerHTML = '';

  if (!gifs.length) {
    grid.innerHTML = '<div class="orbit-gif-panel-empty">no gifs found</div>';
    return;
  }

  gifs.forEach((gif, i) => {
    const tile = document.createElement('div');
    tile.className = 'orbit-gif-tile';
    tile.style.animationDelay = `${i * 28}ms`;

    const img = document.createElement('img');
    img.src = gif.still || gif.src;
    img.alt = keyword;
    img.loading = 'lazy';
    tile.appendChild(img);

    if (gif.src && gif.src !== gif.still) {
      const delay = 500 + i * 28;
      setTimeout(() => { if (img.isConnected) img.src = gif.src; }, delay);
    }

    grid.appendChild(tile);
  });
}
function moveTooltip(e) {
  const tip = document.getElementById('orbit-tooltip');
  if (!tip) return;
  tip.style.left = `${e.clientX + 14}px`;
  tip.style.top  = `${e.clientY - 8}px`;
}
function hideTooltip() {
  document.getElementById('orbit-tooltip')?.classList.remove('visible');
}
