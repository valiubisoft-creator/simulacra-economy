/* ============================================================
   audio.js
   Chunk 01: toggle state machine only. Howler not loaded yet.
   - localStorage key: 'discombobulate_audio'  (values: 'on' | 'off')
   - Default: OFF
   - prefers-reduced-motion: reduce  →  forces OFF
   ============================================================ */

const STORAGE_KEY = 'discombobulate_audio';
const ICON_ON  = '<i class="ph ph-speaker-high"></i>';
const ICON_OFF = '<i class="ph ph-speaker-slash"></i>';

const state = {
  audioEnabled: false,
  forceOff: false,
  btn: null,
};

export function initAudio() {
  state.btn = document.getElementById('audio-toggle');
  if (!state.btn) {
    console.warn('audio.js: #audio-toggle not found');
    return;
  }

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  state.forceOff = mediaQuery.matches;

  const stored = readStored();
  state.audioEnabled = state.forceOff ? false : stored;

  state.btn.addEventListener('click', toggle);
  state.btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });

  mediaQuery.addEventListener('change', (e) => {
    state.forceOff = e.matches;
    if (state.forceOff && state.audioEnabled) {
      state.audioEnabled = false;
    }
    render();
  });

  render();
}

export function isAudioEnabled() { return state.audioEnabled; }

export function playSound(fn) {
  if (!state.audioEnabled) return;
  try { fn(); } catch (err) { /* silent fail */ }
}

function toggle() {
  if (state.forceOff) {
    render();
    return;
  }
  state.audioEnabled = !state.audioEnabled;
  try {
    localStorage.setItem(STORAGE_KEY, state.audioEnabled ? 'on' : 'off');
  } catch (err) { /* storage blocked — ignore */ }
  render();
}

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'on') return true;
    if (v === 'off') return false;
    return false;
  } catch (err) {
    return false;
  }
}

function render() {
  if (!state.btn) return;
  state.btn.innerHTML = state.audioEnabled ? ICON_ON : ICON_OFF;
  state.btn.setAttribute('aria-pressed', state.audioEnabled ? 'true' : 'false');
  state.btn.setAttribute(
    'aria-label',
    state.audioEnabled ? 'Turn sound off' : 'Turn sound on'
  );
  state.btn.dataset.state = state.audioEnabled ? 'on' : 'off';
  state.btn.dataset.forceOff = state.forceOff ? 'true' : 'false';
}
