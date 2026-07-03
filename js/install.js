// install.js — "Install app" support.
// Chrome/Edge/Android: capture beforeinstallprompt and trigger it on demand.
// iOS (no programmatic install): show a small instructions modal instead.

let deferred = null;     // the captured beforeinstallprompt event
let onAvail = null;      // callback when install becomes available (to re-render)

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
  onAvail?.();
});
window.addEventListener('appinstalled', () => { deferred = null; onAvail?.(); });

export function onAvailable(cb) { onAvail = cb; }

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
}

// Show the Install button when not already installed and we can either prompt
// (Android/desktop) or guide the user (iOS).
export function canShow() {
  return !isStandalone() && (!!deferred || isIOS());
}

// Trigger install: native prompt where possible, else iOS instructions.
export async function activate() {
  if (deferred) {
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* ignore */ }
    deferred = null;
    onAvail?.();
    return;
  }
  if (isIOS()) showIosModal();
}

function showIosModal() {
  if (document.getElementById('ios-install-modal')) return;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'ios-install-modal';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="Install on iPhone">
      <h3 class="modal__title">Add to your Home Screen</h3>
      <p class="modal__copy">iPhone installs apps from Safari's Share menu:</p>
      <ol class="modal__steps">
        <li>Tap the <strong>Share</strong> icon (the square with an up arrow) in Safari.</li>
        <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
        <li>Tap <strong>Add</strong> — ShazRics appears on your Home Screen.</li>
      </ol>
      <button class="btn btn--primary" data-close>Got it</button>
    </div>`;
  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('[data-close]').addEventListener('click', close);
  document.body.appendChild(overlay);
}
