/* ============================================================
   main.js
   App entry point. Wires screen manager, nav, audio, data stub.
   ============================================================ */

import { initScreenManager } from './screen-manager.js';
import { initNav } from './nav.js';
import { initAudio } from './audio.js';
import { initScreen01 } from './screen-01.js';
import { initNarrativeScreens } from './screen-narrative.js';
import { loadData } from './data.js';

async function boot() {
  initAudio();
  initScreenManager();
  initNav();
  initScreen01();
  initNarrativeScreens();

  const data = await loadData();
  window.__discombobulateData = data;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('reduced-motion');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
