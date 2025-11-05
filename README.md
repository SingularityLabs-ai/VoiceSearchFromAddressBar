Address Bar Voice Search Button
================================

Adds a toolbar microphone button in Chrome/Edge. Clicking it opens your selected search engine homepage and auto-clicks its voice search icon (no speech-to-text API used).

Install (Chrome/Edge)
---------------------
- Open the browser and go to `chrome://extensions` (Edge: `edge://extensions`).
- Enable "Developer mode" (top-right).
- Click "Load unpacked" and select this folder: `VoiceSearchFromAddressBar`.
- Pin the extension to your toolbar for quick access.

Usage
-----
- Click the mic icon in the toolbar to open the search engine and trigger voice search.
- Keyboard shortcut: Alt+Shift+V (you can change it in `chrome://extensions/shortcuts`).

Options
-------
- Right-click the extension icon → Options, or open from the extensions page.
- Choose one of: Google, Bing, DuckDuckGo, or Custom.
- For Custom, provide the homepage URL and (optionally) the CSS selector of the voice button if auto-detection fails.
 - Open in new tab: toggle this if you prefer opening the search in a new tab. Default is current tab.

Notes
-----
- Browsers don’t allow extensions to place a button inside the omnibox/URL bar. This extension adds a toolbar button next to it.
- Microphone permission prompts are handled by the search engine page; allow them when prompted.
- If voice search doesn’t trigger, update the selector in Options (sites update their DOM over time).


# VoiceSearchFromAddressBar
# VoiceSearchFromAddressBar
