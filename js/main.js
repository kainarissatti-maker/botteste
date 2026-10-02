import { store, streak } from './store.js';
import { t, lang } from './i18n.js';
import { speak, onVoicesChanged } from './speech.js';
import { $view, ICON } from './ui.js';
import { stagger, animateIn } from './fx.js';
import { todayXp, goal } from './gamify.js';
import { viewHome } from './views/home.js';
import { viewStudy } from './views/study.js';
import { viewPath } from './views/path.js';
import { viewLesson } from './views/lesson.js';
import { viewQuiz } from './views/quiz.js';
import { viewMatch } from './views/match.js';
import { viewWords, wordDetail } from './views/words.js';
import { viewProgress } from './views/progress.js';
import { viewSettings } from './views/settings.js';
import { viewSounds } from './views/sounds.js';

const $nav = document.getElementById('nav');
const ROUTES = { home: viewHome, study: viewPath, review: viewStudy, lesson: viewLesson, quiz: viewQuiz, match: viewMatch, words: viewWords, progress: viewProgress, settings: viewSettings, sounds: viewSounds };
const NAV_OF = { match: 'quiz', review: 'study', lesson: 'study', sounds: 'study' }; // telas que ficam "dentro" de outra aba
let cleanup = null;

function renderNav(active) {
  $nav.innerHTML = ['home', 'study', 'quiz', 'words', 'progress'].map((r) =>
    `<a href="#/${r}" class="${r === active ? 'active' : ''}">${ICON[r]}<span>${t(r)}</span></a>`).join('');
  const gear = document.getElementById('gear');
  gear.innerHTML = ICON.gear;
  gear.classList.toggle('active', active === 'settings');
  gear.setAttribute('aria-label', t('settings'));
  document.getElementById('tagline').textContent = t('tagline');
  updateStreak();
}

export function updateStreak() {
  const s = streak();
  const el = document.getElementById('streak');
  const done = todayXp() >= goal();
  el.innerHTML = `${ICON.flame}<b>${s}</b>`;
  el.title = `${s} ${t('streak')}`;
  el.classList.toggle('lit', done);
}

function render() {
  const [route = 'home', ...rest] = location.hash.replace(/^#\/?/, '').split('/');
  const view = ROUTES[route] ? route : 'home';
  document.documentElement.lang = lang() === 'pt' ? 'pt-BR' : lang();
  cleanup?.();
  cleanup = null;
  renderNav(NAV_OF[view] || view);
  window.scrollTo({ top: 0 });
  const out = ROUTES[view](decodeURIComponent(rest.join('/')));
  if (typeof out === 'function') cleanup = out;
  stagger($view);
}

// Padrão: roxo espacial. Só o tema claro (lavanda) muda as cores.
function applyTheme() {
  if (store.settings.theme === 'light') document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]').content = store.settings.theme === 'light' ? '#f4f0ff' : '#0a0520';
}

window.addEventListener('hashchange', render);
window.addEventListener('app:render', render);
window.addEventListener('app:theme', applyTheme);
window.addEventListener('app:word', (e) => wordDetail(e.detail));

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-say]');
  if (b) {
    e.stopPropagation();
    b.classList.remove('speaking'); void b.offsetWidth; b.classList.add('speaking');
    speak(b.dataset.say, b.dataset.lang, b.dataset.speed || undefined);
    return;
  }
  // Link para a tela atual: recarrega a tela (ex.: "aprender mais" duas vezes seguidas).
  const a = e.target.closest('a[href^="#/"]');
  if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); render(); }
});

// As vozes do navegador chegam depois que a página abre.
onVoicesChanged(() => { if (location.hash.startsWith('#/settings')) { viewSettings(); animateIn($view); } });

const origSave = store.save.bind(store);
store.save = () => { origSave(); updateStreak(); };

applyTheme();
render();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  // Versão nova publicada: o service worker novo assume e a página recarrega sozinha uma vez.
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
    .then((reg) => {
      // Confere atualizações ao voltar para o app (útil no celular, que deixa a aba aberta).
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    })
    .catch(() => {});
}
