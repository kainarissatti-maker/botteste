// Trilha de lições (estilo Duolingo): unidades -> lições de palavras -> lição de frases -> revisão.
import { store } from './store.js';
import { allWords, catLabel, CATEGORIES } from './words.js';
import { SENTENCES_A1 } from './data/sentences.js';

// Ordem pensada para quem começa: cumprimentos e pronomes antes de tudo.
const ORDER = ['greet', 'basics', 'numbers', 'family', 'people', 'colors', 'food', 'drinks', 'home', 'verbs',
  'body', 'clothes', 'city', 'transport', 'time', 'weather', 'animals', 'work', 'adj'];
const WORDS_PER_UNIT = 18;
const WORDS_PER_LESSON = 6;

let sentences = null;
export function allSentences() {
  if (sentences) return sentences;
  sentences = [];
  for (const [cat, text] of Object.entries(SENTENCES_A1)) {
    for (const line of text.trim().split('\n')) {
      const [de, en, pt] = line.split('|').map((x) => x.trim());
      sentences.push({ id: `s:${de}`, de, en, pt, cat });
    }
  }
  return sentences;
}

const split = (arr, n) => {
  const out = Array.from({ length: n }, () => []);
  arr.forEach((x, i) => out[Math.floor((i * n) / arr.length)].push(x));
  return out;
};

let units = null;
export function course() {
  if (units) return units;
  units = [];
  const words = allWords().filter((w) => w.level === 'A1' && !w.custom);
  for (const cat of ORDER) {
    const ws = words.filter((w) => w.cat === cat);
    const ss = allSentences().filter((s) => s.cat === cat);
    const parts = Math.max(1, Math.ceil(ws.length / WORDS_PER_UNIT));
    const wParts = split(ws, parts);
    const sParts = split(ss, parts);
    for (let p = 0; p < parts; p++) {
      const id = `${cat}-${p + 1}`;
      const lessons = [];
      const chunks = Math.ceil(wParts[p].length / WORDS_PER_LESSON);
      split(wParts[p], chunks).forEach((chunk, k) => lessons.push({ id: `${id}:w${k + 1}`, type: 'words', words: chunk, sentences: [] }));
      if (sParts[p].length) lessons.push({ id: `${id}:s`, type: 'sentences', words: wParts[p], sentences: sParts[p] });
      lessons.push({ id: `${id}:check`, type: 'check', words: wParts[p], sentences: sParts[p] });
      units.push({ id, cat, part: p + 1, parts, index: units.length, lessons });
    }
  }
  return units;
}

export function unitTitle(u, lang) {
  return `${catLabel(u.cat, lang)}${u.parts > 1 ? ` ${u.part}` : ''}`;
}
export const unitIcon = (u) => (CATEGORIES[u.cat] || CATEGORIES.custom).icon;

export const lessonDone = (id) => Boolean(store.data.lessons?.[id]);

// Lista plana de todas as lições na ordem da trilha.
export function flatLessons() {
  return course().flatMap((u) => u.lessons.map((l, k) => ({ ...l, unit: u, k })));
}

// A próxima lição liberada (a primeira ainda não feita). Tudo antes dela está liberado.
export function currentLesson() {
  return flatLessons().find((l) => !lessonDone(l.id)) || null;
}

export function isUnlocked(id) {
  const flat = flatLessons();
  const i = flat.findIndex((l) => l.id === id);
  const cur = flat.findIndex((l) => !lessonDone(l.id));
  return i >= 0 && (cur === -1 || i <= cur);
}

export function lessonById(id) { return flatLessons().find((l) => l.id === id); }

export function completeLesson(id, accuracy) {
  store.data.lessons ||= {};
  const prev = store.data.lessons[id];
  store.data.lessons[id] = { at: Date.now(), best: Math.max(accuracy, prev?.best || 0), times: (prev?.times || 0) + 1 };
  store.save();
}

export function courseStats() {
  const flat = flatLessons();
  const done = flat.filter((l) => lessonDone(l.id)).length;
  return { done, total: flat.length, units: course().length };
}
