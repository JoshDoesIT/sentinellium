/**
 * @module Sentinellium Extension — Background Service Worker
 * @description Manifest V3 service worker that orchestrates the three
 * security engines: Context (phishing), Provenance (C2PA), and DLP.
 *
 * Runs as an event-driven service worker — no persistent background page.
 */

export default defineBackground(() => {
    console.log('Sentinellium background service worker loaded', {
        id: browser.runtime.id,
    });
});
