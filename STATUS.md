# Ember — Project Status & Overview

## 1. Summary
**Ember** is a cinematic, scroll-scrubbed artisanal coffee landing page. As the user scrolls, a 100% procedural coffee-making background video smoothly scrubs through the 5 stages of the craft: **Select**, **Grind**, **Brew**, **Pour**, and **Enjoy**.

Zero paid services or external image/video assets were used. The video was authored procedurally in Canvas/GSAP, rendered using the HyperFrames CLI at **1920×1080 @ 30fps for 24.0 seconds (720 frames)**, re-encoded with FFmpeg as an All-Intra scrubbable video stream, and wired to the Scroll-World scrub engine.

---

## 2. Latest Updates & Fixes Addressed

### A. URL Hash Synchronization & Clear-on-Load
- **Problem:** `#enjoy` was displaying in the browser address bar when the page was at the top (e.g. from prior navigation or initial state).
- **Solution:**
  - **On Initial Load:** Clears any lingering hash if starting at the top (`window.scrollY < 80`): `history.replaceState(null, '', window.location.pathname + window.location.search)`.
  - **Dynamic Scroll Sync:** As the user scrolls, the URL hash stays strictly in sync with the visible stage:
    - **Hero (top):** Hash is cleared (`""`)
    - **Stage 1 (Select):** `#select`
    - **Stage 2 (Grind):** `#grind`
    - **Stage 3 (Brew):** `#brew`
    - **Stage 4 (Pour):** `#pour`
    - **Stage 5 (Enjoy):** `#enjoy`
  - **Navigation & CTA Sync:** Clicking the top CTA ("Reserve Roaster's Batch") smoothly scrolls to Stage 5 and sets `#enjoy`, clicking the brand logo scrolls to top and clears the hash, and section navigation buttons set `#select` through `#enjoy`.

### B. Hero Visual (Steaming Cup Silhouette & Drifting Beans)
- **Problem:** The hero screen appeared empty on the right side prior to the first scroll.
- **Solution:** Added a subtle, procedural SVG/CSS ambient visual to the hero:
  - **Ambient Warmth Glow:** Soft radial amber glow (`rgba(229, 142, 38, 0.22)`).
  - **Steaming Cup Silhouette:** Handcrafted demitasse cup and saucer silhouette with warm crema surface accent.
  - **Rising Steam Wisps:** 3 animated undulating steam paths rising with staggered keyframe drifting.
  - **Drifting Roasted Beans:** 4 delicate coffee bean silhouettes with organic floating drift and central crease detail.
  - **Responsive & Seamless:** Centered in the right half of the hero at 1366×768 / desktop; fades out cleanly (`opacity: 0`) as the user scrolls into Stage 1.

### C. Stage Eyebrows & Duplicate Label Removal
- Standardized stage headers to single clean line: `01 / 05 — SELECT`, `02 / 05 — GRIND`, `03 / 05 — BREW`, `04 / 05 — POUR`, `05 / 05 — ENJOY`.

### D. Stage 4 Pour Visual (Latte Art Rosetta)
- Authentic blooming 7-tier rosetta pattern with microfoam wings, heart crown, and stem cut.

### E. Re-encoded Scrub Video & Assets (All Under 80 MB)
- `assets/coffee-scrub-1080p.mp4` — **46.63 MB** (All-Intra, keyframe every frame, < 80 MB)
- `assets/coffee-scrub-720p.mp4` — **16.71 MB** (Scaled 720p mobile stream, < 80 MB)
- `assets/poster.webp` — **5.6 KB**
- `assets/stills/` — Stills refreshed (~5–9 KB each)

---

## 3. Automated Browser Verification at 1366×768

Executed automated headless browser testing via Chrome DevTools Protocol (`node test-browser.js`):

| Section | Scroll Y | URL Hash | Visual Elements | Card Bounds | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero** | `0px` | `""` *(clean)* | Steaming Cup & Drifting Beans (opacity: 1) | *No cards visible, tagTop: 89px >= navBottom: 54px* | ✅ **Clean hash, visual active** |
| **Stage 1 (Select)** | `591px` | `#select` | Hero visual faded out (opacity: 0) | Top: 69px, Bottom: 285px (216px high) | ✅ **Hash sync & fully visible** |
| **Stage 2 (Grind)** | `1774px` | `#grind` | Burrs grinding | Top: 69px, Bottom: 285px (216px high) | ✅ **Hash sync & fully visible** |
| **Stage 3 (Brew)** | `2957px` | `#brew` | Extraction stream | Top: 68px, Bottom: 285px (216px high) | ✅ **Hash sync & fully visible** |
| **Stage 4 (Pour)** | `4140px` | `#pour` | Rosetta art bloom | Top: 68px, Bottom: 284px (216px high) | ✅ **Hash sync & fully visible** |
| **Stage 5 (Enjoy)** | `5323px` | `#enjoy` | Finished cup & embers | Top: 69px, Bottom: 331px (262px high) | ✅ **Hash sync & fully visible** |
| **Stage 5 (Enjoy Bottom)** | `5914px` | `#enjoy` | Finished cup & embers | Top: 69px, Bottom: 331px (262px high) | ✅ **Hash sync & buttons in view** |

*All 7 screenshots refreshed and saved to `D:\scroll-demo\coffee-world\_test_shots\`.*

---

## 4. How to Open the Page
1. Ensure the local HTTP server is running:
   ```powershell
   python -m http.server 8080 --directory "D:\scroll-demo\coffee-world"
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```
3. Scroll through all 5 stages using the mouse wheel, trackpad, arrow keys, or navigation links.

---

## 5. Current Status
- **Status:** 100% Complete & Verified. All requirements satisfied.
- **Assets:** Both 1080p and 720p streams are well below the 80 MB hosting threshold.
