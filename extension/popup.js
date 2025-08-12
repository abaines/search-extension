"use strict";

document.addEventListener('DOMContentLoaded', function () {
      const searchBtn = document.getElementById('searchBtn');
      const wordsTextarea = document.getElementById('words');
      const autoApplyCheckbox = document.getElementById('autoApplyCheckbox');

      function setStorage(obj) {
            if (chrome.storage && chrome.storage.local) {
                  chrome.storage.local.set(obj);
            }
      }

      function saveWords() {
            setStorage({ searchWords: wordsTextarea.value });
      }

      function saveAutoApplyState() {
            setStorage({ autoApply: autoApplyCheckbox.checked });
      }

      function applyWords() {
            saveWords();
            notifyContentScriptWordsUpdated();
      }

      function notifyContentScriptWordsUpdated() {
            if (chrome.tabs && chrome.tabs.query) {
                  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        if (tabs[0] && tabs[0].id && tabs[0].url && !tabs[0].url.startsWith('chrome-extension://')) {
                              chrome.tabs.sendMessage(tabs[0].id, { type: 'HIGHLIGHT_WORDS_UPDATED' });
                              console.log('[popup.js] Notified content script: HIGHLIGHT_WORDS_UPDATED');
                        } else {
                              console.log('[popup.js] Skipped notifying content script: not a normal web page tab.');
                        }
                  });
            }
      }

      function restoreWordsAndCheckboxState(items) {
            if (items.searchWords) {
                  wordsTextarea.value = items.searchWords;
            }
            autoApplyCheckbox.checked = !!items.autoApply;
      }

      chrome.storage && chrome.storage.local.get(['searchWords', 'autoApply'], restoreWordsAndCheckboxState);

      searchBtn.addEventListener('click', applyWords);

      wordsTextarea.addEventListener('input', saveWords);
      autoApplyCheckbox.addEventListener('change', saveAutoApplyState);

      function autoApplyIfChecked() {
            if (autoApplyCheckbox.checked) {
                  applyWords();
            }
      }

      function addAutoApplyListenerIfExists(obj, event) {
            if (obj && obj[event] && typeof obj[event].addListener === 'function') {
                  obj[event].addListener(autoApplyIfChecked);
            }
      }

      addAutoApplyListenerIfExists(chrome.tabs, 'onActivated');
      addAutoApplyListenerIfExists(chrome.windows, 'onFocusChanged');
});
