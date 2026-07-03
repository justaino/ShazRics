// anim.js — GSAP-powered motion helpers. Motion is purely cosmetic: the game
// state is always advanced by the caller FIRST, and these animate a throwaway
// clone of the outgoing card. So a missing/janky animation can never freeze the
// game. Everything degrades to nothing under prefers-reduced-motion / no GSAP.

const gsap = window.gsap;

function prefersReduced() {
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
function canAnimate() {
  return gsap && !prefersReduced();
}

// Make a fixed-position clone of an element sitting exactly over it.
function cloneOver(el) {
  const r = el.getBoundingClientRect();
  const clone = el.cloneNode(true);
  Object.assign(clone.style, {
    position: 'fixed', left: `${r.left}px`, top: `${r.top}px`,
    width: `${r.width}px`, height: `${r.height}px`, margin: '0', zIndex: '9999',
    pointerEvents: 'none',
  });
  document.body.appendChild(clone);
  return { clone, r };
}

// Got it: fly the outgoing card to the team score pill, then remove the clone.
export function flyToPile(cardEl, targetEl) {
  if (!canAnimate() || !cardEl || !targetEl) return;
  const t = targetEl.getBoundingClientRect();
  const { clone, r } = cloneOver(cardEl);
  const dx = (t.left + t.width / 2) - (r.left + r.width / 2);
  const dy = (t.top + t.height / 2) - (r.top + r.height / 2);
  gsap.to(clone, {
    x: dx, y: dy, scale: 0.12, opacity: 0, rotation: -14,
    duration: 0.42, ease: 'power2.in', onComplete: () => clone.remove(),
  });
  gsap.fromTo(targetEl, { scale: 1 }, { scale: 1.18, duration: 0.45, ease: 'back.out(3)', delay: 0.28, yoyo: true, repeat: 1 });
}

// Reveal: fade + settle the answer block into view. The caller has already made
// the element visible, so this is purely cosmetic — under reduced motion / no
// GSAP the answer simply appears.
export function revealAnswer(el) {
  if (!canAnimate() || !el) return;
  gsap.from(el, { opacity: 0, y: 12, duration: 0.34, ease: 'power2.out' });
}

// Skip: slide the outgoing card off to the left.
export function skipAway(cardEl) {
  if (!canAnimate() || !cardEl) return;
  const { clone } = cloneOver(cardEl);
  gsap.to(clone, {
    x: -window.innerWidth * 0.7, rotation: -10, opacity: 0,
    duration: 0.3, ease: 'power2.in', onComplete: () => clone.remove(),
  });
}

// Count a number element up from 0 to `to` (instant under reduced motion).
export function countUp(el, to, duration = 1.1) {
  if (!el) return;
  if (!canAnimate()) { el.textContent = String(to); return; }
  const obj = { v: 0 };
  el.textContent = '0';
  gsap.to(obj, { v: to, duration, ease: 'power1.out',
    onUpdate: () => { el.textContent = String(Math.round(obj.v)); } });
}

// Stagger the podium rows into place.
export function revealPodium(rows) {
  if (!canAnimate() || !rows.length) return;
  gsap.from(rows, { y: 24, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.12 });
}

// A celebratory confetti burst for the winner (canvas-confetti).
export function celebrate() {
  if (prefersReduced() || typeof window.confetti !== 'function') return;
  const fire = (ratio, opts) => window.confetti(Object.assign({
    origin: { y: 0.35 }, colors: ['#6D4C7D', '#C6A15B', '#C57B57', '#FFFFFF'],
  }, opts, { particleCount: Math.floor(160 * ratio) }));
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.35, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 });
  fire(0.20, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
}
