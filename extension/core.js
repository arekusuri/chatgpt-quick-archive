/* Shared conservative matching rules. Unknown UI labels fail closed. */
(() => {
  const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const isArchiveLabel = (value) => /^(archive|archive chat|archive conversation)$/.test(normalize(value));
  const isMenuLabel = (value) => /^(open conversation options|conversation options|chat options|more options|open menu|options|more)$/.test(normalize(value));
  const conversationKey = (href, origin) => {
    try {
      const url = new URL(href, origin);
      if (url.origin !== origin) return null;
      return url.pathname.match(/^(?:\/g\/[^/]+)?\/c\/([a-zA-Z0-9-]+)\/?$/)?.[1] || null;
    } catch { return null; }
  };
  // Some menu libraries open on pointerdown rather than click. HTMLElement.click()
  // alone skips that handler; dispatch the normal primary-button sequence first.
  const openMenu = (trigger) => {
    const view = trigger.ownerDocument.defaultView;
    const options = { bubbles: true, cancelable: true, composed: true,
      button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', isPrimary: true, view };
    trigger.dispatchEvent(new view.PointerEvent('pointerdown', options));
    trigger.dispatchEvent(new view.MouseEvent('mousedown', options));
    trigger.dispatchEvent(new view.PointerEvent('pointerup', { ...options, buttons: 0 }));
    trigger.dispatchEvent(new view.MouseEvent('mouseup', { ...options, buttons: 0 }));
    trigger.click();
  };
  const api = { isArchiveLabel, isMenuLabel, conversationKey, openMenu };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.ChatGPTQuickArchive = api;
})();
