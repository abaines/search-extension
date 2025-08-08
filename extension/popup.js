

document.addEventListener('DOMContentLoaded', function () {
    const searchBtn = document.getElementById('searchBtn');
    const wordsTextarea = document.getElementById('words');

    // Restore saved words
    const saved = localStorage.getItem('searchWords');
    if (saved) {
        wordsTextarea.value = saved;
    }

    searchBtn.addEventListener('click', function () {
        const wordsRaw = wordsTextarea.value;
        console.log('Words to search (raw):', wordsRaw);
        // Save words to localStorage
        localStorage.setItem('searchWords', wordsRaw);
        // Send raw words string to content script for highlighting
        chrome.tabs && chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'HIGHLIGHT_WORDS', wordsRaw });
            }
        });
    });

    // Save words on every input for reliability
    wordsTextarea.addEventListener('input', function () {
        localStorage.setItem('searchWords', wordsTextarea.value);
    });
});
