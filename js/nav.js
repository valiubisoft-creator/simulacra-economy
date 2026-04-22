/* ============================================================
   nav.js
   Arrow keys, scroll (wheel + touch), on-screen arrow buttons.
   Scroll is debounced to 800ms so one flick = one screen.
   A `navLocked` flag lets modals (Chunks 05/06) suppress nav.
   ============================================================ */

import { next, prev, goTo } from './screen-manager.js';

const SCROLL_DEBOUNCE_MS = 800;

let navLocked = false;
let scrollCooldownUntil = 0;
let touchStartY = null;

export function initNav() {
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });

  document.querySelectorAll('.screen-arrow').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (navLocked) return;
      if (btn.getAttribute('aria-disabled') === 'true') return;
      if (btn.classList.contains('next')) next();
      else if (btn.classList.contains('prev')) prev();
    });
  });
}

export function setNavLocked(locked) { navLocked = !!locked; }
export function isNavLocked() { return navLocked; }

function onKeydown(e) {
  if (navLocked) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    next();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    prev();
  } else if (e.key === 'Home') {
    e.preventDefault();
    goTo(0);
  } else if (e.key === 'End') {
    e.preventDefault();
    goTo(5);
  }
}

function onWheel(e) {
  if (navLocked) return;
  const now = performance.now();
  if (now < scrollCooldownUntil) return;
  if (Math.abs(e.deltaY) < 10) return;
  scrollCooldownUntil = now + SCROLL_DEBOUNCE_MS;
  if (e.deltaY > 0) next();
  else prev();
}

function onTouchStart(e) {
  if (navLocked) return;
  touchStartY = e.touches[0]?.clientY ?? null;
}

function onTouchEnd(e) {
  if (navLocked || touchStartY == null) return;
  const endY = e.changedTouches[0]?.clientY;
  if (endY == null) { touchStartY = null; return; }
  const dy = touchStartY - endY;
  touchStartY = null;
  if (Math.abs(dy) < 40) return;
  const now = performance.now();
  if (now < scrollCooldownUntil) return;
  scrollCooldownUntil = now + SCROLL_DEBOUNCE_MS;
  if (dy > 0) next();
  else prev();
}
