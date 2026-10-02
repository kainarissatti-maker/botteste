import { store, streak, todayKey } from '../store.js';
import { allWords, LEVELS, hasPack, CATEGORIES, catLabel } from '../words.js';
import { stateOf, dueWords, newWordsToday, counts, hardWords } from '../srs.js';
import { todayXp, goal } from '../gamify.js';
import { currentLesson, unitTitle, unitIcon, courseStats } from '../course.js';
import { t, lang } from '../i18n.js';
import { $view, esc, pct, deHtml, trHtml, sayBoth, stackBar, ICON } from '../ui.js';
import { animateIn } from '../fx.js';

export function levelRow(lv, words) {
  if (!hasPack(lv)) return `<div class="lvl muted"><span class="lvl-name">${lv}</span><div class="bar"></div><span class="lvl-num">${t('soon')}</span></div>`;
  const ws = words.filter((w) => w.level === lv);
  const c = counts(ws);
  return `<div class="lvl"><span class="lvl-name">${lv}</span>${stackBar(c, ws.length)}<span class="lvl-num">${c.mastered + c.learning}/${ws.length}</span></div>`;
}

export function ring(p, inner) {
  return `<div class="ring-wrap"><svg class="ring" viewBox="0 0 120 120">
    <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset=".55" stop-color="#e879f9"/><stop offset="1" stop-color="#fbbf24"/></linearGradient></defs>
    <circle class="ring-bg" cx="60" cy="60" r="52"/>
    <circle class="ring-fg" cx="60" cy="60" r="52" data-p="${p}"/></svg><span class="orbit"><i></i></span><div class="ring-in">${inner}</div></div>`;
}

// Mesma palavra o dia todo, muda a cada dia.
function wordOfDay(words) {
  const pool = words.filter((w) => w.level === store.settings.level && !w.custom);
  if (!pool.length) return null;
  let h = 0;
  for (const ch of todayKey()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}

export function viewHome() {
  const words = allWords();
  const due = dueWords().length;
  const c = counts(words);
  const day = store.data.days[todayKey()] || { rev: 0, ok: 0, bad: 0 };
  const xp = todayXp();
  const g = goal();
  const wod = wordOfDay(words);
  const hard = hardWords();
  const cur = currentLesson();
  const cat = wod ? CATEGORIES[wod.cat] || CATEGORIES.custom : null;

  $view.innerHTML = `
    <h1 class="title">${t('hello')}</h1>
    <section class="card hero">
      <div class="hero-top">
        ${ring(xp / g, `<b data-count="${xp}">0</b><small>/ ${g} XP</small>`)}
        <div class="hero-nums">
          <div><b data-count="${due}">0</b><span>${t('dueToday')}</span></div>
          <div><b data-count="${courseStats().done}">0</b><span>${t('lessonsWord')}</span></div>
          <div><b data-count="${streak()}">0</b><span>${t('streak')}</span></div>
        </div>
      </div>
      ${cur
        ? `<a class="btn primary big shine" href="#/lesson/${encodeURIComponent(cur.id)}">${ICON.play}<span>${t('continuePath')}</span></a>
           <p class="next-up muted">${unitIcon(cur.unit)} ${t('unit')} ${cur.unit.index + 1} · ${esc(unitTitle(cur.unit, lang()))} · ${t(`lt_${cur.type}`)}</p>`
        : `<p class="done-msg">${t('allDone')}</p>`}
      ${due ? `<a class="btn big" href="#/review">🔁 ${t('dailyReview')} <span class="pill">${due}</span></a>` : ''}
    </section>

    ${wod ? `
    <section class="card wod" data-open="${esc(wod.id)}">
      <div class="wod-head"><span class="chip">✨ ${t('wordOfDay')}</span><span class="chip">${cat.icon} ${esc(catLabel(wod.cat, lang()))}</span></div>
      <div class="de-word sm">${deHtml(wod)} ${sayBoth(wod.de)}</div>
      <div class="trs left">${trHtml(wod)}</div>
    </section>` : ''}

    <section class="quick">
      <a class="card quick-item" href="#/match"><span class="q-emoji">🧩</span><b>${t('matchTitle')}</b><small class="muted">${t('matchDesc')}</small></a>
      <a class="card quick-item" href="#/quiz/listen"><span class="q-emoji">🎧</span><b>${t('qListen')}</b><small class="muted">${t('quizDesc').listen}</small></a>
      ${hard.length ? `<a class="card quick-item hard" href="#/review/hard"><span class="q-emoji">💪</span><b>${t('hardWords')}</b><small class="muted">${t('hardDesc', hard.length)}</small></a>` : ''}
    </section>

    <section class="tiles">
      <div class="tile"><span class="dot new"></span><b data-count="${c.new}">0</b><span>${t('statNew')}</span></div>
      <div class="tile"><span class="dot learning"></span><b data-count="${c.learning}">0</b><span>${t('statLearning')}</span></div>
      <div class="tile"><span class="dot mastered"></span><b data-count="${c.mastered}">0</b><span>${t('statMastered')}</span></div>
    </section>
    <section class="card">
      <h2>${t('levels')}</h2>
      ${LEVELS.map((lv) => levelRow(lv, words)).join('')}
    </section>
    <section class="card today">
      <h2>${t('today')}</h2>
      <p><b>${day.rev}</b> ${t('reviews')} · <b>${pct(day.ok, day.ok + day.bad)}%</b> ${t('accuracy')} · <b>${store.data.xp || 0}</b> ${t('totalXp')}</p>
    </section>`;

  animateIn($view);
  $view.querySelector('[data-open]')?.addEventListener('click', (e) => {
    if (!e.target.closest('[data-say]')) window.dispatchEvent(new CustomEvent('app:word', { detail: wod.id }));
  });
}
