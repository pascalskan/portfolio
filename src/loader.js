// Opening sequence: the brand mark assembles as a tiny network (scattered nodes settle, links draw, the orange route lands),
// the counter climbs through Planning → Evidence → Delivery, then the whole panel lifts away to reveal the hero.
// Shown once per browsing session, and never for deep links (a visitor going straight to a section or case study).

const SEEN = 'ps-intro';
const seenBefore = () => { try { return sessionStorage.getItem(SEEN) === '1'; } catch (_) { return false; } };
const markSeen = () => { try { sessionStorage.setItem(SEEN, '1'); } catch (_) { /* noop */ } };

export function runLoader(gsap) {
  const el = document.getElementById('loader');
  if (!el) return Promise.resolve();
  const last = location.pathname.split('/').pop();
  const deep = (location.hash && location.hash !== '#') || (location.protocol !== 'file:' && last && last !== 'index.html');
  const skip = seenBefore() || deep;
  if (skip) { el.remove(); return Promise.resolve(); }

  markSeen();
  document.documentElement.classList.add('is-loading');
  const q = (s) => el.querySelectorAll(s);
  const count = el.querySelector('.ld-count');
  const words = [...q('.ld-words li')];

  const ready = new Promise((res) => {
    const done = () => res();
    const parts = [document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
      document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => window.addEventListener('load', r, { once: true }))];
    Promise.all(parts).then(done, done);
    setTimeout(done, 6000); // never hold the page hostage
  });

  return new Promise((resolve) => {
    const rnd = (a) => (Math.random() * 2 - 1) * a;
    const grey = q('.ld-g');
    const orange = q('.ld-o');
    const links = q('.ld-link');
    links.forEach((l) => { const n = l.getTotalLength(); l.style.strokeDasharray = n; l.style.strokeDashoffset = n; });

    const state = { p: 0 };
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(grey, { x: () => rnd(14), y: () => rnd(14), autoAlpha: 0, scale: 0, transformOrigin: '50% 50%', duration: 0.9, stagger: 0.09 }, 0.1)
      .to(q('.ld-link.grey'), { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut', stagger: 0.12 }, 0.5)
      .fromTo(q('.ld-bar'), { scaleY: 0 }, { scaleY: 1, transformOrigin: '50% 50%', duration: 0.8, ease: 'power4.inOut' }, 0.9)
      .to(q('.ld-link.hot'), { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut', stagger: 0.1 }, 1.4)
      .from(orange, { scale: 0, transformOrigin: '50% 50%', duration: 0.55, ease: 'back.out(2.4)', stagger: 0.1 }, 1.5)
      .to(state, { p: 1, duration: 2.1, ease: 'power1.inOut', onUpdate: () => {
        const v = Math.round(state.p * 100);
        count.textContent = String(v).padStart(3, '0');
        words.forEach((w, i) => w.classList.toggle('on', state.p >= (i + 1) / 3 - 0.02));
      } }, 0.1);

    Promise.all([ready, new Promise((r) => tl.eventCallback('onComplete', r))]).then(() => {
      document.documentElement.classList.remove('is-loading');
      const out = gsap.timeline({ onComplete: () => { el.remove(); } });
      out.to(q('.ld-stage'), { scale: 1.12, autoAlpha: 0, duration: 0.55, ease: 'power2.in' }, 0)
        .to(q('.ld-foot'), { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 0)
        .to(el, { yPercent: -100, duration: 1.0, ease: 'power4.inOut' }, 0.3)
        .add(() => resolve(), 0.55); // the hero starts rising while the panel is still lifting
    });
  });
}
