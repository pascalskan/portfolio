/* Scroll transitions: one unique, scrubbed sequence between every pair of sections.
   Each seam = tall block + sticky stage that overlaps the last screen of the previous section (the stage fades in over it)
   and lands on the live next section; a GSAP timeline (duration 1) is scrubbed by the scroll through it. */
import { vh } from './vh.js';
import { geoOrthographic, geoPath, geoGraticule10 } from 'd3-geo';
import land from './land.json';

let gsap_set = (el, v) => Object.assign(el.style, {});
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
    size.dpr = window.innerWidth <= 720 ? 1 : Math.min(window.devicePixelRatio || 1, 1.75); // phones: soft particles do not need the pixels, and a full-screen high-density canvas is what made them hitch
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

function offsetBox(el, root) {
  let x = 0, y = 0, e = el;
  while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/* ---------------------------------------------------------------- 1 · Hero → About
   The hero's loose network of nodes is organised: the nodes drift onto a drafting grid, the diagonal links bend into square
   routes, the page turns to paper, and a route is traced through three milestones: plan, evidence, delivery. */
function t1({ st, tl, ctx }) {
  const rng = rngFrom(17);
  const L = canvasLayer(st, ctx);
  const COLS = 13, ROWS = 7, N = 46;
  const key = [[3, 2], [6, 4], [9, 2]]; // milestone cells
  const cells = [];
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) if (!key.some((k) => k[0] === c && k[1] === r)) cells.push([c, r]);
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  const pts = key.concat(cells.slice(0, N - 3)).map(([c, r], i) => ({ c, r, sx: 0.04 + rng() * 0.92, sy: 0.08 + rng() * 0.84, d: rng(), ph: rng() * 6.28, key: i < 3 }));
  // each node links to its two nearest neighbours while scattered
  const edges = []; const seen = new Set();
  pts.forEach((a, i) => {
    pts.map((b, j) => [j, (a.sx - b.sx) ** 2 + (a.sy - b.sy) ** 2]).filter((q) => q[0] !== i).sort((x, y) => x[1] - y[1]).slice(0, 2).forEach(([j]) => {
      const k = i < j ? i + '-' + j : j + '-' + i;
      if (!seen.has(k)) { seen.add(k); edges.push([i, j]); }
    });
  });
  const labels = ['01 · PLAN', '02 · EVIDENCE', '03 · DELIVERY'];
  const mix = (a, b, t) => `${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))}`;
  const EMBER = [255, 122, 69], LIGHT = [200, 205, 215], INK = [29, 26, 20];
  const draw = (p) => {
    const { g, size } = L; const W = size.w, H = size.h;
    g.clearRect(0, 0, W, H);
    const x0 = W * 0.08, x1 = W * 0.92, y0 = H * 0.17, y1 = H * 0.83;
    const X = (c) => lerp(x0, x1, c / (COLS - 1)), Y = (r) => lerp(y0, y1, r / (ROWS - 1));
    const k = smooth(0.28, 0.62, p); // dark page -> paper page
    // drafting grid and dimension ticks
    const ga = smooth(0.42, 0.78, p);
    if (ga > 0) {
      g.strokeStyle = `rgba(${mix(LIGHT, INK, k)},${0.16 * ga})`; g.lineWidth = 1;
      for (let c = 0; c < COLS; c++) { g.beginPath(); g.moveTo(X(c), y0 - 18); g.lineTo(X(c), y0 - 18 + (y1 - y0 + 36) * ga); g.stroke(); }
      for (let r = 0; r < ROWS; r++) { g.beginPath(); g.moveTo(x0 - 18, Y(r)); g.lineTo(x0 - 18 + (x1 - x0 + 36) * ga, Y(r)); g.stroke(); }
      g.fillStyle = `rgba(${mix(LIGHT, INK, k)},${0.55 * ga})`; g.font = '500 10px "JetBrains Mono Variable", monospace';
      for (let c = 0; c < COLS; c += 2) g.fillText(String(c * 10).padStart(3, '0'), X(c) - 8, y1 + 38);
      for (let r = 0; r < ROWS; r += 2) g.fillText(String(r * 10).padStart(2, '0'), x0 - 40, Y(r) + 3);
    }
    // node positions: scattered (drifting) -> snapped to the grid
    const pos = pts.map((q) => {
      const t = eio(clamp((p - 0.1 - q.d * 0.2) / 0.4));
      const dr = (1 - t) * 14;
      const sx = W * q.sx + Math.sin(p * 6 + q.ph) * dr, sy = H * q.sy + Math.cos(p * 5 + q.ph) * dr;
      return [lerp(sx, X(q.c), t), lerp(sy, Y(q.r), t), t];
    });
    // links: diagonal -> square (elbow routes)
    const et = smooth(0.34, 0.7, p);
    g.lineWidth = 1.2;
    edges.forEach(([i, j]) => {
      const a = pos[i], b = pos[j];
      const ex = lerp((a[0] + b[0]) / 2, b[0], et), ey = lerp((a[1] + b[1]) / 2, a[1], et);
      g.strokeStyle = `rgba(${mix(EMBER, INK, k)},${lerp(0.4, 0.34, k) * smooth(0.0, 0.14, p)})`;
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(ex, ey); g.lineTo(b[0], b[1]); g.stroke();
    });
    // nodes
    pos.forEach((q, i) => {
      g.fillStyle = `rgba(${mix(EMBER, INK, k)},${(0.55 + 0.4 * q[2]) * smooth(0.0, 0.14, p)})`;
      g.beginPath(); g.arc(q[0], q[1], lerp(2.4, 3.6, q[2]), 0, 6.283); g.fill();
    });
    // traced route through the three milestones
    const tr = smooth(0.6, 0.9, p);
    const m = [0, 1, 2].map((i) => [X(pts[i].c), Y(pts[i].r)]);
    const path = [m[0], [m[1][0], m[0][1]], m[1], [m[2][0], m[1][1]], m[2]];
    const lens = []; let total = 0;
    for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); lens.push(l); total += l; }
    if (tr > 0) {
      let rem = total * tr;
      g.strokeStyle = 'rgba(166,58,21,.95)'; g.lineWidth = 3; g.lineJoin = 'round'; g.beginPath(); g.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length && rem > 0; i++) {
        const f = Math.min(1, rem / lens[i - 1]);
        g.lineTo(lerp(path[i - 1][0], path[i][0], f), lerp(path[i - 1][1], path[i][1], f));
        rem -= lens[i - 1];
      }
      g.stroke(); g.lineWidth = 1;
    }
    m.forEach((q, i) => {
      const a = smooth(0.62 + i * 0.09, 0.7 + i * 0.09, p);
      if (a <= 0) return;
      g.strokeStyle = `rgba(166,58,21,${a})`; g.fillStyle = `rgba(236,228,211,${a})`; g.lineWidth = 2.5;
      g.beginPath(); g.arc(q[0], q[1], 5 + 9 * (1 - a) + 4, 0, 6.283); g.fill(); g.stroke(); g.lineWidth = 1;
      g.fillStyle = `rgba(29,26,20,${a})`; g.font = '600 12px "JetBrains Mono Variable", monospace';
      g.fillText(labels[i], q[0] + 16, q[1] - 16 - (1 - a) * 8);
    });
  };
  ctx.redraw = () => draw(tl.progress());
  ctx.update.push(draw);
  draw(0);
  tl.fromTo(st, { backgroundColor: ctx.to.from }, { backgroundColor: ctx.to.to, ease: 'none', duration: 0.3 }, 0.28);
  // once the route is drawn, the plan sinks as the page rises over it
  tl.to(L.c, { y: '22vh', opacity: 0, ease: 'power1.in', duration: 0.24 }, 0.76);
  return { ownsBg: true };
}

/* ---------------------------------------------------------------- 2 · About → Work
   The bars are the real index rows: they slide in already carrying the project titles and land exactly where the page has them. */
function t2({ st, tl, next, ctx, to }) {
  const items = [...next.querySelectorAll('.index-list li')];
  const list = next.querySelector('.index-list');
  const top = h('div', 't2-band', st), bot = h('div', 't2-band', st);
  const rows = items.map((li) => {
    const b = h('div', 't2-band', st);
    const inner = h('div', 't2-inner', b);
    const ol = h('ol', 'index-list', inner);
    const c = li.cloneNode(true);
    c.removeAttribute('data-stagger');
    const a = c.querySelector('a'); a.removeAttribute('href'); a.setAttribute('tabindex', '-1');
    ol.appendChild(c);
    ol.style.cssText = '--s-ink:#f2efe8;--s-mut:#9a9aa2;--s-acc:#ff7a45;--s-line:rgba(255,255,255,.16);color:#f2efe8';
    return { li, b, inner };
  });
  // the section heading rides in on the top band so nothing has to appear at the hand-over
  const h2 = next.querySelector('h2'), sp = h2 && h2.querySelector('.split');
  let h2c = null;
  if (h2) {
    h2c = h('div', h2.className, top, sp ? sp.innerHTML : h2.innerHTML);
    h2c.removeAttribute('data-split'); h2c.style.cssText = 'position:absolute;margin:0;color:#f2efe8';
    h2c.querySelectorAll('.wi').forEach((e) => { e.style.transform = 'none'; });
  }
  const measure = () => {
    const H = st.clientHeight, lr = list.getBoundingClientRect(), nb = offsetBox(list, next);
    if (h2c) { const hb = offsetBox(h2, next); h2c.style.left = hb.x + 'px'; h2c.style.top = hb.y + 'px'; h2c.style.width = hb.w + 'px'; }
    rows.forEach((r) => {
      const bx = offsetBox(r.li, next);
      r.b.style.top = bx.y + 'px'; r.b.style.height = (r.li.offsetHeight + 1) + 'px';
      r.inner.style.left = lr.left + 'px'; r.inner.style.width = lr.width + 'px';
    });
    const lastRow = rows[rows.length - 1], last = offsetBox(lastRow.li, next).y + lastRow.li.offsetHeight;
    top.style.top = '0px'; top.style.height = (offsetBox(rows[0].li, next).y + 1) + 'px';
    bot.style.top = (last + 1) + 'px'; bot.style.height = Math.max(0, H - last) + 'px';
  };
  ctx.refresh.push(measure);
  measure();
  tl.fromTo(top, { yPercent: -101 }, { yPercent: 0, ease: 'power3.out', duration: 0.3 }, 0.02);
  rows.forEach((r, i) => {
    const dir = i % 2 ? 1 : -1;
    tl.fromTo(r.b, { xPercent: dir * 101 }, { xPercent: 0, ease: 'power3.out', duration: 0.3 }, 0.05 + i * 0.045);
  });
  tl.fromTo(bot, { yPercent: 101 }, { yPercent: 0, ease: 'power3.out', duration: 0.3 }, 0.28)
    .fromTo(st, { backgroundColor: to.from }, { backgroundColor: to.to, ease: 'none', duration: 0.12 }, 0.44);
  return { ownsBg: true };
}

/* ---------------------------------------------------------------- 3 · Work → Forecasting
   The Work titles dissolve into dots that lift off the page, settle into a fitted trend with its forecast band,
   then re-form as the letters of the next heading. */
function t3({ st, tl, to, ctx, next }) {
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
  // soft leading edge: as the section rises over the chart, a gradient in the section's own colour rides just above its top edge,
  // so the chart dissolves into the page instead of being sliced off by a hard line
  const edge = h('div', 't3-edge', st);
  edge.style.cssText = `position:absolute;left:0;right:0;top:0;z-index:5;pointer-events:none;will-change:transform;background:linear-gradient(to bottom,rgba(0,0,0,0),${to.to} 78%)`;
  const place = () => {
    const eh = Math.round(vh() * 0.3);
    edge.style.height = eh + 'px';
    const y = Math.round(next.getBoundingClientRect().top);
    edge.style.transform = `translate3d(0,${y - eh}px,0)`;
    edge.style.visibility = y < vh() + 2 && y > -eh ? 'visible' : 'hidden';
  };
  ctx.progFns.push(place);
  ctx.refresh.push(place);
  place();
  // once the chart has finished fitting, it sinks as the section rises over it, so the two read as one movement
  tl.to(L.c, { y: '26vh', opacity: 0, ease: 'power1.in', duration: 0.28 }, 0.72);
  return { ownsBg: true };
}

/* ---------------------------------------------------------------- 4 · Forecasting → Ledger
   Ruled ledger rows fill with paper one after another, figures are entered, and the red margin line is ruled down. */
function t4({ st, tl }) {
  const rng = rngFrom(44);
  const rowsEl = h('div', 't4-rows', st);
  const n = Math.ceil(vh() / 40) + 1;
  const step = 0.5 / n;
  const figs = ['1,036 → 9', '£ 24,180.00', 'Σ 3,412', 'APPROVED', 'R-01 ✓', '1,961 → 399 KB', 'Dr / Cr', '0 overflow', 'TOTAL  ——', '£ 6,075.50'];
  for (let i = 0; i < n; i++) {
    const row = h('div', 't4-row', rowsEl);
    row.style.top = i * 40 + 'px';
    row.style.transformOrigin = i % 2 ? '100% 50%' : '0 50%';
    const at = 0.03 + i * step;
    tl.fromTo(row, { scaleX: 0 }, { scaleX: 1, ease: 'power3.out', duration: 0.22 }, at);
    if (i % 3 === 1 && i < n - 2) {
      const fg = h('div', 't4-fig', rowsEl, figs[(i * 7 + 3) % figs.length]);
      fg.style.top = i * 40 + 'px'; fg.style.left = 14 + rng() * 52 + 'vw';
      tl.fromTo(fg, { opacity: 0, x: 14 }, { opacity: 0.72, x: 0, ease: 'power2.out', duration: 0.1 }, at + 0.14).to(fg, { opacity: 0, duration: 0.1 }, 0.84);
    }
  }
  const mg = h('div', 't4-margin', st);
  tl.fromTo(mg, { scaleY: 0 }, { scaleY: 1, ease: 'power2.inOut', duration: 0.24 }, 0.58);
}

/* ---------------------------------------------------------------- 5 · Ledger → Travel
   Daylight sky, a turning wireframe globe and a paper plane on a dashed route. The postmark lands, the world fades
   slowly and the postmark glides to where it sits on the page. */
function t5({ st, tl, to, ctx, next }) {
  const rng = rngFrom(55);
  const clouds = [];
  for (let i = 0; i < 7; i++) {
    const c = h('div', 't5-cloud', st);
    const w = 22 + rng() * 26;
    c.style.cssText = `left:${rng() * 80}vw;top:${6 + rng() * 74}vh;width:${w}vw;height:${w * 0.28}vw`;
    tl.fromTo(c, { x: '30vw' }, { x: `${-(40 + rng() * 80)}vw`, ease: 'none', duration: 1 }, 0);
    clouds.push(c);
  }
  // a real globe: the world's coastlines on an orthographic sphere that turns as you scroll (canvas, drawn under the route)
  const GL = canvasLayer(st, ctx);
  const proj = geoOrthographic().clipAngle(90).precision(0.6);
  const gpath = geoPath(proj, GL.g);
  const grat = geoGraticule10();
  const state = { th: 0, q: 0 };
  const drawGlobe = () => {
    const { g, size } = GL, W = size.w, H = size.h, u = Math.min(W / 100, H / 56);
    const cx = W / 2, cy = (H - 56 * u) / 2 + 30 * u, R = 22 * u;
    g.clearRect(0, 0, W, H);
    proj.translate([cx, cy]).scale(R).rotate([-(state.th * 180) / Math.PI + 20, -22, 0]);
    // atmosphere
    const halo = g.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.22);
    halo.addColorStop(0, 'rgba(140,215,255,.38)'); halo.addColorStop(1, 'rgba(140,215,255,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(cx, cy, R * 1.22, 0, 6.283); g.fill();
    // ocean
    const sea = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    sea.addColorStop(0, '#2f8fb8'); sea.addColorStop(0.6, '#10638a'); sea.addColorStop(1, '#073a58');
    g.fillStyle = sea; g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.clip();
    g.beginPath(); gpath(grat); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 0.6; g.stroke();
    g.beginPath(); gpath(land); g.fillStyle = '#9fd3a0'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 0.5; g.stroke();
    // terminator: light from the upper left
    const sh = g.createRadialGradient(cx - R * 0.45, cy - R * 0.5, R * 0.25, cx, cy, R * 1.05);
    sh.addColorStop(0, 'rgba(255,255,255,.16)'); sh.addColorStop(0.55, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(2,20,35,.55)');
    g.fillStyle = sh; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    g.restore();
    g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.stroke();
  };
  ctx.redraw = drawGlobe;
  const route = 'M6 47 Q50 -16 94 41';
  const v = svg(`
    <path d="${route}" fill="none" stroke="rgba(254,215,0,.4)" stroke-width=".35" stroke-dasharray=".9 1.3"/>
    <path class="route" d="${route}" fill="none" stroke="#fed700" stroke-width=".55" stroke-linecap="round"/>
    <circle cx="6" cy="47" r="1.1" fill="#fed700"/><circle class="dest" cx="94" cy="41" r="1.1" fill="#fed700"/>
    <path class="plane" d="M4.4 0 C4 -.55 3 -.6 2.2 -.6 L-.5 -4.4 L-1.9 -4.4 L-.8 -.7 L-2.9 -.6 L-3.6 -1.9 L-4.6 -1.9 L-4 0 L-4.6 1.9 L-3.6 1.9 L-2.9 .6 L-.8 .7 L-1.9 4.4 L-.5 4.4 L2.2 .6 C3 .6 4 .55 4.4 0 Z" fill="#ffffff" stroke="rgba(3,44,66,.35)" stroke-width=".18"/>
  `, 'layer', st, { viewBox: '0 0 100 56', preserveAspectRatio: 'xMidYMid meet' });
  const route$ = v.querySelector('.route'), plane = v.querySelector('.plane'), dest = v.querySelector('.dest');
  const len = route$.getTotalLength();
  route$.style.strokeDasharray = len; route$.style.strokeDashoffset = len;

  // the very same postmark as the page's, lifted onto the stage
  const real = next.querySelector('.postmark');
  const stamp = real.cloneNode(true);
  stamp.classList.add('t5-stamp');
  stamp.innerHTML = stamp.innerHTML.replace(/pm-c/g, 'pm-c2');
  stamp.style.color = '#fed700';
  // the stamp lives in a fixed overlay above the sections, so it stays visible while the real section rises under it,
  // and settles downwards onto exactly where the page's own postmark sits; the real one is shown the moment it lands
  const ov = h('div', 't5-ov', document.body);
  ov.style.cssText = 'position:fixed;inset:0;z-index:60;pointer-events:none;visibility:hidden';
  stamp.style.position = 'absolute'; stamp.style.margin = '0';
  ov.appendChild(stamp);
  real.style.visibility = 'hidden';
  ctx.cleanups.push(() => { ov.remove(); real.style.visibility = ''; });
  ctx.progFns.push((m) => {
    const on = m > 0.001 && m < 0.992;
    ov.style.visibility = on ? 'visible' : 'hidden';
    real.style.visibility = on ? 'hidden' : '';
  });
  const M = { x: 0, y: 0, w: 1, dx: 0, dy: 0, sA: 1.2 };
  const S = { a: 0, g: 0 };
  const pose = () => {
    const sc = lerp(lerp(M.sA * 1.7, M.sA, S.a), 1, S.g);
    gsap_set(stamp, { x: lerp(M.dx, 0, S.g), y: lerp(M.dy, 0, S.g), scale: sc, rotation: lerp(lerp(-28, -10, S.a), -10, S.g), opacity: S.a });
  };
  const measure = () => {
    const b = offsetBox(real, next), W = st.clientWidth, H = st.clientHeight;
    M.w = b.w; stamp.style.left = b.x + 'px'; stamp.style.top = b.y + 'px'; stamp.style.width = b.w + 'px';
    const mobile = W < 720;
    M.dx = (mobile ? 0.62 : 0.74) * W - (b.x + b.w / 2); M.dy = 0.23 * H - (b.y + b.w / 2); // hovers high on the screen, then descends onto the page's own postmark
    M.sA = Math.min(1.5, Math.max(1, (mobile ? 0.34 : 0.19) * W / b.w));
    pose();
  };
  ctx.refresh.push(measure);
  const posePlane = () => {
    const a = route$.getPointAtLength(len * state.q), b = route$.getPointAtLength(Math.min(len, len * state.q + 1));
    plane.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${(Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI}) scale(.85)`);
  };
  tl.fromTo(st, { backgroundColor: to.from }, { backgroundColor: to.to, ease: 'none', duration: 0.55 }, 0.05)
    .to(state, { th: Math.PI * 1.6, ease: 'none', duration: 1, onUpdate: drawGlobe }, 0)
    .to(state, { q: 1, ease: 'power1.inOut', duration: 0.6, onUpdate: posePlane }, 0.1)
    .fromTo(route$, { strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'power1.inOut', duration: 0.6 }, 0.1)
    .fromTo(dest, { scale: 1, svgOrigin: '94 41' }, { scale: 3, svgOrigin: '94 41', yoyo: true, repeat: 1, duration: 0.04 }, 0.7)
    .to(plane, { opacity: 0, duration: 0.05 }, 0.7)
    .to(S, { a: 1, ease: 'power3.in', duration: 0.09, onUpdate: pose }, 0.72)
    ;
  if (ctx.master) {
    // as the section rises, the world rises with it and the stamp comes down onto the page
    ctx.master.to(S, { g: 1, ease: 'power2.inOut', duration: 0.255, onUpdate: pose, immediateRender: false }, ctx.core + 0.02)
      .to([v, GL.c].concat(clouds), { y: '-34vh', opacity: 0, ease: 'power1.in', duration: 0.26, immediateRender: false }, ctx.core);
  }
  drawGlobe(); posePlane(); measure();
  return { ownsBg: true };
}

/* ---------------------------------------------------------------- 6 · Travel → Drive Pro
   A learner plate drops in, settles, then lifts away upwards while the Drive Pro section fades in beneath it. */
function t6({ st, tl, to }) {
  const drop = h('div', 't6-drop', st);
  const card = h('div', 't6-card', drop, '<div class="t6-face t6-l"><b>L</b></div>');
  tl.fromTo(drop, { y: '-70vh', rotation: -9 }, { y: '0vh', rotation: 0, ease: 'power3.out', duration: 0.24 }, 0.03)
    .fromTo(st, { backgroundColor: to.from }, { backgroundColor: to.to, ease: 'none', duration: 0.3 }, 0.34)
    .to(drop, { y: '-85vh', rotation: 6, ease: 'power2.in', duration: 0.36 }, 0.56);
  return { ownsBg: true, cap: () => 'Learner' };
}

/* ---------------------------------------------------------------- 7 · Drive Pro → Dashboard
   A chart draws itself on the dark while a pale page sweeps across; then the bars lift away, the grid and ring slide off
   to the right, the trend line follows its own slope up and to the right and the numbers fade, as the real section rises in. */
function chartMarkup(ink) {
  const bars = [16, 23, 19, 30, 26, 38, 33, 45, 40, 50, 44, 54];
  const cols = ['#d6201a', '#1b3fb8', '#f2b705'];
  let g = '';
  for (let i = 0; i < 6; i++) g += `<line class="gl" x1="12" x2="120" y1="${14 + i * 12}" y2="${14 + i * 12}" stroke="${ink}" stroke-opacity=".28" stroke-width=".3"/>`;
  bars.forEach((hh, i) => { g += `<rect class="br" x="${14 + i * 8.6}" y="${74 - hh}" width="5.6" height="${hh}" fill="${cols[i % 3]}"/>`; });
  const pts = bars.map((hh, i) => `${16.8 + i * 8.6},${74 - hh - 8}`).join(' ');
  g += '<g class="trend">';
  g += `<polyline class="ln" points="${pts}" pathLength="1" fill="none" stroke="${ink}" stroke-width=".9" stroke-linejoin="round" stroke-linecap="round"/>`;
  bars.forEach((hh, i) => { g += `<circle class="mk" cx="${16.8 + i * 8.6}" cy="${74 - hh - 8}" r="1.3" fill="#f2b705" stroke="${ink}" stroke-width=".4"/>`; });
  g += '</g>';
  ['00', '05', '10', '15', '20'].forEach((y, i) => { g += `<text class="tx" x="${16.8 + i * 21.5}" y="81" font-family="JetBrains Mono Variable, monospace" font-size="2.6" fill="${ink}" fill-opacity=".7" text-anchor="middle">${y}</text>`; });
  const seg = [[0, 40, '#d6201a'], [40, 35, '#1b3fb8'], [75, 25, '#f2b705']];
  g += '<g class="dnw"><g transform="rotate(-90 140 38)">' + seg.map(([a, l, c]) => `<circle class="rg" data-a="${a}" data-l="${l}" cx="140" cy="38" r="12" fill="none" stroke="${c}" stroke-width="6" pathLength="100" stroke-dasharray="0 100" stroke-dashoffset="${-a}"/>`).join('') + '</g></g>';
  g += `<text class="ct tx" x="140" y="39.4" font-family="JetBrains Mono Variable, monospace" font-size="4" font-weight="600" fill="${ink}" text-anchor="middle">100</text>`;
  return g;
}
function t7({ st, tl: main, gsap }) {
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  tl.timeScale(1 / 0.9);
  main.add(tl, 0.1); // hold the dark stage for a beat before the chart starts
  const mk = (ink, parent) => svg(chartMarkup(ink), 'layer', parent, { viewBox: '0 0 160 90', preserveAspectRatio: 'xMidYMid meet' });
  const dark = mk('#ffffff', st);
  const light = h('div', 't7-light', st);
  const lightSvg = mk('#111111', light);
  const scan = h('div', 't7-scan', st);
  const both = (sel) => [...dark.querySelectorAll(sel), ...lightSvg.querySelectorAll(sel)];
  const lt = (sel) => [...lightSvg.querySelectorAll(sel)];
  gsap.set(both('.gl'), { scaleX: 0, transformOrigin: '0% 50%' });
  gsap.set(both('.br'), { scaleY: 0.02, transformOrigin: '50% 100%' });
  gsap.set(both('.mk'), { scale: 0.01, transformOrigin: '50% 50%' });
  gsap.set(both('.ct'), { opacity: 0 });
  gsap.set(scan, { opacity: 0 });
  tl.set(scan, { opacity: 1 }, 0.44).to(both('.ct'), { opacity: 1, duration: 0.08 }, 0.44)
    .fromTo(both('.gl'), { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, ease: 'power2.out', duration: 0.12, stagger: 0.018 }, 0.02)
    .fromTo(both('.br'), { scaleY: 0.02, transformOrigin: '50% 100%' }, { scaleY: 1, ease: 'power3.out', duration: 0.18, stagger: 0.018 }, 0.08)
    .fromTo(both('.ln'), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'power1.inOut', duration: 0.22 }, 0.32)
    .fromTo(both('.mk'), { scale: 0.01, transformOrigin: '50% 50%' }, { scale: 1, ease: 'back.out(2)', duration: 0.08, stagger: 0.016 }, 0.34)
    .fromTo(light, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'power2.inOut', duration: 0.26 }, 0.44)
    .fromTo(scan, { left: '0%' }, { left: '100%', ease: 'power2.inOut', duration: 0.26 }, 0.44)
    .to(scan, { opacity: 0, duration: 0.02 }, 0.7);
  both('.rg').forEach((c) => { const o = { v: 0 }, L = +c.dataset.l; tl.to(o, { v: L, ease: 'power2.out', duration: 0.24 , onUpdate: () => c.setAttribute('stroke-dasharray', `${o.v} 100`) }, 0.26); });
  // exit, in the direction each part points, while the real section rises over the stage
  tl.to(lt('.tx'), { opacity: 0, ease: 'power1.inOut', duration: 0.12 }, 0.7)
    .to(lt('.br'), { y: -120, ease: 'power2.in', duration: 0.22, stagger: 0.008 }, 0.72)
    .to(lt('.gl'), { x: 230, ease: 'power2.in', duration: 0.24, stagger: 0.01 }, 0.74)
    .to(lt('.dnw'), { x: 230, ease: 'power2.in', duration: 0.24 }, 0.75)
    .to(lt('.trend'), { x: 120, y: -80, ease: 'power2.in', duration: 0.26 }, 0.73);
}

/* ---------------------------------------------------------------- 8 · Dashboard → Glass
   The flat page dissolves into soft colour; panes of frosted glass drift across, then two of them grow into the real cards. */
function t8({ st, tl, next, ctx }) {
  const orbs = h('div', 't8-orbs', st);
  const blob = (css, from, to) => { const b = h('div', 't8-blob', orbs); b.style.cssText += ';' + css; tl.fromTo(b, { x: from[0] + 'vw', y: from[1] + 'vh' }, { x: to[0] + 'vw', y: to[1] + 'vh', ease: 'none', duration: 1 }, 0); return b; };
  const bl = [
    blob('left:-10%;top:-8%;width:64vmax;height:64vmax;background:radial-gradient(closest-side,#7a45ff,rgba(122,69,255,0))', [-8, 8], [16, -10]),
    blob('right:-14%;top:20%;width:56vmax;height:56vmax;background:radial-gradient(closest-side,#8ef0d0,rgba(142,240,208,0))', [10, 14], [-22, -8]),
    blob('left:20%;bottom:-24%;width:60vmax;height:60vmax;background:radial-gradient(closest-side,#ff5fa8,rgba(255,95,168,0))', [-12, 10], [16, -14]),
  ];
  const defs = [
    { f: [0.08, 0.14, 0.38, 0.54], a: [0, 80, -9], b: [-6, -30, -2] },
    { f: [0.46, 0.34, 0.3, 0.42], a: [10, 110, 8], b: [4, -20, 1] },
    { f: [0.68, 0.08, 0.24, 0.32], a: [14, 60, -5], b: [10, -110, 3] },
  ];
  const panes = defs.map((o) => h('div', 't8-pane', st));
  const sheet = h('i', '', panes[1]); sheet.style.cssText = 'position:absolute;inset:0;border-radius:inherit;background:#f7fbf8;opacity:0';
  const cards = [...next.querySelectorAll('.mini')];
  const geo = defs.map(() => ({ s: null, t: null }));
  const measure = () => {
    const W = st.clientWidth, H = st.clientHeight;
    defs.forEach((o, i) => { geo[i].s = [o.f[0] * W, o.f[1] * H, o.f[2] * W, o.f[3] * H]; });
    cards.slice(0, 2).forEach((c, i) => { const b = offsetBox(c, next); geo[i].t = [b.x, b.y, b.w, b.h]; });
    place();
  };
  const M = { m: 0 };
  const place = () => {
    panes.forEach((e, i) => {
      const s = geo[i].s; if (!s) return;
      const t = geo[i].t, m = t ? M.m : 0, q = t ? t : s;
      e.style.left = lerp(s[0], q[0], m) + 'px'; e.style.top = lerp(s[1], q[1], m) + 'px';
      e.style.width = lerp(s[2], q[2], m) + 'px'; e.style.height = lerp(s[3], q[3], m) + 'px';
      e.style.borderRadius = lerp(28, 32, m) + 'px';
    });
  };
  panes.forEach((e, i) => {
    const o = defs[i];
    tl.fromTo(e, { x: o.a[0] + 'vw', y: o.a[1] + 'vh', rotation: o.a[2] }, { x: o.b[0] + 'vw', y: o.b[1] + 'vh', rotation: o.b[2], ease: 'power1.inOut', duration: 0.64 }, 0.01);
  });
  const lens = h('div', 't8-lens', st);
  tl.to(panes.slice(0, 2), { x: 0, y: 0, rotation: 0, ease: 'power2.inOut', duration: 0.26 }, 0.66)
    .to(M, { m: 1, ease: 'power2.inOut', duration: 0.26, onUpdate: place }, 0.66)
    .to(sheet, { opacity: 1, duration: 0.14 }, 0.78)
    .to(panes[2], { opacity: 0, duration: 0.2 }, 0.7)
    .fromTo(orbs, { opacity: 0 }, { opacity: 1, ease: 'power1.inOut', duration: 0.5 }, 0.06)
    .fromTo(lens, { x: '-30vw', y: '-10vh' }, { x: '130vw', y: '12vh', ease: 'power1.inOut', duration: 0.7 }, 0.08)
    .to(lens, { opacity: 0, duration: 0.08 }, 0.7)
    .to(bl, { opacity: 0, ease: 'power1.inOut', duration: 0.2 }, 0.78);
  ctx.refresh.push(measure);
  measure();
}

/* ---------------------------------------------------------------- 9 · Side projects → Experience
   A playhead scrubs a career timeline (supervisor role since 2025, regular site worker before that); the stage turns cobalt and the real section rises over it. */
function t9({ st, tl, to }) {
  const PY = 60, Y0 = 2021, END = 5.8; // vw per year, first year, years travelled
  const rail = h('div', 't9-rail', st);
  h('div', 't9-line', rail);
  for (let q = -4; q <= 31; q++) { const t = h('i', 't9-tick' + (q % 4 === 0 ? ' maj' : ''), rail); t.style.left = (q / 4) * PY + 'vw'; }
  for (let y = 0; y <= 7; y++) { const e = h('b', 't9-year', rail, String(Y0 + y)); e.style.left = y * PY + 'vw'; }
  [
    [2021, 'Site worker', 'Residential renovation · regular worker, 2021 – 2025', 'up'],
    [2025, 'Site Supervisor', 'Supervisor role given in 2025', 'down'],
    [2026.32, 'BSc Computer Science', 'Newcastle University · Graduated 2026', 'up'],
    [2026.62, 'Freelance Web Developer', 'Travel Without Borders · M.G. Drive Pro', 'down'],
  ].forEach(([y, t, sub, pos]) => { const n = h('div', 't9-node ' + pos, rail, `<i></i><div><b>${t}</b><span>${sub}</span></div>`); n.style.left = (y - Y0) * PY + 'vw'; });
  const head = h('div', 't9-head', st);
  const big = h('div', 't9-big', st, [...String(Y0)].map((d) => `<span>${d}</span>`).join(''));
  const last = big.lastElementChild; // only the final digit ever changes, so the rest of the year never moves
  const state = { u: 0 };
  const year = () => Math.min(2026, Math.floor(Y0 + state.u * END));
  tl.to(rail, { x: `${-END * PY}vw`, ease: 'power1.inOut', duration: 0.8, onUpdate: function () { state.u = this.progress(); last.textContent = String(year()).slice(-1); } }, 0.04)
    .fromTo(st, { backgroundColor: to.from }, { backgroundColor: to.to, ease: 'none', duration: 0.5 }, 0.1)
    .to([head, big], { opacity: 0, ease: 'power1.inOut', duration: 0.1 }, 0.84)
    .to(rail, { opacity: 0, ease: 'power1.inOut', duration: 0.1 }, 0.86);
  return { cap: () => String(year()), ownsBg: true };
}

/* ---------------------------------------------------------------- 10 · Skills → Beyond code
   The bar rolls up from deep in the page with one plate a side already on, then is loaded plate by plate (the kg total climbs)
   while it stays perfectly still; the room closes in on the lift. */
function t10({ st, tl }) {
  const red = h('div', 't10-red', st);
  red.style.visibility = 'hidden';
  const roll = h('div', 't10-roll', st);
  const rig = h('div', 't10-rig', roll);
  h('div', 't10-floor', rig); h('div', 't10-bar', rig); h('div', 't10-grip', rig);
  const plates = [ // kg, colour, height (vmin), thickness (vmin)
    [25, '#d6201a', 46, 2.6], [20, '#1b4fd6', 46, 2.4], [15, '#f2c200', 40, 2], [10, '#1f9d4a', 33, 1.6], [5, '#f1f1f1', 26, 1.2], [2.5, '#111', 22, 1],
  ];
  const land = plates.map((_, k) => (k === 0 ? 0 : 0.44 + (k - 1) * 0.06));
  let off = 0;
  plates.forEach(([kg, col, ph, th], k) => {
    [['left', -1], ['right', 1]].forEach(([side, dir]) => {
      const e = h('div', 't10-plate', rig);
      e.style.cssText += `;${side}:calc(28vw - ${off + th}vmin);top:calc(50% - ${ph / 2}vmin);width:${th}vmin;height:${ph}vmin;background:${col}`;
      if (k > 0) {
        // hidden until its own slide starts, so nothing sits at the sides while the bar is still small
        const at = land[k] - 0.1 + (dir > 0 ? 0.015 : 0);
        gsap_set(e, { autoAlpha: 0 });
        tl.fromTo(e, { x: dir * 62 + 'vw', autoAlpha: 0 }, { x: '0vw', autoAlpha: 1, ease: 'power3.out', duration: 0.12, immediateRender: false }, at);
        tl.set(e, { autoAlpha: 0 }, at - 0.001);
      }
    });
    off += th + 0.25;
  });
  tl.fromTo(roll, { scale: 0.16, y: '-13vh', opacity: 0 }, { scale: 1, y: '0vh', opacity: 1, ease: 'power2.out', duration: 0.26 }, 0.14)
    .set(red, { autoAlpha: 1 }, 0.74)
    .fromTo(red, { scaleY: 0.01 }, { scaleY: 1, ease: 'power3.inOut', duration: 0.24 }, 0.74)
    .to(roll, { opacity: 0, duration: 0.1 }, 0.9);
  return {
    cap: (p) => {
      let kg = 25; // bar + collars
      plates.forEach(([w], k) => { if (k === 0 || p >= land[k]) kg += w * 2; });
      return kg + ' kg';
    },
  };
}

/* ---------------------------------------------------------------- 11 · Beyond code → Contact
   Heat: embers climb slowly and a glowing orange front rises, its edge rippling, until the whole screen is lit. */
function t11({ st, tl, ctx }) {
  const rng = rngFrom(111);
  const glow = h('div', 't11-glow', st);
  const wave = svg('<path class="w" d="" fill="#ff7a45"/>', 't11-fill', st, { viewBox: '0 0 1000 1000', preserveAspectRatio: 'none' });
  const wp = wave.querySelector('.w');
  const L = canvasLayer(st, ctx);
  const N = window.innerWidth <= 720 ? 70 : 150;
  const em = Array.from({ length: N }, () => ({ x: rng(), v: 0.5 + rng() * 1.1, d: rng() * 0.22, ph: rng() * 6.28, am: 0.01 + rng() * 0.035, r: 0.8 + rng() * 2.6 }));
  const edge = (p) => {
    const e = eio(clamp((p - 0.12) / 0.8));
    const base = lerp(1070, -60, e), amp = 22 * (1 - e * 0.5);
    let d = `M0 ${base}`;
    for (let x = 0; x <= 1000; x += 20) d += `L${x} ${(base + Math.sin(x * 0.012 + p * 12) * amp + Math.sin(x * 0.031 - p * 8) * amp * 0.5).toFixed(1)}`;
    wp.setAttribute('d', d + 'L1000 1100L0 1100Z');
  };
  const draw = (p) => {
    const { g, size } = L; const W = size.w, H = size.h;
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    const vis = smooth(0.0, 0.2, p) * (1 - smooth(0.84, 1, p));
    if (vis > 0) em.forEach((q) => {
      const y = H * 1.05 - (p * (0.8 + q.v) * 0.9 + q.d * 0.8) * H * 1.15;
      if (y < -10 || y > H + 10) return;
      const t = clamp(1 - y / H);
      const a = vis * (0.9 - t * 0.5);
      g.fillStyle = `rgba(255,${Math.round(lerp(236, 110, t))},${Math.round(lerp(150, 40, t))},${a})`;
      g.beginPath(); g.arc(q.x * W + Math.sin(p * 7 + q.ph) * q.am * W, y, q.r * (1.1 - t * 0.5), 0, 6.283); g.fill();
    });
    g.globalCompositeOperation = 'source-over';
  };
  ctx.redraw = () => { draw(tl.progress()); edge(tl.progress()); };
  ctx.update.push(draw, edge);
  edge(0); draw(0);
  tl.fromTo(glow, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1.3, ease: 'sine.inOut', duration: 0.7 }, 0.04).to(glow, { opacity: 0, ease: 'sine.inOut', duration: 0.24 }, 0.76);
}

/* ---------------------------------------------------------------- wiring */
// T: scroll length in vh, land: where the stage starts to give way to the live section, fade: how long that takes, over: the live section rises over the stage instead
const DEFS = [
  { before: '#about', fn: t1, label: 'Organising → About', ink: ['#8b8d93', '#5a523f'], T: 330, over: true, riseFade: true, core: 0.7 },
  { before: '#work', fn: t2, label: 'Indexing → Work', ink: ['#1d1a14', '#f2efe8'], T: 105, fade: 0.1, lead: [0.26, 0.1], span: 0.58, core: 0.84, land: 0.86 },
  { before: '#forecasting', fn: t3, label: 'Fitting → Forecasting', ink: ['#9a9aa2', '#94aad0'], T: 290, over: true },
  { before: '#ledger', fn: t4, label: 'Balancing → The Ledger', ink: ['#94aad0', '#0d2a1f'], T: 330, over: true, riseFade: true, core: 0.70 },
  { before: '#twb', fn: t5, label: 'Departing → Travel Without Borders', ink: ['#0d2a1f', '#ffffff'], T: 360, over: true, riseFade: true, core: 0.72 },
  { before: '#drivepro', fn: t6, label: 'Learner → M.G. Drive Pro', ink: ['#ffffff', '#fafaf8'], T: 300, over: true, riseFade: true, core: 0.667 },
  { before: '#dashboard', fn: t7, label: 'Charting → Dashboard', ink: ['#fafaf8', '#111'], T: 300, over: true, lead: [0.1, 0.12] },
  { before: '#more', fn: t8, label: 'Refracting → Side projects', ink: ['#4d4a44', '#c8bcf2'], T: 250, land: 0.9, fade: 0.1 },
  { before: '#experience', fn: t9, label: 'Scrubbing → Experience', ink: ['#c8bcf2', '#ffffff'], T: 300, land: 0.88, fade: 0.09 },
  { before: '#beyond', fn: t10, label: 'Loading → Beyond code', ink: ['#ffffff', '#ecc0b6'], T: 360, over: true, lead: [0.14, 0.09], core: 0.72 },
  { before: '#contact', fn: t11, label: 'Igniting → Contact', ink: ['#ecc0b6', '#4a2410'], T: 300, land: 0.88, fade: 0.09, lead: [0.3, 0.12] },
];

function bgOf(el) {
  if (!el) return '#0a0b0d';
  const v = getComputedStyle(el).getPropertyValue('--s-bg').trim();
  return v || '#0a0b0d'; // hero
}

/* Reveal trigger for an element: if it sits in the first screen of a section that follows a transition,
   its entrance is held until the stage starts giving way; otherwise it enters as it scrolls into view. */
export function revealTrigger(el, start = 'top 88%') {
  const sec = el.closest('.scene');
  const seam = sec && sec.previousElementSibling;
  if (seam && seam.classList.contains('seam') && !seam.dataset.over) {
    let y = 0, e = el;
    while (e && e !== sec) { y += e.offsetTop; e = e.offsetParent; }
    if (y < vh() * 0.9) {
      const land = parseFloat(seam.dataset.land || '0.93');
      return { trigger: seam, once: true, start: () => seam.getBoundingClientRect().top + window.scrollY + (land + 0.03) * (seam.offsetHeight - vh()) };
    }
  }
  return { trigger: el, start, once: true };
}

export function initTransitions(gsap, ScrollTrigger) {
  gsap_set = (el, v) => gsap.set(el, v);
  const cleanups = [];
  const refreshFns = [];
  const mobile = window.innerWidth <= 720;
  DEFS.forEach((def, idx) => {
    const next = document.querySelector(def.before);
    if (!next) return;
    const prev = next.previousElementSibling;
    const from = bgOf(prev), to = bgOf(next);
    const progFns = []; // called once per frame while this seam is active (builders that read layout do it here, batched, instead of in their own scroll listeners)
    const seam = h('div', 'seam');
    seam.setAttribute('aria-hidden', 'true');
    seam.style.setProperty('--T', (def.T || 150) * (mobile ? 0.8 : 1) + 'vh');
    seam.style.zIndex = String(10 + idx * 2);
    if (def.over) { seam.dataset.over = '1'; next.style.position = 'relative'; next.style.zIndex = String(11 + idx * 2); }
    else seam.dataset.land = String(def.land || 0.93);
    // backing: the previous section's colour behind the stage for the whole run-out below that section, so a half-faded stage never shows the page behind it
    const back = h('div', 'seam-back', seam);
    back.style.cssText = `position:absolute;left:0;right:0;top:100vh;bottom:0;background:${from}`;
    const st = h('div', 'seam-stick', seam);
    st.style.backgroundColor = from;
    next.parentNode.insertBefore(seam, next);
    if (def.over && def.riseFade) { // soft leading edge so what is on the stage dissolves into the rising section instead of being sliced by a hard line
      const edge = h('div', 'seam-edge', st);
      edge.style.cssText = `position:absolute;left:0;right:0;top:0;z-index:5;pointer-events:none;will-change:transform;background:linear-gradient(to bottom,rgba(0,0,0,0),${to} 78%)`;
      const place = () => {
        const eh = Math.round(vh() * 0.3), y = Math.round(next.getBoundingClientRect().top);
        edge.style.height = eh + 'px';
        edge.style.transform = `translate3d(0,${y - eh}px,0)`;
        edge.style.visibility = y < vh() + 2 && y > -eh ? 'visible' : 'hidden';
      };
      window.addEventListener('scroll', place, { passive: true });
      cleanups.push(() => window.removeEventListener('scroll', place));
      refreshFns.push(place);
      place();
    }
    if (getComputedStyle(next).position === 'static') next.style.position = 'relative';

    const capEl = h('div', 'seam-cap', st, `<span>${def.label}</span><span class="pct">00</span>`);
    capEl.style.color = def.ink[0];
    const pct = capEl.querySelector('.pct');

    // master: scrubbed by scroll. core: the effect (compressed into the first 90%); the rest hands over to the live page.
    let placeFn = null;
    const master = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: seam, start: 'top top', end: () => Math.round(seam.getBoundingClientRect().bottom + window.scrollY - vh()), scrub: true, invalidateOnRefresh: true, onUpdate: (self) => { if (placeFn) placeFn(self.progress); progFns.forEach((f) => f(self.progress)); }, onLeave: () => { if (placeFn) placeFn(1); st.style.visibility = 'hidden'; progFns.forEach((f) => f(1)); }, onEnterBack: () => { st.style.visibility = ''; }, onLeaveBack: () => { if (placeFn) placeFn(0); progFns.forEach((f) => f(0)); } },
    });
    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    const lead = def.lead || [0.18, 0.1];
    master.add(tl, lead[0]); // the previous section's last screen scrolls on for a moment before the stage comes in
    const span = def.span || 1;
    tl.timeScale(span / ((def.core || 0.9) - lead[0])); // the effect (tl 0..span) fills the seam up to `core`; nothing dead after it
    const ctx = { st, tl, gsap, master, progFns, core: def.core || 0.9, next, prev, seam, cap: capEl, to: { from, to }, update: [], refresh: refreshFns, cleanups, redraw() {} };
    ctx.ctx = ctx;
    const res = def.fn(ctx) || {};
    if (!res.ownsBg && res.bg !== 'tween') tl.to(st, { backgroundColor: to, duration: 0.02, ease: 'none' }, 0.98);
    if (res.bg === 'tween') { tl.fromTo(st, { backgroundColor: from }, { backgroundColor: to, duration: 0.7 }, 0.1); }
    tl.set({}, {}, span);

    master.fromTo(capEl, { color: def.ink[0] }, { color: def.ink[1], duration: 0.12, ease: 'none' }, 0.4)
      .fromTo(st, { opacity: 0.001 }, { opacity: 1, ease: 'none', duration: lead[1] }, lead[0]); // 0.001, not 0: the stage is painted before it is needed, so it never has to be rasterised mid-scroll
    master.fromTo(back, { opacity: 1 }, { opacity: 0, ease: 'none', duration: 0.004 }, Math.min(lead[0] + lead[1] + 0.01, def.over ? 1 : (def.land || 0.93) - 0.02));
    if (!def.over) {
      const land = def.land || 0.93, fade = Math.min(def.fade || 0.07, 0.97 - land);
      master.fromTo(st, { opacity: 1 }, { opacity: 0, ease: 'power1.inOut', duration: fade, immediateRender: false }, land);
      // the backing is only needed while the stage is still fading in; once it is opaque the backing goes (otherwise it would tint the stage as it fades out over the live section)
      // (the backing is removed below for every seam)
      // while the stage gives way, hold the live section at its landing position (the stage is opaque before that), so the two line up exactly
      const m0 = Math.max(0.5, land - 0.06);
      const prevScene = seam.previousElementSibling, prevZ = prevScene && prevScene.style.zIndex;
      placeFn = (m) => {
        // measured from the seam itself, so the hold is exact whatever the scroll smoothing is doing
        const nat = seam.getBoundingClientRect().bottom - vh();
        const ny = Math.round(nat); // whole pixels only, so text never sits on a fractional offset (that is what shimmered)
        next.style.transform = m >= m0 && m < 0.999 && ny > 0 ? `translate3d(0, ${-ny}px, 0)` : '';
        // the section before the seam can be raised above this one (it rose over its own seam); once the stage is opaque and handing over,
        // this section must paint over the overlapped end of that one, or a strip of it shows above the heading after landing
        if (prevZ) next.style.zIndex = m >= m0 ? prevZ : '';
      };
      // promote the landing section to its own layer well before the hand-over, so the browser has already painted it
      // (creating a huge layer in the middle of the scroll is what made the end of the transition hitch)
      ScrollTrigger.create({ trigger: seam, start: 'top bottom', end: 'bottom top', onToggle: (self) => { next.style.willChange = self.isActive ? 'transform' : ''; } });
      const clear = () => { next.style.transform = ''; };
      ScrollTrigger.addEventListener('refreshInit', clear);
      cleanups.push(() => ScrollTrigger.removeEventListener('refreshInit', clear));
    }
    master.set({}, {}, 1);

    const capFn = res.cap;
    const onUpdate = () => {
      const p = Math.min(1, tl.progress() ); // tl.progress() is already 0..1 over `span`
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
