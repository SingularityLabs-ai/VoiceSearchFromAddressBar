const STORAGE_KEY = {
  ENGINE: 'engine',
  CUSTOM_URL: 'customUrl',
  CUSTOM_SELECTOR: 'customSelector'
};

const engineEl = document.getElementById('engine');
const customUrlEl = document.getElementById('customUrl');
const customSelectorEl = document.getElementById('customSelector');
const statusEl = document.getElementById('status');

const customUrlRow = document.getElementById('customUrlRow');
const customSelectorRow = document.getElementById('customSelectorRow');

function updateVisibility() {
  const v = engineEl.value;
  const show = v === 'custom';
  customUrlRow.style.display = show ? '' : 'none';
  customSelectorRow.style.display = show ? '' : 'none';
}

function setStatus(msg) {
  statusEl.textContent = msg;
  setTimeout(() => (statusEl.textContent = ''), 1500);
}

function save() {
  const engine = engineEl.value;
  const customUrl = customUrlEl.value.trim();
  const customSelector = customSelectorEl.value.trim();

  chrome.storage.sync.set({
    [STORAGE_KEY.ENGINE]: engine,
    [STORAGE_KEY.CUSTOM_URL]: customUrl,
    [STORAGE_KEY.CUSTOM_SELECTOR]: customSelector
  }, () => setStatus('Saved'));
}

function restore() {
  chrome.storage.sync.get({
    [STORAGE_KEY.ENGINE]: 'google',
    [STORAGE_KEY.CUSTOM_URL]: '',
    [STORAGE_KEY.CUSTOM_SELECTOR]: ''
  }, (items) => {
    engineEl.value = items.engine;
    customUrlEl.value = items.customUrl || '';
    customSelectorEl.value = items.customSelector || '';
    updateVisibility();
  });
}

document.getElementById('save').addEventListener('click', save);
engineEl.addEventListener('change', updateVisibility);

document.addEventListener('DOMContentLoaded', restore);


