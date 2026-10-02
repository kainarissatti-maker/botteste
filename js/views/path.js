// Trilha: unidades com lições em zigue-zague, como no Duolingo.
import { course, unitTitle, unitIcon, lessonDone, currentLesson, courseStats, isUnlocked } from '../course.js';
import { dueWords } from '../srs.js';
import { t, lang } from '../i18n.js';
import { $view, esc, pct } from '../ui.js';
import { animateIn, toast } from '../fx.js';
import { store } from '../store.js';

const NODE_ICON = { words: '⭐', sentences: '💬', check: '🏆' };
const OFFSETS = [0, 38, 62, 38, 0, -38, -62, -38]; // deslocamento horizontal (px) do zigue-zague

export function viewPath() {
  const units = course();
  const cur = currentLesson();
  const st = courseStats();
  const due = dueWords().length;
  let n = 0;

  $view.innerHTML = `
    <section class="card path-top">
      <div>
        <h1 class="title">${t('pathTitle')}</h1>
        <p class="muted">${t('pathStats', st.done, st.total)}</p>
        <div class="bar"><i class="mastered" data-w="${pct(st.done, st.total)}"></i></div>
      </div>
      <div class="path-actions">
        ${cur ? `<a class="btn primary shine" href="#/lesson/${encodeURIComponent(cur.id)}">▶ ${t('continue')}</a>` : ''}
        <a class="btn" href="#/review">🔁 ${t('dailyReview')}${due ? ` <span class="pill">${due}</span>` : ''}</a>
        <a class="btn" href="#/sounds">🗣️ ${t('soundsTitle')}</a>
      </div>
    </section>
    ${units.map((u) => {
      const done = u.lessons.filter((l) => lessonDone(l.id)).length;
      const locked = !isUnlocked(u.lessons[0].id);
      return `
      <section class="unit ${locked ? 'locked' : ''} ${done === u.lessons.length ? 'complete' : ''}">
        <div class="unit-banner" style="--h:${(u.index * 37) % 360}">
          <div><small>${t('unit')} ${u.index + 1}</small><h2>${unitIcon(u)} ${esc(unitTitle(u, lang()))}</h2></div>
          <span class="unit-count">${done}/${u.lessons.length}</span>
        </div>
        <div class="nodes">
          ${u.lessons.map((l) => {
            const isDone = lessonDone(l.id);
            const isCur = cur && cur.id === l.id;
            const state = isDone ? 'done' : isCur ? 'current' : 'locked';
            const x = OFFSETS[n++ % OFFSETS.length];
            return `<div class="node-row" style="--x:${x}px">
              <a class="node ${state} t-${l.type}" href="#/lesson/${encodeURIComponent(l.id)}" data-state="${state}" aria-label="${esc(t(`lt_${l.type}`))}">
                <span>${isDone ? '✓' : state === 'locked' ? '🔒' : NODE_ICON[l.type]}</span>
              </a>
              ${isCur ? `<span class="node-tip">${t('start')}</span>` : ''}
              <small class="node-label">${t(`lt_${l.type}`)}</small>
            </div>`;
          }).join('')}
        </div>
      </section>`;
    }).join('')}`;

  animateIn($view);
  $view.querySelectorAll('.node[data-state="locked"]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    a.classList.remove('nope'); void a.offsetWidth; a.classList.add('nope');
    toast(t('lockedMsg'), { icon: '🔒', ms: 2000 });
  }));
  // Rola até a lição atual.
  const curEl = $view.querySelector('.node.current');
  if (curEl && store.data.lessons && Object.keys(store.data.lessons).length) {
    setTimeout(() => curEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
  }
}
