// Lição da trilha: sequência de exercícios estilo Duolingo, ficando mais difícil a cada unidade.
import { store } from '../store.js';
import { allWords } from '../words.js';
import { stateOf, review, quizResult } from '../srs.js';
import { lessonById, isUnlocked, completeLesson, allSentences, currentLesson, unitTitle } from '../course.js';
import { addXp, checkBadges, XP } from '../gamify.js';
import { t, lang } from '../i18n.js';
import { speak } from '../speech.js';
import { $view, esc, pct, shuffle, deHtml, trHtml, plHtml, sayBoth, ICON } from '../ui.js';
import { sfx, haptic, confetti, toast, floatText, animateIn } from '../fx.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let L = null;
let rec = null;

// ---------- texto ----------
const tokens = (s) => s.split(/\s+/).map((x) => x.replace(/^[„“"¿¡(]+|[.,!?;:"“”)]+$/g, '')).filter(Boolean);
const fold = (s) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[„“"”.,!?;:¿¡()…]/g, '').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) { const tmp = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = tmp; }
  }
  return row[b.length];
}
// Compara o que foi digitado: exato = certo; 1 errinho a cada ~10 letras = "quase" (conta como certo).
function compareTyped(input, targets) {
  const v = fold(input);
  let best = Infinity;
  for (const tg of targets) best = Math.min(best, lev(v, fold(tg)));
  if (best === 0) return 'ok';
  const len = fold(targets[0]).length;
  return best <= Math.max(1, Math.floor(len / 10)) ? 'almost' : 'bad';
}
function lcs(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length];
}

const natPick = () => { const s = store.settings.show; return s === 'both' ? (Math.random() < 0.5 ? 'pt' : 'en') : s; };
const tag = (l) => `<span class="tag">${l.toUpperCase()}</span>`;

// ---------- montagem dos exercícios ----------
function buildExercises(lesson) {
  const u = lesson.unit.index;
  const hard = u >= 4, harder = u >= 9;
  const ex = [];
  const E = (type, extra) => ({ type, nat: natPick(), ...extra });
  const ws = lesson.words;
  const nouns = ws.filter((w) => w.art && w.pl !== '(Pl.)');

  if (lesson.type === 'words') {
    // Apresenta de duas em duas: conhece a palavra e logo escolhe o significado.
    for (let i = 0; i < ws.length; i += 2) {
      const pair = ws.slice(i, i + 2);
      pair.forEach((w) => ex.push(E('intro', { w })));
      pair.forEach((w) => ex.push(E('meaning', { w })));
    }
    const rest = [];
    const sh = shuffle(ws);
    sh.slice(0, 3).forEach((w) => rest.push(E('listen', { w })));
    sh.slice(3).forEach((w) => rest.push(E('toGerman', { w })));
    shuffle(nouns).slice(0, 2).forEach((w) => rest.push(E('article', { w })));
    if (lesson.k >= 1 || hard) shuffle(ws).slice(0, harder ? 3 : 2).forEach((w) => rest.push(E('typeWord', { w })));
    ex.push(...shuffle(rest));
    if (ws.length >= 4) ex.push(E('pairs', { words: shuffle(ws).slice(0, 5) }));
  } else if (lesson.type === 'sentences') {
    lesson.sentences.forEach((s, i) => ex.push(E(i % 2 ? 'buildNative' : 'buildDe', { s })));
    const sh = shuffle(lesson.sentences);
    const rest = [];
    sh.slice(0, 2).forEach((s) => rest.push(E('listenBuild', { s })));
    if (u >= 2) sh.slice(2, harder ? 5 : 3).forEach((s) => rest.push(E('typeSentence', { s })));
    shuffle(lesson.sentences).slice(0, 2).forEach((s) => rest.push(E(SR ? 'speak' : 'listenBuild', { s })));
    ex.push(...shuffle(rest));
  } else {
    const types = hard ? ['toGerman', 'listen', 'typeWord', 'typeWord'] : ['meaning', 'toGerman', 'listen', 'typeWord'];
    shuffle(ws).slice(0, 7).forEach((w, i) => ex.push(E(types[i % types.length], { w })));
    shuffle(nouns).slice(0, 2).forEach((w) => ex.push(E('article', { w })));
    const sTypes = hard ? ['typeSentence', 'listenBuild', 'buildDe'] : ['buildDe', 'listenBuild', 'buildNative'];
    shuffle(lesson.sentences).slice(0, 3).forEach((s, i) => ex.push(E(sTypes[i % sTypes.length], { s })));
    if (SR && lesson.sentences.length) ex.push(E('speak', { s: shuffle(lesson.sentences)[0] }));
    ex.sort(() => Math.random() - 0.5);
    if (ws.length >= 4) ex.push(E('pairs', { words: shuffle(ws).slice(0, 5) }));
  }
  return ex;
}

function distractorWords(w, n = 3) {
  const all = allWords().filter((x) => !x.custom);
  const same = shuffle(all.filter((x) => x.cat === w.cat && x.id !== w.id));
  const other = shuffle(all.filter((x) => x.cat !== w.cat));
  const seen = new Set([w.pt, w.en, w.de]);
  const out = [];
  for (const x of [...same, ...other]) {
    if (out.length >= n) break;
    if (!seen.has(x.pt) && !seen.has(x.en) && !seen.has(x.de)) { seen.add(x.pt); seen.add(x.en); seen.add(x.de); out.push(x); }
  }
  return out;
}

function bankFor(text, field) {
  const target = tokens(text);
  const low = new Set(target.map((x) => x.toLowerCase()));
  const pool = shuffle(allSentences().flatMap((s) => tokens(s[field]))).filter((x) => !low.has(x.toLowerCase()));
  const extra = [...new Set(pool)].slice(0, Math.min(4, Math.max(2, Math.round(target.length / 2))));
  return { target, bank: shuffle([...target, ...extra]) };
}

// ---------- tela ----------
export function viewLesson(id) {
  const lesson = lessonById(id);
  if (!lesson || !isUnlocked(id)) {
    toast(t('lockedMsg'), { icon: '🔒' });
    location.hash = '#/study';
    return undefined;
  }
  const queue = buildExercises(lesson);
  L = { lesson, queue, done: 0, mistakes: 0, correct: 0, xp: 0, t0: Date.now(), wrongIds: new Set(), seenIds: new Set(), state: 'idle', ex: null };
  document.body.classList.add('focus');
  $view.innerHTML = `
    <div class="lesson-top">
      <a class="icon-btn close" href="#/study" aria-label="${esc(t('backPath'))}">✕</a>
      <div class="bar thin grow"><i class="mastered" id="lbar"></i></div>
      <span class="xp-chip" id="lxp">0 XP</span>
    </div>
    <div id="ex"></div>
    <div class="ex-foot" id="foot"></div>`;
  next();
  return () => { stopRec(); L = null; document.body.classList.remove('focus'); };
}

function updateTop() {
  document.getElementById('lbar').style.width = `${pct(L.done, L.done + L.queue.length)}%`;
  document.getElementById('lxp').textContent = `${L.xp} XP`;
}

function next() {
  if (!L) return;
  stopRec();
  updateTop();
  if (!L.queue.length) return finish();
  L.ex = L.queue[0];
  L.ex.pick = undefined;
  L.ex.heard = undefined;
  L.state = 'idle';
  L.answer = null;
  const $ex = document.getElementById('ex');
  $ex.innerHTML = `<div class="ex-in">${RENDER[L.ex.type](L.ex)}</div>`;
  BIND[L.ex.type]?.(L.ex, $ex);
  footIdle();
}

function footIdle() {
  const ex = L.ex;
  const $f = document.getElementById('foot');
  $f.className = 'ex-foot';
  if (ex.type === 'intro') {
    $f.innerHTML = `<button class="btn primary big" id="go">${t('continue')}</button>`;
    document.getElementById('go').addEventListener('click', () => { L.queue.shift(); L.done++; next(); });
    return;
  }
  if (ex.type === 'pairs') { $f.innerHTML = ''; return; }
  $f.innerHTML = `${ex.type === 'speak' ? `<button class="btn" id="skip">${t('cantSpeak')}</button>` : ''}
    <button class="btn primary big" id="go" disabled>${t('check')}</button>`;
  document.getElementById('go').addEventListener('click', check);
  document.getElementById('skip')?.addEventListener('click', () => { stopRec(); L.queue.shift(); next(); });
}

function setReady(v) {
  const b = document.getElementById('go');
  if (b && L.state === 'idle') b.disabled = !v;
}

function check() {
  if (!L || L.state !== 'idle') return;
  const res = CHECK[L.ex.type](L.ex);
  if (!res) return;
  resolve(res);
}

function resolve({ ok, almost = false, answer = '' }) {
  const ex = L.ex;
  L.state = 'feedback';
  const id = ex.w?.id || ex.s?.id;
  if (ex.w) (ok ? L.seenIds : L.wrongIds).add(ex.w.id);
  if (ok) {
    L.correct++;
    L.xp += XP.quiz;
    addXp(XP.quiz);
    sfx('good'); haptic(10);
    const b = document.getElementById('go')?.getBoundingClientRect();
    if (b) floatText(t('earned', XP.quiz), b.left + b.width / 2, b.top);
  } else {
    L.mistakes++;
    sfx('bad'); haptic([30, 40, 30]);
    // Errou: o mesmo exercício volta no fim da lição.
    L.queue.push({ ...ex, retry: true });
  }
  L.queue.shift();
  if (ok) L.done++;
  updateTop();
  const praise = t('praise');
  const $f = document.getElementById('foot');
  $f.className = `ex-foot ${ok ? 'ok' : 'bad'}`;
  $f.innerHTML = `
    <div class="fb">
      <b>${ok ? (almost ? `👍 ${t('almost')}` : `✓ ${praise[Math.floor(Math.random() * praise.length)]}`) : `✗ ${t('wrong')}`}</b>
      ${!ok || almost ? `<div class="fb-ans">${answer}</div>` : ''}
    </div>
    <button class="btn primary big" id="go2">${t('continue')}</button>`;
  document.getElementById('go2').addEventListener('click', next);
  document.getElementById('go2').focus({ preventScroll: true });
  $view.querySelectorAll('.opt, .tok, input').forEach((x) => { x.disabled = true; });
  if (id && ex.s) speak(ex.s.de);
  else if (ex.w) speak(ex.w.de);
}

// ---------- tipos de exercício ----------
const head = (title) => `<h2 class="ex-title">${title}</h2>`;
const wordOpts = (opts, fmt) => `<div class="opts">${opts.map((o, i) => `<button class="btn opt" style="--i:${i}" data-id="${esc(o.id)}"><span class="key">${i + 1}</span>${fmt(o)}</button>`).join('')}</div>`;
const playBtns = (de) => `<div class="play-row"><button class="play-big" data-play="${esc(de)}">${ICON.speaker}</button><button class="play-slow" data-play="${esc(de)}" data-speed="slower">🐢</button></div>`;
const typeBox = () => `<div class="write"><input id="tin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(t('typeHere'))}">
  <div class="umlauts">${['ä', 'ö', 'ü', 'ß'].map((c) => `<button type="button" class="btn sm" data-ch="${c}">${c}</button>`).join('')}</div></div>`;
const builder = () => `<div class="answer-line" id="ans"></div><div class="bank" id="bank"></div>`;

const RENDER = {
  intro: ({ w }) => `${head(`✨ ${t('exIntro')}`)}
    <section class="card flash intro-card pop-in">
      ${w.cognate ? `<div class="flash-meta"><span class="chip cog">≈ EN · ${t('cognate')}</span></div>` : ''}
      <div class="de-word">${deHtml(w)} ${sayBoth(w.de)}</div>${plHtml(w)}<div class="trs">${trHtml(w)}</div>
    </section>`,
  meaning: (ex) => `${head(t('exMeaning'))}
    <div class="prompt"><div class="de-word">${deHtml(ex.w)} ${sayBoth(ex.w.de)}</div></div>
    ${wordOpts(ex.opts ||= shuffle([ex.w, ...distractorWords(ex.w)]), (o) => `${tag(ex.nat)} ${esc(o[ex.nat])}`)}`,
  toGerman: (ex) => `${head(t('exToGerman'))}
    <div class="prompt"><div class="q-native">${tag(ex.nat)} ${esc(ex.w[ex.nat])}</div></div>
    ${wordOpts(ex.opts ||= shuffle([ex.w, ...distractorWords(ex.w)]), (o) => deHtml(o))}`,
  listen: (ex) => `${head(t('exListen'))}
    <div class="prompt">${playBtns(ex.w.de)}</div>
    ${wordOpts(ex.opts ||= shuffle([ex.w, ...distractorWords(ex.w)]), (o) => deHtml(o))}`,
  article: ({ w }) => `${head(t('exArticle'))}
    <div class="prompt"><div class="de-word"><span class="blank">___</span> ${esc(w.base)}</div><div class="trs">${trHtml(w, { speakers: false })}</div></div>
    <div class="opts arts">${['der', 'die', 'das'].map((a, i) => `<button class="btn opt art-btn art-${a}" data-ans="${a}"><span class="key">${i + 1}</span>${a}</button>`).join('')}</div>`,
  typeWord: (ex) => `${head(t('exTypeWord'))}
    <div class="prompt"><div class="q-native">${tag(ex.nat)} ${esc(ex.w[ex.nat])}</div></div>${typeBox()}`,
  pairs: (ex) => `${head(t('exPairs'))}
    <div class="match">
      <div class="col">${shuffle(ex.words).map((w, i) => `<button class="btn tile-btn" style="--i:${i}" data-side="l" data-id="${esc(w.id)}">${deHtml(w)}</button>`).join('')}</div>
      <div class="col">${shuffle(ex.words).map((w, i) => `<button class="btn tile-btn" style="--i:${i + 2}" data-side="r" data-id="${esc(w.id)}">${tag(ex.nat)} ${esc(w[ex.nat])}</button>`).join('')}</div>
    </div>`,
  buildDe: (ex) => `${head(t('exBuildDe'))}
    <div class="prompt"><div class="q-native sentence">${tag(ex.nat)} ${esc(ex.s[ex.nat])}</div></div>${builder()}`,
  buildNative: (ex) => `${head(t('exBuildNative'))}
    <div class="prompt"><div class="de-sentence">${esc(ex.s.de)} ${sayBoth(ex.s.de)}</div></div>${builder()}`,
  listenBuild: (ex) => `${head(t('exListenBuild'))}<div class="prompt">${playBtns(ex.s.de)}</div>${builder()}`,
  typeSentence: (ex) => `${head(t('exTypeSentence'))}
    <div class="prompt"><div class="q-native sentence">${tag(ex.nat)} ${esc(ex.s[ex.nat])}</div></div>${typeBox()}`,
  speak: (ex) => `${head(`🎙️ ${t('exSpeak')}`)}
    <div class="prompt"><div class="de-sentence">${esc(ex.s.de)} ${sayBoth(ex.s.de)}</div>
      <div class="trs">${tag(ex.nat)} ${esc(ex.s[ex.nat])}</div></div>
    <button class="mic" id="mic"><span>🎙️</span><small id="micLabel">${t('tapToSpeak')}</small></button>
    <p class="heard muted" id="heard"></p>`,
};

function bindOptions($ex, onPick) {
  $ex.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
    if (L.state !== 'idle') return;
    $ex.querySelectorAll('.opt').forEach((x) => x.classList.toggle('sel', x === b));
    onPick(b);
    setReady(true);
  }));
}

function bindBuilder($ex, text, field) {
  const { target, bank } = bankFor(text, field);
  L.ex.target = target;
  const $ans = $ex.querySelector('#ans');
  const $bank = $ex.querySelector('#bank');
  $bank.innerHTML = bank.map((w, i) => `<button class="tok" style="--i:${i}" data-i="${i}">${esc(w)}</button>`).join('');
  const sync = () => setReady($ans.children.length > 0);
  $bank.addEventListener('click', (e) => {
    const b = e.target.closest('.tok');
    if (!b || b.classList.contains('used') || L.state !== 'idle') return;
    b.classList.add('used');
    const a = document.createElement('button');
    a.className = 'tok in';
    a.textContent = b.textContent;
    a.dataset.i = b.dataset.i;
    $ans.append(a);
    if (field === 'de') speak(b.textContent, 'de-DE', 'normal');
    sync();
  });
  $ans.addEventListener('click', (e) => {
    const a = e.target.closest('.tok');
    if (!a || L.state !== 'idle') return;
    $bank.querySelector(`[data-i="${a.dataset.i}"]`)?.classList.remove('used');
    a.remove();
    sync();
  });
}

function bindTyping($ex) {
  const input = $ex.querySelector('#tin');
  input.focus({ preventScroll: true });
  input.addEventListener('input', () => setReady(input.value.trim().length > 0));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (L.state === 'idle') check(); else next(); } });
  $ex.querySelectorAll('[data-ch]').forEach((b) => b.addEventListener('click', () => {
    const p = input.selectionStart ?? input.value.length;
    input.value = input.value.slice(0, p) + b.dataset.ch + input.value.slice(input.selectionEnd ?? p);
    input.focus();
    input.setSelectionRange(p + 1, p + 1);
    setReady(true);
  }));
}

function bindPlay($ex) {
  $ex.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => speak(b.dataset.play, 'de-DE', b.dataset.speed || undefined)));
}

const BIND = {
  intro: ({ w }) => { if (store.settings.autoplay) speak(w.de); },
  meaning: (ex, $ex) => { bindOptions($ex, (b) => { ex.pick = b.dataset.id; }); if (store.settings.autoplay) speak(ex.w.de); },
  toGerman: (ex, $ex) => bindOptions($ex, (b) => { ex.pick = b.dataset.id; speak(allWords().find((w) => w.id === b.dataset.id)?.de || ''); }),
  listen: (ex, $ex) => { bindPlay($ex); bindOptions($ex, (b) => { ex.pick = b.dataset.id; }); speak(ex.w.de); },
  article: (ex, $ex) => bindOptions($ex, (b) => { ex.pick = b.dataset.ans; }),
  typeWord: (ex, $ex) => bindTyping($ex),
  pairs: (ex, $ex) => bindPairs(ex, $ex),
  buildDe: (ex, $ex) => bindBuilder($ex, ex.s.de, 'de'),
  buildNative: (ex, $ex) => { bindBuilder($ex, ex.s[ex.nat], ex.nat); if (store.settings.autoplay) speak(ex.s.de); },
  listenBuild: (ex, $ex) => { bindPlay($ex); bindBuilder($ex, ex.s.de, 'de'); speak(ex.s.de); },
  typeSentence: (ex, $ex) => bindTyping($ex),
  speak: (ex, $ex) => bindSpeak(ex, $ex),
};

const answerWord = (w) => `${deHtml(w)} <small class="muted">· ${esc(w.pt)} · ${esc(w.en)}</small>`;
const answerSentence = (s) => `${esc(s.de)}<br><small class="muted">${esc(s.pt)} · ${esc(s.en)}</small>`;

function markOpts(isRight) {
  $view.querySelectorAll('.opt').forEach((b) => {
    if (isRight(b)) b.classList.add('ok');
    else if (b.classList.contains('sel')) b.classList.add('bad');
  });
}

function checkBuilt(ex) {
  const got = [...document.querySelectorAll('#ans .tok')].map((x) => x.textContent);
  const ok = fold(got.join(' ')) === fold(ex.target.join(' '));
  document.getElementById('ans').classList.add(ok ? 'ok' : 'bad');
  return ok;
}

const CHECK = {
  meaning: (ex) => { const ok = ex.pick === ex.w.id; markOpts((b) => b.dataset.id === ex.w.id); return { ok, answer: answerWord(ex.w) }; },
  toGerman: (ex) => CHECK.meaning(ex),
  listen: (ex) => CHECK.meaning(ex),
  article: (ex) => { const ok = ex.pick === ex.w.art; markOpts((b) => b.dataset.ans === ex.w.art); return { ok, answer: answerWord(ex.w) }; },
  typeWord: (ex) => {
    const input = document.getElementById('tin');
    const r = compareTyped(input.value, ex.w.art ? [ex.w.de, ex.w.base] : [ex.w.de]);
    input.classList.add(r === 'bad' ? 'bad' : 'ok');
    return { ok: r !== 'bad', almost: r === 'almost', answer: answerWord(ex.w) };
  },
  buildDe: (ex) => ({ ok: checkBuilt(ex), answer: answerSentence(ex.s) }),
  buildNative: (ex) => ({ ok: checkBuilt(ex), answer: `${esc(ex.s[ex.nat])}<br><small class="muted">${esc(ex.s.de)}</small>` }),
  listenBuild: (ex) => CHECK.buildDe(ex),
  typeSentence: (ex) => {
    const input = document.getElementById('tin');
    const r = compareTyped(input.value, [ex.s.de]);
    input.classList.add(r === 'bad' ? 'bad' : 'ok');
    return { ok: r !== 'bad', almost: r === 'almost', answer: answerSentence(ex.s) };
  },
  speak: (ex) => {
    const target = tokens(ex.s.de).map(fold);
    let best = 0;
    for (const alt of ex.heard || []) best = Math.max(best, lcs(target, tokens(alt).map(fold)) / target.length);
    return { ok: best >= 0.7, almost: best >= 0.7 && best < 1, answer: `${answerSentence(ex.s)}<br><small>${t('youSaid')} “${esc((ex.heard || [''])[0])}”</small>` };
  },
};

function bindPairs(ex, $ex) {
  let left = null, right = null, found = 0, missed = false;
  $ex.querySelectorAll('.tile-btn').forEach((b) => b.addEventListener('click', () => {
    if (b.classList.contains('matched') || L.state !== 'idle') return;
    if (b.dataset.side === 'l') { left?.classList.remove('sel'); left = left === b ? null : b; left?.classList.add('sel'); speak(ex.words.find((w) => w.id === b.dataset.id).de, 'de-DE', 'normal'); }
    else { right?.classList.remove('sel'); right = right === b ? null : b; right?.classList.add('sel'); }
    if (!left || !right) return;
    const [l, r] = [left, right];
    left = right = null;
    if (l.dataset.id === r.dataset.id) {
      [l, r].forEach((x) => { x.classList.remove('sel'); x.classList.add('matched'); });
      sfx('good');
      if (++found === ex.words.length) setTimeout(() => resolve({ ok: true }), 350);
    } else {
      [l, r].forEach((x) => { x.classList.remove('sel'); x.classList.add('wrong'); setTimeout(() => x.classList.remove('wrong'), 450); });
      sfx('bad'); haptic([30, 40, 30]);
      if (!missed) { missed = true; L.mistakes++; }
    }
  }));
}

// ---------- fala ----------
function stopRec() { try { rec?.abort(); } catch { /* já parado */ } rec = null; }

function bindSpeak(ex, $ex) {
  const mic = $ex.querySelector('#mic');
  const label = $ex.querySelector('#micLabel');
  const heard = $ex.querySelector('#heard');
  if (store.settings.autoplay) speak(ex.s.de);
  mic.addEventListener('click', () => {
    if (L.state !== 'idle') return;
    if (rec) { rec.stop(); return; }
    rec = new SR();
    rec.lang = 'de-DE';
    rec.interimResults = true;
    rec.maxAlternatives = 4;
    mic.classList.add('on');
    label.textContent = t('listening');
    rec.onresult = (e) => {
      const r = e.results[e.results.length - 1];
      heard.textContent = `“${[...e.results].map((x) => x[0].transcript).join(' ')}”`;
      if (r.isFinal) ex.heard = [...r].map((a) => a.transcript);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast(t('noMic'), { icon: '🎙️' });
    };
    rec.onend = () => {
      mic.classList.remove('on');
      label.textContent = t('tapToSpeak');
      rec = null;
      if (ex.heard?.length && L?.ex === ex && L.state === 'idle') { setReady(true); check(); }
    };
    try { rec.start(); } catch { mic.classList.remove('on'); }
  });
}

// ---------- fim ----------
function finish() {
  const { lesson } = L;
  const total = L.correct + L.mistakes;
  const acc = pct(L.correct, total);
  // As palavras da lição entram na revisão espaçada (cartões) com o resultado de hoje.
  for (const w of lesson.words) {
    if (!L.seenIds.has(w.id) && !L.wrongIds.has(w.id)) continue;
    const wrong = L.wrongIds.has(w.id);
    if (!stateOf(w.id)) review(w.id, wrong ? 1 : 2);
    else quizResult(w.id, !wrong);
  }
  const first = !store.data.lessons?.[lesson.id];
  completeLesson(lesson.id, acc);
  addXp(15);
  L.xp += 15;
  const unitDone = lesson.type === 'check';
  const mins = Math.max(1, Math.round((Date.now() - L.t0) / 60000));
  const nextL = currentLesson();
  document.getElementById('foot').innerHTML = '';
  document.getElementById('foot').className = 'ex-foot';
  document.querySelector('.lesson-top .bar i').style.width = '100%';
  document.getElementById('ex').innerHTML = `
    <section class="card center pop-in done-card">
      <div class="big-emoji bounce">${unitDone ? '🏆' : acc === 100 ? '🌟' : '🎉'}</div>
      <h1>${unitDone ? t('unitDone') : t('lessonDone')}</h1>
      ${unitDone ? `<p class="muted">${esc(unitTitle(lesson.unit, lang()))}</p>` : ''}
      <div class="summary">
        <div><b data-count="${L.xp}">0</b><span>XP</span></div>
        <div><b data-count="${acc}">0</b><span>% ${t('accuracy')}</span></div>
        <div><b>${mins}</b><span>min</span></div>
      </div>
      <div class="row">
        <a class="btn" href="#/study">${t('backPath')}</a>
        ${nextL ? `<a class="btn primary" href="#/lesson/${encodeURIComponent(nextL.id)}">${t('nextLesson')} →</a>` : ''}
      </div>
    </section>`;
  animateIn(document.getElementById('ex'));
  sfx('win'); confetti(unitDone ? { count: 260, ms: 2600 } : {});
  if (first && unitDone) setTimeout(() => confetti({ count: 200 }), 700);
  checkBadges({ perfect: acc === 100 && total >= 10 });
  L.queue = [];
  L.state = 'done';
}

document.addEventListener('keydown', (e) => {
  if (!L || e.target.matches('input') || document.querySelector('dialog[open]')) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    if (L.state === 'feedback') next();
    else if (L.state === 'idle') { const b = document.getElementById('go'); if (b && !b.disabled) b.click(); }
  } else if (/^[1-4]$/.test(e.key) && L.state === 'idle') {
    $view.querySelectorAll('.opt')[+e.key - 1]?.click();
  }
});

// Só para os testes automáticos rodando no próprio computador.
if (location.hostname === 'localhost') window.__lesson = () => L;
