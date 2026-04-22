/* ============================================================
   screen-narrative.js — Screens 02, 03, 04
   Video backgrounds · Pixelated image reveal · Entry animations
   Screen 04 "network" glitch word
   ============================================================ */

import { onScreenChange } from './screen-manager.js';

/* ============================================================
   Config — one entry per narrative screen
   screenIndex matches 0-based screen-manager index
   ============================================================ */
const NARRATIVE_CONFIG = [
  {
    screenIndex: 1,
    id: 'screen-02',
    videoSrc: 'assets/mp4/Video_02.mp4',
    imageSrc: 'assets/img/screen-02-still.png',
    imageAlt: 'Pixel-art illustration of a couple on a sofa watching television — warm domestic scene, pre-pandemic',
  },
  {
    screenIndex: 2,
    id: 'screen-03',
    videoSrc: 'assets/mp4/Video_03.mp4',
    imageSrc: 'assets/img/screen-03-still.png',
    imageAlt: 'Pixel-art illustration of a figure sinking underwater — blue, heavy, disorienting',
  },
  {
    screenIndex: 3,
    id: 'screen-04',
    videoSrc: 'assets/mp4/Video_04.mp4',
    imageSrc: 'assets/img/screen-04-still.png',
    imageAlt: 'Pixel-art illustration of a crowd of people on their phones, surrounded by floating digital UI elements',
    hasGlitchWord: true,
  },
];

/* ============================================================
   Pixelated reveal
   Draws the image at 8×8-pixel block resolution, then
   interpolates to full resolution over 800ms (cubic ease-out).
   Uses an offscreen canvas to avoid read-back artifacts.
   ============================================================ */
function pixelatedReveal(canvas, img, duration = 800) {
  const ctx       = canvas.getContext('2d');
  const W         = canvas.width;
  const H         = canvas.height;
  const offscreen = document.createElement('canvas');
  const offCtx    = offscreen.getContext('2d');
  let   rafId     = null;
  const start     = performance.now();

  function draw(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Cubic ease-out
    const eased    = 1 - Math.pow(1 - progress, 3);

    // Block size: 8 → 1 as eased goes 0 → 1
    const blockSize = Math.max(1, Math.round(8 - 7 * eased));

    if (blockSize <= 1) {
      // Full resolution pass
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, W, H);
      return; // done, no more rAF
    }

    const smallW = Math.ceil(W / blockSize);
    const smallH = Math.ceil(H / blockSize);

    offscreen.width  = smallW;
    offscreen.height = smallH;

    // Draw image at reduced resolution into offscreen canvas
    offCtx.imageSmoothingEnabled = true;
    offCtx.drawImage(img, 0, 0, smallW, smallH);

    // Scale back up to display size with nearest-neighbour = blocky pixels
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, 0, 0, smallW, smallH, 0, 0, W, H);

    rafId = requestAnimationFrame(draw);
  }

  rafId = requestAnimationFrame(draw);

  return () => { if (rafId) cancelAnimationFrame(rafId); };
}

/* ============================================================
   Image loader — resolves with an HTMLImageElement
   (uses the browser cache if already preloaded)
   ============================================================ */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src     = src;
  });
}

/* ============================================================
   Size a canvas to match image aspect ratio within max bounds
   ============================================================ */
function sizeCanvas(canvas, img) {
  const MAX_W = canvas.parentElement
    ? Math.min(canvas.parentElement.offsetWidth, img.naturalWidth)
    : Math.min(img.naturalWidth, 800);
  const ratio = img.naturalHeight / img.naturalWidth;
  canvas.width  = MAX_W;
  canvas.height = Math.round(MAX_W * ratio);
}

/* ============================================================
   Screen 04 — "network" glitch word
   Rapid-cycles through all 4 Redaction families 3 times,
   then settles on Redaction 70. Hard cuts = glitch aesthetic.
   ============================================================ */
const GLITCH_FAMILIES = [
  "'Redaction10',  Georgia, serif",
  "'Redaction50',  Georgia, serif",
  "'Redaction70',  Georgia, serif",
  "'Redaction100', Georgia, serif",
];
const GLITCH_CYCLES    = 3;
const GLITCH_STEP_MS   = 100;
const GLITCH_SETTLE    = "'Redaction70',  Georgia, serif";

function setupGlitchWord(el) {
  const totalSteps = GLITCH_FAMILIES.length * GLITCH_CYCLES;
  let step = 0;
  let id   = null;

  function start() {
    if (id) stop();
    step             = 0;
    el.style.fontFamily = GLITCH_FAMILIES[0];

    id = setInterval(() => {
      step++;
      if (step >= totalSteps) {
        clearInterval(id);
        id = null;
        el.style.fontFamily = GLITCH_SETTLE;
        return;
      }
      el.style.fontFamily = GLITCH_FAMILIES[step % GLITCH_FAMILIES.length];
    }, GLITCH_STEP_MS);
  }

  function stop() {
    if (id) { clearInterval(id); id = null; }
  }

  return { start, stop };
}

/* ============================================================
   Setup one narrative screen — video + reveal + animations
   ============================================================ */
function setupNarrativeScreen(cfg) {
  const section = document.getElementById(cfg.id);
  if (!section) return { activate() {}, deactivate() {} };

  const video  = section.querySelector('.narrative-video');
  const canvas = section.querySelector('.narrative-media canvas');
  const glitch = cfg.hasGlitchWord
    ? setupGlitchWord(document.getElementById('network-word'))
    : null;

  let imgCache      = null;     // loaded image element
  let cancelReveal  = null;     // cleanup fn from pixelatedReveal
  let revealTimerId = null;

  // Load the image immediately (it's preloaded in <head>)
  loadImage(cfg.imageSrc)
    .then(img => { imgCache = img; })
    .catch(err => console.warn('Narrative image load failed:', err));

  /* ---------- Video helpers ---------- */
  function playVideo() {
    if (!video) return;
    // Only set playbackRate once media is ready
    const setRate = () => { video.playbackRate = 0.5; };
    video.addEventListener('canplay', setRate, { once: true });

    // Trigger load if preload="none"
    if (video.readyState === 0) {
      video.setAttribute('preload', 'auto');
      video.load();
    }

    video.play().catch(() => { /* autoplay blocked — silent */ });
  }

  function pauseVideo() {
    if (video) video.pause();
  }

  /* ---------- Entry sequence ---------- */
  function activate() {
    // Clear any prior state
    if (cancelReveal)  { cancelReveal(); cancelReveal = null; }
    if (revealTimerId) { clearTimeout(revealTimerId); revealTimerId = null; }
    if (glitch)        glitch.stop();

    section.classList.remove('narrative-entered');
    void section.offsetWidth; // force reflow

    playVideo();

    // Skip animations if reduced motion
    const reducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.body.classList.contains('reduced-motion');

    if (reducedMotion) {
      section.classList.add('narrative-entered');
      if (imgCache && canvas) {
        sizeCanvas(canvas, imgCache);
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(imgCache, 0, 0, canvas.width, canvas.height);
      }
      if (glitch) glitch.start();
      return;
    }

    section.classList.add('narrative-entered');

    // Pixelated reveal starts just as canvas fades in (380ms CSS delay)
    revealTimerId = setTimeout(() => {
      if (!imgCache || !canvas) return;
      sizeCanvas(canvas, imgCache);
      cancelReveal = pixelatedReveal(canvas, imgCache, 800);
    }, 360);

    // Screen 04 glitch word fires on entry
    if (glitch) {
      setTimeout(() => glitch.start(), 200);
    }
  }

  function deactivate() {
    if (cancelReveal)  { cancelReveal(); cancelReveal = null; }
    if (revealTimerId) { clearTimeout(revealTimerId); revealTimerId = null; }
    if (glitch)        glitch.stop();
    pauseVideo();
  }

  return { activate, deactivate };
}

/* ============================================================
   initNarrativeScreens — public entry point
   ============================================================ */
export function initNarrativeScreens() {
  const screens = NARRATIVE_CONFIG.map(cfg => ({
    ...setupNarrativeScreen(cfg),
    screenIndex: cfg.screenIndex,
  }));

  // Handle screen changes
  const unsub = onScreenChange((next, prev) => {
    // Deactivate the screen we left (if it was a narrative screen)
    const leaving = screens.find(s => s.screenIndex === prev);
    if (leaving) leaving.deactivate();

    // Activate the screen we entered (if it's a narrative screen)
    const entering = screens.find(s => s.screenIndex === next);
    if (entering) entering.activate();
  });

  return () => unsub();
}
