/* Behaviour for saved page snapshots shown inside the case studies.
   - Every link or form that would leave the page asks the parent window to show the "visit the live site" dialog.
   - Flickity-style carousels (arrows + dots) are re-wired, because the site's own scripts are not part of the snapshot. */
(function () {
  var live = document.documentElement.getAttribute('data-live') || '';
  function tell(href, label) { try { parent.postMessage({ type: 'site-link', href: href || live, label: label || '' }, '*'); } catch (e) {} }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href');
    if (!h || h === '#' || /^javascript:/i.test(h)) { e.preventDefault(); return; }
    if (h.charAt(0) === '#') { var id = decodeURIComponent(h.slice(1)); if (!id || document.getElementById(id)) return; }
    e.preventDefault(); e.stopPropagation();
    tell(a.href, (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60));
  }, true);
  document.addEventListener('submit', function (e) { e.preventDefault(); tell(live, ''); }, true);

  function opt(el, key) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      for (var i = 0; i < n.attributes.length; i++) {
        var v = n.attributes[i].value;
        if (v.indexOf(key) > -1) { var m = new RegExp('"' + key + '"\\s*:\\s*("?)([^",}]+)\\1').exec(v); if (m) return m[2]; }
      }
    }
    return null;
  }
  [].forEach.call(document.querySelectorAll('.flickity-enabled'), function (f) {
    var vp = f.querySelector('.flickity-viewport'), sl = f.querySelector('.flickity-slider');
    if (!vp || !sl) return;
    var cells = [].slice.call(sl.children).filter(function (c) { return c.nodeType === 1; });
    if (cells.length < 2) return;
    var center = opt(f, 'cellAlign') === 'center', wrap = opt(f, 'wrapAround') === 'true';
    var idx = Math.max(0, cells.findIndex(function (c) { return c.classList.contains('is-selected'); }));
    var prev = f.querySelector('.flickity-prev-next-button.previous'), next = f.querySelector('.flickity-prev-next-button.next');
    var dots = [].slice.call(f.querySelectorAll('.flickity-page-dots .dot'));
    function pos(k) {
      var c = cells[k], x = center ? c.offsetLeft - (vp.clientWidth - c.offsetWidth) / 2 : c.offsetLeft;
      if (!wrap) { var last = cells[cells.length - 1]; x = Math.max(0, Math.min(x, last.offsetLeft + last.offsetWidth - vp.clientWidth)); }
      return x;
    }
    function show(k, animate) {
      if (wrap) k = (k + cells.length) % cells.length; else k = Math.max(0, Math.min(cells.length - 1, k));
      idx = k;
      if (wrap) {
        /* endless loop: every card sits at its circular distance from the selected one, so the strip never runs out */
        var n = cells.length, stride = cells[1].offsetLeft - cells[0].offsetLeft || cells[0].offsetWidth, mid = (vp.clientWidth - cells[0].offsetWidth) / 2;
        sl.style.transition = 'none'; sl.style.left = '0px'; sl.style.transform = 'none';
        cells.forEach(function (c, j) {
          var d = (((j - k + n / 2) % n) + n) % n - n / 2; if (d === -n / 2 && n % 2 === 0) d = n / 2 * (j > k ? -1 : 1);
          var x = mid + d * stride, was = parseFloat(c.dataset.x);
          c.style.transition = (animate && !isNaN(was) && Math.abs(x - was) <= stride * 1.5) ? 'left .6s cubic-bezier(.23,1,.32,1)' : 'none';
          c.style.left = x + 'px'; c.dataset.x = x;
        });
      } else {
        sl.style.transition = animate ? 'transform .6s cubic-bezier(.23,1,.32,1)' : 'none';
        sl.style.left = '0px';
        sl.style.transform = 'translateX(' + (-pos(k)) + 'px)';
      }
      cells.forEach(function (c, j) { c.classList.toggle('is-selected', j === k); if (j === k) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true'); });
      dots.forEach(function (d, j) { d.classList.toggle('is-selected', j === k); });
      if (!wrap) { if (prev) prev.disabled = k === 0; if (next) next.disabled = k >= cells.length - 1 || pos(k) >= pos(cells.length - 1); }
    }
    if (prev) prev.addEventListener('click', function (e) { e.preventDefault(); show(idx - 1, true); });
    if (next) next.addEventListener('click', function (e) { e.preventDefault(); show(idx + 1, true); });
    dots.forEach(function (d, j) { d.addEventListener('click', function (e) { e.preventDefault(); show(j, true); }); });
    f.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(idx - 1, true); else if (e.key === 'ArrowRight') show(idx + 1, true); });
    window.addEventListener('resize', function () { show(idx, false); });
    show(idx, false);
  });
})();
