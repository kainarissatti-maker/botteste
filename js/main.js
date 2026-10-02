import { store, streak, todayKey } from './store.js';
import { allWords, wordById, makeWord, invalidateWords, CATEGORIES, LEVELS, catLabel, hasPack } from './words.js';
import { buildSession, review, nextInterval, formatInterval, stateOf, statusOf, quizResult, resetWord, dueWords, newWordsToday } from './srs.js';
import { t, lang } from './i18n.js';
import { speak, canSpeak } from './speech.js';

const $view = document.getElementById('view');
const $nav = document.getElementById('nav');

// ---------- utilidades ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

const ICON = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  study: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/></svg>',
  quiz: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
  words: '<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 8h6M9 12h6"/></svg>',
  progress: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  speaker: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  flame: '<svg viewBox="0 0 24 24"><path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-1.5 2-2 3.5-2 5-1.5-1-2.5-3-2.5-5C7 8 5 11 5 15c0 4 3 7 7 7z"/></svg>',
};

function sayBtn(text, code = 'de-DE', cls = '') {
  if (!canSpeak()) return '';
  return `<button class="icon-btn ${cls}" data-say="${esc(text)}" data-lang="${code}" aria-label="${esc(t('listen'))}">${ICON.speaker}</button>`;
}

function deHtml(w, { withArt = true } = {}) {
  if (!w.art || !withArt) return esc(w.art ? w.base : w.de);
  return `<span class="art art-${w.art}">${w.art}</span> ${esc(w.base)}`;
}

function trHtml(w, { speakers = true } = {}) {
  const s = store.settings.show;
  let out = '';
  if (s !== 'pt') out += `<div class="tr"><span class="tag">EN</span><span>${esc(w.en)}</span>${speakers ? sayBtn(w.en.split('/')[0], 'en-US', 'sm') : ''}</div>`;
  if (s !== 'en') out += `<div class="tr"><span class="tag">PT</span><span>${esc(w.pt)}</span></div>`;
  return out;
}

function plHtml(w) {
  if (!w.pl) return '';
  return `<div class="pl">${t('plural')}: ${w.pl === '(Pl.)' ? `<em>${t('onlyPl')}</em>` : esc(w.pl)}</div>`;
}

const STATUS_LABEL = () => ({ new: t('statNew'), learning: t('statLearning'), mastered: t('statMastered') });

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-say]');
  if (b) { e.stopPropagation(); speak(b.dataset.say, b.dataset.lang); return; }
  // Link para a tela atual: recarrega a tela (ex.: "aprender mais" duas vezes seguidas).
  const a = e.target.closest('a[href^="#/"]');
  if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); render(); }
});

// ---------- navegação ----------
const ROUTES = { home: viewHome, study: viewStudy, quiz: viewQuiz, words: viewWords, progress: viewProgress, settings: viewSettings };

function renderNav(active) {
  $nav.innerHTML = ['home', 'study', 'quiz', 'words', 'progress'].map((r) =>
    `<a href="#/${r}" class="${r === active ? 'active' : ''}">${ICON[r]}<span>${t(r)}</span></a>`).join('');
  document.getElementById('gear').innerHTML = ICON.gear;
  document.getElementById('gear').classList.toggle('active', active === 'settings');
  const s = streak();
  document.getElementById('streak').innerHTML = `${ICON.flame}<b>${s}</b>`;
  document.getElementById('streak').title = `${s} ${t('streak')}`;
}

function render() {
  const [route = 'home', param = ''] = location.hash.replace(/^#\/?/, '').split('/');
  const view = ROUTES[route] ? route : 'home';
  document.documentElement.lang = lang() === 'pt' ? 'pt-BR' : lang();
  renderNav(view);
  window.scrollTo(0, 0);
  ROUTES[view](decodeURIComponent(param));
}

window.addEventListener('hashchange', render);

// ---------- Início ----------
function counts(words) {
  const c = { new: 0, learning: 0, mastered: 0 };
  for (const w of words) c[statusOf(w.id)]++;
  return c;
}

function viewHome() {
  session = null;
  const words = allWords();
  const due = dueWords().length;
  const newLeft = Math.min(Math.max(0, store.settings.newPerDay - newWordsToday()), words.filter((w) => !stateOf(w.id)).length);
  const c = counts(words);
  const day = store.data.days[todayKey()] || { rev: 0, ok: 0, bad: 0 };
  const s = streak();

  $view.innerHTML = `
    <h1 class="title">${t('hello')}</h1>
    <section class="card hero">
      <div class="hero-nums">
        <div><b>${due}</b><span>${t('dueToday')}</span></div>
        <div><b>${newLeft}</b><span>${t('newToday')}</span></div>
        <div><b>${s}</b><span>${t('streak')}</span></div>
      </div>
      ${due + newLeft > 0
        ? `<a class="btn primary big" href="#/study">${t('startStudy')}</a>`
        : `<p class="done-msg">${t('allDone')}</p><a class="btn big" href="#/study/more">${t('learnMore')}</a>`}
    </section>
    <section class="tiles">
      <div class="tile"><span class="dot new"></span><b>${c.new}</b><span>${t('statNew')}</span></div>
      <div class="tile"><span class="dot learning"></span><b>${c.learning}</b><span>${t('statLearning')}</span></div>
      <div class="tile"><span class="dot mastered"></span><b>${c.mastered}</b><span>${t('statMastered')}</span></div>
    </section>
    <section class="card">
      <h2>${t('levels')}</h2>
      ${LEVELS.map((lv) => levelRow(lv, words)).join('')}
    </section>
    <section class="card today">
      <h2>${t('today')}</h2>
      <p><b>${day.rev}</b> ${t('reviews')} · <b>${pct(day.ok, day.ok + day.bad)}%</b> ${t('accuracy')}</p>
    </section>`;
}

function levelRow(lv, words) {
  if (!hasPack(lv)) return `<div class="lvl muted"><span class="lvl-name">${lv}</span><div class="bar"></div><span class="lvl-num">${t('soon')}</span></div>`;
  const ws = words.filter((w) => w.level === lv);
  const c = counts(ws);
  return `<div class="lvl"><span class="lvl-name">${lv}</span>${stackBar(c, ws.length)}<span class="lvl-num">${c.mastered + c.learning}/${ws.length}</span></div>`;
}

function stackBar(c, total) {
  return `<div class="bar"><i class="mastered" style="width:${pct(c.mastered, total)}%"></i><i class="learning" style="width:${pct(c.learning, total)}%"></i></div>`;
}

// ---------- Estudar (cartões) ----------
let session = null;

function viewStudy(param) {
  const opts = {};
  if (param.startsWith('cat:')) opts.cat = param.slice(4);
  if (param === 'more') opts.extraNew = 5;
  const queue = buildSession(opts);
  session = { queue, done: 0, tries: 0, fails: 0, revealed: false, front: null, param };
  nextCard();
}

function nextCard() {
  if (!session.queue.length) return studyDone();
  const dir = store.settings.direction;
  session.front = dir === 'mix' ? (Math.random() < 0.5 ? 'de' : 'native') : dir;
  session.revealed = false;
  drawCard();
  const w = session.queue[0];
  if (store.settings.autoplay && session.front === 'de') speak(w.de);
}

function drawCard() {
  const w = session.queue[0];
  const st = stateOf(w.id);
  const total = session.done + session.queue.length;
  const c = CATEGORIES[w.cat] || CATEGORIES.custom;
  const showDe = session.front === 'de' || session.revealed;
  const showTr = session.front === 'native' || session.revealed;

  $view.innerHTML = `
    <div class="session-top">
      <div class="bar thin"><i class="mastered" style="width:${pct(session.done, total)}%"></i></div>
      <span class="muted">${session.done}/${total}</span>
    </div>
    <section class="card flash ${session.revealed ? 'revealed' : ''}">
      <div class="flash-meta">
        <span class="chip">${c.icon} ${esc(catLabel(w.cat, lang()))}</span>
        ${!st ? `<span class="chip new-chip">${t('newWord')}</span>` : ''}
        ${w.cognate && session.revealed ? `<span class="chip cog">≈ EN · ${t('cognate')}</span>` : ''}
      </div>
      ${showDe ? `<div class="de-word">${deHtml(w)} ${sayBtn(w.de)}</div>${session.revealed ? plHtml(w) : ''}` : '<div class="de-word placeholder">?</div>'}
      ${showTr ? `<div class="trs">${trHtml(w)}</div>` : ''}
    </section>
    ${session.revealed ? rateButtons(st) : `<button class="btn primary big" id="reveal">${t('show')}</button>`}
    <p class="hint muted">${t('keys')}</p>`;

  document.getElementById('reveal')?.addEventListener('click', reveal);
  $view.querySelectorAll('[data-rate]').forEach((b) => b.addEventListener('click', () => rate(+b.dataset.rate)));
}

function rateButtons(st) {
  const labels = [t('again'), t('hard'), t('good'), t('easy')];
  return `<div class="rate">${labels.map((l, i) =>
    `<button class="btn rate-${i}" data-rate="${i}"><b>${l}</b><small>${formatInterval(nextInterval(st, i), lang())}</small></button>`).join('')}</div>`;
}

function reveal() {
  if (!session || session.revealed) return;
  session.revealed = true;
  drawCard();
  if (store.settings.autoplay && session.front === 'native') speak(session.queue[0].de);
}

function rate(r) {
  if (!session?.revealed) return;
  const w = session.queue.shift();
  review(w.id, r);
  session.tries++;
  if (r === 0) { session.fails++; session.queue.splice(Math.min(3, session.queue.length), 0, w); }
  else session.done++;
  renderNav('study');
  nextCard();
}

function studyDone() {
  const n = session.done;
  $view.innerHTML = `
    <section class="card center">
      <div class="big-emoji">🎉</div>
      <h1>${n ? t('sessionDone') : t('allDone')}</h1>
      ${n ? `<p class="muted">${t('sessionStats', n, pct(session.tries - session.fails, session.tries))}</p>` : ''}
      <div class="row">
        <a class="btn" href="#/home">${t('backHome')}</a>
        <a class="btn primary" href="#/study/more">${t('learnMore')}</a>
      </div>
    </section>`;
  session = null;
}

document.addEventListener('keydown', (e) => {
  if (!session || e.target.matches('input, textarea, select')) return;
  if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); if (!session.revealed) reveal(); else rate(2); }
  else if (['1', '2', '3', '4'].includes(e.key)) rate(+e.key - 1);
});

// ---------- Quiz ----------
let quiz = null;
const QUIZ_MODES = ['dePt', 'deEn', 'ptDe', 'enDe', 'art', 'write'];
const QUIZ_LABEL = { dePt: 'qDePt', deEn: 'qDeEn', ptDe: 'qPtDe', enDe: 'qEnDe', art: 'qArt', write: 'qWrite' };

function viewQuiz(mode) {
  session = null;
  if (!QUIZ_MODES.includes(mode)) return quizMenu();
  const onlySeen = store.data.quizOnlySeen ?? true;
  const fits = (w) => mode !== 'art' || (w.art && w.pl !== '(Pl.)');
  let pool = allWords().filter((w) => fits(w) && (!onlySeen || stateOf(w.id)));
  // Poucas palavras estudadas ainda: usa o nível atual inteiro.
  if (pool.length < 4) pool = allWords().filter((w) => fits(w) && w.level === store.settings.level);
  if (pool.length < 4) {
    $view.innerHTML = `<section class="card center"><p>${t('quizNeedWords')}</p><a class="btn primary" href="#/study">${t('startStudy')}</a></section>`;
    return;
  }
  const questions = shuffle(pool).slice(0, 10);
  quiz = { mode, questions, i: 0, score: 0, answered: false, pool };
  drawQuestion();
}

function quizMenu() {
  const onlySeen = store.data.quizOnlySeen ?? true;
  $view.innerHTML = `
    <h1 class="title">${t('quizPick')}</h1>
    <div class="menu">${QUIZ_MODES.map((m) => `<a class="card menu-item" href="#/quiz/${m}">${t(QUIZ_LABEL[m])}</a>`).join('')}</div>
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

function drawQuestion() {
  const { mode, questions, i } = quiz;
  const w = questions[i];
  quiz.answered = false;
  let prompt = '', body = '';

  if (mode === 'dePt' || mode === 'deEn') {
    prompt = `<div class="de-word">${deHtml(w)} ${sayBtn(w.de)}</div>`;
  } else if (mode === 'ptDe') {
    prompt = `<div class="q-native"><span class="tag">PT</span>${esc(w.pt)}</div>`;
  } else if (mode === 'enDe') {
    prompt = `<div class="q-native"><span class="tag">EN</span>${esc(w.en)}</div>`;
  } else if (mode === 'art') {
    prompt = `<div class="de-word">___ ${esc(w.base)} ${sayBtn(w.de)}</div><div class="trs">${trHtml(w, { speakers: false })}</div>`;
  } else {
    prompt = `<div class="trs">${trHtml(w, { speakers: false })}</div>`;
  }

  if (mode === 'art') {
    body = `<div class="opts arts">${['der', 'die', 'das'].map((a) => `<button class="btn opt art-btn art-${a}" data-ans="${a}">${a}</button>`).join('')}</div>`;
  } else if (mode === 'write') {
    body = `<form id="wform" class="write">
      <input id="winput" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(t('typeHere'))}">
      <div class="umlauts">${['ä', 'ö', 'ü', 'ß'].map((c) => `<button type="button" class="btn sm" data-ch="${c}">${c}</button>`).join('')}</div>
      <button class="btn primary big" type="submit">${t('check')}</button></form>`;
  } else {
    const opts = shuffle([w, ...distractors(w, mode)]);
    body = `<div class="opts">${opts.map((o) => `<button class="btn opt" data-id="${esc(o.id)}">${mode === 'ptDe' || mode === 'enDe' ? deHtml(o) : esc(optionText(o, mode))}</button>`).join('')}</div>`;
  }

  $view.innerHTML = `
    <div class="session-top">
      <div class="bar thin"><i class="mastered" style="width:${pct(i, questions.length)}%"></i></div>
      <span class="muted">${i + 1}/${questions.length}</span>
    </div>
    <section class="card flash"><div class="flash-meta"><span class="chip">${t(QUIZ_LABEL[mode])}</span></div>${prompt}</section>
    ${body}
    <div id="feedback"></div>`;

  if (store.settings.autoplay && ['dePt', 'deEn'].includes(mode)) speak(w.de);

  $view.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
    if (quiz.answered) return;
    const ok = mode === 'art' ? b.dataset.ans === w.art : b.dataset.id === w.id;
    b.classList.add(ok ? 'ok' : 'bad');
    if (!ok) {
      const right = [...$view.querySelectorAll('.opt')].find((x) => (mode === 'art' ? x.dataset.ans === w.art : x.dataset.id === w.id));
      right?.classList.add('ok');
    }
    answer(ok);
  }));

  const form = document.getElementById('wform');
  if (form) {
    const input = document.getElementById('winput');
    input.focus();
    $view.querySelectorAll('[data-ch]').forEach((b) => b.addEventListener('click', () => {
      const p = input.selectionStart ?? input.value.length;
      input.value = input.value.slice(0, p) + b.dataset.ch + input.value.slice(input.selectionEnd ?? p);
      input.focus();
      input.setSelectionRange(p + 1, p + 1);
    }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (quiz.answered) return nextQuestion();
      const norm = (s) => s.toLowerCase().replace(/[?!.,…]/g, '').replace(/\s+/g, ' ').trim();
      const v = norm(input.value);
      if (!v) return;
      const ok = v === norm(w.de) || (w.art && v === norm(w.base));
      input.classList.add(ok ? 'ok' : 'bad');
      input.readOnly = true;
      answer(ok);
    });
  }
}

function answer(ok) {
  const w = quiz.questions[quiz.i];
  quiz.answered = true;
  if (ok) quiz.score++;
  quizResult(w.id, ok);
  speak(w.de);
  document.getElementById('feedback').innerHTML = `
    <div class="card feedback ${ok ? 'ok' : 'bad'}">
      <b>${ok ? t('correct') : t('wrong')}</b>
      <div class="de-word sm">${deHtml(w)} ${sayBtn(w.de)}</div>${plHtml(w)}
      <div class="trs">${trHtml(w)}</div>
    </div>
    <button class="btn primary big" id="next">${t('next')}</button>`;
  document.getElementById('next').addEventListener('click', nextQuestion);
  if (quiz.mode !== 'write') document.getElementById('next').focus();
}

function nextQuestion() {
  quiz.i++;
  if (quiz.i < quiz.questions.length) return drawQuestion();
  const { score, questions, mode } = quiz;
  $view.innerHTML = `
    <section class="card center">
      <div class="big-emoji">${score / questions.length >= 0.8 ? '🏆' : score / questions.length >= 0.5 ? '💪' : '📚'}</div>
      <h1>${t('score', score, questions.length)}</h1>
      <div class="row">
        <a class="btn" href="#/quiz">${t('quiz')}</a>
        <button class="btn primary" id="again">${t('again2')}</button>
      </div>
    </section>`;
  document.getElementById('again').addEventListener('click', () => viewQuiz(mode));
  quiz = null;
}

// ---------- Palavras ----------
const wf = { q: '', level: '', cat: '', status: '' };

function viewWords() {
  session = null;
  const cats = Object.keys(CATEGORIES);
  $view.innerHTML = `
    <div class="words-head">
      <h1 class="title">${t('words')}</h1>
      <button class="btn primary" id="addWord">${ICON.plus}<span>${t('addWord')}</span></button>
    </div>
    <div class="filters">
      <input id="wq" type="search" placeholder="${esc(t('search'))}" value="${esc(wf.q)}">
      <div class="row">
        <select id="wlevel"><option value="">${t('allLevels')}</option>${LEVELS.map((l) => `<option ${wf.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select id="wcat"><option value="">${t('allCats')}</option>${cats.map((c) => `<option value="${c}" ${wf.cat === c ? 'selected' : ''}>${CATEGORIES[c].icon} ${esc(catLabel(c, lang()))}</option>`).join('')}</select>
      </div>
      <div class="chips" id="wstatus">
        ${[['', t('allStatus')], ['new', t('statNew')], ['learning', t('statLearning')], ['mastered', t('statMastered')]].map(([v, l]) =>
          `<button class="chip-btn ${wf.status === v ? 'active' : ''}" data-v="${v}">${v ? `<span class="dot ${v}"></span>` : ''}${l}</button>`).join('')}
      </div>
    </div>
    <div id="wlist"></div>`;

  const q = document.getElementById('wq');
  q.addEventListener('input', () => { wf.q = q.value; drawWordList(); });
  document.getElementById('wlevel').addEventListener('change', (e) => { wf.level = e.target.value; drawWordList(); });
  document.getElementById('wcat').addEventListener('change', (e) => { wf.cat = e.target.value; drawWordList(); });
  document.getElementById('wstatus').addEventListener('click', (e) => {
    const b = e.target.closest('[data-v]');
    if (!b) return;
    wf.status = b.dataset.v;
    document.querySelectorAll('#wstatus .chip-btn').forEach((x) => x.classList.toggle('active', x === b));
    drawWordList();
  });
  document.getElementById('addWord').addEventListener('click', () => wordForm());
  drawWordList();
}

function drawWordList() {
  const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const q = fold(wf.q.trim());
  const words = allWords().filter((w) =>
    (!wf.level || w.level === wf.level) && (!wf.cat || w.cat === wf.cat) && (!wf.status || statusOf(w.id) === wf.status) &&
    (!q || fold(`${w.de} ${w.pl} ${w.en} ${w.pt}`).includes(q)));
  const groups = {};
  for (const w of words) (groups[w.cat] ||= []).push(w);

  const $list = document.getElementById('wlist');
  $list.innerHTML = Object.entries(groups).map(([cat, ws]) => `
    <section class="card group">
      <div class="group-head">
        <h2>${CATEGORIES[cat]?.icon || '⭐'} ${esc(catLabel(cat, lang()))} <small class="muted">${t('count', ws.length)}</small></h2>
        <a class="btn sm" href="#/study/cat:${encodeURIComponent(cat)}">${t('studyCat')}</a>
      </div>
      <ul class="wlist">${ws.map((w) => `
        <li data-id="${esc(w.id)}">
          <span class="dot ${statusOf(w.id)}"></span>
          <span class="w-de">${deHtml(w)}</span>
          <span class="w-tr muted">${esc(store.settings.show === 'pt' ? w.pt : store.settings.show === 'en' ? w.en : `${w.en} · ${w.pt}`)}</span>
          ${sayBtn(w.de, 'de-DE', 'sm')}
        </li>`).join('')}</ul>
    </section>`).join('') || `<p class="muted center">—</p>`;

  $list.querySelectorAll('li[data-id]').forEach((li) => li.addEventListener('click', () => wordDetail(li.dataset.id)));
}

const $dialog = document.getElementById('dialog');
function openDialog(html) {
  $dialog.innerHTML = `<div class="dialog-body">${html}</div>`;
  if (!$dialog.open) $dialog.showModal();
}
$dialog.addEventListener('click', (e) => { if (e.target === $dialog || e.target.closest('[data-close]')) $dialog.close(); });

function wordDetail(id) {
  const w = wordById(id);
  if (!w) return;
  const st = stateOf(id);
  const status = statusOf(id);
  const c = CATEGORIES[w.cat] || CATEGORIES.custom;
  openDialog(`
    <div class="flash-meta"><span class="chip">${c.icon} ${esc(catLabel(w.cat, lang()))}</span><span class="chip">${w.level}</span>
      ${w.cognate ? `<span class="chip cog">≈ EN · ${t('cognate')}</span>` : ''}</div>
    <div class="de-word">${deHtml(w)} ${sayBtn(w.de)}</div>${plHtml(w)}
    <div class="trs">${trHtml(w)}</div>
    <dl class="meta">
      <dt>${t('status')}</dt><dd><span class="dot ${status}"></span> ${STATUS_LABEL()[status]}</dd>
      ${st ? `<dt>${t('nextReview')}</dt><dd>${new Date(st.d).toLocaleDateString(lang() === 'pt' ? 'pt-BR' : lang())}</dd>
      <dt>✓ / ✗</dt><dd>${st.c} / ${st.w}</dd>` : ''}
    </dl>
    <div class="row wrap">
      ${st ? `<button class="btn" id="dReset">${t('resetWord')}</button>` : ''}
      ${w.custom ? `<button class="btn" id="dEdit">${t('edit')}</button><button class="btn danger" id="dDel">${t('del')}</button>` : ''}
      <button class="btn primary" data-close>OK</button>
    </div>`);
  document.getElementById('dReset')?.addEventListener('click', () => { resetWord(id); $dialog.close(); drawWordList(); });
  document.getElementById('dEdit')?.addEventListener('click', () => wordForm(w));
  document.getElementById('dDel')?.addEventListener('click', () => {
    if (!confirm(t('confirmDel'))) return;
    store.data.custom = store.data.custom.filter((x) => x.id !== id);
    resetWord(id);
    invalidateWords();
    $dialog.close();
    drawWordList();
  });
}

function wordForm(w = null) {
  const cats = Object.keys(CATEGORIES);
  openDialog(`
    <h2>${w ? t('edit') : t('addWord')}</h2>
    <form id="wordForm" class="form">
      <label>${t('fDe')}<input name="de" required value="${esc(w?.de)}" placeholder="der Hund"></label>
      <label>${t('fPl')}<input name="pl" value="${esc(w?.pl)}" placeholder="die Hunde"></label>
      <label>${t('fEn')}<input name="en" required value="${esc(w?.en)}" placeholder="dog"></label>
      <label>${t('fPt')}<input name="pt" required value="${esc(w?.pt)}" placeholder="cachorro"></label>
      <div class="row">
        <label>${t('fCat')}<select name="cat">${cats.map((c) => `<option value="${c}" ${(w?.cat || 'custom') === c ? 'selected' : ''}>${CATEGORIES[c].icon} ${esc(catLabel(c, lang()))}</option>`).join('')}</select></label>
        <label>${t('fLevel')}<select name="level">${LEVELS.map((l) => `<option ${(w?.level || 'A1') === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </div>
      <div class="umlauts">${['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'].map((c) => `<button type="button" class="btn sm" data-ch="${c}">${c}</button>`).join('')}</div>
      <div class="row"><button type="button" class="btn" data-close>${t('cancel')}</button><button class="btn primary" type="submit">${t('save')}</button></div>
    </form>`);
  const form = document.getElementById('wordForm');
  let lastInput = form.de;
  form.addEventListener('focusin', (e) => { if (e.target.tagName === 'INPUT') lastInput = e.target; });
  form.querySelectorAll('[data-ch]').forEach((b) => b.addEventListener('click', () => { lastInput.value += b.dataset.ch; lastInput.focus(); }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    if (!f.de.trim() || !f.en.trim() || !f.pt.trim()) return alert(t('required'));
    const rec = { id: w?.id || `custom:${Date.now()}`, de: f.de.trim(), pl: f.pl.trim(), en: f.en.trim(), pt: f.pt.trim(), cat: f.cat, level: f.level };
    makeWord(rec); // valida o formato
    if (w) store.data.custom = store.data.custom.map((x) => (x.id === w.id ? rec : x));
    else store.data.custom.push(rec);
    store.save();
    invalidateWords();
    $dialog.close();
    drawWordList();
  });
}

// ---------- Progresso ----------
function viewProgress() {
  session = null;
  const words = allWords();
  const c = counts(words);
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push({ d, v: store.data.days[todayKey(d)]?.rev || 0 });
  }
  const max = Math.max(1, ...days.map((x) => x.v));
  const totals = Object.values(store.data.days).reduce((a, d) => ({ ok: a.ok + (d.ok || 0), bad: a.bad + (d.bad || 0), rev: a.rev + (d.rev || 0) }), { ok: 0, bad: 0, rev: 0 });
  const byCat = {};
  for (const w of words) (byCat[w.cat] ||= []).push(w);
  const loc = lang() === 'pt' ? 'pt-BR' : lang();

  $view.innerHTML = `
    <h1 class="title">${t('progress')}</h1>
    <section class="tiles">
      <div class="tile"><span class="dot new"></span><b>${c.new}</b><span>${t('statNew')}</span></div>
      <div class="tile"><span class="dot learning"></span><b>${c.learning}</b><span>${t('statLearning')}</span></div>
      <div class="tile"><span class="dot mastered"></span><b>${c.mastered}</b><span>${t('statMastered')}</span></div>
    </section>
    <section class="card">
      <h2>${t('activity')}</h2>
      <div class="chart">${days.map((x) => `<div class="col" title="${x.v} ${t('reviews')}"><i style="height:${(x.v / max) * 100}%"></i><span>${x.d.toLocaleDateString(loc, { weekday: 'narrow' })}</span></div>`).join('')}</div>
      <p class="muted">${t('total')}: <b>${totals.rev}</b> ${t('reviews')} · <b>${pct(totals.ok, totals.ok + totals.bad)}%</b> ${t('accuracy')} · <b>${streak()}</b> ${t('streak')}</p>
    </section>
    <section class="card">
      <h2>${t('byLevel')}</h2>
      ${LEVELS.map((lv) => levelRow(lv, words)).join('')}
    </section>
    <section class="card">
      <h2>${t('byCat')}</h2>
      ${Object.entries(byCat).map(([cat, ws]) => {
        const cc = counts(ws);
        return `<a class="lvl link" href="#/study/cat:${encodeURIComponent(cat)}"><span class="lvl-name wide">${CATEGORIES[cat]?.icon || '⭐'} ${esc(catLabel(cat, lang()))}</span>${stackBar(cc, ws.length)}<span class="lvl-num">${cc.mastered + cc.learning}/${ws.length}</span></a>`;
      }).join('')}
      <div class="legend"><span><span class="dot mastered"></span>${t('statMastered')}</span><span><span class="dot learning"></span>${t('statLearning')}</span><span><span class="dot new"></span>${t('statNew')}</span></div>
    </section>`;
}

// ---------- Ajustes ----------
function viewSettings() {
  session = null;
  const s = store.settings;
  const sel = (key, opts) => `<select data-set="${key}">${opts.map(([v, l]) => `<option value="${v}" ${String(s[key]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  $view.innerHTML = `
    <h1 class="title">${t('settings')}</h1>
    <section class="card form">
      <label>${t('sUi')}${sel('ui', [['pt', 'Português'], ['en', 'English'], ['de', 'Deutsch']])}</label>
      <label>${t('sShow')}${sel('show', [['both', t('sBoth')], ['en', t('sOnlyEn')], ['pt', t('sOnlyPt')]])}</label>
      <label>${t('sDir')}${sel('direction', [['de', t('sDirDe')], ['native', t('sDirNative')], ['mix', t('sDirMix')]])}</label>
      <label>${t('sNew')}${sel('newPerDay', [5, 10, 15, 20, 30, 50].map((n) => [n, n]))}</label>
      <label>${t('sRate')}${sel('rate', [[0.7, '0.7×'], [0.8, '0.8×'], [0.9, '0.9×'], [1, '1×'], [1.1, '1.1×']])}</label>
      <label class="check"><input type="checkbox" data-set="autoplay" ${s.autoplay ? 'checked' : ''}> ${t('sAuto')}</label>
      ${canSpeak() ? `<button class="btn" data-say="Hallo! Ich lerne Deutsch." data-lang="de-DE">${ICON.speaker}<span>Hallo! Ich lerne Deutsch.</span></button>` : `<p class="muted">${t('noVoice')}</p>`}
    </section>
    <section class="card form">
      <h2>${t('sData')}</h2>
      <p class="muted">${t('dataNote')}</p>
      <div class="row wrap">
        <button class="btn" id="exp">${t('export')}</button>
        <label class="btn file">${t('import')}<input type="file" id="imp" accept="application/json,.json" hidden></label>
        <button class="btn danger" id="rst">${t('reset')}</button>
      </div>
    </section>
    <p class="muted center small">Wortschatz · v0.1</p>`;

  $view.querySelectorAll('[data-set]').forEach((el) => el.addEventListener('change', () => {
    const key = el.dataset.set;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (['newPerDay', 'rate'].includes(key)) v = Number(v);
    store.setSetting(key, v);
    if (key === 'ui') render();
  }));
  document.getElementById('exp').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `wortschatz-backup-${todayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  document.getElementById('imp').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (typeof data !== 'object' || typeof data.progress !== 'object') throw new Error('bad');
      store.replace(data);
      invalidateWords();
      alert(t('imported'));
      render();
    } catch { alert(t('badFile')); }
  });
  document.getElementById('rst').addEventListener('click', () => {
    if (!confirm(t('confirmReset'))) return;
    store.reset();
    invalidateWords();
    render();
  });
}

// ---------- início do app ----------
render();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
