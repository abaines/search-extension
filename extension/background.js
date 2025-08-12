// background.js
// Receives count from content script and sets badge text

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SET_BADGE_COUNT' && typeof msg.count === 'number') {
        let text = msg.count > 999 ? '999+' : msg.count > 0 ? String(msg.count) : '';
        chrome.action.setBadgeText({ text });
        chrome.action.setBadgeBackgroundColor({ color: '#FFA500' }); // Orange badge
        console.log('[background.js] Received SET_BADGE_COUNT:', msg.count, 'Setting badge text to:', text);
    }
});
