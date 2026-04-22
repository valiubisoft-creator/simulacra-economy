/* ============================================================
   screen-06.js — Closing screen + Behind the Scenes modal
   Heart + eye Venn · cursor-tracking iris · GIF tile orbit
   Heartbeat sound loop · BTS modal with D3 flowmap
   ============================================================ */

import { onScreenChange, goTo } from './screen-manager.js';
import { setNavLocked } from './nav.js';
import { playHeartbeat, stopHeartbeat } from './audio.js';

const SCREEN_IDX = 5;

/* ============================================================
   initScreen06
   ============================================================ */
export function initScreen06() {
  const section    = document.getElementById('screen-06');
  if (!section) return;

  const comp       = section.querySelector('.closing-composition');
  const eyeSvg     = section.querySelector('.closing-eye');
  const labels     = section.querySelector('.closing-labels');
  const subtext    = section.querySelector('.closing-subtext');
  const poetic     = section.querySelector('.closing-poetic');
  const ctas       = section.querySelector('.closing-ctas');
  const restartBtn = document.getElementById('closing-restart');
  const btsBtn     = document.getElementById('closing-bts');
  const btsModal   = document.getElementById('bts-modal');
  const btsClose   = document.getElementById('bts-close');

  /* -- Iris tracking state -- */
  let irisX = 0, irisY = 0;
  let irisTargetX = 0, irisTargetY = 0;
  let irisRaf = null;
  let isActive = false;

  /* -- GIF tile orbit -- */
  let tileRaf = null;
  let tileAngle = 0;

  /* ---------- Screen lifecycle ---------- */
  onScreenChange((next, prev) => {
    if (next === SCREEN_IDX) activate();
    else if (prev === SCREEN_IDX) deactivate();
  });

  /* ---------- Restart ---------- */
  restartBtn?.addEventListener('click', () => { deactivate(); goTo(0); });

  /* ---------- BTS modal ---------- */
  btsBtn?.addEventListener('click', openBTS);
  btsClose?.addEventListener('click', closeBTS);
  btsModal?.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBTS(); });

  /* ---------- Cursor tracking for iris ---------- */
  function onMouseMove(e) {
    if (!isActive) return;
    const eyeRect = eyeSvg?.getBoundingClientRect();
    if (!eyeRect) return;
    const ecx = eyeRect.left + eyeRect.width  * 0.52;
    const ecy = eyeRect.top  + eyeRect.height * 0.48;
    const dx  = e.clientX - ecx;
    const dy  = e.clientY - ecy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const MAX_DIST = 18;
    const scale = Math.min(1, MAX_DIST / (dist || 1));
    irisTargetX = dx * scale;
    irisTargetY = dy * scale;
  }

  function irisLoop() {
    if (!isActive) return;
    irisX += (irisTargetX - irisX) * 0.09;
    irisY += (irisTargetY - irisY) * 0.09;
    const iris = eyeSvg?.querySelector('.iris-group');
    if (iris) iris.setAttribute('transform', `translate(${irisX.toFixed(2)},${irisY.toFixed(2)})`);
    irisRaf = requestAnimationFrame(irisLoop);
  }

  /* ---------- GIF tile orbit ---------- */
  function tileLoop() {
    if (!isActive) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.body.classList.contains('reduced-motion');
    if (!reduced) tileAngle += 0.003;
    const tiles = section.querySelectorAll('.gif-tile');
    const radius = 170;
    tiles.forEach((tile, i) => {
      const a = tileAngle + (i / tiles.length) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * (radius * 0.5);
      tile.style.transform = `translate(${x}px, ${y}px)`;
    });
    tileRaf = requestAnimationFrame(tileLoop);
  }

  /* ---------- Activate / deactivate ---------- */
  function activate() {
    isActive = true;
    window.addEventListener('mousemove', onMouseMove);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.body.classList.contains('reduced-motion');

    if (reduced) {
      [comp, labels, subtext, poetic, ctas].forEach(el =>
        el?.classList.add('comp-visible', 'lbl-visible'));
      return;
    }

    /* Staggered fade-in sequence */
    setTimeout(() => comp?.classList.add('comp-visible'),   0);
    setTimeout(() => labels?.classList.add('lbl-visible'), 1000);
    setTimeout(() => subtext?.classList.add('lbl-visible'),2000);
    setTimeout(() => poetic?.classList.add('lbl-visible'), 2500);
    setTimeout(() => ctas?.classList.add('lbl-visible'),   4000);

    irisLoop();
    tileLoop();
    playHeartbeat();
  }

  function deactivate() {
    isActive = false;
    window.removeEventListener('mousemove', onMouseMove);
    cancelAnimationFrame(irisRaf);
    cancelAnimationFrame(tileRaf);
    stopHeartbeat();
    irisX = irisY = irisTargetX = irisTargetY = 0;
    /* Reset visibility classes */
    comp?.classList.remove('comp-visible');
    labels?.classList.remove('lbl-visible');
    subtext?.classList.remove('lbl-visible');
    poetic?.classList.remove('lbl-visible');
    ctas?.classList.remove('lbl-visible');
  }

  /* ---------- BTS helpers ---------- */
  function openBTS() {
    btsModal?.removeAttribute('hidden');
    btsModal?.classList.add('bts-open');
    btsModal?.setAttribute('aria-hidden', 'false');
    setNavLocked(true);
    btsClose?.focus();
    /* Trigger flowmap draw-on */
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
   BTS Flowmap — D3-style fixed-position SVG diagram
   Edges animate in with stroke-dashoffset draw-on (800ms).
   ============================================================ */
function drawFlowmap() {
  const svg = document.getElementById('bts-flowmap');
  if (!svg || svg.dataset.drawn) return;
  svg.dataset.drawn = 'true';

  const W = svg.clientWidth || 700;
  const H = 420;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const ns = 'http://www.w3.org/2000/svg';

  /* Node layout (fixed positions) */
  const nodes = [
    { id:'mcluhan',  label: 'McLuhan: Medium is the Message', x: W*0.22, y: 40,  cls:'node-theory'   },
    { id:'baud',     label: 'Baudrillard: Simulacra',         x: W*0.78, y: 40,  cls:'node-theory'   },
    { id:'gif-med',  label: 'GIF as Medium',                  x: W*0.22, y: 130, cls:''               },
    { id:'gif-hyp',  label: 'GIF as Hyperreal',               x: W*0.78, y: 130, cls:''               },
    { id:'giphy',    label: 'Giphy API — Cultural Archive',   x: W*0.50, y: 220, cls:''               },
    { id:'keywords', label: '55 Keywords / 4 Phases',         x: W*0.50, y: 300, cls:''               },
    { id:'dist',     label: '8 Thematic Districts',           x: W*0.50, y: 380, cls:'node-district'  },
  ];

  const edges = [
    ['mcluhan','gif-med'], ['baud','gif-hyp'],
    ['gif-med','giphy'],   ['gif-hyp','giphy'],
    ['giphy','keywords'],  ['keywords','dist'],
  ];

  const NW = 200, NH = 30;

  /* Draw edges first (behind nodes) */
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
    /* Trigger transition on next frame */
    requestAnimationFrame(() => path.classList.add('edge-drawn'));
  });

  /* Draw nodes */
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
