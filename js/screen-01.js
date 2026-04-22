/* ============================================================
   screen-01.js — Intro screen
   Matrix rain canvas · Redaction weight cycling · Entry animations
   A11y warning modal · Nav pill wiring
   ============================================================ */

import { onScreenChange, goTo } from './screen-manager.js';
import { setNavLocked } from './nav.js';

const A11Y_KEY   = 'discombobulate_a11y_ack';  // localStorage flag
const HOLD_MS    = 800;   // ms each Redaction level is held
const FADE_MS    = 200;   // ms crossfade between levels

/* ============================================================
   Matrix rain
   ============================================================ */
function setupMatrixRain(canvas) {
  const ctx = canvas.getContext('2d');
  const BG      = '#0A0A0A';
  const BLOCK_W = 8;
  const BLOCK_H = 8;
  const COL_W   = 10;     // 8px block + 2px gap
  const DECAY   = 0.06;   // background alpha per frame — higher = shorter trail

  let cols = 0;
  let heads = [];
  let rafId = null;
  let running = false;
  let dotPositions = [];  // static background dots

  function buildColumns() {
    cols  = Math.ceil(canvas.width / COL_W);
    heads = Array.from({ length: cols }, () => ({
      y:       Math.random() * canvas.height,   // start scattered
      speed:   2 + Math.random() * 3,
      opacity: 0.04 + Math.random() * 0.16,     // reduced: max ~0.2 (was 0.6)
    }));
  }

  function buildDots() {
    dotPositions = Array.from({ length: 80 }, () => ({
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,
      r:       0.8 + Math.random() * 0.8,
      opacity: 0.04 + Math.random() * 0.1,
    }));
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    buildColumns();
    buildDots();
    // Fill with solid bg so decay layer has clean start
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawFrame() {
    if (!running) return;

    // Decay — fade previous content toward bg
    ctx.fillStyle = `rgba(10,10,10,${DECAY})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Static background dots (drawn every frame at fixed low opacity)
    for (const d of dotPositions) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${d.opacity})`;
      ctx.fill();
    }

    // Falling blocks
    for (let i = 0; i < cols; i++) {
      const h = heads[i];
      const px = i * COL_W;
      const py = Math.floor(h.y);

      if (py >= -BLOCK_H && py < canvas.height) {
        ctx.fillStyle = `rgba(0,255,65,${h.opacity})`;
        ctx.fillRect(px, py, BLOCK_W, BLOCK_H);
      }

      h.y += h.speed;

      if (h.y > canvas.height + BLOCK_H * 2) {
        h.y       = -BLOCK_H - Math.random() * canvas.height * 0.4;
        h.speed   = 2 + Math.random() * 3;
        h.opacity = 0.04 + Math.random() * 0.16;
      }
    }

    rafId = requestAnimationFrame(drawFrame);
  }

  function isMotionSuppressed() {
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.body.classList.contains('reduced-motion')
    );
  }

  function start() {
    if (running) return;
    if (isMotionSuppressed()) return;
    running = true;
    if (cols === 0) resize();
    rafId = requestAnimationFrame(drawFrame);
  }

  function stop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    // Clear to bg so next start() begins clean
    if (canvas.width > 0) {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Scatter heads randomly for a fresh look on restart
    heads = heads.map(() => ({
      y:       Math.random() * canvas.height,
      speed:   2 + Math.random() * 3,
      opacity: 0.04 + Math.random() * 0.16,
    }));
  }

  const onResize = () => {
    const wasRunning = running;
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    resize();
    if (wasRunning && !isMotionSuppressed()) {
      running = true;
      rafId = requestAnimationFrame(drawFrame);
    }
  };

  window.addEventListener('resize', onResize);

  // Size canvas immediately (no animation yet)
  resize();

  return {
    start,
    stop,
    destroy() {
      stop();
      window.removeEventListener('resize', onResize);
    },
  };
}

/* ============================================================
   Redaction level cycling
   Each of the 4 Redaction variants is a separate font-family.
   10 = most degraded/pixelated → 100 = sharpest.
   Two absolutely-positioned spans crossfade between families.
   ============================================================ */
const REDACTION_FAMILIES = [
  "'Redaction10', Georgia, serif",
  "'Redaction50', Georgia, serif",
  "'Redaction70', Georgia, serif",
  "'Redaction100', Georgia, serif",
];

function setupRedactionCycle(container) {
  const layerA = container.querySelector('.layer-a');
  const layerB = container.querySelector('.layer-b');

  if (!layerA || !layerB) return { start() {}, stop() {} };

  let intervalId   = null;
  let familyIndex  = 0;
  let layerAFront  = true;

  function init() {
    layerA.style.transition  = 'none';
    layerB.style.transition  = 'none';
    layerA.style.fontFamily  = REDACTION_FAMILIES[0];
    layerB.style.fontFamily  = REDACTION_FAMILIES[0];
    layerA.style.opacity     = '1';
    layerB.style.opacity     = '0';
    layerAFront  = true;
    familyIndex  = 0;
  }

  function step() {
    const nextIndex = (familyIndex + 1) % REDACTION_FAMILIES.length;
    const incoming  = layerAFront ? layerB : layerA;
    const outgoing  = layerAFront ? layerA : layerB;

    // Stage next family on the incoming layer while it is invisible
    incoming.style.transition = 'none';
    incoming.style.fontFamily = REDACTION_FAMILIES[nextIndex];
    incoming.style.opacity    = '0';

    // Force style recalc so the font-family change registers before transition
    incoming.getBoundingClientRect();

    // Crossfade opacity
    const t = `opacity ${FADE_MS}ms ease`;
    incoming.style.transition = t;
    outgoing.style.transition = t;
    incoming.style.opacity    = '1';
    outgoing.style.opacity    = '0';

    familyIndex = nextIndex;
    layerAFront = !layerAFront;
  }

  function start() {
    if (intervalId) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.body.classList.contains('reduced-motion')) {
      // Static Redaction 100 (sharpest) for reduced-motion users
      layerA.style.transition = 'none';
      layerB.style.transition = 'none';
      layerA.style.fontFamily = REDACTION_FAMILIES[3];
      layerA.style.opacity    = '1';
      layerB.style.opacity    = '0';
      return;
    }
    init();
    intervalId = setInterval(step, HOLD_MS + FADE_MS);
  }

  function stop() {
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
  }

  return { start, stop };
}

/* ============================================================
   Entry animation trigger
   ============================================================ */
function triggerEntryAnimation(screenEl) {
  screenEl.classList.remove('intro-entered');
  // Force reflow so removing the class takes effect before re-adding
  void screenEl.offsetWidth;
  screenEl.classList.add('intro-entered');
}

/* ============================================================
   A11y modal
   ============================================================ */
function setupA11yModal({ onAcknowledge, onReduceMotionChange }) {
  const modal        = document.getElementById('a11y-modal');
  const continueBtn  = document.getElementById('a11y-continue-btn');
  const reduceCheck  = document.getElementById('a11y-reduce-check');
  const a11yPill     = document.getElementById('a11y-warning-btn');

  if (!modal) return { open() {}, close() {}, isOpen: () => false };

  function open() {
    modal.classList.add('open');
    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden', 'false');
    // Focus the continue button
    requestAnimationFrame(() => continueBtn?.focus());
  }

  function close() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    a11yPill?.focus();
  }

  continueBtn?.addEventListener('click', () => {
    onAcknowledge();
    close();
  });

  reduceCheck?.addEventListener('change', (e) => {
    onReduceMotionChange(e.target.checked);
  });

  // Escape only closes if already acknowledged (no new lock state)
  let _acknowledged = false;
  function setAcknowledged(v) { _acknowledged = v; }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open') && _acknowledged) {
      close();
    }
  });

  a11yPill?.addEventListener('click', () => open());

  return { open, close, setAcknowledged, isOpen: () => modal.classList.contains('open') };
}

/* ============================================================
   initScreen01 — public entry point, called from main.js
   ============================================================ */
export function initScreen01() {
  const screen    = document.getElementById('screen-01');
  const canvas    = document.getElementById('matrix-canvas');
  const navPill   = document.getElementById('nav-pill-start');

  if (!screen || !canvas) {
    console.warn('screen-01.js: required elements not found');
    return;
  }

  // ---- Set up subsystems ----
  const matrix    = setupMatrixRain(canvas);
  const headline  = screen.querySelector('.headline-cycling');
  const redaction = headline ? setupRedactionCycle(headline) : { start() {}, stop() {} };

  // ---- A11y state ----
  let acknowledged = false;
  try { acknowledged = localStorage.getItem(A11Y_KEY) === 'true'; } catch (e) { /* */ }

  const a11yModal = setupA11yModal({
    onAcknowledge() {
      acknowledged = true;
      try { localStorage.setItem(A11Y_KEY, 'true'); } catch (e) { /* */ }
      a11yModal.setAcknowledged(true);
      setNavLocked(false);
      navPill?.removeAttribute('data-locked');
    },
    onReduceMotionChange(enabled) {
      document.body.classList.toggle('reduced-motion', enabled);
      if (enabled) {
        matrix.stop();
        redaction.stop();
        // Show everything without animation in reduced-motion mode
        screen.classList.add('intro-entered');
      } else {
        if (screen.classList.contains('active')) {
          matrix.start();
          redaction.start();
        }
      }
    },
  });

  a11yModal.setAcknowledged(acknowledged);

  // ---- Lock nav until acknowledged ----
  if (!acknowledged) {
    setNavLocked(true);
    navPill?.setAttribute('data-locked', 'true');
  }

  // ---- Nav pill click ----
  navPill?.addEventListener('click', () => {
    if (!acknowledged) {
      a11yModal.open();
      return;
    }
    goTo(1);
  });

  // ---- Boot sequence ----
  function enterScreen() {
    matrix.start();
    triggerEntryAnimation(screen);
    // Start Redaction cycling after headline has faded in (~500ms)
    setTimeout(() => redaction.start(), 500);
  }

  // Initial activation (screen 0 is already active on page load)
  enterScreen();
  // Open a11y modal if never acknowledged
  if (!acknowledged) {
    a11yModal.open();
  }

  // ---- Screen change events (re-entry / exit) ----
  const unsub = onScreenChange((next, prev) => {
    if (next === 0) {
      // Returning to Screen 01 — replay with a small delay so the screen
      // opacity transition has a head-start before animations begin.
      setTimeout(enterScreen, 80);
    } else if (prev === 0) {
      matrix.stop();
      redaction.stop();
    }
  });

  // ---- Cleanup (returned for future use if teardown is needed) ----
  return () => {
    matrix.destroy();
    redaction.stop();
    unsub();
  };
}
