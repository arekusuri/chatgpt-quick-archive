(() => {
  'use strict';
  if (globalThis.__chatGPTQuickArchiveLoaded) return;
  globalThis.__chatGPTQuickArchiveLoaded = true;
  const { isArchiveLabel, isMenuLabel, conversationKey, openMenu } = globalThis.ChatGPTQuickArchive;
  const buttonClass = 'cqa-archive';
  let busy = false;
  let scheduled = false;
  let noticeTimer;
  const label = (element) => element.getAttribute('aria-label') || element.textContent || '';
  const visible = (element) => element.isConnected && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
  const key = (anchor) => conversationKey(anchor.getAttribute('href'), location.origin);
  const anchors = () => [...document.querySelectorAll('nav a[href], aside a[href], [data-testid="sidebar"] a[href]')].filter((a) => key(a));

  function notify(message, error = false) {
    let notice = document.getElementById('cqa-notice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'cqa-notice';
      document.body.append(notice);
    }
    notice.setAttribute('role', error ? 'alert' : 'status');
    notice.textContent = message;
    notice.dataset.error = String(error);
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => notice.remove(), error ? 12000 : 5000);
  }

  function waitFor(read, timeout = 4000, message = 'Timed out waiting for ChatGPT.') {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        try {
          const result = read();
          if (result) return resolve(result);
          if (Date.now() - start >= timeout) return reject(new Error(message));
          setTimeout(check, 60);
        } catch (error) { reject(error); }
      };
      check();
    });
  }

  // Stop at the smallest container that holds this conversation and its menu.
  function findRow(anchor) {
    for (let row = anchor; row && !row.matches('nav, aside, body'); row = row.parentElement) {
      const links = [...row.querySelectorAll('a[href]')].filter((a) => key(a));
      if (row !== anchor && links.length !== 1) break;
      const menu = [...row.querySelectorAll('button, [role="button"]')].find((b) =>
        !b.classList.contains(buttonClass) && (b.getAttribute('aria-haspopup') === 'menu' || isMenuLabel(label(b))));
      if (menu) return { row, menu };
    }
    return null;
  }

  function menuFor(trigger, previousMenus) {
    const controlled = trigger.getAttribute('aria-controls');
    if (controlled) {
      const target = document.getElementById(controlled);
      const menu = target?.matches('[role="menu"]') ? target : target?.querySelector('[role="menu"]');
      if (menu && visible(menu)) return menu;
    }
    const menus = [...document.querySelectorAll('[role="menu"]')].filter(visible);
    const owned = menus.filter((menu) => {
      const labelledBy = (menu.getAttribute('aria-labelledby') || '').split(/\s+/);
      return trigger.id && labelledBy.includes(trigger.id);
    });
    if (owned.length === 1) return owned[0];
    const fresh = menus.filter((menu) => !previousMenus.has(menu));
    return fresh.length === 1 ? fresh[0] : null;
  }

  async function archive(anchor, button) {
    if (busy) return;
    busy = true;
    button.setAttribute('aria-busy', 'true');
    let trigger;
    let clicked = false;
    try {
      const id = key(anchor);
      const found = findRow(anchor);
      if (!id || !found || !anchor.isConnected) throw new Error('Conversation controls changed. Refresh ChatGPT and try again.');
      trigger = found.menu;
      if (document.querySelector('[role="menu"]') && [...document.querySelectorAll('[role="menu"]')].some(visible)) {
        throw new Error('Close the open menu, then try Archive again.');
      }
      const previousMenus = new Set([...document.querySelectorAll('[role="menu"]')].filter(visible));
      openMenu(trigger);
      const menu = await waitFor(() => menuFor(trigger, previousMenus), 4000,
        'Could not open the conversation menu. Try the three-dot button manually, close it, then retry Archive.');
      if (!anchor.isConnected || key(anchor) !== id) throw new Error('The conversation row changed. Please try again.');
      const items = [...menu.querySelectorAll('[role="menuitem"]')].filter((item) =>
        visible(item) && item.getAttribute('aria-disabled') !== 'true' && !item.hasAttribute('disabled') && isArchiveLabel(label(item)));
      if (items.length !== 1) throw new Error('Could not identify Archive safely. This version supports English ChatGPT menus.');
      // Only an exact Archive label is allowed. Never select by position or icon.
      items[0].click();
      clicked = true;
      await waitFor(() => !anchors().some((a) => key(a) === id), 8000);
      notify('Conversation archived.');
    } catch (error) {
      notify(clicked ? 'Archive was requested, but could not be verified. Check the sidebar before retrying.' : error.message, true);
    } finally {
      if (!clicked && trigger?.isConnected && trigger.getAttribute('aria-expanded') === 'true') {
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      }
      button.removeAttribute('aria-busy');
      busy = false;
    }
  }

  function positionButton(row, menu, button) {
    const target = menu.getBoundingClientRect();
    const bounds = row.getBoundingClientRect();
    if (!target.width || !target.height) return;
    // Position against the actual dots button, independent of native wrappers.
    const left = `${target.left - bounds.left + row.scrollLeft - row.clientLeft - 30}px`;
    const top = `${target.top - bounds.top + row.scrollTop - row.clientTop + (target.height - 28) / 2}px`;
    if (button.style.left !== left) button.style.left = left;
    if (button.style.top !== top) button.style.top = top;
  }

  function prepareRow(row) {
    // React replaces className when selection changes, even when it keeps our
    // injected button. Restore hover/position markers on every reconciliation.
    if (!row.classList.contains('cqa-row')) row.classList.add('cqa-row');
    if (getComputedStyle(row).position === 'static' && !row.classList.contains('cqa-positioned')) {
      row.classList.add('cqa-positioned');
    }
  }

  function refreshButton(row, button) {
    if (!row.isConnected || !button.isConnected) return;
    const anchor = row.matches('a[href]') ? row : [...row.querySelectorAll('a[href]')].find((a) => key(a));
    const found = anchor && findRow(anchor);
    if (found) {
      prepareRow(row);
      positionButton(row, found.menu, button);
    }
  }

  function scan() {
    scheduled = false;
    for (const anchor of anchors()) {
      const found = findRow(anchor);
      if (!found) continue;
      const { row, menu } = found;
      prepareRow(row);
      const existing = row.querySelector(`.${buttonClass}`);
      if (existing) {
        positionButton(row, menu, existing);
        continue;
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = buttonClass;
      button.title = 'Archive conversation';
      button.setAttribute('aria-label', 'Archive conversation');
      button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v11h16V9M3 4h18v5H3zM9 13h6"/></svg>';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        // Resolve the current link again because React can recycle rows.
        const current = row.matches('a[href]') ? row : [...row.querySelectorAll('a[href]')].find((a) => key(a));
        if (current) void archive(current, button);
        else notify('Conversation row changed. Refresh ChatGPT and try again.', true);
      });
      row.append(button);
      // Resolve the current menu on each interaction; selection can replace it.
      const reposition = () => requestAnimationFrame(() => refreshButton(row, button));
      row.addEventListener('pointerenter', reposition);
      row.addEventListener('focusin', reposition);
      row.addEventListener('pointermove', reposition);
      row.addEventListener('transitionend', reposition);
      positionButton(row, menu, button);
    }
  }
  const observer = new MutationObserver(() => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(scan);
    }
  });
  const scheduleScan = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(scan);
    }
  };
  window.addEventListener('resize', scheduleScan);
  document.addEventListener('scroll', scheduleScan, true);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true,
    attributeFilter: ['href', 'aria-label', 'aria-haspopup', 'class', 'aria-current', 'data-state', 'data-active'] });
  scan();
})();
