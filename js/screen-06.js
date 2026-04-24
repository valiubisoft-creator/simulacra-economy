/* ============================================================
   screen-06.js — Closing screen + Behind the Scenes modal
   PRD v2 Act 4: two side-by-side Giphy GIFs (together + loneliness)
   replace the previous heart/eye SVG composition. Cached GIFs only —
   no runtime API calls.
   ============================================================ */

import { onScreenChange, goTo } from './screen-manager.js';
import { setNavLocked } from './nav.js';
import { getFixedGif } from './data.js';
import { playHeartbeat, stopHeartbeat } from './audio.js';
import { prepareRedactionWord, playRedaction, resetRedaction } from './redaction-anim.js';

const SCREEN_IDX = 7;   /* Closing is the last of 8 screens after Act-1 replaces narrative */

export function initScreen06() {
  const section = document.getElementById('screen-06');
  if (!section) return;

  const comp       = section.querySelector('.closing-composition');
  const labels     = section.querySelector('.closing-labels');
  const subtext    = section.querySelector('.closing-subtext');
  const poetic     = section.querySelector('.closing-poetic');
  const ctas       = section.querySelector('.closing-ctas');
  const gifTog     = document.getElementById('closing-gif-together');
  const gifLon     = document.getElementById('closing-gif-loneliness');
  const restartBtn = document.getElementById('closing-restart');
  const btsBtn     = document.getElementById('closing-bts');
  const btsModal   = document.getElementById('bts-modal');
  const btsClose   = document.getElementById('bts-close');

  const redactionWords = Array.from(section.querySelectorAll('.closing-panel-label .redaction-word'));
  redactionWords.forEach(prepareRedactionWord);

  let isActive  = false;
  let gifsLoaded = false;

  onScreenChange((next, prev) => {
    if (next === SCREEN_IDX) activate();
    else if (prev === SCREEN_IDX) deactivate();
  });

  restartBtn?.addEventListener('click', () => { deactivate(); goTo(0); });

  btsBtn?.addEventListener('click', openBTS);
  btsClose?.addEventListener('click', closeBTS);
  btsModal?.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBTS(); });

  function loadGifs() {
    if (gifsLoaded) return;
    const tog = getFixedGif('closing_together');
    const lon = getFixedGif('closing_loneliness');
    if (tog && gifTog) gifTog.src = tog.src || tog.still || '';
    if (lon && gifLon) gifLon.src = lon.src || lon.still || '';
    gifsLoaded = true;
  }

  function activate() {
    isActive = true;
    loadGifs();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.body.classList.contains('reduced-motion');

    if (reduced) {
      [comp, labels, subtext, poetic, ctas].forEach(el =>
        el?.classList.add('comp-visible', 'lbl-visible'));
      return;
    }

    /* Staggered fade-in (panels slide in + text fades per PRD v2 §04) */
    setTimeout(() => comp?.classList.add('comp-visible'),   0);
    setTimeout(() => labels?.classList.add('lbl-visible'), 900);
    setTimeout(() => subtext?.classList.add('lbl-visible'),1800);
    setTimeout(() => poetic?.classList.add('lbl-visible'), 2400);
    setTimeout(() => ctas?.classList.add('lbl-visible'),   3600);

    /* Redaction letter-dissolve on the two word labels — triggered after
       the panels have slid in (matches the 400ms-delay rule in PRD v2 §04). */
    setTimeout(() => {
      redactionWords.forEach((w, i) => {
        setTimeout(() => playRedaction(w), i * 300);
      });
    }, 500);

    playHeartbeat();
  }

  function deactivate() {
    isActive = false;
    stopHeartbeat();
    comp?.classList.remove('comp-visible');
    labels?.classList.remove('lbl-visible');
    subtext?.classList.remove('lbl-visible');
    poetic?.classList.remove('lbl-visible');
    ctas?.classList.remove('lbl-visible');
    redactionWords.forEach(resetRedaction);
  }

  function openBTS() {
    btsModal?.removeAttribute('hidden');
    btsModal?.classList.add('bts-open');
    btsModal?.setAttribute('aria-hidden', 'false');
    setNavLocked(true);
    btsClose?.focus();
    setTimeout(() => drawFlowmap(), 100);
  }

  function closeBTS() {
    btsModal?.classList.remove('bts-open');
    btsModal?.setAttribute('aria-hidden', 'true');
    btsModal?.setAttribute('hidden', '');
    setNavLocked(false);
    btsBtn?.focus();
  }
}

/* ============================================================
   BTS Flowmap — fixed-position SVG diagram with draw-on edges
   ============================================================ */
function drawFlowmap() {
  const svg = document.getElementById('bts-flowmap');
  if (!svg || svg.dataset.drawn) return;
  svg.dataset.drawn = 'true';

  const W = svg.clientWidth || 700;
  const H = 420;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const ns = 'http://www.w3.org/2000/svg';

  const nodes = [
    { id:'mcluhan',  label: 'McLuhan: Medium is the Message', x: W*0.22, y: 40,  cls:'node-theory'   },
    { id:'baud',     label: 'Baudrillard: Simulacra',         x: W*0.78, y: 40,  cls:'node-theory'   },
    { id:'gif-med',  label: 'GIF as Medium',                  x: W*0.22, y: 130, cls:''               },
    { id:'gif-hyp',  label: 'GIF as Hyperreal',               x: W*0.78, y: 130, cls:''               },
    { id:'giphy',    label: 'Giphy API — Cultural Archive',   x: W*0.50, y: 220, cls:''               },
    { id:'keywords', label: '55 Keywords / 4 Phases',         x: W*0.50, y: 300, cls:''               },
    { id:'dist',     label: '4 Baudrillard Strata',           x: W*0.50, y: 380, cls:'node-district'  },
  ];

  const edges = [
    ['mcluhan','gif-med'], ['baud','gif-hyp'],
    ['gif-med','giphy'],   ['gif-hyp','giphy'],
    ['giphy','keywords'],  ['keywords','dist'],
  ];

  const NW = 200, NH = 30;

  edges.forEach(([from, to]) => {
    const a = nodes.find(n => n.id === from);
    const b = nodes.find(n => n.id === to);
    if (!a || !b) return;
    const path = document.createElementNS(ns, 'path');
    const x1 = a.x, y1 = a.y + NH/2;
    const x2 = b.x, y2 = b.y - NH/2;
    const my = (y1 + y2) / 2;
    path.setAttribute('d', `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`);
    path.setAttribute('class', 'flow-edge');
    svg.appendChild(path);
    requestAnimationFrame(() => path.classList.add('edge-drawn'));
  });

  nodes.forEach(n => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', `flow-node ${n.cls}`);
    g.setAttribute('transform', `translate(${n.x - NW/2}, ${n.y - NH/2})`);

    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('width', NW);
    rect.setAttribute('height', NH);
    rect.setAttribute('rx', '2');
    g.appendChild(rect);

    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', NW / 2);
    text.setAttribute('y', NH / 2);
    text.textContent = n.label;
    g.appendChild(text);

    svg.appendChild(g);
  });
}
