"use strict";

document.addEventListener('DOMContentLoaded', function () {
      const searchBtn = document.getElementById('searchBtn');
      const wordsTextarea = document.getElementById('words');
      const autoApplyCheckbox = document.getElementById('autoApplyCheckbox');

      function saveWords() {
            localStorage.setItem('searchWords', wordsTextarea.value);
      }

      function saveAutoApplyState() {
            localStorage.setItem('autoApply', autoApplyCheckbox.checked ? '1' : '0');
      }

      function sendWordsToContentScript(wordsRaw) {
            chrome.tabs && chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                  if (tabs[0] && tabs[0].id) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: 'HIGHLIGHT_WORDS', wordsRaw });
                  }
            });
            console.log('Words to search (raw):\n' + wordsRaw);
      }

      // Restore saved words
      const saved = localStorage.getItem('searchWords');
      if (saved) {
            wordsTextarea.value = saved;
      }

      // Restore checkbox state
      const autoApplySaved = localStorage.getItem('autoApply');
      if (autoApplySaved === '1') {
            autoApplyCheckbox.checked = true;
      } else {
            autoApplyCheckbox.checked = false;
      }

      searchBtn.addEventListener('click', function () {
            const wordsRaw = wordsTextarea.value;
            saveWords();
            sendWordsToContentScript(wordsRaw);
      });

      // Save words on every input for reliability
      wordsTextarea.addEventListener('input', saveWords);

      // Save checkbox state on change
      autoApplyCheckbox.addEventListener('change', saveAutoApplyState);

      function autoApplyIfChecked() {
            if (autoApplyCheckbox.checked) {
                  const wordsRaw = wordsTextarea.value;
                  sendWordsToContentScript(wordsRaw);
            }
      }

      chrome.tabs && chrome.tabs.onActivated && chrome.tabs.onActivated.addListener(autoApplyIfChecked);
      chrome.windows && chrome.windows.onFocusChanged && chrome.windows.onFocusChanged.addListener(autoApplyIfChecked);
});
