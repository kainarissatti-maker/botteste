import { store } from '../store.js';
import { allWords, wordById, makeWord, invalidateWords, CATEGORIES, LEVELS, catLabel } from '../words.js';
import { stateOf, statusOf, resetWord } from '../srs.js';
import { t, lang } from '../i18n.js';
import { $view, esc, deHtml, trHtml, plHtml, sayBtn, sayBoth, ICON, openDialog, closeDialog, locale } from '../ui.js';
import { toast } from '../fx.js';

const wf = { q: '', level: '', cat: '', status: '' };
const STATUS_LABEL = () => ({ new: t('statNew'), learning: t('statLearning'), mastered: t('statMastered') });

export function viewWords() {
  const cats = Object.keys(CATEGORIES);
  $view.innerHTML = `
    <div class="words-head">
      <h1 class="title">${t('words')}</h1>
      <button class="btn primary" id="addWord">${ICON.plus}<span>${t('addWord')}</span></button>
    </div>
    <div class="filters">
      <input id="wq" type="search" placeholder="${esc(t('search'))}" value="${esc(wf.q)}">
      <div class="row">
        <select id="wlevel"><option value="">${t('allLevels')}</option>${LEVELS.map((l) => `<option ${wf.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select id="wcat"><option value="">${t('allCats')}</option>${cats.map((c) => `<option value="${c}" ${wf.cat === c ? 'selected' : ''}>${CATEGORIES[c].icon} ${esc(catLabel(c, lang()))}</option>`).join('')}</select>
      </div>
      <div class="chips" id="wstatus">
        ${[['', t('allStatus')], ['new', t('statNew')], ['learning', t('statLearning')], ['mastered', t('statMastered')]].map(([v, l]) =>
          `<button class="chip-btn ${wf.status === v ? 'active' : ''}" data-v="${v}">${v ? `<span class="dot ${v}"></span>` : ''}${l}</button>`).join('')}
      </div>
    </div>
    <div id="wlist"></div>`;

  const q = document.getElementById('wq');
  q.addEventListener('input', () => { wf.q = q.value; drawWordList(); });
  document.getElementById('wlevel').addEventListener('change', (e) => { wf.level = e.target.value; drawWordList(); });
  document.getElementById('wcat').addEventListener('change', (e) => { wf.cat = e.target.value; drawWordList(); });
  document.getElementById('wstatus').addEventListener('click', (e) => {
    const b = e.target.closest('[data-v]');
    if (!b) return;
    wf.status = b.dataset.v;
    document.querySelectorAll('#wstatus .chip-btn').forEach((x) => x.classList.toggle('active', x === b));
    drawWordList();
  });
  document.getElementById('addWord').addEventListener('click', () => wordForm());
  drawWordList();
}

function drawWordList() {
  const $list = document.getElementById('wlist');
  if (!$list) return;
  const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const q = fold(wf.q.trim());
  const words = allWords().filter((w) =>
    (!wf.level || w.level === wf.level) && (!wf.cat || w.cat === wf.cat) && (!wf.status || statusOf(w.id) === wf.status) &&
    (!q || fold(`${w.de} ${w.pl} ${w.en} ${w.pt}`).includes(q)));
  const groups = {};
  for (const w of words) (groups[w.cat] ||= []).push(w);

  $list.innerHTML = Object.entries(groups).map(([cat, ws]) => `
    <section class="card group">
      <div class="group-head">
        <h2>${CATEGORIES[cat]?.icon || '⭐'} ${esc(catLabel(cat, lang()))} <small class="muted">${t('count', ws.length)}</small></h2>
        <a class="btn sm" href="#/study/cat:${encodeURIComponent(cat)}">${t('studyCat')}</a>
      </div>
      <ul class="wlist">${ws.map((w) => `
        <li data-id="${esc(w.id)}">
          <span class="dot ${statusOf(w.id)}"></span>
          <span class="w-de">${deHtml(w)}</span>
          <span class="w-tr muted">${esc(store.settings.show === 'pt' ? w.pt : store.settings.show === 'en' ? w.en : `${w.en} · ${w.pt}`)}</span>
          ${sayBtn(w.de, 'de-DE', 'sm')}
        </li>`).join('')}</ul>
    </section>`).join('') || '<p class="muted center">—</p>';

  $list.querySelectorAll('li[data-id]').forEach((li) => li.addEventListener('click', (e) => {
    if (!e.target.closest('[data-say]')) wordDetail(li.dataset.id);
  }));
}

export function wordDetail(id) {
  const w = wordById(id);
  if (!w) return;
  const st = stateOf(id);
  const status = statusOf(id);
  const c = CATEGORIES[w.cat] || CATEGORIES.custom;
  openDialog(`
    <div class="flash-meta"><span class="chip">${c.icon} ${esc(catLabel(w.cat, lang()))}</span><span class="chip">${w.level}</span>
      ${w.cognate ? `<span class="chip cog">≈ EN · ${t('cognate')}</span>` : ''}</div>
    <div class="de-word">${deHtml(w)} ${sayBoth(w.de)}</div>${plHtml(w)}
    <div class="trs">${trHtml(w)}</div>
    <dl class="meta">
      <dt>${t('status')}</dt><dd><span class="dot ${status}"></span> ${STATUS_LABEL()[status]}</dd>
      ${st ? `<dt>${t('nextReview')}</dt><dd>${new Date(st.d).toLocaleDateString(locale())}</dd>
      <dt>✓ / ✗</dt><dd>${st.c} / ${st.w}</dd>` : ''}
    </dl>
    <div class="row wrap">
      ${st ? `<button class="btn" id="dReset">${t('resetWord')}</button>` : ''}
      ${w.custom ? `<button class="btn" id="dEdit">${t('edit')}</button><button class="btn danger" id="dDel">${t('del')}</button>` : ''}
      <button class="btn primary" data-close>OK</button>
    </div>`);
  document.getElementById('dReset')?.addEventListener('click', () => { resetWord(id); closeDialog(); drawWordList(); });
  document.getElementById('dEdit')?.addEventListener('click', () => wordForm(w));
  document.getElementById('dDel')?.addEventListener('click', () => {
    if (!confirm(t('confirmDel'))) return;
    store.data.custom = store.data.custom.filter((x) => x.id !== id);
    resetWord(id);
    invalidateWords();
    closeDialog();
    drawWordList();
  });
}

function wordForm(w = null) {
  const cats = Object.keys(CATEGORIES);
  openDialog(`
    <h2>${w ? t('edit') : t('addWord')}</h2>
    <form id="wordForm" class="form">
      <label>${t('fDe')}<input name="de" required value="${esc(w?.de)}" placeholder="der Hund"></label>
      <label>${t('fPl')}<input name="pl" value="${esc(w?.pl)}" placeholder="die Hunde"></label>
      <label>${t('fEn')}<input name="en" required value="${esc(w?.en)}" placeholder="dog"></label>
      <label>${t('fPt')}<input name="pt" required value="${esc(w?.pt)}" placeholder="cachorro"></label>
      <div class="row">
        <label>${t('fCat')}<select name="cat">${cats.map((c) => `<option value="${c}" ${(w?.cat || 'custom') === c ? 'selected' : ''}>${CATEGORIES[c].icon} ${esc(catLabel(c, lang()))}</option>`).join('')}</select></label>
        <label>${t('fLevel')}<select name="level">${LEVELS.map((l) => `<option ${(w?.level || 'A1') === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </div>
      <div class="umlauts">${['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'].map((c) => `<button type="button" class="btn sm" data-ch="${c}">${c}</button>`).join('')}</div>
      <div class="row"><button type="button" class="btn" data-close>${t('cancel')}</button><button class="btn primary" type="submit">${t('save')}</button></div>
    </form>`);
  const form = document.getElementById('wordForm');
  let lastInput = form.de;
  form.addEventListener('focusin', (e) => { if (e.target.tagName === 'INPUT') lastInput = e.target; });
  form.querySelectorAll('[data-ch]').forEach((b) => b.addEventListener('click', () => { lastInput.value += b.dataset.ch; lastInput.focus(); }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    if (!f.de.trim() || !f.en.trim() || !f.pt.trim()) return alert(t('required'));
    const rec = { id: w?.id || `custom:${Date.now()}`, de: f.de.trim(), pl: f.pl.trim(), en: f.en.trim(), pt: f.pt.trim(), cat: f.cat, level: f.level };
    makeWord(rec); // valida o formato
    if (w) store.data.custom = store.data.custom.map((x) => (x.id === w.id ? rec : x));
    else store.data.custom.push(rec);
    store.save();
    invalidateWords();
    closeDialog();
    toast(`${esc(rec.de)} ✓`, { icon: '⭐' });
    drawWordList();
  });
}
