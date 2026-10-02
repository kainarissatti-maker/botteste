// Efeitos: animações, avisos (toasts), confete, sons curtos e vibração.
import { store } from './store.js';

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms));

// Barras, números e anéis começam do zero e animam até o valor final.
export function animateIn(root = document) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.querySelectorAll('.bar i[data-w]').forEach((el) => { el.style.width = `${el.dataset.w}%`; });
    root.querySelectorAll('.ring-fg[data-p]').forEach((el) => {
      el.style.strokeDashoffset = String(326.73 * (1 - Math.min(1, +el.dataset.p)));
    });
  }));
  root.querySelectorAll('[data-count]').forEach((el) => countUp(el, +el.dataset.count));
}

export function countUp(el, to, ms = 700) {
  if (reduced() || to <= 0) { el.textContent = to; return; }
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    el.textContent = Math.round(to * (1 - (1 - k) ** 3));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Entrada em cascata dos blocos de uma tela.
export function stagger(root) {
  [...root.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 8)));
  root.classList.remove('anim');
  void root.offsetWidth;
  root.classList.add('anim');
}

let $toasts;
export function toast(html, { icon = '', ms = 2800, kind = '' } = {}) {
  if (!$toasts) { $toasts = document.createElement('div'); $toasts.className = 'toasts'; document.body.append($toasts); }
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `${icon ? `<span class="toast-icon">${icon}</span>` : ''}<div>${html}</div>`;
  $toasts.append(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms);
}

// Texto que sobe e some (ex.: "+10 XP").
export function floatText(text, x, y, cls = '') {
  if (reduced()) return;
  const el = document.createElement('span');
  el.className = `float-text ${cls}`;
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.append(el);
  setTimeout(() => el.remove(), 1000);
}

export function confetti({ count = 140, ms = 1800 } = {}) {
  if (reduced()) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  const dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  document.body.append(c);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const colors = ['#dd0000', '#ffce00', '#1d1b18', '#2563eb', '#16a34a', '#f59e0b', '#ec4899'];
  const parts = Array.from({ length: count }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.3, y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
    w: 6 + Math.random() * 6, h: 4 + Math.random() * 6, color: colors[(Math.random() * colors.length) | 0],
  }));
  const t0 = performance.now();
  const frame = (now) => {
    const k = (now - t0) / ms;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.42; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k * k); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (k < 1) requestAnimationFrame(frame); else c.remove();
  };
  requestAnimationFrame(frame);
}

// Sons curtos gerados na hora (sem arquivos).
let audio;
function tone(freq, start, dur, type = 'sine', vol = 0.07) {
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = type; o.frequency.value = freq;
  const t0 = audio.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(audio.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

export function sfx(kind) {
  if (!store.settings.sfx) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    if (kind === 'good') { tone(660, 0, 0.12); tone(990, 0.07, 0.16); }
    else if (kind === 'bad') { tone(220, 0, 0.22, 'triangle', 0.09); tone(175, 0.08, 0.22, 'triangle', 0.07); }
    else if (kind === 'flip') tone(540, 0, 0.06, 'sine', 0.035);
    else if (kind === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, 'sine', 0.06));
  } catch { /* sem áudio disponível */ }
}

export function haptic(pattern = 12) { try { navigator.vibrate?.(pattern); } catch { /* sem vibração */ } }
