/* ============================================================================
   Ember — Cinematic Coffee Scroll-Scrubbed Experience Engine
   Adapted from scroll-world references (portable, framework-agnostic, zero dependencies)
   ============================================================================ */

function mountScrollWorld(container, config) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const smallMQ = window.matchMedia('(max-width: 860px)');
  const isMobile = () => coarse || smallMQ.matches;

  const SECTIONS = config.sections || [];
  const N = SECTIONS.length;
  if (!N) return;

  injectCSS();
  container.classList.add('sw-root');

  // ---- 1. DOM Elements ----
  // Loading Overlay
  const loader = el('div', 'sw-loader');
  loader.innerHTML = `
    <div class="sw-loader__spinner">
      <span class="sw-loader__ring"></span>
      <span class="sw-loader__core"></span>
    </div>
    <div class="sw-loader__title">EMBER</div>
    <div class="sw-loader__sub">Brewing Experience...</div>
  `;
  container.appendChild(loader);

  // Background Atmosphere & Particles
  const sky = el('div', 'sw-sky');
  sky.appendChild(el('div', 'sw-sky__grad'));
  sky.appendChild(el('div', 'sw-sky__glow'));
  const particles = el('div', 'sw-particles');
  sky.appendChild(particles);

  // Scroll Progress Bar
  const scrollbar = el('div', 'sw-scrollbar');
  const scrollbarFill = el('span');
  scrollbar.appendChild(scrollbarFill);

  // Top Sticky Bar
  const topbar = el('div', 'sw-topbar');
  if (config.brand) {
    const brand = el('a', 'sw-brand');
    brand.href = config.brand.href || '#top';
    const mark = el('span', 'sw-brand__mark');
    const name = el('span', 'sw-brand__name');
    name.textContent = config.brand.name || 'EMBER';
    brand.appendChild(mark);
    brand.appendChild(name);
    brand.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', window.location.pathname + window.location.search);
    });
    topbar.appendChild(brand);
  }

  // Navigation Links
  const nav = el('nav', 'sw-nav');
  if (config.nav !== false) topbar.appendChild(nav);

  // Top Action Button
  if (config.cta && config.cta.label) {
    const topCta = el('a', 'sw-topcta');
    topCta.href = config.cta.href || '#enjoy';
    topCta.textContent = config.cta.label;
    topCta.addEventListener('click', (e) => {
      e.preventDefault();
      jumpTo(N - 1);
      history.replaceState(null, '', '#' + (SECTIONS[N - 1]?.id || 'enjoy'));
    });
    topbar.appendChild(topCta);
  }

  // Video Stage (Fixed Full-Screen Background)
  const stage = el('div', 'sw-stage');

  // Video Poster / Reduced-motion Stills Layer
  const stillImg = el('img', 'sw-stage__still');
  stillImg.alt = 'Ember Coffee';
  stillImg.src = config.poster || 'assets/poster.webp';
  stage.appendChild(stillImg);

  // Master Video Element
  let video = null;
  if (!reduce) {
    video = document.createElement('video');
    video.className = 'sw-stage__video';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    // Select desktop 1080p vs mobile 720p
    const videoSrc = (isMobile() && config.videoMobile) ? config.videoMobile : (config.video || 'assets/coffee-scrub-1080p.mp4');

    fetch(videoSrc)
      .then(r => r.ok ? r.blob() : Promise.reject(new Error('Fetch failed')))
      .then(blob => {
        video.src = URL.createObjectURL(blob);
      })
      .catch(() => {
        video.src = videoSrc;
      });

    video.addEventListener('loadedmetadata', () => {
      layout();
      read();
    });

    video.addEventListener('loadeddata', () => {
      setTimeout(() => {
        loader.classList.add('is-hidden');
      }, 350);
    });

    video.addEventListener('seeked', () => {
      stage.classList.add('has-clip');
    }, { once: true });

    stage.appendChild(video);
  } else {
    // Under reduced motion, dismiss loader immediately
    setTimeout(() => {
      loader.classList.add('is-hidden');
    }, 250);
  }

  // Copy Layer (Text Narrative Cards)
  const copylayer = el('div', 'sw-copylayer');

  // Right Route Indicator Dots
  const route = el('div', 'sw-route');

  // Bottom Scroll Hint
  const hint = el('div', 'sw-hint');
  const hintText = el('span');
  hintText.textContent = config.hint || 'SCROLL TO EXPLORE';
  hint.appendChild(hintText);
  hint.appendChild(el('i'));

  // Virtual Scroll Track
  const track = el('div', 'sw-track');

  // Append Main Structure
  [sky, scrollbar, topbar, stage, copylayer, route, hint, track].forEach(n => container.appendChild(n));

  // Build Section Cards & Navigation Items
  const copies = [];
  const dots = [];

  SECTIONS.forEach((s, i) => {
    const c = el('article', 'sw-copy');
    if (s.id) c.id = s.id;
    c.style.setProperty('--sw-accent', s.accent || '#e58e26');
    c.innerHTML = `
      ${s.eyebrow ? `<span class="sw-copy__eyebrow">${esc(s.eyebrow)}</span>` : ''}
      ${s.title ? `<h2 class="sw-copy__title">${esc(s.title)}</h2>` : ''}
      ${s.body ? `<p class="sw-copy__body">${esc(s.body)}</p>` : ''}
      ${s.tags && s.tags.length ? `<ul class="sw-copy__tags">${s.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      ${s.cta ? `<div class="sw-copy__cta">${ctaBtns(s.cta)}</div>` : ''}
    `;
    copylayer.appendChild(c);
    copies.push(c);

    // Route Dots
    const dot = el('button', 'sw-route__dot');
    dot.setAttribute('aria-label', s.label || `Stage ${i + 1}`);
    dot.style.setProperty('--sw-accent', s.accent || '#e58e26');
    dot.innerHTML = `<span class="sw-route__label">${esc(s.label || '')}</span><i></i>`;
    dot.addEventListener('click', () => jumpTo(i));
    route.appendChild(dot);
    dots.push(dot);

    // Nav Items
    if (config.nav !== false) {
      const b = el('button', 'sw-nav__item');
      b.textContent = s.label || '';
      b.addEventListener('click', () => jumpTo(i));
      nav.appendChild(b);
    }
  });

  // ---- 2. Mathematical Layout & Scrub Physics ----
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

  const SCROLL_PER_SECTION = config.scrollPerSection || 1.6;
  let vh = window.innerHeight;
  let totalScrollHeight = 0;
  let activeIndex = -1;
  let ticking = false;
  let targetProgress = 0;
  let curProgress = 0;

  function layout() {
    vh = window.innerHeight;
    totalScrollHeight = (N * SCROLL_PER_SECTION) * vh;
    // Provide comfortable scroll runway (1.2vh) at the bottom so the finale rests cleanly in view
    track.style.height = (totalScrollHeight + vh * 1.2) + 'px';
    read();
  }

  function jumpTo(i) {
    let targetScrollY = 0;
    if (i === N - 1) {
      targetScrollY = totalScrollHeight;
    } else {
      const sectionFraction = (i + 0.5) / N;
      targetScrollY = sectionFraction * totalScrollHeight;
    }
    window.scrollTo({
      top: targetScrollY,
      behavior: reduce ? 'auto' : 'smooth'
    });
    const sId = SECTIONS[i]?.id;
    if (sId) {
      history.replaceState(null, '', '#' + sId);
    }
  }

  // Scroll Update Handler
  function read() {
    const y = window.scrollY || window.pageYOffset;
    const progress = clamp(y / totalScrollHeight, 0, 1);
    targetProgress = progress;

    // Track scroll bar width
    scrollbarFill.style.transform = `scaleX(${progress})`;

    // Fade out hint after first scroll
    hint.style.opacity = clamp(1 - y / (0.35 * vh));

    // Section copy positions & opacities
    for (let i = 0; i < N; i++) {
      let opacity = 0;
      let translateY = 0;

      if (i === N - 1) {
        // Last section (Enjoy): locks in cleanly and stays fully visible through final scroll position
        const entryThreshold = (i - 0.45) / N;
        const peakThreshold = (i + 0.1) / N;
        if (progress < entryThreshold) {
          opacity = 0;
        } else if (progress < peakThreshold) {
          opacity = smooth((progress - entryThreshold) / (peakThreshold - entryThreshold));
          translateY = (1 - (progress - entryThreshold) / (peakThreshold - entryThreshold)) * 14;
        } else {
          opacity = 1.0;
          translateY = 0;
        }
      } else if (i === 0) {
        // First section (Select): fully hidden during the Hero banner phase (progress < 0.035)
        const entryStart = 0.035;
        const entryPeak = 0.085;
        const exitStart = 0.16;
        const exitEnd = 0.23;
        if (progress < entryStart) {
          opacity = 0;
          translateY = 14;
        } else if (progress < entryPeak) {
          const r = (progress - entryStart) / (entryPeak - entryStart);
          opacity = smooth(r);
          translateY = (1 - r) * 14;
        } else if (progress <= exitStart) {
          opacity = 1.0;
          translateY = 0;
        } else if (progress <= exitEnd) {
          const r = (progress - exitStart) / (exitEnd - exitStart);
          opacity = smooth(1 - r);
          translateY = -r * 14;
        } else {
          opacity = 0;
          translateY = -14;
        }
      } else {
        const sectionCenter = (i + 0.5) / N;
        const distFromCenter = Math.abs(progress - sectionCenter) * N;
        opacity = smooth(1 - distFromCenter * 1.6);
        translateY = (0.5 - (progress * N - i)) * 14;
      }

      const c = copies[i];
      c.style.opacity = opacity;
      c.style.transform = reduce ? 'none' : `translate3d(0, ${translateY}px, 0)`;
      c.style.pointerEvents = opacity > 0.4 ? 'auto' : 'none';
      c.style.visibility = opacity > 0.005 ? 'visible' : 'hidden';

      // Under reduced motion, update still image source according to section
      if (reduce && opacity > 0.5 && SECTIONS[i].still) {
        stillImg.src = SECTIONS[i].still;
      }
    }

    // Determine currently active section
    const activeSection = clamp(Math.floor(progress * N), 0, N - 1);
    if (activeSection !== activeIndex) {
      activeIndex = activeSection;
      dots.forEach((d, k) => d.classList.toggle('is-active', k === activeSection));
      nav.querySelectorAll('.sw-nav__item').forEach((n, k) => n.classList.toggle('is-active', k === activeSection));
      container.style.setProperty('--sw-accent', SECTIONS[activeSection].accent || '#e58e26');
    }

    // Keep URL hash in sync with visible stage (or clear when at hero top)
    if (progress < 0.035 || y < 60) {
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } else {
      const targetHash = '#' + (SECTIONS[activeSection]?.id || '');
      if (targetHash !== '#' && window.location.hash !== targetHash) {
        history.replaceState(null, '', targetHash);
      }
    }

    // Subtle drift on atmosphere
    if (particles) {
      particles.style.transform = `translate3d(0, ${-y * 0.04}px, 0)`;
    }

    ticking = false;
  }

  // RequestAnimationFrame Smooth Scrubbing Loop
  function raf() {
    if (video && video.duration) {
      // Coalesced seek: never pile up seeking commands while decoder is busy
      if (!video.seeking) {
        // Smooth lerp towards target scroll progress
        curProgress += (targetProgress - curProgress) * (reduce ? 1 : 0.16);
        const targetSec = clamp(curProgress, 0, 0.999) * video.duration;

        const eps = isMobile() ? 0.03 : 0.008;
        if (Math.abs(video.currentTime - targetSec) > eps) {
          try {
            video.currentTime = targetSec;
          } catch (e) {}
        }
      }
    }
    requestAnimationFrame(raf);
  }

  // Mobile Touch Priming (iOS & Android autoplay unlock)
  let userReady = false;
  function onFirstGesture() {
    if (userReady || !video) return;
    userReady = true;
    try {
      const p = video.play();
      if (p && p.then) {
        p.then(() => {
          try { video.pause(); } catch (e) {}
        }).catch(() => {});
      }
    } catch (e) {}
  }
  window.addEventListener('pointerdown', onFirstGesture, { once: true, passive: true });
  window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });

  // Listeners
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(read);
    }
  }, { passive: true });

  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', layout);
  window.addEventListener('load', layout);

  // Initialize Particles & Engine
  seedParticles(particles, reduce || coarse);
  layout();

  // Clear lingering hash on initial load if starting at the top so #enjoy never lingers at the top
  if (window.scrollY < 80 && window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  requestAnimationFrame(raf);

  // Fallback safety timeout for loader
  setTimeout(() => {
    loader.classList.add('is-hidden');
  }, 3500);

  // ---- 3. Helpers ----
  function el(tag, cls) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function ctaBtns(cta) {
    let h = '';
    if (cta.primary) {
      h += `<a class="sw-btn sw-btn--primary" href="${esc(cta.primary.href || '#')}">${esc(cta.primary.label)}</a>`;
    }
    if (cta.secondary) {
      h += `<a class="sw-btn sw-btn--ghost" href="${esc(cta.secondary.href || '#')}">${esc(cta.secondary.label)}</a>`;
    }
    return h;
  }
}

// Particle generator
function seedParticles(host, reduce) {
  if (!host || reduce) return;
  const kinds = ['dot', 'dot', 'glow'];
  for (let k = 0; k < 28; k++) {
    const s = document.createElement('span');
    s.className = 'sw-pt sw-pt--' + kinds[k % kinds.length];
    s.style.left = ((k * 37) % 96) + 'vw';
    s.style.top = ((k * 29) % 94) + 'vh';
    s.style.setProperty('--sw-sc', (0.5 + (k % 5) * 0.2).toFixed(2));
    const dur = 12 + (k % 18);
    s.style.animationDuration = dur + 's';
    s.style.animationDelay = (-(k * 1.5)) + 's';
    host.appendChild(s);
  }
}

// Custom CSS Injector
function injectCSS() {
  if (document.getElementById('sw-css')) return;
  const css = `
    .sw-root {
      --sw-bg: #090605;
      --sw-ink: #f8efe6;
      --sw-ink-soft: #b09e91;
      --sw-accent: #e58e26;
      --sw-font-display: "Cinzel", "Playfair Display", Georgia, serif;
      --sw-font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      --sw-nav-height: clamp(52px, 7vh, 64px);
      color: var(--sw-ink);
      font-family: var(--sw-font-body);
      background: var(--sw-bg);
      min-height: 100vh;
    }
    html, body {
      margin: 0;
      background: #090605;
      overflow-x: hidden;
    }

    /* Loader */
    .sw-loader {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: #090605;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 18px;
      transition: opacity 0.6s ease, visibility 0.6s;
    }
    .sw-loader.is-hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    .sw-loader__spinner {
      position: relative;
      width: 54px;
      height: 54px;
    }
    .sw-loader__ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid rgba(229, 142, 38, 0.15);
      border-top-color: var(--sw-accent);
      animation: sw-spin 1.1s linear infinite;
    }
    .sw-loader__core {
      position: absolute;
      inset: 16px;
      border-radius: 50%;
      background: var(--sw-accent);
      box-shadow: 0 0 16px var(--sw-accent);
      animation: sw-pulse 1.6s ease-in-out infinite alternate;
    }
    .sw-loader__title {
      font-family: var(--sw-font-display);
      font-size: 1.4rem;
      letter-spacing: 0.28em;
      color: #fff;
      font-weight: 700;
      text-indent: 0.28em;
    }
    .sw-loader__sub {
      font-size: 0.78rem;
      letter-spacing: 0.16em;
      color: var(--sw-ink-soft);
      text-transform: uppercase;
    }

    @keyframes sw-spin { to { transform: rotate(360deg); } }
    @keyframes sw-pulse { from { opacity: 0.4; transform: scale(0.85); } to { opacity: 1; transform: scale(1.1); } }

    /* Fixed Stage & Video */
    .sw-stage {
      position: fixed;
      inset: 0;
      z-index: 10;
      pointer-events: none;
      overflow: hidden;
      background: #090605;
    }
    .sw-stage__video, .sw-stage__still {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center center;
    }
    .sw-stage.has-clip .sw-stage__still {
      opacity: 0;
      transition: opacity 0.5s ease;
    }

    /* Atmosphere */
    .sw-sky {
      position: fixed;
      inset: 0;
      z-index: 12;
      pointer-events: none;
    }
    .sw-sky__grad {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, rgba(229, 142, 38, 0.08) 0%, transparent 70%);
    }
    .sw-sky__glow {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(9, 6, 5, 0.6) 0%, rgba(9, 6, 5, 0.1) 40%, rgba(9, 6, 5, 0.7) 100%);
    }
    .sw-particles {
      position: absolute;
      inset: 0;
      will-change: transform;
    }
    .sw-pt {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      opacity: 0;
      animation: sw-ember-float linear infinite;
    }
    .sw-pt--dot {
      background: #ffaa33;
      box-shadow: 0 0 6px #ff7700;
    }
    .sw-pt--glow {
      background: #ffcc55;
      box-shadow: 0 0 10px #ff9922;
    }
    @keyframes sw-ember-float {
      0% { opacity: 0; transform: scale(var(--sw-sc, 1)) translateY(60px); }
      20% { opacity: 0.65; }
      80% { opacity: 0.5; }
      100% { opacity: 0; transform: scale(var(--sw-sc, 1)) translateY(-180px) translateX(25px); }
    }

    /* Topbar */
    .sw-topbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: var(--sw-nav-height);
      z-index: 60;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 clamp(16px, 3.5vw, 50px);
      box-sizing: border-box;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      background: rgba(9, 6, 5, 0.65);
      border-bottom: 1px solid rgba(229, 142, 38, 0.12);
    }
    .sw-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #fff;
    }
    .sw-brand__mark {
      width: clamp(18px, 2vw, 22px);
      height: clamp(22px, 2.5vw, 26px);
      border-radius: 5px 5px 8px 8px;
      background: linear-gradient(145deg, #ffa726, #e65100);
      box-shadow: 0 0 12px rgba(230, 81, 0, 0.5);
    }
    .sw-brand__name {
      font-family: var(--sw-font-display);
      font-weight: 700;
      font-size: clamp(1.05rem, 1.4vw, 1.25rem);
      letter-spacing: 0.18em;
    }
    .sw-nav {
      display: flex;
      gap: 4px;
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(229, 142, 38, 0.2);
      border-radius: 999px;
    }
    .sw-nav__item {
      font: inherit;
      font-size: clamp(0.72rem, 0.85vw, 0.8rem);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--sw-ink-soft);
      border: 0;
      background: transparent;
      cursor: pointer;
      padding: clamp(5px, 0.8vh, 7px) clamp(10px, 1.2vw, 16px);
      border-radius: 999px;
      transition: color 0.25s, background 0.25s;
    }
    .sw-nav__item:hover {
      color: #fff;
    }
    .sw-nav__item.is-active {
      color: #090605;
      font-weight: 600;
      background: var(--sw-accent);
      box-shadow: 0 0 12px rgba(229, 142, 38, 0.4);
    }
    .sw-topcta {
      text-decoration: none;
      font-weight: 600;
      font-size: clamp(0.75rem, 0.9vw, 0.84rem);
      letter-spacing: 0.05em;
      color: #fff;
      background: linear-gradient(135deg, #e65100, #b23b00);
      padding: clamp(7px, 1vh, 9px) clamp(14px, 1.5vw, 20px);
      border-radius: 999px;
      box-shadow: 0 4px 15px rgba(230, 81, 0, 0.35);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .sw-topcta:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(230, 81, 0, 0.55);
    }

    /* Scrollbar */
    .sw-scrollbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      z-index: 70;
      background: rgba(229, 142, 38, 0.15);
    }
    .sw-scrollbar span {
      display: block;
      height: 100%;
      width: 100%;
      transform-origin: 0 50%;
      transform: scaleX(0);
      background: linear-gradient(90deg, #e65100, #ffa726);
      box-shadow: 0 0 8px #ffa726;
    }

    /* Narrative Copy Layer */
    .sw-copylayer {
      position: fixed;
      inset: 0;
      z-index: 30;
      pointer-events: none;
    }
    .sw-copy {
      position: absolute;
      left: clamp(16px, 5vw, 75px);
      top: calc(var(--sw-nav-height) + clamp(10px, 2vh, 22px));
      width: min(44vw, 470px);
      max-height: calc(100dvh - var(--sw-nav-height) - clamp(20px, 3.5vh, 36px));
      box-sizing: border-box;
      overflow-y: auto;
      overscroll-behavior: contain;
      opacity: 0;
      will-change: opacity, transform;
      padding: clamp(14px, 2vh, 22px) clamp(16px, 2vw, 26px);
      background: rgba(14, 9, 7, 0.72);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(229, 142, 38, 0.24);
      border-radius: clamp(12px, 1.8vh, 18px);
      box-shadow: 0 16px 45px rgba(0, 0, 0, 0.65);
      scrollbar-width: thin;
      scrollbar-color: rgba(229, 142, 38, 0.3) transparent;
    }
    .sw-copy::-webkit-scrollbar {
      width: 4px;
    }
    .sw-copy::-webkit-scrollbar-thumb {
      background: rgba(229, 142, 38, 0.35);
      border-radius: 4px;
    }

    .sw-copy__eyebrow {
      display: block;
      margin: 0;
      font-family: var(--sw-font-body);
      font-weight: 700;
      font-size: clamp(0.68rem, 0.85vw, 0.76rem);
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--sw-accent);
    }
    .sw-copy__title {
      font-family: var(--sw-font-display);
      font-weight: 700;
      color: #fff;
      font-size: clamp(1.6rem, 2.6vw, 2.3rem);
      line-height: 1.1;
      margin: clamp(3px, 0.7vh, 6px) 0 0;
      letter-spacing: -0.01em;
      text-shadow: 0 2px 14px rgba(0, 0, 0, 0.8);
    }
    .sw-copy__body {
      margin-top: clamp(6px, 1.1vh, 12px);
      font-size: clamp(0.82rem, 0.98vw, 0.94rem);
      line-height: 1.48;
      color: var(--sw-ink-soft);
      max-width: 40ch;
    }
    .sw-copy__tags {
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: clamp(4px, 0.7vw, 6px);
      margin: clamp(8px, 1.2vh, 14px) 0 0;
      padding: 0;
    }
    .sw-copy__tags li {
      font-size: clamp(0.66rem, 0.78vw, 0.72rem);
      letter-spacing: 0.04em;
      font-weight: 600;
      color: #ffcc80;
      padding: clamp(3px, 0.4vh, 4px) clamp(7px, 0.9vw, 10px);
      border-radius: 999px;
      background: rgba(229, 142, 38, 0.14);
      border: 1px solid rgba(229, 142, 38, 0.28);
    }
    .sw-copy__cta {
      display: flex;
      flex-wrap: wrap;
      gap: clamp(6px, 1vw, 10px);
      margin-top: clamp(10px, 1.6vh, 18px);
      pointer-events: auto;
    }
    .sw-btn {
      text-decoration: none;
      font-weight: 600;
      font-size: clamp(0.74rem, 0.88vw, 0.84rem);
      letter-spacing: 0.05em;
      padding: clamp(7px, 1vh, 9px) clamp(13px, 1.4vw, 18px);
      border-radius: 999px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .sw-btn--primary {
      color: #090605;
      background: var(--sw-accent);
      box-shadow: 0 4px 18px rgba(229, 142, 38, 0.4);
    }
    .sw-btn--primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(229, 142, 38, 0.6);
    }
    .sw-btn--ghost {
      color: #fff;
      border: 1.5px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(8px);
    }
    .sw-btn--ghost:hover {
      transform: translateY(-2px);
      border-color: #fff;
    }

    /* Route Dots (Right Pagination) */
    .sw-route {
      position: fixed;
      right: clamp(18px, 3vw, 36px);
      top: 50%;
      z-index: 40;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 22px;
      padding: 18px 10px;
    }
    .sw-route::before {
      content: "";
      position: absolute;
      left: 50%;
      top: 20px;
      bottom: 20px;
      width: 2px;
      transform: translateX(-50%);
      background: rgba(229, 142, 38, 0.25);
    }
    .sw-route__dot {
      position: relative;
      border: 0;
      background: transparent;
      cursor: pointer;
      width: 16px;
      height: 16px;
      display: grid;
      place-items: center;
    }
    .sw-route__dot i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(229, 142, 38, 0.35);
      transition: transform 0.3s, background 0.3s, box-shadow 0.3s;
    }
    .sw-route__dot:hover i {
      transform: scale(1.3);
      background: var(--sw-accent);
    }
    .sw-route__dot.is-active i {
      background: #ffa726;
      transform: scale(1.5);
      box-shadow: 0 0 10px #ff9800;
    }
    .sw-route__label {
      position: absolute;
      right: 28px;
      top: 50%;
      transform: translateY(-50%) translateX(8px);
      white-space: nowrap;
      font-size: 0.78rem;
      letter-spacing: 0.1em;
      font-weight: 600;
      text-transform: uppercase;
      color: #fff;
      background: rgba(14, 9, 7, 0.85);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 999px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s, transform 0.25s;
      border: 1px solid rgba(229, 142, 38, 0.25);
    }
    .sw-route__dot:hover .sw-route__label,
    .sw-route__dot.is-active .sw-route__label {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }

    /* Scroll Prompt Hint */
    .sw-hint {
      position: fixed;
      left: 50%;
      bottom: 28px;
      z-index: 40;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      font-size: 0.74rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--sw-ink-soft);
      transition: opacity 0.3s;
      pointer-events: none;
    }
    .sw-hint i {
      width: 20px;
      height: 32px;
      border-radius: 12px;
      border: 2px solid rgba(229, 142, 38, 0.4);
      position: relative;
    }
    .sw-hint i::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 6px;
      width: 3px;
      height: 6px;
      border-radius: 2px;
      background: var(--sw-accent);
      transform: translateX(-50%);
      animation: sw-wheel 1.7s ease-in-out infinite;
    }
    @keyframes sw-wheel {
      0% { opacity: 0; top: 6px; }
      40% { opacity: 1; }
      100% { opacity: 0; top: 16px; }
    }

    .sw-track {
      position: relative;
      z-index: 1;
      width: 100%;
      pointer-events: none;
    }

    /* Mobile Responsive Layout */
    @media (max-width: 860px) {
      .sw-nav { display: none; }
      .sw-copy {
        left: clamp(12px, 4vw, 20px);
        right: clamp(12px, 4vw, 20px);
        width: auto;
        top: calc(var(--sw-nav-height) + clamp(8px, 1.6vh, 14px));
        bottom: auto;
        max-height: calc(100dvh - var(--sw-nav-height) - clamp(14px, 2.5vh, 22px));
        padding: clamp(12px, 1.8vh, 18px) clamp(14px, 3.2vw, 20px);
        border-radius: 14px;
      }
      .sw-copy__title {
        font-size: clamp(1.45rem, 5.2vw, 1.9rem);
      }
      .sw-copy__body {
        font-size: clamp(0.80rem, 3.0vw, 0.88rem);
        line-height: 1.45;
        margin-top: 6px;
      }
      .sw-copy__tags {
        margin-top: 8px;
        gap: 5px;
      }
      .sw-copy__tags li {
        font-size: 0.70rem;
        padding: 3px 8px;
      }
      .sw-copy__cta {
        margin-top: 12px;
        gap: 8px;
      }
      .sw-btn {
        font-size: 0.78rem;
        padding: 7px 15px;
      }
      .sw-route {
        right: 4px;
      }
      .sw-route__label {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .sw-hint i::after { animation: none; }
      .sw-pt { display: none; }
    }
  `;

  const style = document.createElement('style');
  style.id = 'sw-css';
  style.textContent = css;
  document.head.appendChild(style);
}

if (typeof module !== 'undefined' && module.exports) module.exports = { mountScrollWorld };
if (typeof window !== 'undefined') window.mountScrollWorld = mountScrollWorld;
