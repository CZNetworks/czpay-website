/**
 * CZPAY — main.js
 * Handles: mobile menu, FAQ accordion, swap calculator,
 *          active nav highlight, scroll-to-top, fade-up animations.
 */

(function () {
  'use strict';

  /* --------------------------------------------------
     Exchange rate — fetched live from CoinGecko
     Falls back to a hard-coded demo rate on error.
  -------------------------------------------------- */
  let RATE_USDT_TO_TRX = 7.42;   // 1 USDT = N TRX (updated by fetchRate)
  const FEE_RATE        = 0.003;  // 0.3 %

  /* --------------------------------------------------
     Live exchange rate from CoinGecko
  -------------------------------------------------- */
  function fetchRate() {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd', {
      cache: 'no-cache'
    })
      .then(r => r.json())
      .then(data => {
        const trxUsd = data && data.tron && data.tron.usd;
        if (trxUsd && trxUsd > 0) {
          // 1 USDT ≈ 1 USD, so 1 USDT = (1 / trxUsd) TRX
          RATE_USDT_TO_TRX = parseFloat((1 / trxUsd).toFixed(4));
          calcAndDisplay();
        }
      })
      .catch(() => {
        // Silently fall back to the default rate already set
      });
  }

  fetchRate();
  // Refresh rate every 60 seconds
  setInterval(fetchRate, 60000);

  /* --------------------------------------------------
     Helpers
  -------------------------------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function formatNum(n, decimals = 2) {
    if (isNaN(n)) return '0.00';
    return parseFloat(n.toFixed(decimals)).toLocaleString('ko-KR');
  }

  /* --------------------------------------------------
     Mobile menu (hamburger)
  -------------------------------------------------- */
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      hamburger.setAttribute(
        'aria-expanded',
        hamburger.classList.contains('open').toString()
      );
    });

    // Close when a link is clicked
    $$('a', mobileMenu).forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* --------------------------------------------------
     Active nav link on scroll (Intersection Observer)
  -------------------------------------------------- */
  const sections  = $$('section[id]');
  const navLinks  = $$('.nav-links a[href^="#"]');

  function setActiveLink(id) {
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
    });
  }

  if (sections.length && navLinks.length) {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveLink(e.target.id); });
      },
      { rootMargin: '-50% 0px -50% 0px' }
    );
    sections.forEach(s => io.observe(s));
  }

  /* --------------------------------------------------
     Scroll-to-top button
  -------------------------------------------------- */
  const scrollTopBtn = $('#scroll-top');

  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --------------------------------------------------
     Fade-up on scroll
  -------------------------------------------------- */
  const fadeEls = $$('.fade-up');

  if (fadeEls.length) {
    // Store the DOM-order index on each element so the stagger delay is stable
    // regardless of which batch an IntersectionObserver entry fires in.
    fadeEls.forEach((el, idx) => { el.dataset.fadeIndex = idx; });

    const fadeIO = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.style.transitionDelay = `${Number(e.target.dataset.fadeIndex) * 0.07}s`;
            e.target.classList.add('visible');
            fadeIO.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    fadeEls.forEach(el => fadeIO.observe(el));
  }

  /* --------------------------------------------------
     Swap calculator
  -------------------------------------------------- */
  const inputFrom   = $('#swap-from');
  const inputTo     = $('#swap-to');
  const swapArrow   = $('#swap-arrow');
  const rateDisplay = $('#rate-display');
  const feeDisplay  = $('#fee-display');

  // Tracks which direction is active: 'usdt_to_trx' | 'trx_to_usdt'
  let direction = 'usdt_to_trx';

  function calcAndDisplay() {
    if (!inputFrom || !inputTo) return;

    const raw = parseFloat(inputFrom.value) || 0;

    let out, fee;
    if (direction === 'usdt_to_trx') {
      fee = raw * FEE_RATE;
      out = (raw - fee) * RATE_USDT_TO_TRX;
      if (rateDisplay) rateDisplay.textContent = `1 USDT = ${RATE_USDT_TO_TRX} TRX`;
    } else {
      fee = raw * FEE_RATE;
      out = (raw - fee) / RATE_USDT_TO_TRX;
      if (rateDisplay) rateDisplay.textContent = `1 TRX = ${(1 / RATE_USDT_TO_TRX).toFixed(4)} USDT`;
    }

    inputTo.value = out > 0 ? formatNum(out, 4) : '';
    if (feeDisplay) feeDisplay.textContent = `수수료: ${formatNum(fee, 4)} ${direction === 'usdt_to_trx' ? 'USDT' : 'TRX'}`;
  }

  if (inputFrom) {
    inputFrom.addEventListener('input', calcAndDisplay);
    calcAndDisplay(); // initial render
  }

  if (swapArrow) {
    swapArrow.addEventListener('click', () => {
      direction = direction === 'usdt_to_trx' ? 'trx_to_usdt' : 'usdt_to_trx';

      // Swap coin badge labels
      const fromBadge  = $('#from-coin-name');
      const toBadge    = $('#to-coin-name');
      const fromIcon   = $('#from-coin-icon');
      const toIcon     = $('#to-coin-icon');

      if (fromBadge && toBadge) {
        const tmpText = fromBadge.textContent;
        fromBadge.textContent = toBadge.textContent;
        toBadge.textContent   = tmpText;
      }

      if (fromIcon && toIcon) {
        const tmpClass = fromIcon.className;
        fromIcon.className = toIcon.className;
        toIcon.className   = tmpClass;

        const tmpText2 = fromIcon.textContent;
        fromIcon.textContent = toIcon.textContent;
        toIcon.textContent   = tmpText2;
      }

      // Swap values
      if (inputFrom && inputTo) {
        inputFrom.value = '';
        inputTo.value   = '';
      }

      calcAndDisplay();
    });
  }

  /* --------------------------------------------------
     FAQ Accordion
  -------------------------------------------------- */
  $$('.faq-item').forEach(item => {
    const btn = $('.faq-question', item);
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all
      $$('.faq-item.open').forEach(i => i.classList.remove('open'));
      // Toggle current
      if (!isOpen) item.classList.add('open');
    });
  });

  /* --------------------------------------------------
     Stat counter animation
  -------------------------------------------------- */
  function animateCount(el, target, duration = 1600, suffix = '') {
    const start    = performance.now();
    const isFloat  = target % 1 !== 0;

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current  = eased * target;

      el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString('ko-KR')) + suffix;

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const statsIO = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const raw = el.dataset.target;
        const suffix = el.dataset.suffix || '';
        animateCount(el, parseFloat(raw), 1800, suffix);
        statsIO.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );

  $$('[data-target]').forEach(el => statsIO.observe(el));

})();
