/**
 * Hero background (one responsibility): a calm, decorative WebGL field that reacts to the pointer.
 * Three interchangeable treatments, none tied to any single project. The canvas is aria-hidden and
 * subordinate to the DOM; if WebGL fails the static poster stays.
 */
import {
  WebGLRenderer, Scene, OrthographicCamera, BufferGeometry, Float32BufferAttribute, BufferAttribute,
  ShaderMaterial, Points, LineSegments, Mesh, PlaneGeometry, Color, Vector2,
} from 'three';

export const VARIANTS = ['contours', 'network', 'ripple', 'waves', 'aurora', 'halftone'];

const NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return s;
  }
`;

/* 1. Contours: slowly drifting topographic lines that lift around the pointer */
const CONTOUR = {
  vert: /* glsl */ `varying vec2 vP; void main() { vP = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  frag: /* glsl */ `
    precision mediump float;
    uniform float uTime, uAspect;
    uniform vec2 uPointer;
    uniform vec3 uPast, uFuture;
    varying vec2 vP;
    ${NOISE}
    void main() {
      vec2 p = vec2(vP.x * uAspect, vP.y);
      vec2 m = vec2(uPointer.x * uAspect, uPointer.y);
      float d = distance(p, m);
      float h = fbm(p * 0.85 + vec2(uTime * 0.025, -uTime * 0.018));
      h += 0.42 * exp(-d * d * 1.6);
      float v = h * 11.0;
      float w = fwidth(v);
      float a = abs(fract(v) - 0.5);
      float line = 1.0 - smoothstep(w * 0.35, w * 1.1, abs(a - 0.5) );
      float glow = exp(-d * 1.15);
      vec3 col = mix(uPast, uFuture, smoothstep(0.1, 0.9, glow));
      gl_FragColor = vec4(col, line * (0.16 + 0.6 * glow));
    }
  `,
};

/* 2. Ripple: a dot grid that swells in waves, with rings spreading from the pointer */
const RIPPLE_VERT = /* glsl */ `
  attribute vec2 aGrid;
  uniform float uTime, uAspect, uSize;
  uniform vec2 uPointer;
  varying float vHeat;
  varying float vA;
  void main() {
    vec2 p = aGrid;
    float wave = 0.022 * sin(p.x * 5.0 + uTime * 0.5 + p.y * 3.0) + 0.016 * sin(p.x * 11.0 - uTime * 0.7);
    float d = distance(vec2(p.x * uAspect, p.y), vec2(uPointer.x * uAspect, uPointer.y));
    float ring = 0.09 * sin(d * 18.0 - uTime * 2.4) * exp(-d * 1.8);
    float h = wave + ring;
    vHeat = clamp(exp(-d * 2.4) * (0.5 + 4.0 * abs(ring)), 0.0, 1.0);
    vA = 0.4 + 0.6 * vHeat + 3.0 * abs(wave);
    gl_Position = vec4(p.x, p.y + h, 0.0, 1.0);
    gl_PointSize = uSize * (0.9 + 2.2 * vHeat + 18.0 * abs(wave));
  }
`;
const RIPPLE_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uPast, uFuture;
  varying float vHeat;
  varying float vA;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    gl_FragColor = vec4(mix(uPast, uFuture, vHeat), clamp(vA, 0.0, 1.0) * smoothstep(0.5, 0.2, r));
  }
`;

/* 3. Network: nodes drift and link to near neighbours; the pointer is a hub that pulls links in */
const NET_VERT = /* glsl */ `
  attribute vec4 aCol;
  uniform float uSize;
  varying vec4 vCol;
  void main() { vCol = aCol; gl_Position = vec4(position.xy, 0.0, 1.0); gl_PointSize = uSize * aCol.a * 2.2 + 1.0; }
`;
const NET_FRAG = /* glsl */ `
  precision mediump float;
  varying vec4 vCol;
  #ifdef ROUND
  void main() { vec2 c = gl_PointCoord - 0.5; float r = length(c); if (r > 0.5) discard; gl_FragColor = vec4(vCol.rgb, vCol.a * smoothstep(0.5, 0.25, r)); }
  #else
  void main() { gl_FragColor = vCol; }
  #endif
`;


/* 4. Waves: stacked ridge lines that swell under the pointer */
const WAVES_VERT = /* glsl */ `
  attribute vec2 aLine;
  uniform float uTime, uAspect;
  uniform vec2 uPointer;
  varying float vHeat;
  varying float vA;
  void main() {
    float x = aLine.x, r = aLine.y;
    float y0 = mix(-0.8, 0.85, r);
    float w = 0.035 * sin(x * 4.0 + r * 5.0 + uTime * 0.35) + 0.02 * sin(x * 9.0 - r * 3.0 - uTime * 0.5);
    float d = distance(vec2(x * uAspect, y0), vec2(uPointer.x * uAspect, uPointer.y));
    float bump = 0.22 * exp(-d * d * 3.2);
    vHeat = clamp(bump * 5.0, 0.0, 1.0);
    vA = 0.32 + 0.65 * vHeat;
    gl_Position = vec4(x, y0 + w + bump, 0.0, 1.0);
  }
`;
const SIMPLE_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uPast, uFuture;
  varying float vHeat;
  varying float vA;
  void main() { gl_FragColor = vec4(mix(uPast, uFuture, vHeat), vA); }
`;

/* 5. Aurora: soft drifting light that gathers around the pointer */
const AURORA = {
  vert: CONTOUR.vert,
  frag: /* glsl */ `
    precision mediump float;
    uniform float uTime, uAspect;
    uniform vec2 uPointer;
    uniform vec3 uPast, uFuture;
    varying vec2 vP;
    ${NOISE}
    void main() {
      vec2 p = vec2(vP.x * uAspect, vP.y);
      vec2 m = vec2(uPointer.x * uAspect, uPointer.y);
      vec2 q = vec2(fbm(p * 0.7 + uTime * 0.04), fbm(p * 0.7 - uTime * 0.035 + 5.0));
      float f = fbm(p * 0.9 + 2.2 * q);
      float glow = exp(-distance(p, m) * 1.1);
      float band = smoothstep(0.35, 0.8, f);
      vec3 col = mix(uPast * 0.55, uFuture, clamp(band * 0.55 + glow * 0.9, 0.0, 1.0));
      gl_FragColor = vec4(col, 0.1 + 0.5 * band * (0.4 + glow));
    }
  `,
};

/* 6. Halftone: a dot screen whose dots swell with a moving field */
const HALFTONE = {
  vert: CONTOUR.vert,
  frag: /* glsl */ `
    precision mediump float;
    uniform float uTime, uAspect;
    uniform vec2 uPointer;
    uniform vec3 uPast, uFuture;
    varying vec2 vP;
    ${NOISE}
    void main() {
      vec2 p = vec2(vP.x * uAspect, vP.y);
      vec2 m = vec2(uPointer.x * uAspect, uPointer.y);
      float cells = 46.0;
      vec2 g = p * cells;
      vec2 id = floor(g) + 0.5;
      vec2 f = fract(g) - 0.5;
      vec2 cp = id / cells;
      float field = fbm(cp * 0.8 + vec2(uTime * 0.04, 0.0)) + 0.55 * exp(-distance(cp, m) * 1.6);
      float r = clamp(field * 0.62, 0.0, 0.5);
      float aa = 1.5 / cells * 0.5;
      float dotm = 1.0 - smoothstep(r - 0.06, r, length(f));
      float heat = clamp(exp(-distance(cp, m) * 1.5), 0.0, 1.0);
      gl_FragColor = vec4(mix(uPast, uFuture, heat), dotm * (0.3 + 0.6 * heat));
    }
  `,
};

export function createHeroScene({ stage, canvas, onFail, variant = 'contours' }) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!renderer.getContext()) throw new Error('no gl');
  } catch (_) {
    return null;
  }

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const past = new Color('#9a9da4'), future = new Color('#ff7a45');
  const uniforms = {
    uTime: { value: 0 }, uAspect: { value: 1.6 }, uSize: { value: 4 },
    uPointer: { value: new Vector2(0.2, 0.1) }, uPast: { value: past }, uFuture: { value: future },
  };
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let current = null;

  function buildContours() {
    const geometry = new PlaneGeometry(2, 2);
    const material = new ShaderMaterial({ vertexShader: CONTOUR.vert, fragmentShader: CONTOUR.frag, uniforms, transparent: true, depthTest: false, depthWrite: false });
    const object = new Mesh(geometry, material);
    return { object, geometry, material };
  }

  function buildRipple() {
    const cols = coarse ? 56 : 92, rows = coarse ? 26 : 40;
    const g = new Float32Array(cols * rows * 2);
    let k = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { g[k++] = (c / (cols - 1)) * 2 - 1; g[k++] = (r / (rows - 1)) * 2 - 1; }
    const geometry = new BufferGeometry();
    geometry.setAttribute('aGrid', new Float32BufferAttribute(g, 2));
    geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(cols * rows * 3), 3));
    const material = new ShaderMaterial({ vertexShader: RIPPLE_VERT, fragmentShader: RIPPLE_FRAG, uniforms, transparent: true, depthTest: false, depthWrite: false });
    const object = new Points(geometry, material);
    return { object, geometry, material };
  }

  function buildNetwork() {
    const N = coarse ? 46 : 96;
    const MAXL = N * 8;
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * 2 - 1, y: Math.random() * 2 - 1,
      vx: (Math.random() - 0.5) * 0.0009, vy: (Math.random() - 0.5) * 0.0009, ph: Math.random() * 6.28,
    }));
    const pPos = new Float32Array((N + 1) * 3), pCol = new Float32Array((N + 1) * 4);
    const lPos = new Float32Array(MAXL * 2 * 3), lCol = new Float32Array(MAXL * 2 * 4);
    const pg = new BufferGeometry(), lg = new BufferGeometry();
    pg.setAttribute('position', new BufferAttribute(pPos, 3)); pg.setAttribute('aCol', new BufferAttribute(pCol, 4));
    lg.setAttribute('position', new BufferAttribute(lPos, 3)); lg.setAttribute('aCol', new BufferAttribute(lCol, 4));
    lg.setDrawRange(0, 0);
    const pm = new ShaderMaterial({ vertexShader: NET_VERT, fragmentShader: NET_FRAG, uniforms, transparent: true, depthTest: false, depthWrite: false, defines: { ROUND: 1 } });
    const lm = new ShaderMaterial({ vertexShader: NET_VERT, fragmentShader: NET_FRAG, uniforms, transparent: true, depthTest: false, depthWrite: false });
    const pts = new Points(pg, pm), lines = new LineSegments(lg, lm);
    pts.frustumCulled = lines.frustumCulled = false;
    const group = new Scene(); group.add(lines, pts);

    const update = () => {
      const asp = uniforms.uAspect.value, mx = uniforms.uPointer.value.x, my = uniforms.uPointer.value.y, t = uniforms.uTime.value;
      for (let i = 0; i < N; i++) {
        const n = nodes[i];
        n.x += n.vx + Math.sin(t * 0.3 + n.ph) * 0.0004; n.y += n.vy + Math.cos(t * 0.27 + n.ph) * 0.0004;
        const dxm = (mx - n.x) * asp, dym = my - n.y, dm = Math.hypot(dxm, dym);
        if (dm < 0.7 && dm > 0.001) { n.x += (dxm / dm) * 0.0007 / asp; n.y += (dym / dm) * 0.0007; }
        if (n.x > 1.05) n.x = -1.05; else if (n.x < -1.05) n.x = 1.05;
        if (n.y > 1.05) n.y = -1.05; else if (n.y < -1.05) n.y = 1.05;
        pPos[i * 3] = n.x; pPos[i * 3 + 1] = n.y;
        const heat = Math.max(0, 1 - dm / 0.8);
        pCol.set([past.r + (future.r - past.r) * heat, past.g + (future.g - past.g) * heat, past.b + (future.b - past.b) * heat, 0.55 + 0.45 * heat], i * 4);
      }
      pPos[N * 3] = mx; pPos[N * 3 + 1] = my; pCol.set([future.r, future.g, future.b, 0.9], N * 4);
      let L = 0;
      const link = (ax, ay, bx, by, a, hot) => {
        if (L >= MAXL) return;
        const c = hot ? future : past;
        const o = L * 6, oc = L * 8;
        lPos[o] = ax; lPos[o + 1] = ay; lPos[o + 3] = bx; lPos[o + 4] = by;
        lCol.set([c.r, c.g, c.b, a, c.r, c.g, c.b, a], oc);
        L++;
      };
      for (let i = 0; i < N; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < N; j++) {
          const b = nodes[j], d = Math.hypot((a.x - b.x) * asp, a.y - b.y);
          if (d < 0.3) link(a.x, a.y, b.x, b.y, (1 - d / 0.3) * 0.5, false);
        }
        const dm = Math.hypot((a.x - mx) * asp, a.y - my);
        if (dm < 0.42) link(a.x, a.y, mx, my, (1 - dm / 0.42) * 0.8, true);
      }
      lg.setDrawRange(0, L * 2);
      lg.attributes.position.needsUpdate = true; lg.attributes.aCol.needsUpdate = true;
      pg.attributes.position.needsUpdate = true; pg.attributes.aCol.needsUpdate = true;
    };
    return { object: group, geometry: { dispose() { pg.dispose(); lg.dispose(); } }, material: { dispose() { pm.dispose(); lm.dispose(); } }, update };
  }


  function buildFull(frag) {
    const geometry = new PlaneGeometry(2, 2);
    const material = new ShaderMaterial({ vertexShader: CONTOUR.vert, fragmentShader: frag, uniforms, transparent: true, depthTest: false, depthWrite: false });
    return { object: new Mesh(geometry, material), geometry, material };
  }

  function buildWaves() {
    const P = coarse ? 22 : 38, S = 160;
    const a = new Float32Array(P * S * 2 * 2);
    let k = 0;
    for (let r = 0; r < P; r++) for (let j = 0; j < S; j++) for (const t of [j / S, (j + 1) / S]) { a[k++] = t * 2 - 1; a[k++] = r / (P - 1); }
    const geometry = new BufferGeometry();
    geometry.setAttribute('aLine', new Float32BufferAttribute(a, 2));
    geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(P * S * 2 * 3), 3));
    const material = new ShaderMaterial({ vertexShader: WAVES_VERT, fragmentShader: SIMPLE_FRAG, uniforms, transparent: true, depthTest: false, depthWrite: false });
    const object = new LineSegments(geometry, material);
    object.frustumCulled = false;
    return { object, geometry, material };
  }

  function setVariant(name) {
    if (!VARIANTS.includes(name) || (current && current.name === name)) return;
    const next = name === 'ripple' ? buildRipple() : name === 'network' ? buildNetwork() : name === 'waves' ? buildWaves() : name === 'aurora' ? buildFull(AURORA.frag) : name === 'halftone' ? buildFull(HALFTONE.frag) : buildContours();
    next.name = name;
    if (current) { scene.remove(current.object); current.geometry.dispose(); current.material.dispose(); }
    current = next;
    scene.add(next.object);
    if (!running) frame(performance.now());
  }

  let w = 1, h = 1, running = false, raf = 0, destroyed = false, visible = true;
  const target = new Vector2(0.2, 0.1);
  let lastPointer = -1e9;
  const start = performance.now();

  const resize = () => {
    const r = stage.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    uniforms.uAspect.value = w / h;
    uniforms.uSize.value = dpr * Math.max(2.2, Math.min(4.6, h / 230));
    if (!running && current) frame(performance.now());
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  const onPointer = (e) => {
    const r = stage.getBoundingClientRect();
    target.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    lastPointer = performance.now();
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  const onBlur = () => { lastPointer = -1e9; };
  window.addEventListener('blur', onBlur);

  function frame(now) {
    const t = (now - start) / 1000;
    if (now - lastPointer > 2500) target.set(0.35 + 0.45 * Math.sin(t * 0.22), 0.1 + 0.4 * Math.sin(t * 0.17 + 1.2));
    uniforms.uPointer.value.lerp(target, 0.06);
    uniforms.uTime.value = t;
    if (current && current.update) current.update();
    renderer.render(scene, camera);
  }
  function loop(now) { if (!running) return; frame(now); raf = requestAnimationFrame(loop); }
  const play = () => { if (running || destroyed || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(loop); };
  const pause = () => { running = false; cancelAnimationFrame(raf); };

  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? play() : pause(); }, { threshold: 0 });
  io.observe(stage);
  const onVis = () => (document.hidden ? pause() : play());
  document.addEventListener('visibilitychange', onVis);
  const onLost = (e) => { e.preventDefault(); pause(); onFail && onFail(); };
  canvas.addEventListener('webglcontextlost', onLost);

  setVariant(variant);
  resize();
  play();

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    pause();
    ro.disconnect(); io.disconnect();
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVis);
    canvas.removeEventListener('webglcontextlost', onLost);
    if (current) { scene.remove(current.object); current.geometry.dispose(); current.material.dispose(); }
    renderer.dispose();
    renderer.forceContextLoss();
  }
  return { destroy, setVariant };
}
