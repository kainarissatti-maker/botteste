// Peças de interface usadas por várias telas.
import { store } from './store.js';
import { t } from './i18n.js';
import { canSpeak } from './speech.js';

export const $view = document.getElementById('view');

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const locale = () => ({ pt: 'pt-BR', en: 'en-US', de: 'de-DE' }[store.settings.ui] || 'pt-BR');

export const ICON = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  study: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/></svg>',
  quiz: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
  words: '<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 8h6M9 12h6"/></svg>',
  progress: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  speaker: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  flame: '<svg viewBox="0 0 24 24"><path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-1.5 2-2 3.5-2 5-1.5-1-2.5-3-2.5-5C7 8 5 11 5 15c0 4 3 7 7 7z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
};

export function sayBtn(text, code = 'de-DE', cls = '') {
  if (!canSpeak()) return '';
  return `<button class="icon-btn ${cls}" data-say="${esc(text)}" data-lang="${code}" aria-label="${esc(t('listen'))}">${ICON.speaker}</button>`;
}

// Alto-falante + tartaruga (bem devagar), para a palavra principal em alemão.
export function sayBoth(text, code = 'de-DE') {
  if (!canSpeak()) return '';
  return `<span class="say-pair">${sayBtn(text, code)}<button class="icon-btn turtle" data-say="${esc(text)}" data-lang="${code}" data-speed="slower" aria-label="${esc(t('slowListen'))}" title="${esc(t('slowListen'))}">🐢</button></span>`;
}

export function deHtml(w, { withArt = true } = {}) {
  if (!w.art || !withArt) return esc(w.art ? w.base : w.de);
  return `<span class="art art-${w.art}">${w.art}</span> ${esc(w.base)}`;
}

export function trHtml(w, { speakers = true } = {}) {
  const s = store.settings.show;
  let out = '';
  if (s !== 'pt') out += `<div class="tr"><span class="tag">EN</span><span>${esc(w.en)}</span>${speakers ? sayBtn(w.en, 'en-US', 'sm') : ''}</div>`;
  if (s !== 'en') out += `<div class="tr"><span class="tag">PT</span><span>${esc(w.pt)}</span></div>`;
  return out;
}

export function plHtml(w) {
  if (!w.pl) return '';
  return `<div class="pl">${t('plural')}: ${w.pl === '(Pl.)' ? `<em>${t('onlyPl')}</em>` : esc(w.pl)}</div>`;
}

// Barra empilhada (dominadas + aprendendo). Começa vazia e "cresce" com animateIn().
export function stackBar(c, total) {
  return `<div class="bar"><i class="mastered" data-w="${pct(c.mastered, total)}"></i><i class="learning" data-w="${pct(c.learning, total)}"></i></div>`;
}

const $dialog = document.getElementById('dialog');
export function openDialog(html) {
  $dialog.innerHTML = `<div class="dialog-body">${html}</div>`;
  if (!$dialog.open) $dialog.showModal();
}
export function closeDialog() { if ($dialog.open) $dialog.close(); }
$dialog.addEventListener('click', (e) => { if (e.target === $dialog || e.target.closest('[data-close]')) $dialog.close(); });

export const go = (hash) => { if (location.hash === hash) window.dispatchEvent(new Event('app:render')); else location.hash = hash; };
