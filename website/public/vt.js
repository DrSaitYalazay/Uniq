/* Seitenwechsel als Kamerafahrt (View Transitions zwischen Dokumenten).
   Klick auf einen Link: Zoom in Richtung der angeklickten Stelle.
   Zur Startseite oder zurück: Zoom heraus. Ohne Browser-Unterstützung: normaler Wechsel. */
(function () {
  if (!('onpagereveal' in window)) return;
  var KEY = 'uq-vt';
  var isHome = function (p) { return p === '/' || /^\/(de|en)\/?$/.test(p); };
  var read = function () { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  var apply = function (vt, d) {
    var s = document.documentElement.style;
    s.setProperty('--vt-x', d.x + '%');
    s.setProperty('--vt-y', d.y + '%');
    try { vt.types.add(d.t); } catch (e) {}
  };
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.target === '_blank' || a.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.pathname === location.pathname) return;
    var r = a.getBoundingClientRect();
    var d = { t: isHome(u.pathname) ? 'zoom-out' : 'zoom-in', x: Math.round((r.left + r.width / 2) / innerWidth * 100), y: Math.round((r.top + r.height / 2) / innerHeight * 100) };
    try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch (err) {}
  }, true);
  addEventListener('pageswap', function (e) {
    if (!e.viewTransition) return;
    var d = read();
    var nav = e.activation && e.activation.navigationType;
    if (!d || nav === 'traverse') d = { t: nav === 'traverse' || (e.activation && e.activation.entry && isHome(new URL(e.activation.entry.url).pathname)) ? 'zoom-out' : 'zoom-in', x: 50, y: 50 };
    apply(e.viewTransition, d);
  });
  addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    var d = read();
    var nav = window.navigation && navigation.activation && navigation.activation.navigationType;
    if (!d || nav === 'traverse') d = { t: nav === 'traverse' ? 'zoom-out' : (isHome(location.pathname) ? 'zoom-out' : 'zoom-in'), x: 50, y: 50 };
    apply(e.viewTransition, d);
    try { sessionStorage.removeItem(KEY); } catch (err) {}
  });
})();
