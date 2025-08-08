"use strict";

(function () {
      const highlightColor = '#FFA500';
      const textColor = '#000000';
      const highlightTag = 'MARK';

      function highlightMatchInNode(match, node) {
            const matchText = match[0];
            const matchIndex = match.index;
            node.splitText(matchIndex + matchText.length);
            const middleNode = node.splitText(matchIndex);
            const mark = document.createElement(highlightTag);
            mark.style.backgroundColor = highlightColor;
            mark.style.color = textColor;
            mark.style.borderRadius = '3px';
            mark.textContent = middleNode.nodeValue;
            middleNode.parentNode.replaceChild(mark, middleNode);
      }

      function highlightKeywords(keywords) {
            if (!keywords || !keywords.length) return;

            let occurrenceCount = 0;
            const regex = new RegExp(
                  keywords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
                  'gi'
            );

            const isHighlightableTextNode = {
                  acceptNode: function (node) {
                        const parentTag = node.parentElement.tagName;
                        if (
                              parentTag === 'SCRIPT' ||
                              parentTag === 'STYLE' ||
                              parentTag === 'NOSCRIPT' ||
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
                  }
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
                  matches.reverse().forEach(match => highlightMatchInNode(match, node));
            });

            console.log(`🧡 Found and highlighted ${occurrenceCount} keyword occurrence(s).`);
      }

      // Listen for messages from the popup
      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
            if (msg.type === 'HIGHLIGHT_WORDS' && typeof msg.wordsRaw === 'string') {
                  const words = msg.wordsRaw.split('\n').map(w => w.trim()).filter(Boolean);
                  highlightKeywords(words);
            }
      });
})();
