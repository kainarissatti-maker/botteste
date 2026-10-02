// Repetição espaçada (estilo Anki/SM-2): errou -> volta já; acertou -> volta cada vez mais tarde.
import { store, logDay, todayKey } from './store.js';
import { allWords } from './words.js';

const DAY = 86400000;
export const MASTERED_DAYS = 21;

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
function endOfToday() { return startOfToday() + DAY - 1; }

export function stateOf(id) { return store.data.progress[id]; }

export function statusOf(id) {
  const s = stateOf(id);
  if (!s) return 'new';
  return s.i >= MASTERED_DAYS ? 'mastered' : 'learning';
}

// Rating: 0 = errei, 1 = difícil, 2 = bom, 3 = fácil. Retorna o próximo intervalo em dias (0 = agora).
export function nextInterval(s, rating) {
  const r = s?.r || 0, i = s?.i || 0, e = s?.e || 2.5;
  if (rating === 0) return 0;
  if (rating === 1) return r === 0 ? 1 : Math.max(1, Math.round(i * 1.2));
  if (rating === 2) return r === 0 ? 2 : r === 1 || i === 0 ? 3 : Math.max(i + 1, Math.round(i * e));
  return r === 0 ? 4 : Math.max(i + 2, Math.round(i * e * 1.3));
}

export function review(id, rating) {
  const prev = stateOf(id);
  const s = prev ? { ...prev } : { r: 0, l: 0, e: 2.5, i: 0, c: 0, w: 0 };
  const isNew = !prev;
  s.i = nextInterval(prev, rating);
  s.e = Math.max(1.3, s.e + [-0.2, -0.15, 0, 0.15][rating]);
  s.r += 1;
  if (rating === 0) { s.l += 1; s.w += 1; } else s.c += 1;
  s.d = rating === 0 ? Date.now() : startOfToday() + s.i * DAY;
  s.s = Date.now();
  store.data.progress[id] = s;
  logDay('rev');
  logDay(rating === 0 ? 'bad' : 'ok');
  if (isNew) logDay('new');
  store.save();
}

// Errar no quiz faz a palavra voltar para a revisão de hoje.
export function quizResult(id, correct) {
  const s = stateOf(id);
  logDay(correct ? 'ok' : 'bad');
  if (!s) { store.save(); return; }
  if (correct) s.c += 1;
  else { s.w += 1; s.d = Date.now(); s.i = Math.min(s.i, 1); }
  store.save();
}

export function resetWord(id) { delete store.data.progress[id]; store.save(); }

export function dueWords(filter = () => true) {
  const end = endOfToday();
  return allWords()
    .filter((w) => filter(w) && stateOf(w.id) && stateOf(w.id).d <= end)
    .sort((a, b) => stateOf(a.id).d - stateOf(b.id).d);
}

export function newWordsToday() {
  const d = store.data.days[todayKey()];
  return d?.new || 0;
}

export function newWords(filter = () => true, limit = Infinity) {
  const out = [];
  for (const w of allWords()) {
    if (out.length >= limit) break;
    if (filter(w) && !stateOf(w.id)) out.push(w);
  }
  return out;
}

export function counts(words) {
  const c = { new: 0, learning: 0, mastered: 0 };
  for (const w of words) c[statusOf(w.id)]++;
  return c;
}

// Palavras que você mais erra (pelo menos 2 erros e 25% ou mais de erro).
export function hardWords(limit = 20) {
  const ratio = (w) => { const s = stateOf(w.id); return s.w / (s.c + s.w); };
  return allWords()
    .filter((w) => { const s = stateOf(w.id); return s && s.w >= 2 && s.w / (s.c + s.w) >= 0.25; })
    .sort((a, b) => ratio(b) - ratio(a))
    .slice(0, limit);
}

// Monta a fila de estudo: revisões do dia + palavras novas (respeitando o limite diário).
// noNew: só revisões (as palavras novas chegam pelas lições da trilha).
export function buildSession({ cat = null, extraNew = 0, noNew = false } = {}) {
  const filter = (w) => (!cat || w.cat === cat);
  const due = dueWords(filter);
  const remaining = noNew ? extraNew : Math.max(0, store.settings.newPerDay - newWordsToday()) + extraNew;
  const fresh = newWords(filter, cat ? Math.max(remaining, extraNew || 10) : remaining);
  const queue = [];
  let n = 0;
  for (const w of due) {
    queue.push(w);
    if (++n % 3 === 0 && fresh.length) queue.push(fresh.shift());
  }
  return queue.concat(fresh);
}

export function formatInterval(days, lang) {
  const u = { pt: ['agora', 'd', 'm', 'a'], en: ['now', 'd', 'mo', 'y'], de: ['jetzt', 'T', 'M', 'J'] }[lang] || ['now', 'd', 'mo', 'y'];
  if (days === 0) return u[0];
  if (days < 30) return `${days}${u[1]}`;
  if (days < 365) return `${Math.round(days / 30)}${u[2]}`;
  return `${(days / 365).toFixed(1)}${u[3]}`;
}
