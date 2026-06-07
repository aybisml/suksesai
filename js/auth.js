// auth.js — Validasi via JSONP (bypass CSP Canvas Gemini)
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzkiLJ7CZRX41IxFnKdJ-xxS3EPqzFjUQ5k15D2XrDFMsiKu-yR5Rr1PXwedsA0NCd8YQ/exec";

function checkAccess(email) {
  return new Promise((resolve) => {
    if (!email) return resolve(false);

    // Buat callback unik
    const cb = "cb_" + Math.random().toString(36).slice(2);

    // Timeout 10 detik
    const timer = setTimeout(() => {
      delete window[cb];
      if (script.parentNode) script.parentNode.removeChild(script);
      resolve(false);
    }, 10000);

    // JSONP callback
    window[cb] = function (data) {
      clearTimeout(timer);
      delete window[cb];
      if (script.parentNode) script.parentNode.removeChild(script);
      resolve(data && data.allowed === true);
    };

    // Inject script tag — tidak kena CSP fetch restriction
    const script = document.createElement("script");
    const params = new URLSearchParams({
      email: email.toLowerCase().trim(),
      callback: cb,
      ref: location.hostname,
    });
    script.src = APPS_SCRIPT_URL + "?" + params.toString();
    script.onerror = () => {
      clearTimeout(timer);
      delete window[cb];
      resolve(false);
    };
    document.head.appendChild(script);
  });
}
