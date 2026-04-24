/* ============================================================
   main.js
   App entry point. Wires screen manager, nav, audio, data stub.
   ============================================================ */

import { initScreenManager, onScreenChange } from './screen-manager.js';
import { initNav } from './nav.js';
import { initAudio } from './audio.js';
import { initScreen01 } from './screen-01.js';
import { initBaudrillardScreens } from './screen-baudrillard.js';
import { initScreenBoot } from './screen-boot.js';
import { initScreenStrata } from './screen-strata.js';
import { initScreen06 } from './screen-06.js';
import { loadData, getCachedData } from './data.js';
import { initA11y } from './a11y.js';

async function boot() {
  initAudio();
  initScreenManager();
  initNav();

  /* Track current screen on body so CSS can show/hide chrome per screen.
     Used to hide the DISCOMBOBULATE wordmark on every screen except the intro. */
  document.body.dataset.screenIdx = '0';
  onScreenChange((next) => {
    document.body.dataset.screenIdx = String(next);
  });
  initScreen01();
  initScreen06();
  initA11y();

  /* Load data BEFORE mounting screens that read from the cache */
  const data = await loadData();
  window.__discombobulateData = data;

  initBaudrillardScreens();
  initScreenBoot();
  initScreenStrata();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
