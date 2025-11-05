// Try clicking the search engine's voice icon after the page is ready.
// Use a few retries to allow dynamic UI to mount.

const STORAGE_KEY = {
  ENGINE: 'engine',
  CUSTOM_SELECTOR: 'customSelector',
  CONFIG_BAR_DISMISSED_AT: 'configBarDismissedAt'
};

const ENGINE_DOMAIN_TO_ID = [
  { test: /(^|\.)google\.[a-z.]+$/i, engine: 'google' },
  { test: /(^|\.)bing\.com$/i, engine: 'bing' }//,
  // { test: /(^|\.)duckduckgo\.com$/i, engine: 'duckduckgo' }
];

const ENGINE_SELECTORS = {
  google: [
    '[aria-label*="Search by voice" i]',
    'button[aria-label*="voice" i]'
  ],
  bing: [
    '#sb_form > div.mic_cont.icon > div',
    '#sb_form .b_searchboxMic',
    '#sb_form .b_searchboxVoice',
    'button[aria-label*="voice" i]',
    'button[aria-label*="microphone" i]'
  ]//,
  // duckduckgo: [
  //   'button[aria-label*="voice" i]',
  //   '[data-testid="voice-input"]',
  //   '[data-test*="voice" i]'
  // ]
};

function detectEngineFromLocation() {
  const host = location.hostname;
  for (const { test, engine } of ENGINE_DOMAIN_TO_ID) {
    if (test.test(host)) return engine;
  }
  return null;
}

async function loadSettings() {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get({ [STORAGE_KEY.ENGINE]: 'google', [STORAGE_KEY.CUSTOM_SELECTOR]: '' }, (data) => {
        resolve(data);
      });
    } catch (_e) {
      resolve({ engine: 'google', customSelector: '' });
    }
  });
}

function tryFindButton(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}

function clickIfVisible(el) {
  const rect = el.getBoundingClientRect();
  const visible = rect.width > 0 && rect.height > 0;
  if (!visible) return false;
  try {
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  } catch (_e) {
    // ignore
  }

  try {
    const pointerDown = new PointerEvent('pointerdown', { bubbles: true });
    const mouseDown = new MouseEvent('mousedown', { bubbles: true });
    const click = new MouseEvent('click', { bubbles: true });
    el.dispatchEvent(pointerDown);
    el.dispatchEvent(mouseDown);
    el.dispatchEvent(click);
  } catch (_e) {
    try { el.click(); } catch (_e2) { /* ignore */ }
  }
  return true;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function prepareBing() {
  // Focus the search box first so the mic icon initializes in some variants
  const q = document.querySelector('#sb_form_q') || document.querySelector('#sb_form input[name="q"]');
  if (q) {
    try {
      q.focus();
      await sleep(120);
    } catch (_e) {}
  }
}

async function attemptClick() {
  const { engine: savedEngine, customSelector } = await loadSettings();
  const detected = detectEngineFromLocation();
  const engine = detected || savedEngine;

  const selectors = [];
  if (engine && ENGINE_SELECTORS[engine]) selectors.push(...ENGINE_SELECTORS[engine]);
  if (customSelector) selectors.unshift(customSelector);

  // Special handling for Bing: focus first to make the mic appear consistently
  if (engine === 'bing') {
    await prepareBing();
  }

  let button = tryFindButton(selectors);
  if (button) {
    if (clickIfVisible(button)) return true;
  }

  if (engine === 'bing') {
    // Retry once after a brief wait; Bing UI can mount lazily
    await sleep(200);
    button = tryFindButton(selectors);
    if (button) {
      if (clickIfVisible(button)) return true;
    }
  }
  return false;
}

function whenReady(fn) {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    fn();
  } else {
    window.addEventListener('DOMContentLoaded', fn, { once: true });
  }
}

whenReady(async () => {
  let attempts = 0;
  const maxAttempts = 10;
  const interval = 400;

  const timer = setInterval(async () => {
    attempts += 1;
    const ok = await attemptClick();
    if (ok || attempts >= maxAttempts) {
      clearInterval(timer);
    }
  }, interval);

  // Also observe late-mounting UIs
  const observer = new MutationObserver(async () => {
    const ok = await attemptClick();
    if (ok) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
});

// Inject a simple notification bar with a link to Options so users can configure behavior.
function injectConfigBar() {
  if (document.getElementById('asv-config-bar')) return; // avoid duplicates

  const bar = document.createElement('div');
  bar.id = 'asv-config-bar';
  bar.style.position = 'fixed';
  bar.style.top = '0';
  bar.style.left = '0';
  bar.style.right = '0';
  bar.style.zIndex = '2147483647';
  bar.style.background = '#0b5fff';
  bar.style.color = '#fff';
  bar.style.fontFamily = 'system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif';
  bar.style.fontSize = '13px';
  bar.style.padding = '8px 12px';
  bar.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
  bar.style.display = 'flex';
  bar.style.alignItems = 'center';
  bar.style.gap = '8px';

  const text = document.createElement('span');
  text.textContent = 'Voice Search: Configure options (engine, new tab) →';

  const link = document.createElement('a');
  // Use runtime URL so it works regardless of the installed extension ID
  link.href = chrome.runtime.getURL('options/options.html');
  link.textContent = 'Open Options';
  link.style.color = '#fff';
  link.style.textDecoration = 'underline';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const spacer = document.createElement('div');
  spacer.style.flex = '1';

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '×';
  close.title = 'Dismiss';
  close.style.background = 'transparent';
  close.style.border = 'none';
  close.style.color = '#fff';
  close.style.fontSize = '18px';
  close.style.cursor = 'pointer';
  close.addEventListener('click', () => {
    try {
      const ph = document.getElementById('asv-config-bar-ph');
      if (ph) ph.remove();
      bar.remove();
      if (chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ [STORAGE_KEY.CONFIG_BAR_DISMISSED_AT]: Date.now() });
      }
    } catch (_e) {
      // ignore
    }
  });

  bar.appendChild(text);
  bar.appendChild(link);
  bar.appendChild(spacer);
  bar.appendChild(close);

  // Offset page content to avoid covering top elements
  const placeholder = document.createElement('div');
  placeholder.id = 'asv-config-bar-ph';
  placeholder.style.height = '40px';
  placeholder.style.width = '100%';

  document.documentElement.appendChild(bar);
  document.body && document.body.firstChild
    ? document.body.insertBefore(placeholder, document.body.firstChild)
    : document.body.appendChild(placeholder);
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function shouldShowConfigBar() {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get({ [STORAGE_KEY.CONFIG_BAR_DISMISSED_AT]: 0 }, (data) => {
        const dismissedAt = Number(data[STORAGE_KEY.CONFIG_BAR_DISMISSED_AT] || 0);
        if (!dismissedAt) return resolve(true);
        const elapsed = Date.now() - dismissedAt;
        resolve(elapsed >= THREE_DAYS_MS);
      });
    } catch (_e) {
      resolve(true);
    }
  });
}

whenReady(async () => {
  try {
    const show = await shouldShowConfigBar();
    if (show) injectConfigBar();
  } catch (_e) { /* ignore */ }
});


