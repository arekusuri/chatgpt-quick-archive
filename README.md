# ChatGPT Quick Archive

A Manifest V3 extension for **Microsoft Edge**, targeting the ChatGPT website. The same unpacked extension can also be loaded in desktop Google Chrome; no separate build is needed.

Adds an archive icon immediately to the left of the three-dot options button on conversation rows in the ChatGPT sidebar. It appears only while hovering the row or focusing its controls with the keyboard. One click invokes ChatGPT's existing Archive action, with no extension menu or confirmation dialog. Archived conversations remain in your account; the extension never selects Delete.

## Install in Edge

1. Open `edge://extensions` in Edge.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension` folder inside your downloaded or cloned copy of this project, not the project root.

5. Open or refresh `https://chatgpt.com` and expand the conversation sidebar.
6. Hover a conversation row to see its controls, then click the archive box icon immediately to the left of the three-dot options button.

After changing extension files, click **Reload** on its card at `edge://extensions`, then refresh ChatGPT.

For Chrome, follow the same steps at `chrome://extensions` using the same `extension` folder. This project is ready to load locally; it has not been published to either extension store.

## How it works

- Runs only on `https://chatgpt.com/*` and the legacy `https://chat.openai.com/*` domain.
- Finds conversation links and their existing options buttons in the sidebar, including dynamically added rows.
- Opens the selected row's existing menu programmatically and clicks only a single, enabled item with the exact English label **Archive**, **Archive chat**, or **Archive conversation**. The native menu may appear briefly.
- Does not click items by position, use private APIs, read authentication tokens, or send data to another service. No background process, analytics, storage, or additional extension permissions.
- Allows one archive request at a time. It reports success after that conversation disappears from the sidebar. If disappearance cannot be verified within eight seconds, it displays an uncertainty notice; it does not automatically retry.
- Shows a visible error if controls change, another menu is open, or Archive cannot be identified. It never falls back to Delete or dismisses a confirmation dialog.

## Limits and recovery

Currently supports **English ChatGPT menus**. ChatGPT can change its sidebar markup; an unsupported layout may result in a missing icon or a visible error. Some row controls (and the archive icon next to them) may appear only on hover or keyboard focus. Expand the sidebar to use it.

Restore archived chats through ChatGPT's own Settings → Data controls → Archived Chats management interface. The extension does not provide its own restore UI.

This extension targets the website in desktop Edge/Chrome, not the ChatGPT desktop application or Codex sidebar.

## Validation

Run the dependency-free checks with Node.js:

```sh
node --check extension/content.js
node --test tests/*.test.cjs
```

Automated checks cover archive/delete label discrimination, conversation URL scope, manifest permissions, and menus that open on pointer-down or click. The extension has **not yet been verified on a live signed-in ChatGPT sidebar in Edge or Chrome**.

After loading it, verify with a conversation you are comfortable archiving:

1. Confirm one archive icon appears beside the row's existing controls, including after navigation or loading more history.
2. Click Archive and confirm the intended conversation leaves the sidebar without a confirmation dialog.
3. Confirm it appears in ChatGPT's Archived Chats and can be restored.
4. Open another conversation's options menu, then click an archive icon; confirm the extension reports that the menu must be closed and does not act on the other conversation.
5. Check keyboard access (Tab to the icon, then Enter) and light/dark appearance.

## Files

- `extension/manifest.json`: Edge/Chrome extension definition and website scope.
- `extension/core.js`: conservative URL and action-label matching.
- `extension/content.js`: sidebar buttons, existing-menu invocation, and status/error notices.
- `extension/content.css`: icon and notice styling.
- `tests/`: dependency-free safety checks.
