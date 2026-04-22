/* ============================================================
   screen-manager.js
   Owns which of the 6 screens is currently .active and keeps
   #dot-nav in sync. Stateless on content — just class toggling.
   ============================================================ */

export const TOTAL_SCREENS = 6;

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
    dot.classList.toggle('active', i === state.currentScreen);
    dot.setAttribute('aria-selected', i === state.currentScreen ? 'true' : 'false');
    dot.setAttribute('tabindex', i === state.currentScreen ? '0' : '-1');
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
