/* Farbschema: Standard dunkel. Wer „hell“ wählt, behält es (localStorage).
   Läuft synchron im <head>, bevor gezeichnet wird – kein Aufblitzen. */
(function () {
  var html = document.documentElement, t = null;
  try { t = localStorage.getItem('uq-theme'); } catch (e) {}
  var light = t === 'light';
  html.dataset.theme = light ? 'light' : 'dark';
  var m = document.querySelector('meta[name="color-scheme"]'); if (m) m.content = light ? 'light' : 'dark';
  var c = document.querySelector('meta[name="theme-color"]'); if (c) c.content = light ? '#f4f6f8' : '#0a1226';
})();
