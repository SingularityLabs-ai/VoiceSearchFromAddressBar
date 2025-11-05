// Try clicking the search engine's voice icon after the page is ready.
// Use a few retries to allow dynamic UI to mount.

const STORAGE_KEY = {
  ENGINE: 'engine',
  CUSTOM_SELECTOR: 'customSelector'
};

const ENGINE_DOMAIN_TO_ID = [
  { test: /(^|\.)google\.[a-z.]+$/i, engine: 'google' },
  { test: /(^|\.)bing\.com$/i, engine: 'bing' },
  { test: /(^|\.)duckduckgo\.com$/i, engine: 'duckduckgo' }
];

const ENGINE_SELECTORS = {
  google: [
    '[aria-label*="Search by voice" i]',
    'button[aria-label*="voice" i]'
  ],
  bing: [
    'button[aria-label*="voice" i]',
    '.b_searchboxVoice'
  ],
  duckduckgo: [
    'button[aria-label*="voice" i]',
    '[data-testid="voice-input"]',
    '[data-test*="voice" i]'
  ]
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
  if (visible) {
    el.click();
    return true;
  }
  return false;
}

async function attemptClick() {
  const { engine: savedEngine, customSelector } = await loadSettings();
  const detected = detectEngineFromLocation();
  const engine = detected || savedEngine;

  const selectors = [];
  if (engine && ENGINE_SELECTORS[engine]) selectors.push(...ENGINE_SELECTORS[engine]);
  if (customSelector) selectors.unshift(customSelector);

  const button = tryFindButton(selectors);
  if (button) {
    if (clickIfVisible(button)) return true;
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


