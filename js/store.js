// Tudo o que o app salva fica aqui. Hoje usa o armazenamento do navegador;
// a sincronização com a nuvem (Supabase) vai se ligar neste mesmo módulo.
const KEY = 'wortschatz.v1'; // nome antigo do app; mantido para não perder o progresso

const DEFAULTS = {
  version: 1,
  progress: {},   // id da palavra -> estado da repetição espaçada
  custom: [],     // palavras adicionadas por você
  days: {},       // 'AAAA-MM-DD' -> { rev, new, ok, bad, xp }
  xp: 0,
  badges: {},     // id da conquista -> data em que desbloqueou
  best: {},       // recordes (ex.: tempo no jogo dos pares)
  settings: {
    ui: 'pt',            // idioma da interface: pt | en | de
    newPerDay: 10,
    show: 'both',        // traduções exibidas: both | en | pt
    direction: 'de',     // de = alemão na frente | native = tradução na frente | mix
    speed: 'slow',       // velocidade da voz: normal | slow | slower
    autoplay: true,
    level: 'A1',
    voiceDe: '',         // vazio = voz neural gravada; 'auto' ou id = voz do navegador
    voiceEn: '',
    theme: 'space',      // space (roxo espacial) | light (lavanda)
    goal: 100,           // meta diária em XP
    sfx: true,           // efeitos sonoros
  },
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const data = JSON.parse(raw);
    return { ...structuredClone(DEFAULTS), ...data, settings: { ...DEFAULTS.settings, ...data.settings } };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export const store = {
  data: load(),
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* armazenamento indisponível */ }
  },
  get settings() { return this.data.settings; },
  setSetting(key, value) { this.data.settings[key] = value; this.save(); },
  replace(data) {
    this.data = { ...structuredClone(DEFAULTS), ...data, settings: { ...DEFAULTS.settings, ...data.settings } };
    this.save();
  },
  reset() { this.data = structuredClone(DEFAULTS); this.save(); },
};

export function todayKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function logDay(field, n = 1) {
  const k = todayKey();
  const day = store.data.days[k] || (store.data.days[k] = { rev: 0, new: 0, ok: 0, bad: 0, xp: 0 });
  day[field] = (day[field] || 0) + n;
}

export function streak() {
  const days = store.data.days;
  const active = (d) => (days[todayKey(d)]?.rev || 0) > 0;
  const d = new Date();
  if (!active(d)) d.setDate(d.getDate() - 1); // hoje ainda não estudou: conta até ontem
  let n = 0;
  while (active(d)) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
