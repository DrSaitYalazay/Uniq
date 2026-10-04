/* Seitenwechsel als Kamerafahrt.
   Jeder Klick auf einen Link: Zoom hinein, Richtung der angeklickten Stelle.
   Zur Startseite und zurück: Zoom heraus.
   1. Browser mit View Transitions zwischen Dokumenten: Übergang über pageswap/pagereveal.
   2. Fällt der Übergang aus (nicht unterstützt, übersprungen, Zeitüberschreitung):
      die neue Seite spielt denselben Zoom selbst ab (html.vt-fb-in / vt-fb-out).
   3. Links auf andere Adressen (Anmelden): die Seite zoomt hinein, dann geht es weiter. */
(function () {
  var KEY = 'uq-vt';
  var html = document.documentElement;
  var hasVT = 'onpagereveal' in window;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isHome = function (p) { return p === '/' || /^\/(de|en)\/?$/.test(p); };
  var read = function () { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  var save = function (d) { try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };
  var drop = function () { try { sessionStorage.removeItem(KEY); } catch (e) {} };
  var navType = function () { var a = window.navigation && navigation.activation; return a ? a.navigationType : ''; };

  var applyVT = function (vt, d) {
    html.style.setProperty('--vt-x', d.x + '%');
    html.style.setProperty('--vt-y', d.y + '%');
    try { vt.types.add(d.t); } catch (e) {}
  };

  // Ersatz-Zoom auf der neuen Seite, wenn kein View-Transition-Übergang stattfindet
  var fallback = function (d) {
    if (reduced) return;
    var cls = d.t === 'zoom-out' ? 'vt-fb-out' : 'vt-fb-in';
    html.style.setProperty('--vt-ox', Math.round(innerWidth / 2) + 'px');
    html.style.setProperty('--vt-oy', Math.round(scrollY + innerHeight * 0.42) + 'px');
    html.classList.add(cls);
    setTimeout(function () { html.classList.remove(cls); }, 1000);
  };

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-anfrage') || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;
    var u = new URL(a.href, location.href);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
    if (u.origin === location.origin && u.pathname === location.pathname) return; // Sprung in der Seite: main.ts
    var r = a.getBoundingClientRect();
    var d = { t: u.origin === location.origin && isHome(u.pathname) ? 'zoom-out' : 'zoom-in', x: Math.round((r.left + r.width / 2) / innerWidth * 100), y: Math.round((r.top + r.height / 2) / innerHeight * 100) };
    if (u.origin === location.origin) save(d);
    if (reduced || (u.origin === location.origin && hasVT)) return;
    // Andere Adresse oder Browser ohne Übergänge: erst hineinzoomen, dann wechseln
    e.preventDefault();
    html.style.setProperty('--vt-ox', Math.round(r.left + r.width / 2) + 'px');
    html.style.setProperty('--vt-oy', Math.round(scrollY + r.top + r.height / 2) + 'px');
    html.classList.add(d.t === 'zoom-out' ? 'vt-leave-out' : 'vt-leave');
    setTimeout(function () { location.href = u.href; }, 520);
  }, true);

  // Zurück aus dem Cache: Ausgangszustand wiederherstellen
  addEventListener('pageshow', function (e) { if (e.persisted) html.classList.remove('vt-leave', 'vt-leave-out'); });

  if (!hasVT) {
    var d0 = read();
    if (d0) { drop(); fallback(d0); }
    return;
  }

  addEventListener('pageswap', function (e) {
    if (!e.viewTransition) return;
    var d = read();
    var nav = e.activation && e.activation.navigationType;
    if (!d || nav === 'traverse') d = { t: nav === 'traverse' || (e.activation && e.activation.entry && isHome(new URL(e.activation.entry.url).pathname)) ? 'zoom-out' : 'zoom-in', x: 50, y: 50 };
    applyVT(e.viewTransition, d);
  });

  addEventListener('pagereveal', function (e) {
    var nav = navType();
    var d = read();
    drop();
    if (nav === 'traverse') d = { t: 'zoom-out', x: 50, y: 50 };
    if (!d && e.viewTransition) d = { t: isHome(location.pathname) ? 'zoom-out' : 'zoom-in', x: 50, y: 50 };
    if (!d) return; // direkter Aufruf ohne Klick: kein Zoom
    if (e.viewTransition) {
      applyVT(e.viewTransition, d);
      // Übergang übersprungen (z. B. Zeitüberschreitung): Zoom trotzdem zeigen
      e.viewTransition.ready.catch(function () { fallback(d); });
    } else {
      fallback(d);
    }
  });
})();
