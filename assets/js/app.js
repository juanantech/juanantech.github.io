/* Interacciones progresivas. Sin dependencias ni analítica. Única petición externa: envío voluntario del formulario de correo (Web3Forms). */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const root = document.documentElement;
  const config = window.JT_CONFIG || {email: '', preview: true};
  const announce = text => { $('#announcement').textContent = text; };
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let explicitTheme = false;
  try { explicitTheme = Boolean(localStorage.getItem('jt-theme')); } catch { /* Sin almacenamiento. */ }

  function remember(key, value) {
    root.dataset[key] = value;
    if (key === 'theme') explicitTheme = true;
    try { localStorage.setItem(`jt-${key}`, value); } catch { /* Solo esta página. */ }
  }
  function syncPreferences() {
    $$('.theme-toggle').forEach(button => {
      button.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
      button.title = button.getAttribute('aria-label');
    });
    for (const [key, enabled] of [['text', 'large'], ['contrast', 'high'], ['motion', 'reduced']]) {
      $$(`[data-preference="${key}"]`).forEach(button => button.setAttribute('aria-pressed', String(root.dataset[key] === enabled)));
    }
  }
  $$('.theme-toggle').forEach(button => button.addEventListener('click', () => {
    remember('theme', root.dataset.theme === 'dark' ? 'light' : 'dark');
    syncPreferences(); announce(`Tema ${root.dataset.theme === 'dark' ? 'oscuro' : 'claro'} seleccionado.`);
  }));
  for (const [key, enabled, disabled, name] of [
    ['text', 'large', 'normal', 'Texto ampliado'],
    ['contrast', 'high', 'normal', 'Contraste alto'],
    ['motion', 'reduced', 'system', 'Menos movimiento'],
  ]) {
    $$(`[data-preference="${key}"]`).forEach(button => button.addEventListener('click', () => {
      remember(key, root.dataset[key] === enabled ? disabled : enabled);
      syncPreferences(); announce(`${name} ${root.dataset[key] === enabled ? 'activado' : 'desactivado'}.`);
    }));
  }
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', event => {
    if (!explicitTheme) { root.dataset.theme = event.matches ? 'light' : 'dark'; syncPreferences(); }
  });
  syncPreferences();

  const accessibilityButton = $('.accessibility-shortcut');
  const accessibilityMenu = $('#accessibility-menu');
  const accessibilityInfoButton = $('#accessibility-info-toggle');
  const accessibilityInfo = $('#accessibility-menu-info');
  function closeAccessibility(restoreFocus = false) {
    if (!accessibilityMenu || !accessibilityButton) return;
    accessibilityMenu.hidden = true;
    accessibilityButton.setAttribute('aria-expanded', 'false');
    accessibilityButton.setAttribute('aria-label', 'Abrir ajustes de accesibilidad');
    if (accessibilityInfo) accessibilityInfo.hidden = true;
    accessibilityInfoButton?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) accessibilityButton.focus({preventScroll: true});
  }
  accessibilityButton?.addEventListener('click', () => {
    if (!accessibilityMenu) return;
    if (!accessibilityMenu.hidden) { closeAccessibility(); return; }
    closeMenu();
    accessibilityMenu.hidden = false;
    accessibilityButton.setAttribute('aria-expanded', 'true');
    accessibilityButton.setAttribute('aria-label', 'Cerrar ajustes de accesibilidad');
  });
  accessibilityInfoButton?.addEventListener('click', () => {
    if (!accessibilityInfo) return;
    const open = accessibilityInfo.hidden;
    accessibilityInfo.hidden = !open;
    accessibilityInfoButton.setAttribute('aria-expanded', String(open));
  });

  const menuButton = $('#menu-toggle');
  function closeMenu() {
    $('#main-nav')?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false'); menuButton?.setAttribute('aria-label', 'Abrir menú');
  }
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    if (open) closeAccessibility();
    $('#main-nav').classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && accessibilityMenu && !accessibilityMenu.hidden) {
      closeAccessibility(true); return;
    }
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
    if (accessibilityMenu && !accessibilityMenu.hidden && !accessibilityMenu.contains(event.target) && !accessibilityButton?.contains(event.target)) closeAccessibility();
  });

  const socialDialog = $('#social-dialog');
  $$('[data-social-pending]').forEach(button => button.addEventListener('click', () => {
    $('#social-title').textContent = `${button.dataset.socialPending} · Enlace pendiente`;
    $('#social-description').textContent = `El icono de ${button.dataset.socialPending} está incorporado. Su dirección pública todavía debe confirmarse para activar el acceso.`;
    socialDialog.showModal();
  }));
  socialDialog?.addEventListener('click', event => {
    if (event.target !== socialDialog) return;
    const box = socialDialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) socialDialog.close();
  });

  /* Correo: ventana para escribir y enviar un mensaje mediante Web3Forms (clave pública en site-config.js). */
  const mailLinks = $$('.social-link[href^="mailto:"]');
  if (mailLinks.length && typeof HTMLDialogElement === 'function') {
    const address = decodeURIComponent(mailLinks[0].getAttribute('href').slice(7).split('?')[0]);
    const accessKey = config.web3formsKey || '';
    const privacyHref = $('a[href$="privacidad/index.html"]')?.getAttribute('href') || '';
    const privacyLink = privacyHref ? `<a href="${privacyHref}" target="_blank" rel="noopener">política de privacidad</a>` : 'política de privacidad';
    const mailDialog = document.createElement('dialog');
    mailDialog.id = 'mail-dialog';
    mailDialog.setAttribute('aria-labelledby', 'mail-title');
    mailDialog.style.maxHeight = 'calc(100dvh - 32px)';
    mailDialog.style.overflowY = 'auto';
    mailDialog.innerHTML = `<div class="dialog-content" style="padding:clamp(20px,5vw,36px)">
<p class="eyebrow">JUANAN TECH · Correo</p><h2 id="mail-title">Escríbeme</h2>
<form id="mail-form" novalidate style="display:grid;gap:16px;margin-top:16px">
<div><label for="mail-name">Nombre</label><input id="mail-name" name="name" autocomplete="name" required minlength="2" maxlength="80"></div>
<div><label for="mail-email">Tu correo</label><input id="mail-email" name="email" type="email" autocomplete="email" required maxlength="180"></div>
<div><label for="mail-message">Mensaje</label><textarea id="mail-message" name="message" required minlength="10" maxlength="2500" aria-describedby="mail-hint"></textarea><p class="field-hint" id="mail-hint">Entre 10 y 2500 caracteres. No incluyas contraseñas ni datos sensibles.</p></div>
<input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true" style="display:none">
<label class="checkbox-label" for="mail-privacy"><input id="mail-privacy" type="checkbox" required><span>He leído la ${privacyLink}. El mensaje se envía a ${address} a través del servicio Web3Forms.</span></label>
<p class="field-error" id="mail-status" role="status" aria-live="polite" hidden></p>
<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end"><button class="button secondary" type="button" data-mail-close>Cerrar</button><button class="button" type="submit" id="mail-send">Enviar</button></div>
</form>
<p class="field-hint" style="margin-top:16px">¿Prefieres tu propio correo? <a href="mailto:${address}">${address}</a></p>
</div>`;
    document.body.append(mailDialog);
    const form = $('#mail-form', mailDialog);
    const status = $('#mail-status', mailDialog);
    const send = $('#mail-send', mailDialog);
    const setStatus = (text, ok = false) => {
      status.hidden = false; status.textContent = text;
      status.style.color = ok ? 'var(--accent)' : '';
    };
    $('[data-mail-close]', mailDialog).addEventListener('click', () => mailDialog.close());
    mailDialog.addEventListener('click', event => {
      if (event.target !== mailDialog) return;
      const box = mailDialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) mailDialog.close();
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const fields = [['#mail-name', 'Escribe tu nombre (mínimo 2 caracteres).'], ['#mail-email', 'Escribe un correo válido para poder responderte.'], ['#mail-message', 'Escribe un mensaje de al menos 10 caracteres.'], ['#mail-privacy', 'Debes aceptar la política de privacidad.']];
      for (const [selector, text] of fields) {
        const field = $(selector, form);
        if (!field.checkValidity()) { setStatus(text); field.focus(); return; }
      }
      if (!accessKey) { setStatus(`El envío desde la web todavía no está activado. Escribe directamente a ${address}.`); return; }
      const data = Object.fromEntries(new FormData(form));
      if (data.botcheck) return;
      delete data.botcheck;
      Object.assign(data, {access_key: accessKey, subject: `Nuevo mensaje de ${data.name} · JUANAN TECH`, from_name: 'Web JUANAN TECH'});
      send.disabled = true; send.textContent = 'Enviando…'; setStatus('Enviando mensaje…', true);
      try {
        const response = await fetch('https://api.web3forms.com/submit', {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify(data)});
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success === false) throw new Error(result.message || `HTTP ${response.status}`);
        form.reset(); setStatus('Mensaje enviado. Gracias, te responderé lo antes posible.', true);
        announce('Mensaje enviado.');
      } catch {
        setStatus(`No se pudo enviar el mensaje. Inténtalo más tarde o escribe a ${address}.`);
      } finally {
        send.disabled = false; send.textContent = 'Enviar';
      }
    });
    mailLinks.forEach(link => link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      status.hidden = true;
      mailDialog.showModal();
      $('#mail-name', mailDialog).focus();
    }));
  }

  async function copyText(value) {
    try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); return true; } } catch { /* Alternativa local. */ }
    const area = document.createElement('textarea'); area.value = value;
    area.setAttribute('aria-label', 'Texto para copiar'); area.style.position = 'fixed'; area.style.top = '-1000px';
    document.body.append(area); const previousFocus = document.activeElement; area.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* Copia manual. */ }
    area.remove(); previousFocus?.focus(); return copied;
  }
  $$('[data-copy-code]').forEach(button => button.addEventListener('click', async () => {
    const command = $('code', button.closest('.code-block')).textContent;
    const copied = await copyText(command);
    button.textContent = copied ? 'Copiado' : 'Selecciona el comando';
    announce(copied ? 'Comando copiado al portapapeles.' : 'No se ha podido copiar. Selecciona y copia el comando como texto.');
  }));
  $$('[data-print]').forEach(button => button.addEventListener('click', () => window.print()));
  $$('[data-share]').forEach(button => button.addEventListener('click', async () => {
    if (navigator.share && location.protocol !== 'file:') {
      try { await navigator.share({title: document.title, url: location.href}); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    announce(await copyText(location.href) ? 'Dirección de esta guía copiada.' : 'Puedes copiar la dirección desde la barra del navegador.');
  }));

  const filters = $('#tutorial-filters');
  if (filters) {
    const cards = $$('#tutorial-results .tutorial-card');
    const params = new URLSearchParams(location.search);
    if (filters.dataset.initialPilar) $('#pilar').value = filters.dataset.initialPilar;
    for (const key of ['pilar', 'nivel', 'sistema', 'puerta']) {
      const element = $(`#${key}`);
      if (params.has(key) && [...element.options].some(x => x.value === params.get(key))) element.value = params.get(key);
    }
    $('#search').value = (params.get('q') || '').slice(0, 200);
    let page = 1;
    const perPage = 12;
    function render() {
      const words = normalize($('#search').value.trim()).split(/\s+/).filter(Boolean);
      const matches = cards.filter(card => {
        const d = card.dataset;
        return words.every(word => normalize(d.search).includes(word)) &&
          (!$('#pilar').value || d.pilar === $('#pilar').value) &&
          (!$('#nivel').value || d.nivel === $('#nivel').value) &&
          (!$('#sistema').value || d.sistemas.split('|').includes($('#sistema').value)) &&
          (!$('#puerta').value || d.puerta === $('#puerta').value);
      });
      const totalPages = Math.max(1, Math.ceil(matches.length / perPage)); page = Math.min(page, totalPages);
      cards.forEach(card => { card.hidden = true; });
      matches.slice((page - 1) * perPage, page * perPage).forEach(card => { card.hidden = false; });
      $('#results-status').textContent = `${matches.length} ${matches.length === 1 ? 'tutorial encontrado' : 'tutoriales encontrados'}.`;
      $('#no-results').hidden = matches.length > 0; $('#pagination').hidden = totalPages <= 1;
      $('#previous-page').disabled = page <= 1; $('#next-page').disabled = page >= totalPages;
      $('#page-status').textContent = `Página ${page} de ${totalPages}`;
    }
    function redirectCategoryIfNeeded() {
      if (!filters.dataset.initialPilar || $('#pilar').value === filters.dataset.initialPilar) return false;
      const target = new URL('../index.html', location.href);
      const query = new URLSearchParams(new FormData(filters));
      for (const [key, value] of [...query]) if (!value) query.delete(key);
      target.search = query.toString(); location.href = target.href; return true;
    }
    filters.addEventListener('input', () => { page = 1; if (!redirectCategoryIfNeeded()) render(); });
    filters.addEventListener('submit', event => { event.preventDefault(); page = 1; if (!redirectCategoryIfNeeded()) render(); });
    filters.addEventListener('reset', () => queueMicrotask(() => {
      page = 1;
      if (filters.dataset.initialPilar) { location.href = new URL('../index.html', location.href).href; return; }
      render(); $('#search').focus();
    }));
    $('#previous-page').addEventListener('click', () => { page--; render(); $('#results-status').scrollIntoView({block: 'center'}); });
    $('#next-page').addEventListener('click', () => { page++; render(); $('#results-status').scrollIntoView({block: 'center'}); });
    if (!redirectCategoryIfNeeded()) render();
  }

  const contact = $('#contact-form');
  let message = '';
  function downloadText(filename, text) {
    const url = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  contact?.addEventListener('submit', event => {
    event.preventDefault();
    const errors = [];
    const validators = {
      nombre: element => element.value.trim().length >= 2 && element.value.length <= 80 ? '' : 'Escribe tu nombre (entre 2 y 80 caracteres).',
      email: element => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(element.value.trim()) && element.value.length <= 180 ? '' : 'Escribe una dirección de email válida.',
      motivo: element => element.value ? '' : 'Elige el motivo de tu mensaje.',
      mensaje: element => element.value.trim().length >= 10 && element.value.length <= 2500 ? '' : 'Escribe un mensaje de entre 10 y 2500 caracteres.',
      privacidad: element => element.checked ? '' : 'Marca que has leído la información de privacidad.',
    };
    for (const [name, validate] of Object.entries(validators)) {
      const element = $(`#${name}`), text = validate(element), error = $(`#${name}-error`);
      error.textContent = text; error.hidden = !text; element.setAttribute('aria-invalid', String(Boolean(text)));
      if (text) errors.push({name, text});
    }
    const summary = $('#form-errors'); summary.replaceChildren(); $('#message-output').hidden = true;
    if (errors.length) {
      const p = document.createElement('p'); p.textContent = `Revisa ${errors.length} ${errors.length === 1 ? 'campo' : 'campos'} antes de preparar el mensaje:`; summary.append(p);
      const list = document.createElement('ul');
      for (const error of errors) {
        const item = document.createElement('li'), link = document.createElement('a');
        link.href = `#${error.name}`; link.textContent = error.text; item.append(link); list.append(item);
      }
      summary.append(list); summary.hidden = false; summary.focus(); return;
    }
    summary.hidden = true;
    const values = new FormData(contact);
    message = `Nombre: ${values.get('nombre').trim()}\nEmail de respuesta: ${values.get('email').trim()}\nPerfil: ${values.get('perfil') || 'No indicado'}\nMotivo: ${values.get('motivo')}\n\n${values.get('mensaje').trim()}`;
    $('#prepared-message').value = message;
    const emailLink = $('#open-email');
    if (config.email) {
      emailLink.href = `mailto:${encodeURIComponent(config.email)}?subject=${encodeURIComponent(`Consulta JUANAN TECH · ${values.get('motivo')}`)}&body=${encodeURIComponent(message)}`;
      emailLink.hidden = false;
      $('#delivery-status').textContent = 'Revisa el texto y ábrelo en tu aplicación de correo. Tendrás que enviarlo desde allí; la web no confirma su entrega.';
    } else {
      emailLink.hidden = true;
      $('#delivery-status').textContent = 'La dirección de contacto todavía no está confirmada. Puedes copiar o descargar el borrador; no se ha enviado a nadie.';
    }
    $('#message-output').hidden = false; $('#message-output').focus(); announce('Borrador preparado en tu navegador. El mensaje no se ha enviado.');
  });
  $('#download-message')?.addEventListener('click', () => downloadText('consulta-juanan-tech.txt', message));
  $('#copy-message')?.addEventListener('click', async () => announce(await copyText(message) ? 'Mensaje copiado.' : 'Selecciona el borrador para copiarlo.'));
})();
