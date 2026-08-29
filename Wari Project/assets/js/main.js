/* ═══════════════════════════════════════════════════════════════════
   WARI COMMAND INTELLIGENCE — Interface Motion
   GSAP + ScrollTrigger, Lenis smooth scroll.
   Every module degrades safely: if a CDN fails, the page still reads.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var HAS_GSAP   = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var HAS_LENIS  = typeof window.Lenis !== 'undefined';
  var REDUCED    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TOUCH      = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* If GSAP never arrived, unlock every hidden element and bail out of motion. */
  if (!HAS_GSAP) {
    document.documentElement.classList.add('no-gsap');
    console.warn('[Wari] GSAP unavailable — running in static mode.');
  } else {
    gsap.registerPlugin(ScrollTrigger);
  }

  var lenis = null;


  /* ══════════════ 1. SMOOTH SCROLL ══════════════ */
  function initSmoothScroll() {
    if (!HAS_LENIS || !HAS_GSAP || REDUCED) return;

    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.6
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    var el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -10, duration: 1.3 });
    else el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
  }

  function bindAnchors() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#' || !$(id)) return;
        e.preventDefault();
        closeMenu();
        scrollToTarget(id);
      });
    });
  }


  /* ══════════════ 2. ORNAMENT GENERATOR ══════════════
     Builds a radial petal rosette — the geometric vocabulary of
     rangoli and temple ceiling medallions.                         */
  function buildRosettes() {
    $$('[data-rosette]').forEach(function (host) {
      var n = parseInt(host.getAttribute('data-rosette'), 10) || 24;
      var NS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 200 200');
      svg.setAttribute('aria-hidden', 'true');

      var g = document.createElementNS(NS, 'g');
      for (var i = 0; i < n; i++) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', 'M100 94 C 91 62, 93 32, 100 10 C 107 32, 109 62, 100 94 Z');
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', 'currentColor');
        p.setAttribute('stroke-width', i % 2 ? '0.7' : '1.3');
        p.setAttribute('opacity', i % 2 ? '0.45' : '0.9');
        p.setAttribute('transform', 'rotate(' + (i * 360 / n) + ' 100 100)');
        g.appendChild(p);
      }
      svg.appendChild(g);

      [[92, 0.6, 0.55], [86, 1.4, 0.85], [78, 0.5, 0.4]].forEach(function (r) {
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', '100'); c.setAttribute('cy', '100');
        c.setAttribute('r', r[0]); c.setAttribute('fill', 'none');
        c.setAttribute('stroke', 'currentColor');
        c.setAttribute('stroke-width', r[1]);
        c.setAttribute('opacity', r[2]);
        svg.appendChild(c);
      });

      host.appendChild(svg);
      host.__spin = g;
    });
  }


  /* ══════════════ 3. LINE SPLITTER ══════════════
     Wraps each visual line in a masked box so it can rise into view.  */
  function splitLines(el) {
    if (el.dataset.splitDone) return $$('.ln > i', el);
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return [];

    el.textContent = '';
    var frag = document.createDocumentFragment();
    text.split(' ').forEach(function (word, i) {
      var w = document.createElement('span');
      w.className = 'wd';
      w.style.display = 'inline-block';
      w.textContent = word;
      frag.appendChild(w);
      frag.appendChild(document.createTextNode(' '));
      void i;
    });
    el.appendChild(frag);

    /* group words by their vertical offset */
    var words = $$('.wd', el);
    var lines = [];
    var lastTop = null;
    words.forEach(function (w) {
      var top = Math.round(w.offsetTop);
      if (lastTop === null || Math.abs(top - lastTop) > 4) { lines.push([]); lastTop = top; }
      lines[lines.length - 1].push(w.textContent);
    });

    el.textContent = '';
    lines.forEach(function (words) {
      var ln = document.createElement('span');
      ln.className = 'ln';
      var inner = document.createElement('i');
      inner.textContent = words.join(' ');
      ln.appendChild(inner);
      el.appendChild(ln);
    });

    el.dataset.splitDone = '1';
    return $$('.ln > i', el);
  }

  function splitAll() {
    $$('[data-split]').forEach(function (el) {
      var inners = splitLines(el);
      if (HAS_GSAP && !REDUCED) gsap.set(inners, { yPercent: 108 });
    });
  }


  /* ══════════════ 4. PRELOADER ══════════════ */
  function initPreloader(done) {
    var pre = $('#preloader');
    if (!pre) { done(); return; }

    if (!HAS_GSAP || REDUCED) {
      pre.style.display = 'none';
      document.body.classList.remove('is-locked');
      done();
      return;
    }

    document.body.classList.add('is-locked');

    var counter = { v: 0 };
    var tl = gsap.timeline({
      onComplete: function () {
        pre.style.display = 'none';
        document.body.classList.remove('is-locked');
        if (lenis) lenis.start();
        done();
      }
    });

    tl.to('#preProcession .wfig', {
        opacity: 1, y: 0, duration: .5, stagger: .055, ease: 'power2.out',
        startAt: { y: 22 }
      })
      .to('#preBar', { width: '100%', duration: 1.1, ease: 'power2.inOut' }, 0.05)
      .to(counter, {
        v: 100, duration: 1.1, ease: 'power2.inOut',
        onUpdate: function () {
          var n = Math.round(counter.v);
          $('#preCount').textContent = (n < 10 ? '0' : '') + n;
        }
      }, 0.05)
      .to('#preProcession .wfig', { x: 40, opacity: 0, duration: .45, stagger: .03, ease: 'power2.in' }, '+=0.12')
      .to('.preloader__mark, .preloader__meta, .preloader__bar', { opacity: 0, duration: .35 }, '<')
      .to('.preloader__panel', { scaleY: 0, transformOrigin: 'top', duration: .85, ease: 'expo.inOut' }, '-=0.1')
      .to(pre, { opacity: 0, duration: .4, ease: 'power2.out' }, '-=0.45');
  }


  /* ══════════════ 5. CURSOR ══════════════ */
  function initCursor() {
    if (TOUCH || REDUCED || !HAS_GSAP) return;
    var cur = $('#cursor');
    if (!cur) return;

    var dot = $('.cursor__dot', cur), ring = $('.cursor__ring', cur);
    var xTo = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power3' });
    var yTo = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power3' });
    var rxTo = gsap.quickTo(ring, 'x', { duration: .42, ease: 'power3' });
    var ryTo = gsap.quickTo(ring, 'y', { duration: .42, ease: 'power3' });

    window.addEventListener('mousemove', function (e) {
      gsap.to(cur, { opacity: 1, duration: .3, overwrite: 'auto' });
      xTo(e.clientX); yTo(e.clientY);
      rxTo(e.clientX); ryTo(e.clientY);
    }, { passive: true });

    document.addEventListener('mouseleave', function () { gsap.to(cur, { opacity: 0, duration: .2 }); });

    var hoverables = 'a, button, [data-hover], .scard, .acard, .mv, .chip';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(hoverables)) cur.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(hoverables)) cur.classList.remove('is-hover');
    });
  }


  /* ══════════════ 6. NAV + MENU ══════════════ */
  var menuOpen = false;

  function openMenu() {
    menuOpen = true;
    $('#menu').classList.add('is-open');
    $('#menu').setAttribute('aria-hidden', 'false');
    $('#burger').setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    if (lenis) lenis.stop();
    $$('.menu__link').forEach(function (l, i) { l.style.setProperty('--d', (0.12 + i * 0.055) + 's'); });
  }

  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    $('#menu').classList.remove('is-open');
    $('#menu').setAttribute('aria-hidden', 'true');
    $('#burger').setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    if (lenis) lenis.start();
  }

  function initNav() {
    var nav = $('#nav'), burger = $('#burger');
    if (burger) burger.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

    var last = 0;
    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop;
      nav.classList.toggle('is-stuck', y > 60);
      if (!menuOpen) nav.classList.toggle('is-hidden', y > last && y > 320);
      last = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }


  /* ══════════════ 7. HERO ══════════════ */
  function initHero() {
    if (!HAS_GSAP) return;

    var med = $('#medallion');
    var frames = $$('.frame');

    if (REDUCED) {
      gsap.set('.hero__title .ln > i, .promo, .hero__scroll, .frame, #medallion',
        { opacity: 1, x: 0, y: 0, yPercent: 0, rotate: 0, scale: 1 });
      gsap.set('.hero__rail', { opacity: 1 });
    } else {
      var tl = gsap.timeline({ delay: .05 });

      /* NOTE: .hero__meta / .promo / .hero__scroll carry [data-reveal], so CSS
         already holds them at opacity 0. They must be tweened TO their visible
         state — a gsap.from() here would animate 0 → 0. */
      tl.from('#medallion', { scale: .72, opacity: 0, rotate: -14, duration: 1.35, ease: 'expo.out' })
        .to($$('.hero__title .ln > i'), { yPercent: 0, duration: 1.15, stagger: .085, ease: 'expo.out' }, .18)
        .from(frames, { y: 60, opacity: 0, rotate: function (i) { return i ? 8 : -8; }, duration: 1.1, stagger: .1, ease: 'expo.out' }, .35)
        .to('.hero__rail', { opacity: 1, duration: .9, stagger: .1, ease: 'power2.out' }, .55)
        .to('.promo', { opacity: 1, y: 0, duration: 1, ease: 'expo.out' }, .5)
        .to('.hero__scroll', { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, .8);
    }

    /* slow rotation on the medallion ornament */
    var ring = $('.medallion__ring');
    if (ring && ring.__spin && !REDUCED) {
      gsap.to(ring.__spin, { rotation: 360, transformOrigin: '50% 50%', duration: 140, repeat: -1, ease: 'none' });
    }
    var ctaOrn = $('.cta__orn');
    if (ctaOrn && ctaOrn.__spin && !REDUCED) {
      gsap.to(ctaOrn.__spin, { rotation: -360, transformOrigin: '50% 50%', duration: 190, repeat: -1, ease: 'none' });
    }

    if (REDUCED) return;

    /* scroll parallax across the hero sheet */
    gsap.to('.hero__title', {
      yPercent: -14, opacity: .25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 }
    });
    if (med) {
      gsap.to(med, {
        yPercent: 22, scale: 1.08, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 }
      });
    }
    frames.forEach(function (f) {
      gsap.to(f, {
        y: parseFloat(f.dataset.float || 0) * 260, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
    });

    /* Pointer tilt — desktop only.
       Writes ONLY `x`: the scroll parallax above already owns `y` on the
       frames and `yPercent` on the medallion, and two tweens on the same
       transform component fight each other. */
    if (!TOUCH) {
      var sheet = $('.hero__sheet');
      var setters = frames.concat(med ? [med] : []).map(function (el, i) {
        return {
          x: gsap.quickTo(el, 'x', { duration: .9, ease: 'power3' }),
          amt: el === med ? 12 : (i === 0 ? 24 : -22)
        };
      });
      sheet.addEventListener('mousemove', function (e) {
        var r = sheet.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - .5;
        setters.forEach(function (s) { s.x(nx * s.amt); });
      }, { passive: true });
      sheet.addEventListener('mouseleave', function () {
        setters.forEach(function (s) { s.x(0); });
      });
    }
  }


  /* ══════════════ 8. MARQUEE ══════════════ */
  function initMarquee() {
    var track = $('#marqueeTrack');
    if (!track || !HAS_GSAP || REDUCED) return;

    var set = track.firstElementChild;
    var guard = 0;
    while (track.scrollWidth < window.innerWidth * 2.4 && guard++ < 12) {
      track.appendChild(set.cloneNode(true));
    }
    var w = set.getBoundingClientRect().width;
    if (!w) return;

    var tween = gsap.to(track, {
      x: -w, duration: w / 42, ease: 'none', repeat: -1,
      modifiers: { x: function (x) { return (parseFloat(x) % w) + 'px'; } }
    });

    /* speed reacts to scroll velocity — the band feels alive */
    ScrollTrigger.create({
      onUpdate: function (self) {
        var v = gsap.utils.clamp(-3, 3, self.getVelocity() / 320);
        gsap.to(tween, { timeScale: 1 + Math.abs(v), duration: .35, overwrite: true });
        gsap.to(tween, { timeScale: 1, duration: 1.1, delay: .35, overwrite: false });
      }
    });
  }


  /* ══════════════ 9. GENERIC REVEALS ══════════════ */
  function initReveals() {
    if (!HAS_GSAP || REDUCED) return;

    $$('[data-reveal]').forEach(function (el) {
      /* the hero's own intro timeline owns these — two tweens on one
         element's opacity fight each other */
      if (el.closest('.hero')) return;
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    /* split headings outside the hero rise line by line */
    $$('[data-split]').forEach(function (el) {
      if (el.closest('.hero__title')) return;
      var inners = $$('.ln > i', el);
      if (!inners.length) return;
      gsap.to(inners, {
        yPercent: 0, duration: 1.1, stagger: .08, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });
  }


  /* ══════════════ 10. FRACTURE — scattered cards converge ══════════════ */
  function initFracture() {
    var cards = $$('#scatter .scard');
    if (!cards.length || !HAS_GSAP) return;

    if (REDUCED) { gsap.set(cards, { opacity: 1 }); return; }

    cards.forEach(function (c) {
      gsap.set(c, {
        opacity: 0,
        x: parseFloat(c.dataset.x) * 2.4,
        y: parseFloat(c.dataset.y) * 1.6,
        rotate: parseFloat(c.dataset.r) * 1.6,
        scale: .9
      });
    });

    gsap.to(cards, {
      opacity: 1, x: 0, y: 0, rotate: 0, scale: 1,
      ease: 'expo.out', duration: 1.4, stagger: { each: .07, from: 'random' },
      scrollTrigger: { trigger: '#scatter', start: 'top 78%', once: true }
    });
  }


  /* ══════════════ 11. COUNTERS ══════════════ */
  function initCounters() {
    if (!HAS_GSAP) return;
    $$('[data-count]').forEach(function (el) {
      var target = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      if (REDUCED) { el.textContent = target + suffix; return; }


      var sfx = suffix ? '<span class="stat__sfx">' + suffix + '</span>' : '';
      var o = { v: 0 };
      gsap.to(o, {
        v: target, duration: 1.9, ease: 'power2.out',
        onUpdate: function () { el.innerHTML = Math.round(o.v) + sfx; },
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      });
    });
  }


  /* ══════════════ 12. MOVEMENTS — pinned horizontal scroll ══════════════ */
  function initMovements() {
    var section = $('#movements'), track = $('#mvTrack'), bar = $('#mvBar');
    if (!section || !track || !HAS_GSAP) return;

    if (REDUCED) {
      track.style.flexWrap = 'wrap';
      if (bar) bar.style.width = '100%';
      return;
    }

    var mm = gsap.matchMedia();

    /* Desktop / tablet: pin the section and drive the track sideways. */
    mm.add('(min-width: 861px)', function () {
      var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 64); };

      gsap.to(track, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: function () { return '+=' + distance() * 1.15; },
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) { if (bar) bar.style.width = (self.progress * 100).toFixed(2) + '%'; }
        }
      });

      /* panels settle in as the section arrives; the sideways travel
         supplies the rest of the motion */
      var enter = gsap.from($$('.mv', track), {
        y: 56, opacity: 0, duration: 1, stagger: .09, ease: 'expo.out',
        scrollTrigger: { trigger: section, start: 'top 72%', once: true }
      });

      return function () {
        enter.revert();
        if (bar) bar.style.width = '0%';
      };
    });

    /* Mobile: stack the panels vertically — pinned horizontals fight touch scroll. */
    mm.add('(max-width: 860px)', function () {
      track.style.flexDirection = 'column';
      track.style.transform = 'none';
      $$('.mv', track).forEach(function (panel) {
        panel.style.width = '100%';
        gsap.from(panel, {
          y: 44, opacity: 0, duration: .9, ease: 'expo.out',
          scrollTrigger: { trigger: panel, start: 'top 88%', once: true }
        });
      });
      if (bar) {
        gsap.to(bar, {
          width: '100%', ease: 'none',
          scrollTrigger: { trigger: track, start: 'top 70%', end: 'bottom bottom', scrub: .4 }
        });
      }
      return function () {
        track.style.flexDirection = '';
        $$('.mv', track).forEach(function (p) { p.style.width = ''; });
      };
    });
  }


  /* ══════════════ 13. PALKHI ROUTE MAP ══════════════ */
  var HALTS = [
    { en: 'Alandi',        mr: 'आळंदी',      s: 'ok'   },
    { en: 'Pune',          mr: 'पुणे',        s: 'ok'   },
    { en: 'Saswad',        mr: 'सासवड',      s: 'ok'   },
    { en: 'Jejuri',        mr: 'जेजुरी',      s: 'crit' },
    { en: 'Walhe',         mr: 'वाल्हे',      s: 'ok'   },
    { en: 'Lonand',        mr: 'लोणंद',      s: 'warn' },
    { en: 'Taradgaon',     mr: 'तरडगाव',     s: 'ok'   },
    { en: 'Phaltan',       mr: 'फलटण',       s: 'ok'   },
    { en: 'Barad',         mr: 'बरड',        s: 'ok'   },
    { en: 'Natepute',      mr: 'नातेपुते',    s: 'ok'   },
    { en: 'Malshiras',     mr: 'माळशिरस',    s: 'warn' },
    { en: 'Velapur',       mr: 'वेळापूर',     s: 'ok'   },
    { en: 'Bhandishegaon', mr: 'भंडीशेगाव',   s: 'ok'   },
    { en: 'Wakhari',       mr: 'वाखरी',      s: 'ok'   },
    { en: 'Pandharpur',    mr: 'पंढरपूर',     s: 'ok'   }
  ];

  function initRoute() {
    var host = $('#routemap');
    var path = $('#routePath');
    var svg  = $('.routemap__svg');
    if (!host || !path || !svg) return;

    var NS = 'http://www.w3.org/2000/svg';
    var stopsG = $('#routeStops');
    var marker = $('#palkhiMarker');
    var card   = $('#routeCard');
    var stops  = [];

    /* mobile stepper — the SVG map is unreadable below ~860px, so the same
       route is rendered as a vertical list there (CSS swaps them) */
    var list = document.createElement('ol');
    list.className = 'routelist';
    HALTS.forEach(function (h, i) {
      var li = document.createElement('li');
      li.className = 'routelist__i' + (h.s === 'warn' ? ' is-warn' : h.s === 'crit' ? ' is-crit' : '');
      li.innerHTML =
        '<i class="routelist__dot"></i>' +
        '<span class="routelist__n">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="routelist__en">' + h.en + '</span>' +
        '<span class="routelist__mr">' + h.mr + '</span>';
      list.appendChild(li);
    });
    host.appendChild(list);

    /* getTotalLength can return 0 on a path whose SVG is display:none */
    var len = 0;
    try { len = path.getTotalLength(); } catch (e) { len = 0; }
    if (!len) return;

    /* place a node at each halt, evenly along the drawn path */
    HALTS.forEach(function (h, i) {
      var t = i / (HALTS.length - 1);
      var pt = path.getPointAtLength(len * t);
      var above = i % 2 === 0;

      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'routemap__stop' + (h.s === 'warn' ? ' is-warn' : h.s === 'crit' ? ' is-crit' : ''));
      g.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')');
      g.setAttribute('opacity', '0');

      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', (i === 0 || i === HALTS.length - 1) ? '8' : '5.5');
      g.appendChild(c);

      var tick = document.createElementNS(NS, 'line');
      tick.setAttribute('x1', 0); tick.setAttribute('x2', 0);
      tick.setAttribute('y1', above ? -10 : 10);
      tick.setAttribute('y2', above ? -22 : 22);
      tick.setAttribute('stroke', 'currentColor');
      tick.setAttribute('stroke-width', '1');
      tick.setAttribute('opacity', '.35');
      tick.setAttribute('style', 'color:#F5F0E6');
      g.appendChild(tick);

      var t1 = document.createElementNS(NS, 'text');
      t1.setAttribute('text-anchor', 'middle');
      t1.setAttribute('y', above ? -42 : 46);
      t1.textContent = h.en.toUpperCase();
      g.appendChild(t1);

      var t2 = document.createElementNS(NS, 'text');
      t2.setAttribute('class', 'mr');
      t2.setAttribute('text-anchor', 'middle');
      t2.setAttribute('y', above ? -28 : 62);
      t2.textContent = h.mr;
      g.appendChild(t2);

      stopsG.appendChild(g);
      stops.push({ g: g, t: t, data: h, pt: pt });
    });

    if (!HAS_GSAP || REDUCED) {
      path.style.strokeDasharray = 'none';
      stops.forEach(function (s) { s.g.setAttribute('opacity', '1'); });
      marker.style.opacity = '1';
      return;
    }

    var scale = 1;
    function measure() {
      var r = svg.getBoundingClientRect();
      scale = r.width ? r.width / 1200 : 1;
    }

    var lastName = null;
    var mm = gsap.matchMedia();

    /* Only the wide layout shows the SVG map; below 861px the stepper is
       what's visible, so there is nothing to scrub. */
    mm.add('(min-width: 861px)', function () {

    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    measure();
    window.addEventListener('resize', measure);

    ScrollTrigger.create({
      trigger: host,
      start: 'top 76%',
      end: 'bottom 62%',
      scrub: .8,
      invalidateOnRefresh: true,
      onRefresh: measure,
      onUpdate: function (self) {
        var p = gsap.utils.clamp(0, 1, self.progress);
        path.style.strokeDashoffset = len * (1 - p);

        var pt = path.getPointAtLength(len * p);
        marker.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')');
        marker.style.opacity = p > .015 ? '1' : '0';

        var current = stops[0];
        stops.forEach(function (s) {
          var on = p >= s.t - .012;
          s.g.setAttribute('opacity', on ? '1' : '0');
          if (on) current = s;
        });

        if (card) {
          card.style.opacity = p > .05 ? '1' : '0';
          card.style.transform =
            'translate(' + (pt.x * scale - 84) + 'px,' + (pt.y * scale - 118) + 'px)';
          if (current.data.en !== lastName) {
            lastName = current.data.en;
            $('#routeCardName').textContent = current.data.en;
            $('#routeCardMr').textContent = current.data.mr;
            $('#routeCardDelay').textContent =
              current.data.s === 'crit' ? '41 min' : current.data.s === 'warn' ? '22 min' : '6 min';
          }
        }
      }
    });

    /* the marker breathes */
    var breathe = gsap.to('.routemap__pulse', {
      scale: 1.7, opacity: 0, transformOrigin: '50% 50%',
      duration: 1.8, repeat: -1, ease: 'power2.out'
    });

      return function () {
        breathe.kill();
        window.removeEventListener('resize', measure);
        path.style.strokeDasharray = 'none';
        path.style.strokeDashoffset = '';
      };
    });
  }


  /* ══════════════ 14. AUTHORITY CARDS ══════════════ */
  function initAuthorities() {
    var cards = $$('.acard');
    if (!cards.length || !HAS_GSAP) return;
    if (REDUCED) { gsap.set(cards, { opacity: 1 }); return; }

    gsap.to(cards, {
      opacity: 1, y: 0, duration: 1.1, ease: 'expo.out',
      stagger: { each: .075, grid: 'auto', from: 'start' },
      startAt: { y: 52 },
      scrollTrigger: { trigger: '.auth__grid', start: 'top 82%', once: true }
    });
  }


  /* ══════════════ 15. LIVE FEED ══════════════ */
  var FEED_SEED = [
    { cat:'medical',    sev:'critical', st:'reported', loc:'Jejuri',    mr:'जेजुरी',   t:'15:14', h:'Ambulance availability down to 2 vehicles', d:'Medical Authority' },
    { cat:'medical',    sev:'high',     st:'progress', loc:'Jejuri',    mr:'जेजुरी',   t:'15:06', h:'Camp capacity at 88% — presentations rising', d:'Medical Authority' },
    { cat:'police',     sev:'high',     st:'ack',      loc:'Lonand',    mr:'लोणंद',   t:'14:51', h:'Congestion high on the state highway diversion', d:'Police Authority' },
    { cat:'dindi',      sev:'high',     st:'reported', loc:'Lonand',    mr:'लोणंद',   t:'14:38', h:'14 Dindis compressing into the approach road', d:'Dindi Coordinator' },
    { cat:'dindi',      sev:'info',     st:'ack',      loc:'Lonand',    mr:'लोणंद',   t:'14:22', h:'Palkhi 22 minutes behind published schedule', d:'Dindi Coordinator' },
    { cat:'municipal',  sev:'info',     st:'progress', loc:'Lonand',    mr:'लोणंद',   t:'14:05', h:'Rainfall increasing — two shelter tents taking water', d:'Municipal Authority' },
    { cat:'sanitation', sev:'info',     st:'resolved', loc:'Walhe',     mr:'वाल्हे',   t:'13:48', h:'Mobile toilet block restored to service', d:'Nirmal Wari' },
    { cat:'medical',    sev:'info',     st:'resolved', loc:'Saswad',    mr:'सासवड',   t:'13:20', h:'Medicine resupply received — ORS stock normal', d:'Medical Authority' },
    { cat:'police',     sev:'info',     st:'resolved', loc:'Saswad',    mr:'सासवड',   t:'12:55', h:'Route blockage cleared at the market junction', d:'Police Authority' },
    { cat:'municipal',  sev:'info',     st:'ack',      loc:'Phaltan',   mr:'फलटण',    t:'12:30', h:'Water tanker rotation increased to 40 min', d:'Municipal Authority' }
  ];

  var FEED_POOL = [
    { cat:'dindi',      sev:'info',     st:'reported', loc:'Taradgaon', mr:'तरडगाव',   h:'Dindi 214 reports headcount 1,180 — on schedule', d:'Dindi Coordinator' },
    { cat:'medical',    sev:'high',     st:'reported', loc:'Wakhari',   mr:'वाखरी',    h:'Three heat-exhaustion cases at the forward camp', d:'Medical Authority' },
    { cat:'sanitation', sev:'high',     st:'reported', loc:'Malshiras', mr:'माळशिरस',  h:'Sanitation block at 90% utilisation', d:'Nirmal Wari' },
    { cat:'police',     sev:'critical', st:'reported', loc:'Natepute',  mr:'नातेपुते', h:'Two-wheeler collision on the approach — lane blocked', d:'Police Authority' },
    { cat:'municipal',  sev:'info',     st:'progress', loc:'Velapur',   mr:'वेळापूर',  h:'Street lighting restored across halt point', d:'Municipal Authority' },
    { cat:'medical',    sev:'info',     st:'resolved', loc:'Barad',     mr:'बरड',     h:'Patient referred to district hospital — record synced', d:'Medical Authority' },
    { cat:'dindi',      sev:'high',     st:'reported', loc:'Phaltan',   mr:'फलटण',    h:'Support vehicle breakdown — 40 members reassigned', d:'Dindi Coordinator' },
    { cat:'sanitation', sev:'info',     st:'ack',      loc:'Bhandishegaon', mr:'भंडीशेगाव', h:'Waste collection cycle completed for the halt', d:'Nirmal Wari' }
  ];

  var CAT_TAG = {
    police:'tag--police', medical:'tag--med', dindi:'tag--dindi',
    municipal:'tag--muni', sanitation:'tag--san'
  };
  var ST_LABEL = { reported:'Reported', ack:'Acknowledged', progress:'In Progress', resolved:'Resolved' };
  var ST_CLASS = { reported:'', ack:'fstat--ack', progress:'fstat--progress', resolved:'fstat--resolved' };

  function feedNode(item) {
    var li = document.createElement('li');
    li.className = 'fitem';
    li.dataset.cat = item.cat;
    li.dataset.sev = item.sev;
    li.dataset.status = item.st;
    li.innerHTML =
      '<i class="fitem__sev"></i>' +
      '<div class="fitem__main">' +
        '<h4>' + item.h + '</h4>' +
        '<div class="fitem__meta">' +
          '<span class="tag ' + (CAT_TAG[item.cat] || '') + '">' + item.cat + '</span>' +
          '<span class="fitem__loc">' + item.loc + '<span>' + item.mr + '</span></span>' +
          '<span>' + item.d + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="fitem__side">' +
        '<span class="fitem__time">' + item.t + '</span>' +
        '<span class="fstat ' + (ST_CLASS[item.st] || '') + '">' + ST_LABEL[item.st] + '</span>' +
      '</div>';
    return li;
  }

  function initFeed() {
    var list = $('#feedList'), chips = $('#feedChips'), countEl = $('#feedCount');
    if (!list) return;

    var filter = 'all';

    function matches(li) {
      if (filter === 'all') return true;
      if (filter === 'critical') return li.dataset.sev === 'critical';
      if (filter === 'resolved') return li.dataset.status === 'resolved';
      return li.dataset.cat === filter;
    }

    function apply(animate) {
      var shown = 0;
      $$('.fitem', list).forEach(function (li) {
        var on = matches(li);
        li.style.display = on ? '' : 'none';
        if (on) shown++;
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? ' update' : ' updates');
      if (animate && HAS_GSAP && !REDUCED) {
        gsap.fromTo($$('.fitem', list).filter(function (li) { return li.style.display !== 'none'; }),
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: .45, stagger: .025, ease: 'power2.out', overwrite: true });
      }
    }

    FEED_SEED.forEach(function (item) { list.appendChild(feedNode(item)); });
    apply(false);

    if (chips) {
      chips.addEventListener('click', function (e) {
        var btn = e.target.closest('.chip');
        if (!btn) return;
        $$('.chip', chips).forEach(function (c) { c.classList.remove('is-on'); });
        btn.classList.add('is-on');
        filter = btn.dataset.filter;
        apply(true);
      });
    }

    /* live arrivals — only while the panel is on screen */
    if (REDUCED) return;
    var visible = false, timer = null, poolIdx = 0;

    function clockNow() {
      var d = new Date();
      return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function push() {
      var item = Object.assign({}, FEED_POOL[poolIdx % FEED_POOL.length], { t: clockNow() });
      poolIdx++;
      var node = feedNode(item);
      list.insertBefore(node, list.firstChild);
      while (list.children.length > 11) list.removeChild(list.lastChild);
      apply(false);
      if (HAS_GSAP && node.style.display !== 'none') {
        gsap.from(node, { height: 0, opacity: 0, duration: .6, ease: 'power3.out', clearProps: 'height' });
        gsap.fromTo(node, { backgroundColor: 'rgba(226,54,27,.14)' },
          { backgroundColor: 'rgba(226,54,27,0)', duration: 2.2, ease: 'power2.out', clearProps: 'backgroundColor' });
      }
    }

    function start() { if (!timer) timer = setInterval(push, 6500); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }, { threshold: .15 }).observe($('.feed__panel') || list);
    } else { start(); }

    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : (visible && start());
    });
  }


  /* ══════════════ 16. ESCALATION CHAIN ══════════════ */
  function initChain() {
    var events = $$('.ev');
    var arc = $('#gaugeArc'), num = $('#gaugeNum'), state = $('#gaugeState'), gauge = $('.gauge');
    if (!events.length || !arc || !HAS_GSAP) return;

    var CIRC = 2 * Math.PI * 98;
    var score = { v: 12 };

    function paint() {
      var v = score.v;
      arc.style.strokeDashoffset = CIRC * (1 - v / 100);
      if (num) num.textContent = Math.round(v);
      var cls = v >= 80 ? 'is-crit' : v >= 65 ? 'is-high' : v >= 40 ? 'is-mod' : '';
      if (gauge) gauge.className = 'gauge' + (cls ? ' ' + cls : '');
      if (state) state.textContent = v >= 80 ? 'CRITICAL' : v >= 65 ? 'HIGH' : v >= 40 ? 'MODERATE' : 'LOW';
    }
    paint();

    if (REDUCED) {
      gsap.set(events, { opacity: 1 });
      score.v = 87; paint();
      $$('.pipe__node').forEach(function (n) { n.classList.add('is-on'); });
      return;
    }

    function go(to) {
      gsap.to(score, { v: to, duration: .9, ease: 'power2.out', onUpdate: paint, overwrite: true });
    }

    events.forEach(function (ev, i) {
      gsap.to(ev, {
        opacity: 1, x: 0, duration: .9, ease: 'expo.out',
        startAt: { x: 34 },
        scrollTrigger: { trigger: ev, start: 'top 86%', once: true }
      });

      ScrollTrigger.create({
        trigger: ev,
        start: 'top 62%',
        end: 'bottom 40%',
        onEnter:     function () { ev.classList.add('is-live');    go(parseFloat(ev.dataset.score)); },
        onEnterBack: function () { ev.classList.add('is-live');    go(parseFloat(ev.dataset.score)); },
        onLeaveBack: function () {
          ev.classList.remove('is-live');
          go(i > 0 ? parseFloat(events[i - 1].dataset.score) : 12);
        }
      });
    });

    var nodes = $$('.pipe__node');
    if (nodes.length) {
      ScrollTrigger.create({
        trigger: '#pipe', start: 'top 82%',
        onEnter: function () {
          gsap.to(nodes, {
            opacity: 1, duration: .5, stagger: .12, ease: 'power2.out',
            onStart: function () { nodes.forEach(function (n) { n.classList.add('is-on'); }); }
          });
        },
        once: true
      });
    }
  }


  /* ══════════════ 17. SUPERVISOR BRIEF ══════════════ */
  function initBrief() {
    var blocks = $$('[data-doc]');
    if (!blocks.length || !HAS_GSAP) return;
    if (REDUCED) { gsap.set(blocks, { opacity: 1 }); return; }

    gsap.to(blocks, {
      opacity: 1, y: 0, duration: .8, stagger: .13, ease: 'power3.out',
      startAt: { y: 22 },
      scrollTrigger: { trigger: '.doc', start: 'top 80%', once: true }
    });

    gsap.from('.doc__orn', {
      scaleX: 0, transformOrigin: 'left center', duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.doc', start: 'top 84%', once: true }
    });
  }


  /* ══════════════ 18. CTA ══════════════ */
  function initCTA() {
    if (!HAS_GSAP || REDUCED) return;

    var figs = $$('#ctaProcession .wfig');
    if (figs.length) {
      gsap.from(figs, {
        x: -70, opacity: 0, duration: 1, stagger: .06, ease: 'expo.out',
        scrollTrigger: { trigger: '#ctaProcession', start: 'top 92%', once: true }
      });
      gsap.to('#ctaProcession', {
        x: 90, ease: 'none',
        scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom bottom', scrub: 1 }
      });
    }
  }


  /* ══════════════ 19. TOAST ══════════════ */
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 3600);
  }


  /* ══════════════ 20. BOOT ══════════════ */
  function boot() {
    buildRosettes();
    bindAnchors();
    initNav();
    initCursor();
    initSmoothScroll();
    if (lenis) lenis.stop();

    splitAll();

    initPreloader(function () {
      initHero();
      initMarquee();
      initReveals();
      initFracture();
      initCounters();
      initMovements();
      initRoute();
      initAuthorities();
      initFeed();
      initChain();
      initBrief();
      initCTA();

      if (HAS_GSAP) {
        ScrollTrigger.refresh();
        /* re-measure once late-loading webfonts settle the layout */
        setTimeout(function () { ScrollTrigger.refresh(); }, 600);
      }
    });
  }

  function ready() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(boot).catch(boot);
    } else {
      boot();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }

  window.addEventListener('load', function () {
    if (HAS_GSAP) ScrollTrigger.refresh();
  });

})();
