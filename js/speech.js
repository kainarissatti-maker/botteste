import { store } from './store.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices = [];
let current = null; // mantém referência: o Chrome corta o áudio se a fala for coletada da memória
let timer = null;

function loadVoices() { voices = synth ? synth.getVoices() : []; }
if (synth) { loadVoices(); synth.addEventListener?.('voiceschanged', loadVoices); }

// Vozes melhores primeiro: "Natural"/"Online"/"Google" soam muito melhor que as antigas do sistema.
function score(v, code) {
  let s = 0;
  if (v.lang === code || v.lang?.replace('_', '-') === code) s += 4;
  if (/natural|neural|online/i.test(v.name)) s += 3;
  if (/google/i.test(v.name)) s += 2;
  return s;
}

export function voicesFor(code) {
  if (!voices.length) loadVoices();
  const prefix = code.slice(0, 2).toLowerCase();
  return voices
    .filter((v) => v.lang?.toLowerCase().startsWith(prefix))
    .sort((a, b) => score(b, code) - score(a, code));
}

function pickVoice(code) {
  const saved = store.settings[code.startsWith('de') ? 'voiceDe' : 'voiceEn'];
  const list = voicesFor(code);
  return list.find((v) => v.voiceURI === saved) || list[0];
}

export function onVoicesChanged(cb) { synth?.addEventListener?.('voiceschanged', cb); }

export function canSpeak() { return Boolean(synth); }
export function hasVoice(code = 'de-DE') { return voicesFor(code).length > 0; }

// Tira o que não deve ser lido: "…", explicações entre parênteses e alternativas depois da barra.
function clean(text) {
  return text.replace(/\(.*?\)/g, '').replace(/…/g, '').split('/')[0].replace(/\s+/g, ' ').trim();
}

export function speak(text, code = 'de-DE') {
  if (!synth || !text) return;
  const say = clean(text);
  if (!say) return;
  clearTimeout(timer);
  const wasBusy = synth.speaking || synth.pending;
  synth.cancel();
  // Falar logo depois de cancelar faz o Chrome cortar ou picotar o áudio; uma pausa curta resolve.
  timer = setTimeout(() => {
    const u = new SpeechSynthesisUtterance(say);
    u.lang = code;
    const v = pickVoice(code);
    if (v) u.voice = v;
    u.rate = store.settings.rate;
    u.onend = u.onerror = () => { if (current === u) current = null; };
    current = u;
    synth.resume(); // destrava o Chrome quando a fila fica "pausada"
    synth.speak(u);
  }, wasBusy ? 120 : 30);
}
