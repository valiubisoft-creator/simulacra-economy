/* ============================================================
   redaction-anim.js — Redaction-typeface word animations (PRD v2 §05)

   Exposes:
     splitChars(el)        — splits an element's text into per-char <span>s
                             with a --char-idx CSS var for staggered animations.
     playRedaction(el)     — restarts the CSS animation on the element.
     resetRedaction(el)    — halts any running animation on the element.

   Animation is driven by CSS (see css/redaction-anim.css) keyed off
   data-anim on the .redaction-word element:
     mirror    — blur / scale oscillation
     distort   — skew oscillation
     forgotten — per-char fade (loops)
     original  — glitch twitch (colour split)
     dissolve  — per-char fade in on entry (closing screen)
   ============================================================ */

const CHAR_ANIMATIONS = new Set(['forgotten', 'dissolve']);

/* Split an element's text content into per-char spans so CSS can
   animate each letter independently. Preserves whitespace. */
export function splitChars(el) {
  if (!el || el.dataset.split === '1') return;
  const text = el.textContent || '';
  el.innerHTML = [...text]
    .map((ch, i) => {
      const display = ch === ' ' ? '&nbsp;' : escapeHtml(ch);
      return `<span class="redaction-char" style="--char-idx:${i}">${display}</span>`;
    })
    .join('');
  el.dataset.split = '1';
  el.classList.add('char-split');
}

/* Prepare a word element: split chars if its animation needs per-letter timing. */
export function prepareRedactionWord(el) {
  if (!el) return;
  const anim = el.dataset.anim;
  if (CHAR_ANIMATIONS.has(anim)) splitChars(el);
}

/* Restart the animation on this element (and all its char children).
   Works by toggling the `playing` class + forcing a reflow. */
export function playRedaction(el) {
  if (!el) return;
  el.classList.remove('playing');
  // eslint-disable-next-line no-unused-expressions
  el.offsetHeight;   /* reflow — required for animation restart */
  el.classList.add('playing');
}

export function resetRedaction(el) {
  el?.classList.remove('playing');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
