/* ═══════════════════════════════════════════════════════════════════
   WARI COMMAND INTELLIGENCE — Motion layer
   One GSAP vocabulary shared by every page of the command centre.
   Everything degrades to a no-op when GSAP is absent or the visitor
   asks for reduced motion, so app.js never has to branch on it.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var HAS = typeof window.gsap !== 'undefined';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ON = HAS && !REDUCED;
  var TOUCH = window.matchMedia('(hover:none),(pointer:coarse)').matches;

  function list(n) {
    if (!n) return [];
    if (n.nodeType) return [n];
    return Array.prototype.slice.call(n);
  }

  function clearAll(nodes) {
    if (!HAS) return;
    nodes = list(nodes).filter(Boolean);
    if (nodes.length) gsap.set(nodes, { clearProps: 'all' });
  }

  /* ── numbers ──────────────────────────────────────────────────────
     Counts an element's text up to `to`. Keeps a prefix/suffix intact
     so "22 min" and "78%" animate without losing their unit. */
  function countUp(el, to, opts) {
    if (!el) return;
    opts = opts || {};
    var dec = opts.decimals || 0;
    var pre = opts.prefix || '';
    var suf = opts.suffix || '';
    function write(v) { el.textContent = pre + v.toFixed(dec) + suf; }
    if (!ON) { write(to); return; }
    var obj = { v: typeof opts.from === 'number' ? opts.from : 0 };
    write(obj.v);
    gsap.to(obj, {
      v: to,
      duration: opts.duration || 1.1,
      delay: opts.delay || 0,
      ease: opts.ease || 'power2.out',
      overwrite: true,
      onUpdate: function () { write(obj.v); }
    });
  }

  /* Counts up an "a / b" fraction without disturbing the divider. */
  function countFraction(el, a, b) {
    if (!el) return;
    if (!ON) { el.textContent = a + ' / ' + b; return; }
    var obj = { v: 0 };
    gsap.to(obj, {
      v: a, duration: 1, ease: 'power2.out', overwrite: true,
      onUpdate: function () { el.textContent = Math.round(obj.v) + ' / ' + b; }
    });
  }

  /* ── entrances ────────────────────────────────────────────────── */
  function stagger(nodes, opts) {
    nodes = list(nodes);
    if (!nodes.length) return;
    opts = opts || {};
    if (!ON) { clearAll(nodes); return; }
    gsap.killTweensOf(nodes);
    gsap.fromTo(nodes,
      { opacity: 0, y: opts.y == null ? 18 : opts.y },
      {
        opacity: 1, y: 0,
        duration: opts.duration || 0.62,
        stagger: opts.stagger == null ? 0.055 : opts.stagger,
        delay: opts.delay || 0,
        ease: opts.ease || 'power3.out',
        clearProps: 'transform,opacity'
      });
  }

  /* Page-level entrance: header, then cards, then rows — so a tab
     switch reads as one considered movement instead of a hard cut. */
  function revealPage(page) {
    if (!page) return;
    var head = page.querySelector('.page__head');
    var cards = list(page.querySelectorAll('.panel, .dial-card, .mcard, .stat-strip__cell, .report-form'));
    var rows = list(page.querySelectorAll('.loc-card, .camp-card, .fitem, .intel-loc-item, .patient-row'));
    if (!ON) { clearAll([head].concat(cards, rows)); return; }
    var tl = gsap.timeline();
    if (head) {
      tl.fromTo(head, { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'all' });
    }
    if (cards.length) {
      tl.fromTo(cards, { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out', clearProps: 'all' }, '-=0.32');
    }
    if (rows.length) {
      tl.fromTo(rows.slice(0, 18), { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.028, ease: 'power2.out', clearProps: 'all' }, '-=0.42');
    }
    return tl;
  }

  /* ── radial dot ring (dial card) ──────────────────────────────────
     Dots animate outward from the ring's start, so it reads as
     "filling up" rather than simply appearing. */
  function ring(nodes, opts) {
    nodes = list(nodes);
    if (!nodes.length) return;
    opts = opts || {};
    if (!ON) { if (HAS) gsap.set(nodes, { opacity: 1, scale: 1 }); return; }
    gsap.fromTo(nodes,
      { opacity: 0, scale: 0, transformOrigin: '50% 50%' },
      {
        opacity: 1, scale: 1,
        duration: 0.5,
        delay: opts.delay || 0,
        ease: 'back.out(2)',
        stagger: { each: opts.each == null ? 0.012 : opts.each, from: opts.from || 'start' }
      });
  }

  /* ── segmented bar (metric card) ──────────────────────────────── */
  function bars(nodes) {
    nodes = list(nodes);
    if (!nodes.length) return;
    if (!ON) {
      nodes.forEach(function (n) { n.style.width = (n.dataset.w || 0) + '%'; });
      return;
    }
    nodes.forEach(function (n, i) {
      gsap.fromTo(n, { width: '0%' },
        { width: (n.dataset.w || 0) + '%', duration: 0.9, delay: 0.25 + i * 0.08, ease: 'power2.inOut' });
    });
  }

  /* ── gauge arc (intel) ────────────────────────────────────────── */
  function arc(el, pct, circumference) {
    if (!el) return;
    var to = circumference * (1 - pct / 100);
    if (!ON) { el.style.strokeDashoffset = to; return; }
    gsap.fromTo(el,
      { strokeDashoffset: circumference },
      { strokeDashoffset: to, duration: 1.4, ease: 'power3.out', overwrite: true });
  }

  /* ── SVG route path draw-in ───────────────────────────────────── */
  function drawPath(path) {
    if (!path || !ON) return;
    var len;
    try { len = path.getTotalLength(); } catch (e) { return; }
    if (!len) return;
    gsap.fromTo(path,
      { strokeDasharray: len, strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' });
  }

  function pulse(el) {
    if (!el || !ON) return null;
    return gsap.to(el, { scale: 1.7, opacity: 0, transformOrigin: '50% 50%', duration: 1.8, repeat: -1, ease: 'power2.out' });
  }

  /* ── hover behaviours ─────────────────────────────────────────── */
  /* Pointer-tracked tilt. Skipped on touch, where there is no hover
     to track and the transform only fights the scroll. */
  function tilt(el, max) {
    if (!el || !ON || TOUCH) return;
    max = max || 5;
    var xTo = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
    var yTo = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      xTo(((e.clientX - r.left) / r.width - 0.5) * (max * 2));
      yTo(((e.clientY - r.top) / r.height - 0.5) * (-max * 2));
    });
    el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
  }

  function lift(el, opts) {
    if (!el || !ON) return;
    opts = opts || {};
    var y = opts.y == null ? -4 : opts.y;
    var scale = opts.scale == null ? 1.012 : opts.scale;
    el.addEventListener('mouseenter', function () {
      gsap.to(el, { y: y, scale: scale, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
    });
    el.addEventListener('mouseleave', function () {
      gsap.to(el, { y: 0, scale: 1, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
    });
  }

  function magnetic(el, strength) {
    if (!el || !ON || TOUCH) return;
    strength = strength || 0.32;
    var xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
    var yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
  }

  /* ── one-off accents ──────────────────────────────────────────── */
  function pop(el) {
    if (!el || !ON) return;
    gsap.fromTo(el, { scale: 0.82, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.2)', clearProps: 'all' });
  }

  function flipIn(el) {
    if (!el || !ON) return;
    gsap.fromTo(el,
      { opacity: 0, y: -14, rotateX: -45, transformOrigin: 'center top' },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.6, ease: 'power3.out', clearProps: 'all' });
  }

  /* Expand/collapse that animates real height, so an accordion never
     jumps the layout the way a display toggle does. */
  function expand(el, open, onDone) {
    if (!el) return;
    if (!ON) {
      el.style.display = open ? 'block' : 'none';
      if (onDone) onDone();
      return;
    }
    gsap.killTweensOf(el);
    if (open) {
      el.style.display = 'block';
      gsap.fromTo(el, { height: 0, opacity: 0 }, {
        height: 'auto', opacity: 1, duration: 0.42, ease: 'power3.out',
        onComplete: function () { el.style.height = 'auto'; if (onDone) onDone(); }
      });
    } else {
      gsap.to(el, {
        height: 0, opacity: 0, duration: 0.3, ease: 'power2.in',
        onComplete: function () { el.style.display = 'none'; el.style.height = ''; if (onDone) onDone(); }
      });
    }
  }

  /* ── scroll-triggered reveals for the long pages ──────────────── */
  function scrollReveal(nodes) {
    nodes = list(nodes);
    if (!nodes.length || !ON || typeof ScrollTrigger === 'undefined') return;
    nodes.forEach(function (n) {
      gsap.fromTo(n, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: n, start: 'top 92%', once: true }
      });
    });
  }

  function killScrollTriggers(root) {
    if (typeof ScrollTrigger === 'undefined' || !root) return;
    ScrollTrigger.getAll().forEach(function (st) {
      if (st.trigger && root.contains(st.trigger)) st.kill();
    });
  }

  /* ── custom cursor (mirrors the landing page) ─────────────────── */
  function initCursor() {
    if (!ON || TOUCH) return;
    var cur = document.getElementById('cursor');
    if (!cur) return;
    var dot = cur.querySelector('.cursor__dot'), rng = cur.querySelector('.cursor__ring');
    if (!dot || !rng) return;
    var xTo = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    var yTo = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    var rxTo = gsap.quickTo(rng, 'x', { duration: 0.42, ease: 'power3' });
    var ryTo = gsap.quickTo(rng, 'y', { duration: 0.42, ease: 'power3' });
    window.addEventListener('mousemove', function (e) {
      gsap.to(cur, { opacity: 1, duration: 0.3, overwrite: 'auto' });
      xTo(e.clientX); yTo(e.clientY); rxTo(e.clientX); ryTo(e.clientY);
    }, { passive: true });
    document.addEventListener('mouseleave', function () { gsap.to(cur, { opacity: 0, duration: 0.2 }); });
    var hoverables = 'a, button, [data-hover], .loc-card, .camp-card__head, .chip, .intel-loc-item, .patient-row, .ops-map__stop, .ops-map__camp';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(hoverables)) cur.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(hoverables)) cur.classList.remove('is-hover');
    });
  }

  window.WCIMotion = {
    on: ON, reduced: REDUCED, touch: TOUCH,
    countUp: countUp, countFraction: countFraction,
    stagger: stagger, revealPage: revealPage,
    ring: ring, bars: bars, arc: arc, drawPath: drawPath, pulse: pulse,
    tilt: tilt, lift: lift, magnetic: magnetic,
    pop: pop, flipIn: flipIn, expand: expand,
    scrollReveal: scrollReveal, killScrollTriggers: killScrollTriggers,
    initCursor: initCursor
  };
})();
