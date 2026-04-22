/* ============================================================
   audio.js — Chunk 08: full sound layer
   - Howler.js sprite: loaded from assets/audio/sfx-sprite.webm/.mp3
     (file provided by user; stubbed timestamps ready to wire)
   - ZzFX: procedural effects — ticks, glitches, sweeps (zero assets)
   - Global mute gate: all sounds respect audioEnabled flag
   - localStorage key: 'discombobulate_audio' ('on'|'off'), default OFF
   - prefers-reduced-motion → forces OFF
   ============================================================ */

const STORAGE_KEY = 'discombobulate_audio';
const ICON_ON  = '<i class="ph ph-speaker-high"></i>';
const ICON_OFF = '<i class="ph ph-speaker-slash"></i>';

/* ============================================================
   ZzFX — Frank Force's 1KB procedural sound engine
   https://killedbyapixel.github.io/ZzFX/
   Inlined so no external request is needed.
   ============================================================ */
/* global AudioContext */
let _zzfxCtx = null;
function _getCtx() {
  if (!_zzfxCtx) _zzfxCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _zzfxCtx;
}

function zzfx(...p) {
  let b, e, f, c, t, d, g, h, n, r, q, x, l, m, s,
    a, u, v, w, y = 0,
    z = []; // result
  const [
    volume=1, randomness=.05, freq=220, attack=0, sustain=0, release=.1,
    shape=0, shapeCurve=1, slide=0, deltaSlide=0, pitchJump=0,
    pitchJumpTime=0, repeatTime=0, noise=0, modulation=0,
    bitCrush=0, delay=0, sustainVolume=1, decay=0, tremolo=0,
  ] = p;
  try {
    const ctx = _getCtx();
    const sampleRate = ctx.sampleRate;
    b = 2 * Math.PI;
    e = sampleRate;
    l = sampleRate * release;
    f = freq * (1 + 2 * randomness * Math.random() - randomness);
    c = 0; t = 0; d = 0; g = 0; h = 0; n = 1; r = 0; q = 0;
    x = Math.PI * 2;
    m = sampleRate * attack;
    s = m + sampleRate * sustain;
    a = s + sampleRate * decay;
    u = sampleRate / (modulation || 1);
    v = b * slide / sampleRate;
    w = b * deltaSlide / sampleRate;
    const L = a + l + sampleRate * delay * 2;
    for (let i = 0; i < L; i++) {
      r += (n = noise ? 2 * Math.random() - 1 : 0) * noise;
      f += v += w;
      t += (pitchJump && !(++t % (0 | sampleRate * pitchJumpTime))) ? (f += pitchJump) * 0 : 0;
      g = (g += (b * f) / sampleRate) % x;
      c = shape == 0 ? Math.sin(g) :
          shape == 1 ? g < Math.PI ? 1 : -1 :
          shape == 2 ? 1 - 2 * g / x :
          shape == 3 ? Math.abs(1 - 2 * g / x) - 1 :
          shape == 4 ? (g < Math.PI * 0.4 ? 1 : g < Math.PI ? 0 : g < Math.PI * 1.4 ? -1 : 0) :
          Math.sin(Math.pow(g / x, shapeCurve) * x);
      q = 1 - (bitCrush ? i % (0 | sampleRate / bitCrush) / (sampleRate / bitCrush) : 0);
      y = c * (1 - tremolo * Math.sin(i * x / (sampleRate * (tremolo > 0 ? 4 : 1))));
      y = volume * (i < m ? y * i / m :
          i < s ? y : i < a ? y * (a - i) / (a - s) * sustainVolume :
          i < a + l ? y * (l - (i - a)) / l : 0) * q;
      z.push(Math.max(-1, Math.min(1, y + r)));
    }
    const buf  = ctx.createBuffer(1, z.length, sampleRate);
    const chan = buf.getChannelData(0);
    chan.set(z);
    const src  = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
    return src;
  } catch(_) { return null; }
}

/* ============================================================
   ZzFX sound presets
   ============================================================ */
const SFX = {
  districtHover:  ()      => zzfx(...[.3,,220,,,.01,3,1.2,,,,,,1]),
  districtOpen:   ()      => zzfx(...[.4,,80,.05,.1,.15,4,.5,,,,,,.3,,.1]),
  districtClose:  ()      => zzfx(...[.3,,440,.05,.05,.05,3,2,,,-200,.1]),
  gifReveal:      ()      => zzfx(...[.4,,60,.05,.1,.2,4,.4,,,,,,.4,,.15]),
  nodeHover:      (idx=0) => zzfx(...[.25,,200+(idx*36),,,.01,3,.9,,,,,,1]),
  restart:        ()      => zzfx(...[.4,,440,.1,.05,.05,3,2,,,-300,.1]),
  staticBurst:    ()      => zzfx(...[.5,,100,.01,.05,.1,4,.3,,,,,,.6,,.2]),
  sweep:          ()      => zzfx(...[.3,,300,.05,.1,.05,1,1.5,50]),
};

/* ============================================================
   Howler sprite stub
   Populated once user provides assets/audio/sfx-sprite.webm/.mp3.
   Timestamps are approximate — adjust to match the actual sprite.
   ============================================================ */
let Howl = null;
let _sfxSprite = null;
let _heartbeatId = null;

function _tryLoadHowler() {
  if (typeof window.Howl !== 'undefined') {
    Howl = window.Howl;
    _sfxSprite = new Howl({
      src: ['assets/audio/sfx-sprite.webm', 'assets/audio/sfx-sprite.mp3'],
      sprite: {
        crtHum:       [0,    1200],
        staticBurst:  [1500, 500 ],
        dialup:       [2200, 1200],
        sweepBeep:    [3600, 600 ],
        dissolve:     [4400, 1000],
        districtOpen: [5600, 400 ],
        districtClose:[6200, 300 ],
        heartbeat:    [6700, 1350],
        paperRustle:  [8200, 500 ],
        restart:      [8900, 400 ],
      },
      onloaderror: () => { console.info('audio.js: Howler sprite not found — ZzFX only'); _sfxSprite = null; },
    });
  }
}

/* ============================================================
   Toggle state machine
   ============================================================ */
const state = {
  audioEnabled: false,
  forceOff:     false,
  btn:          null,
};

export function initAudio() {
  state.btn = document.getElementById('audio-toggle');
  if (!state.btn) { console.warn('audio.js: #audio-toggle not found'); return; }

  const mq       = window.matchMedia('(prefers-reduced-motion: reduce)');
  state.forceOff = mq.matches;

  const stored          = _readStored();
  state.audioEnabled    = state.forceOff ? false : stored;

  state.btn.addEventListener('click', _toggle);
  state.btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _toggle(); }
  });

  mq.addEventListener('change', (e) => {
    state.forceOff = e.matches;
    if (state.forceOff) state.audioEnabled = false;
    _render();
  });

  /* Load Howler after first user interaction — avoids Safari autoplay block */
  document.addEventListener('click', _tryLoadHowler, { once: true });

  _render();
}

export function isAudioEnabled() { return state.audioEnabled; }

/* ---- playSound: gate all calls behind audioEnabled ---- */
export function playSound(fn) {
  if (!state.audioEnabled) return;
  try { fn(); } catch (_) {}
}

/* ---- Howler helpers (fall back silently if sprite not loaded) ---- */
export function playSprite(name) {
  if (!state.audioEnabled || !_sfxSprite) return;
  try { _sfxSprite.play(name); } catch (_) {}
}

export function playHeartbeat() {
  if (!state.audioEnabled || !_sfxSprite) return;
  try { _heartbeatId = _sfxSprite.play('heartbeat'); } catch (_) {}
}

export function stopHeartbeat() {
  if (_heartbeatId !== null && _sfxSprite) {
    try { _sfxSprite.stop(_heartbeatId); } catch (_) {}
    _heartbeatId = null;
  }
}

/* ---- ZzFX sound exports ---- */
export const playSFX = {
  districtHover:  (idx)  => playSound(() => SFX.districtHover()),
  districtOpen:   ()     => playSound(() => SFX.districtOpen()),
  districtClose:  ()     => playSound(() => SFX.districtClose()),
  gifReveal:      ()     => playSound(() => SFX.gifReveal()),
  nodeHover:      (idx)  => playSound(() => SFX.nodeHover(idx)),
  restart:        ()     => playSound(() => SFX.restart()),
  staticBurst:    ()     => playSound(() => SFX.staticBurst()),
  sweep:          ()     => playSound(() => SFX.sweep()),
};

/* ---- Screen-transition sounds ---- */
export function playTransitionSound(fromIdx, toIdx) {
  if (!state.audioEnabled) return;
  const map = {
    '1>2': () => playSprite('crtHum')     || playSound(() => SFX.districtHover()),
    '2>3': () => playSprite('staticBurst')|| playSound(() => SFX.staticBurst()),
    '3>4': () => playSprite('dialup')     || playSound(() => SFX.sweep()),
    '4>5': () => playSprite('sweepBeep')  || playSound(() => SFX.sweep()),
    '5>6': () => playSprite('dissolve')   || playSound(() => SFX.districtClose()),
  };
  const key = `${fromIdx}>${toIdx}`;
  map[key]?.();
}

/* ============================================================
   Internal helpers
   ============================================================ */
function _toggle() {
  if (state.forceOff) { _render(); return; }
  state.audioEnabled = !state.audioEnabled;
  if (_sfxSprite) window.Howler?.mute(!state.audioEnabled);
  try { localStorage.setItem(STORAGE_KEY, state.audioEnabled ? 'on' : 'off'); } catch (_) {}
  _render();
}

function _readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'on';
  } catch (_) { return false; }
}

function _render() {
  if (!state.btn) return;
  state.btn.innerHTML = state.audioEnabled ? ICON_ON : ICON_OFF;
  state.btn.setAttribute('aria-pressed', state.audioEnabled ? 'true' : 'false');
  state.btn.setAttribute('aria-label', state.audioEnabled ? 'Turn sound off' : 'Turn sound on');
  state.btn.dataset.state    = state.audioEnabled ? 'on' : 'off';
  state.btn.dataset.forceOff = state.forceOff ? 'true' : 'false';
}
