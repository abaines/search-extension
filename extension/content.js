"use strict";

(function () {
      const highlightColor = "#FFA500";
      const textColor = "#000000";
      const highlightTag = "MARK";

      function highlightMatchInNode(match, node) {
            const matchText = match[0];
            const matchIndex = match.index;
            node.splitText(matchIndex + matchText.length);
            const middleNode = node.splitText(matchIndex);
            const mark = document.createElement(highlightTag);
            mark.className = "search-extension-highlight";
            mark.style.backgroundColor = highlightColor;
            mark.style.color = textColor;
            mark.style.borderRadius = "3px";
            mark.textContent = middleNode.nodeValue;
            middleNode.parentNode.replaceChild(mark, middleNode);
      }


      function removeAllHighlights() {
            const marks = document.querySelectorAll(`${highlightTag}.search-extension-highlight`);
            marks.forEach(mark => {
                  // Replace the <mark> with its text content
                  mark.replaceWith(document.createTextNode(mark.textContent));
            });
      }

      function highlightKeywords(keywords) {
            if (!keywords || !keywords.length) return;

            removeAllHighlights();

            const regex = buildKeywordsRegex(keywords);
            const nodes = getHighlightableTextNodes(regex);
            const occurrenceCount = highlightAllMatchesInNodes(nodes, regex);
            updateBadgeAndLog(occurrenceCount);
      }

      function buildKeywordsRegex(keywords) {
            return new RegExp(
                  keywords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
                  "gi"
            );
      }

      function getHighlightableTextNodes(regex) {
            const isHighlightableTextNode = {
                  acceptNode: function (node) {
                        const parentTag = node.parentElement.tagName;
                        if (
                              parentTag === "SCRIPT" ||
                              parentTag === "STYLE" ||
                              parentTag === "NOSCRIPT" ||
                              node.parentElement.isContentEditable ||
                              node.parentElement.closest(highlightTag)
                        ) {
                              return NodeFilter.FILTER_REJECT;
                        }
                        if (!/\S/.test(node.nodeValue)) {
                              return NodeFilter.FILTER_REJECT;
                        }
                        const testResult = regex.test(node.nodeValue);
                        regex.lastIndex = 0;
                        return testResult ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                  },
            };

            const walker = document.createTreeWalker(
                  document.body,
                  NodeFilter.SHOW_TEXT,
                  isHighlightableTextNode
            );

            const nodes = [];
            let currentNode;
            while ((currentNode = walker.nextNode())) {
                  nodes.push(currentNode);
            }
            return nodes;
      }

      function highlightAllMatchesInNodes(nodes, regex) {
            let occurrenceCount = 0;
            const wordCounts = {};
            nodes.forEach(function (node) {
                  const matches = [...node.nodeValue.matchAll(regex)];
                  occurrenceCount += matches.length;
                  matches.forEach((match) => {
                        const word = match[0].toLowerCase();
                        wordCounts[word] = (wordCounts[word] || 0) + 1;
                  });
                  matches.reverse().forEach((match) => highlightMatchInNode(match, node));
            });
            if (Object.keys(wordCounts).length > 0) {
                  console.log('[content.js] Word counts:', wordCounts);
            } else {
                  console.log('[content.js] No words found.');
            }
            return occurrenceCount;
      }

      function updateBadgeAndLog(occurrenceCount) {
            const highlightCountMessage = `🧡 Found and highlighted ${occurrenceCount} keyword occurrence(s).`;
            if (chrome.runtime && chrome.runtime.sendMessage) {
                  chrome.runtime.sendMessage({ type: "SET_BADGE_COUNT", count: occurrenceCount });
                  console.log('[content.js] ' + highlightCountMessage + ' (sent to background)');
            } else {
                  console.warn('[content.js] ' + highlightCountMessage + ' (chrome.runtime.sendMessage not available)');
            }
      }

      function handleHighlightWordsMessage(msg, sender, sendResponse) {
            if (msg.type === "HIGHLIGHT_WORDS_UPDATED") {
                  chrome.storage && chrome.storage.local.get(["searchWords"], function (items) {
                        const wordsRaw = items.searchWords || "";
                        const words = wordsRaw.split("\n").map((w) => w.trim()).filter(Boolean);
                        highlightKeywords(words);
                  });
                  console.log('[content.js] Received HIGHLIGHT_WORDS_UPDATED message');
            }
      }

      chrome.runtime.onMessage.addListener(handleHighlightWordsMessage);

      function autoApplyFromStorage() {
            chrome.storage && chrome.storage.local.get(["autoApply", "searchWords"], function (items) {
                  if (items.autoApply) {
                        const wordsRaw = items.searchWords || "";
                        const words = wordsRaw.split("\n").map((w) => w.trim()).filter(Boolean);
                        highlightKeywords(words);
                  }
            });
      }

      window.addEventListener("focus", autoApplyFromStorage);
      document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "visible") {
                  autoApplyFromStorage();
            }
      });

      // Listen for Chrome tab and window events (if available)
      if (chrome && chrome.runtime && chrome.runtime.onMessage) {
            if (chrome.tabs && chrome.tabs.onActivated) {
                  chrome.tabs.onActivated.addListener(autoApplyFromStorage);
            }
            if (chrome.windows && chrome.windows.onFocusChanged) {
                  chrome.windows.onFocusChanged.addListener(autoApplyFromStorage);
            }
      }

      autoApplyFromStorage();

      // Monkey-patch fetch and XMLHttpRequest to trigger highlight after network calls
      (function patchNetworkForHighlighting() {
            // Patch fetch
            if (window.fetch) {
                  const originalFetch = window.fetch;
                  window.fetch = function (...args) {
                        return originalFetch.apply(this, args).then(response => {
                              setTimeout(autoApplyFromStorage, 0);
                              console.log("[content.js] Fetch request completed.");
                              return response;
                        });
                  };
            }

            // Patch XMLHttpRequest
            if (window.XMLHttpRequest) {
                  const originalOpen = XMLHttpRequest.prototype.open;
                  XMLHttpRequest.prototype.open = function (...args) {
                        this.addEventListener('loadend', function () {
                              setTimeout(autoApplyFromStorage, 0);
                              console.log("[content.js] XMLHttpRequest completed.");
                        });
                        return originalOpen.apply(this, args);
                  };
            }
      })();
})();
