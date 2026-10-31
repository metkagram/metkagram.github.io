# Metkagram installable web app

Metkagram is a progressively enhanced GitHub Pages website, not a repackaged native Android or iOS application. The production PWA is available **only after the change has been merged and the Pages deployment succeeds**.

## Install without an app store

- **Android (Chrome):** visit https://metkagram.github.io/en/ over HTTPS; open Chrome's **⋮** menu and choose **Install app** (or **Add to Home screen**) and confirm. Depending on device, browser and availability of WebAPK packaging, this can be an installed standalone web app or merely a browser shortcut. Samsung Internet may also offer installation.
- **iPhone (Safari):** visit the same URL; tap **Share** → **Add to Home Screen**, enable **Open as Web App** if available, then **Add**. iOS does not offer the Chromium-style install prompt. Installation on a real iPhone must be tested on the device, not inferred from desktop emulation.
- Users can also install from the root gateway; the manifest always launches **/en/**. Russian remains available through the existing language switch. The installed app has a stable ID and root scope, so every canonical Metkagram route belongs to the same app.

No App Store or Google Play developer account is needed for these browser-based installation paths. Users can discover Metkagram via its website, QR code or shared URL. Store listing, native-only APIs, APK/IPA distribution and platform-specific discoverability are separate matters.

## Current implementation

- The existing `public/assets/web/site.webmanifest` has an explicit `id`, `start_url`, `scope`, standalone presentation, and existing 192/512 PNG icons.
- Existing page templates and the canonical multilingual root gateway link the manifest, touch icon and a small registration script. Canonicals, slugs, sitemap/robots and content generation remain unchanged.
- The root-scoped `public/service-worker.js` keeps a **small versioned public shell cache**: English/Russian home screens, stylesheet, base JavaScript and app icons, plus a separate `noindex` offline fallback.
- **Network first** on navigations and cached shell assets. Only the two home screens and explicit shell assets are written to Cache Storage. Other routes return an offline information page when no network is available; they are **not** silently served with stale lesson content.
- Canonical lesson HTML, curriculum files, `/data/`, `/api/`, downloads, requests to other origins, localStorage and progress are not cached or modified by the service worker. Offline practice, sync and notifications are **not** promised. Some advanced home-page features also require the network.
- Old workers are not force-replaced via `skipWaiting()`; existing tabs finish normally. After activation the new worker removes only prior `metkagram-shell-*` cache versions. Successful online navigation fetches fresh resources. **Bump `CACHE_VERSION` when changing precached shell resources or offline behavior** to retire outdated offline copies. Do not indiscriminately clear site storage, as learner progress may be stored there.

## Verify

1. `npm run verify` validates the full build and Node tests, including `tests/pwa.test.mjs`.
2. `npx playwright install --with-deps chromium` and `npm run test:e2e` run desktop/mobile-viewport checks. The PWA-specific CI job runs `tests/e2e/pwa.spec.mjs` on both projects.
3. In a real Chromium browser with DevTools: inspect **Application → Manifest** for install metadata and installability warnings, and **Application → Service Workers** for the active worker. Check **Offline** mode on a previously controlled session; the home screen must load and a non-precached lesson must show the offline message.
4. On an actual Android phone, install via browser and confirm the icon and standalone launch. Repeat on iPhone Safari. CI viewport emulation is **not** physical Android/iOS testing.
5. Production verification requires merging to `main` and completing the `deploy-pages.yml` workflow. A PR alone does **not** update the live installable app.

## Distribution limitations

PWAs normally update from the HTTPS origin. Android may use a generated WebAPK or only a shortcut. iOS requires manual Add to Home Screen; installed web apps can have isolated storage, and available platform APIs, background execution and notifications vary by operating system and permissions. Browser-installed web apps are not automatically listed in Google Play or the Apple App Store. Creating a native store package is a separate process, which may incur developer-account and review requirements.
