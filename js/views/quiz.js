import { store } from '../store.js';
import { allWords } from '../words.js';
import { stateOf, quizResult } from '../srs.js';
import { addXp, checkBadges, XP } from '../gamify.js';
import { t } from '../i18n.js';
import { speak } from '../speech.js';
import { $view, esc, pct, shuffle, deHtml, trHtml, plHtml, sayBtn, sayBoth, ICON } from '../ui.js';
import { sfx, haptic, floatText, confetti, animateIn } from '../fx.js';

const MODES = ['dePt', 'deEn', 'ptDe', 'enDe', 'art', 'write', 'listen', 'dictation'];
const LABEL = { dePt: 'qDePt', deEn: 'qDeEn', ptDe: 'qPtDe', enDe: 'qEnDe', art: 'qArt', write: 'qWrite', listen: 'qListen', dictation: 'qDictation' };
// Bandeiras em emoji não aparecem no Windows; por isso as siglas.
const EMOJI = { dePt: 'DE→PT', deEn: 'DE→EN', ptDe: 'PT→DE', enDe: 'EN→DE', art: '🎨', write: '⌨️', listen: '🎧', dictation: '📝' };
const TYPED = ['write', 'dictation'];
const DE_OPTIONS = ['ptDe', 'enDe', 'listen'];

let Q = null;

export function viewQuiz(mode) {
  if (!MODES.includes(mode)) return quizMenu();
  const onlySeen = store.data.quizOnlySeen ?? true;
  const fits = (w) => mode !== 'art' || (w.art && w.pl !== '(Pl.)');
  let pool = allWords().filter((w) => fits(w) && (!onlySeen || stateOf(w.id)));
  // Poucas palavras estudadas ainda: usa o nível atual inteiro.
  if (pool.length < 4) pool = allWords().filter((w) => fits(w) && w.level === store.settings.level);
  Q = { mode, questions: shuffle(pool).slice(0, 10), i: 0, score: 0, answered: false, xp: 0 };

  $view.innerHTML = `
    <div class="session-top">
      <div class="bar thin"><i class="mastered" id="qbar"></i></div>
      <span class="muted" id="qcount"></span>
      <span class="xp-chip" id="qxp">0 XP</span>
    </div>
    <div id="qarea"></div>`;
  drawQuestion();
  return () => { Q = null; };
}

function quizMenu() {
  const onlySeen = store.data.quizOnlySeen ?? true;
  const desc = t('quizDesc');
  $view.innerHTML = `
    <h1 class="title">${t('quizPick')}</h1>
    <div class="menu">
      ${MODES.map((m) => `<a class="card menu-item" href="#/quiz/${m}"><span class="q-emoji">${EMOJI[m]}</span><b>${t(LABEL[m])}</b><small class="muted">${desc[m]}</small></a>`).join('')}
      <a class="card menu-item accent" href="#/match"><span class="q-emoji">🧩</span><b>${t('matchTitle')}</b><small class="muted">${t('matchDesc')}</small></a>
    </div>
    <label class="check"><input type="checkbox" id="onlySeen" ${onlySeen ? 'checked' : ''}> ${t('qOnlySeen')}</label>`;
  document.getElementById('onlySeen').addEventListener('change', (e) => { store.data.quizOnlySeen = e.target.checked; store.save(); });
}

function optionText(w, mode) {
  if (mode === 'dePt') return w.pt;
  if (mode === 'deEn') return w.en;
  return w.de;
}

function distractors(w, mode) {
  const key = (x) => optionText(x, mode);
  const all = allWords();
  const same = shuffle(all.filter((x) => x.cat === w.cat && x.id !== w.id));
  const others = shuffle(all.filter((x) => x.cat !== w.cat));
  const out = [];
  const seen = new Set([key(w)]);
  for (const x of [...same, ...others]) {
    if (out.length >= 3) break;
    if (!seen.has(key(x))) { seen.add(key(x)); out.push(x); }
  }
  return out;
}

function updateTop() {
  document.getElementById('qbar').style.width = `${pct(Q.i, Q.questions.length)}%`;
  document.getElementById('qcount').textContent = `${Q.i + 1}/${Q.questions.length}`;
  document.getElementById('qxp').textContent = `${Q.xp} XP`;
}

function drawQuestion() {
  const { mode, questions, i } = Q;
  const w = questions[i];
  Q.answered = false;
  updateTop();
  let prompt = '';
  let body = '';

  if (mode === 'dePt' || mode === 'deEn') prompt = `<div class="de-word">${deHtml(w)} ${sayBoth(w.de)}</div>`;
  else if (mode === 'ptDe') prompt = `<div class="q-native"><span class="tag">PT</span>${esc(w.pt)}</div>`;
  else if (mode === 'enDe') prompt = `<div class="q-native"><span class="tag">EN</span>${esc(w.en)}</div>`;
  else if (mode === 'art') prompt = `<div class="de-word"><span class="blank">___</span> ${esc(w.base)} ${sayBtn(w.de)}</div><div class="trs">${trHtml(w, { speakers: false })}</div>`;
  else if (mode === 'listen' || mode === 'dictation') prompt = `<div class="play-row"><button class="play-big" id="playq" aria-label="${esc(t('replay'))}">${ICON.speaker}</button><button class="play-slow" id="playslow" aria-label="${esc(t('slowListen'))}">🐢</button></div><small class="muted">${t('replay')}</small>`;
  else prompt = `<div class="trs big">${trHtml(w, { speakers: false })}</div>`;

  if (mode === 'art') {
    body = `<div class="opts arts">${['der', 'die', 'das'].map((a) => `<button class="btn opt art-btn art-${a}" data-ans="${a}">${a}</button>`).join('')}</div>`;
  } else if (TYPED.includes(mode)) {
    body = `<form id="wform" class="write">
      <input id="winput" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(t('typeHere'))}">
      <div class="umlauts">${['ä', 'ö', 'ü', 'ß'].map((c) => `<button type="button" class="btn sm" data-ch="${c}">${c}</button>`).join('')}</div>
      <button class="btn primary big" type="submit">${t('check')}</button></form>`;
  } else {
    const opts = shuffle([w, ...distractors(w, mode)]);
    body = `<div class="opts">${opts.map((o, k) => `<button class="btn opt" style="--i:${k}" data-id="${esc(o.id)}">${DE_OPTIONS.includes(mode) ? deHtml(o) : esc(optionText(o, mode))}</button>`).join('')}</div>`;
  }

  const $q = document.getElementById('qarea');
  $q.innerHTML = `
    <div class="q-enter">
      <section class="card flash q-card"><div class="flash-meta"><span class="chip">${EMOJI[mode]} ${t(LABEL[mode])}</span></div>${prompt}</section>
      ${body}
      <div id="feedback"></div>
    </div>`;

  document.getElementById('playq')?.addEventListener('click', () => speak(w.de));
  document.getElementById('playslow')?.addEventListener('click', () => speak(w.de, 'de-DE', 'slower'));
  if (mode === 'listen' || mode === 'dictation' || (store.settings.autoplay && ['dePt', 'deEn'].includes(mode))) speak(w.de);

  $q.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
    if (Q.answered) return;
    const isRight = (x) => (mode === 'art' ? x.dataset.ans === w.art : x.dataset.id === w.id);
    const ok = isRight(b);
    b.classList.add(ok ? 'ok' : 'bad');
    if (!ok) [...$q.querySelectorAll('.opt')].find(isRight)?.classList.add('ok', 'reveal');
    $q.querySelectorAll('.opt').forEach((x) => { if (x !== b && !x.classList.contains('ok')) x.classList.add('dim'); });
    answer(ok, b);
  }));

  const form = document.getElementById('wform');
  if (form) {
    const input = document.getElementById('winput');
    input.focus({ preventScroll: true });
    $q.querySelectorAll('[data-ch]').forEach((b) => b.addEventListener('click', () => {
      const p = input.selectionStart ?? input.value.length;
      input.value = input.value.slice(0, p) + b.dataset.ch + input.value.slice(input.selectionEnd ?? p);
      input.focus();
      input.setSelectionRange(p + 1, p + 1);
    }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (Q.answered) return nextQuestion();
      const norm = (s) => s.toLowerCase().replace(/[?!.,…]/g, '').replace(/\s+/g, ' ').trim();
      const v = norm(input.value);
      if (!v) return;
      const ok = v === norm(w.de) || Boolean(w.art && v === norm(w.base));
      input.classList.add(ok ? 'ok' : 'bad');
      input.readOnly = true;
      answer(ok, input);
    });
  }
}

function answer(ok, el) {
  const w = Q.questions[Q.i];
  Q.answered = true;
  quizResult(w.id, ok);
  if (ok) {
    Q.score++;
    Q.xp += XP.quiz;
    addXp(XP.quiz);
    sfx('good');
    haptic(10);
    const box = el.getBoundingClientRect();
    floatText(t('earned', XP.quiz), box.left + box.width / 2, box.top);
  } else {
    sfx('bad');
    haptic([30, 40, 30]);
  }
  updateTop();
  setTimeout(() => speak(w.de), 250);
  document.getElementById('feedback').innerHTML = `
    <div class="card feedback slide-up ${ok ? 'ok' : 'bad'}">
      <b>${ok ? `✓ ${t('correct')}` : `✗ ${t('wrong')}`}</b>
      <div class="de-word sm">${deHtml(w)} ${sayBoth(w.de)}</div>${plHtml(w)}
      <div class="trs">${trHtml(w)}</div>
    </div>
    <button class="btn primary big slide-up" id="next">${t('next')}</button>`;
  const next = document.getElementById('next');
  next.addEventListener('click', nextQuestion);
  if (!TYPED.includes(Q.mode)) next.focus({ preventScroll: true });
  next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function nextQuestion() {
  if (!Q) return;
  Q.i++;
  if (Q.i < Q.questions.length) return drawQuestion();
  const { score, questions, mode, xp } = Q;
  const ratio = score / questions.length;
  document.querySelector('.session-top')?.remove();
  document.getElementById('qarea').innerHTML = `
    <section class="card center pop-in">
      <div class="big-emoji bounce">${ratio >= 0.8 ? '🏆' : ratio >= 0.5 ? '💪' : '📚'}</div>
      <h1>${t('score', score, questions.length)}</h1>
      <div class="summary"><div><b data-count="${pct(score, questions.length)}">0</b><span>% ${t('accuracy')}</span></div><div><b data-count="${xp}">0</b><span>XP</span></div></div>
      <div class="row">
        <a class="btn" href="#/quiz">${t('quiz')}</a>
        <button class="btn primary" id="again">${t('again2')}</button>
      </div>
    </section>`;
  animateIn(document.getElementById('qarea'));
  if (ratio >= 0.8) { sfx('win'); confetti(); }
  checkBadges({ perfect: score === questions.length && questions.length >= 10 });
  document.getElementById('again').addEventListener('click', () => viewQuiz(mode));
  Q = null;
}

document.addEventListener('keydown', (e) => {
  if (!Q || document.querySelector('dialog[open]')) return;
  if (!Q.answered && /^[1-4]$/.test(e.key) && !e.target.matches('input')) {
    document.querySelectorAll('#qarea .opt')[+e.key - 1]?.click();
  } else if (Q.answered && e.key === 'Enter' && !e.target.matches('input, button')) nextQuestion();
});
