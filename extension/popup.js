"use strict";

document.addEventListener('DOMContentLoaded', function () {
      const searchBtn = document.getElementById('searchBtn');
      const wordsTextarea = document.getElementById('words');

      function saveWords() {
            localStorage.setItem('searchWords', wordsTextarea.value);
      }

      // Restore saved words
      const saved = localStorage.getItem('searchWords');
      if (saved) {
            wordsTextarea.value = saved;
      }

      searchBtn.addEventListener('click', function () {
            const wordsRaw = wordsTextarea.value;
            saveWords();
            // Send raw words string to content script for highlighting
            chrome.tabs && chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                  if (tabs[0] && tabs[0].id) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: 'HIGHLIGHT_WORDS', wordsRaw });
                  }
            });
            console.log('Words to search (raw):\n' + wordsRaw);
      });

      // Save words on every input for reliability
      wordsTextarea.addEventListener('input', saveWords);
});
