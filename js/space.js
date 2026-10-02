// Fundo espacial: estrelas que piscam, deriva lenta e estrelas cadentes de vez em quando.
const canvas = document.getElementById('stars');
const ctx = canvas?.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let stars = [];
let meteors = [];
let w = 0, h = 0, dpr = 1, raf = 0, last = 0, nextMeteor = 0;

function color() {
  return getComputedStyle(document.documentElement).getPropertyValue('--star').trim() || '255 255 255';
}

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  w = innerWidth; h = innerHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.round(Math.min(220, (w * h) / 6500));
  stars = Array.from({ length: n }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    r: Math.random() < 0.08 ? 1.4 + Math.random() : 0.4 + Math.random() * 0.9,
    a: 0.3 + Math.random() * 0.7, tw: 0.6 + Math.random() * 2.2, ph: Math.random() * Math.PI * 2,
    v: 0.004 + Math.random() * 0.012, // deriva (px por ms)
  }));
  if (reduced.matches) draw(0, 0);
}

function draw(now, dt) {
  const rgb = color();
  ctx.clearRect(0, 0, w, h);
  for (const s of stars) {
    s.x -= s.v * dt;
    if (s.x < -2) { s.x = w + 2; s.y = Math.random() * h; }
    const alpha = s.a * (0.55 + 0.45 * Math.sin(now / 1000 * s.tw + s.ph));
    ctx.fillStyle = `rgb(${rgb} / ${alpha.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    if (s.r > 1.3) { // estrelas grandes ganham um brilho em cruz
      ctx.fillStyle = `rgb(${rgb} / ${(alpha * 0.25).toFixed(3)})`;
      ctx.fillRect(s.x - s.r * 3, s.y - 0.3, s.r * 6, 0.6);
      ctx.fillRect(s.x - 0.3, s.y - s.r * 3, 0.6, s.r * 6);
    }
  }
  if (now > nextMeteor) {
    meteors.push({ x: Math.random() * w * 0.8 + w * 0.2, y: Math.random() * h * 0.4, life: 0 });
    nextMeteor = now + 3500 + Math.random() * 6000;
  }
  meteors = meteors.filter((m) => m.life < 900);
  for (const m of meteors) {
    m.life += dt;
    const k = m.life / 900;
    const x = m.x - k * 320, y = m.y + k * 160;
    const g = ctx.createLinearGradient(x, y, x + 90, y - 45);
    g.addColorStop(0, `rgb(${rgb} / ${(1 - k).toFixed(2)})`);
    g.addColorStop(1, `rgb(${rgb} / 0)`);
    ctx.strokeStyle = g; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 90, y - 45); ctx.stroke();
  }
}

function loop(now) {
  const dt = Math.min(50, now - (last || now));
  last = now;
  draw(now, dt);
  raf = requestAnimationFrame(loop);
}

function start() {
  cancelAnimationFrame(raf);
  last = 0;
  if (!reduced.matches && !document.hidden) raf = requestAnimationFrame(loop);
  else draw(performance.now(), 0);
}

if (ctx) {
  resize();
  start();
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', start); // pausa quando a aba está escondida
  reduced.addEventListener?.('change', start);
  window.addEventListener('app:theme', () => draw(performance.now(), 0));
}
