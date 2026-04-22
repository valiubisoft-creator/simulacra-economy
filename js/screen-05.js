/* ============================================================
   screen-05.js — Districts (card grid + modal)
   Video background · 8 district cards in a 4×2 grid · modal on click
   Pause + B&W toggles · entry stagger animation · no UI sounds
   ============================================================ */

import { onScreenChange } from './screen-manager.js';
import { DISTRICTS } from './districts-data.js';

/* Opener registered by modal-district.js via setDistrictModalOpener */
let _openModal = (districtId) => {
  console.info('[screen-05] modal opener not yet registered — district', districtId);
};

export function setDistrictModalOpener(fn) { _openModal = fn; }

/* ============================================================
   Card restoration — called by modal on close
   ============================================================ */
export function restoreDistrictCards() {
  const cards = [...document.querySelectorAll('.district-card')];
  cards.forEach((c, i) => {
    c.classList.remove('card-selected', 'card-hidden');
    c.style.transitionDelay = `${i * 50}ms`;
  });
  setTimeout(
    () => cards.forEach(c => (c.style.transitionDelay = '')),
    cards.length * 50 + 500
  );
}

/* ============================================================
   initScreen05
   ============================================================ */
export function initScreen05() {
  const section = document.getElementById('screen-05');
  if (!section) return;

  const grid        = document.getElementById('districts-grid');
  const video       = section.querySelector('.districts-video');
  const instruction = section.querySelector('.districts-instruction');
  const pauseBtn    = document.getElementById('districts-pause');
  const bwBtn       = document.getElementById('districts-bw');

  let isPaused = false;
  let isBW     = false;
  let instTimer = null;

  /* Render cards */
  DISTRICTS.forEach(d => grid.appendChild(buildCard(d)));

  /* Controls */
  pauseBtn?.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.setAttribute('aria-pressed', isPaused ? 'true' : 'false');
    if (isPaused) {
      video?.pause();
      section.classList.add('animations-paused');
    } else {
      video?.play().catch(() => {});
      section.classList.remove('animations-paused');
    }
  });

  bwBtn?.addEventListener('click', () => {
    isBW = !isBW;
    bwBtn.setAttribute('aria-pressed', isBW ? 'true' : 'false');
    section.classList.toggle('bw-mode', isBW);
  });

  /* Lifecycle */
  function activate() {
    playVideo();
    staggerCardsIn();
    instTimer = setTimeout(() => instruction?.classList.add('visible'), 1000);
  }

  function deactivate() {
    video?.pause();
    clearTimeout(instTimer);
    hideCards();
    instruction?.classList.remove('visible');
    if (isPaused) {
      isPaused = false;
      pauseBtn?.setAttribute('aria-pressed', 'false');
      section.classList.remove('animations-paused');
    }
  }

  onScreenChange((next, prev) => {
    if (next === 4) activate();
    else if (prev === 4) deactivate();
  });

  /* Helpers */
  function playVideo() {
    if (!video) return;
    const setRate = () => { video.playbackRate = 0.5; };
    if (video.readyState >= 2) setRate();
    else video.addEventListener('canplay', setRate, { once: true });

    if (video.readyState === 0) { video.setAttribute('preload', 'auto'); video.load(); }

    video.play().catch(() => {
      /* Fall back to the next user gesture if autoplay was blocked */
      const resume = () => {
        video.play().catch(() => {});
        document.removeEventListener('pointerdown', resume);
        document.removeEventListener('keydown', resume);
      };
      document.addEventListener('pointerdown', resume, { once: true });
      document.addEventListener('keydown',     resume, { once: true });
    });
  }

  function staggerCardsIn() {
    const cards = [...document.querySelectorAll('.district-card')];
    cards.forEach((c, i) => {
      c.style.transitionDelay = `${i * 80}ms`;
      requestAnimationFrame(() => c.classList.add('card-visible'));
    });
    setTimeout(
      () => cards.forEach(c => (c.style.transitionDelay = '')),
      cards.length * 80 + 400
    );
  }

  function hideCards() {
    document.querySelectorAll('.district-card').forEach(c => {
      c.classList.remove('card-visible', 'card-selected', 'card-hidden');
    });
  }
}

/* ============================================================
   Build a single district card
   ============================================================ */
function buildCard(d) {
  const card = document.createElement('button');
  card.className = 'district-card';
  card.dataset.district = d.id;
  card.setAttribute('type', 'button');
  card.setAttribute('aria-label', `Open ${d.name} district`);
  /* Scatter positions from PRD — arranged around the subject in Video_05 */
  card.style.top  = d.top;
  card.style.left = d.left;
  card.style.setProperty('--district-color', d.colour);

  card.innerHTML = `
    <div class="card-index">0${d.id}</div>
    <div class="card-symbol">${d.symbol}</div>
    <div class="card-name">${d.name}</div>
    <div class="card-keyword">${d.keyword}</div>
    <div class="card-bar">
      <div class="bar-track">
        <div class="bar-fill" style="--bar-width: ${d.score}%"></div>
      </div>
      <span class="bar-score">${d.score}</span>
    </div>
  `;

  /* Hover: tint symbol to district colour + glow + animate bar fill */
  card.addEventListener('mouseenter', () => {
    card.querySelector('.card-symbol').style.color = d.colour;
    card.style.boxShadow = `0 0 24px ${hexToRgba(d.colour, 0.28)}`;
    const fill = card.querySelector('.bar-fill');
    if (!fill.classList.contains('bar-animated')) fill.classList.add('bar-animated');
  });

  card.addEventListener('mouseleave', () => {
    card.querySelector('.card-symbol').style.color = '';
    card.style.boxShadow = '';
  });

  card.addEventListener('click', () => handleCardClick(card, d.id));

  return card;
}

function handleCardClick(clickedCard, districtId) {
  clickedCard.classList.add('card-selected');
  document.querySelectorAll('.district-card').forEach(c => {
    if (c !== clickedCard) c.classList.add('card-hidden');
  });
  _openModal(districtId);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
