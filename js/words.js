import { A1 } from './data/a1.js';
import { store } from './store.js';

export const LEVELS = ['A1', 'A2', 'B1', 'B2'];

// Pacotes disponíveis por nível. A2–B2 entram aqui conforme forem criados.
const PACKS = { A1 };

export const CATEGORIES = {
  greet:     { icon: '👋', pt: 'Cumprimentos e frases', en: 'Greetings & phrases', de: 'Begrüßungen & Sätze' },
  numbers:   { icon: '🔢', pt: 'Números',               en: 'Numbers',             de: 'Zahlen' },
  colors:    { icon: '🎨', pt: 'Cores',                 en: 'Colors',              de: 'Farben' },
  family:    { icon: '👨‍👩‍👧', pt: 'Família',               en: 'Family',              de: 'Familie' },
  people:    { icon: '🧑', pt: 'Pessoas',               en: 'People',              de: 'Menschen' },
  body:      { icon: '🖐️', pt: 'Corpo',                 en: 'Body',                de: 'Körper' },
  home:      { icon: '🏠', pt: 'Casa',                  en: 'Home',                de: 'Zuhause' },
  food:      { icon: '🍞', pt: 'Comida',                en: 'Food',                de: 'Essen' },
  drinks:    { icon: '☕', pt: 'Bebidas',               en: 'Drinks',              de: 'Getränke' },
  clothes:   { icon: '👕', pt: 'Roupas',                en: 'Clothes',             de: 'Kleidung' },
  city:      { icon: '🏙️', pt: 'Cidade e lugares',      en: 'City & places',       de: 'Stadt & Orte' },
  transport: { icon: '🚆', pt: 'Transporte',            en: 'Transport',           de: 'Verkehr' },
  time:      { icon: '🗓️', pt: 'Tempo e calendário',    en: 'Time & calendar',     de: 'Zeit & Kalender' },
  weather:   { icon: '🌦️', pt: 'Clima e natureza',      en: 'Weather & nature',    de: 'Wetter & Natur' },
  animals:   { icon: '🐶', pt: 'Animais',               en: 'Animals',             de: 'Tiere' },
  work:      { icon: '💼', pt: 'Escola e trabalho',     en: 'School & work',       de: 'Schule & Arbeit' },
  verbs:     { icon: '🏃', pt: 'Verbos',                en: 'Verbs',               de: 'Verben' },
  adj:       { icon: '✨', pt: 'Adjetivos',             en: 'Adjectives',          de: 'Adjektive' },
  basics:    { icon: '🧩', pt: 'Palavras essenciais',   en: 'Essential words',     de: 'Grundwörter' },
  custom:    { icon: '⭐', pt: 'Minhas palavras',       en: 'My words',            de: 'Meine Wörter' },
};

const ARTICLES = ['der', 'die', 'das'];

function parseArticle(de) {
  const [first, ...rest] = de.split(' ');
  if (ARTICLES.includes(first) && rest.length && /^[A-ZÄÖÜ]/.test(rest[0])) {
    return { art: first, base: rest.join(' ') };
  }
  return { art: null, base: de };
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[n];
}

const fold = (s) => s.toLowerCase()
  .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
  .replace(/[^a-z]/g, '');

// Palavra "parecida com o inglês" (cognato): ajuda a lembrar usando o inglês.
function isCognate(base, en) {
  const a = fold(base);
  return en.split('/').some((opt) => {
    const b = fold(opt.replace(/\(.*?\)/g, '').replace(/^\s*to\s+/, ''));
    if (a.length < 3 || b.length < 3) return false;
    return 1 - levenshtein(a, b) / Math.max(a.length, b.length) >= 0.6;
  });
}

export function makeWord({ id, de, pl, en, pt, cat, level, custom = false }) {
  const { art, base } = parseArticle(de.trim());
  return {
    id, de: de.trim(), art, base, pl: (pl || '').trim(), en: en.trim(), pt: pt.trim(),
    cat, level, custom, cognate: isCognate(base, en),
  };
}

let cache = null;

export function allWords() {
  if (cache) return cache;
  const list = [];
  for (const [level, pack] of Object.entries(PACKS)) {
    for (const [cat, text] of Object.entries(pack)) {
      for (const line of text.trim().split('\n')) {
        const [de, pl, en, pt] = line.split('|');
        list.push(makeWord({ id: `${level}:${de.trim()}`, de, pl, en, pt, cat, level }));
      }
    }
  }
  for (const c of store.data.custom) list.push(makeWord({ ...c, custom: true }));
  cache = list;
  return list;
}

export function invalidateWords() { cache = null; }

export function wordById(id) { return allWords().find((w) => w.id === id); }

export function catLabel(cat, lang) {
  const c = CATEGORIES[cat] || CATEGORIES.custom;
  return c[lang] || c.pt;
}

export function hasPack(level) { return Boolean(PACKS[level]); }
