// howto.js — a static "How to play" content screen, reached from Home.
export function render(el, ctx) {
  el.innerHTML = `
    <div class="card">
      <div class="texture" aria-hidden="true"></div>
      <div class="screen__header">
        <div>
          <h2 class="screen__title">How to play</h2>
        </div>
      </div>

      <p class="screen__copy">ShazRics is a loud, pass-the-phone lyrics party game. One card shows an incomplete Nigerian lyric; the team shouts the missing part, then you flip the card to check the answer — like reading the back of a flashcard — and score it honestly.</p>

      <div>
        <div class="screen__eyebrow" style="margin-bottom:8px;">The flow</div>
        <ol class="howto-list">
          <li>Set up teams, timer, skip rule, win condition, and a lyric bank.</li>
          <li>Pass the phone to the active team.</li>
          <li>Read the incomplete lyric aloud — the team shouts the missing part.</li>
          <li>Tap <strong>Reveal answer</strong> (or swipe the card) to show the full line and the <em>artist — song</em> it's from.</li>
          <li>Did they get it? Tap <strong>Got it!</strong> (or swipe right) for +1.</li>
          <li>Missed it? Tap <strong>Skip</strong> (or swipe left) to move on.</li>
          <li>When time's up, review the turn and hand off to the next team.</li>
          <li>Tap <strong>End game</strong> any time to reveal the winner.</li>
        </ol>
        <p class="screen__copy" style="margin-top:8px; font-size:0.86rem;">You have to reveal a card before you can score it — the answer is the judge.</p>
      </div>

      <div>
        <div class="screen__eyebrow" style="margin-bottom:8px;">Skips &amp; winning</div>
        <p class="screen__copy"><strong>Skips:</strong> Free (no cost), Limited (3 per turn), or Penalty (−1). <strong>Win:</strong> Open-ended (play until you End game), First to a score, or a Fixed number of rounds.</p>
      </div>

      <div>
        <div class="screen__eyebrow" style="margin-bottom:8px;">Make your own bank</div>
        <p class="screen__copy">In <strong>Settings → Word banks</strong>, paste your own lyrics — one per line as <strong>prompt || answer || artist || song</strong>. Artist and song are optional; put a visible blank in the prompt.</p>
        <p class="screen__copy" style="margin-top:6px; font-size:0.86rem;">e.g. <code>Only you fi ______ || hold my body || Wizkid || Essence</code></p>
      </div>

      <div class="button-stack" style="margin-top:8px;">
        <button class="btn btn--primary" data-back>Got it</button>
      </div>
    </div>`;

  el.querySelector('[data-back]').addEventListener('click', () => ctx.actions.goHome());
}
