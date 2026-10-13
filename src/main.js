import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './style.css';
import './scenes.css';
import './transitions.css';
import './views.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis'; // the sole smooth-scroll engine (Locomotive Scroll is deliberately not installed)
import { createHeroScene } from './hero-scene.js';
import { icons } from './icons.js';
import { initTransitions, revealTrigger } from './transitions.js';
import { runLoader } from './loader.js';
import { initViews } from './views.js';

gsap.registerPlugin(ScrollTrigger);

// opening sequence (first visit of a session only); resolves when the hero should start rising
const introReady = runLoader(gsap);

const root = document.documentElement;
// Motion is always on by the site owner's choice.
const reduced = false;
const cleanups = [];

/* ---------- Icons (Solar via Iconify) ---------- */
document.querySelectorAll('[data-icon]').forEach((el) => {
  const body = icons[el.dataset.icon];
  if (body) el.innerHTML = `<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">${body}</svg>`;
});

const yr = document.getElementById('year');
if (yr) yr.textContent = new Date().getFullYear();

/* ---------- Mobile nav ---------- */
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
function setNav(open) {
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.querySelector('.nav-toggle-label').textContent = open ? 'Close' : 'Menu';
}
toggle.addEventListener('click', () => setNav(!nav.classList.contains('open')));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); toggle.focus(); }
});
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });

/* ---------- Split headings into words (accessible name preserved) ---------- */
function splitWords(el) {
  const tmp = el.cloneNode(true);
  tmp.querySelectorAll('br').forEach((b) => b.replaceWith(' '));
  const label = tmp.textContent.replace(/\s+/g, ' ').trim();
  const sr = document.createElement('span');
  sr.className = 'sr';
  sr.textContent = label;
  const vis = document.createElement('span');
  vis.className = 'split';
  vis.setAttribute('aria-hidden', 'true');
  const words = [];

  const walk = (node, parent) => {
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/\s+/).filter(Boolean).forEach((w) => {
          const outer = document.createElement('span');
          outer.className = 'w';
          const inner = document.createElement('span');
          inner.className = 'wi';
          inner.textContent = w;
          outer.appendChild(inner);
          parent.appendChild(outer);
          parent.appendChild(document.createTextNode(' '));
          words.push(inner);
        });
      } else if (n.nodeName === 'BR') {
        parent.appendChild(document.createElement('br'));
      } else if (n.nodeType === 1) {
        const clone = n.cloneNode(false);
        parent.appendChild(clone);
        walk(n, clone);
      }
    });
  };
  walk(el, vis);
  el.textContent = '';
  el.append(sr, vis);
  return words;
}

const headings = [...document.querySelectorAll('[data-split]')];
const splits = new Map(headings.map((h) => [h, splitWords(h)]));

/* ---------- Active nav ---------- */
const navLinks = [...document.querySelectorAll('#nav a[href^="#"]')];
const byId = Object.fromEntries(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
function setActive(id) {
  navLinks.forEach((a) => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
  if (byId[id]) { byId[id].classList.add('active'); byId[id].setAttribute('aria-current', 'location'); }
}

/* ---------- Hero WebGL scene (optional; static poster otherwise) ---------- */
const stage = document.querySelector('.hero-stage');
let scene = null;
{
  scene = createHeroScene({
    stage,
    canvas: stage.querySelector('.hero-canvas'),
    onFail: () => { stage.classList.remove('gl-on'); },
    variant: 'network',
  });
  if (scene) {
    stage.classList.add('gl-on');
    cleanups.push(scene.destroy);
  }
}

/* ---------- Video: optional YouTube (privacy-enhanced) facade; falls back to the local file ---------- */
const reel = document.querySelector('.reel[data-youtube]');
const ytId = reel && reel.dataset.youtube.trim();
if (ytId && /^[\w-]{6,20}$/.test(ytId)) {
  const video = reel.querySelector('video');
  const poster = video.getAttribute('poster');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'yt-facade';
  btn.setAttribute('aria-label', 'Play video: ' + video.getAttribute('aria-label'));
  btn.style.backgroundImage = `url("${poster}")`;
  btn.innerHTML = '<span class="yt-play" aria-hidden="true"></span>';
  btn.addEventListener('click', () => {
    // YouTube refuses embeds with no web origin (error 153), e.g. when the page is opened straight from disk.
    if (location.protocol === 'file:') { window.open(`https://youtu.be/${ytId}`, '_blank', 'noopener'); return; }
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    f.title = video.getAttribute('aria-label');
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.className = 'yt-frame';
    btn.replaceWith(f);
  });
  video.replaceWith(btn);
}

{
  /* ---------- Lenis <-> GSAP ScrollTrigger ---------- */
  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  cleanups.push(() => { gsap.ticker.remove(tick); lenis.destroy(); });

  // Scroll transitions between sections (DOM is inserted before any other ScrollTrigger is measured)
  cleanups.push(initTransitions(gsap, ScrollTrigger));

  // The scrollbar comes and goes (loader, case studies and the 404 pause scrolling) and that changes the page width without a window resize.
  // Every transition copies live text positions, so re-measure whenever the usable width changes (else the copy sits a few px off and snaps at hand-over).
  {
    const de = document.documentElement;
    let lastW = de.clientWidth, t = 0;
    const ro = new ResizeObserver(() => {
      const w = de.clientWidth;
      if (w === lastW) return;
      lastW = w;
      clearTimeout(t);
      t = setTimeout(() => ScrollTrigger.refresh(), 60);
    });
    ro.observe(de);
    cleanups.push(() => { clearTimeout(t); ro.disconnect(); });
  }

  // Anchor links go through Lenis so there is a single scroll controller.
  const onAnchor = (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (hash.startsWith('#/')) return; // case-study / 404 routes are handled by views.js
    const target = hash === '#top' ? 0 : document.querySelector(hash);
    if (target === null) return;
    e.preventDefault();
    // A section that follows a transition is landed on just past the end of that transition (not on the section's own top, which sits
    // a little short of it), so the stage has fully handed over and its text cannot show through on top of the live section.
    const seam = target !== 0 && target.previousElementSibling && target.previousElementSibling.classList.contains('seam') ? target.previousElementSibling : null;
    const y = seam ? Math.round(seam.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + Math.max(32, window.innerHeight * 0.05)) : target;
    lenis.scrollTo(y, { offset: 0, duration: 1.4 });
    if (hash !== '#top') history.replaceState(null, '', hash);
  };
  document.addEventListener('click', onAnchor);
  cleanups.push(() => document.removeEventListener('click', onAnchor));

  // Page progress hairline
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.2 } });

  // Nav spy: every scene declares which nav item it belongs to (read from live positions, so transitions cannot confuse it)
  const spySecs = [...document.querySelectorAll('[data-nav]')];
  // one read per frame, after every ScrollTrigger write of that frame (no per-event layout thrash)
  let lastY = -1;
  const spy = () => {
    const y = window.scrollY;
    if (y === lastY) return;
    lastY = y;
    const line = window.innerHeight * 0.55;
    let cur = null;
    spySecs.forEach((sec) => { const r = sec.getBoundingClientRect(); if (r.top <= line && r.bottom > line) cur = sec; });
    if (cur && cur.dataset.nav !== spy.last) { spy.last = cur.dataset.nav; setActive(spy.last); }
  };
  gsap.ticker.add(spy);
  cleanups.push(() => gsap.ticker.remove(spy));
  spy();

  const views = initViews({ gsap, lenis, scrollTo: (sel, immediate) => lenis.scrollTo(document.querySelector(sel), { offset: 0, immediate: !!immediate }) });

  // Hero intro (nav, headline text and CTA stay readable throughout: only transforms / supporting fades)
  const heroWords = splits.get(document.querySelector('.hero h1')) || [];
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' }, paused: true });
  lenis.stop();
  introReady.then(() => { if (!views.isOpen()) lenis.start(); intro.play(); });
  intro
    .from(heroWords, { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.1)
    .from('.hero .eyebrow', { y: 14, autoAlpha: 0, duration: 0.8 }, 0)
    .from('.hero .lede', { y: 24, autoAlpha: 0, duration: 0.9 }, 0.7)
    .from('.hero .actions .btn', { y: 16, duration: 0.8, stagger: 0.08 }, 0.8)
    .from('.hero .hint', { autoAlpha: 0, duration: 0.8 }, 1.2)
    .from('.hero .stats > div', { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 1.0)
    .from('.hero-canvas', { autoAlpha: 0, duration: 1.6, ease: 'power2.out' }, 0.2);

  // Word-by-word heading reveals
  headings.forEach((h) => {
    if (h.closest('.hero') || h.hasAttribute('data-dots')) return;
    if (h.closest('#about')) {
      // About: the heading fades up into place from below, quickly, so the section is readable as soon as it lands
      gsap.from(h, { y: 44, autoAlpha: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: revealTrigger(h) });
      return;
    }
    const words = splits.get(h);
    gsap.from(words, {
      yPercent: 115, duration: 0.95, ease: 'power4.out', stagger: 0.06,
      scrollTrigger: revealTrigger(h),
    });
  });

  // Supporting copy + media
  gsap.utils.toArray('[data-reveal]:not(.shot):not(.wipe)').forEach((el) => {
    gsap.from(el, { y: 32, autoAlpha: 0, duration: el.closest('#about') ? 0.55 : 0.9, ease: 'power3.out', scrollTrigger: revealTrigger(el, 'top 90%') });
  });
  // Media frames wipe open from the top edge while the picture settles (explanatory, seen once)
  gsap.utils.toArray('.shot, .wipe').forEach((el) => {
    const img = el.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger: revealTrigger(el) });
    tl.from(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'power4.out' }, 0);
    if (img) tl.from(img, { scale: 1.06, duration: 1.1, ease: 'power3.out' }, 0);
  });
  gsap.utils.toArray('[data-stagger]').forEach((group) => {
    if (group.closest('.hero')) return;
    gsap.from(group.children, {
      y: 28, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: revealTrigger(group),
    });
  });

  // Beyond code: the lifter rises in front of the calibrated plate as you scroll in; the plate turns slowly
  const stageEl = document.querySelector('.iron-stage');
  if (stageEl) {
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: stageEl, start: 'top 85%', end: 'bottom 35%', scrub: 0.6 } });
    tl.fromTo('.plate', { rotation: -35, scale: 0.9 }, { rotation: 20, scale: 1 }, 0)
      .fromTo('.lifter', { yPercent: 22, scale: 0.9, autoAlpha: 0 }, { yPercent: 0, scale: 1, autoAlpha: 1, ease: 'power2.out' }, 0.05);
  }

  // The one scrubbed sequence: the bars *are* the argument, so they are drawn by scroll.
  const chart = document.querySelector('[data-chart]');
  if (chart) {
    const fills = chart.querySelectorAll('.fill');
    gsap.fromTo(fills, { scaleX: 0 }, {
      scaleX: 1, ease: 'none', stagger: 0.35,
      scrollTrigger: { trigger: chart, start: 'top 80%', end: 'bottom 50%', scrub: 0.6 },
    });
  }

  // Live embeds: inert until activated (so the page can still be scrolled past), interactive while active.
  // Leaves interactive mode when the pointer leaves the frame, or via Done, Escape, or scrolling the frame out of view.
  const setLive = (box, on) => {
    if (!box) return;
    box.classList.toggle('live', on);
    const veil = box.querySelector('.embed-veil');
    if (veil) veil.tabIndex = on ? -1 : 0;
    const f = box.querySelector('iframe');
    if (f) f.tabIndex = on ? 0 : -1;
    if (on && f) { try { f.focus({ preventScroll: true }); } catch (_) { /* noop */ } }
  };
  // keys pressed inside the dashboard never reach this document, so listen for Escape inside it too (same origin).
  // Bound on every load of the frame (a lazy frame starts as about:blank and is replaced when it loads).
  const bindEsc = (box) => {
    const f = box.querySelector('iframe');
    if (!f || f._escBound) return;
    f._escBound = true;
    // let go of the mouse wheel as soon as the pointer actually leaves the frame (the frame element's own leave event, not a bubbled one)
    f.addEventListener('mouseleave', () => { if (box.classList.contains('live')) setLive(box, false); });
    const attach = () => { try { f.contentWindow.document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setLive(box, false); }); } catch (_) { /* noop */ } };
    f.addEventListener('load', attach);
    try { if (f.contentDocument && f.contentDocument.readyState === 'complete' && f.contentWindow.location.href !== 'about:blank') attach(); } catch (_) { /* noop */ }
  };
  const onEmbedActivate = (e) => {
    const veil = e.target.closest && e.target.closest('.embed-veil');
    if (veil) { e.preventDefault(); setLive(veil.closest('.embed'), true); return; }
    const done = e.target.closest && e.target.closest('.embed-exit');
    if (done) setLive(done.closest('.embed'), false);
  };
  const onEmbedKey = (e) => { if (e.key === 'Escape') document.querySelectorAll('.embed.live').forEach((b) => setLive(b, false)); };
  // capture phase on pointerup + click so nothing earlier in the chain can swallow the activation
  document.addEventListener('pointerup', onEmbedActivate, true);
  document.addEventListener('click', onEmbedActivate, true);
  document.addEventListener('keydown', onEmbedKey);
  const embedIO = new IntersectionObserver((ents) => ents.forEach((en) => { if (!en.isIntersecting) setLive(en.target, false); }), { threshold: 0 });
  const watchEmbeds = () => document.querySelectorAll('.embed').forEach((el) => { if (!el._watched) { el._watched = true; embedIO.observe(el); bindEsc(el); } });
  watchEmbeds();
  new MutationObserver(watchEmbeds).observe(document.body, { childList: true, subtree: true });
  cleanups.push(() => { document.removeEventListener('pointerup', onEmbedActivate, true); document.removeEventListener('click', onEmbedActivate, true); document.removeEventListener('keydown', onEmbedKey); embedIO.disconnect(); });

  // Case studies and the 404 rise over the page as hash routes
  cleanups.push(views.destroy);

  // Footer wordmark: letters rise in as it scrolls into view, then react to the pointer
  const fw = document.querySelector('[data-footword]');
  if (fw) {
    const text = fw.textContent;
    fw.textContent = '';
    const letters = [...text].map((ch) => { const sp = document.createElement('span'); if (ch === ' ') sp.className = 'sp'; sp.textContent = ch === ' ' ? '' : ch; fw.appendChild(sp); return sp; });
    // size the wordmark so the whole name always fits its container (any screen width)
    const fit = () => {
      fw.style.fontSize = '100px';
      const w = letters.reduce((sum, l) => sum + l.getBoundingClientRect().width, 0);
      const cw = fw.clientWidth;
      if (w > 0 && cw > 0) fw.style.fontSize = Math.floor((100 * cw / w) * 0.985 * 100) / 100 + 'px';
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    window.addEventListener('resize', fit);
    cleanups.push(() => window.removeEventListener('resize', fit));
    gsap.set(letters, { yPercent: 105 });
    const io = new IntersectionObserver((ents) => {
      if (!ents.some((e) => e.isIntersecting)) return;
      io.disconnect();
      gsap.to(letters, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.035 });
    }, { threshold: 0.15 });
    io.observe(fw);
    cleanups.push(() => io.disconnect());
  }

  // Refresh measurements after fonts and media settle
  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
  cleanups.push(() => ScrollTrigger.getAll().forEach((t) => t.kill()), () => intro.kill());
}

/* ---------- Teardown ---------- */
let torn = false;
function teardown() {
  if (torn) return;
  torn = true;
  cleanups.forEach((fn) => { try { fn(); } catch (_) { /* noop */ } });
}
window.addEventListener('pagehide', teardown);
if (import.meta.hot) import.meta.hot.dispose(teardown);
