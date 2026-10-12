import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './style.css';
import './scenes.css';
import './transitions.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis'; // the sole smooth-scroll engine (Locomotive Scroll is deliberately not installed)
import { createHeroScene } from './hero-scene.js';
import { icons } from './icons.js';
import { initTransitions, revealTrigger } from './transitions.js';

gsap.registerPlugin(ScrollTrigger);

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

  // Anchor links go through Lenis so there is a single scroll controller.
  const onAnchor = (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    const target = hash === '#top' ? 0 : document.querySelector(hash);
    if (target === null) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    if (hash !== '#top') history.replaceState(null, '', hash);
  };
  document.addEventListener('click', onAnchor);
  cleanups.push(() => document.removeEventListener('click', onAnchor));

  // Page progress hairline
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.2 } });

  // Nav spy: every scene declares which nav item it belongs to (read from live positions, so transitions cannot confuse it)
  const spySecs = [...document.querySelectorAll('[data-nav]')];
  const spy = () => {
    const line = window.innerHeight * 0.55;
    let cur = null;
    spySecs.forEach((sec) => { const r = sec.getBoundingClientRect(); if (r.top <= line && r.bottom > line) cur = sec; });
    if (cur && cur.dataset.nav !== spy.last) { spy.last = cur.dataset.nav; setActive(spy.last); }
  };
  window.addEventListener('scroll', spy, { passive: true });
  cleanups.push(() => window.removeEventListener('scroll', spy));
  spy();

  // Hero intro (nav, headline text and CTA stay readable throughout: only transforms / supporting fades)
  const heroWords = splits.get(document.querySelector('.hero h1')) || [];
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  intro
    .from(heroWords, { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.1)
    .from('.hero .eyebrow', { y: 14, autoAlpha: 0, duration: 0.8 }, 0)
    .from('.hero .lede', { y: 24, autoAlpha: 0, duration: 0.9 }, 0.7)
    .from('.hero .actions .btn', { y: 16, duration: 0.8, stagger: 0.08 }, 0.8)
    .from('.hero .hint', { autoAlpha: 0, duration: 0.8 }, 1.2)
    .from('.hero .stats > div', { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 1.0)
    .from('.hero-canvas', { autoAlpha: 0, duration: 1.6, ease: 'power2.out' }, 0.2);

  // Hero -> About: the hero stays pinned (its bottom edge locks to the viewport if it is taller than the screen) while About slides up over it,
  // and the hero dims and settles back slightly as it is covered
  const heroEl = document.querySelector('.hero');
  const pinHero = () => { heroEl.style.top = Math.min(0, window.innerHeight - heroEl.offsetHeight) + 'px'; };
  pinHero();
  window.addEventListener('resize', pinHero);
  ScrollTrigger.addEventListener('refreshInit', pinHero);
  gsap.to('.hero-inner, .hero-stage', { opacity: 0.25, ease: 'none', scrollTrigger: { trigger: '#about', start: 'top 90%', end: 'top 10%', scrub: true } });
  gsap.to('.hero-inner', { y: -30, scale: 0.97, transformOrigin: '50% 100%', ease: 'none', scrollTrigger: { trigger: '#about', start: 'top 90%', end: 'top 10%', scrub: true } });

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
