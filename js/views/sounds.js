// Guia de pronúncia: regras de leitura do alemão explicadas para quem fala português.
import { RULES, pron } from '../pron.js';
import { t } from '../i18n.js';
import { $view, esc, sayBoth } from '../ui.js';

export function viewSounds() {
  $view.innerHTML = `
    <h1 class="title">🗣️ ${t('soundsTitle')}</h1>
    <p class="muted">${t('soundsIntro')}</p>
    <section class="card form">
      <label>${t('soundsTry')}<input id="tryIn" autocomplete="off" spellcheck="false" placeholder="Guten Morgen, wie geht's?"></label>
      <div class="pron big" id="tryOut">🗣️ …</div>
    </section>
    <div class="rules">
      ${RULES.map((r, i) => `
        <section class="card rule" style="--i:${i}">
          <div class="rule-head"><b class="rule-k">${esc(r.k)}</b><span class="rule-arrow">→</span><b class="rule-v">${esc(r.v)}</b></div>
          <p class="muted">${esc(r.tip)}</p>
          <div class="rule-ex"><span class="de-ex">${esc(r.ex)}</span> ${sayBoth(r.ex)}<span class="pron inline">🗣️ ${esc(pron(r.ex))}</span></div>
        </section>`).join('')}
    </div>`;
  const input = document.getElementById('tryIn');
  const out = document.getElementById('tryOut');
  input.addEventListener('input', () => { out.textContent = `🗣️ ${input.value.trim() ? pron(input.value) : '…'}`; });
}
