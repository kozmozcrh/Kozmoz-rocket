const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const how = document.getElementById('how');
const gameOver = document.getElementById('gameOver');
const hud = document.getElementById('hud');
const scoreText = document.getElementById('scoreText');
const bestText = document.getElementById('bestText');
const finalScore = document.getElementById('finalScore');
const bestScore = document.getElementById('bestScore');

const startBtn = document.getElementById('startBtn');
const howBtn = document.getElementById('howBtn');
const backBtn = document.getElementById('backBtn');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');

let W = 0, H = 0, dpr = 1;
let state = 'menu';
let pressing = false;
let last = 0;
let score = 0;
let best = Number(localStorage.getItem('kozmozRocketBest') || 0);
let spawnTimer = 0;
let starTimer = 0;
let shake = 0;

const rocket = { x: 90, y: 250, r: 22, vy: 0 };
let meteors = [];
let stars = [];
let bgStars = [];

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  bgStars = Array.from({ length: 80 }, () => ({ x: Math.random()*W, y: Math.random()*H, s: Math.random()*2+0.5, v: Math.random()*40+20 }));
}
window.addEventListener('resize', resize);
resize();

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }
function setPanel(p) {
  hide(menu); hide(how); hide(gameOver); hide(hud);
  if (p === 'menu') show(menu);
  if (p === 'how') show(how);
  if (p === 'game') show(hud);
  if (p === 'over') show(gameOver);
}

function resetGame() {
  state = 'game';
  rocket.x = Math.max(72, W * 0.22);
  rocket.y = H * 0.5;
  rocket.vy = 0;
  score = 0;
  meteors = [];
  stars = [];
  spawnTimer = 0;
  starTimer = 1;
  shake = 0;
  setPanel('game');
  updateHud();
}

function updateHud() {
  scoreText.textContent = 'Skor: ' + Math.floor(score);
  bestText.textContent = 'En iyi: ' + Math.floor(best);
}

function endGame() {
  state = 'over';
  best = Math.max(best, Math.floor(score));
  localStorage.setItem('kozmozRocketBest', best);
  finalScore.textContent = 'Skor: ' + Math.floor(score);
  bestScore.textContent = 'En iyi: ' + Math.floor(best);
  setPanel('over');
}

function spawnMeteor() {
  const size = 24 + Math.random() * 30;
  meteors.push({ x: W + size, y: 40 + Math.random() * (H - 80), r: size, v: 190 + Math.random() * 120 + score * 0.9, rot: 0, rs: Math.random()*4-2 });
}

function spawnStar() {
  stars.push({ x: W + 30, y: 50 + Math.random() * (H - 100), r: 12, v: 210 + score * 0.6, a: 0 });
}

function circleHit(a, b, gap = 0) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx, dy) < a.r + b.r - gap;
}

function drawRocket(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rocket.vy * 0.002);
  const flame = pressing && state === 'game';
  if (flame) {
    ctx.beginPath();
    ctx.moveTo(-26, 9); ctx.lineTo(-54 - Math.random()*10, 0); ctx.lineTo(-26, -9); ctx.closePath();
    ctx.fillStyle = '#f97316'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-24, 5); ctx.lineTo(-42 - Math.random()*8, 0); ctx.lineTo(-24, -5); ctx.closePath();
    ctx.fillStyle = '#fde047'; ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(32, 0); ctx.quadraticCurveTo(5, -22, -28, -14); ctx.lineTo(-28, 14); ctx.quadraticCurveTo(5, 22, 32, 0); ctx.closePath();
  ctx.fillStyle = '#e5e7eb'; ctx.fill();
  ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(8, 0, 8, 0, Math.PI*2); ctx.fillStyle = '#0ea5e9'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(-30, -30); ctx.lineTo(-22, -8); ctx.fillStyle = '#ef4444'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-14, 14); ctx.lineTo(-30, 30); ctx.lineTo(-22, 8); ctx.fillStyle = '#ef4444'; ctx.fill();
  ctx.restore();
}

function drawMeteor(m) {
  ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.rot);
  const grad = ctx.createRadialGradient(-8, -8, 4, 0, 0, m.r);
  grad.addColorStop(0, '#fca5a5'); grad.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = grad;
  ctx.beginPath();
  for (let i=0;i<10;i++) {
    const ang = i / 10 * Math.PI * 2;
    const rr = m.r * (0.75 + Math.random()*0.2);
    ctx.lineTo(Math.cos(ang)*rr, Math.sin(ang)*rr);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawStar(s) {
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a);
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  for (let i=0;i<10;i++) {
    const r = i % 2 === 0 ? s.r : s.r * 0.45;
    const a = -Math.PI/2 + i * Math.PI / 5;
    ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function update(dt) {
  if (state !== 'game') return;
  score += dt * 10;
  rocket.vy += (pressing ? -850 : 760) * dt;
  rocket.vy *= 0.992;
  rocket.y += rocket.vy * dt;

  if (rocket.y < rocket.r) { rocket.y = rocket.r; rocket.vy = 0; }
  if (rocket.y > H - rocket.r) { shake = 12; endGame(); }

  spawnTimer -= dt;
  if (spawnTimer <= 0) { spawnMeteor(); spawnTimer = Math.max(0.45, 1.15 - score / 450); }
  starTimer -= dt;
  if (starTimer <= 0) { spawnStar(); starTimer = 1.4 + Math.random()*2; }

  meteors.forEach(m => { m.x -= m.v * dt; m.rot += m.rs * dt; });
  stars.forEach(s => { s.x -= s.v * dt; s.a += dt * 3; });
  meteors = meteors.filter(m => m.x > -m.r - 50);
  stars = stars.filter(s => s.x > -40);

  for (const m of meteors) if (circleHit(rocket, m, 12)) { shake = 14; endGame(); }
  for (let i = stars.length - 1; i >= 0; i--) {
    if (circleHit(rocket, stars[i], 4)) { score += 25; stars.splice(i, 1); }
  }
  updateHud();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  const sx = shake ? (Math.random()-0.5)*shake : 0;
  const sy = shake ? (Math.random()-0.5)*shake : 0;
  shake *= 0.86;
  ctx.save(); ctx.translate(sx, sy);

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0f172a'); grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad; ctx.fillRect(-20, -20, W+40, H+40);

  for (const st of bgStars) {
    st.x -= st.v * 0.016;
    if (st.x < 0) { st.x = W; st.y = Math.random()*H; }
    ctx.globalAlpha = 0.5 + Math.random()*0.4;
    ctx.fillStyle = 'white'; ctx.fillRect(st.x, st.y, st.s, st.s);
  }
  ctx.globalAlpha = 1;

  stars.forEach(drawStar);
  meteors.forEach(drawMeteor);
  if (state === 'game' || state === 'over') drawRocket(rocket.x, rocket.y);
  ctx.restore();
}

function loop(t) {
  const dt = Math.min((t - last) / 1000 || 0, 0.033);
  last = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function press(e) { e.preventDefault?.(); pressing = true; }
function release(e) { e.preventDefault?.(); pressing = false; }
window.addEventListener('pointerdown', press, { passive: false });
window.addEventListener('pointerup', release, { passive: false });
window.addEventListener('pointercancel', release, { passive: false });
window.addEventListener('keydown', e => { if (e.code === 'Space') pressing = true; });
window.addEventListener('keyup', e => { if (e.code === 'Space') pressing = false; });

startBtn.onclick = resetGame;
howBtn.onclick = () => { setPanel('how'); state = 'menu'; };
backBtn.onclick = () => { setPanel('menu'); state = 'menu'; };
restartBtn.onclick = resetGame;
menuBtn.onclick = () => { state = 'menu'; setPanel('menu'); };

setPanel('menu');
bestText.textContent = 'En iyi: ' + best;
