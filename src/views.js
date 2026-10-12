import { CASES, CASE_ORDER } from './cases.js';

// Full-screen "views" (case studies and the 404) that rise over the page.
// They are hash routes (#/case/<id>, any other #/… is a 404) so the site still works from disk and on any static host.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ARROW_L = '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false"><path d="M19 12H5m0 0l6-6m-6 6l6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW_R = '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false"><path d="M5 12h14m0 0l-6-6m6 6l-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW_UR = '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false"><path d="M7 17L17 7m0 0H8m9 0v9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function caseHTML(id) {
  const c = CASES[id];
  const i = CASE_ORDER.indexOf(id);
  const next = CASES[CASE_ORDER[(i + 1) % CASE_ORDER.length]];
  const nextId = CASE_ORDER[(i + 1) % CASE_ORDER.length];
  const flow = c.flow ? `<ol class="v-flow v-rise" aria-label="Pipeline">${c.flow.map(([t, hl]) => `<li${hl ? ' class="hl"' : ''}>${esc(t)}</li>`).join('')}</ol>` : '';
  const bars = c.bars ? `<figure class="v-bars v-rise"><figcaption>${esc(c.bars.caption)}</figcaption>${c.bars.rows.map((r) => `<div class="v-bar"><span>${esc(r.label)}</span><span class="v-track" role="img" aria-label="${esc(r.label)}: ${esc(r.val)}"><i class="${r.warn ? 'warn' : ''}" style="--w:${r.w}%"></i></span><b>${esc(r.val)}</b></div>`).join('')}<p>${esc(c.bars.note)}</p></figure>` : '';
  const shot = c.shot ? `<figure class="v-shot v-rise"><div class="v-shot-bar" aria-hidden="true"><i></i><i></i><i></i></div><img src="${esc(c.shot.src)}" alt="${esc(c.shot.alt)}" width="1600" height="1000" decoding="async"></figure>` : '';
  const sections = c.sections.map((s) => `<section class="v-sec v-rise"><h3>${esc(s.h)}</h3><ul>${s.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>`).join('');
  const links = c.links.map((l) => `<a class="v-link" href="${esc(l.href)}" rel="noopener noreferrer">${esc(l.label)}${ARROW_UR}</a>`).join('');
  return `
  <div class="v-wrap">
    <div class="v-top v-rise">
      <button type="button" class="v-back" data-close>${ARROW_L}<span>Back to work</span></button>
      <span class="v-count" aria-label="Case study ${i + 1} of ${CASE_ORDER.length}">${esc(c.n)} / 0${CASE_ORDER.length}</span>
    </div>
    <p class="v-kicker v-rise">${esc(c.meta)}</p>
    <h1 class="v-title v-rise" id="v-title">${esc(c.title)}</h1>
    <p class="v-lede v-rise">${c.lede}</p>
    <dl class="v-facts v-rise">${c.facts.map((f) => `<div><dt>${esc(f.l)}</dt><dd>${esc(f.n)}</dd></div>`).join('')}</dl>
    <div class="v-body">
      <div class="v-main">${flow}${bars}${sections}${shot}</div>
      <aside class="v-side v-rise" aria-label="Details">
        <h3>Built with</h3>
        <ul class="v-tags">${c.stack.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        ${links ? `<h3>Links</h3><div class="v-links">${links}</div>` : ''}
      </aside>
    </div>
    <a class="v-next v-rise" href="#/case/${nextId}" style="--n-bg:${next.theme.bg};--n-ink:${next.theme.ink};--n-acc:${next.theme.acc}" data-style="${next.theme.style}">
      <span class="v-next-k">Next case study · ${esc(next.n)}</span>
      <span class="v-next-t">${esc(next.title)}</span>
      <span class="v-next-a" aria-hidden="true">${ARROW_R}</span>
    </a>
  </div>`;
}

function notFoundHTML(what) {
  // an ordinary graph the visitor can read: a route that runs out one hop short of its destination
  return `
  <div class="v-wrap nf-wrap">
    <div class="nf-art v-rise" aria-hidden="true">
      <svg viewBox="0 0 800 380" focusable="false">
        <g class="nf-grid" stroke="currentColor" stroke-width="1">
          ${[1, 2, 3, 4, 5, 6, 7].map((k) => `<line x1="${k * 100}" y1="0" x2="${k * 100}" y2="380"/>`).join('')}
          ${[1, 2, 3].map((k) => `<line x1="0" y1="${k * 95}" x2="800" y2="${k * 95}"/>`).join('')}
        </g>
        <g class="nf-dim" fill="currentColor">
          <circle cx="100" cy="285" r="5"/><circle cx="300" cy="95" r="5"/><circle cx="500" cy="285" r="5"/><circle cx="700" cy="95" r="5"/><circle cx="700" cy="285" r="5"/><circle cx="200" cy="190" r="5"/>
        </g>
        <path class="nf-route" d="M100 285 H200 V190 H300 V95 H500" fill="none" stroke="#ff7a45" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter"/>
        <path class="nf-gap" d="M500 95 H700" fill="none" stroke="#ff7a45" stroke-width="2" stroke-dasharray="3 9" stroke-linecap="round"/>
        <g class="nf-nodes" fill="#ff7a45">
          <circle cx="100" cy="285" r="8"/><circle cx="200" cy="190" r="6"/><circle cx="300" cy="95" r="6"/>
        </g>
        <circle class="nf-end" cx="500" cy="95" r="9" fill="#0a0b0d" stroke="#ff7a45" stroke-width="3"/>
        <g class="nf-target"><circle cx="700" cy="95" r="22" fill="none" stroke="#8b8f97" stroke-width="2" stroke-dasharray="4 6"/><text x="700" y="104" text-anchor="middle" font-family="JetBrains Mono Variable, monospace" font-size="26" font-weight="600" fill="#8b8f97">?</text></g>
        <circle class="nf-probe" cx="100" cy="285" r="5" fill="#ecebe6"/>
      </svg>
    </div>
    <p class="v-kicker v-rise">Error · no route</p>
    <h1 class="v-title nf-title v-rise" id="v-title">404<span>.</span> This route runs out here.</h1>
    <p class="v-lede v-rise">There's nothing at <code class="nf-path"></code>. The rest of the site is one hop away.</p>
    <div class="actions v-rise">
      <a class="btn primary" href="${what.home}" data-home>Back to the start${ARROW_R}</a>
      <a class="btn" href="#work" data-home>See the work</a>
    </div>
  </div>`;
}

export function initViews({ gsap, lenis, scrollTo }) {
  const view = document.createElement('div');
  view.className = 'view';
  view.id = 'view';
  view.setAttribute('role', 'dialog');
  view.setAttribute('aria-modal', 'true');
  view.setAttribute('aria-labelledby', 'v-title');
  const scroller = document.createElement('div');
  scroller.className = 'view-scroll';
  scroller.setAttribute('data-lenis-prevent', '');
  scroller.tabIndex = -1;
  view.appendChild(scroller);
  document.body.appendChild(view);

  const inertTargets = () => [document.getElementById('main'), document.querySelector('.site-footer')].filter(Boolean);
  let current = null; // { kind, id }
  let fromApp = false; // reached by clicking an in-page link (so Back returns to the page)
  let returnFocus = null;
  let tween = null;
  let section = 'work';

  const setTheme = (t) => {
    if (!t) { ['bg', 'ink', 'mut', 'acc', 'line'].forEach((k) => view.style.removeProperty('--v-' + k)); view.removeAttribute('data-style'); return; }
    view.style.setProperty('--v-bg', t.bg);
    view.style.setProperty('--v-ink', t.ink);
    view.style.setProperty('--v-mut', t.mut);
    view.style.setProperty('--v-acc', t.acc);
    view.style.setProperty('--v-line', t.line);
    view.dataset.style = t.style;
  };

  function fill(kind, id) {
    if (kind === 'case') {
      const c = CASES[id];
      setTheme(c.theme);
      section = c.section;
      scroller.innerHTML = caseHTML(id);
      document.title = `${c.title} | Pascal Skannavis`;
      // a missing screenshot should leave no empty frame behind
      scroller.querySelectorAll('.v-shot img').forEach((img) => img.addEventListener('error', () => img.closest('.v-shot').remove(), { once: true }));
    } else {
      setTheme({ bg: '#0a0b0d', ink: '#ecebe6', mut: '#8b8f97', acc: '#ff7a45', line: '#22252b', style: 'nf' });
      section = 'top';
      const home = id && id.path ? '/' : '#top';
      scroller.innerHTML = notFoundHTML({ home });
      scroller.querySelector('.nf-path').textContent = id && id.path ? id.path : (location.hash || '#/');
      document.title = 'Page not found | Pascal Skannavis';
    }
    scroller.scrollTop = 0;
  }

  function animateIn(kind) {
    const rise = scroller.querySelectorAll('.v-rise');
    gsap.fromTo(rise, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.06, delay: 0.25, clearProps: 'transform,visibility' });
    gsap.fromTo(scroller.querySelectorAll('.v-track i'), { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power3.out', stagger: 0.18, delay: 0.9 });
    if (kind === '404') animate404();
  }

  function animate404() {
    const q = (s) => scroller.querySelector(s);
    const route = q('.nf-route');
    if (!route) return;
    const len = route.getTotalLength();
    const tl = gsap.timeline({ delay: 0.5 });
    gsap.set(route, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set([q('.nf-nodes'), q('.nf-end'), q('.nf-target'), q('.nf-gap')], { autoAlpha: 0 });
    gsap.set(q('.nf-probe'), { autoAlpha: 0 });
    tl.to(q('.nf-nodes'), { autoAlpha: 1, duration: 0.4 }, 0)
      .to(route, { strokeDashoffset: 0, duration: 1.7, ease: 'power2.inOut' }, 0.1)
      .to(q('.nf-end'), { autoAlpha: 1, duration: 0.3 }, 1.7)
      .to(q('.nf-gap'), { autoAlpha: 1, duration: 0.5 }, 1.9)
      .to(q('.nf-target'), { autoAlpha: 1, duration: 0.5 }, 2.1);
    // the end node keeps trying to reach the destination
    tl.add(() => {
      gsap.to(q('.nf-end'), { scale: 1.35, transformOrigin: '50% 50%', duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.to(q('.nf-gap'), { strokeDashoffset: -24, duration: 1.2, repeat: -1, ease: 'none' });
    }, 2.3);
    view._nfTl = tl;
  }

  function open(kind, id) {
    const key = kind + (kind === 'case' ? ':' + id : ':404');
    if (current && current.key === key) return;
    const wasOpen = !!current;
    current = { kind, id, key };
    if (tween) tween.kill();
    if (wasOpen) {
      // swap content inside the already-open view
      tween = gsap.to(scroller, { autoAlpha: 0, y: -24, duration: 0.25, ease: 'power2.in', onComplete: () => {
        fill(kind, id);
        gsap.set(scroller, { y: 24 });
        gsap.to(scroller, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
        animateIn(kind === 'case' ? 'case' : '404');
      } });
      return;
    }
    returnFocus = document.activeElement;
    fill(kind, id);
    lenis.stop();
    inertTargets().forEach((n) => n.setAttribute('inert', ''));
    view.style.visibility = 'visible';
    gsap.set(scroller, { autoAlpha: 1, y: 0 });
    gsap.set(scroller.querySelectorAll('.v-rise'), { autoAlpha: 0 });
    tween = gsap.fromTo(view, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: 'power4.inOut',
      onComplete: () => { view.style.clipPath = 'none'; scroller.focus({ preventScroll: true }); },
    });
    animateIn(kind === 'case' ? 'case' : '404');
  }

  function finishClose() {
    if (view._nfTl) { view._nfTl.kill(); view._nfTl = null; }
    gsap.killTweensOf(scroller.querySelectorAll('*'));
    view.style.visibility = 'hidden';
    view.style.clipPath = '';
    scroller.innerHTML = '';
    setTheme(null);
    inertTargets().forEach((n) => n.removeAttribute('inert'));
    document.title = baseTitle;
    lenis.start();
    if (returnFocus && returnFocus.focus) { try { returnFocus.focus({ preventScroll: true }); } catch (_) { /* noop */ } }
    returnFocus = null;
  }

  const baseTitle = document.title;

  function close(instant) {
    if (!current) return;
    current = null;
    if (tween) tween.kill();
    if (instant) { finishClose(); return; }
    tween = gsap.to(view, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.75, ease: 'power3.inOut', onComplete: finishClose });
  }

  function route() {
    const h = location.hash;
    const m = h.match(/^#\/case\/([\w-]+)\/?$/);
    if (m && CASES[m[1]]) { open('case', m[1]); return; }
    if (h.startsWith('#/')) { open('404', null); return; }
    if (current) close(false);
  }

  // Close button / Escape: step back through history when we came from the page, otherwise just close
  function requestClose() {
    if (!current) return;
    const sec = section;
    if (fromApp && history.length > 1) { fromApp = false; history.back(); return; }
    const wasNf = current.kind === '404';
    history.replaceState(null, '', location.pathname + location.search + (wasNf || sec === 'top' ? '' : '#' + sec));
    close(false);
    if (!wasNf && sec !== 'top') scrollTo('#' + sec, true);
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (a) { fromApp = true; return; }
    if (e.target.closest('[data-close]')) { requestClose(); return; }
    // header navigation while a view is open: drop the view immediately so the page can scroll
    const nav = e.target.closest('#nav a, .brand, [data-home]');
    if (nav && current) {
      history.replaceState(null, '', location.pathname + location.search);
      close(true);
    }
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) requestClose(); });
  window.addEventListener('hashchange', route);

  // A request for a path that isn't the site (e.g. /nope) lands on the same 404
  const last = location.pathname.split('/').pop();
  const pathMissing = location.protocol !== 'file:' && last && last !== 'index.html';
  if (pathMissing) open('404', { path: location.pathname });
  else route();

  return { isOpen: () => !!current, close, destroy: () => { view.remove(); } };
}
