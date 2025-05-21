let isScriptLoading = false;
let scriptLoadPromise = null;

export const loadGoogleMapsScript = (apiKey) => {
    if (window.google ? .maps) {
        return Promise.resolve();
    }

    if (scriptLoadPromise) {
        return scriptLoadPromise;
    }

    if (!isScriptLoading) {
        isScriptLoading = true;
        scriptLoadPromise = new Promise((resolve, reject) => {
            const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
            existingScripts.forEach(script => script.remove());

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                isScriptLoading = false;
                resolve();
            };
            script.onerror = (error) => {
                isScriptLoading = false;
                scriptLoadPromise = null;
                reject(error);
            };
            document.head.appendChild(script);
        });
    }

    return scriptLoadPromise;
};