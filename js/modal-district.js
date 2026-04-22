/* ============================================================
   modal-district.js — District Detail Modal
   D3 orbit visualisation · editorial data panel · district cycling
   ============================================================ */

import { DISTRICTS } from './districts-data.js';
import { setDistrictModalOpener, restoreDistrictCards } from './screen-05.js';
import { setNavLocked } from './nav.js';
import { getDistrictData, fetchGiphyGif } from './data.js';
import { playSFX } from './audio.js';

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
    modal.setAttribute('aria-hidden', 'false');
    setNavLocked(true);
    document.getElementById('modal-close')?.focus();
    startOrbitAnimation();
    animateScoreBar();
  }

  /* ---- Close ---- */
  function closeModal() {
    stopOrbitAnimation();
    modal.classList.remove('modal-open');
    modal.setAttribute('aria-hidden', 'true');
    setNavLocked(false);
    playSFX.districtClose();
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

  /* --- Keyword nodes --- */
  const keywords   = district.keywords;
  const orbitR     = Math.min(cx, cy) * 0.72;  /* orbit radius */
  const nodeW      = 80;
  const nodeH      = 26;

  orbitNodes = keywords.map((kw, i) => {
    const startAngle = (i / keywords.length) * Math.PI * 2;
    const speed      = (0.8 + Math.random() * 0.4) * (Math.PI * 2 / 30); /* ~30s/rev */

    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'orbit-node');
    g.style.cursor = 'pointer';

    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('width', nodeW);
    rect.setAttribute('height', nodeH);
    rect.setAttribute('x', -nodeW / 2);
    rect.setAttribute('y', -nodeH / 2);
    rect.setAttribute('rx', '2');
    rect.setAttribute('fill', 'rgba(255,255,255,0.05)');
    rect.setAttribute('stroke', `${district.colour}66`);
    rect.setAttribute('stroke-width', '1');

    const text = document.createElementNS(ns, 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('y', '1');
    text.style.fontFamily = 'var(--font-mono)';
    text.style.fontSize   = '8px';
    text.style.fill       = 'var(--color-text-muted)';
    text.textContent      = kw;

    g.appendChild(rect);
    g.appendChild(text);
    svgEl.appendChild(g);

    /* Find real count from cached data */
    const realKw = district._realKeywords?.find(k => k.term === kw);
    const count  = realKw ? realKw.total_count : '—';
    const score  = realKw ? Math.round(realKw.codification_score) : '—';

    /* Tooltip on hover */
    g.addEventListener('mouseenter', (e) => showTooltip(e, kw, count, score, district));
    g.addEventListener('mousemove',  (e) => moveTooltip(e));
    g.addEventListener('mouseleave', hideTooltip);

    /* GIF fetch on click */
    g.addEventListener('click', () => showGifForKeyword(kw, g, svgEl));

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

/* ---- GIF panel on node click ---- */
async function showGifForKeyword(keyword, nodeEl, svgEl) {
  /* Remove any existing gif panel */
  svgEl.parentElement?.querySelector('.orbit-gif-panel')?.remove();

  const gif = await fetchGiphyGif(keyword);
  if (!gif) return;

  const panel = document.createElement('div');
  panel.className = 'orbit-gif-panel';
  panel.style.cssText = 'position:absolute;bottom:24px;left:24px;z-index:2;background:rgba(8,8,8,0.9);border:1px solid rgba(255,255,255,0.1);padding:8px;';

  if (gif.still) {
    const img = document.createElement('img');
    img.src    = gif.still;
    img.alt    = keyword;
    img.style.cssText = 'display:block;width:140px;height:auto;image-rendering:pixelated;';
    /* Pixelated reveal: start blocky, then sharpen */
    img.style.filter = 'blur(4px)';
    panel.appendChild(img);
    setTimeout(() => { img.style.transition = 'filter 800ms ease-out'; img.style.filter = 'none'; }, 50);
    /* Swap to animated src after still loads */
    if (gif.src) setTimeout(() => { img.src = gif.src; }, 900);
  }

  const label = document.createElement('div');
  label.textContent = keyword;
  label.style.cssText = 'font-family:var(--font-mono);font-size:8px;color:var(--color-text-muted);margin-top:6px;letter-spacing:0.1em;';
  panel.appendChild(label);

  /* Close on click-away */
  const closePanel = (e) => { if (!panel.contains(e.target)) { panel.remove(); document.removeEventListener('click', closePanel); } };
  setTimeout(() => document.addEventListener('click', closePanel), 100);

  svgEl.parentElement?.appendChild(panel);
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
