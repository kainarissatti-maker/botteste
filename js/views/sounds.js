// Guia de pronúncia: regras de leitura + sons que não existem em português, com treino de ouvido.
import { RULES, pronMarkup } from '../pron.js';
import { SOUNDS, GLOSS } from '../data/sounds.js';
import { t } from '../i18n.js';
import { speak } from '../speech.js';
import { $view, esc, sayBoth } from '../ui.js';
import { sfx, haptic } from '../fx.js';

const meaning = Object.fromEntries(GLOSS.trim().split('\n').map((l) => { const [de, , pt] = l.split('|'); return [de, pt]; }));

const pairHtml = (a, b, i) => `
  <div class="pair" data-pair="${i}">
    <div class="pair-words">
      ${[a, b].map((w) => `<button class="btn pair-w" data-say="${esc(w)}" data-lang="de-DE"><b>${esc(w)}</b><small>${esc(meaning[w] || '')}</small><span class="pron">🗣️ ${pronMarkup(w)}</span></button>`).join('<span class="vs">×</span>')}
    </div>
    <button class="btn sm drill" data-a="${esc(a)}" data-b="${esc(b)}">🎯 ${t('drill')}</button>
    <div class="drill-box"></div>
  </div>`;

export function viewSounds() {
  let k = 0;
  $view.innerHTML = `
    <h1 class="title">🗣️ ${t('soundsTitle')}</h1>
    <p class="muted">${t('soundsIntro')}</p>
    <section class="card form">
      <label>${t('soundsTry')}<input id="tryIn" autocomplete="off" spellcheck="false" placeholder="Guten Morgen, wie geht's?"></label>
      <div class="pron big" id="tryOut">🗣️ …</div>
    </section>

    <h2 class="sec-title">👅 ${t('hardSounds')}</h2>
    <p class="muted">${t('hardSoundsIntro')}</p>
    <div class="sounds">
      ${SOUNDS.map((s) => `
        <section class="card sound" id="snd-${s.id}">
          <button class="sound-head" data-snd="${s.id}"><span class="snd-sym">${esc(s.sym)}</span><b>${esc(s.title)}</b><span class="more">›</span></button>
          <div class="ex-row">${s.examples.map((e) => `<span class="ex-chip">${esc(e)} ${sayBoth(e)}<span class="pron inline">🗣️ ${pronMarkup(e)}</span></span>`).join('')}</div>
          ${s.pairs.length ? `<p class="pairs-label">${t('pairsLabel')}</p>${s.pairs.map(([a, b]) => pairHtml(a, b, k++)).join('')}` : ''}
        </section>`).join('')}
    </div>

    <h2 class="sec-title">📖 ${t('readRules')}</h2>
    <div class="rules">
      ${RULES.map((r, i) => `
        <section class="card rule" style="--i:${i}">
          <div class="rule-head"><b class="rule-k">${esc(r.k)}</b><span class="rule-arrow">→</span><b class="rule-v">${esc(r.v)}</b></div>
          <p class="muted">${esc(r.tip)}</p>
          <div class="rule-ex"><span class="de-ex">${esc(r.ex)}</span> ${sayBoth(r.ex)}<span class="pron inline">🗣️ ${pronMarkup(r.ex)}</span></div>
        </section>`).join('')}
    </div>`;

  const input = document.getElementById('tryIn');
  const out = document.getElementById('tryOut');
  input.addEventListener('input', () => { out.innerHTML = `🗣️ ${input.value.trim() ? pronMarkup(input.value) : '…'}`; });

  // Treino de ouvido: toca uma das duas palavras; você diz qual ouviu.
  $view.querySelectorAll('.drill').forEach((btn) => btn.addEventListener('click', () => {
    const box = btn.nextElementSibling;
    const { a, b } = btn.dataset;
    const answer = Math.random() < 0.5 ? a : b;
    speak(answer, 'de-DE', 'normal');
    box.innerHTML = `<p class="muted">${t('whichHeard')}</p>
      <div class="row"><button class="btn" data-g="${esc(a)}">${esc(a)}</button><button class="btn" data-g="${esc(b)}">${esc(b)}</button>
      <button class="icon-btn" data-replay>🔁</button></div>`;
    box.querySelector('[data-replay]').addEventListener('click', () => speak(answer, 'de-DE', 'normal'));
    box.querySelectorAll('[data-g]').forEach((g) => g.addEventListener('click', () => {
      const ok = g.dataset.g === answer;
      g.classList.add(ok ? 'ok' : 'bad');
      sfx(ok ? 'good' : 'bad'); haptic(ok ? 10 : [30, 40, 30]);
      box.querySelectorAll('[data-g]').forEach((x) => { x.disabled = true; if (x.dataset.g === answer) x.classList.add('ok'); });
      box.insertAdjacentHTML('beforeend', `<p class="${ok ? 'good' : 'badtxt'}">${ok ? `✓ ${t('correct')}` : `✗ ${t('wasWord')} ${esc(answer)}`} · <a href="#" class="again">${t('again2')}</a></p>`);
      box.querySelector('.again').addEventListener('click', (e) => { e.preventDefault(); btn.click(); });
    }));
  }));

  // Abrir direto num som (ex.: #/sounds/u).
  const hash = location.hash.split('/')[2];
  if (hash) setTimeout(() => document.getElementById(`snd-${hash}`)?.scrollIntoView({ behavior: 'smooth' }), 300);
}
