/* ============================================================
   a11y.js — Chunk 09: accessibility + polish
   Focus trap · visible focus rings · keyboard shortcuts audit
   prefers-reduced-motion enforcement · video preload optimisation
   ============================================================ */

import { onScreenChange, goTo, getCurrent, TOTAL_SCREENS } from './screen-manager.js';

/* ============================================================
   Focus trap — used by both modals
   ============================================================ */
const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

export function trapFocus(containerEl) {
  const els = () => [...containerEl.querySelectorAll(FOCUSABLE)].filter(e => !e.closest('[hidden]'));

  function onKeydown(e) {
    if (e.key !== 'Tab') return;
    const focusable = els();
    if (!focusable.length) { e.preventDefault(); return; }
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }

  containerEl.addEventListener('keydown', onKeydown);
  /* Focus first element */
  const firstFocusable = els()[0];
  firstFocusable?.focus();

  return () => containerEl.removeEventListener('keydown', onKeydown);
}

/* ============================================================
   Video preload optimisation
   Preload the next screen's video when the current screen loads.
   Only applies to narrative screens (indices 1–4).
   ============================================================ */
const VIDEO_SRCS = {
  1: 'assets/mp4/Video_02.mp4',
  2: 'assets/mp4/Video_03.mp4',
  3: 'assets/mp4/Video_04.mp4',
  4: 'assets/mp4/Video_05.mp4',
};

function preloadNextVideo(currentIdx) {
  const nextSrc = VIDEO_SRCS[currentIdx + 1];
  if (!nextSrc) return;
  /* Find the next screen's video and set preload="auto" to start buffering */
  const nextSection = document.querySelector(`#screen-0${currentIdx + 2}`);
  const nextVideo   = nextSection?.querySelector('video');
  if (nextVideo && nextVideo.getAttribute('preload') === 'none') {
    nextVideo.setAttribute('preload', 'auto');
  }
}

/* ============================================================
   Canvas / animation loop pause when screen is hidden
   (Belt-and-suspenders on top of per-module stop calls)
   ============================================================ */
function enforceIntersection() {
  if (!('IntersectionObserver' in window)) return;
  /* The matrix canvas on screen-01 */
  const matrixCanvas = document.getElementById('matrix-canvas');
  if (!matrixCanvas) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      /* screen-01 manages its own start/stop via onScreenChange;
         this is a safety fallback for cases where the screen is
         scrolled out of view (not applicable in our fixed layout,
         but kept as defensive code). */
      if (!entry.isIntersecting) {
        matrixCanvas.dataset.paused = 'true';
      } else {
        delete matrixCanvas.dataset.paused;
      }
    });
  }, { threshold: 0.1 });

  obs.observe(document.getElementById('screen-01') || matrixCanvas);
}

/* ============================================================
   Dot nav — add explicit tabindex roving + ARIA selected
   (supplementing what screen-manager already does)
   ============================================================ */
function enhanceDotNav() {
  const dots = [...document.querySelectorAll('#dot-nav .dot')];
  dots.forEach((dot, i) => {
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Screen ${i + 1}`);
    dot.setAttribute('tabindex', i === 0 ? '0' : '-1');
    /* Arrow-key roving within dot nav */
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); dots[(i + 1) % dots.length].focus(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); dots[(i - 1 + dots.length) % dots.length].focus(); }
    });
  });
}

/* ============================================================
   Reduced motion: enforce on all animated elements
   ============================================================ */
function enforceReducedMotion() {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function apply(matches) {
    document.body.classList.toggle('reduced-motion', matches);
    if (matches) {
      /* Stop matrix canvas immediately */
      document.getElementById('matrix-canvas')?.setAttribute('data-paused', 'true');
    }
  }
  apply(mq.matches);
  mq.addEventListener('change', e => apply(e.matches));
}

/* ============================================================
   Lazy-load images
   ============================================================ */
function addLazyLoading() {
  document.querySelectorAll('img:not([loading])').forEach(img => {
    img.setAttribute('loading', 'lazy');
  });
}

/* ============================================================
   Screen-change handler: preload next video only.
   Focus is intentionally NOT moved on screen change — nav.js listens
   on window so keyboard nav works without it, and auto-focusing the
   prev-arrow leaves a visible :focus-visible ring on keyboard users.
   ============================================================ */
function wireScreenChangePolish() {
  onScreenChange((next) => {
    preloadNextVideo(next);
  });
}

/* ============================================================
   Home / End key navigation
   ============================================================ */
function wireHomeEnd() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    if (e.key === 'End')  { e.preventDefault(); goTo(TOTAL_SCREENS - 1); }
  });
}

/* ============================================================
   initA11y — called from main.js
   ============================================================ */
export function initA11y() {
  enforceReducedMotion();
  enhanceDotNav();
  addLazyLoading();
  enforceIntersection();
  wireScreenChangePolish();
  wireHomeEnd();
}
