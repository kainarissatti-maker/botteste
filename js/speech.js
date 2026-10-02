import { store } from './store.js';

// 1º: áudio gravado com voz neural (audio/<lang>/<id>.mp3, gerado por tools/gen_audio.py).
// 2º: voz do navegador, para o que não tiver áudio (ex.: palavras que você adicionou).
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices = [];
let current = null; // mantém referência: o Chrome corta a fala se ela for coletada da memória
let timer = null;
let player = null;
let manifest = null;

fetch('audio/manifest.json').then((r) => (r.ok ? r.json() : null)).then((m) => { manifest = m; }).catch(() => {});

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

const settingKey = (code) => (code.startsWith('de') ? 'voiceDe' : 'voiceEn');

function pickVoice(code) {
  const saved = store.settings[settingKey(code)];
  const list = voicesFor(code);
  return list.find((v) => v.voiceURI === saved) || list[0];
}

export function onVoicesChanged(cb) { synth?.addEventListener?.('voiceschanged', cb); }

export function canSpeak() { return Boolean(synth) || typeof Audio !== 'undefined'; }
export function hasVoice(code = 'de-DE') { return voicesFor(code).length > 0; }

// Tira o que não deve ser lido: "…", explicações entre parênteses e alternativas depois da barra.
// Precisa ficar igual a clean() em tools/gen_audio.py.
export function clean(text) {
  return text.replace(/\(.*?\)/g, '').replace(/…/g, '').split('/')[0].replace(/\s+/g, ' ').trim();
}

function stopAll() {
  clearTimeout(timer);
  if (player) { player.pause(); player = null; }
  if (synth && (synth.speaking || synth.pending)) { synth.cancel(); return true; }
  return false;
}

const BROWSER_RATE = { normal: 0.95, slow: 0.75, slower: 0.6 };
// Pastas geradas por tools/gen_audio.py para cada velocidade.
const FOLDER = { de: { normal: 'de', slow: 'de-slow', slower: 'de-slower' }, en: { normal: 'en', slow: 'en-slow', slower: 'en-slow' } };

function speakBrowser(say, code, wasBusy, speed) {
  if (!synth) return;
  // Falar logo depois de cancelar faz o Chrome cortar ou picotar o áudio; uma pausa curta resolve.
  timer = setTimeout(() => {
    const u = new SpeechSynthesisUtterance(say);
    u.lang = code;
    const v = pickVoice(code);
    if (v) u.voice = v;
    u.rate = BROWSER_RATE[speed] || 0.95;
    u.onend = u.onerror = () => { if (current === u) current = null; };
    current = u;
    synth.resume(); // destrava o Chrome quando a fila fica "pausada"
    synth.speak(u);
  }, wasBusy ? 120 : 30);
}

function playFile(src, onFail) {
  const a = new Audio(src);
  let failed = false;
  const fail = () => { if (!failed && player === a) { failed = true; onFail(); } };
  a.onerror = fail;
  player = a;
  a.play().catch(fail);
}

// speed: 'normal' | 'slow' | 'slower' (padrão: o que está nos Ajustes; o botão 🐢 usa 'slower').
export function speak(text, code = 'de-DE', speed = store.settings.speed) {
  if (!text) return;
  const say = clean(text);
  if (!say) return;
  const wasBusy = stopAll();
  const lang = code.slice(0, 2);
  const id = manifest?.[lang]?.[say];
  const useNeural = !store.settings[settingKey(code)]; // vazio = voz neural
  if (id && useNeural && FOLDER[lang]) {
    const folder = FOLDER[lang][speed] || FOLDER[lang].normal;
    // Se a versão lenta ainda não existir, toca a normal; se nada existir, usa a voz do navegador.
    playFile(`audio/${folder}/${id}.mp3`, () => {
      if (folder === FOLDER[lang].normal) speakBrowser(say, code, false, speed);
      else playFile(`audio/${FOLDER[lang].normal}/${id}.mp3`, () => speakBrowser(say, code, false, speed));
    });
    return;
  }
  speakBrowser(say, code, wasBusy, speed);
}
