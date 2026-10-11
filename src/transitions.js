/* Scroll transitions: one unique, scrubbed sequence between every pair of sections.
   Each seam = tall block + sticky stage; a GSAP timeline (duration 1) is scrubbed by the scroll through it. */

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function rngFrom(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function h(tag, cls, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
function svg(html, cls, parent, attrs = {}) {
  const e = document.createElementNS(NS, 'svg');
  if (cls) e.setAttribute('class', cls);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
function canvasLayer(st, ctx) {
  const c = h('canvas', 'layer', st);
  const g = c.getContext('2d');
  const size = { w: 1, h: 1, dpr: 1 };
  const fit = () => {
    size.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    size.w = st.clientWidth; size.h = st.clientHeight;
    c.width = Math.round(size.w * size.dpr); c.height = Math.round(size.h * size.dpr);
    g.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    ctx.redraw();
  };
  const ro = new ResizeObserver(fit);
  ro.observe(st);
  ctx.cleanups.push(() => ro.disconnect());
  return { c, g, size, fit };
}

/* ---------------------------------------------------------------- 1 · Hero → About
   The contour map you were looking at dives away (rings rush past the camera) while a sheet of torn paper rises over it. */
function t1({ st, tl, gsap, cap }) {
  const rng = rngFrom(11);
  let rings = '';
  for (let i = 0; i < 18; i++) {
    const r = 3 + i * 3.2, ph = rng() * 6.28, k = 2 + Math.floor(rng() * 3);
    let d = '';
    for (let a = 0; a < 80; a++) {
      const t = (a / 80) * Math.PI * 2;
      const rr = r * (1 + 0.16 * Math.sin(t * k + ph) + 0.07 * Math.sin(t * (k + 3) + ph * 2));
      d += (a ? 'L' : 'M') + (50 + Math.cos(t) * rr * 1.3).toFixed(2) + ' ' + (50 + Math.sin(t) * rr * 0.8).toFixed(2);
    }
    rings += `<path d="${d}Z" fill="none" stroke="${i % 4 === 0 ? '#ff7a45' : 'rgba(236,235,230,.4)'}" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
  }
  const vg = svg(`<g class="rg">${rings}</g>`, 'layer', st, { viewBox: '0 0 100 100', preserveAspectRatio: 'xMidYMid slice' });
  const g = vg.querySelector('.rg');

  const edge = (seed, fill, amp) => {
    const r = rngFrom(seed); let d = 'M0 64';
    for (let x = 0; x <= 1000; x += 8) d += `L${x} ${(30 + (r() - 0.5) * amp + Math.sin(x * 0.021) * 7 + Math.sin(x * 0.07) * 4).toFixed(1)}`;
    return `<svg class="t1-edge" viewBox="0 0 1000 64" preserveAspectRatio="none"><path d="${d}L1000 64Z" fill="${fill}"/></svg>`;
  };
  const back = h('div', 't1-paper2', st, edge(5, '#f6efdf', 30));
  const front = h('div', 't1-paper', st, edge(9, '#ece4d3', 22) + '<div class="t1-title"><span>01</span><em>About</em></div>');
  const title = front.querySelector('.t1-title');

  tl.fromTo(g, { scale: 0.42, rotation: -8, svgOrigin: '50 50' }, { scale: 3.6, rotation: 24, svgOrigin: '50 50', ease: 'power1.in', duration: 0.85 }, 0)
    .to(g, { opacity: 0, duration: 0.3 }, 0.55)
    .fromTo(back, { y: () => st.clientHeight + 70 }, { y: 0, ease: 'power2.out', duration: 0.8, immediateRender: true, invalidateOnRefresh: true }, 0.12)
    .fromTo(front, { y: () => st.clientHeight + 70 }, { y: 0, ease: 'power2.inOut', duration: 0.78, immediateRender: true, invalidateOnRefresh: true }, 0.2)
    .fromTo(title, { y: '24vh' }, { y: '0vh', ease: 'power2.out', duration: 0.6 }, 0.35);
}

/* ---------------------------------------------------------------- 2 · About → Work
   The page becomes an index: ruled bars slide in from alternating sides carrying the project names. */
function t2({ st, tl }) {
  const names = ['Index', 'Forecasting', 'The Ledger', 'Travel Without Borders', 'M.G. Drive Pro', 'Economic Dashboard', 'Mind Canvas', 'Job tracker'];
  const bars = names.map((n, i) => {
    const b = h('div', 't2-bar', st);
    b.style.top = i * 12.5 + '%'; b.style.height = '12.6%';
    const lab = h('div', 't2-lab', b, `<b>0${i}</b><span>${n}</span><i>${n}</i>`);
    tl.fromTo(b, { xPercent: i % 2 ? 101 : -101 }, { xPercent: 0, ease: 'power3.out', duration: 0.4 }, 0.03 + i * 0.058)
      .fromTo(lab, { x: i % 2 ? '14vw' : '-14vw' }, { x: i % 2 ? '-14vw' : '14vw', ease: 'none', duration: 1 }, 0)
      .to(lab, { opacity: 0, duration: 0.14 }, 0.86);
  });
  return bars;
}

/* ---------------------------------------------------------------- 3 · Work → Forecasting
   Noisy points scattered across the dark drift into a fitted trend; the forecast band opens to the right. */
function t3({ st, tl, gsap, to, ctx }) {
  const rng = rngFrom(33);
  const N = 240;
  const pts = Array.from({ length: N }, (_, i) => {
    const u = (i + rng() * 0.6) / N;
    return { u, sx: rng(), sy: rng(), d: rng() * 0.38, n: (rng() - 0.5) * 2, wob: rng() * 6.28 };
  });
  const L = canvasLayer(st, ctx);
  const f = (u) => 0.62 - 0.34 * u + 0.1 * Math.sin(u * 8.2) + 0.05 * Math.sin(u * 19);
  const NOW = 0.6;
  const draw = (p) => {
    const { g, size } = L; const W = size.w, H = size.h;
    g.clearRect(0, 0, W, H);
    const x0 = W * 0.07, x1 = W * 0.93, y0 = H * 0.18, y1 = H * 0.8;
    const X = (u) => x0 + (x1 - x0) * u, Y = (v) => y0 + (y1 - y0) * v;
    // axes + grid draw in
    const ga = smooth(0.15, 0.6, p);
    g.strokeStyle = `rgba(120,170,255,${0.2 * ga})`; g.lineWidth = 1;
    for (let i = 0; i <= 8; i++) { const x = X(i / 8); g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 + (y1 - y0) * ga); g.stroke(); }
    for (let i = 0; i <= 5; i++) { const y = Y(i / 5); g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + (x1 - x0) * ga, y); g.stroke(); }
    // forecast band
    const bandA = smooth(0.62, 0.92, p);
    if (bandA > 0) {
      g.fillStyle = `rgba(76,210,255,${0.16 * bandA})`; g.beginPath();
      const s0 = Math.floor(NOW * 60);
      for (let i = s0; i <= 60; i++) { const u = i / 60, w = ((u - NOW) / (1 - NOW)) * 0.16 * bandA; g.lineTo(X(u), Y(f(u) - w)); }
      for (let i = 60; i >= s0; i--) { const u = i / 60, w = ((u - NOW) / (1 - NOW)) * 0.16 * bandA; g.lineTo(X(u), Y(f(u) + w)); }
      g.closePath(); g.fill();
      g.setLineDash([6, 6]); g.strokeStyle = `rgba(76,210,255,${0.7 * bandA})`; g.beginPath(); g.moveTo(X(NOW), y0 - 6); g.lineTo(X(NOW), y1 + 6); g.stroke(); g.setLineDash([]);
      g.fillStyle = `rgba(232,240,255,${0.8 * bandA})`; g.font = '500 11px "JetBrains Mono Variable", monospace';
      g.fillText('now', X(NOW) - 28, y0 - 12); g.fillText('forecast →', X(NOW) + 10, y0 - 12);
    }
    // points: scattered → fitted
    for (const q of pts) {
      const t = eio(clamp((p - q.d) / 0.5));
      const tx = X(q.u), spread = q.u > NOW ? 0.05 + (q.u - NOW) * 0.16 : 0.035;
      const ty = Y(f(q.u) + q.n * spread);
      const sx = W * (0.03 + 0.94 * q.sx) + Math.sin(p * 9 + q.wob) * 10, sy = H * (0.08 + 0.84 * q.sy) + Math.cos(p * 7 + q.wob) * 10;
      const x = lerp(sx, tx, t), y = lerp(sy, ty, t);
      const k = t;
      g.fillStyle = `rgba(${Math.round(lerp(154, 76, k))},${Math.round(lerp(154, 210, k))},${Math.round(lerp(162, 255, k))},${lerp(0.55, 0.95, k)})`;
      g.beginPath();
      if (q.u > NOW && k > 0.9) { g.strokeStyle = 'rgba(76,210,255,.9)'; g.arc(x, y, 3.2, 0, 6.283); g.stroke(); } else { g.arc(x, y, 2.4, 0, 6.283); g.fill(); }
    }
    // trend line draws left → right
    const lp = smooth(0.5, 0.88, p);
    if (lp > 0) {
      g.strokeStyle = '#4cd2ff'; g.lineWidth = 2.5; g.beginPath();
      const n = Math.floor(60 * lp);
      for (let i = 0; i <= n; i++) { const u = i / 60; i ? g.lineTo(X(u), Y(f(u))) : g.moveTo(X(u), Y(f(u))); }
      g.stroke(); g.lineWidth = 1;
    }
  };
  ctx.redraw = () => draw(tl.progress());
  ctx.update.push(draw);
  draw(0);
  tl.fromTo(st, { backgroundColor: to.from }, { backgroundColor: to.to, duration: 0.5 }, 0.1);
  return { ownsBg: true };
}

/* ---------------------------------------------------------------- 4 · Forecasting → Ledger
   The model's output scrolls away as a ledger page is turned in from the right and the books are totalled. */
function t4({ st, tl, ctx }) {
  const rng = rngFrom(44);
  let txt = '';
  for (let i = 0; i < 40; i++) txt += Array.from({ length: 6 }, () => (rng() * 9).toFixed(4)).join('   ') + '\n';
  const data = h('div', 't4-data', st, txt);
  const page = h('div', 't4-page', st);
  const fold = h('div', 't4-fold', st);
  const sheet = h('div', 't4-sheet', page);
  const labels = ['Opening balance', 'Receipts', 'Payments', 'Transfers', 'Adjustments', 'Accruals', 'Rounding', 'Reserve'];
  const vals = labels.map(() => Math.round((rng() * 8000 + 900) * 100) / 100);
  const rows = labels.map((l, i) => {
    const r = h('div', 't4-row', sheet, `<span>${l}</span><span class="fig">0.00</span><i class="rule"></i>`);
    r.style.top = (i * 10.5) + '%';
    return { r, fig: r.querySelector('.fig'), rule: r.querySelector('.rule'), v: vals[i], at: 0.38 + i * 0.05 };
  });
  const total = h('div', 't4-row total', sheet, '<span>Balance</span><span class="fig">0.00</span><i class="rule"></i>');
  total.style.top = (8 * 10.5 + 3) + '%';
  const tf = total.querySelector('.fig');
  const sum = vals.reduce((a, b) => a + b, 0);
  const stamp = h('div', 't4-stamp', sheet, 'Balanced');
  const fmt = (v) => v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  tl.fromTo(data, { y: 0, opacity: 1 }, { y: '-30vh', opacity: 0.1, duration: 0.7 }, 0)
    .fromTo(page, { '--edge': '100%' }, { '--edge': '0%', ease: 'power2.inOut', duration: 0.5 }, 0.08)
    .fromTo(fold, { '--edge': '100%' }, { '--edge': '0%', ease: 'power2.inOut', duration: 0.5 }, 0.08)
    .to(fold, { opacity: 0, duration: 0.05 }, 0.55);
  rows.forEach((o) => tl.fromTo(o.rule, { scaleX: 0 }, { scaleX: 1, ease: 'power2.out', duration: 0.1 }, o.at - 0.04));
  tl.fromTo(total.querySelector('.rule'), { scaleX: 0 }, { scaleX: 1, ease: 'power2.out', duration: 0.1 }, 0.84)
    .fromTo(stamp, { opacity: 0, scale: 1.7 }, { opacity: 0.9, scale: 1, ease: 'power3.in', duration: 0.07 }, 0.93);
  ctx.update.push((p) => {
    rows.forEach((o) => { o.fig.textContent = fmt(o.v * eio(clamp((p - o.at) / 0.1))); });
    tf.textContent = fmt(sum * smooth(0.8, 0.93, p));
  });
}

/* ---------------------------------------------------------------- 5 · Ledger → Travel
   Daylight sky, a turning wireframe globe, and a paper plane that flies a dashed route before the postmark lands. */
function t5({ st, tl, gsap, to, ctx }) {
  const rng = rngFrom(55);
  for (let i = 0; i < 7; i++) {
    const c = h('div', 't5-cloud', st);
    const w = 22 + rng() * 26;
    c.style.cssText = `left:${rng() * 80}vw;top:${6 + rng() * 74}vh;width:${w}vw;height:${w * 0.28}vw`;
    tl.fromTo(c, { x: '30vw' }, { x: `${-(40 + rng() * 80)}vw`, ease: 'none', duration: 1 }, 0);
  }
  const merid = 7;
  let ms = '', ls = '';
  for (let k = 0; k < merid; k++) ms += `<ellipse class="mer" cx="50" cy="30" rx="22" ry="22" fill="none" stroke="rgba(246,239,226,.5)" stroke-width=".22"/>`;
  [-60, -30, 0, 30, 60].forEach((a) => { const r = (a * Math.PI) / 180, y = 30 + 22 * Math.sin(r), rx = 22 * Math.cos(r); ls += `<line x1="${50 - rx}" y1="${y}" x2="${50 + rx}" y2="${y}" stroke="rgba(246,239,226,.35)" stroke-width=".2"/>`; });
  const route = 'M6 47 Q50 -16 94 41';
  const v = svg(`
    <g class="globe"><circle cx="50" cy="30" r="22" fill="rgba(11,58,83,.35)" stroke="rgba(246,239,226,.6)" stroke-width=".3"/>${ls}${ms}</g>
    <path d="${route}" fill="none" stroke="rgba(255,178,91,.35)" stroke-width=".35" stroke-dasharray=".9 1.3"/>
    <path class="route" d="${route}" fill="none" stroke="#ffb25b" stroke-width=".55" stroke-linecap="round"/>
    <circle cx="6" cy="47" r="1.1" fill="#ffb25b"/><circle class="dest" cx="94" cy="41" r="1.1" fill="#ffb25b"/>
    <polygon class="plane" points="3,0 -2.6,-2 -1,0 -2.6,2" fill="#f6efe2"/>
  `, 'layer', st, { viewBox: '0 0 100 56', preserveAspectRatio: 'xMidYMid meet' });
  const mers = [...v.querySelectorAll('.mer')], route$ = v.querySelector('.route'), plane = v.querySelector('.plane'), dest = v.querySelector('.dest');
  const len = route$.getTotalLength();
  route$.style.strokeDasharray = len; route$.style.strokeDashoffset = len;
  const stamp = h('div', 't5-stamp', st, `<svg viewBox="0 0 100 100" width="100%" aria-hidden="true">
    <defs><path id="t5c" d="M50 50 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0"/></defs>
    <circle cx="50" cy="50" r="46" fill="none" stroke="#ffb25b" stroke-width="2.2"/><circle cx="50" cy="50" r="27" fill="none" stroke="#ffb25b" stroke-width="1.2"/>
    <text font-family="JetBrains Mono Variable, monospace" font-size="7.6" font-weight="600" fill="#ffb25b" letter-spacing="1"><textPath href="#t5c" textLength="214" lengthAdjust="spacing">TRAVEL WITHOUT BORDERS · LIVE AUG 2026 ·</textPath></text>
    <text x="50" y="56" text-anchor="middle" font-family="JetBrains Mono Variable, monospace" font-size="15" font-weight="700" fill="#ffb25b">LIVE</text></svg>`);
  const state = { th: 0, q: 0 };
  const poseGlobe = () => mers.forEach((m, k) => m.setAttribute('rx', (22 * Math.abs(Math.cos(state.th + (k * Math.PI) / merid))).toFixed(2)));
  const posePlane = () => {
    const a = route$.getPointAtLength(len * state.q), b = route$.getPointAtLength(Math.min(len, len * state.q + 1));
    plane.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${(Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI})`);
  };
  tl.fromTo(st, { backgroundColor: to.from }, { backgroundColor: to.to, ease: 'none', duration: 0.6 }, 0.05)
    .to(state, { th: Math.PI * 1.6, ease: 'none', duration: 1, onUpdate: poseGlobe }, 0)
    .to(state, { q: 1, ease: 'power1.inOut', duration: 0.68, onUpdate: posePlane }, 0.12)
    .fromTo(route$, { strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'power1.inOut', duration: 0.68 }, 0.12)
    .fromTo(dest, { scale: 1, svgOrigin: '94 41' }, { scale: 3, svgOrigin: '94 41', yoyo: true, repeat: 1, duration: 0.04 }, 0.8)
    .fromTo(stamp, { opacity: 0, scale: 1.6, rotation: -26 }, { opacity: 0.92, scale: 1, rotation: -10, ease: 'power3.in', duration: 0.09 }, 0.84)
    .to(plane, { opacity: 0, duration: 0.05 }, 0.82);
  poseGlobe(); posePlane();
  return { ownsBg: true };
}

/* ---------------------------------------------------------------- 6 · Travel → Road
   Landing: dusk sky gives way to tarmac in perspective, learner plates flash past, headlights come on. */
function t6({ st, tl, to }) {
  const sun = h('div', 't6-sun', st);
  const ground = h('div', 't6-ground', st);
  const road = h('div', 't6-road', ground);
  const dash = h('div', 't6-dash', road);
  const beam = h('div', 't6-beam', st);
  tl.fromTo(st, { backgroundColor: to.from }, { backgroundColor: to.to, duration: 0.55 }, 0.05)
    .fromTo(sun, { y: '-6vh', opacity: 0 }, { y: '4vh', opacity: 0.95, duration: 0.3, ease: 'power1.out' }, 0)
    .to(sun, { y: '16vh', opacity: 0, duration: 0.5, ease: 'power1.in' }, 0.4)
    .fromTo(ground, { yPercent: 100 }, { yPercent: 0, ease: 'power3.out', duration: 0.3 }, 0.02)
    .fromTo(dash, { backgroundPositionY: '0vh' }, { backgroundPositionY: '420vh', ease: 'power1.in', duration: 0.96 }, 0.04)
    .fromTo(beam, { opacity: 0 }, { opacity: 0.5, duration: 0.2 }, 0.5);
  [[0.1, -1, 58], [0.3, 1, 64], [0.5, -1, 70], [0.64, 1, 56]].forEach(([at, side, spread]) => {
    const s = h('div', 't6-sign', st, 'L');
    tl.fromTo(s, { x: side * 1.5 + 'vw', y: '0vh', scale: 0.1, opacity: 0 }, { x: side * spread + 'vw', y: '46vh', scale: 1.9, opacity: 1, ease: 'power2.in', duration: 0.34 }, at)
      .to(s, { opacity: 0, duration: 0.02 }, at + 0.32);
  });
  return { ownsBg: true, cap: (p) => Math.round(p * 70) + ' mph' };
}

/* ---------------------------------------------------------------- 7 · Road → Dashboard
   Bauhaus primitives fly in and assemble; a pale field irises open behind them; then everything is swept away. */
function t7({ st, tl }) {
  const light = h('div', 't7-light', st);
  const shapes = [
    { css: 'left:10%;top:16%;width:34vmin;height:34vmin;background:#d6201a;border-radius:50%', from: [-70, -60, -160], out: [-90, -40, -120] },
    { css: 'left:54%;top:12%;width:28vmin;height:28vmin;background:#1b3fb8', from: [64, -70, 200], out: [90, -60, 160] },
    { css: 'left:26%;top:50%;width:36vmin;height:32vmin;background:#f2b705;clip-path:polygon(50% 0,100% 100%,0 100%)', from: [-52, 70, -140], out: [-80, 80, -90] },
    { css: 'left:62%;top:56%;width:32vmin;height:16vmin;background:#111;border-radius:100% 100% 0 0', from: [72, 60, 120], out: [90, 70, 90] },
    { css: 'left:80%;top:34%;width:9vmin;height:9vmin;background:#1b3fb8;border-radius:50%', from: [60, 0, 0], out: [90, -20, 0] },
    { css: 'left:46%;top:38%;width:8vmin;height:8vmin;background:#d6201a', from: [0, -64, 180], out: [10, -90, 240] },
  ].map((o, i) => {
    const e = h('div', 't7-sh', st); e.style.cssText += ';' + o.css;
    tl.fromTo(e, { x: o.from[0] + 'vw', y: o.from[1] + 'vh', rotation: o.from[2] }, { x: '0vw', y: '0vh', rotation: 0, ease: 'power3.out', duration: 0.36 }, 0.03 + i * 0.05)
      .to(e, { x: o.out[0] + 'vw', y: o.out[1] + 'vh', rotation: o.out[2], ease: 'power2.in', duration: 0.3 }, 0.7);
    return e;
  });
  const bar = h('div', 't7-sh', st); bar.style.cssText += ';left:8%;top:47%;width:84%;height:2.6vmin;background:#111';
  tl.fromTo(light, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(78% at 50% 50%)', ease: 'power2.inOut', duration: 0.34 }, 0.34)
    .fromTo(bar, { scaleX: 0.02, rotation: -38 }, { scaleX: 1, rotation: -6, ease: 'power3.out', duration: 0.4 }, 0.2)
    .to(bar, { x: '110vw', rotation: 14, ease: 'power2.in', duration: 0.26 }, 0.74);
}

/* ---------------------------------------------------------------- 8 · Dashboard → Glass
   The flat page dissolves into soft colour; panes of frosted glass drift across with a refracting lens. */
function t8({ st, tl }) {
  const orbs = h('div', 't8-orbs', st);
  const blob = (css, from, to) => { const b = h('div', 't8-blob', orbs); b.style.cssText += ';' + css; tl.fromTo(b, { x: from[0] + 'vw', y: from[1] + 'vh' }, { x: to[0] + 'vw', y: to[1] + 'vh', ease: 'none', duration: 1 }, 0); return b; };
  const bl = [
    blob('left:-10%;top:-8%;width:64vmax;height:64vmax;background:radial-gradient(closest-side,#7a45ff,rgba(122,69,255,0))', [-8, 8], [16, -10]),
    blob('right:-14%;top:20%;width:56vmax;height:56vmax;background:radial-gradient(closest-side,#8ef0d0,rgba(142,240,208,0))', [10, 14], [-22, -8]),
    blob('left:20%;bottom:-24%;width:60vmax;height:60vmax;background:radial-gradient(closest-side,#ff5fa8,rgba(255,95,168,0))', [-12, 10], [16, -14]),
  ];
  const panes = [
    { css: 'left:8%;top:14%;width:38vw;height:54vh;', a: [0, 80, -9], b: [-6, -86, -2] },
    { css: 'left:46%;top:34%;width:30vw;height:42vh;', a: [10, 110, 8], b: [4, -96, 1] },
    { css: 'left:68%;top:8%;width:24vw;height:32vh;', a: [14, 60, -5], b: [10, -110, 3] },
  ].map((o) => { const e = h('div', 't8-pane', st); e.style.cssText += ';' + o.css; tl.fromTo(e, { x: o.a[0] + 'vw', y: o.a[1] + 'vh', rotation: o.a[2] }, { x: o.b[0] + 'vw', y: o.b[1] + 'vh', rotation: o.b[2], ease: 'power1.inOut', duration: 0.98 }, 0.01); return e; });
  const lens = h('div', 't8-lens', st);
  tl.fromTo(orbs, { opacity: 0 }, { opacity: 1, ease: 'power1.inOut', duration: 0.5 }, 0.06)
    .fromTo(lens, { x: '-30vw', y: '-10vh' }, { x: '130vw', y: '12vh', ease: 'power1.inOut', duration: 0.85 }, 0.08)
    .to(bl, { opacity: 0.0, duration: 0.14 }, 0.86);
}

/* ---------------------------------------------------------------- 9 · Side projects → Experience
   An ascent: yearly columns climb in steps, then the whole stage rises to cobalt. */
function t9({ st, tl }) {
  const years = [2021, 2022, 2023, 2024, 2025, 2026];
  const stairs = [16, 30, 44, 58, 72, 86];
  years.forEach((y, i) => {
    const c = h('div', 't9-col', st, `<span>${y}</span>`);
    c.style.left = (i * 100) / 6 + '%'; c.style.width = 100 / 6 + 0.12 + '%';
    tl.fromTo(c, { yPercent: 100 }, { yPercent: (104 - stairs[i]) / 1.14, ease: 'power3.out', duration: 0.22 }, 0.05 + i * 0.075)
      .to(c, { yPercent: -11, ease: 'power3.inOut', duration: 0.28 }, 0.58 + (5 - i) * 0.02);
  });
  return { cap: (p) => String(2021 + Math.min(5, Math.floor(p * 6))) };
}

/* ---------------------------------------------------------------- 10 · Skills → Beyond code
   A barbell is loaded plate by plate (the kg total climbs), then the room closes in on the lift. */
function t10({ st, tl, ctx }) {
  const red = h('div', 't10-red', st);
  const rig = h('div', 't10-rig', st);
  h('div', 't10-bar', rig); h('div', 't10-grip', rig);
  const plates = [ // kg, colour, height (vmin), thickness (vmin)
    [25, '#d6201a', 46, 2.6], [25, '#d6201a', 46, 2.6], [20, '#1b4fd6', 46, 2.4], [15, '#f2c200', 40, 2], [10, '#1f9d4a', 33, 1.6], [5, '#f1f1f1', 26, 1.2], [2.5, '#111', 22, 1],
  ];
  const land = plates.map((_, k) => 0.12 + k * 0.07);
  let off = 0;
  plates.forEach(([kg, col, ph, th], k) => {
    [['left', 0], ['right', 0.018]].forEach(([side, delay]) => {
      const e = h('div', 't10-plate', rig);
      e.style.cssText += `;${side}:calc(${side === 'left' ? 28 : 28}vw - ${off + th}vmin);top:calc(50% - ${ph / 2}vmin);width:${th}vmin;height:${ph}vmin;background:${col}`;
      tl.fromTo(e, { y: '-120vh' }, { y: '0vh', ease: 'power2.in', duration: 0.1 }, land[k] + delay - 0.1);
    });
    off += th + 0.25;
  });
  const bar = rig.querySelector('.t10-bar');
  land.forEach((t) => tl.to(bar, { y: '0.7vmin', ease: 'power2.out', duration: 0.014 }, t + 0.02).to(bar, { y: '0vmin', ease: 'power2.in', duration: 0.03 }, t + 0.034));
  tl.fromTo(red, { scaleY: 0.01 }, { scaleY: 1, ease: 'power3.inOut', duration: 0.3 }, 0.64)
    .fromTo(rig, { scale: 1 }, { scale: 1.16, ease: 'power1.in', duration: 0.62 }, 0.38)
    .to(rig, { opacity: 0, duration: 0.1 }, 0.9);
  return {
    cap: (p) => {
      let kg = 20 + 5; // bar + collars
      plates.forEach(([w], k) => { if (p >= land[k] + 0.01) kg += w * 2; });
      return kg + ' kg';
    },
  };
}

/* ---------------------------------------------------------------- 11 · Beyond code → Contact
   Heat: embers climb and a glowing orange front rises, its edge rippling, until the whole screen is lit. */
function t11({ st, tl, ctx }) {
  const rng = rngFrom(111);
  const glow = h('div', 't11-glow', st);
  const wave = svg('<path class="w" d="" fill="#ff7a45"/>', 't11-fill', st, { viewBox: '0 0 1000 1000', preserveAspectRatio: 'none' });
  const wp = wave.querySelector('.w');
  const L = canvasLayer(st, ctx);
  const N = 150;
  const em = Array.from({ length: N }, () => ({ x: rng(), v: 0.5 + rng() * 1.1, d: rng() * 0.22, ph: rng() * 6.28, am: 0.01 + rng() * 0.035, r: 0.8 + rng() * 2.6 }));
  const edge = (p) => {
    const e = eio(clamp((p - 0.22) / 0.68));
    const base = lerp(1070, -60, e), amp = 22 * (1 - e * 0.5);
    let d = `M0 ${base}`;
    for (let x = 0; x <= 1000; x += 20) d += `L${x} ${(base + Math.sin(x * 0.012 + p * 16) * amp + Math.sin(x * 0.031 - p * 11) * amp * 0.5).toFixed(1)}`;
    wp.setAttribute('d', d + 'L1000 1100L0 1100Z');
  };
  const draw = (p) => {
    const { g, size } = L; const W = size.w, H = size.h;
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    const vis = smooth(0.0, 0.12, p) * (1 - smooth(0.82, 1, p));
    if (vis > 0) em.forEach((q) => {
      const y = H * 1.05 - (p * (0.8 + q.v) + q.d) * H * 1.15;
      if (y < -10 || y > H + 10) return;
      const t = clamp(1 - y / H);
      const a = vis * (0.9 - t * 0.5);
      g.fillStyle = `rgba(255,${Math.round(lerp(236, 110, t))},${Math.round(lerp(150, 40, t))},${a})`;
      g.beginPath(); g.arc(q.x * W + Math.sin(p * 9 + q.ph) * q.am * W, y, q.r * (1.1 - t * 0.5), 0, 6.283); g.fill();
    });
    g.globalCompositeOperation = 'source-over';
  };
  ctx.redraw = () => { draw(tl.progress()); edge(tl.progress()); };
  ctx.update.push(draw, edge);
  edge(0); draw(0);
  tl.fromTo(glow, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1.3, ease: 'power1.in', duration: 0.6 }, 0.04).to(glow, { opacity: 0, duration: 0.2 }, 0.8);
}

/* ---------------------------------------------------------------- wiring */
const DEFS = [
  { before: '#about', fn: t1, label: 'Descending → About', ink: ['#ece4d3', '#1d1a14'] },
  { before: '#work', fn: t2, label: 'Indexing → Work', ink: ['#1d1a14', '#f2efe8'] },
  { before: '#forecasting', fn: t3, label: 'Fitting → Forecasting', ink: ['#9a9aa2', '#94aad0'] },
  { before: '#ledger', fn: t4, label: 'Balancing → The Ledger', ink: ['#94aad0', '#0d2a1f'] },
  { before: '#twb', fn: t5, label: 'Departing → Travel Without Borders', ink: ['#0d2a1f', '#f6efe2'] },
  { before: '#drivepro', fn: t6, label: 'On the road → M.G. Drive Pro', ink: ['#f6efe2', '#f4f4f0'] },
  { before: '#dashboard', fn: t7, label: 'Composing → Dashboard', ink: ['#f4f4f0', '#111'] },
  { before: '#more', fn: t8, label: 'Refracting → Side projects', ink: ['#4d4a44', '#c8bcf2'] },
  { before: '#experience', fn: t9, label: 'Climbing → Experience', ink: ['#c8bcf2', '#ffffff'] },
  { before: '#beyond', fn: t10, label: 'Loading → Beyond code', ink: ['#ffffff', '#ecc0b6'] },
  { before: '#contact', fn: t11, label: 'Igniting → Contact', ink: ['#ecc0b6', '#4a2410'] },
];

function bgOf(el) {
  if (!el) return '#0a0b0d';
  const v = getComputedStyle(el).getPropertyValue('--s-bg').trim();
  if (v) return v;
  return '#0a0b0d'; // hero
}

export function initTransitions(gsap, ScrollTrigger) {
  const cleanups = [];
  DEFS.forEach((def) => {
    const next = document.querySelector(def.before);
    if (!next) return;
    const prev = next.previousElementSibling;
    const from = bgOf(prev), to = bgOf(next);
    const seam = h('div', 'seam');
    seam.setAttribute('aria-hidden', 'true');
    const st = h('div', 'seam-stick', seam);
    st.style.backgroundColor = from;
    next.parentNode.insertBefore(seam, next);

    const capEl = h('div', 'seam-cap', st, `<span>${def.label}</span><span class="pct">00</span>`);
    capEl.style.color = def.ink[0];
    const pct = capEl.querySelector('.pct');

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: seam, start: 'top top', end: 'bottom bottom', scrub: 0.4, invalidateOnRefresh: true },
    });
    const ctx = { st, tl, gsap, cap: capEl, to: { from, to }, update: [], cleanups, redraw() {} };
    ctx.ctx = ctx;
    const res = def.fn(ctx) || {};
    if (!res.ownsBg) tl.to(st, { backgroundColor: to, duration: 0.02, ease: 'none' }, 0.98);
    tl.fromTo(capEl, { color: def.ink[0] }, { color: def.ink[1], duration: 0.12, ease: 'none' }, 0.44);
    tl.set({}, {}, 1); // pin the timeline length at exactly 1

    const capFn = res.cap;
    const onUpdate = () => {
      const p = tl.progress();
      pct.textContent = capFn ? capFn(p) : String(Math.round(p * 100)).padStart(2, '0');
      ctx.update.forEach((fn) => fn(p));
    };
    tl.eventCallback('onUpdate', onUpdate);
    onUpdate();
    cleanups.push(() => { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); });
  });
  return () => cleanups.forEach((fn) => { try { fn(); } catch (_) { /* noop */ } });
}
