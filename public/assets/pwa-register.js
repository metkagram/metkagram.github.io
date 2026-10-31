// Registration is deliberately separate from learning interactions.
// HTTPS (or local secure contexts) is required; the website works without it.
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js", {
      scope: "/",
      updateViaCache: "none"
    }).catch((error) => {
      console.warn("Metkagram: service worker registration failed", error);
    });
  });
}
