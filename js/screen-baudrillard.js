/* ============================================================
   screen-baudrillard.js — PRD v2 Act 1
   Four new narrative screens (Orders I–IV) inserting between the
   existing narrative frames and the Phase Boot sequence. Each
   screen has a full-bleed Giphy GIF background (pre-baked in the
   enriched cache) and a single Redaction-typeface animated word.
   ============================================================ */

import { onScreenChange } from './screen-manager.js';
import { getFixedGif } from './data.js';
import { prepareRedactionWord, playRedaction, resetRedaction } from './redaction-anim.js';

/* Screen index is the DOM position of the section in index.html.
   Orders I–IV sit right after the existing narrative frames (indices 1–3)
   and immediately before the Phase Boot screen (now index 8). */
const ORDERS = [
  { idx: 1, id: 'screen-order-i',   slot: 'order_i'   },
  { idx: 2, id: 'screen-order-ii',  slot: 'order_ii'  },
  { idx: 3, id: 'screen-order-iii', slot: 'order_iii' },
  { idx: 4, id: 'screen-order-iv',  slot: 'order_iv'  },
];

export function initBaudrillardScreens() {
  const orders = ORDERS
    .map(cfg => ({ ...cfg, el: document.getElementById(cfg.id) }))
    .filter(o => o.el);

  if (!orders.length) return;

  orders.forEach(o => {
    o.imgEl  = o.el.querySelector('.order-gif');
    o.contentEl = o.el.querySelector('.order-content');
    o.wordEl = o.el.querySelector('.redaction-word');
    if (o.wordEl) prepareRedactionWord(o.wordEl);
    /* Pre-wire the GIF source from the cache so the first activation
       doesn't show an empty frame. */
    const gif = getFixedGif(o.slot);
    if (gif && o.imgEl) o.imgEl.src = gif.src || gif.still || '';
  });

  onScreenChange((next, prev) => {
    orders.forEach(o => {
      if (o.idx === next) activate(o);
      else if (o.idx === prev) deactivate(o);
    });
  });
}

function activate(order) {
  /* Staged entry: content fades/slides in, then the word animation plays. */
  order.el.classList.add('active-anim');
  requestAnimationFrame(() => {
    order.contentEl?.classList.add('entered');
    if (order.wordEl) playRedaction(order.wordEl);
  });
}

function deactivate(order) {
  order.el.classList.remove('active-anim');
  order.contentEl?.classList.remove('entered');
  resetRedaction(order.wordEl);
}
