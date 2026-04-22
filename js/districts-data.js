/* ============================================================
   districts-data.js
   Hardcoded district config for Chunk 04.
   Chunk 07 will replace scores/keywords with real data from
   keywords-cache.json — this file stays as the structural source.
   ============================================================ */

/* SVG symbol strings — stroke="currentColor" so CSS `color` drives tint.
   viewBox 0 0 80 80, strokeWidth 1.5, fill none throughout. */

const SVG = {

  /* 01 · The Screen — Eye */
  screen: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 40 Q40 13 72 40 Q40 67 8 40Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="40" cy="40" r="13" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="40" cy="40" r="5.5" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  /* 02 · The Body — Virus node */
  body: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="40" cy="40" r="12" stroke="currentColor" stroke-width="1.5"/>
    <line x1="52" y1="40" x2="67" y2="40" stroke="currentColor" stroke-width="1.5"/>
    <line x1="49" y1="49" x2="60" y2="60" stroke="currentColor" stroke-width="1.5"/>
    <line x1="40" y1="52" x2="40" y2="67" stroke="currentColor" stroke-width="1.5"/>
    <line x1="31" y1="49" x2="20" y2="60" stroke="currentColor" stroke-width="1.5"/>
    <line x1="28" y1="40" x2="13" y2="40" stroke="currentColor" stroke-width="1.5"/>
    <line x1="31" y1="31" x2="20" y2="20" stroke="currentColor" stroke-width="1.5"/>
    <line x1="40" y1="28" x2="40" y2="13" stroke="currentColor" stroke-width="1.5"/>
    <line x1="49" y1="31" x2="60" y2="20" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="67" cy="40" r="3.5" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="60" cy="60" r="3.5" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="40" cy="67" r="3.5" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="20" cy="60" r="3.5" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="13" cy="40" r="3.5" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="20" cy="20" r="3.5" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="40" cy="13" r="3.5" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="60" cy="20" r="3.5" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  /* 03 · Control — Padlock */
  control: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="18" y="38" width="44" height="32" rx="2" stroke="currentColor" stroke-width="1.5"/>
    <path d="M28 38V28C28 20.3 52 20.3 52 28V38" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <circle cx="40" cy="51" r="4" stroke="currentColor" stroke-width="1.5"/>
    <line x1="40" y1="55" x2="40" y2="62" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  /* 04 · Inner Life — Heart + triangle geometry */
  innerLife: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M40 66C26 54 10 46 10 32C10 22 18 15 28 18C33 19.5 37 23 40 27C43 23 47 19.5 52 18C62 15 70 22 70 32C70 46 54 54 40 66Z" stroke="currentColor" stroke-width="1.5"/>
    <path d="M40 58L30 44L50 44Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`,

  /* 05 · Power & Voice — Rectangle cluster (broadcast signal) */
  power: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="16" y="52" width="48" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
    <rect x="24" y="38" width="32" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
    <rect x="32" y="24" width="16" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  /* 06 · The Simulation — Broken ring + inner offset ring */
  simulation: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M40 12A28 28 0 1 1 61.8 20.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="44" cy="43" r="12" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  /* 07 · The Cage — 4 concentric square outlines */
  cage: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="7"  y="7"  width="66" height="66" rx="1" stroke="currentColor" stroke-width="1.5"/>
    <rect x="17" y="17" width="46" height="46" rx="1" stroke="currentColor" stroke-width="1.5"/>
    <rect x="27" y="27" width="26" height="26" rx="1" stroke="currentColor" stroke-width="1.5"/>
    <rect x="35" y="35" width="10" height="10" rx="0.5" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  /* 08 · Respite — Branching organic growth form */
  respite: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="40" y1="70" x2="40" y2="50" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="40" y1="50" x2="24" y2="36" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="40" y1="50" x2="56" y2="36" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="24" y1="36" x2="14" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="24" y1="36" x2="33" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="56" y1="36" x2="47" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="56" y1="36" x2="66" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="14" y1="22" x2="10" y2="13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="14" y1="22" x2="19" y2="13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="33" y1="22" x2="29" y2="13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="33" y1="22" x2="37" y2="13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="47" y1="22" x2="43" y2="13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="47" y1="22" x2="51" y2="13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="66" y1="22" x2="62" y2="13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="66" y1="22" x2="70" y2="13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,
};

/* ============================================================
   DISTRICTS — master config array
   Positions are % of viewport (top, left), designed at 1440×900.
   ============================================================ */
export const DISTRICTS = [
  {
    id: 1,
    name: 'THE SCREEN',
    colour: '#4FC3F7',
    keyword: 'selfie',
    score: 78,
    top: '6%', left: '7%',
    symbol: SVG.screen,
    keywords: ['selfie','influencer','viral','scrolling','attention','meme'],
    writeup: 'The Screen catalogues how the gaze economy colonised identity. Before the pandemic, the selfie was leisure. After, it became documentation of survival.',
  },
  {
    id: 2,
    name: 'THE BODY',
    colour: '#AEEA00',
    keyword: 'pandemic',
    score: 94,
    top: '5%', left: '24%',
    symbol: SVG.body,
    keywords: ['coronavirus','covid','pandemic','vaccine','variant','long covid','flatten the curve'],
    writeup: 'The Body tracks the epidemiological vocabulary that the GIF absorbed. Every symptom, every variant, every mandate — codified into looping image.',
  },
  {
    id: 3,
    name: 'CONTROL',
    colour: '#FFB300',
    keyword: 'lockdown',
    score: 88,
    top: '7%', left: '63%',
    symbol: SVG.control,
    keywords: ['lockdown','quarantine','social distancing','stay home','work from home','essential worker','quarantine life'],
    writeup: 'Control maps the policy vocabulary of confinement — the words that restructured daily life and became the grammar of the new normal.',
  },
  {
    id: 4,
    name: 'INNER LIFE',
    colour: '#F44336',
    keyword: 'loneliness',
    score: 71,
    top: '6%', left: '80%',
    symbol: SVG.innerLife,
    keywords: ['loneliness','anxiety','boredom','depression','hopeless','burnout','zoom fatigue','pandemic fatigue','fear','panic','isolation'],
    writeup: 'Inner Life holds the emotional residue of lockdown. The feelings that had no physical outlet — only the GIF to carry them.',
  },
  {
    id: 5,
    name: 'POWER & VOICE',
    colour: '#B55DC9',
    keyword: 'misinformation',
    score: 83,
    top: '36%', left: '5%',
    symbol: SVG.power,
    keywords: ['misinformation','conspiracy','censorship','protest','fake news'],
    writeup: 'Power & Voice charts the information wars. The GIF became a weapon of narrative — deployed by protest, co-opted by conspiracy.',
  },
  {
    id: 6,
    name: 'THE SIMULATION',
    colour: '#9E9E9E',
    keyword: 'deepfake',
    score: 52,
    top: '38%', left: '79%',
    symbol: SVG.simulation,
    keywords: ['deepfake','metaverse','AI','reality','simulation','surveillance','new normal'],
    writeup: 'The Simulation names the moment the copy surpassed the original. Baudrillard\'s hyperreal, realised in looping pixels.',
  },
  {
    id: 7,
    name: 'THE CAGE',
    colour: '#FF5722',
    keyword: 'isolation',
    score: 86,
    top: '65%', left: '7%',
    symbol: SVG.cage,
    keywords: ['doomscrolling','cabin fever','disconnected','zoom','zoom memes','return to office'],
    writeup: 'The Cage holds the behaviours that defined confinement — the compulsive scroll, the pixelated meeting, the long way back to physical space.',
  },
  {
    id: 8,
    name: 'RESPITE',
    colour: '#26A69A',
    keyword: 'hope',
    score: 61,
    top: '66%', left: '79%',
    symbol: SVG.respite,
    keywords: ['hope','together','self care','cope','mental health'],
    writeup: 'Respite marks the counter-current — the GIFs of care, solidarity, and endurance that ran alongside the fear.',
  },
];
