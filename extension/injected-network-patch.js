// Injected script to patch fetch and XMLHttpRequest in the page context
(function () {
    function notifyContentScript(eventType) {
        window.postMessage({
            source: 'search-extension-network',
            type: eventType
        }, '*');
    }

    // Patch fetch
    if (window.fetch) {
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
            return originalFetch.apply(this, args).then(response => {
                setTimeout(() => notifyContentScript('NETWORK_ACTIVITY'), 0);
                return response;
            });
        };
    }

    // Patch XMLHttpRequest
    if (window.XMLHttpRequest) {
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (...args) {
            this.addEventListener('loadend', function () {
                setTimeout(() => notifyContentScript('NETWORK_ACTIVITY'), 0);
            });
            return originalOpen.apply(this, args);
        };
    }
})();
