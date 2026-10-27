/* Preferencias expresamente solicitadas. No registra mensajes ni navegación. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const allowed = {theme: ['dark', 'light'], contrast: ['normal', 'high'], text: ['normal', 'large'], motion: ['system', 'reduced']};
  let selectedTheme = false;
  for (const [key, values] of Object.entries(allowed)) {
    try {
      const value = localStorage.getItem(`jt-${key}`);
      if (values.includes(value)) { root.dataset[key] = value; if (key === 'theme') selectedTheme = true; }
    } catch { /* Almacenamiento bloqueado: se mantienen las opciones de la página. */ }
  }
  if (!selectedTheme) root.dataset.theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
})();
