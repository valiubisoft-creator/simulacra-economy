/* ============================================================
   screen-narrative.js — Screens 02, 03, 04
   Videos play INSIDE the media column (not as fullscreen backgrounds).
   Background is solid black. Pixelated reveal lifts off the first
   video frame, then fades out to show the live video beneath.
   ============================================================ */

import { onScreenChange } from './screen-manager.js';

const NARRATIVE_CONFIG = [
  { screenIndex: 1, id: 'screen-02', videoSrc: 'assets/mp4/Video_02.mp4' },
  { screenIndex: 2, id: 'screen-03', videoSrc: 'assets/mp4/Video_03.mp4' },
  { screenIndex: 3, id: 'screen-04', videoSrc: 'assets/mp4/Video_04.mp4', hasGlitchWord: true },
];

/* ============================================================
   Pixelated reveal — first video frame edition
   1. Captures a frame from the playing video onto the canvas.
   2. Animates block size from 8px → 1px (cubic ease-out, 800ms).
   3. Fades the canvas out to reveal the live video underneath.
   ============================================================ */
function runPixelatedReveal(canvas, video, duration = 800) {
  const ctx       = canvas.getContext('2d');
  const W         = canvas.width;
  const H         = canvas.height;
  const offscreen = document.createElement('canvas');
  const offCtx    = offscreen.getContext('2d');

  // Capture current video frame as the source image for the reveal
  offscreen.width  = W;
  offscreen.height = H;
  offCtx.drawImage(video, 0, 0, W, H);

  const start = performance.now();
  let rafId   = null;

  function draw(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // cubic ease-out

    const blockSize = Math.max(1, Math.round(8 - 7 * eased));

    if (blockSize <= 1) {
      // Reveal complete — hide the canvas so the video shows through cleanly
      canvas.style.display = 'none';
      return;
    }

    const smallW = Math.ceil(W / blockSize);
    const smallH = Math.ceil(H / blockSize);

    // Temp canvas for downscale step
    const tmp    = document.createElement('canvas');
    tmp.width    = smallW;
    tmp.height   = smallH;
    const tmpCtx = tmp.getContext('2d');
    tmpCtx.imageSmoothingEnabled = true;
    tmpCtx.drawImage(offscreen, 0, 0, smallW, smallH);

    // Scale back up with nearest-neighbour = blocky pixels
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, smallW, smallH, 0, 0, W, H);

    rafId = requestAnimationFrame(draw);
  }

  rafId = requestAnimationFrame(draw);
  return () => { if (rafId) cancelAnimationFrame(rafId); };
}

/* ============================================================
   Screen 04 — "network" glitch word
   Rapid-cycles Redaction families 3 times, settles on 70.
   ============================================================ */
const GLITCH_FAMILIES = [
  "'Redaction10',  Georgia, serif",
  "'Redaction50',  Georgia, serif",
  "'Redaction70',  Georgia, serif",
  "'Redaction100', Georgia, serif",
];
const GLITCH_SETTLE = "'Redaction70', Georgia, serif";

function setupGlitchWord(el) {
  const totalSteps = GLITCH_FAMILIES.length * 3;
  let step = 0, id = null;

  function start() {
    if (id) stop();
    step = 0;
    el.style.fontFamily = GLITCH_FAMILIES[0];
    id = setInterval(() => {
      step++;
      if (step >= totalSteps) {
        clearInterval(id); id = null;
        el.style.fontFamily = GLITCH_SETTLE;
        return;
      }
      el.style.fontFamily = GLITCH_FAMILIES[step % GLITCH_FAMILIES.length];
    }, 100);
  }

  function stop() { if (id) { clearInterval(id); id = null; } }
  return { start, stop };
}

/* ============================================================
   Setup one narrative screen
   ============================================================ */
function setupNarrativeScreen(cfg) {
  const section = document.getElementById(cfg.id);
  if (!section) return { activate() {}, deactivate() {} };

  const video  = section.querySelector('.narrative-media-inner video');
  const canvas = section.querySelector('.narrative-media-inner canvas');
  const glitch = cfg.hasGlitchWord
    ? setupGlitchWord(document.getElementById('network-word'))
    : null;

  let cancelReveal  = null;
  let revealTimerId = null;

  /* ---------- Video helpers ---------- */
  function playVideo() {
    if (!video) return;

    const setRate = () => { video.playbackRate = 0.5; };
    if (video.readyState >= 2) setRate();
    else video.addEventListener('canplay', setRate, { once: true });

    if (video.readyState === 0) {
      video.setAttribute('preload', 'auto');
      video.load();
    }

    const tryPlay = () => video.play().catch(() => {
      /* Autoplay blocked — play on the next user gesture. Muted videos
         generally auto-play in modern browsers, but fall back cleanly. */
      const resume = () => {
        video.play().catch(() => {});
        document.removeEventListener('pointerdown', resume);
        document.removeEventListener('keydown', resume);
      };
      document.addEventListener('pointerdown', resume, { once: true });
      document.addEventListener('keydown',     resume, { once: true });
    });
    tryPlay();
  }

  function pauseVideo() { if (video) video.pause(); }

  /* ---------- Entry sequence ---------- */
  function activate() {
    if (cancelReveal)  { cancelReveal(); cancelReveal = null; }
    if (revealTimerId) { clearTimeout(revealTimerId); revealTimerId = null; }
    if (glitch) glitch.stop();

    // Show canvas again in case a previous reveal hid it
    if (canvas) canvas.style.display = 'block';

    section.classList.remove('narrative-entered');
    void section.offsetWidth;
    section.classList.add('narrative-entered');

    playVideo();

    const reducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.body.classList.contains('reduced-motion');

    if (reducedMotion) {
      if (canvas) canvas.style.display = 'none'; // skip reveal, show video directly
      if (glitch) glitch.start();
      return;
    }

    // Pixelated reveal — only runs if the video actually has a decoded frame.
    // If the video hasn't loaded yet (readyState < 2), we hide the canvas
    // instead of drawing a blank frame on top of the video.
    revealTimerId = setTimeout(() => {
      if (!video || !canvas) return;

      if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        canvas.style.display = 'none';
        return;
      }

      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;

      cancelReveal = runPixelatedReveal(canvas, video, 900);
    }, 80);

    if (glitch) setTimeout(() => glitch.start(), 200);
  }

  function deactivate() {
    if (cancelReveal)  { cancelReveal(); cancelReveal = null; }
    if (revealTimerId) { clearTimeout(revealTimerId); revealTimerId = null; }
    if (glitch) glitch.stop();
    pauseVideo();
    section.classList.remove('narrative-entered');
  }

  return { activate, deactivate };
}

/* ============================================================
   initNarrativeScreens
   ============================================================ */
export function initNarrativeScreens() {
  const screens = NARRATIVE_CONFIG.map(cfg => ({
    ...setupNarrativeScreen(cfg),
    screenIndex: cfg.screenIndex,
  }));

  const unsub = onScreenChange((next, prev) => {
    const leaving  = screens.find(s => s.screenIndex === prev);
    const entering = screens.find(s => s.screenIndex === next);
    if (leaving)  leaving.deactivate();
    if (entering) entering.activate();
  });

  return () => unsub();
}
