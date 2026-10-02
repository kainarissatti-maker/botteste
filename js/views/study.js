import { store } from '../store.js';
import { CATEGORIES, catLabel } from '../words.js';
import { buildSession, review, nextInterval, formatInterval, stateOf, hardWords } from '../srs.js';
import { addXp, checkBadges, XP } from '../gamify.js';
import { t, lang } from '../i18n.js';
import { speak } from '../speech.js';
import { $view, esc, pct, deHtml, trHtml, plHtml, sayBoth } from '../ui.js';
import { sfx, haptic, floatText, confetti, reduced, animateIn } from '../fx.js';

let S = null;

export function viewStudy(param) {
  const opts = {};
  if (param.startsWith('cat:')) opts.cat = param.slice(4);
  if (param === 'more') opts.extraNew = 5;
  const queue = param === 'hard' ? hardWords() : buildSession({ ...opts, noNew: !opts.cat });
  S = { queue, done: 0, tries: 0, fails: 0, xp: 0, revealed: false, busy: false, front: 'de', t0: Date.now() };

  $view.innerHTML = `
    <div class="session-top">
      <div class="bar thin"><i class="mastered" id="sbar"></i></div>
      <span class="muted" id="scount"></span>
      <span class="xp-chip" id="sxp">0 XP</span>
    </div>
    <div class="stage" id="stage"></div>
    <div class="actions" id="actions"></div>
    <p class="hint muted" id="shint"></p>`;
  nextCard();
  return () => { S = null; };
}

function updateTop() {
  const total = S.done + S.queue.length;
  document.getElementById('sbar').style.width = `${pct(S.done, total)}%`;
  document.getElementById('scount').textContent = `${S.done}/${total}`;
  document.getElementById('sxp').textContent = `${S.xp} XP`;
}

function faceHtml(w, side) {
  const st = stateOf(w.id);
  const c = CATEGORIES[w.cat] || CATEGORIES.custom;
  const meta = `<div class="flash-meta"><span class="chip">${c.icon} ${esc(catLabel(w.cat, lang()))}</span>
    ${!st ? `<span class="chip new-chip">${t('newWord')}</span>` : ''}
    ${side === 'back' && w.cognate ? `<span class="chip cog">≈ EN · ${t('cognate')}</span>` : ''}</div>`;
  if (side === 'back') {
    return `${meta}<div class="de-word">${deHtml(w)} ${sayBoth(w.de)}</div>${plHtml(w)}<div class="trs">${trHtml(w)}</div>`;
  }
  if (S.front === 'de') return `${meta}<div class="de-word">${deHtml(w)} ${sayBoth(w.de)}</div><div class="tap-hint">${t('tapToFlip')}</div>`;
  return `${meta}<div class="trs big">${trHtml(w)}</div><div class="de-word placeholder">?</div>`;
}

function nextCard() {
  if (!S) return;
  if (!S.queue.length) return studyDone();
  const dir = store.settings.direction;
  S.front = dir === 'mix' ? (Math.random() < 0.5 ? 'de' : 'native') : dir;
  S.revealed = false;
  S.busy = false;
  const w = S.queue[0];
  document.getElementById('stage').innerHTML = `
    <div class="card-drag enter" id="drag">
      <div class="flip" id="flip">
        <div class="face front card">${faceHtml(w, 'front')}</div>
        <div class="face back card">${faceHtml(w, 'back')}</div>
      </div>
    </div>`;
  document.getElementById('actions').innerHTML = `<button class="btn primary big" id="reveal">${t('show')}</button>`;
  document.getElementById('reveal').addEventListener('click', reveal);
  document.getElementById('shint').textContent = matchMedia('(hover: none)').matches ? t('swipeHint') : `${t('keys')} · ${t('swipeHint')}`;
  bindSwipe(document.getElementById('drag'));
  updateTop();
  if (store.settings.autoplay && S.front === 'de') speak(w.de);
}

function reveal() {
  if (!S || S.revealed || S.busy) return;
  S.revealed = true;
  sfx('flip');
  document.getElementById('flip').classList.add('flipped');
  const st = stateOf(S.queue[0].id);
  const labels = [t('again'), t('hard'), t('good'), t('easy')];
  const $a = document.getElementById('actions');
  $a.innerHTML = `<div class="rate pop-in">${labels.map((l, i) =>
    `<button class="btn rate-${i}" data-rate="${i}"><b>${l}</b><small>${formatInterval(nextInterval(st, i), lang())}</small></button>`).join('')}</div>`;
  $a.querySelectorAll('[data-rate]').forEach((b) => b.addEventListener('click', () => rate(+b.dataset.rate, b)));
  if (store.settings.autoplay && S.front === 'native') speak(S.queue[0].de);
}

function rate(r, fromEl) {
  if (!S?.revealed || S.busy) return;
  S.busy = true;
  const w = S.queue.shift();
  review(w.id, r);
  const gain = [XP.again, XP.hard, XP.good, XP.easy][r];
  S.xp += gain;
  addXp(gain);
  S.tries++;
  if (r === 0) { S.fails++; S.queue.splice(Math.min(3, S.queue.length), 0, w); sfx('bad'); haptic([30, 40, 30]); }
  else { S.done++; sfx('good'); haptic(10); }

  const el = fromEl || document.querySelector(`[data-rate="${r}"]`);
  const box = el?.getBoundingClientRect();
  if (box) floatText(t('earned', gain), box.left + box.width / 2, box.top, r === 0 ? 'bad' : '');

  updateTop();
  checkBadges();
  const drag = document.getElementById('drag');
  drag.classList.remove('dragging');
  drag.style.transform = '';
  drag.classList.add(r === 0 ? 'out-left' : 'out-right');
  setTimeout(nextCard, reduced() ? 0 : 260);
}

// Arrastar: direita = Bom, esquerda = Errei. Toque simples vira o cartão.
function bindSwipe(drag) {
  let x0 = null, dx = 0;
  const reset = () => { x0 = null; drag.classList.remove('dragging'); drag.style.transform = ''; delete drag.dataset.hint; };
  drag.addEventListener('pointerdown', (e) => {
    if (S?.busy || e.target.closest('button')) return;
    x0 = e.clientX; dx = 0;
    drag.setPointerCapture(e.pointerId);
  });
  drag.addEventListener('pointermove', (e) => {
    if (x0 === null) return;
    dx = e.clientX - x0;
    if (Math.abs(dx) < 6) return;
    drag.classList.add('dragging');
    const d = S.revealed ? dx : dx * 0.25;
    drag.style.transform = `translateX(${d}px) rotate(${d / 22}deg)`;
    if (S.revealed) drag.dataset.hint = dx > 70 ? 'good' : dx < -70 ? 'bad' : '';
  });
  drag.addEventListener('pointerup', () => {
    if (x0 === null) return;
    const moved = dx;
    const wasDrag = drag.classList.contains('dragging');
    reset();
    if (!S) return;
    if (!S.revealed) { if (!wasDrag || Math.abs(moved) < 30) reveal(); return; }
    if (moved > 90) rate(2);
    else if (moved < -90) rate(0);
  });
  drag.addEventListener('pointercancel', reset);
}

function studyDone() {
  const n = S.done;
  const mins = Math.max(1, Math.round((Date.now() - S.t0) / 60000));
  document.querySelector('.session-top')?.remove();
  document.getElementById('shint').textContent = '';
  document.getElementById('actions').innerHTML = '';
  document.getElementById('stage').innerHTML = `
    <section class="card center pop-in">
      <div class="big-emoji bounce">🎉</div>
      <h1>${n ? t('sessionDone') : t('allDone')}</h1>
      ${n ? `<div class="summary">
        <div><b data-count="${n}">0</b><span>${t('words')}</span></div>
        <div><b data-count="${pct(S.tries - S.fails, S.tries)}">0</b><span>% ${t('accuracy')}</span></div>
        <div><b data-count="${S.xp}">0</b><span>XP</span></div>
        <div><b>${mins}</b><span>min</span></div></div>` : ''}
      <div class="row">
        <a class="btn" href="#/home">${t('backHome')}</a>
        <a class="btn primary" href="#/review/more">${t('learnMore')}</a>
      </div>
    </section>`;
  animateIn(document.getElementById('stage'));
  if (n) { sfx('win'); confetti(); }
  S = null;
}

document.addEventListener('keydown', (e) => {
  if (!S || e.target.matches('input, textarea, select') || document.querySelector('dialog[open]')) return;
  if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); if (!S.revealed) reveal(); else rate(2); }
  else if (['1', '2', '3', '4'].includes(e.key)) rate(+e.key - 1);
});
