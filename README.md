
# OpenHighlighter

OpenHighlighter is a source available tool that quickly auto-highlights multiple custom search terms or phrases on any webpage.

● Enter your search terms (one per line) in the popup.  
● Instantly highlight all matches on the current page.  
● Optionally, enable automatic highlighting on every page you visit.  
● Your search terms and settings are saved locally and never leave your browser.  
● Source available and supported on GitHub.  

[GitHub Repository](https://github.com/abaines/search-extension)

Chrome Web Store:  
[OpenHighlighter on chrome web store](https://chromewebstore.google.com/detail/openhighlighter/keflkfcjfkljbafefaemchogmlnanjgi)

## Privacy

All data (search terms, settings, highlights) is stored locally in your browser using Chrome's extension storage APIs.
No data is sent to any server or leaves your device.
The extension does not track, transmit, or share your browsing activity or search terms.

## How It Works

OpenHighlighter consists of:
- **Popup UI**: Lets you enter search terms and toggle auto-apply.
Communicates with the content script via Chrome messaging.
- **Content Script**: Runs on webpages, highlights all matching words/phrases, updates the badge, and listens for network activity to reapply highlights.
Uses Chrome storage to persist settings and terms.
- **Injected Script**: Monkey-patches network APIs (fetch/XMLHttpRequest) in the page context to detect dynamic content changes and notify the content script.
- **Background Script**: Receives highlight counts and updates the extension badge.

All code is source available and can be reviewed on GitHub.

## Privacy

All data (search terms, settings, highlights) is stored locally in your browser using Chrome's extension storage APIs.
No data is sent to any server or leaves your device.
The extension does not track, transmit, or share your browsing activity or search terms.
