// Jogo dos pares: ligar cada palavra em alemão à tradução, contra o relógio.
import { store } from '../store.js';
import { allWords } from '../words.js';
import { stateOf, quizResult } from '../srs.js';
import { addXp, checkBadges, XP } from '../gamify.js';
import { t } from '../i18n.js';
import { speak } from '../speech.js';
import { $view, esc, shuffle, deHtml } from '../ui.js';
import { sfx, haptic, confetti, toast, animateIn } from '../fx.js';

const PAIRS = 6;
let M = null;

function pickWords() {
  const seen = allWords().filter((w) => stateOf(w.id));
  const pool = seen.length >= PAIRS ? seen : allWords().filter((w) => w.level === store.settings.level);
  const out = [];
  const used = new Set();
  for (const w of shuffle(pool)) {
    if (out.length >= PAIRS) break;
    const key = `${w.pt}|${w.en}`;
    if (!used.has(key) && !used.has(w.de)) { used.add(key); used.add(w.de); out.push(w); }
  }
  return out;
}

function transFor(w) {
  const s = store.settings.show;
  const lang = s === 'both' ? (Math.random() < 0.5 ? 'en' : 'pt') : s;
  return `<span class="tag">${lang.toUpperCase()}</span>${esc(lang === 'en' ? w.en : w.pt)}`;
}

export function viewMatch() {
  const words = pickWords();
  M = { words, left: null, right: null, found: 0, mistakes: 0, t0: 0, timer: null, wrongIds: new Set() };
  const left = shuffle(words);
  const right = shuffle(words);
  $view.innerHTML = `
    <div class="match-head">
      <h1 class="title">🧩 ${t('matchTitle')}</h1>
      <span class="timer" id="mtime">0.0s</span>
    </div>
    <p class="muted">${t('pickPair')}</p>
    <div class="match">
      <div class="col">${left.map((w, i) => `<button class="btn tile-btn" style="--i:${i}" data-side="l" data-id="${esc(w.id)}">${deHtml(w)}</button>`).join('')}</div>
      <div class="col">${right.map((w, i) => `<button class="btn tile-btn" style="--i:${i + 3}" data-side="r" data-id="${esc(w.id)}">${transFor(w)}</button>`).join('')}</div>
    </div>`;
  $view.querySelectorAll('.tile-btn').forEach((b) => b.addEventListener('click', () => pick(b)));
  return () => { clearInterval(M?.timer); M = null; };
}

function tick() {
  const el = document.getElementById('mtime');
  if (el) el.textContent = `${((Date.now() - M.t0) / 1000).toFixed(1)}s`;
}

function pick(b) {
  if (!M || b.classList.contains('matched')) return;
  if (!M.t0) { M.t0 = Date.now(); M.timer = setInterval(tick, 100); }
  const side = b.dataset.side;
  if (side === 'l') speak(M.words.find((w) => w.id === b.dataset.id).de);
  const key = side === 'l' ? 'left' : 'right';
  M[key]?.classList.remove('sel');
  M[key] = M[key] === b ? null : b;
  M[key]?.classList.add('sel');
  if (!M.left || !M.right) return;

  const l = M.left, r = M.right;
  M.left = M.right = null;
  if (l.dataset.id === r.dataset.id) {
    [l, r].forEach((x) => { x.classList.remove('sel'); x.classList.add('matched'); });
    sfx('good'); haptic(10);
    if (!M.wrongIds.has(l.dataset.id)) quizResult(l.dataset.id, true);
    if (++M.found === M.words.length) finish();
  } else {
    [l, r].forEach((x) => { x.classList.remove('sel'); x.classList.add('wrong'); setTimeout(() => x.classList.remove('wrong'), 450); });
    sfx('bad'); haptic([30, 40, 30]);
    M.mistakes++;
    // Errou o par: a palavra do lado alemão volta para a revisão.
    if (!M.wrongIds.has(l.dataset.id)) { M.wrongIds.add(l.dataset.id); quizResult(l.dataset.id, false); }
  }
}

function finish() {
  clearInterval(M.timer);
  const secs = (Date.now() - M.t0) / 1000;
  const best = store.data.best.match;
  const isBest = !best || secs < best;
  if (isBest) { store.data.best.match = secs; store.save(); }
  addXp(XP.match);
  const done = M;
  setTimeout(() => {
    if (M !== done) return;
    $view.innerHTML = `
      <section class="card center pop-in">
        <div class="big-emoji bounce">${isBest ? '🏆' : '🧩'}</div>
        <h1>${isBest ? t('newBest') : t('matchTitle')}</h1>
        <div class="summary">
          <div><b>${secs.toFixed(1)}s</b><span>${t('time')}</span></div>
          <div><b data-count="${done.mistakes}">0</b><span>${t('mistakes')}</span></div>
          <div><b>${(isBest ? secs : best).toFixed(1)}s</b><span>${t('best')}</span></div>
          <div><b>+${XP.match}</b><span>XP</span></div>
        </div>
        <div class="row">
          <a class="btn" href="#/home">${t('backHome')}</a>
          <button class="btn primary" id="again">${t('play')}</button>
        </div>
      </section>`;
    animateIn($view);
    sfx('win'); confetti();
    if (isBest && best) toast(t('newBest'), { icon: '⏱️', kind: 'gold' });
    checkBadges({ fastMatch: secs < 30 });
    document.getElementById('again').addEventListener('click', () => viewMatch());
  }, 450);
}
