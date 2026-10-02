// Módulo "Montar frases": níveis de estrutura com blocos coloridos por função, do simples às frases longas.
import { store } from '../store.js';
import { LEVELS, ROLES } from '../data/build.js';
import { addXp, checkBadges, XP } from '../gamify.js';
import { t, lang } from '../i18n.js';
import { speak } from '../speech.js';
import { $view, esc, pct, shuffle, sayBoth, pronHtml } from '../ui.js';
import { sfx, haptic, confetti, toast, floatText, animateIn } from '../fx.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const COMMA = ['aber', 'denn', 'weil', 'dass', 'wenn', 'obwohl'];
let B = null;
let rec = null;

// ---------- dados ----------
export function buildText(chunks, question) {
  return chunks.map((c, i) => (i === 0 ? '' : c.r === 'C' && COMMA.includes(c.t.toLowerCase()) ? ', ' : ' ') + c.t).join('') + (question ? '?' : '.');
}

function parse(line) {
  const [blocks, en, pt, alt] = line.split('¦').map((x) => x.trim());
  const chunks = blocks.split(' / ').map((c) => { const [r, ...rest] = c.split('='); return { r, t: rest.join('=') }; });
  const q = en.endsWith('?');
  return { chunks, en, pt, q, de: buildText(chunks, q), alt: alt ? alt.split(';').map((x) => x.trim()) : [] };
}

const lines = (txt) => (txt || '').trim().split('\n').filter(Boolean).map(parse);
const fold = (s) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { let p = row[0]; row[0] = i; for (let j = 1; j <= b.length; j++) { const tmp = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = tmp; } }
  return row[b.length];
}
const nat = () => { const s = store.settings.show; return s === 'both' ? 'pt' : s; };
const roleName = (r) => ROLES[r]?.[lang()] || ROLES[r]?.pt || r;
const colored = (chunks, q) => `${chunks.map((c, i) => `${i && c.r === 'C' && COMMA.includes(c.t.toLowerCase()) ? ', ' : i ? ' ' : ''}<span class="blk r-${c.r}">${esc(c.t)}</span>`).join('')}${q ? '?' : '.'}`;
const formulaHtml = (f) => `<div class="formula">${f.map((r) => `<span class="blk r-${r}">${esc(roleName(r))}</span>`).join('<span class="plus">+</span>')}</div>`;
const done = (id) => Boolean(store.data.build?.[id]);
const unlocked = (i) => i === 0 || done(LEVELS[i - 1].id);

// ---------- lista de níveis ----------
export function viewBuild(param) {
  const i = LEVELS.findIndex((l) => l.id === param);
  if (i >= 0) {
    if (!unlocked(i)) { toast(t('lockedMsg'), { icon: '🔒' }); location.hash = '#/build'; return undefined; }
    return intro(i);
  }
  const n = LEVELS.filter((l) => done(l.id)).length;
  $view.innerHTML = `
    <section class="card path-top">
      <div>
        <h1 class="title">🧱 ${t('buildTitle')}</h1>
        <p class="muted">${t('buildIntro')}</p>
        <div class="bar"><i class="mastered" data-w="${pct(n, LEVELS.length)}"></i></div>
      </div>
    </section>
    <div class="levels">
      ${LEVELS.map((l, k) => {
        const st = done(l.id) ? 'done' : unlocked(k) ? 'current' : 'locked';
        return `<a class="card level ${st}" href="#/build/${l.id}" data-state="${st}" style="--i:${k}">
          <span class="lv-num">${st === 'done' ? '✓' : st === 'locked' ? '🔒' : k + 1}</span>
          <div class="lv-body"><b>${l.icon} ${esc(l.title)}</b>${formulaHtml(l.formula)}</div>
          ${st === 'current' ? `<span class="lv-go">${t('start')}</span>` : ''}
        </a>`;
      }).join('')}
    </div>`;
  animateIn($view);
  $view.querySelectorAll('.level[data-state="locked"]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault(); a.classList.remove('nope'); void a.offsetWidth; a.classList.add('nope');
    toast(t('lockedMsg'), { icon: '🔒', ms: 2000 });
  }));
  return undefined;
}

// ---------- explicação do nível ----------
function intro(i) {
  const lv = LEVELS[i];
  const ex = lines(lv.lines).slice(0, 2);
  $view.innerHTML = `
    <div class="lesson-top"><a class="icon-btn close" href="#/build">✕</a><h2 class="lv-head">${lv.icon} ${esc(lv.title)}</h2></div>
    <section class="card rule-card pop-in">
      <p class="rule-text">${esc(lv.rule)}</p>
      ${formulaHtml(lv.formula)}
      <ul class="tips">${lv.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="examples">${ex.map((s) => `<div class="example"><div class="sent">${colored(s.chunks, s.q)} ${sayBoth(s.de)}</div>${pronHtml(s.de)}<small class="muted">${esc(s[nat()])}</small></div>`).join('')}</div>
    </section>
    <div class="legend roles">${[...new Set(lines(lv.lines).flatMap((s) => s.chunks.map((c) => c.r)))].map((r) => `<span class="blk r-${r}">${esc(roleName(r))}</span>`).join('')}</div>
    <button class="btn primary big shine" id="startLv">▶ ${t('practice')}</button>`;
  document.getElementById('startLv').addEventListener('click', () => play(i));
  return () => { stopRec(); B = null; document.body.classList.remove('focus'); };
}

// ---------- exercícios ----------
function conjugate(inf, p) {
  const stem = inf.slice(0, -2);
  return { ich: `${stem}e`, du: `${stem}st`, er: `${stem}t`, 'sie (ela)': `${stem}t`, wir: inf, ihr: `${stem}t`, 'sie (eles)': inf }[p];
}

function buildQueue(i) {
  const lv = LEVELS[i];
  const ss = lines(lv.lines);
  const q = [];
  if (lv.conj) {
    const pros = ['ich', 'du', 'er', 'sie (ela)', 'wir', 'ihr', 'sie (eles)'];
    shuffle(lv.conj).slice(0, 6).forEach((inf) => q.push({ type: 'conj', inf, p: pros[Math.floor(Math.random() * pros.length)] }));
  }
  shuffle(ss).forEach((s) => q.push({ type: 'order', s, lock: lv.lockFirst }));
  if (i >= 1 && SR) shuffle(ss).slice(0, 2).forEach((s) => q.push({ type: 'speak', s }));
  if (i >= 2) shuffle(ss).slice(0, i >= 6 ? 3 : 2).forEach((s) => q.push({ type: 'write', s }));
  const sh = [...q.slice(0, lv.conj ? 6 : 0), ...shuffle(q.slice(lv.conj ? 6 : 0))];
  lines(lv.grow).forEach((s, k, arr) => sh.push({ type: 'order', s, grow: k, prev: arr[k - 1] }));
  return sh;
}

function play(i) {
  B = { i, queue: buildQueue(i), done: 0, ok: 0, bad: 0, xp: 0, state: 'idle', t0: Date.now() };
  document.body.classList.add('focus');
  $view.innerHTML = `
    <div class="lesson-top">
      <a class="icon-btn close" href="#/build">✕</a>
      <div class="bar thin grow"><i class="mastered" id="bbar"></i></div>
      <span class="xp-chip" id="bxp">0 XP</span>
    </div>
    <div id="bex"></div>
    <div class="ex-foot" id="bfoot"></div>`;
  next();
}

function top() {
  document.getElementById('bbar').style.width = `${pct(B.done, B.done + B.queue.length)}%`;
  document.getElementById('bxp').textContent = `${B.xp} XP`;
}

function next() {
  if (!B) return;
  stopRec();
  top();
  if (!B.queue.length) return finish();
  const ex = B.queue[0];
  ex.heard = undefined;
  B.state = 'idle';
  const $ex = document.getElementById('bex');
  $ex.innerHTML = `<div class="ex-in">${RENDER[ex.type](ex)}</div>`;
  BIND[ex.type](ex, $ex);
  const $f = document.getElementById('bfoot');
  $f.className = 'ex-foot';
  $f.innerHTML = `${ex.type === 'speak' ? `<button class="btn" id="bskip">${t('cantSpeak')}</button>` : ''}<button class="btn primary big" id="bgo" disabled>${t('check')}</button>`;
  document.getElementById('bgo').addEventListener('click', check);
  document.getElementById('bskip')?.addEventListener('click', () => { B.queue.shift(); next(); });
}

const ready = (v) => { const b = document.getElementById('bgo'); if (b && B.state === 'idle') b.disabled = !v; };

const RENDER = {
  conj: (ex) => `<h2 class="ex-title">${t('conjTitle')}</h2>
    <div class="prompt"><div class="de-sentence"><b>${esc(ex.p.replace(/ \(.*\)/, ''))}</b> <span class="blank">_____</span> <small class="muted">(${esc(ex.inf)})</small></div>
    <small class="muted">${esc(ex.p)}</small></div>
    <div class="opts">${shuffle(['ich', 'du', 'er', 'wir'].map((p) => conjugate(ex.inf, p))).map((f, k) => `<button class="btn opt" data-f="${esc(f)}"><span class="key">${k + 1}</span>${esc(f)}</button>`).join('')}</div>`,
  order: (ex) => `<h2 class="ex-title">${ex.grow ? `📈 ${t('growTitle')}` : t('orderTitle')}</h2>
    ${ex.grow && ex.prev ? `<div class="prev-sent muted">${colored(ex.prev.chunks, ex.prev.q)}</div>` : ''}
    <div class="prompt"><div class="q-native sentence"><span class="tag">${nat().toUpperCase()}</span> ${esc(ex.s[nat()])}</div></div>
    <div class="answer-line blocks" id="bans"></div><div class="bank blocks" id="bbank"></div>`,
  write: (ex) => `<h2 class="ex-title">${t('exTypeSentence')}</h2>
    <div class="prompt"><div class="q-native sentence"><span class="tag">${nat().toUpperCase()}</span> ${esc(ex.s[nat()])}</div>
    <button class="btn sm" id="hint">💡 ${t('showBlocks')}</button><div id="hintBox"></div></div>
    <div class="write"><input id="bin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(t('typeHere'))}">
    <div class="umlauts">${['ä', 'ö', 'ü', 'ß'].map((c) => `<button type="button" class="btn sm" data-ch="${c}">${c}</button>`).join('')}</div></div>`,
  speak: (ex) => `<h2 class="ex-title">🎙️ ${t('exSpeak')}</h2>
    <div class="prompt"><div class="de-sentence">${colored(ex.s.chunks, ex.s.q)} ${sayBoth(ex.s.de)}</div>${pronHtml(ex.s.de)}
    <small class="muted">${esc(ex.s[nat()])}</small></div>
    <button class="mic" id="bmic"><span>🎙️</span><small id="bmicl">${t('tapToSpeak')}</small></button><p class="heard muted" id="bheard"></p>`,
};

const BIND = {
  conj: (ex, $ex) => $ex.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
    if (B.state !== 'idle') return;
    $ex.querySelectorAll('.opt').forEach((x) => x.classList.toggle('sel', x === b));
    ex.pick = b.dataset.f; ready(true);
  })),
  order: (ex, $ex) => {
    const $ans = $ex.querySelector('#bans');
    const $bank = $ex.querySelector('#bbank');
    const all = ex.s.chunks.map((c, k) => ({ ...c, k }));
    const locked = ex.lock ? all[0] : null;
    const pool = shuffle(locked ? all.slice(1) : all);
    if (locked) $ans.innerHTML = `<span class="tok blk r-${locked.r} fixed" data-k="0">${esc(locked.t)}<small>${esc(roleName(locked.r))}</small></span>`;
    // A 1ª palavra da frase aparece em minúscula para a letra maiúscula não entregar a resposta.
    const show = (c) => (c.k === 0 && /^(Ich|Du|Er|Sie|Es|Wir|Ihr|Heute|Morgen|Jetzt|Gestern|Am|Im|In|Die|Der|Das|Mein|Was|Wo|Wann|Warum|Jeden|Trinkst|Kommst|Hast|Kannst|Machst)\b/.test(c.t) ? c.t[0].toLowerCase() + c.t.slice(1) : c.t);
    $bank.innerHTML = pool.map((c, n) => `<button class="tok blk r-${c.r}" style="--i:${n}" data-k="${c.k}">${esc(show(c))}<small>${esc(roleName(c.r))}</small></button>`).join('');
    const sync = () => ready($ans.querySelectorAll('.tok:not(.fixed)').length > 0);
    $bank.addEventListener('click', (e) => {
      const b = e.target.closest('.tok');
      if (!b || b.classList.contains('used') || B.state !== 'idle') return;
      b.classList.add('used');
      const a = b.cloneNode(true);
      a.classList.add('in'); a.classList.remove('used');
      $ans.append(a);
      speak(b.firstChild.textContent, 'de-DE', 'normal');
      sync();
    });
    $ans.addEventListener('click', (e) => {
      const a = e.target.closest('.tok:not(.fixed)');
      if (!a || B.state !== 'idle') return;
      $bank.querySelector(`[data-k="${a.dataset.k}"]`)?.classList.remove('used');
      a.remove(); sync();
    });
  },
  write: (ex, $ex) => {
    const input = $ex.querySelector('#bin');
    input.focus({ preventScroll: true });
    input.addEventListener('input', () => ready(input.value.trim().length > 0));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (B.state === 'idle') check(); else next(); } });
    $ex.querySelectorAll('[data-ch]').forEach((b) => b.addEventListener('click', () => { input.value += b.dataset.ch; input.focus(); ready(true); }));
    $ex.querySelector('#hint').addEventListener('click', () => {
      $ex.querySelector('#hintBox').innerHTML = `<div class="bank blocks">${shuffle(ex.s.chunks).map((c) => `<span class="tok blk r-${c.r} fixed">${esc(c.t)}</span>`).join('')}</div>`;
      ex.hinted = true;
    });
  },
  speak: (ex, $ex) => {
    const mic = $ex.querySelector('#bmic');
    if (store.settings.autoplay) speak(ex.s.de);
    mic.addEventListener('click', () => {
      if (B.state !== 'idle') return;
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = 'de-DE'; rec.interimResults = true; rec.maxAlternatives = 4;
      mic.classList.add('on'); $ex.querySelector('#bmicl').textContent = t('listening');
      rec.onresult = (e) => {
        const r = e.results[e.results.length - 1];
        $ex.querySelector('#bheard').textContent = `“${[...e.results].map((x) => x[0].transcript).join(' ')}”`;
        if (r.isFinal) ex.heard = [...r].map((a) => a.transcript);
      };
      rec.onerror = (e) => { if (e.error === 'not-allowed') toast(t('noMic'), { icon: '🎙️' }); };
      rec.onend = () => { mic.classList.remove('on'); $ex.querySelector('#bmicl').textContent = t('tapToSpeak'); rec = null; if (ex.heard?.length && B?.state === 'idle') check(); };
      try { rec.start(); } catch { mic.classList.remove('on'); }
    });
  },
};

function stopRec() { try { rec?.abort(); } catch { /* parado */ } rec = null; }

function lcs(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length];
}

function check() {
  if (!B || B.state !== 'idle') return;
  const ex = B.queue[0];
  let ok = false, almost = false;
  if (ex.type === 'conj') {
    ok = ex.pick === conjugate(ex.inf, ex.p);
    document.querySelectorAll('#bex .opt').forEach((b) => { if (b.dataset.f === conjugate(ex.inf, ex.p)) b.classList.add('ok'); else if (b.classList.contains('sel')) b.classList.add('bad'); });
  } else if (ex.type === 'order') {
    const got = [...document.querySelectorAll('#bans .tok')].map((x) => ex.s.chunks[+x.dataset.k]);
    const txt = fold(buildText(got, ex.s.q));
    ok = [ex.s.de, ...ex.s.alt].some((x) => fold(x) === txt);
    document.getElementById('bans').classList.add(ok ? 'ok' : 'bad');
  } else if (ex.type === 'write') {
    const v = fold(document.getElementById('bin').value);
    const best = Math.min(...[ex.s.de, ...ex.s.alt].map((x) => lev(v, fold(x))));
    ok = best <= Math.max(1, Math.floor(fold(ex.s.de).length / 12));
    almost = ok && best > 0;
    document.getElementById('bin').classList.add(ok ? 'ok' : 'bad');
  } else if (ex.type === 'speak') {
    const target = fold(ex.s.de).split(' ');
    let best = 0;
    for (const alt of ex.heard || []) best = Math.max(best, lcs(target, fold(alt).split(' ')) / target.length);
    ok = best >= 0.7; almost = ok && best < 1;
  }
  resolve(ex, ok, almost);
}

function resolve(ex, ok, almost) {
  B.state = 'feedback';
  B.queue.shift();
  if (ok) {
    B.ok++; B.done++; B.xp += XP.quiz; addXp(XP.quiz); sfx('good'); haptic(10);
    const b = document.getElementById('bgo')?.getBoundingClientRect();
    if (b) floatText(t('earned', XP.quiz), b.left + b.width / 2, b.top);
  } else {
    B.bad++; sfx('bad'); haptic([30, 40, 30]);
    B.queue.splice(Math.min(3, B.queue.length), 0, { ...ex, pick: undefined }); // volta logo depois, para fixar
  }
  top();
  const ans = ex.type === 'conj'
    ? `<b>${esc(ex.p.replace(/ \(.*\)/, ''))} ${esc(conjugate(ex.inf, ex.p))}</b>`
    : `<div class="sent">${colored(ex.s.chunks, ex.s.q)}</div>${pronHtml(ex.s.de)}<small class="muted">${esc(ex.s.pt)} · ${esc(ex.s.en)}</small>`;
  const praise = t('praise');
  const $f = document.getElementById('bfoot');
  $f.className = `ex-foot ${ok ? 'ok' : 'bad'}`;
  $f.innerHTML = `<div class="fb"><b>${ok ? (almost ? `👍 ${t('almost')}` : `✓ ${praise[Math.floor(Math.random() * praise.length)]}`) : `✗ ${t('wrong')}`}</b><div class="fb-ans">${ans}</div></div>
    <button class="btn primary big" id="bgo2">${t('continue')}</button>`;
  document.getElementById('bgo2').addEventListener('click', next);
  document.getElementById('bgo2').focus({ preventScroll: true });
  document.querySelectorAll('#bex .opt, #bex .tok, #bex input').forEach((x) => { x.disabled = true; });
  if (ex.s) speak(ex.s.de);
}

function finish() {
  const lv = LEVELS[B.i];
  const acc = pct(B.ok, B.ok + B.bad);
  store.data.build ||= {};
  store.data.build[lv.id] = { at: Date.now(), best: Math.max(acc, store.data.build[lv.id]?.best || 0) };
  store.save();
  addXp(20); B.xp += 20;
  const nextLv = LEVELS[B.i + 1];
  document.getElementById('bfoot').innerHTML = '';
  document.getElementById('bfoot').className = 'ex-foot';
  document.getElementById('bex').innerHTML = `
    <section class="card center pop-in done-card">
      <div class="big-emoji bounce">${acc === 100 ? '🌟' : '🧱'}</div>
      <h1>${t('lessonDone')}</h1><p class="muted">${lv.icon} ${esc(lv.title)}</p>
      <div class="summary"><div><b data-count="${B.xp}">0</b><span>XP</span></div><div><b data-count="${acc}">0</b><span>% ${t('accuracy')}</span></div></div>
      <div class="row"><a class="btn" href="#/build">${t('buildTitle')}</a>${nextLv ? `<a class="btn primary" href="#/build/${nextLv.id}">${t('nextLesson')} →</a>` : ''}</div>
    </section>`;
  document.getElementById('bxp').textContent = `${B.xp} XP`;
  animateIn(document.getElementById('bex'));
  sfx('win'); confetti();
  checkBadges({ perfect: acc === 100 });
  B.state = 'done';
}

document.addEventListener('keydown', (e) => {
  if (!B || e.target.matches('input') || document.querySelector('dialog[open]')) return;
  if (e.key === 'Enter') { e.preventDefault(); if (B.state === 'feedback') next(); else if (B.state === 'idle') { const b = document.getElementById('bgo'); if (b && !b.disabled) b.click(); } }
  else if (/^[1-4]$/.test(e.key) && B.state === 'idle') document.querySelectorAll('#bex .opt')[+e.key - 1]?.click();
});

if (location.hostname === 'localhost') window.__build = () => B;
