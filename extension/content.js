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
            const wordCounts = highlightAllMatchesInNodes(nodes, regex);
            updateBadgeAndLog(wordCounts);
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
            const wordCounts = {};
            nodes.forEach(function (node) {
                  const matches = [...node.nodeValue.matchAll(regex)];
                  matches.forEach((match) => {
                        const word = match[0].toLowerCase();
                        wordCounts[word] = (wordCounts[word] || 0) + 1;
                  });
                  matches.reverse().forEach((match) => highlightMatchInNode(match, node));
            });
            return wordCounts;
      }

      function updateBadgeAndLog(wordCounts) {
            const occurrenceCount = Object.values(wordCounts).reduce((a, b) => a + b, 0);
            const highlightCountMessage = `🧡 Found and highlighted ${occurrenceCount} keyword occurrence(s).`;
            if (chrome.runtime && chrome.runtime.sendMessage) {
                  chrome.runtime.sendMessage({ type: "SET_BADGE_COUNT", count: occurrenceCount });
                  if (occurrenceCount > 0) {
                        console.log(`[content.js] ${highlightCountMessage} (sent to background) | Word counts:`, wordCounts);
                  }
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
            try {
                  function handleStorageItems(items) {
                        if (items.autoApply) {
                              const wordsRaw = items.searchWords || "";
                              const words = wordsRaw.split("\n").map((w) => w.trim()).filter(Boolean);
                              highlightKeywords(words);
                        }
                  }
                  const isChromeStorageLocalGetAvailable = (
                        chrome &&
                        chrome.storage &&
                        chrome.storage.local &&
                        typeof chrome.storage.local.get === "function"
                  );
                  if (isChromeStorageLocalGetAvailable) {
                        chrome.storage.local.get(["autoApply", "searchWords"], handleStorageItems);
                  } else {
                        console.warn("[content.js] chrome.storage.local.get is not available.");
                  }
            } catch (e) {
                  if (e && e.message && e.message.includes('Extension context invalidated')) {
                        console.warn('[content.js] Extension context invalidated, ignoring.');
                  } else {
                        throw e;
                  }
            }
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

      // Inject a script into the page context to patch fetch/XMLHttpRequest for network detection
      (function injectNetworkPatchScript() {
            try {
                  const script = document.createElement('script');
                  script.src = chrome.runtime.getURL('injected-network-patch.js');
                  script.onload = function () {
                        this.remove();
                  };
                  (document.head || document.documentElement).appendChild(script);
                  console.log('[content.js] Injected network patch script.');
            } catch (e) {
                  console.warn('[content.js] Failed to inject network patch script:', e);
            }
      })();

      // Listen for postMessage from injected script for network activity
      window.addEventListener('message', function (event) {
            if (event && event.data && event.data.source === 'search-extension-network' && event.data.type === 'NETWORK_ACTIVITY') {
                  // Only update if this is the currently active tab
                  const isChromeTabsQueryAvailable = (chrome && chrome.tabs && chrome.tabs.query);
                  if (isChromeTabsQueryAvailable) {
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                              const isCurrentTabActive = (
                                    tabs && tabs.length &&
                                    tabs[0].id === (
                                          window.chrome && window.chrome.devtools && window.chrome.devtools.inspectedWindow
                                                ? window.chrome.devtools.inspectedWindow.tabId
                                                : tabs[0].id
                                    )
                              );
                              if (isCurrentTabActive) {
                                    console.log('[content.js] Detected network activity for active tab. Reapplying highlights.');
                                    autoApplyFromStorage();
                              } else {
                                    console.log('[content.js] Network activity not for active tab, ignoring.');
                              }
                        });
                  } else {
                        // Fallback: always update if unable to check tab
                        console.log('[content.js] Detected network activity (tab check unavailable). Reapplying highlights.');
                        autoApplyFromStorage();
                  }
            }
      });
})();
