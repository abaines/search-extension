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
            mark.style.backgroundColor = highlightColor;
            mark.style.color = textColor;
            mark.style.borderRadius = "3px";
            mark.textContent = middleNode.nodeValue;
            middleNode.parentNode.replaceChild(mark, middleNode);
      }

      function highlightKeywords(keywords) {
            if (!keywords || !keywords.length) return;

            let occurrenceCount = 0;
            const regex = new RegExp(
                  keywords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
                  "gi"
            );

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

            nodes.forEach(function (node) {
                  const matches = [...node.nodeValue.matchAll(regex)];
                  occurrenceCount += matches.length;
                  matches.reverse().forEach((match) => highlightMatchInNode(match, node));
            });

            // Send count to background for badge
            const highlightCountMessage = `🧡 Found and highlighted ${occurrenceCount} keyword occurrence(s).`;
            if (chrome.runtime && chrome.runtime.sendMessage) {
                  chrome.runtime.sendMessage({ type: "SET_BADGE_COUNT", count: occurrenceCount });
                  console.log(highlightCountMessage + ' (sent to background)');
            } else {
                  console.warn(highlightCountMessage + ' (chrome.runtime.sendMessage not available)');
            }
      }

      function handleHighlightWordsMessage(msg, sender, sendResponse) {
            if (msg.type === "HIGHLIGHT_WORDS" && typeof msg.wordsRaw === "string") {
                  const words = msg.wordsRaw.split("\n").map((w) => w.trim()).filter(Boolean);
                  highlightKeywords(words);
                  console.log('[content.js] Received HIGHLIGHT_WORDS message:', msg.wordsRaw);
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

      autoApplyFromStorage();
})();
