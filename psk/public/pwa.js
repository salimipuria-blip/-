/* Registers the POORS service worker. Fails silently; only on https or localhost. */
(function () {
  try {
    if (!('serviceWorker' in navigator)) return;
    var host = location.hostname;
    var local = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    if (location.protocol !== 'https:' && !local) return;
    var register = function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  } catch (e) { /* silent */ }
})();
