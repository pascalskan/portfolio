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
   A camera aperture opens from the dark onto the page: six blades, a viewfinder and a warm bloom. */
function t1({ st, tl, ctx }) {
  h('div', 't1-paper', st);
  const bloom = h('div', 't1-bloom', st);
  const bl = svg('<path class="dk" fill="#0a0b0d" fill-rule="evenodd"/><g class="sm" stroke="rgba(236,235,230,.22)" stroke-width="1.2"><line/><line/><line/><line/><line/><line/></g>', 'layer', st);
  const dk = bl.querySelector('.dk'), lines = [...bl.querySelectorAll('line')];
  const vf = svg(`<g fill="none" stroke="#1d1a14" stroke-width="1.6">
      <path d="M12 20V12H20M88 12H80M88 12V20M12 80V88H20M88 80V88H80" transform="translate(0 0)"/>
      <path class="cx" d="M47 50H53M50 47V53"/></g>
      <rect class="fb" x="42" y="44" width="16" height="12" fill="none" stroke="#a63a15" stroke-width="1.8"/>`, 't1-vf', st, { viewBox: '0 0 100 100', preserveAspectRatio: 'none' });
  const brackets = vf.querySelector('g'), fb = vf.querySelector('.fb');
  const af = h('div', 't1-af', st, 'Focus · locked');
  const draw = (p) => {
    const W = st.clientWidth, H = st.clientHeight, cx = W / 2, cy = H / 2;
    const e = clamp((p - 0.08) / 0.72), rmax = Math.hypot(W, H) * 0.64;
    const R = e <= 0 ? 0 : lerp(16, rmax, Math.pow(eio(e), 1.5));
    const th = lerp(-0.4, 0.8, eio(e));
    bl.setAttribute('viewBox', `0 0 ${W} ${H}`);
    let d = `M0 0H${W}V${H}H0Z`;
    const v = [];
    for (let i = 0; i < 6; i++) v.push([cx + Math.cos(th + (i * Math.PI) / 3) * R, cy + Math.sin(th + (i * Math.PI) / 3) * R]);
    if (R > 0) d += 'M' + v.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z';
    dk.setAttribute('d', d);
    const L = Math.hypot(W, H);
    lines.forEach((ln, i) => {
      const a = v[i], b = v[(i + 1) % 6];
      const dx = a[0] - b[0], dy = a[1] - b[1], n = Math.hypot(dx, dy) || 1;
      ln.setAttribute('x1', a[0]); ln.setAttribute('y1', a[1]);
      ln.setAttribute('x2', a[0] + (dx / n) * L); ln.setAttribute('y2', a[1] + (dy / n) * L);
      ln.style.display = R > 0 ? '' : 'none';
    });
  };
  ctx.update.push(draw);
  draw(0);
  tl.fromTo(bloom, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.1).to(bloom, { opacity: 0, duration: 0.25 }, 0.72)
    .fromTo(brackets, { opacity: 0 }, { opacity: 0.85, duration: 0.2 }, 0.14).to(brackets, { opacity: 0, duration: 0.18 }, 0.74)
    .fromTo(fb, { opacity: 0, scale: 2, svgOrigin: '50 50' }, { opacity: 1, scale: 1, svgOrigin: '50 50', ease: 'power3.out', duration: 0.22 }, 0.22)
    .to(fb, { opacity: 0, duration: 0.15 }, 0.74)
    .fromTo(af, { opacity: 0 }, { opacity: 0.8, duration: 0.1 }, 0.42).to(af, { opacity: 0, duration: 0.14 }, 0.74);
}

/* ---------------------------------------------------------------- 2 · About → Work
   The bars are the real index rows: they slide in carrying the actual project titles and land exactly where the page has them. */
function t2({ st, tl, next, ctx }) {
  const items = [...next.querySelectorAll('.index-list li')];
  const list = next.querySelector('.index-list');
  const top = h('div', 't2-band', st), bot = h('div', 't2-band', st);
  const rows = items.map((li, i) => {
    const b = h('div', 't2-band' + (i === items.length - 1 ? ' last' : ''), st);
    const inner = h('div', 't2-inner', b);
    const ol = h('ol', 'index-list', inner);
    const c = li.cloneNode(true);
    const a = c.querySelector('a'); a.removeAttribute('href'); a.setAttribute('tabindex', '-1');
    ol.appendChild(c);
    ol.style.cssText = '--s-ink:#f2efe8;--s-mut:#9a9aa2;--s-acc:#ff7a45;--s-line:rgba(255,255,255,.16);color:#f2efe8';
    return { li, b, inner };
  });
  const offY = (el) => { let y = 0, e = el; while (e && e !== next) { y += e.offsetTop; e = e.offsetParent; } return y; };
  const measure = () => {
    const H = st.clientHeight, lr = list.getBoundingClientRect();
    rows.forEach((r) => {
      r.b.style.top = offY(r.li) + 'px'; r.b.style.height = r.li.offsetHeight + 'px';
      r.inner.style.left = lr.left + 'px'; r.inner.style.width = lr.width + 'px';
    });
    const first = offY(rows[0].li), last = offY(rows[rows.length - 1].li) + rows[rows.length - 1].li.offsetHeight;
    top.style.top = '0px'; top.style.height = first + 'px';
    bot.style.top = last + 'px'; bot.style.height = Math.max(0, H - last) + 'px';
  };
  ctx.refresh.push(measure);
  measure();
  tl.fromTo(top, { yPercent: -101 }, { yPercent: 0, ease: 'power3.out', duration: 0.34 }, 0.02);
  rows.forEach((r, i) => {
    const dir = i % 2 ? 1 : -1;
    tl.fromTo(r.b, { xPercent: dir * 101 }, { xPercent: 0, ease: 'power3.out', duration: 0.36 }, 0.06 + i * 0.07)
      .fromTo(r.inner, { x: dir * 16 + 'vw' }, { x: '0vw', ease: 'power3.out', duration: 0.62 }, 0.06 + i * 0.07);
  });
  tl.fromTo(bot, { yPercent: 101 }, { yPercent: 0, ease: 'power3.out', duration: 0.34 }, 0.42);
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
   A split-flap board: navy data tiles flip in a wave from the centre to reveal the ledger's paper. */
function t4({ st, tl }) {
  const rng = rngFrom(44);
  const mobile = window.innerWidth < 720;
  const cols = mobile ? 6 : 12, rows = mobile ? 9 : 7;
  const grid = h('div', 't4-grid', st);
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`; grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  const digit = () => String(Math.floor(rng() * 10));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = h('div', 't4-tile', grid, `<div class="t4-flip"><div class="t4-face t4-front"><span>${digit()}</span></div><div class="t4-face t4-back"><span>${digit()}</span></div></div>`);
      const dist = Math.hypot((c + 0.5) / cols - 0.5, (r + 0.5) / rows - 0.5) / 0.71;
      tl.fromTo(t.firstChild, { rotationX: 0 }, { rotationX: -180, ease: 'power2.inOut', duration: 0.2 }, 0.05 + dist * 0.5 + rng() * 0.05);
    }
  }
  tl.to(grid, { '--dg': 0, '--bl': 0, duration: 0.14 }, 0.82);
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
   A chart draws itself on the dark (bars, trend line, ring) while a pale page sweeps across behind a scan line. */
function chartMarkup(ink) {
  const bars = [16, 23, 19, 30, 26, 38, 33, 45, 40, 50, 44, 54];
  const cols = ['#d6201a', '#1b3fb8', '#f2b705'];
  let g = '';
  for (let i = 0; i < 6; i++) g += `<line class="gl" x1="12" x2="120" y1="${14 + i * 12}" y2="${14 + i * 12}" stroke="${ink}" stroke-opacity=".28" stroke-width=".3"/>`;
  bars.forEach((hh, i) => { g += `<rect class="br" x="${14 + i * 8.6}" y="${74 - hh}" width="5.6" height="${hh}" fill="${cols[i % 3]}"/>`; });
  const pts = bars.map((hh, i) => `${16.8 + i * 8.6},${74 - hh - 8}`).join(' ');
  g += `<polyline class="ln" points="${pts}" pathLength="1" fill="none" stroke="${ink}" stroke-width=".9" stroke-linejoin="round" stroke-linecap="round"/>`;
  bars.forEach((hh, i) => { g += `<circle class="mk" cx="${16.8 + i * 8.6}" cy="${74 - hh - 8}" r="1.3" fill="#f2b705" stroke="${ink}" stroke-width=".4"/>`; });
  ['00', '05', '10', '15', '20'].forEach((y, i) => { g += `<text x="${16.8 + i * 21.5}" y="81" font-family="JetBrains Mono Variable, monospace" font-size="2.6" fill="${ink}" fill-opacity=".7" text-anchor="middle">${y}</text>`; });
  const seg = [[0, 40, '#d6201a'], [40, 35, '#1b3fb8'], [75, 25, '#f2b705']];
  g += '<g transform="rotate(-90 140 38)">' + seg.map(([a, l, c]) => `<circle class="rg" data-a="${a}" data-l="${l}" cx="140" cy="38" r="12" fill="none" stroke="${c}" stroke-width="6" pathLength="100" stroke-dasharray="0 100" stroke-dashoffset="${-a}"/>`).join('') + '</g>';
  g += `<text class="ct" x="140" y="39.4" font-family="JetBrains Mono Variable, monospace" font-size="4" font-weight="600" fill="${ink}" text-anchor="middle">100</text>`;
  return g;
}
function t7({ st, tl, gsap }) {
  const mk = (ink, parent) => svg(chartMarkup(ink), 'layer', parent, { viewBox: '0 0 160 90', preserveAspectRatio: 'xMidYMid meet' });
  const dark = mk('#ffffff', st);
  const light = h('div', 't7-light', st);
  const lightSvg = mk('#111111', light);
  const scan = h('div', 't7-scan', st);
  const both = (sel) => [...dark.querySelectorAll(sel), ...lightSvg.querySelectorAll(sel)];
  gsap.set(both('.gl'), { scaleX: 0, transformOrigin: '0% 50%' });
  gsap.set(both('.br'), { scaleY: 0.02, transformOrigin: '50% 100%' });
  gsap.set(both('.mk'), { scale: 0.01, transformOrigin: '50% 50%' });
  gsap.set(both('.ct'), { opacity: 0 });
  tl.to(both('.ct'), { opacity: 1, duration: 0.08 }, 0.52)
    .fromTo(both('.gl'), { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, ease: 'power2.out', duration: 0.14, stagger: 0.02 }, 0.02)
    .fromTo(both('.br'), { scaleY: 0.02, transformOrigin: '50% 100%' }, { scaleY: 1, ease: 'power3.out', duration: 0.2, stagger: 0.02 }, 0.1)
    .fromTo(both('.ln'), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'power1.inOut', duration: 0.26 }, 0.4)
    .fromTo(both('.mk'), { scale: 0.01, transformOrigin: '50% 50%' }, { scale: 1, ease: 'back.out(2)', duration: 0.08, stagger: 0.02 }, 0.42)
    .fromTo(light, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'power2.inOut', duration: 0.3 }, 0.52)
    .fromTo(scan, { left: '0%' }, { left: '100%', ease: 'power2.inOut', duration: 0.3 }, 0.52)
    .to(scan, { opacity: 0, duration: 0.02 }, 0.82);
  both('.rg').forEach((c) => { const o = { v: 0 }, L = +c.dataset.l; tl.to(o, { v: L, ease: 'power2.out', duration: 0.26, onUpdate: () => c.setAttribute('stroke-dasharray', `${o.v} 100`) }, 0.3); });
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
   A playhead scrubs along a career timeline (real roles and dates), the stage turning cobalt as it goes. */
function t9({ st, tl }) {
  const PY = 60, Y0 = 2021, END = 5.6; // vw per year, first year, years travelled
  const rail = h('div', 't9-rail', st);
  h('div', 't9-line', rail);
  for (let q = -4; q <= 29; q++) { const t = h('i', 't9-tick' + (q % 4 === 0 ? ' maj' : ''), rail); t.style.left = (q / 4) * PY + 'vw'; }
  for (let y = 0; y <= 6; y++) { const e = h('b', 't9-year', rail, String(Y0 + y)); e.style.left = y * PY + 'vw'; }
  [[2021, 'Site Supervisor', 'Residential renovation · 2021 – Present', 'up'], [2026.32, 'BSc Computer Science', 'Newcastle University · Graduated 2026', 'down'], [2026.62, 'Freelance Web Developer', '2026 – Present', 'up']]
    .forEach(([y, t, sub, pos]) => { const n = h('div', 't9-node ' + pos, rail, `<i></i><div><b>${t}</b><span>${sub}</span></div>`); n.style.left = (y - Y0) * PY + 'vw'; });
  h('div', 't9-head', st);
  const big = h('div', 't9-big', st, String(Y0));
  const state = { u: 0 };
  const year = () => Math.min(2026, Math.floor(Y0 + state.u * END));
  tl.to(state, { u: 1, ease: 'power1.inOut', duration: 0.92, onUpdate: () => { rail.style.transform = `translate3d(${(-END * PY * state.u).toFixed(2)}vw,0,0)`; big.textContent = String(year()); } }, 0.04);
  return { cap: () => String(year()), bg: 'tween' };
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
  { before: '#about', fn: t1, label: 'Opening → About', ink: ['#ece4d3', '#1d1a14'] },
  { before: '#work', fn: t2, label: 'Indexing → Work', ink: ['#1d1a14', '#f2efe8'] },
  { before: '#forecasting', fn: t3, label: 'Fitting → Forecasting', ink: ['#9a9aa2', '#94aad0'] },
  { before: '#ledger', fn: t4, label: 'Balancing → The Ledger', ink: ['#94aad0', '#0d2a1f'] },
  { before: '#twb', fn: t5, label: 'Departing → Travel Without Borders', ink: ['#0d2a1f', '#f6efe2'] },
  { before: '#drivepro', fn: t6, label: 'On the road → M.G. Drive Pro', ink: ['#f6efe2', '#f4f4f0'] },
  { before: '#dashboard', fn: t7, label: 'Charting → Dashboard', ink: ['#f4f4f0', '#111'] },
  { before: '#more', fn: t8, label: 'Refracting → Side projects', ink: ['#4d4a44', '#c8bcf2'] },
  { before: '#experience', fn: t9, label: 'Scrubbing → Experience', ink: ['#c8bcf2', '#ffffff'] },
  { before: '#beyond', fn: t10, label: 'Loading → Beyond code', ink: ['#ffffff', '#ecc0b6'] },
  { before: '#contact', fn: t11, label: 'Igniting → Contact', ink: ['#ecc0b6', '#4a2410'] },
];

function bgOf(el) {
  if (!el) return '#0a0b0d';
  const v = getComputedStyle(el).getPropertyValue('--s-bg').trim();
  return v || '#0a0b0d'; // hero
}

/* Reveal trigger for an element: if it sits in the first screen of a section that follows a transition,
   its entrance is held until the transition has landed; otherwise it enters as it scrolls into view. */
export function revealTrigger(el, start = 'top 88%') {
  const sec = el.closest('.scene');
  const seam = sec && sec.previousElementSibling;
  if (seam && seam.classList.contains('seam')) {
    let y = 0, e = el;
    while (e && e !== sec) { y += e.offsetTop; e = e.offsetParent; }
    if (y < window.innerHeight * 0.9) {
      return { trigger: seam, once: true, start: () => seam.getBoundingClientRect().bottom + window.scrollY - window.innerHeight - 0.06 * (seam.offsetHeight - window.innerHeight) };
    }
  }
  return { trigger: el, start, once: true };
}

export function initTransitions(gsap, ScrollTrigger) {
  const cleanups = [];
  const refreshFns = [];
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

    // master: scrubbed by scroll. core: the effect (compressed into the first 90%); the last 10% clears the stage onto the live page.
    const master = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: seam, start: 'top top', end: () => 'bottom bottom', scrub: 0.4, invalidateOnRefresh: true },
    });
    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    master.add(tl, 0);
    tl.timeScale(1 / 0.9);
    const ctx = { st, tl, gsap, next, cap: capEl, to: { from, to }, update: [], refresh: refreshFns, cleanups, redraw() {} };
    ctx.ctx = ctx;
    const res = def.fn(ctx) || {};
    if (!res.ownsBg && res.bg !== 'tween') tl.to(st, { backgroundColor: to, duration: 0.02, ease: 'none' }, 0.98);
    if (res.bg === 'tween') { tl.fromTo(st, { backgroundColor: from }, { backgroundColor: to, duration: 0.7 }, 0.1); }
    tl.set({}, {}, 1);

    master.fromTo(capEl, { color: def.ink[0] }, { color: def.ink[1], duration: 0.12, ease: 'none' }, 0.4)
      .fromTo(st, { opacity: 1 }, { opacity: 0, ease: 'power1.inOut', duration: 0.07 }, 0.93);
    master.set({}, {}, 1);

    const capFn = res.cap;
    const onUpdate = () => {
      const p = tl.progress();
      pct.textContent = capFn ? capFn(p) : String(Math.round(p * 100)).padStart(2, '0');
      ctx.update.forEach((fn) => fn(p));
    };
    tl.eventCallback('onUpdate', onUpdate);
    onUpdate();
    cleanups.push(() => { master.scrollTrigger && master.scrollTrigger.kill(); master.kill(); });
  });
  const onRefresh = () => refreshFns.forEach((fn) => fn());
  ScrollTrigger.addEventListener('refresh', onRefresh);
  cleanups.push(() => ScrollTrigger.removeEventListener('refresh', onRefresh));
  return () => cleanups.forEach((fn) => { try { fn(); } catch (_) { /* noop */ } });
}
