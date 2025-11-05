// Persisted keys
const STORAGE_KEY = {
  ENGINE: 'engine', // 'google' | 'bing' | 'duckduckgo' | 'custom'
  CUSTOM_URL: 'customUrl',
  CUSTOM_SELECTOR: 'customSelector',
  OPEN_IN_NEW_TAB: 'openInNewTab'
};

const ENGINE_PRESETS = {
  google: {
    url: 'https://www.google.com/',
    selector: '[aria-label*="Search by voice" i], button[aria-label*="voice" i]'
  },
  bing: {
    url: 'https://www.bing.com/',
    selector: 'button[aria-label*="voice" i], .b_searchboxVoice'
  }//,
  // duckduckgo: {
  //   url: 'https://duckduckgo.com/',
  //   selector: 'button[aria-label*="voice" i], [data-testid="voice-input"], [data-test*="voice" i]'
  // }
};

async function getSettings() {
  const stored = await chrome.storage.sync.get({
    [STORAGE_KEY.ENGINE]: 'google',
    [STORAGE_KEY.CUSTOM_URL]: '',
    [STORAGE_KEY.CUSTOM_SELECTOR]: '',
    [STORAGE_KEY.OPEN_IN_NEW_TAB]: false
  });
  return stored;
}

async function openEngineHome() {
  const { engine, customUrl, openInNewTab } = await getSettings();
  let targetUrl = '';
  if (engine === 'custom' && customUrl) {
    targetUrl = customUrl;
  } else if (ENGINE_PRESETS[engine]) {
    targetUrl = ENGINE_PRESETS[engine].url;
  } else {
    targetUrl = ENGINE_PRESETS.google.url;
  }

  if (openInNewTab) {
    const tab = await chrome.tabs.create({ url: targetUrl, active: true });
    return tab.id;
  } else {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.id) {
      const updated = await chrome.tabs.update(activeTab.id, { url: targetUrl, active: true });
      return updated.id;
    }
    const tab = await chrome.tabs.create({ url: targetUrl, active: true });
    return tab.id;
  }
}

chrome.action.onClicked.addListener(async () => {
  try {
    await openEngineHome();
  } catch (e) {
    // Swallow errors to avoid noisy logs in release
    // eslint-disable-next-line no-console
    console.error('VoiceSearch action error', e);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'voice-search') {
    try {
      await openEngineHome();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('VoiceSearch command error', e);
    }
  }
});


