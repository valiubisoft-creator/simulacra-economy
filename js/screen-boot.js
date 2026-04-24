/* ============================================================
   screen-boot.js — Phase Boot Sequence (PRD v2 Act 2)
   Terminal-style loader between narrative screens and strata view.
   Types out 55 keywords grouped by phase, counts up codification
   scores, then auto-advances. Skippable via any key or click.
   ============================================================ */

import { onScreenChange, goTo, BOOT_SCREEN_INDEX } from './screen-manager.js';
import { setNavLocked } from './nav.js';
import { getBubbles, getPhases } from './data.js';

const STRATA_SCREEN_INDEX = BOOT_SCREEN_INDEX + 1;

const CHAR_DELAY_MS       = 18;
const PHASE_HOLD_MS       = 180;
const KEYWORD_HOLD_MS     = 60;
const SCORE_TWEEN_MS      = 380;
const END_HOLD_MS         = 800;
const SKIP_GRACE_MS       = 500;   /* ignore skip keys in first 500ms — avoids arrow auto-repeat triggering skip */
const SHOWN_KEYWORDS_PER_PHASE = 3;

let sectionEl = null;
let terminalEl = null;
let runId = 0;                    /* invalidates any in-flight animation on deactivate */
let cleanup = null;

export function initScreenBoot() {
  sectionEl = document.getElementById('screen-boot');
  if (!sectionEl) return;
  terminalEl = sectionEl.querySelector('.boot-terminal');

  onScreenChange((newIdx, prevIdx) => {
    if (newIdx === BOOT_SCREEN_INDEX) activate();
    else if (prevIdx === BOOT_SCREEN_INDEX) deactivate();
  });
}

function activate() {
  runId++;
  const myRun = runId;
  const mountedAt = performance.now();
  setNavLocked(true);

  const skip = () => {
    if (myRun !== runId) return;
    if (performance.now() - mountedAt < SKIP_GRACE_MS) return;
    advance();
  };
  /* Any-key / click skip. Captured locally; nav.js is locked so arrows
     fall through to this handler instead of advancing screens. */
  const onKey = (e) => {
    /* Ignore modifier-only keypresses and auto-repeated keys */
    if (e.repeat) return;
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    skip();
  };
  const onClick = () => skip();

  window.addEventListener('keydown', onKey);
  sectionEl.addEventListener('click', onClick);

  cleanup = () => {
    window.removeEventListener('keydown', onKey);
    sectionEl.removeEventListener('click', onClick);
    setNavLocked(false);
  };

  if (prefersReducedMotion()) {
    renderEndState();
    setTimeout(() => { if (myRun === runId) advance(); }, END_HOLD_MS);
    return;
  }

  runTypewriter(myRun).then(() => {
    if (myRun !== runId) return;
    setTimeout(() => { if (myRun === runId) advance(); }, END_HOLD_MS);
  });
}

function deactivate() {
  runId++;                                  /* cancel any pending awaits */
  if (cleanup) { cleanup(); cleanup = null; }
  if (terminalEl) terminalEl.innerHTML = '';
}

function advance() {
  goTo(STRATA_SCREEN_INDEX);
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ============================================================
   Typewriter — types phase headers + first N keywords per phase
   ============================================================ */
async function runTypewriter(myRun) {
  const phases  = getPhases();
  const bubbles = getBubbles();
  const phaseKeys = Object.keys(phases);

  if (!phaseKeys.length || !bubbles.length) {
    renderEndState();
    return;
  }

  terminalEl.innerHTML = '';

  await typeLine(myRun, '> INITIALISING SIMULACRA ARCHIVE', { classMap: { 0: 'prompt' } });
  if (myRun !== runId) return;
  appendStaticLine(divider());
  await wait(120);

  let phaseNum = 0;
  for (const pk of phaseKeys) {
    if (myRun !== runId) return;
    phaseNum++;

    const ph = phases[pk];
    const header = `> PHASE_0${phaseNum} / ${ph.label.toUpperCase()} · ${ph.years}`;
    await typeLine(myRun, header, { classMap: { 0: 'prompt' } });
    if (myRun !== runId) return;

    const phaseBubbles = bubbles.filter(b => b.phase === pk);
    const shown        = phaseBubbles.slice(0, SHOWN_KEYWORDS_PER_PHASE);

    for (const bubble of shown) {
      if (myRun !== runId) return;
      await typeKeywordLine(myRun, bubble);
      await wait(KEYWORD_HOLD_MS);
    }
    const remaining = phaseBubbles.length - shown.length;
    if (remaining > 0) {
      appendStaticLine(`    <span class="dim">[+${remaining} terms]</span>`);
    }
    await wait(PHASE_HOLD_MS);
  }

  if (myRun !== runId) return;
  appendStaticLine(divider());
  await typeLine(myRun, `> ${bubbles.length} TERMS INDEXED · 4 ORDERS MAPPED`, { classMap: { 0: 'prompt', 2: 'bright' } });
  if (myRun !== runId) return;
  appendStaticLine(`<span class="prompt">&gt;</span> <span class="bright">ARCHIVE READY. ENTERING THE STRATA.</span> <span class="cursor">▓</span>`);
}

/* Types a single line character-by-character. After completion, applies
   colour classes to specific words via classMap (word index → class name).
   The `>` prompt and phase names stay clean; this keeps the typing output
   uniform then re-styles once the line is done. */
async function typeLine(myRun, text, opts = {}) {
  const line = appendLine();
  for (let i = 1; i <= text.length; i++) {
    if (myRun !== runId) return;
    line.textContent = text.slice(0, i);
    await wait(CHAR_DELAY_MS);
  }
  if (opts.classMap) applyClassMap(line, text, opts.classMap);
}

function applyClassMap(line, text, classMap) {
  const parts = text.split(' ');
  line.innerHTML = parts
    .map((word, idx) => {
      const cls = classMap[idx];
      return cls ? `<span class="${cls}">${escapeHtml(word)}</span>` : escapeHtml(word);
    })
    .join(' ');
}

/* Keyword line with dot-leader and animated score count-up.
   Format:   <indent>term<dots>score */
async function typeKeywordLine(myRun, bubble) {
  const line = appendLine();
  const indent = '    ';
  const label  = bubble.term;
  const final  = bubble.codification_score;

  /* Type the label first */
  for (let i = 1; i <= label.length; i++) {
    if (myRun !== runId) return;
    line.textContent = indent + label.slice(0, i);
    await wait(CHAR_DELAY_MS);
  }
  if (myRun !== runId) return;

  const dotsCount = Math.max(3, 32 - label.length);
  const dotSpan   = `<span class="dim">${'.'.repeat(dotsCount)}</span>`;
  line.innerHTML  = `${indent}${escapeHtml(label)}${dotSpan}<span class="score">0.0</span>`;
  const scoreEl = line.querySelector('.score');

  await tweenScore(myRun, scoreEl, final);
}

function tweenScore(myRun, el, finalVal) {
  return new Promise((resolve) => {
    const start = performance.now();
    function step(now) {
      if (myRun !== runId) { resolve(); return; }
      const t = Math.min((now - start) / SCORE_TWEEN_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (finalVal * eased).toFixed(1);
      if (t < 1) requestAnimationFrame(step);
      else { el.textContent = finalVal.toFixed(1); resolve(); }
    }
    requestAnimationFrame(step);
  });
}

function appendLine() {
  const el = document.createElement('div');
  el.className = 'boot-line';
  terminalEl.appendChild(el);
  return el;
}

function appendStaticLine(html) {
  const el = appendLine();
  el.innerHTML = html;
  return el;
}

function divider() {
  return `<span class="dim">${'─'.repeat(40)}</span>`;
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* ============================================================
   Reduced-motion: skip the typewriter, render the end state.
   ============================================================ */
function renderEndState() {
  const phases  = getPhases();
  const bubbles = getBubbles();
  const phaseKeys = Object.keys(phases);

  terminalEl.innerHTML = '';
  appendStaticLine(`<span class="prompt">&gt;</span> <span class="bright">INITIALISING SIMULACRA ARCHIVE</span>`);
  appendStaticLine(divider());

  phaseKeys.forEach((pk, i) => {
    const ph    = phases[pk];
    const count = bubbles.filter((b) => b.phase === pk).length;
    appendStaticLine(
      `<span class="prompt">&gt;</span> PHASE_0${i + 1} / ${escapeHtml(ph.label.toUpperCase())} <span class="dim">· ${escapeHtml(ph.years)}</span>`
    );
    appendStaticLine(`    <span class="dim">[${count} terms loaded]</span>`);
  });

  appendStaticLine(divider());
  appendStaticLine(`<span class="prompt">&gt;</span> <span class="bright">${bubbles.length} TERMS INDEXED · 4 ORDERS MAPPED</span>`);
  appendStaticLine(`<span class="prompt">&gt;</span> <span class="bright">ARCHIVE READY. ENTERING THE STRATA.</span> <span class="cursor">▓</span>`);
}
