/* ============================================================
   screen-manager.js
   Owns which of the 8 screens is currently .active and keeps
   the 8-dot #dot-nav in sync. Stateless on content — just class
   toggling.

   Screens (DOM order, 1:1 with dots):
     0  screen-01        Intro
     1  screen-order-i   Order I   — Before the Fall       (Pre-COVID)
     2  screen-order-ii  Order II  — The Cage Opens         (Lockdown)
     3  screen-order-iii Order III — The Simulation Deepens (Deep Lockdown)
     4  screen-order-iv  Order IV  — The New Normal         (Post-COVID)
     5  screen-boot      Phase Boot Sequence
     6  screen-strata    Archive Strata
     7  screen-06        Closing
   ============================================================ */

export const TOTAL_SCREENS = 8;
export const BOOT_SCREEN_INDEX = 5;

const state = {
  currentScreen: 0,
  listeners: new Set(),
};

let sectionEls = [];
let dotEls = [];

export function initScreenManager() {
  sectionEls = Array.from(document.querySelectorAll('.screen'));
  dotEls = Array.from(document.querySelectorAll('#dot-nav .dot'));

  if (sectionEls.length !== TOTAL_SCREENS) {
    console.warn(
      `screen-manager: expected ${TOTAL_SCREENS} .screen elements, found ${sectionEls.length}`
    );
  }
  if (dotEls.length !== TOTAL_SCREENS) {
    console.warn(
      `screen-manager: expected ${TOTAL_SCREENS} dots, found ${dotEls.length}`
    );
  }

  dotEls.forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(i));
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goTo(i);
      }
    });
  });

  applyActive();
}

export function goTo(n) {
  const target = Math.max(0, Math.min(TOTAL_SCREENS - 1, n));
  if (target === state.currentScreen) return;
  const previous = state.currentScreen;
  state.currentScreen = target;
  applyActive();
  state.listeners.forEach((fn) => {
    try { fn(target, previous); } catch (err) { console.error(err); }
  });
}

export function next() { goTo(state.currentScreen + 1); }
export function prev() { goTo(state.currentScreen - 1); }
export function getCurrent() { return state.currentScreen; }

export function onScreenChange(fn) {
  state.listeners.add(fn);
  return () => state.listeners.delete(fn);
}

function applyActive() {
  sectionEls.forEach((el, i) => {
    el.classList.toggle('active', i === state.currentScreen);
    el.setAttribute('aria-hidden', i === state.currentScreen ? 'false' : 'true');
  });
  dotEls.forEach((dot, i) => {
    const active = i === state.currentScreen;
    dot.classList.toggle('active', active);
    dot.setAttribute('aria-selected', active ? 'true' : 'false');
    dot.setAttribute('tabindex', active ? '0' : '-1');
  });

  const prevArrows = document.querySelectorAll('.screen-arrow.prev');
  const nextArrows = document.querySelectorAll('.screen-arrow.next');
  prevArrows.forEach((a) =>
    a.setAttribute('aria-disabled', state.currentScreen === 0 ? 'true' : 'false')
  );
  nextArrows.forEach((a) =>
    a.setAttribute(
      'aria-disabled',
      state.currentScreen === TOTAL_SCREENS - 1 ? 'true' : 'false'
    )
  );
}
