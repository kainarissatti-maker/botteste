import { store, todayKey } from '../store.js';
import { invalidateWords } from '../words.js';
import { t } from '../i18n.js';
import { canSpeak, voicesFor, hasVoice } from '../speech.js';
import { $view, esc, ICON } from '../ui.js';
import { toast } from '../fx.js';
import { checkBadges } from '../gamify.js';

function voiceSel(key, code) {
  const list = voicesFor(code);
  const cur = store.settings[key];
  return `<select data-set="${key}">
    <option value="">${t('voiceNeural')}</option>
    <option value="auto" ${cur === 'auto' ? 'selected' : ''}>${t('voiceBrowser')} · ${t('voiceAuto')}${list[0] ? ` (${esc(list[0].name)})` : ''}</option>
    ${list.map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === cur ? 'selected' : ''}>${t('voiceBrowser')} · ${esc(v.name)}</option>`).join('')}</select>`;
}

export function viewSettings() {
  const s = store.settings;
  const sel = (key, opts) => `<select data-set="${key}">${opts.map(([v, l]) => `<option value="${v}" ${String(s[key]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const browserOnly = s.voiceDe && s.voiceDe !== '';
  $view.innerHTML = `
    <h1 class="title">${t('settings')}</h1>
    <section class="card form">
      <label>${t('sUi')}${sel('ui', [['pt', 'Português'], ['en', 'English'], ['de', 'Deutsch']])}</label>
      <label>${t('sTheme')}${sel('theme', [['space', `🪐 ${t('sThemeSpace')}`], ['light', `☀️ ${t('themeLight')}`]])}</label>
      <label>${t('sShow')}${sel('show', [['both', t('sBoth')], ['en', t('sOnlyEn')], ['pt', t('sOnlyPt')]])}</label>
      <label>${t('sDir')}${sel('direction', [['de', t('sDirDe')], ['native', t('sDirNative')], ['mix', t('sDirMix')]])}</label>
      <div class="row">
        <label>${t('sNew')}${sel('newPerDay', [5, 10, 15, 20, 30, 50].map((n) => [n, n]))}</label>
        <label>${t('sGoal')}${sel('goal', [50, 100, 150, 200, 300, 500].map((n) => [n, n]))}</label>
      </div>
      <label class="check"><input type="checkbox" data-set="sfx" ${s.sfx ? 'checked' : ''}> ${t('sSfx')}</label>
    </section>
    <section class="card form">
      <h2>🔊 ${t('listen')}</h2>
      ${canSpeak() ? `
        <label>${t('sVoiceDe')}${voiceSel('voiceDe', 'de-DE')}</label>
        ${browserOnly && !hasVoice('de-DE') ? `<p class="warn">${t('noVoice')} ${t('voiceHelp')}</p>` : ''}
        <label>${t('sVoiceEn')}${voiceSel('voiceEn', 'en-US')}</label>
        <button class="btn" data-say="Good morning! I am learning German." data-lang="en-US">${ICON.speaker}<span>Good morning! I am learning German.</span></button>
        <label>${t('sRate')}${sel('speed', [['normal', t('spNormal')], ['slow', `${t('spSlow')} (${t('recommended')})`], ['slower', `🐢 ${t('spSlower')}`]])}</label>
        <button class="btn" data-say="Guten Morgen! Ich lerne Deutsch." data-lang="de-DE">${ICON.speaker}<span>Guten Morgen! Ich lerne Deutsch.</span></button>
        <label class="check"><input type="checkbox" data-set="autoplay" ${s.autoplay ? 'checked' : ''}> ${t('sAuto')}</label>` : `<p class="warn">${t('noVoice')}</p>`}
    </section>
    <section class="card form">
      <h2>${t('sData')}</h2>
      <p class="muted">${t('dataNote')}</p>
      <div class="row wrap">
        <button class="btn" id="exp">${t('export')}</button>
        <label class="btn file">${t('import')}<input type="file" id="imp" accept="application/json,.json" hidden></label>
        <button class="btn danger" id="rst">${t('reset')}</button>
      </div>
    </section>
    <p class="muted center small">APIvonKAKA · v0.4</p>`;

  $view.querySelectorAll('[data-set]').forEach((el) => el.addEventListener('change', () => {
    const key = el.dataset.set;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (['newPerDay', 'goal'].includes(key)) v = Number(v);
    store.setSetting(key, v);
    if (key === 'theme') window.dispatchEvent(new Event('app:theme'));
    if (key === 'ui') { window.dispatchEvent(new Event('app:render')); checkBadges(); }
    if (key === 'voiceDe') viewSettings();
  }));
  document.getElementById('exp').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `wortschatz-backup-${todayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  document.getElementById('imp').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (typeof data !== 'object' || typeof data.progress !== 'object') throw new Error('bad');
      store.replace(data);
      invalidateWords();
      toast(t('imported'), { icon: '✅' });
      window.dispatchEvent(new Event('app:render'));
    } catch { toast(t('badFile'), { icon: '⚠️', kind: 'bad' }); }
  });
  document.getElementById('rst').addEventListener('click', () => {
    if (!confirm(t('confirmReset'))) return;
    store.reset();
    invalidateWords();
    window.dispatchEvent(new Event('app:render'));
  });
}
