// XP, meta diária e conquistas.
import { store, logDay, todayKey, streak } from './store.js';
import { allWords } from './words.js';
import { stateOf, MASTERED_DAYS } from './srs.js';
import { toast, confetti, sfx } from './fx.js';
import { t } from './i18n.js';

export const XP = { again: 2, hard: 6, good: 10, easy: 12, quiz: 5, match: 20 };

export const todayXp = () => store.data.days[todayKey()]?.xp || 0;
export const goal = () => store.settings.goal;

export function addXp(n) {
  const before = todayXp();
  store.data.xp = (store.data.xp || 0) + n;
  logDay('xp', n);
  store.save();
  if (before < goal() && before + n >= goal()) {
    setTimeout(() => { sfx('win'); confetti(); toast(t('goalDone'), { icon: '🎯', kind: 'gold' }); }, 350);
  }
}

const N = (pt, en, de) => ({ pt, en, de });
export const BADGES = [
  { id: 'first', icon: '🌱', name: N('Primeira palavra', 'First word', 'Erstes Wort'), test: (s) => s.learned >= 1 },
  { id: 'w10', icon: '📗', name: N('10 palavras', '10 words', '10 Wörter'), test: (s) => s.learned >= 10 },
  { id: 'w50', icon: '📘', name: N('50 palavras', '50 words', '50 Wörter'), test: (s) => s.learned >= 50 },
  { id: 'w100', icon: '📙', name: N('100 palavras', '100 words', '100 Wörter'), test: (s) => s.learned >= 100 },
  { id: 'w250', icon: '📚', name: N('250 palavras', '250 words', '250 Wörter'), test: (s) => s.learned >= 250 },
  { id: 'm10', icon: '⭐', name: N('10 dominadas', '10 mastered', '10 gelernt'), test: (s) => s.mastered >= 10 },
  { id: 'm100', icon: '🌟', name: N('100 dominadas', '100 mastered', '100 gelernt'), test: (s) => s.mastered >= 100 },
  { id: 's3', icon: '🔥', name: N('3 dias seguidos', '3-day streak', '3 Tage in Folge'), test: (s) => s.streak >= 3 },
  { id: 's7', icon: '🚀', name: N('7 dias seguidos', '7-day streak', '7 Tage in Folge'), test: (s) => s.streak >= 7 },
  { id: 's30', icon: '👑', name: N('30 dias seguidos', '30-day streak', '30 Tage in Folge'), test: (s) => s.streak >= 30 },
  { id: 'r100', icon: '💯', name: N('100 revisões', '100 reviews', '100 Wiederholungen'), test: (s) => s.reviews >= 100 },
  { id: 'r1000', icon: '🏋️', name: N('1000 revisões', '1000 reviews', '1000 Wiederholungen'), test: (s) => s.reviews >= 1000 },
  { id: 'goal', icon: '🎯', name: N('Meta do dia', 'Daily goal', 'Tagesziel'), test: (s) => s.goalHit },
  { id: 'perfect', icon: '🏆', name: N('Quiz perfeito', 'Perfect quiz', 'Perfektes Quiz'), test: (s) => s.perfect },
  { id: 'fast', icon: '⚡', name: N('Pares em menos de 30s', 'Pairs under 30s', 'Paare unter 30 s'), test: (s) => s.fastMatch },
  { id: 'cat', icon: '🧭', name: N('Categoria completa', 'Category complete', 'Kategorie komplett'), test: (s) => s.catDone },
  { id: 'xp1000', icon: '💎', name: N('1000 XP', '1000 XP', '1000 XP'), test: (s) => s.xp >= 1000 },
  { id: 'polyglot', icon: '🌍', name: N('App em alemão', 'App in German', 'App auf Deutsch'), test: (s) => s.uiDe },
];

function stats(extra) {
  const words = allWords();
  let learned = 0, mastered = 0;
  const cats = {};
  for (const w of words) {
    const st = stateOf(w.id);
    const c = (cats[w.cat] ||= { n: 0, seen: 0 });
    c.n++;
    if (st) { learned++; c.seen++; if (st.i >= MASTERED_DAYS) mastered++; }
  }
  const reviews = Object.values(store.data.days).reduce((a, d) => a + (d.rev || 0), 0);
  return {
    learned, mastered, reviews, streak: streak(), xp: store.data.xp || 0,
    goalHit: todayXp() >= goal(),
    catDone: Object.entries(cats).some(([k, c]) => k !== 'custom' && c.n > 0 && c.seen === c.n),
    uiDe: store.settings.ui === 'de',
    ...extra,
  };
}

// Confere conquistas novas e comemora. `extra` traz eventos pontuais (quiz perfeito, recorde).
export function checkBadges(extra = {}) {
  const s = stats(extra);
  const fresh = BADGES.filter((b) => !store.data.badges[b.id] && b.test(s));
  if (!fresh.length) return [];
  for (const b of fresh) store.data.badges[b.id] = Date.now();
  store.save();
  const lang = store.settings.ui;
  fresh.forEach((b, i) => setTimeout(() => {
    toast(`<small>${t('unlocked')}</small><b>${b.name[lang] || b.name.pt}</b>`, { icon: b.icon, kind: 'gold', ms: 3400 });
    if (i === 0) { sfx('win'); confetti(); }
  }, 500 + i * 700));
  return fresh;
}
