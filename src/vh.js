// Height of CSS 100vh (the large viewport on mobile). The seam geometry is built from
// 100vh, so JS must measure the same thing instead of window.innerHeight, which shrinks
// and grows with the mobile browser toolbar.
let probe;
export function vh() {
  if (!probe) {
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100vh;visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
  }
  return probe.offsetHeight || window.innerHeight;
}
