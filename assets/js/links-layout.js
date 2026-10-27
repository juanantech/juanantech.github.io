/* Ajuste local por altura real. No modifica preferencias ni guarda datos. */
(() => {
  'use strict';
  const page = document.querySelector('.links-page');
  if (!page) return;
  const root = document.documentElement;
  let queued = false;

  function fit() {
    // No compensar la ampliacion elegida por la persona usuaria.
    if (root.dataset.text === 'large') {
      page.dataset.fit = 'comfortable';
      page.style.removeProperty('--links-viewport');
      return;
    }
    if (window.visualViewport && window.visualViewport.scale > 1.05) return;
    const height = Math.floor(Math.min(window.innerHeight, window.visualViewport?.height || window.innerHeight));
    if (height <= 0) return;
    page.style.setProperty('--links-viewport', `${height}px`);
    for (const density of ['comfortable', 'compact', 'tight']) {
      page.dataset.fit = density;
      if (page.getBoundingClientRect().height <= height + 1) break;
    }
    // Si se alcanza el limite de lectura, el documento conserva su scroll normal.
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fit(); });
  }

  window.addEventListener('resize', schedule, {passive: true});
  window.visualViewport?.addEventListener('resize', schedule, {passive: true});
  window.addEventListener('load', schedule, {once: true});
  new MutationObserver(schedule).observe(root, {attributes: true, attributeFilter: ['data-text']});
  if (document.fonts) document.fonts.ready.then(schedule);
  document.querySelectorAll('.links-page img').forEach(image => {
    if (!image.complete) image.addEventListener('load', schedule, {once: true});
  });
  schedule();
})();
