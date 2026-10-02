import { store, streak, todayKey } from '../store.js';
import { allWords, LEVELS, CATEGORIES, catLabel } from '../words.js';
import { counts } from '../srs.js';
import { BADGES } from '../gamify.js';
import { t, lang } from '../i18n.js';
import { $view, esc, pct, stackBar, locale } from '../ui.js';
import { animateIn } from '../fx.js';
import { levelRow } from './home.js';

const WEEKS = 18;

function heatmap() {
  const days = store.data.days;
  const end = new Date(); end.setHours(0, 0, 0, 0);
  // Começa numa segunda-feira: cada coluna é uma semana.
  const start = new Date(end);
  start.setDate(start.getDate() - ((end.getDay() + 6) % 7) - (WEEKS - 1) * 7);
  const cells = [];
  const fmt = new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short' });
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const v = days[todayKey(d)]?.rev || 0;
    const lvl = v === 0 ? 0 : v < 10 ? 1 : v < 25 ? 2 : v < 50 ? 3 : 4;
    cells.push(`<i class="h${lvl}" title="${fmt.format(d)}: ${v} ${t('reviews')}"></i>`);
  }
  return `<div class="heat">${cells.join('')}</div>
    <div class="heat-legend"><span>${t('less')}</span><i class="h0"></i><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i><span>${t('more')}</span></div>`;
}

export function viewProgress() {
  const words = allWords();
  const c = counts(words);
  const totals = Object.values(store.data.days).reduce((a, d) => ({ ok: a.ok + (d.ok || 0), bad: a.bad + (d.bad || 0), rev: a.rev + (d.rev || 0) }), { ok: 0, bad: 0, rev: 0 });
  const byCat = {};
  for (const w of words) (byCat[w.cat] ||= []).push(w);
  const ui = lang();
  const got = BADGES.filter((b) => store.data.badges[b.id]).length;

  $view.innerHTML = `
    <h1 class="title">${t('progress')}</h1>
    <section class="tiles">
      <div class="tile"><span class="dot new"></span><b data-count="${c.new}">0</b><span>${t('statNew')}</span></div>
      <div class="tile"><span class="dot learning"></span><b data-count="${c.learning}">0</b><span>${t('statLearning')}</span></div>
      <div class="tile"><span class="dot mastered"></span><b data-count="${c.mastered}">0</b><span>${t('statMastered')}</span></div>
    </section>
    <section class="card">
      <h2>${t('heatmap')}</h2>
      ${heatmap()}
      <p class="muted">${t('total')}: <b>${totals.rev}</b> ${t('reviews')} · <b>${pct(totals.ok, totals.ok + totals.bad)}%</b> ${t('accuracy')} · <b>${streak()}</b> ${t('streak')} · <b>${store.data.xp || 0}</b> XP</p>
    </section>
    <section class="card">
      <h2>${t('badges')} <small class="muted">${got}/${BADGES.length}</small></h2>
      <div class="badges">${BADGES.map((b, i) => {
        const at = store.data.badges[b.id];
        return `<div class="badge ${at ? 'on' : ''}" style="--i:${i}" title="${at ? new Date(at).toLocaleDateString(locale()) : ''}">
          <span class="b-icon">${at ? b.icon : '🔒'}</span><span class="b-name">${esc(b.name[ui] || b.name.pt)}</span></div>`;
      }).join('')}</div>
    </section>
    <section class="card">
      <h2>${t('byLevel')}</h2>
      ${LEVELS.map((lv) => levelRow(lv, words)).join('')}
    </section>
    <section class="card">
      <h2>${t('byCat')}</h2>
      ${Object.entries(byCat).map(([cat, ws]) => {
        const cc = counts(ws);
        return `<a class="lvl link" href="#/study/cat:${encodeURIComponent(cat)}"><span class="lvl-name wide">${CATEGORIES[cat]?.icon || '⭐'} ${esc(catLabel(cat, ui))}</span>${stackBar(cc, ws.length)}<span class="lvl-num">${cc.mastered + cc.learning}/${ws.length}</span></a>`;
      }).join('')}
      <div class="legend"><span><span class="dot mastered"></span>${t('statMastered')}</span><span><span class="dot learning"></span>${t('statLearning')}</span><span><span class="dot new"></span>${t('statNew')}</span></div>
    </section>`;
  animateIn($view);
}
