import { store } from './store.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices = [];

function loadVoices() { voices = synth ? synth.getVoices() : []; }
if (synth) { loadVoices(); synth.addEventListener?.('voiceschanged', loadVoices); }

function pickVoice(code) {
  const prefix = code.slice(0, 2);
  return voices.find((v) => v.lang === code) || voices.find((v) => v.lang?.toLowerCase().startsWith(prefix));
}

export function canSpeak() { return Boolean(synth); }

export function speak(text, code = 'de-DE') {
  if (!synth || !text) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text.replace('…', ''));
  u.lang = code;
  const v = pickVoice(code);
  if (v) u.voice = v;
  u.rate = store.settings.rate;
  synth.speak(u);
}
