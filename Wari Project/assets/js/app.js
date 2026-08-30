/* ═══════════════════════════════════════════════════════════════════
   WARI COMMAND INTELLIGENCE — Command Center app logic
   Vanilla JS. No build step. Mock/simulated data throughout.
   Language dictionary lives in assets/js/i18n.js (window.WCI).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  var t = function (key) { return window.WCI ? WCI.t(key) : key; };
  var curLang = function () { return window.WCI ? WCI.curLang() : 'mr'; };

  var HAS_GSAP = typeof window.gsap !== 'undefined';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The motion vocabulary lives in assets/js/motion.js. This stub keeps
     every call site working — unanimated — if that file fails to load. */
  var M = window.WCIMotion || (function () {
    var noop = function () {};
    return {
      on: false,
      countUp: function (el, to, o) { o = o || {}; if (el) el.textContent = (o.prefix || '') + to.toFixed(o.decimals || 0) + (o.suffix || ''); },
      countFraction: function (el, a, b) { if (el) el.textContent = a + ' / ' + b; },
      bars: function (n) { Array.prototype.forEach.call(n || [], function (x) { x.style.width = (x.dataset.w || 0) + '%'; }); },
      expand: function (el, open) { if (el) el.style.display = open ? 'block' : 'none'; },
      stagger: noop, revealPage: noop, ring: noop, arc: noop, drawPath: noop, pulse: noop,
      tilt: noop, lift: noop, magnetic: noop, pop: noop, flipIn: noop,
      scrollReveal: noop, killScrollTriggers: noop, initCursor: noop
    };
  })();

  /* Everything interpolated into innerHTML goes through here. Report
     details, patient names and model headlines are all operator-typed
     text: unescaped, a stray angle bracket silently breaks the row and
     markup pasted into a report would execute. */
  function esc(v) {
    if (v == null) return '';
    return String(v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function pctOf(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }

  /* The signed-in role, needed by cards that re-render when live data
     lands rather than only at first paint. */
  var currentRole = null;

  function revealIn(nodes) { M.stagger(nodes); }

  /* ══════════════ ROLES ══════════════ */
  var ROLES = [
    { id: 'dindi',      icon: 'g-dindi',      en: 'Dindi Coordinator',  mr: 'दिंडी समन्वयक',     pages: ['dashboard', 'live-ops', 'records'] },
    { id: 'medical',    icon: 'g-medical',    en: 'Medical Authority',  mr: 'वैद्यकीय अधिकारी',   pages: ['dashboard', 'live-ops', 'records', 'medical'] },
    { id: 'police',     icon: 'g-police',     en: 'Police Authority',   mr: 'पोलीस प्रशासन',      pages: ['dashboard', 'live-ops', 'records'] },
    { id: 'municipal',  icon: 'g-municipal',  en: 'Municipal Authority',mr: 'नगरपालिका',          pages: ['dashboard', 'live-ops', 'records'] },
    { id: 'sanitation', icon: 'g-sanitation', en: 'Sanitation Authority',mr:'निर्मल वारी',         pages: ['dashboard', 'live-ops', 'records'] },
    { id: 'supervisor', icon: 'g-supervisor', en: 'Wari Supervisor',   mr: 'वारी नियंत्रक',       pages: ['dashboard', 'live-ops', 'medical', 'intel'] }
  ];

  function roleName(r) { return curLang() === 'mr' ? r.mr : r.en; }
  function roleById(id) { return ROLES.filter(function (r) { return r.id === id; })[0]; }

  /* ══════════════ STATUS HELPERS (green / amber / red) ══════════════ */
  function worst(a, b) { var rank = { ok: 0, warn: 1, crit: 2 }; return rank[a] >= rank[b] ? a : b; }
  function loadStatus(pct) { return pct >= 85 ? 'crit' : pct >= 65 ? 'warn' : 'ok'; }
  function ratioStatus(avail, total) {
    if (total <= 0) return 'ok';
    if (avail <= 0) return 'crit';
    var r = avail / total;
    return r < 0.34 ? 'crit' : r < 0.6 ? 'warn' : 'ok';
  }
  function stockStatus(stock, par) {
    var r = par > 0 ? stock / par : 1;
    return r < 0.25 ? 'crit' : r < 0.6 ? 'warn' : 'ok';
  }
  function sDot(status) { return '<i class="s-dot s-dot--' + status + '"></i>'; }
  function sBadge(status, label) { return '<span class="s-badge s-badge--' + status + '">' + sDot(status) + label + '</span>'; }
  function statusWord(s) { return t('status.' + s); }

  /* ══════════════ MOCK DATA — LOCATIONS ══════════════ */
  /* Halt coordinates for the Sant Dnyaneshwar Palkhi route, Alandi to
     Pandharpur. Approximate town centres — enough to place a halt on
     satellite imagery, not survey data.

     Order is the walking order, which is also what routeProgress() and
     the "Route order" sort read. Barad sat between Wakhari and
     Pandharpur here, twelve halts adrift of where it actually falls
     (between Phaltan and Natepute); the stylised route hid it because
     markers were spaced evenly along a decorative curve rather than
     drawn at real positions. On a map it doubled the line back on
     itself, so it is restored to its place below. */
  var LOCATIONS = [
    { id: 'alandi',    en: 'Alandi',        mr: 'आळंदी',      lat: 18.6773, lng: 73.8987, dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'pune',      en: 'Pune',          mr: 'पुणे',        lat: 18.5204, lng: 73.8567, dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'warn' } },
    { id: 'saswad',    en: 'Saswad',        mr: 'सासवड',      lat: 18.3468, lng: 74.0323, dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'jejuri',    en: 'Jejuri',        mr: 'जेजुरी',      lat: 18.2772, lng: 74.1600, dom: { police: 'warn', medical: 'crit', municipal: 'ok',   sanitation: 'warn' } },
    { id: 'walhe',     en: 'Walhe',         mr: 'वाल्हे',      lat: 18.1300, lng: 74.1400, dom: { police: 'ok',   medical: 'ok',   municipal: 'warn', sanitation: 'ok' } },
    { id: 'lonand',    en: 'Lonand',        mr: 'लोणंद',      lat: 18.0167, lng: 74.2000, dom: { police: 'warn', medical: 'warn', municipal: 'warn', sanitation: 'ok' } },
    { id: 'taradgaon', en: 'Taradgaon',     mr: 'तरडगाव',     lat: 17.9600, lng: 74.3300, dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'phaltan',   en: 'Phaltan',       mr: 'फलटण',       lat: 17.9912, lng: 74.4318, dom: { police: 'ok',   medical: 'warn', municipal: 'ok',   sanitation: 'ok' } },
    { id: 'barad',     en: 'Barad',         mr: 'बरड',        lat: 17.9000, lng: 74.6167, dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'natepute',  en: 'Natepute',      mr: 'नातेपुते',    lat: 17.9333, lng: 74.9500, dom: { police: 'crit', medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'malshiras', en: 'Malshiras',     mr: 'माळशिरस',    lat: 17.8556, lng: 74.9167, dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'warn' } },
    { id: 'velapur',   en: 'Velapur',       mr: 'वेळापूर',     lat: 17.9167, lng: 75.1100, dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'bhandishegaon', en: 'Bhandishegaon', mr: 'भंडीशेगाव', lat: 17.7400, lng: 75.2400, dom: { police: 'ok', medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'wakhari',   en: 'Wakhari',       mr: 'वाखरी',      lat: 17.6600, lng: 75.2850, dom: { police: 'ok',   medical: 'warn', municipal: 'ok',   sanitation: 'ok' } },
    { id: 'pandharpur',en: 'Pandharpur',    mr: 'पंढरपूर',     lat: 17.6790, lng: 75.3233, dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } }
  ];
  var PALKHI = { locId: 'lonand', delayMin: 22, nameKey: 'palkhi.dnyaneshwar' };

  /* Halt coordinates for the Sant Tukaram Palkhi route, Dehu to
     Pandharpur — a different road for most of the way (via Baramati and
     Akluj), converging with the Dnyaneshwar route only in the last
     stretch through Wakhari. Approximate town centres, same fidelity as
     LOCATIONS above. This route carries no domain/camp data of its own —
     it exists only so the tracking map can show both processions. */
  var TUKARAM_ROUTE = [
    { id: 'tuk-dehu',        en: 'Dehu',         mr: 'देहू',         lat: 18.7167, lng: 73.7667 },
    { id: 'tuk-akurdi',      en: 'Akurdi',       mr: 'आकुर्डी',      lat: 18.6480, lng: 73.7660 },
    { id: 'tuk-pune',        en: 'Pune',         mr: 'पुणे',         lat: 18.5100, lng: 73.8600 },
    { id: 'tuk-lonikalbhor', en: 'Loni Kalbhor', mr: 'लोणी काळभोर', lat: 18.4536, lng: 73.9967 },
    { id: 'tuk-yavat',       en: 'Yavat',        mr: 'येवत',         lat: 18.4167, lng: 74.1500 },
    { id: 'tuk-varvand',     en: 'Varvand',      mr: 'वरवंड',        lat: 18.3833, lng: 74.2333 },
    { id: 'tuk-baramati',    en: 'Baramati',     mr: 'बारामती',      lat: 18.1514, lng: 74.5815 },
    { id: 'tuk-indapur',     en: 'Indapur',      mr: 'इंदापूर',      lat: 18.1167, lng: 75.0167 },
    { id: 'tuk-akluj',       en: 'Akluj',        mr: 'आकलूज',        lat: 17.8833, lng: 75.0167 },
    { id: 'tuk-wakhari',     en: 'Wakhari',      mr: 'वाखरी',        lat: 17.6600, lng: 75.2850 },
    { id: 'tuk-pandharpur',  en: 'Pandharpur',   mr: 'पंढरपूर',      lat: 17.6790, lng: 75.3233 }
  ];
  var PALKHI2 = { locId: 'tuk-baramati', delayMin: 15, nameKey: 'palkhi.tukaram' };

  /* ══════════════ MOCK DATA — MEDICAL CAMPS ══════════════ */
  var MED_KEY_LABEL = { ors: 'med.ors', antipyretics: 'med.antipyretics', analgesics: 'med.analgesics', ivFluids: 'med.ivFluids', antiseptics: 'med.antiseptics' };
  var PSTATUS_LABEL = { admitted: 'pstatus.admitted', discharged: 'pstatus.discharged', referred: 'pstatus.referred' };
  function patientStatusLabel(status) { return PSTATUS_LABEL[status] ? t(PSTATUS_LABEL[status]) : status; }
  function campLabel(campId) {
    var c = CAMPS.filter(function (x) { return x.id === campId; })[0];
    return c ? c.en : (campId || '—');
  }
  var CAMPS = [
    { id: 'jejuri-1', en: 'Jejuri Camp 1', mr: 'जेजुरी शिबिर १', capacity: 80, patients: 42, icuTotal: 6, icuAvail: 4, ambTotal: 3, ambAvail: 3,
      meds: { ors: { stock: 160, par: 200, unit: 'packets' }, antipyretics: { stock: 120, par: 150, unit: 'strips' }, analgesics: { stock: 130, par: 150, unit: 'strips' }, ivFluids: { stock: 80, par: 100, unit: 'bottles' }, antiseptics: { stock: 60, par: 80, unit: 'bottles' } } },
    { id: 'jejuri-2', en: 'Jejuri Camp 2', mr: 'जेजुरी शिबिर २', capacity: 70, patients: 51, icuTotal: 5, icuAvail: 2, ambTotal: 3, ambAvail: 2,
      meds: { ors: { stock: 150, par: 200, unit: 'packets' }, antipyretics: { stock: 30, par: 150, unit: 'strips' }, analgesics: { stock: 100, par: 150, unit: 'strips' }, ivFluids: { stock: 70, par: 100, unit: 'bottles' }, antiseptics: { stock: 55, par: 80, unit: 'bottles' } } },
    { id: 'jejuri-3', en: 'Jejuri Camp 3', mr: 'जेजुरी शिबिर ३', capacity: 60, patients: 53, icuTotal: 4, icuAvail: 0, ambTotal: 4, ambAvail: 2,
      meds: { ors: { stock: 35, par: 200, unit: 'packets' }, antipyretics: { stock: 82, par: 150, unit: 'strips' }, analgesics: { stock: 100, par: 150, unit: 'strips' }, ivFluids: { stock: 42, par: 100, unit: 'bottles' }, antiseptics: { stock: 50, par: 80, unit: 'bottles' } } },
    { id: 'wakhari-1', en: 'Wakhari Forward Camp', mr: 'वाखरी अग्रगामी शिबिर', capacity: 50, patients: 22, icuTotal: 3, icuAvail: 3, ambTotal: 2, ambAvail: 1,
      meds: { ors: { stock: 140, par: 200, unit: 'packets' }, antipyretics: { stock: 100, par: 150, unit: 'strips' }, analgesics: { stock: 95, par: 150, unit: 'strips' }, ivFluids: { stock: 60, par: 100, unit: 'bottles' }, antiseptics: { stock: 50, par: 80, unit: 'bottles' } } },
    { id: 'phaltan-1', en: 'Phaltan Camp', mr: 'फलटण शिबिर', capacity: 65, patients: 30, icuTotal: 4, icuAvail: 3, ambTotal: 3, ambAvail: 3,
      meds: { ors: { stock: 150, par: 200, unit: 'packets' }, antipyretics: { stock: 110, par: 150, unit: 'strips' }, analgesics: { stock: 70, par: 150, unit: 'strips' }, ivFluids: { stock: 65, par: 100, unit: 'bottles' }, antiseptics: { stock: 55, par: 80, unit: 'bottles' } } }
  ];

  function campOverall(camp) {
    var loadPct = Math.round((camp.patients / camp.capacity) * 100);
    var s = loadStatus(loadPct);
    s = worst(s, ratioStatus(camp.icuAvail, camp.icuTotal));
    s = worst(s, ratioStatus(camp.ambAvail, camp.ambTotal));
    Object.keys(camp.meds).forEach(function (k) {
      s = worst(s, stockStatus(camp.meds[k].stock, camp.meds[k].par));
    });
    return s;
  }

  /* ══════════════ MOCK DATA — PATIENTS ══════════════ */
  var PATIENTS = [
    { id: 'P-1042', name: 'Ramesh Jadhav',    age: 58, camp: 'Jejuri Camp 3',       condition: 'Heat exhaustion',   status: 'admitted' },
    { id: 'P-1043', name: 'Sunita More',      age: 34, camp: 'Jejuri Camp 3',       condition: 'Dehydration',       status: 'admitted' },
    { id: 'P-1044', name: 'Anil Kadam',       age: 61, camp: 'Jejuri Camp 2',       condition: 'High blood pressure', status: 'discharged' },
    { id: 'P-1045', name: 'Vaishali Pawar',   age: 27, camp: 'Wakhari Forward Camp',condition: 'Minor foot injury', status: 'discharged' },
    { id: 'P-1046', name: 'Ganesh Shinde',    age: 45, camp: 'Phaltan Camp',        condition: 'Fever',             status: 'admitted' },
    { id: 'P-1047', name: 'Kavita Bhosale',   age: 39, camp: 'Jejuri Camp 1',       condition: 'Gastro upset',      status: 'discharged' },
    { id: 'P-1048', name: 'Dattu Salunkhe',   age: 66, camp: 'Jejuri Camp 3',       condition: 'Chest discomfort',  status: 'referred' },
    { id: 'P-1049', name: 'Meera Gaikwad',    age: 22, camp: 'Wakhari Forward Camp',condition: 'Blister / abrasion',status: 'discharged' },
    { id: 'P-1050', name: 'Baban Chavan',     age: 71, camp: 'Jejuri Camp 2',       condition: 'Dehydration',       status: 'admitted' },
    { id: 'P-1051', name: 'Pratibha Kale',    age: 48, camp: 'Phaltan Camp',        condition: 'Fracture (wrist)',  status: 'referred' },
    { id: 'P-1052', name: 'Suresh Deshmukh',  age: 55, camp: 'Jejuri Camp 1',       condition: 'Fever',             status: 'admitted' },
    { id: 'P-1053', name: 'Nirmala Jagtap',   age: 63, camp: 'Jejuri Camp 3',       condition: 'Heat exhaustion',   status: 'admitted' },
    { id: 'P-1054', name: 'Vitthal Pathare',  age: 40, camp: 'Wakhari Forward Camp',condition: 'Minor injury',      status: 'discharged' },
    { id: 'P-1055', name: 'Sarika Wagh',      age: 31, camp: 'Phaltan Camp',        condition: 'Gastro upset',      status: 'discharged' }
  ];
  /* Instant fallback shown before loadPatientsFromBackend() resolves; the
     backend (backend/store.py's patients table) is the durable source of
     truth once the fetch lands, same pattern as the live feed. */
  var patientsCache = PATIENTS.slice();

  /* ══════════════ LIVE FEED ══════════════ */
  var CAT_TAG = { police: 'tag--police', medical: 'tag--med', dindi: 'tag--dindi', municipal: 'tag--muni', sanitation: 'tag--san' };
  var ST_CLASS = { reported: '', ack: 'fstat--ack', progress: 'fstat--progress', resolved: 'fstat--resolved' };

  /* No seed/synthetic items — the feed only ever shows real submitted
     reports (see pushFeedItem, called from renderRecords' submit handler). */
  var feedItems = [];
  var NEW_MS = 45000;

  /* Was hard-coded English, so the Marathi board still read
     "12 min ago" in an otherwise fully translated feed. */
  function timeAgo(ts) {
    var mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
    if (mins < 1) return t('time.now');
    if (mins < 60) return mins + ' ' + t('time.min');
    return Math.floor(mins / 60) + ' ' + t('time.hr');
  }

  function feedNode(item) {
    var age = Date.now() - item.ts;
    var isNew = age < NEW_MS;
    var headline = (curLang() === 'mr' && item.h_mr) ? item.h_mr : item.h;
    var li = document.createElement('li');
    li.className = 'fitem' + (age < 1200 ? ' fitem--enter' : '');
    li.dataset.cat = item.cat;
    li.dataset.sev = item.sev;
    li.dataset.status = item.st;
    li.innerHTML =
      '<i class="fitem__sev"></i>' +
      '<div class="fitem__main">' +
        '<h4>' + esc(headline) + (isNew ? '<span class="fitem__new">New</span>' : '') + '</h4>' +
        '<div class="fitem__meta">' +
          '<span class="tag ' + (CAT_TAG[item.cat] || '') + '">' + esc(t('chip.' + item.cat)) + '</span>' +
          '<span class="fitem__loc">' + esc(item.loc) + '<span>' + esc(item.mr) + '</span></span>' +
          '<span>' + esc(item.d) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="fitem__side">' +
        '<span class="fitem__time">' + esc(timeAgo(item.ts)) + '</span>' +
        '<span class="fstat ' + (ST_CLASS[item.st] || '') + '">' + esc(t('fstat.' + item.st)) + '</span>' +
      '</div>';
    return li;
  }

  function renderFeed() {
    var list = $('#dashFeedList');
    if (!list) return;
    var sorted = feedItems.slice().sort(function (a, b) { return b.ts - a.ts; });
    list.innerHTML = '';
    if (!sorted.length) {
      list.innerHTML = '<li class="feed-empty">' + t('feed.empty') + '</li>';
    } else {
      sorted.slice(0, 12).forEach(function (item) {
        var node = feedNode(item);
        list.appendChild(node);
        if (Date.now() - item.ts < 1200) M.flipIn(node);
      });
    }
    var updated = $('#feedUpdated');
    if (updated) updated.textContent = sorted.length ? (t('feed.updated') + ' ' + timeAgo(sorted[0].ts)) : '';
  }

  function pushFeedItem(item) {
    item.ts = Date.now();
    feedItems.unshift(item);
    if (feedItems.length > 30) feedItems.length = 30;
    renderFeed();
  }

  /* The feed is durable server-side (backend/store.py's feed_events table),
     not just this tab's in-memory feedItems — so a reload, a second tab, or
     coming back later all show the real submitted history, not an empty
     list. pushFeedItem() above still gives instant optimistic feedback the
     moment a report is submitted; this reconciles with the source of truth
     right after (and on every dashboard load). */
  function feedEventToItem(evt) {
    var loc = LOCATIONS.filter(function (l) { return l.id === evt.location_id; })[0];
    var camp = CAMPS.filter(function (c) { return c.id === evt.camp_id; })[0];
    var role = roleById(evt.role);
    var typeLabel = evt.type ? t(evt.type) : '';
    var headline = typeLabel ? typeLabel + (evt.details ? ' — ' + evt.details : '') : (evt.details || ((role ? roleName(role) : evt.role) + ' update'));
    return {
      cat: evt.role, sev: SEV_MAP[evt.severity] || 'info', st: 'reported',
      loc: loc ? loc.en : (camp ? camp.en : '—'), mr: loc ? loc.mr : (camp ? camp.mr : ''),
      h: headline, h_mr: headline,
      d: role ? roleName(role) : evt.role,
      ts: new Date(evt.ts).getTime()
    };
  }

  /* Signature of the last payload rendered, so a poll that returns
     unchanged data does not re-render — re-rendering replays the entrance
     animation and would make the list flicker every few seconds. */
  var feedSig = null;

  function loadFeedFromBackend() {
    return fetch(BACKEND_URL + '/api/feed?limit=30', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('backend responded ' + r.status); return r.json(); })
      .then(function (events) {
        var sig = JSON.stringify(events);
        if (sig === feedSig) return;
        feedSig = sig;
        feedItems = events.map(feedEventToItem);
        renderFeed();
      })
      .catch(function (err) { console.warn('[Wari] feed backend unavailable:', err.message); });
  }

  /* Synthetic FEED_POOL auto-injection is disabled — the feed now only
     shows real submitted reports. This just keeps "X min ago" labels current. */
  function startFeedClock() {
    setInterval(renderFeed, 30000);
  }

  /* ══════════════ LIVE SYNC ══════════════
     The backend is the shared source of truth, but the app used to read it
     once at sign-in and never again — so a patient registered by Medical,
     or a report filed by Police, only appeared on another authority's
     screen after a manual page reload. Poll for both instead, so every
     signed-in device converges on the same picture within one interval.

     Skipped while the tab is hidden (a background tab needs no updates,
     and each poll is a real request), and run immediately on return so
     coming back to the tab shows current data rather than waiting. */
  var LIVE_SYNC_MS = 15000;
  var liveSyncTimer = null;

  function liveSyncTick() {
    if (document.hidden) return;
    loadFeedFromBackend();
    if (currentRole && currentRole.pages.indexOf('medical') !== -1) loadPatientsFromBackend();
  }

  function startLiveSync() {
    if (liveSyncTimer) clearInterval(liveSyncTimer);
    liveSyncTimer = setInterval(liveSyncTick, LIVE_SYNC_MS);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) liveSyncTick();
    });
  }

  /* ══════════════ INTEL (live — backed by the Flask backend + model service) ══════════════
     GET {BACKEND}/api/intel returns an aggregate across every location, built by the
     backend from real POST /model/analyze calls (see MODEL_INTEGRATION.md). Nothing here
     invents scores or copy — it only renders what the model actually returned. */
  var BACKEND_URL = window.WCI_BACKEND_URL || 'http://127.0.0.1:5050';
  /* Bearer token for the signed-in authority, issued by POST /api/auth/login. */
  var authToken = null;
  var RISK_STATUS_KEY = { NORMAL: 'gauge.low', ELEVATED: 'gauge.mod', HIGH: 'gauge.high', CRITICAL: 'gauge.crit' };
  /* Green / amber / orange / red, the same bands the distribution card counts. */
  var RISK_BAND = {
    NORMAL: { cls: 'ok', key: 'gauge.low' },
    ELEVATED: { cls: 'warn', key: 'gauge.mod' },
    HIGH: { cls: 'high', key: 'gauge.high' },
    CRITICAL: { cls: 'crit', key: 'gauge.crit' }
  };
  var BAND_ORDER = ['CRITICAL', 'HIGH', 'ELEVATED', 'NORMAL'];
  var intelBand = 'all';
  var intelShowAll = false;

  function escapeRe(x) { return String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* Every headline arrives as "Lonand — CRITICAL: Dindi / crowd pressure
     62", but the row already shows both the name and the band. Strip the
     prefix so the line carries only what actually differs. */
  function trimHeadline(l) {
    var h = String(l.headline || '').trim();
    var name = l.name || l.id || '';
    if (name) h = h.replace(new RegExp('^' + escapeRe(name) + '\\s*[\u2014\u2013-]\\s*'), '');
    h = h.replace(/^(NORMAL|ELEVATED|HIGH|CRITICAL)\s*[:\u2014\u2013-]?\s*/i, '');
    return h.trim() || t('situation.' + l.situation_class);
  }
  var RISK_STATUS_CLASS = { NORMAL: '', ELEVATED: 'is-mod', HIGH: 'is-high', CRITICAL: 'is-crit' };
  var lastIntelSummary = null;

  function setIntelStatus(msg, isError) {
    var el = $('#intelStatus'), body = $('#intelBody');
    if (!el) return;
    el.hidden = !msg;
    el.className = 'intel-status-line' + (isError ? ' is-error' : '');
    el.textContent = msg || '';
    if (body) body.style.display = msg ? 'none' : '';
  }

  function fetchIntel(refresh) {
    return fetch(BACKEND_URL + '/api/intel' + (refresh ? '?refresh=1' : ''), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('backend responded ' + r.status);
        return r.json();
      });
  }

  /* Red / orange / amber / green bands, each carrying its own count so
     the filter row doubles as a summary of where the risk sits. */
  function renderIntelFilters() {
    var el = $('#intelFilters');
    if (!el || !lastIntelSummary) return;
    var all = lastIntelSummary.locations_ranked;
    var counts = {};
    all.forEach(function (l) { counts[l.status] = (counts[l.status] || 0) + 1; });

    var opts = [{ id: 'all', label: t('patient.all'), cls: '', n: all.length }].concat(
      BAND_ORDER.map(function (b) {
        return { id: b, label: t(RISK_BAND[b].key), cls: RISK_BAND[b].cls, n: counts[b] || 0 };
      }));

    el.innerHTML = opts.map(function (o) {
      var on = intelBand === o.id;
      return '<button type="button" class="chip chip--band' + (on ? ' is-on' : '') + '"' +
        ' data-band="' + o.id + '" aria-pressed="' + on + '"' + (o.n ? '' : ' disabled') + '>' +
        (o.cls ? '<i class="band-dot band-dot--' + o.cls + '"></i>' : '') +
        esc(o.label) + '<span class="chip__n">' + o.n + '</span></button>';
    }).join('');

    el.onclick = function (e) {
      var b = e.target.closest('.chip');
      if (!b || b.disabled) return;
      intelBand = b.getAttribute('data-band');
      M.pop(b);
      renderIntelFilters();
      renderIntelLocations();
    };
  }

  /* The panel is "Locations at Risk", but eleven of fifteen are normal
     on a calm day. The calm ones stay folded behind the toggle instead
     of filling the page with rows that all read the same. */
  function renderIntelLocations() {
    var list = $('#intelLocList');
    if (!list || !lastIntelSummary) return;
    var all = lastIntelSummary.locations_ranked;
    var rows = intelBand === 'all' ? all.slice() : all.filter(function (l) { return l.status === intelBand; });

    var risky = rows.filter(function (l) { return l.status !== 'NORMAL'; });
    var canCollapse = intelBand === 'all' && risky.length > 0 && risky.length < rows.length;
    var shown = (canCollapse && !intelShowAll) ? risky : rows;

    if (!shown.length) {
      list.innerHTML = '<div class="loc-empty">' + esc(t('intel.noBand')) + '</div>';
    } else {
      list.innerHTML = shown.map(function (l) {
        var band = RISK_BAND[l.status] || RISK_BAND.NORMAL;
        var doms = l.domains || {};
        var badges = Object.keys(doms).map(function (k) {
          return '<span class="loc-dom is-active">' + sDot(doms[k]) + esc(t('chip.' + k)) + '</span>';
        }).join('');
        return '<button type="button" class="intel-loc-item intel-loc-item--' + esc(l.status) + '"' +
          ' data-loc="' + esc(l.id) + '" aria-expanded="false"' +
          ' aria-label="' + esc((l.name || l.id) + ' — ' + t(band.key) + ' ' + l.risk_score) + '">' +
          '<span class="intel-loc-row">' +
            '<span class="intel-loc-item__rank">' + (all.indexOf(l) + 1) + '</span>' +
            '<span class="intel-loc-item__main">' +
              '<span class="intel-loc-item__name">' + esc(l.name || l.id) + '</span>' +
              '<span class="intel-loc-item__headline">' + esc(trimHeadline(l)) + '</span>' +
            '</span>' +
            '<span class="intel-loc-item__band"><i class="band-dot band-dot--' + band.cls + '"></i>' +
              esc(t(band.key)) + '</span>' +
            '<span class="intel-loc-item__score">' + esc(l.risk_score) + '</span>' +
            '<span class="intel-loc-item__chev" aria-hidden="true">▾</span>' +
          '</span>' +
          '<span class="intel-loc-detail">' +
            '<span class="intel-loc-detail__sit">' + esc(t('situation.' + l.situation_class)) + '</span>' +
            (badges ? '<span class="intel-loc-detail__doms">' + badges + '</span>' : '') +
          '</span>' +
        '</button>';
      }).join('');
    }

    var more = $('#intelMoreBtn');
    if (more) {
      more.hidden = !canCollapse;
      more.textContent = intelShowAll
        ? t('intel.showLess')
        : t('intel.showAll') + ' · ' + rows.length;
      more.onclick = function () { intelShowAll = !intelShowAll; renderIntelLocations(); };
    }

    list.onclick = function (e) {
      var item = e.target.closest('.intel-loc-item');
      if (!item) return;
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      item.setAttribute('aria-expanded', String(open));
      M.expand($('.intel-loc-detail', item), open);
    };

    M.stagger($$('.intel-loc-item', list), { y: 12, stagger: 0.035, duration: 0.45 });
  }

  function renderIntelFromModel(data) {
    lastIntelSummary = data;
    setIntelStatus(null);

    /* The arc had no transition on stroke-dashoffset, so a refreshed
       score snapped to its new value. It now sweeps, and the number
       counts with it. */
    var CIRC = 2 * Math.PI * 98;
    var arc = $('#intelArc'), num = $('#intelNum'), state = $('#intelState');
    M.arc(arc, data.risk_score, CIRC);
    M.countUp(num, Math.round(data.risk_score), { duration: 1.4 });
    var gauge = $('#intelGauge');
    if (gauge) gauge.className = 'gauge' + (RISK_STATUS_CLASS[data.status] ? ' ' + RISK_STATUS_CLASS[data.status] : '');
    if (state) state.textContent = t(RISK_STATUS_KEY[data.status] || 'gauge.low');

    var freshMin = Math.round(data.data_freshness.current_age_minutes);
    var conf = $('#intelConf');
    if (conf) {
      conf.innerHTML =
        '<div><span>' + esc(t('brief.freshness')) + '</span><b>' + esc(t('freshness.' + data.data_freshness.grade)) + ' · ' + freshMin + ' min</b></div>' +
        '<div><span>' + esc(t('brief.confidence')) + '</span><b>' + esc(t('confidence.' + data.confidence.grade)) + '</b></div>' +
        '<div><span>' + esc(t('brief.locations')) + '</span><b data-conf-n>0</b></div>';
      M.countUp($('[data-conf-n]', conf), data.locations_ranked.length, { duration: 0.8 });
      M.stagger($$('div', conf), { y: 12, stagger: 0.07 });
    }

    /* How the ranked locations are spread across the four risk bands. */
    var dist = { NORMAL: 0, ELEVATED: 0, HIGH: 0, CRITICAL: 0 };
    data.locations_ranked.forEach(function (l) { dist[l.status] = (dist[l.status] || 0) + 1; });
    var nLoc = data.locations_ranked.length;
    renderMCard($('#intelDist'), {
      title: t('intel.distribution'),
      icon: 'i-pulse',
      figure: { value: nLoc, unit: t('liveops.locations') },
      segments: [
        { cls: 'ok', w: pctOf(dist.NORMAL, nLoc), label: t('gauge.low'), n: dist.NORMAL },
        { cls: 'warn', w: pctOf(dist.ELEVATED, nLoc), label: t('gauge.mod'), n: dist.ELEVATED },
        { cls: 'high', w: pctOf(dist.HIGH, nLoc), label: t('gauge.high'), n: dist.HIGH },
        { cls: 'crit', w: pctOf(dist.CRITICAL, nLoc), label: t('gauge.crit'), n: dist.CRITICAL }
      ]
    });

    renderIntelFilters();
    renderIntelLocations();

    function tagged(label, locName) {
      return label + (locName ? ' <span class="intel-tag">— ' + esc(locName) + '</span>' : '');
    }
    /* Each section is a disclosure carrying its own count, so the brief
       opens as a short contents page rather than four long lists. */
    function block(id, headingKey, hClass, items, emptyKey, open) {
      var body = items.length
        ? '<ul>' + items.join('') + '</ul>'
        : '<p class="panel__hint">' + esc(t(emptyKey)) + '</p>';
      return '<section class="doc__blk" data-blk="' + id + '">' +
        '<button type="button" class="doc__toggle" aria-expanded="' + (open ? 'true' : 'false') +
          '" aria-controls="docblk-' + id + '">' +
          '<span class="doc__h' + (hClass ? ' ' + hClass : '') + '">' + esc(t(headingKey)) + '</span>' +
          '<span class="doc__count">' + items.length + '</span>' +
          '<span class="doc__chev" aria-hidden="true">▾</span>' +
        '</button>' +
        '<div class="doc__body" id="docblk-' + id + '"' + (open ? '' : ' style="display:none"') + '>' +
          body +
        '</div>' +
      '</section>';
    }

    var keyFactorItems = data.key_factors.map(function (f) { return '<li>' + esc(f) + '</li>'; });
    var gapItems = data.resource_gaps.map(function (g) {
      return '<li>' + tagged(esc(t('domain.' + g.domain)) + ' — ' + esc(g.detail), g.location_name) + '</li>';
    });
    var emergingItems = data.emerging_risks.map(function (e) {
      return '<li>' + tagged(esc(e.title) + ' — ' + esc(e.rationale), e.location_name) + '</li>';
    });
    var actionItems = data.priority_actions.map(function (a) {
      return '<li>' + tagged(esc(a.action) + ' — ' + esc(a.why), a.location_name) +
        ' <span class="intel-tag">(' + esc(a.authority) + ')</span></li>';
    });

    var doc = $('#intelDoc');
    if (doc) {
      doc.classList.remove('is-generating');
      doc.innerHTML =
        '<div class="doc__orn"></div>' +
        '<header class="doc__head">' +
          '<span class="ai-badge">' + iconSvg('i-spark', 'ai-badge__icon') +
            '<span>' + esc(t('intel.aiBadge')) + '</span></span>' +
          '<b>' + esc(t(RISK_STATUS_KEY[data.status] || 'gauge.low')) + '</b>' +
        '</header>' +
        '<p class="ai-note">' + esc(t('intel.aiNote')) + '</p>' +
        block('factors', 'intel.keyFactors', '', keyFactorItems, 'intel.allCalm', true) +
        block('gaps', 'doc.resourceGaps', '', gapItems, 'intel.noGaps', false) +
        block('emerging', 'doc.emerging', '', emergingItems, 'intel.noEmerging', false) +
        block('actions', 'doc.attention', 'doc__h--act', actionItems, 'intel.noActions', true) +
        '<footer class="doc__foot"><span>' + esc(t('intel.modelVersion')) + ' ' + esc(data.model_version) + ' · ' +
          esc(t('intel.asOf')) + ' ' + esc(new Date(data.analyzed_at).toLocaleTimeString()) + '</span><span>' +
          esc(t('doc.sim')) + '</span></footer>';

      doc.onclick = function (e) {
        var btn = e.target.closest('.doc__toggle');
        if (!btn) return;
        var blk = btn.closest('.doc__blk');
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        blk.classList.toggle('is-open', open);
        M.expand($('.doc__body', blk), open);
      };
      $$('.doc__blk', doc).forEach(function (blk) {
        if ($('.doc__toggle', blk).getAttribute('aria-expanded') === 'true') blk.classList.add('is-open');
      });
    }

    M.stagger($$('.doc__blk', doc), { y: 14, stagger: 0.06 });
    /* Items arrive one after another, so a regenerated brief reads as
       having just been written rather than simply swapped in. */
    M.stagger($$('.doc__body li', doc), { y: 8, stagger: 0.025, delay: 0.2, duration: 0.4 });
    updateWariStatusStat();
    refreshLiveStatuses();
  }

  /* The brief is written by the model, so a refresh should look like it
     is being written: the document is replaced by a shimmer, then the
     sections arrive. */
  function setIntelGenerating(on) {
    var doc = $('#intelDoc'), badge = $('#intelLiveBadge');
    if (badge) badge.classList.toggle('is-generating', on);
    if (!doc || !on) return;
    doc.classList.add('is-generating');
    doc.innerHTML =
      '<div class="doc__orn"></div>' +
      '<header class="doc__head">' +
        '<span class="ai-badge is-live">' + iconSvg('i-spark', 'ai-badge__icon') +
          '<span>' + esc(t('intel.generating')) + '<i class="ai-dots"><i></i><i></i><i></i></i></span></span>' +
      '</header>' +
      '<div class="ai-skeleton"><span></span><span></span><span></span><span></span><span></span></div>';
  }

  function loadIntel(refresh) {
    var btn = $('#intelRefreshBtn');
    if (btn) { btn.disabled = true; btn.textContent = t('intel.refreshing'); }
    if (!lastIntelSummary) setIntelStatus(t('intel.loading'));
    if (refresh) setIntelGenerating(true);
    var started = Date.now();
    return fetchIntel(refresh)
      .then(function (data) {
        /* Hold the shimmer briefly on a manual refresh so the analysis
           visibly regenerates instead of flickering past. */
        if (!refresh) return data;
        var wait = Math.max(0, 650 - (Date.now() - started));
        return new Promise(function (res) { setTimeout(function () { res(data); }, wait); });
      })
      .then(renderIntelFromModel)
      .catch(function (err) {
        console.warn('[Wari] intel backend unavailable:', err.message);
        setIntelGenerating(false);
        if (!lastIntelSummary) setIntelStatus(t('intel.offline'), true);
        else if (lastIntelSummary) renderIntelFromModel(lastIntelSummary);
      })
      .then(function () {
        if (btn) { btn.disabled = false; btn.textContent = t('intel.refresh'); }
      });
  }

  function updateWariStatusStat() {
    var cell = $('#statWariStatus');
    if (!cell || !lastIntelSummary) return;
    M.countUp(cell.querySelector('.stat-strip__n'), lastIntelSummary.risk_score, { duration: 0.9 });
    cell.querySelector('.stat-strip__label').textContent =
      t('stat.wariStatus') + ' — ' + t(RISK_STATUS_KEY[lastIntelSummary.status] || 'gauge.low');
  }

  /* ══════════════ REPORT FORM (Records) ══════════════ */
  function locOptions() { return LOCATIONS.map(function (l) { return '<option value="' + l.id + '">' + l.en + ' / ' + l.mr + '</option>'; }).join(''); }
  function campOptions() { return CAMPS.map(function (c) { return '<option value="' + c.id + '">' + c.en + '</option>'; }).join(''); }
  function tOptions(keys) { return keys.map(function (k) { return '<option value="' + k + '">' + t(k) + '</option>'; }).join(''); }

  function reportFields() {
    return {
      dindi: [
        { key: 'location', labelKey: 'field.location', type: 'select', options: locOptions() },
        { key: 'headcount', labelKey: 'field.headcount', type: 'number' },
        { key: 'delay', labelKey: 'field.delay', type: 'number' },
        { key: 'details', labelKey: 'field.memberIssue', type: 'textarea' }
      ],
      medical: [
        { key: 'camp', labelKey: 'field.camp', type: 'select', options: campOptions() },
        { key: 'type', labelKey: 'field.updateType', type: 'select', options: tOptions(['opt.campLoad', 'opt.medShortage', 'opt.emergency', 'opt.ambRequest']) },
        { key: 'details', labelKey: 'field.details', type: 'textarea' }
      ],
      police: [
        { key: 'location', labelKey: 'field.location', type: 'select', options: locOptions() },
        { key: 'type', labelKey: 'field.incidentType', type: 'select', options: tOptions(['opt.accident', 'opt.congestion', 'opt.blockage', 'opt.crowdIssue']) },
        { key: 'severity', labelKey: 'field.severity', type: 'select', options: tOptions(['opt.low', 'opt.medium', 'opt.high', 'opt.critical']) },
        { key: 'details', labelKey: 'field.details', type: 'textarea' }
      ],
      municipal: [
        { key: 'location', labelKey: 'field.location', type: 'select', options: locOptions() },
        { key: 'type', labelKey: 'field.category', type: 'select', options: tOptions(['opt.water', 'opt.shelter', 'opt.electricity', 'opt.infra']) },
        { key: 'details', labelKey: 'field.details', type: 'textarea' }
      ],
      sanitation: [
        { key: 'location', labelKey: 'field.location', type: 'select', options: locOptions() },
        { key: 'type', labelKey: 'field.category', type: 'select', options: tOptions(['opt.toilet', 'opt.cleanliness', 'opt.facility']) },
        { key: 'details', labelKey: 'field.details', type: 'textarea' }
      ]
    };
  }
  var SEV_MAP = { 'opt.low': 'info', 'opt.medium': 'info', 'opt.high': 'high', 'opt.critical': 'critical' };

  /* Context before filing: where this authority's own domain stands
     across the route right now. Falls back to the whole-route rollup
     for roles that map to no single domain (Dindi). */
  function renderRecordsCard(role) {
    var el = $('#recordsCard');
    if (!el || !role) return;
    var dom = DOMAINS.filter(function (d) { return d.id === role.id; })[0];
    var states = dom
      ? LOCATIONS.map(function (l) { return domainStatus(l.id, dom.id); })
      : LOCATIONS.map(locWorstStatus);
    var c = tally(states);

    renderMCard(el, {
      title: dom ? t('chip.' + dom.id) + ' — ' + t('liveops.coverage') : t('liveops.coverage'),
      icon: dom ? dom.icon : 'i-pulse',
      figure: { value: c.ok, unit: t('dial.clear') },
      segments: [
        { cls: 'ok', w: pctOf(c.ok, c.total), label: statusWord('ok'), n: c.ok },
        { cls: 'warn', w: pctOf(c.warn, c.total), label: statusWord('warn'), n: c.warn },
        { cls: 'crit', w: pctOf(c.crit, c.total), label: statusWord('crit'), n: c.crit }
      ],
      cta: {
        text: t('dcard.ctaText'),
        btn: t('ui.moreDetails'),
        /* Was live-ops — a supervisor filing nothing here has no report to
           track down; the dashboard is where the wider picture actually is. */
        onClick: function () { showPage('dashboard'); }
      }
    });
  }

  function renderRecords(role) {
    renderRecordsCard(role);

    var form = $('#reportForm');
    if (!form) return;
    var fields = reportFields()[role.id] || [];
    form.innerHTML = fields.map(function (f) {
      var input = f.type === 'textarea' ? '<textarea id="rf-' + f.key + '"></textarea>'
        : f.type === 'select' ? '<select id="rf-' + f.key + '">' + f.options + '</select>'
        : '<input id="rf-' + f.key + '" type="' + f.type + '" />';
      return '<label class="field"><span>' + t(f.labelKey) + '</span>' + input + '</label>';
    }).join('') + '<button type="submit" class="btn btn--lg report-form__submit">' + t('records.submit') + '</button>';

    form.onsubmit = function (e) {
      e.preventDefault();
      var values = {};
      fields.forEach(function (f) { values[f.key] = $('#rf-' + f.key, form).value; });

      var loc = LOCATIONS.filter(function (l) { return l.id === values.location; })[0];
      var camp = CAMPS.filter(function (c) { return c.id === values.camp; })[0];
      var typeLabel = values.type ? t(values.type) : '';
      var headline = typeLabel ? typeLabel + (values.details ? ' — ' + values.details : '') : (values.details || (roleName(role) + ' update'));
      pushFeedItem({
        cat: role.id, sev: SEV_MAP[values.severity] || 'info', st: 'reported',
        loc: loc ? loc.en : (camp ? camp.en : '—'), mr: loc ? loc.mr : (camp ? camp.mr : ''),
        h: headline, h_mr: headline, d: roleName(role)
      });
      submitReportToBackend(role.id, values);
      toast(t('toast.reportSubmitted'));
      form.reset();
    };
  }

  /* Forward the report to the Flask backend so it updates the affected
     location's operational state and re-runs the model. Best-effort —
     the local feed above already gives instant feedback either way. */
  function submitReportToBackend(roleId, values) {
    fetch(BACKEND_URL + '/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: roleId,
        location_id: values.location || null,
        camp_id: values.camp || null,
        headcount: values.headcount || null,
        delay: values.delay || null,
        type: values.type || null,
        severity: values.severity || null,
        details: values.details || null
      })
    }).then(function (r) {
      if (r.ok) { loadIntel(true); loadFeedFromBackend(); }
    }).catch(function (err) {
      console.warn('[Wari] report backend unavailable:', err.message);
    });
  }

  /* ============== CARD ARCHETYPE 1 - RADIAL DOT DIAL ==============
     Two concentric rings of dots on oxblood. The outer ring is the
     route; the inner ring is one dot per domain check behind it, so
     the card is a dot-plot of real state rather than decoration. Dots
     light in order from twelve o-clock, so it reads as a dial filling. */
  var DIAL_GEO = { size: 400, cx: 200, cy: 200, rOuter: 168, rInner: 134, dOuter: 7.4, dInner: 5.6 };
  var DIAL_COLOR = { gold: '#C9A227', ok: '#5F8F54', warn: '#C98A16', crit: '#E2361B' };

  function dialRing(states, radius, r, palette) {
    var G = DIAL_GEO, out = [], n = states.length;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * 2 * Math.PI - Math.PI / 2;   /* start at the top */
      var x = (G.cx + radius * Math.cos(a)).toFixed(2);
      var y = (G.cy + radius * Math.sin(a)).toFixed(2);
      var st = states[i];
      var dim = st === 'dim';
      out.push('<circle class="dial-card__dot' + (dim ? ' dial-card__dot--dim' : '') + '"' +
        ' cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + (palette[dim ? 'gold' : st] || palette.gold) + '"/>');
    }
    return out.join('');
  }

  function dialMetric(m) {
    return '<div class="dial-card__metric">' +
      '<div class="dial-card__metric-top">' +
        '<i class="dial-card__tick' + (m.flag ? ' dial-card__tick--flag' : '') + '"></i>' +
        '<span class="dial-card__metric-lab">' + esc(m.lab) + '</span>' +
      '</div>' +
      '<b class="dial-card__metric-n" data-metric-to="' + m.value + '">0</b>' +
      (m.sub ? '<span class="dial-card__metric-sub' + (m.flag ? ' dial-card__metric-sub--flag' : '') + '">' + esc(m.sub) + '</span>' : '') +
    '</div>';
  }

  function renderDial(el, cfg) {
    if (!el) return;
    var G = DIAL_GEO;
    var outer = dialRing(cfg.outer, G.rOuter, G.dOuter, DIAL_COLOR);
    var inner = dialRing(cfg.inner, G.rInner, G.dInner, DIAL_COLOR);

    el.innerHTML =
      '<div class="dial-card__head">' +
        '<span class="dial-card__label">' + esc(cfg.label) + '</span>' +
        (cfg.tag ? '<span class="dial-card__tag">' + esc(cfg.tag) + '</span>' : '') +
      '</div>' +
      '<div class="dial-card__stage">' +
        '<svg class="dial-card__svg" viewBox="0 0 ' + G.size + ' ' + G.size + '" aria-hidden="true">' +
          '<g data-ring="outer">' + outer + '</g>' +
          '<g data-ring="inner">' + inner + '</g>' +
        '</svg>' +
        '<div class="dial-card__fade"></div>' +
        '<div class="dial-card__center">' +
          '<span class="dial-card__center-lab">' + esc(cfg.center.lab) + '</span>' +
          '<b class="dial-card__center-n" data-dial-n>0</b>' +
          (cfg.center.sub ? '<span class="dial-card__center-sub">' + esc(cfg.center.sub) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="dial-card__foot">' +
        '<div class="dial-card__metrics">' + (cfg.metrics || []).map(dialMetric).join('') + '</div>' +
        (cfg.btn ? '<button type="button" class="dial-card__btn" data-dial-btn>' +
          '<span>' + esc(cfg.btn.label) + '</span><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-arrow"/></svg></button>' : '') +
      '</div>';

    /* The two rings fill one after the other, then the readout lands. */
    M.ring($$('[data-ring="outer"] circle', el), { each: 0.012 });
    M.ring($$('[data-ring="inner"] circle', el), { each: 0.008, delay: 0.22 });
    M.countUp($('[data-dial-n]', el), cfg.center.value, {
      suffix: cfg.center.suffix || '', delay: 0.35, duration: 1.2
    });
    $$('[data-metric-to]', el).forEach(function (n, i) {
      M.countUp(n, parseFloat(n.getAttribute('data-metric-to')) || 0, { delay: 0.5 + i * 0.1, duration: 0.9 });
    });

    var btn = $('[data-dial-btn]', el);
    if (btn && cfg.btn && cfg.btn.onClick) {
      btn.addEventListener('click', cfg.btn.onClick);
      M.magnetic(btn, 0.18);
    }
    M.tilt(el, 3);
  }

  /* ============== CARD ARCHETYPE 2 - FIGURE + SHARE BAR ==============
     One animated headline figure, a stacked share bar with a counted
     legend, an authority stack drawn from the Warli role glyphs, and
     an optional call to action. */
  function iconSvg(id, cls) {
    var vb = id.indexOf('i-') === 0 ? '0 0 24 24' : '0 0 120 100';
    return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="' + vb + '" aria-hidden="true"><use href="#' + id + '"/></svg>';
  }

  function renderMCard(el, cfg) {
    if (!el) return;
    var segments = cfg.segments || [];
    var bar = segments.map(function (sg) {
      return '<span class="mcard__seg mcard__seg--' + sg.cls + '" data-w="' + sg.w + '"></span>';
    }).join('');
    var legend = segments.filter(function (sg) { return sg.label; }).map(function (sg) {
      return '<span><i class="mcard__key mcard__key--' + sg.cls + '"></i>' + esc(sg.label) +
        (sg.n == null ? '' : ' <b>' + sg.n + '</b>') + '</span>';
    }).join('');

    var stack = '';
    if (cfg.stack && cfg.stack.items && cfg.stack.items.length) {
      stack = '<div class="mcard__legend" style="margin-top:1.1rem"><span>' + esc(cfg.stack.label) + '</span></div>' +
        '<div class="mcard__stack">' + cfg.stack.items.map(function (it) {
          return '<span class="mcard__av' + (it.cls ? ' mcard__av--' + it.cls : '') + '" title="' + esc(it.title) + '">' +
            iconSvg(it.icon) + '</span>';
        }).join('') + '</div>';
    }

    var cta = '';
    if (cfg.cta) {
      cta = '<div class="mcard__cta">' +
        '<div class="mcard__cta-txt">' +
          '<span class="mcard__cta-puck">' + iconSvg(cfg.cta.icon || 'i-bolt') + '</span>' +
          '<p>' + esc(cfg.cta.text) + '</p>' +
        '</div>' +
        '<button type="button" class="btn btn--sm" data-mcard-cta><span>' + esc(cfg.cta.btn) + '</span></button>' +
      '</div>';
    }

    el.innerHTML =
      '<div class="card-head">' +
        '<span class="card-head__title">' + (cfg.icon ? iconSvg(cfg.icon, 'card-head__icon') : '') + esc(cfg.title) + '</span>' +
        (cfg.action ? '<button type="button" class="card-head__btn" data-mcard-action title="' + esc(cfg.action.label) + '" aria-label="' + esc(cfg.action.label) + '">' +
          iconSvg(cfg.action.icon || 'i-filter') + '</button>' : '') +
      '</div>' +
      '<div class="mcard__figure">' +
        '<b class="mcard__n" data-mcard-n>0</b>' +
        (cfg.figure.unit ? '<span class="mcard__unit">' + esc(cfg.figure.unit) + '</span>' : '') +
      '</div>' +
      '<div class="mcard__bar">' + bar + '</div>' +
      '<div class="mcard__legend">' + legend + '</div>' +
      stack + cta;

    M.countUp($('[data-mcard-n]', el), cfg.figure.value, {
      decimals: cfg.figure.decimals || 0, suffix: cfg.figure.suffix || '', duration: 1.2
    });
    M.bars($$('.mcard__seg', el));
    M.stagger($$('.mcard__av', el), { y: 10, stagger: 0.05, delay: 0.5 });

    var action = $('[data-mcard-action]', el);
    if (action && cfg.action && cfg.action.onClick) action.addEventListener('click', cfg.action.onClick);
    var ctaBtn = $('[data-mcard-cta]', el);
    if (ctaBtn && cfg.cta && cfg.cta.onClick) {
      ctaBtn.addEventListener('click', cfg.cta.onClick);
      M.magnetic(ctaBtn, 0.22);
    }
  }

  /* ============== DASHBOARD ============== */
  var DOMAINS = [
    { id: 'police', icon: 'g-police' },
    { id: 'medical', icon: 'g-medical' },
    { id: 'municipal', icon: 'g-municipal' },
    { id: 'sanitation', icon: 'g-sanitation' }
  ];

  /* Prefer live per-location domain status from the backend's last analysis
     (lastIntelSummary, set in renderIntelFromModel) once it's loaded; fall
     back to the static route mock until then or if the backend is offline. */
  function liveDomainsFor(locationId) {
    if (!lastIntelSummary) return null;
    var entry = lastIntelSummary.locations_ranked.filter(function (l) { return l.id === locationId; })[0];
    return entry ? entry.domains : null;
  }

  function domainStatus(locationId, domId) {
    var live = liveDomainsFor(locationId);
    if (live && live[domId]) return live[domId];
    var loc = LOCATIONS.filter(function (l) { return l.id === locationId; })[0];
    return loc ? loc.dom[domId] : 'ok';
  }

  function domainOverall(domId) {
    return LOCATIONS.reduce(function (acc, loc) { return worst(acc, domainStatus(loc.id, domId)); }, 'ok');
  }

  /* One entry per location x domain. The inner dial ring, the share
     bars and the Live Ops coverage card are all views onto this. */
  function checkStates() {
    var out = [];
    LOCATIONS.forEach(function (loc) {
      DOMAINS.forEach(function (d) { out.push(domainStatus(loc.id, d.id)); });
    });
    return out;
  }

  function tally(states) {
    var c = { ok: 0, warn: 0, crit: 0, total: states.length };
    states.forEach(function (st) { c[st] = (c[st] || 0) + 1; });
    return c;
  }

  function locTally() {
    return tally(LOCATIONS.map(locWorstStatus));
  }

  function routeProgress() {
    var i = LOCATIONS.map(function (l) { return l.id; }).indexOf(PALKHI.locId);
    return i < 0 ? 0 : i / Math.max(1, LOCATIONS.length - 1);
  }

  /* Re-render everything driven by domain status once live data lands or
     changes (called from renderIntelFromModel, i.e. after every report).
     Re-runs without the entrance stagger so a background refresh never
     re-animates a board the operator is already reading. */
  function refreshLiveStatuses() {
    renderDashDial();
    renderDomainCard(currentRole);
    renderCoverageCard();
    renderLocGrid(false);
    renderMedCards();
    renderRecordsCard(currentRole);

    refreshMapMarkers();
    $$('.ops-map__stop[data-loc]').forEach(function (g) {
      var loc = LOCATIONS.filter(function (l) { return l.id === g.dataset.loc; })[0];
      if (!loc) return;
      var s = locWorstStatus(loc);
      g.classList.toggle('is-warn', s === 'warn');
      g.classList.toggle('is-crit', s === 'crit');
    });
  }

  /* ── the dashboard's focal dial ─────────────────────────────────
     Outer ring: how much of the route is behind the Palkhi.
     Inner ring: one dot per location x domain check, in its status. */
  function renderDashDial() {
    var el = $('#dashDial');
    if (!el) return;

    var progress = routeProgress();
    var OUTER = 48;
    var lit = Math.round(OUTER * progress);
    var outer = [];
    for (var i = 0; i < OUTER; i++) outer.push(i < lit ? 'gold' : 'dim');

    var checks = checkStates();
    var c = tally(checks);
    var locs = locTally();
    var flagged = locs.warn + locs.crit;

    renderDial(el, {
      label: t('dial.label'),
      tag: Math.round(progress * 100) + '% ' + t('dial.outer'),
      outer: outer,
      inner: checks,
      center: {
        lab: t('dial.center'),
        value: pctOf(c.ok, c.total),
        suffix: '%',
        sub: statusWord(c.crit ? 'crit' : c.warn ? 'warn' : 'ok')
      },
      metrics: [
        { lab: t('dial.clear'), value: locs.ok, sub: pctOf(locs.ok, locs.total) + '%' },
        { lab: t('dial.flagged'), value: flagged, sub: pctOf(flagged, locs.total) + '%', flag: true }
      ],
      btn: { label: t('dial.more'), onClick: function () { showPage('live-ops'); } }
    });
  }

  /* ── domain readiness: figure + share bar + authority stack ────── */
  function renderDomainCard(role) {
    var el = $('#dashDomains');
    if (!el) return;
    var c = tally(checkStates());
    var toRecords = !!(role && role.pages.indexOf('records') !== -1);

    renderMCard(el, {
      title: t('dash.domainReadiness'),
      icon: 'i-pulse',
      figure: { value: c.ok, unit: t('dcard.checks') },
      segments: [
        { cls: 'ok', w: pctOf(c.ok, c.total), label: statusWord('ok'), n: c.ok },
        { cls: 'warn', w: pctOf(c.warn, c.total), label: statusWord('warn'), n: c.warn },
        { cls: 'crit', w: pctOf(c.crit, c.total), label: statusWord('crit'), n: c.crit }
      ],
      stack: {
        label: t('dcard.authorities'),
        items: ROLES.map(function (r) {
          var dom = DOMAINS.filter(function (d) { return d.id === r.id; })[0];
          var st = dom ? domainOverall(dom.id) : null;
          return { icon: r.icon, cls: (st && st !== 'ok') ? st : '', title: roleName(r) };
        })
      },
      cta: {
        text: t('dcard.ctaText'),
        btn: toRecords ? t('dcard.ctaBtn') : t('ui.moreDetails'),
        onClick: function () { showPage(toRecords ? 'records' : 'live-ops'); }
      }
    });
  }

  function renderDashboard(role) {
    $('#dashRoleName').textContent = roleName(role);

    /* Figures are split into a number and its unit so each one can
       count up without losing the "/ 21", "km" or "+" beside it. */
    $('#statStrip').innerHTML = [
      { n: 11, sfx: ' / 21', label: t('stat.daysOnFoot') },
      { n: 138, sfx: ' km', label: t('stat.kmSoFar') },
      { n: 512, sfx: '+', label: t('stat.dindisMotion') },
      { n: LOCATIONS.length, sfx: '', label: t('stat.trackedLoc') },
      { n: null, sfx: '', label: t('stat.wariStatus'), id: 'statWariStatus' }
    ].map(function (st) {
      var num = st.n == null
        ? '<b class="stat-strip__n">--</b>'
        : '<b class="stat-strip__n" data-count="' + st.n + '" data-suffix="' + st.sfx + '">0</b>';
      return '<div class="stat-strip__cell"' + (st.id ? ' id="' + st.id + '"' : '') + '>' +
        num + '<span class="stat-strip__label">' + esc(st.label) + '</span></div>';
    }).join('');
    $$('#statStrip [data-count]').forEach(function (n, i) {
      M.countUp(n, parseFloat(n.getAttribute('data-count')) || 0, {
        suffix: n.getAttribute('data-suffix') || '', delay: i * 0.07
      });
    });
    updateWariStatusStat();

    var loc = LOCATIONS.filter(function (l) { return l.id === PALKHI.locId; })[0];
    $('#palkhiStatus').innerHTML =
      '<div class="palkhi-row"><span>' + esc(t('dash.currentlyNear')) + '</span>' +
        '<b>' + esc(loc.en) + ' <span class="palkhi-row__mr">' + esc(loc.mr) + '</span></b></div>' +
      '<div class="palkhi-row"><span>' + esc(t('dash.schedule')) + '</span>' +
        '<b><span data-palkhi-delay>0</span> ' + esc(t('dash.minBehind')) + '</b></div>';
    M.countUp($('[data-palkhi-delay]', $('#palkhiStatus')), PALKHI.delayMin, { delay: 0.3, duration: 0.9 });

    renderDashDial();
    renderDomainCard(role);
    renderFeed();
  }

  /* ══════════════ LIVE OPS ══════════════ */
  var liveOpsActive = { police: true, medical: true, municipal: true, sanitation: true };
  var liveOpsSort = 'route';

  function activeDomains() {
    return DOMAINS.filter(function (d) { return liveOpsActive[d.id]; });
  }

  /* A location's status *through the current filter* — turning a domain
     off now removes it from the rollup too, instead of only hiding its
     badge while it still coloured the card. */
  function locLensStatus(loc) {
    return activeDomains().reduce(function (acc, d) { return worst(acc, domainStatus(loc.id, d.id)); }, 'ok');
  }

  /* The "Palkhi currently near X — more details" strip used to live here
     as this card's cta block — removed per request, it duplicated
     #palkhiMini just below with nothing new in it. Route Coverage itself
     (the figure + ok/warn/crit bar) is unchanged. */
  function renderCoverageCard() {
    var el = $('#liveOpsCoverage');
    if (!el) return;
    var c = locTally();

    renderMCard(el, {
      title: t('liveops.coverage'),
      icon: 'i-pulse',
      figure: { value: c.total, unit: t('liveops.locations') },
      segments: [
        { cls: 'ok', w: pctOf(c.ok, c.total), label: statusWord('ok'), n: c.ok },
        { cls: 'warn', w: pctOf(c.warn, c.total), label: statusWord('warn'), n: c.warn },
        { cls: 'crit', w: pctOf(c.crit, c.total), label: statusWord('crit'), n: c.crit }
      ]
    });
  }

  function updateLiveOpsCount(shown, flagged) {
    var el = $('#liveOpsCount');
    if (!el) return;
    el.innerHTML = esc(t('liveops.showing')) + ' <b>' + shown + '</b> ' + esc(t('liveops.locations')) +
      ' &middot; <b>' + flagged + '</b> ' + esc(t('dial.flagged'));
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* The domain names are stated once, here, instead of on all fifteen
     cards — the cards then only need to carry colour. */
  function renderLocKey() {
    var el = $('#liveOpsKey');
    if (!el) return;
    el.innerHTML = activeDomains().map(function (d) {
      return '<span class="loc-key__item"><i class="loc-key__tick"></i>' + esc(t('chip.' + d.id)) + '</span>';
    }).join('');
  }

  function renderLocGrid(animate) {
    var grid = $('#locGrid');
    if (!grid) return;
    var doms = activeDomains();
    renderLocKey();

    if (!doms.length) {
      grid.innerHTML = '<div class="loc-empty">' + esc(t('liveops.noMatch')) + '</div>';
      updateLiveOpsCount(0, 0);
      return;
    }

    var rank = { crit: 0, warn: 1, ok: 2 };
    var rows = LOCATIONS.map(function (l, i) { return { loc: l, i: i, st: locLensStatus(l) }; });
    if (liveOpsSort === 'risk') {
      rows.sort(function (a, b) { return (rank[a.st] - rank[b.st]) || (a.i - b.i); });
    }

    grid.innerHTML = rows.map(function (r) {
      var l = r.loc;

      /* One unlabelled tick per domain, in the key's order. Sixty
         repeated words became sixty bars of colour. */
      var ticks = doms.map(function (d) {
        var st = domainStatus(l.id, d.id);
        return '<i class="loc-tick loc-tick--' + st + '" title="' +
          esc(t('chip.' + d.id) + ' — ' + statusWord(st)) + '"></i>';
      }).join('');

      /* A domain is named only where it is actually flagged, so the
         words on screen are all exceptions worth reading. */
      var flagged = doms.filter(function (d) { return domainStatus(l.id, d.id) !== 'ok'; });
      var note = flagged.length
        ? '<span class="loc-card__note">' + flagged.map(function (d) {
            return '<span class="loc-card__flag">' + sDot(domainStatus(l.id, d.id)) +
              esc(t('chip.' + d.id)) + '</span>';
          }).join('') + '</span>'
        : '';

      return '<button type="button" class="loc-card' + (r.st === 'ok' ? '' : ' loc-card--' + r.st) + '"' +
        ' data-loc="' + esc(l.id) + '" aria-label="' + esc(l.en + ' — ' + statusWord(r.st)) + '">' +
        '<span class="loc-card__top">' +
          '<span class="loc-card__no">' + pad2(r.i + 1) + '</span>' +
          '<span class="loc-card__mr">' + esc(l.mr) + '</span>' +
        '</span>' +
        '<span class="loc-card__name">' + esc(l.en) + '</span>' +
        (l.id === PALKHI.locId
          ? '<span class="loc-card__palkhi"><i></i>' + esc(t('drawer.palkhiHere')) + '</span>'
          : '') +
        '<span class="loc-card__ticks">' + ticks + '</span>' +
        note +
        '<span class="loc-card__foot">' +
          '<span class="loc-card__state">' + esc(statusWord(r.st)) + '</span>' +
          '<span class="loc-card__go" aria-hidden="true">→</span>' +
        '</span>' +
      '</button>';
    }).join('');

    updateLiveOpsCount(rows.length, rows.filter(function (r) { return r.st !== 'ok'; }).length);

    var cards = $$('.loc-card', grid);
    if (animate) M.stagger(cards, { y: 14, stagger: 0.03 });
    cards.forEach(function (c) { M.lift(c, { y: -3, scale: 1.012 }); });
  }

  function renderLiveOps() {
    var loc = LOCATIONS.filter(function (l) { return l.id === PALKHI.locId; })[0];
    $('#palkhiMini').innerHTML =
      '<svg class="panel__icon" viewBox="0 0 220 120" aria-hidden="true"><use href="#w-palkhi"/></svg>' +
      '<span>' + esc(t('liveops.palkhi')) + '</span> <b>' + esc(loc.en) + '</b> ' +
      '<span class="palkhi-row__mr">' + esc(loc.mr) + '</span> — ' +
      '<b><span data-palkhi-delay>0</span> min</b> ' + esc(t('liveops.behind'));
    M.countUp($('[data-palkhi-delay]', $('#palkhiMini')), PALKHI.delayMin, { delay: 0.2, duration: 0.9 });

    renderCoverageCard();

    /* Each chip carries how many locations it is currently flagging, so
       the filter row doubles as a where-to-look summary. */
    $('#liveOpsFilters').innerHTML = DOMAINS.map(function (d) {
      var flagged = LOCATIONS.filter(function (l) { return domainStatus(l.id, d.id) !== 'ok'; }).length;
      return '<button type="button" class="chip' + (liveOpsActive[d.id] ? ' is-on' : '') + '"' +
        ' data-dom="' + d.id + '" aria-pressed="' + !!liveOpsActive[d.id] + '">' + esc(t('chip.' + d.id)) +
        (flagged ? '<span class="chip__n">' + flagged + '</span>' : '') + '</button>';
    }).join('');

    $('#liveOpsSort').innerHTML = [
      { id: 'route', label: t('liveops.sortRoute') },
      { id: 'risk', label: t('liveops.sortRisk') }
    ].map(function (o) {
      return '<button type="button" class="chip' + (liveOpsSort === o.id ? ' is-on' : '') + '"' +
        ' data-sort="' + o.id + '" aria-pressed="' + (liveOpsSort === o.id) + '">' + esc(o.label) + '</button>';
    }).join('');

    $('#liveOpsFilters').onclick = function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      var dom = btn.dataset.dom;
      liveOpsActive[dom] = !liveOpsActive[dom];
      btn.classList.toggle('is-on', liveOpsActive[dom]);
      btn.setAttribute('aria-pressed', String(!!liveOpsActive[dom]));
      M.pop(btn);
      renderLocGrid(true);
    };

    $('#liveOpsSort').onclick = function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      liveOpsSort = btn.getAttribute('data-sort');
      $$('.chip', $('#liveOpsSort')).forEach(function (b) {
        var on = b.getAttribute('data-sort') === liveOpsSort;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      renderLocGrid(true);
    };

    $('#locGrid').onclick = function (e) {
      var card = e.target.closest('.loc-card');
      if (card) openLocDrawer(card.getAttribute('data-loc'));
    };

    renderLocGrid(true);
  }

  /* ══════════════ LOCATION DRAWER ══════════════
     A halt card was a dead tile before — every location now opens its
     full picture: route position, domain rollup and the camps on it. */
  var drawerReturnFocus = null;

  function animateDrawer(open) {
    var drawer = $('#locDrawer');
    if (!drawer) return;
    var overlay = $('.drawer__overlay', drawer), panel = $('.drawer__panel', drawer);

    if (!M.on || typeof window.gsap === 'undefined') {
      overlay.style.opacity = open ? '1' : '0';
      panel.style.transform = open ? 'translateX(0)' : 'translateX(100%)';
      if (!open) { drawer.hidden = true; document.body.classList.remove('is-locked'); }
      return;
    }
    /* The panel's resting position comes from CSS (transform:translateX(100%)).
       Once the drawer is shown, GSAP reads that computed matrix as a *pixel*
       x of 440 and then stacks its own xPercent on top — so tweening xPercent
       to 0 left the panel parked 440px off the right edge, i.e. invisible.
       Pin x to 0 on both tweens so GSAP owns the whole transform. */
    if (open) {
      gsap.to(overlay, { opacity: 1, duration: 0.3, overwrite: 'auto' });
      gsap.fromTo(panel, { xPercent: 100, x: 0 }, { xPercent: 0, x: 0, duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
      M.stagger($$('.drawer__blk', drawer), { y: 16, delay: 0.18, stagger: 0.07 });
    } else {
      gsap.to(overlay, { opacity: 0, duration: 0.25, overwrite: 'auto' });
      gsap.to(panel, {
        xPercent: 100, x: 0, duration: 0.4, ease: 'power3.in', overwrite: 'auto',
        onComplete: function () { drawer.hidden = true; document.body.classList.remove('is-locked'); }
      });
    }
  }

  function openLocDrawer(locId) {
    var loc = LOCATIONS.filter(function (l) { return l.id === locId; })[0];
    var drawer = $('#locDrawer');
    if (!loc || !drawer) return;
    drawerReturnFocus = document.activeElement;

    $('#locDrawerTitle').innerHTML = esc(loc.en) + '<span class="drawer__mr">' + esc(loc.mr) + '</span>';

    var doms = DOMAINS.map(function (d) {
      var st = domainStatus(loc.id, d.id);
      return '<div class="drawer__row"><span class="drawer__row-name">' + iconSvg(d.icon) +
        esc(t('chip.' + d.id)) + '</span>' + sBadge(st, statusWord(st)) + '</div>';
    }).join('');

    var camps = CAMPS.filter(function (c) { return c.id.split('-')[0] === loc.id; });
    var campHtml = camps.length
      ? camps.map(function (c) {
          return '<div class="drawer__row"><span class="drawer__row-name">' + esc(c.en) + '</span>' +
            sBadge(campOverall(c), pctOf(c.patients, c.capacity) + '%') + '</div>';
        }).join('')
      : '<p class="drawer__note">' + esc(t('drawer.noCamps')) + '</p>';

    var idx = LOCATIONS.map(function (l) { return l.id; }).indexOf(loc.id);
    var pos = pctOf(idx, LOCATIONS.length - 1);
    var summary = locConditionSentence(loc);

    $('#locDrawerBody').innerHTML =
      '<p class="drawer__summary drawer__summary--' + summary.status + '">' + esc(summary.text) + '</p>' +
      (loc.id === PALKHI.locId
        ? '<span class="loc-card__palkhi" style="margin-top:.9rem"><i></i>' + esc(t('drawer.palkhiHere')) + '</span>'
        : '') +
      '<div class="drawer__blk"><h4 class="drawer__h">' + esc(t('drawer.position')) + '</h4>' +
        '<div class="drawer__pos"><span>' + (idx + 1) + ' / ' + LOCATIONS.length + '</span>' +
        '<span class="drawer__pos-track"><span class="drawer__pos-fill" data-w="' + pos + '"></span></span>' +
        '<span>' + pos + '%</span></div></div>' +
      '<div class="drawer__blk"><h4 class="drawer__h">' + esc(t('drawer.domains')) + '</h4>' + doms + '</div>' +
      '<div class="drawer__blk"><h4 class="drawer__h">' + esc(t('drawer.camps')) + '</h4>' + campHtml + '</div>';

    focusMapOn(loc.id);
    drawer.hidden = false;
    document.body.classList.add('is-locked');
    M.bars($$('.drawer__pos-fill', drawer));
    animateDrawer(true);
    var close = $('#locDrawerClose');
    if (close) close.focus();
  }

  function closeLocDrawer() {
    var drawer = $('#locDrawer');
    if (!drawer || drawer.hidden) return;
    animateDrawer(false);
    if (drawerReturnFocus && drawerReturnFocus.focus) drawerReturnFocus.focus();
  }

  /* ══════════════ LIVE TRACKING MAP (Dashboard + Live Ops) ══════════════
     Satellite imagery of the real Palkhi route (Esri World Imagery,
     through Leaflet): the walked legs drawn in gold with a pulse
     running along them, the legs still ahead dashed, and one live
     status marker per halt.

     If Leaflet or its tiles cannot load, buildRouteSVG below draws the
     original stylised route instead — the board still reads correctly
     on a dead connection, which on a route like this one matters. */
  var ESRI_IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  var ESRI_PLACES = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
  var ROUTE_PATH_D = 'M60 96 C 150 60, 210 150, 288 154 S 420 226, 486 200 S 596 108, 668 138 S 780 250, 852 244 S 972 178, 1042 220 S 1120 300, 1146 330';
  var mapsBuilt = {};
  var mapObjs = {};          /* opts.id -> { map, markers, camps } */

  function locWorstStatus(loc) {
    return DOMAINS.reduce(function (acc, d) { return worst(acc, domainStatus(loc.id, d.id)); }, 'ok');
  }

  /* One sentence: whichever domain is worst off at this halt, or a clean
     bill of health if none of the four are flagged. */
  var STATUS_RANK = { ok: 0, warn: 1, crit: 2 };
  function locConditionSentence(loc) {
    var worstSt = 'ok', worstDom = null;
    DOMAINS.forEach(function (d) {
      var st = domainStatus(loc.id, d.id);
      if (STATUS_RANK[st] > STATUS_RANK[worstSt]) { worstSt = st; worstDom = d; }
    });
    if (worstSt === 'ok' || !worstDom) return { text: t('drawer.allClearSentence'), status: 'ok' };
    var key = worstSt === 'crit' ? 'drawer.critSentence' : 'drawer.warnSentence';
    return { text: t(key).replace('{domain}', t('chip.' + worstDom.id)), status: worstSt };
  }

  function legendHtml(opts) {
    /* Dashboard's map tracks the Palkhis only — the halt/capacity/attention
       legend describes domain-status colouring it no longer shows there. */
    if (opts.legend === false) return '';
    return '<div class="ops-map__legend">' +
      '<span><i class="dot dot--ok"></i>' + esc(t('route.legendOk')) + '</span>' +
      '<span><i class="dot dot--warn"></i>' + esc(t('route.legendWarn')) + '</span>' +
      '<span><i class="dot dot--crit"></i>' + esc(t('route.legendCrit')) + '</span>' +
      (opts.showCamps ? '<span>✚ ' + esc(t('liveops.camps')) + '</span>' : '') +
    '</div>';
  }

  /* Tooltip bodies, shared by the satellite markers and the SVG fallback. */
  function locTipHtml(loc) {
    var rows = DOMAINS.map(function (d) {
      var st = domainStatus(loc.id, d.id);
      return '<span class="ops-map__tip-row">' + sDot(st) + esc(t('chip.' + d.id)) + ' — ' + esc(statusWord(st)) + '</span>';
    }).join('');
    return '<b>' + esc(loc.en) + '</b><span class="ops-map__tip-mr">' + esc(loc.mr) + '</span>' + rows +
      (loc.id === PALKHI.locId
        ? '<span class="ops-map__tip-palkhi">' + esc(t('drawer.palkhiHere')) + '</span>'
        : '');
  }

  /* The Dashboard's map tracks the Palkhis only — no domain rows, just the
     halt name and, where a procession currently stands, which one and how
     far behind schedule. Also used for every halt on the second (Tukaram)
     route, which has no domain data on either page. */
  function simpleTipHtml(loc, palkhi) {
    return '<b>' + esc(loc.en) + '</b><span class="ops-map__tip-mr">' + esc(loc.mr) + '</span>' +
      (palkhi
        ? '<span class="ops-map__tip-palkhi">' + esc(t(palkhi.nameKey)) + ' — ' + palkhi.delayMin + ' ' + esc(t('liveops.behind')) + '</span>'
        : '');
  }

  function campTipHtml(camp) {
    var loadPct = pctOf(camp.patients, camp.capacity);
    var loadS = loadStatus(loadPct), icuS = ratioStatus(camp.icuAvail, camp.icuTotal), ambS = ratioStatus(camp.ambAvail, camp.ambTotal);
    return '<b>' + esc(camp.en) + '</b><span class="ops-map__tip-mr">' + esc(camp.mr) + '</span>' +
      '<span class="ops-map__tip-row">' + sDot(loadS) + esc(t('metric.campLoad')) + ' — ' + loadPct + '%</span>' +
      '<span class="ops-map__tip-row">' + sDot(icuS) + esc(t('metric.icuFree')) + ' — ' + camp.icuAvail + '/' + camp.icuTotal + '</span>' +
      '<span class="ops-map__tip-row">' + sDot(ambS) + esc(t('metric.ambReady')) + ' — ' + camp.ambAvail + '/' + camp.ambTotal + '</span>';
  }

  /* Clamped to the map's own box: markers at either end of the route
     used to push the card past the panel edge, where it was clipped. */
  function positionTip(tip, container, targetEl) {
    var cRect = container.getBoundingClientRect();
    var tRect = targetEl.getBoundingClientRect();
    var x = tRect.left + tRect.width / 2 - cRect.left;
    var half = (tip.offsetWidth || 220) / 2;
    tip.style.left = Math.max(half + 6, Math.min(cRect.width - half - 6, x)) + 'px';
    tip.style.top = (tRect.top - cRect.top) + 'px';
  }

  function showLocTip(tip, container, el, loc) {
    tip.innerHTML = locTipHtml(loc);
    positionTip(tip, container, el);
    tip.classList.add('is-on');
  }

  function showCampTip(tip, container, el, camp) {
    tip.innerHTML = campTipHtml(camp);
    positionTip(tip, container, el);
    tip.classList.add('is-on');
  }

  /* ── fallback: the original stylised route ────────────────────── */
  function buildRouteSVG(container, opts) {
    var NS = 'http://www.w3.org/2000/svg';

    container.innerHTML =
      '<svg class="ops-map__svg" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid meet">' +
        '<path class="routemap__ghost" d="' + ROUTE_PATH_D + '"/>' +
        '<path class="routemap__path" id="opsPath-' + opts.id + '" d="' + ROUTE_PATH_D + '"/>' +
        '<g id="opsStops-' + opts.id + '"></g>' +
        (opts.showCamps ? '<g id="opsCamps-' + opts.id + '"></g>' : '') +
        '<g class="routemap__marker" id="opsPalkhi-' + opts.id + '" style="opacity:1"><circle class="routemap__pulse" r="20"/><circle class="routemap__core" r="7"/></g>' +
      '</svg>' +
      '<div class="ops-map__tip" id="opsTip-' + opts.id + '"></div>';

    var path = $('#opsPath-' + opts.id, container);
    var stopsG = $('#opsStops-' + opts.id, container);
    var campsG = opts.showCamps ? $('#opsCamps-' + opts.id, container) : null;
    var palkhiMarker = $('#opsPalkhi-' + opts.id, container);
    var tip = $('#opsTip-' + opts.id, container);

    var len = 0;
    try { len = path.getTotalLength(); } catch (e) {}
    /* Bail before anything is appended. The legend used to be inserted
       first while `mapsBuilt` was only set after this check, so a build
       attempted with a zero-length path left one legend behind and
       appended another on every later visit to the page. */
    if (!len) { container.innerHTML = ''; return; }
    mapsBuilt[opts.id] = true;

    container.insertAdjacentHTML('afterend', legendHtml(opts));

    /* A marker was mouse-only before: reachable and readable by keyboard now. */
    container.addEventListener('mouseleave', function () { tip.classList.remove('is-on'); });

    var domainColors = opts.domainColors !== false;
    var clickOpensDrawer = opts.clickOpensDrawer !== false;
    function isPalkhiHalt(loc0) { return loc0.id === PALKHI.locId; }

    var pts = [];
    LOCATIONS.forEach(function (loc, i) {
      var tt = i / (LOCATIONS.length - 1);
      var pt = path.getPointAtLength(len * tt);
      pts.push({ loc: loc, pt: pt });

      var s = domainColors ? locWorstStatus(loc) : 'plain';
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'routemap__stop ops-map__stop' + (s === 'warn' ? ' is-warn' : s === 'crit' ? ' is-crit' : s === 'plain' ? ' is-plain' : ''));
      g.setAttribute('data-loc', loc.id);
      g.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')');
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', (i === 0 || i === LOCATIONS.length - 1) ? '8' : '6');
      g.appendChild(c);
      stopsG.appendChild(g);

      var showTip = function () {
        if (domainColors) showLocTip(tip, container, g, loc);
        else { tip.innerHTML = simpleTipHtml(loc, isPalkhiHalt(loc) ? PALKHI : null); positionTip(tip, container, g); tip.classList.add('is-on'); }
      };
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', loc.en);
      g.addEventListener('mouseenter', showTip);
      g.addEventListener('mouseleave', function () { tip.classList.remove('is-on'); });
      g.addEventListener('focus', showTip);
      g.addEventListener('blur', function () { tip.classList.remove('is-on'); });
      if (clickOpensDrawer) {
        g.addEventListener('click', function () { openLocDrawer(loc.id); });
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLocDrawer(loc.id); }
        });
      }
    });

    if (opts.showCamps && campsG) {
      var seenAtLoc = {};
      CAMPS.forEach(function (camp) {
        var locId = camp.id.split('-')[0];
        var match = pts.filter(function (p) { return p.loc.id === locId; })[0];
        if (!match) return;
        var idx = seenAtLoc[locId] || 0;
        seenAtLoc[locId] = idx + 1;
        var offset = 24 + idx * 17;
        var g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'ops-map__camp');
        g.setAttribute('transform', 'translate(' + match.pt.x.toFixed(1) + ',' + (match.pt.y - offset).toFixed(1) + ')');
        g.innerHTML = '<circle r="9" fill="#F5F0E6" opacity=".95"/><path d="M-4 0h8M0 -4v8" stroke="#E2361B" stroke-width="2.4" stroke-linecap="round"/>';
        campsG.appendChild(g);
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', camp.en);
        g.addEventListener('mouseenter', function () { showCampTip(tip, container, g, camp); });
        g.addEventListener('mouseleave', function () { tip.classList.remove('is-on'); });
        g.addEventListener('focus', function () { showCampTip(tip, container, g, camp); });
        g.addEventListener('blur', function () { tip.classList.remove('is-on'); });
      });
    }

    var palkhiPt = pts.filter(function (p) { return p.loc.id === PALKHI.locId; })[0];
    if (palkhiPt) palkhiMarker.setAttribute('transform', 'translate(' + palkhiPt.pt.x.toFixed(1) + ',' + palkhiPt.pt.y.toFixed(1) + ')');

    /* The route draws itself, then the halts and camps arrive along it. */
    if (M.on) {
      M.drawPath(path);
      gsap.fromTo($$('.ops-map__stop', container), { opacity: 0 },
        { opacity: 1, duration: 0.4, stagger: 0.035, delay: 0.5 });
      if (campsG) {
        gsap.fromTo($$('.ops-map__camp', container), { opacity: 0 },
          { opacity: 1, duration: 0.4, stagger: 0.06, delay: 1 });
      }
      gsap.fromTo(palkhiMarker, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 1.25 });
    }
    M.pulse($('.routemap__pulse', container));
  }

  /* ── satellite: icons ─────────────────────────────────────────── */
  /* status: 'ok' | 'warn' | 'crit' | 'plain' (no domain data attached —
     the Dashboard's map, and always for the second/Tukaram route).
     palkhiMode: 0 = ordinary halt, 1 = a Palkhi stands here (primary,
     vermillion ring), 2 = second Palkhi (Tukaram, gold ring). */
  function haltIcon(status, palkhiMode) {
    if (palkhiMode) {
      /* Carries its own status ring too: the halt a Palkhi is standing at
         is still a halt, and its state must not disappear. */
      return L.divIcon({
        className: 'opsmk-wrap',
        html: '<span class="opspk opspk--' + status + (palkhiMode === 2 ? ' opspk--pk2' : '') + '">' +
                '<span class="opspk__ring"></span><span class="opspk__ring opspk__ring--2"></span>' +
                '<svg class="opspk__icon" viewBox="0 0 220 120" aria-hidden="true"><use href="#w-palkhi"/></svg>' +
              '</span>',
        iconSize: [46, 46], iconAnchor: [23, 23]
      });
    }
    return L.divIcon({
      className: 'opsmk-wrap',
      html: '<span class="opsmk opsmk--' + status + '">' +
              '<span class="opsmk__ring"></span><span class="opsmk__core"></span>' +
            '</span>',
      iconSize: [24, 24], iconAnchor: [12, 12]
    });
  }

  function campMapIcon(status) {
    return L.divIcon({
      className: 'opsmk-wrap',
      html: '<span class="opscamp opscamp--' + status + '"><i></i></span>',
      iconSize: [20, 20], iconAnchor: [10, 10]
    });
  }

  function routeLatLngs() {
    return LOCATIONS.map(function (l) { return [l.lat, l.lng]; });
  }

  /* Position a fraction along a multi-segment line — drives the pulse
     that travels the walked route. */
  function pointAlong(coords, tt) {
    if (!coords.length) return [0, 0];
    if (coords.length < 2) return coords[0];
    var segs = [], total = 0, i;
    for (i = 1; i < coords.length; i++) {
      var dy = coords[i][0] - coords[i - 1][0], dx = coords[i][1] - coords[i - 1][1];
      var len = Math.sqrt(dx * dx + dy * dy);
      segs.push(len); total += len;
    }
    var target = total * Math.max(0, Math.min(1, tt)), acc = 0;
    for (i = 0; i < segs.length; i++) {
      if (acc + segs[i] >= target) {
        var k = segs[i] ? (target - acc) / segs[i] : 0;
        return [coords[i][0] + (coords[i + 1][0] - coords[i][0]) * k,
                coords[i][1] + (coords[i + 1][1] - coords[i][1]) * k];
      }
      acc += segs[i];
    }
    return coords[coords.length - 1];
  }

  /* Draws one procession's route (walked leg solid + pulsing, remaining
     leg dashed) and returns the walked-so-far coordinate list, which the
     Palkhi marker for that route is placed at the end of. */
  function drawProcessionRoute(map, coords, idx, color, cometColor) {
    var done = coords.slice(0, idx + 1);
    var todo = coords.slice(idx);

    if (todo.length > 1) {
      L.polyline(todo, { color: '#F5F0E6', weight: 2.5, opacity: 0.45, dashArray: '5 9', interactive: false }).addTo(map);
    }
    L.polyline(done, { color: color, weight: 11, opacity: 0.16, interactive: false }).addTo(map);
    var line = L.polyline(done, { color: color, weight: 3.6, opacity: 0.95, interactive: false, className: 'route-live' }).addTo(map);
    M.drawPath(line.getElement());

    /* A pulse running the walked legs, so the line reads as movement. */
    if (M.on && done.length > 1) {
      var comet = L.circleMarker(done[0], {
        radius: 5, weight: 0, color: cometColor, fillColor: cometColor,
        fillOpacity: 1, interactive: false, className: 'route-comet'
      }).addTo(map);
      var prog = { p: 0 };
      gsap.to(prog, {
        p: 1, duration: 7, repeat: -1, ease: 'none', delay: 1.1,
        onUpdate: function () { comet.setLatLng(pointAlong(done, prog.p)); }
      });
    }
    return done;
  }

  function buildSatMap(container, opts) {
    var coords = routeLatLngs();
    var coords2 = TUKARAM_ROUTE.map(function (l) { return [l.lat, l.lng]; });
    var idx = LOCATIONS.map(function (l) { return l.id; }).indexOf(PALKHI.locId);
    if (idx < 0) idx = 0;
    var idx2 = TUKARAM_ROUTE.map(function (l) { return l.id; }).indexOf(PALKHI2.locId);
    if (idx2 < 0) idx2 = 0;

    /* Dashboard's map is Palkhi-tracking only: no domain colouring on the
       halts, and a click shows nothing beyond the marker's own tooltip. */
    var domainColors = opts.domainColors !== false;
    var clickOpensDrawer = opts.clickOpensDrawer !== false;

    container.classList.add('ops-map--sat');
    container.innerHTML = '';

    var map = L.map(container, {
      zoomControl: true,
      attributionControl: false,
      zoomSnap: 0.25,
      /* Never swallow the page's scroll: the wheel only zooms once the
         operator has actually clicked into the map. */
      scrollWheelZoom: false
    });

    L.tileLayer(ESRI_IMAGERY, { maxZoom: 18 }).addTo(map);
    L.tileLayer(ESRI_PLACES, { maxZoom: 18, opacity: 0.85 }).addTo(map);

    var bounds = L.latLngBounds(coords.concat(coords2));
    map.fitBounds(bounds, { padding: [34, 34] });

    map.on('click focus', function () { map.scrollWheelZoom.enable(); });
    container.addEventListener('mouseleave', function () { map.scrollWheelZoom.disable(); });

    /* Sant Dnyaneshwar Palkhi (Alandi route) in saturated gold + a red
       comet; Sant Tukaram Palkhi (Dehu route) in pale gold throughout, so
       the two are told apart without a legend. */
    drawProcessionRoute(map, coords, idx, '#C9A227', '#E2361B');
    drawProcessionRoute(map, coords2, idx2, '#E7CE7C', '#E7CE7C');

    var markers = {};
    var allMarkerEls = [];

    LOCATIONS.forEach(function (loc) {
      var isPalkhi = loc.id === PALKHI.locId;
      var status = domainColors ? locWorstStatus(loc) : 'plain';
      var m = L.marker([loc.lat, loc.lng], {
        icon: haltIcon(status, isPalkhi ? 1 : 0),
        title: loc.en, alt: loc.en, keyboard: true, riseOnHover: true,
        zIndexOffset: isPalkhi ? 1000 : 0
      }).addTo(map);
      m.bindTooltip(domainColors ? locTipHtml(loc) : simpleTipHtml(loc, isPalkhi ? PALKHI : null),
        { direction: 'top', className: 'ops-tip', offset: [0, -14], opacity: 1 });
      if (clickOpensDrawer) m.on('click', function () { openLocDrawer(loc.id); });
      markers[loc.id] = m;
    });

    /* The second route carries no domain data on either page — always a
       plain waypoint, tooltip only, never the drawer. */
    TUKARAM_ROUTE.forEach(function (loc) {
      var isPalkhi = loc.id === PALKHI2.locId;
      var m = L.marker([loc.lat, loc.lng], {
        icon: haltIcon('plain', isPalkhi ? 2 : 0),
        title: loc.en, alt: loc.en, keyboard: true, riseOnHover: true,
        zIndexOffset: isPalkhi ? 1000 : 0
      }).addTo(map);
      m.bindTooltip(simpleTipHtml(loc, isPalkhi ? PALKHI2 : null),
        { direction: 'top', className: 'ops-tip', offset: [0, -14], opacity: 1 });
      markers[loc.id] = m;
    });

    var camps = [];
    if (opts.showCamps) {
      var seen = {};
      CAMPS.forEach(function (camp) {
        var loc = LOCATIONS.filter(function (l) { return l.id === camp.id.split('-')[0]; })[0];
        if (!loc) return;
        var n = seen[loc.id] || 0; seen[loc.id] = n + 1;
        var cm = L.marker([loc.lat + 0.035 + n * 0.022, loc.lng - 0.035 - n * 0.008], {
          icon: campMapIcon(campOverall(camp)), title: camp.en, alt: camp.en, keyboard: true, riseOnHover: true
        }).addTo(map);
        cm.bindTooltip(campTipHtml(camp), { direction: 'top', className: 'ops-tip', offset: [0, -12], opacity: 1 });
        camps.push({ camp: camp, marker: cm });
      });
    }

    mapObjs[opts.id] = { map: map, markers: markers, camps: camps, opts: opts };

    /* Halts drop in once the route has finished drawing itself. The
       inner span is animated, never the icon element itself: Leaflet
       positions each marker with a transform on that element, and the
       tween's y/clearProps would overwrite it and strand the marker. */
    LOCATIONS.concat(TUKARAM_ROUTE).forEach(function (l) {
      var el = markers[l.id] && markers[l.id].getElement();
      if (el && el.firstElementChild) allMarkerEls.push(el.firstElementChild);
    });
    M.stagger(allMarkerEls, { y: -14, stagger: 0.03, delay: 0.65, duration: 0.5 });

    container.insertAdjacentHTML('afterend', legendHtml({ showCamps: opts.showCamps, legend: opts.legend }));

    /* The container only has its true size once the page is on screen. */
    requestAnimationFrame(function () {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [34, 34] });
    });
  }

  function buildOpsMap(container, opts) {
    if (!container || mapsBuilt[opts.id]) return;
    mapsBuilt[opts.id] = true;

    if (typeof window.L !== 'undefined') {
      try { buildSatMap(container, opts); return; }
      catch (e) {
        console.warn('[Wari] satellite map unavailable, using the stylised route:', e.message);
        delete mapObjs[opts.id];
        container.classList.remove('ops-map--sat');
        container.innerHTML = '';
        var stale = container.nextElementSibling;
        if (stale && stale.classList.contains('ops-map__legend')) stale.remove();
      }
    }
    mapsBuilt[opts.id] = false;   /* buildRouteSVG sets it once it knows it can draw */
    buildRouteSVG(container, opts);
  }

  /* Live status re-colours the markers in place rather than rebuilding
     the map, so pan and zoom survive an incoming report. Respects each
     map's own build-time mode — the Dashboard's plain/no-domain-data
     Palkhi-tracking view must not be re-coloured back to Live Ops' full
     domain view just because a report came in. */
  function refreshMapMarkers() {
    Object.keys(mapObjs).forEach(function (id) {
      var o = mapObjs[id];
      if (!o) return;
      var domainColors = !o.opts || o.opts.domainColors !== false;
      LOCATIONS.forEach(function (loc) {
        var m = o.markers[loc.id];
        if (!m) return;
        var isPalkhi = loc.id === PALKHI.locId;
        m.setIcon(haltIcon(domainColors ? locWorstStatus(loc) : 'plain', isPalkhi ? 1 : 0));
        m.setTooltipContent(domainColors ? locTipHtml(loc) : simpleTipHtml(loc, isPalkhi ? PALKHI : null));
      });
      (o.camps || []).forEach(function (c) {
        c.marker.setIcon(campMapIcon(campOverall(c.camp)));
        c.marker.setTooltipContent(campTipHtml(c.camp));
      });
    });
  }

  /* A Leaflet map measured while its page was display:none comes back
     zero-sized, so re-measure whenever one becomes visible. */
  function invalidateMaps() {
    Object.keys(mapObjs).forEach(function (id) {
      var o = mapObjs[id];
      if (!o || !o.map) return;
      var el = o.map.getContainer();
      if (el.offsetParent !== null) o.map.invalidateSize();
    });
  }

  function focusMapOn(locId) {
    var loc = LOCATIONS.filter(function (l) { return l.id === locId; })[0];
    if (!loc) return;
    Object.keys(mapObjs).forEach(function (id) {
      var o = mapObjs[id];
      if (!o || !o.map || o.map.getContainer().offsetParent === null) return;
      o.map.panTo([loc.lat, loc.lng], { animate: M.on, duration: 0.6 });
      var m = o.markers[locId];
      if (m) m.openTooltip();
    });
  }

  /* ══════════════ MEDICAL ══════════════ */
  /* Network capacity as a dial (outer ring = beds in use, inner ring =
     one dot per medicine line in stock status) plus a camp share card. */
  function renderMedCards() {
    var dial = $('#medDial'), cap = $('#medCapacity');
    if (!dial && !cap) return;

    var totals = CAMPS.reduce(function (a, c) {
      a.capacity += c.capacity; a.patients += c.patients;
      a.icuTotal += c.icuTotal; a.icuAvail += c.icuAvail;
      a.ambTotal += c.ambTotal; a.ambAvail += c.ambAvail;
      return a;
    }, { capacity: 0, patients: 0, icuTotal: 0, icuAvail: 0, ambTotal: 0, ambAvail: 0 });
    var pct = pctOf(totals.patients, totals.capacity);
    var loadS = loadStatus(pct);

    if (dial) {
      var OUTER = 48, lit = Math.round(OUTER * pct / 100);
      var litColor = loadS === 'ok' ? 'gold' : loadS;
      var outer = [];
      for (var i = 0; i < OUTER; i++) outer.push(i < lit ? litColor : 'dim');

      var meds = [];
      CAMPS.forEach(function (c) {
        Object.keys(c.meds).forEach(function (k) {
          meds.push(stockStatus(c.meds[k].stock, c.meds[k].par));
        });
      });

      renderDial(dial, {
        label: t('medical.capacity'),
        tag: CAMPS.length + ' ' + t('medical.campsOnline'),
        outer: outer,
        inner: meds,
        center: { lab: t('medical.occupancy'), value: pct, suffix: '%', sub: statusWord(loadS) },
        metrics: [
          { lab: t('metric.icuFree'), value: totals.icuAvail, sub: '/ ' + totals.icuTotal,
            flag: ratioStatus(totals.icuAvail, totals.icuTotal) === 'crit' },
          { lab: t('metric.ambReady'), value: totals.ambAvail, sub: '/ ' + totals.ambTotal,
            flag: ratioStatus(totals.ambAvail, totals.ambTotal) === 'crit' }
        ],
        btn: {
          label: t('medical.allCamps'),
          onClick: function () {
            var el = $('#campList');
            if (el) el.scrollIntoView({ behavior: M.on ? 'smooth' : 'auto', block: 'start' });
          }
        }
      });
    }

    if (cap) {
      var byStatus = tally(CAMPS.map(campOverall));
      renderMCard(cap, {
        title: t('medical.campStatus'),
        icon: 'g-medical',
        figure: { value: totals.patients, unit: t('medical.bedsUsed') },
        segments: [
          { cls: 'ok', w: pctOf(byStatus.ok, byStatus.total), label: statusWord('ok'), n: byStatus.ok },
          { cls: 'warn', w: pctOf(byStatus.warn, byStatus.total), label: statusWord('warn'), n: byStatus.warn },
          { cls: 'crit', w: pctOf(byStatus.crit, byStatus.total), label: statusWord('crit'), n: byStatus.crit }
        ],
        stack: {
          label: t('medical.campsOnline'),
          items: CAMPS.map(function (c) {
            var st = campOverall(c);
            return { icon: 'g-medical', cls: st !== 'ok' ? st : '', title: c.en };
          })
        }
      });
    }
  }

  function renderMedical(role) {
    renderMedCards();

    var list = $('#campList');
    if (!list) return;
    list.innerHTML = CAMPS.map(function (c) {
      var overall = campOverall(c);
      var loadPct = pctOf(c.patients, c.capacity);
      var loadS = loadStatus(loadPct), icuS = ratioStatus(c.icuAvail, c.icuTotal), ambS = ratioStatus(c.ambAvail, c.ambTotal);
      var bodyId = 'campBody-' + c.id;

      var meds = Object.keys(c.meds).map(function (k) {
        var m = c.meds[k], st = stockStatus(m.stock, m.par);
        return '<div class="med-item">' +
          '<div class="med-item__top">' +
            '<span class="med-item__name">' + sDot(st) + esc(t(MED_KEY_LABEL[k])) + '</span>' +
            '<span class="med-item__qty">' + m.stock + ' / ' + m.par + ' ' + esc(m.unit) + '</span>' +
          '</div>' +
          '<span class="meter"><span class="meter__fill meter__fill--' + st + '" data-w="' +
            Math.min(100, pctOf(m.stock, m.par)) + '"></span></span>' +
        '</div>';
      }).join('');

      return '<div class="camp-card" data-camp="' + esc(c.id) + '">' +
        '<button type="button" class="camp-card__head" aria-expanded="false" aria-controls="' + bodyId + '">' +
          '<span class="camp-card__name">' + esc(c.en) + '<span>' + esc(c.mr) + '</span></span>' +
          '<span class="camp-card__status">' +
            '<span class="camp-card__load">' +
              '<span class="camp-card__load-track"><span class="camp-card__load-fill meter__fill--' + loadS + '" data-w="' + loadPct + '"></span></span>' +
              loadPct + '%</span>' +
            sBadge(overall, statusWord(overall)) +
            '<span class="camp-card__chevron" aria-hidden="true">▾</span>' +
          '</span>' +
        '</button>' +
        '<div class="camp-card__body" id="' + bodyId + '">' +
          '<div class="metric-grid">' +
            '<div class="metric"><div class="metric__label">' + sDot(loadS) + esc(t('metric.campLoad')) + '</div><div class="metric__value">' + loadPct + '%</div><div class="metric__sub">' + esc(t('metric.campLoadSub')) + '</div></div>' +
            '<div class="metric"><div class="metric__label">' + esc(t('metric.patientsTreated')) + '</div><div class="metric__value">' + c.patients + ' / ' + c.capacity + '</div><div class="metric__sub">' + esc(t('metric.patientsSub')) + '</div></div>' +
            '<div class="metric"><div class="metric__label">' + sDot(icuS) + esc(t('metric.icuFree')) + '</div><div class="metric__value">' + c.icuAvail + ' / ' + c.icuTotal + '</div><div class="metric__sub">' + esc(t('metric.icuSub')) + '</div></div>' +
            '<div class="metric"><div class="metric__label">' + sDot(ambS) + esc(t('metric.ambReady')) + '</div><div class="metric__value">' + c.ambAvail + ' / ' + c.ambTotal + '</div><div class="metric__sub">' + esc(t('metric.ambSub')) + '</div></div>' +
          '</div>' +
          '<div class="med-stock"><h4>' + esc(t('medical.medStock')) + '</h4><div class="med-stock__grid">' + meds + '</div></div>' +
        '</div>' +
      '</div>';
    }).join('');

    /* The head bar's load meters can fill straight away; the ones inside
       a body wait until that body is actually opened. */
    M.bars($$('.camp-card__load-fill', list));

    list.onclick = function (e) {
      var head = e.target.closest('.camp-card__head');
      if (!head) return;
      var card = head.closest('.camp-card');
      var body = $('.camp-card__body', card);
      var open = !card.classList.contains('is-open');
      card.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', String(open));
      M.expand(body, open, function () {
        if (open) M.bars($$('.meter__fill', body));
      });
    };

    initPatientRegisterForm(role);
    renderPatientFilters();
    renderPatients('');
    loadPatientsFromBackend();
    var search = $('#patientSearch');
    if (search) search.oninput = function () { renderPatients(search.value); };
  }

  var patientFilter = 'all';

  function renderPatientFilters() {
    var el = $('#patientFilters');
    if (!el) return;
    var opts = [{ id: 'all', label: t('patient.all') }].concat(
      Object.keys(PSTATUS_LABEL).map(function (k) { return { id: k, label: t(PSTATUS_LABEL[k]) }; }));

    el.innerHTML = opts.map(function (o) {
      var on = patientFilter === o.id;
      return '<button type="button" class="chip' + (on ? ' is-on' : '') + '" data-pstatus="' + o.id +
        '" aria-pressed="' + on + '">' + esc(o.label) + '</button>';
    }).join('');

    el.onclick = function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      patientFilter = btn.getAttribute('data-pstatus');
      $$('.chip', el).forEach(function (b) {
        var on = b.getAttribute('data-pstatus') === patientFilter;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      M.pop(btn);
      var search = $('#patientSearch');
      renderPatients(search ? search.value : '');
    };
  }

  function renderPatients(query) {
    var list = $('#patientList');
    if (!list) return;
    var q = (query || '').trim().toLowerCase();
    var filtered = patientsCache.filter(function (p) {
      if (patientFilter !== 'all' && p.status !== patientFilter) return false;
      if (!q) return true;
      return (p.name + ' ' + p.id + ' ' + p.camp + ' ' + p.condition).toLowerCase().indexOf(q) !== -1;
    });

    var count = $('#patientCount');
    if (count) {
      count.innerHTML = esc(t('patient.showing')) + ' <b>' + filtered.length + '</b> / ' + patientsCache.length;
    }

    if (!filtered.length) {
      list.innerHTML = '<div class="patient-empty">' + esc(t('patient.noMatch')) + ' “' + esc(query) + '”.</div>';
      return;
    }

    /* Status moved out of the meta line into a pill of its own: the row
       grid declares four columns and only three were ever filled, which
       left a dangling gap at the end of every row. */
    list.innerHTML = filtered.map(function (p) {
      return '<button type="button" class="patient-row" data-name="' + esc(p.name) + '" aria-label="' + esc(p.name) + ' — ' + esc(t('medical.patientHistoryTitle')) + '">' +
        '<span class="patient-row__id">' + esc(p.id) + '</span>' +
        '<span><span class="patient-row__name">' + esc(p.name) + '</span>' +
          '<div class="patient-row__meta">' + esc(p.age) + ' ' + esc(t('medical.yrs')) + ' · ' + esc(p.condition) + '</div></span>' +
        '<span class="patient-row__camp">' + esc(p.camp) + '</span>' +
        '<span class="pill pill--' + esc(p.status) + '">' + esc(patientStatusLabel(p.status)) + '</span>' +
      '</button>';
    }).join('');
    list.onclick = function (e) {
      var row = e.target.closest('.patient-row');
      if (row) openPatientHistory(row.getAttribute('data-name'));
    };
    M.stagger($$('.patient-row', list), { y: 10, stagger: 0.02, duration: 0.4 });
  }

  /* Backend is the source of truth for the patient roster — see
     backend/app.py's /api/patients. patientsCache above is only the
     instant fallback shown before this first resolves. */
  function backendPatientToRow(p) {
    return { id: p.id, name: p.name, age: p.age, camp: campLabel(p.camp_id), condition: p.condition || '—', status: p.status };
  }

  /* Raw backend rows (registered_at, camp_id, notes and all) kept
     alongside the display-shaped patientsCache above, so clicking a
     patient can show their full history via the same modal the
     duplicate-name check already uses on registration. */
  var patientsRawCache = [];
  /* As with the feed: skip the re-render when a poll brings back the same
     rows, so the list does not replay its stagger animation on every tick. */
  var patientsSig = null;

  function loadPatientsFromBackend() {
    return fetch(BACKEND_URL + '/api/patients', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('backend responded ' + r.status); return r.json(); })
      .then(function (rows) {
        var sig = JSON.stringify(rows);
        if (sig === patientsSig) return;
        patientsSig = sig;
        patientsRawCache = rows;
        patientsCache = rows.map(backendPatientToRow);
        var search = $('#patientSearch');
        renderPatients(search ? search.value : '');
      })
      .catch(function (err) { console.warn('[Wari] patients backend unavailable:', err.message); });
  }

  function openPatientHistory(name) {
    var target = (name || '').trim().toLowerCase();
    if (!target) return;
    var matches = patientsRawCache
      .filter(function (r) { return (r.name || '').trim().toLowerCase() === target; })
      .sort(function (a, b) { return new Date(b.registered_at) - new Date(a.registered_at); });
    if (matches.length) showPatientHistoryModal(name, matches, 'view');
  }

  /* ══════════════ PATIENT REGISTER + PRIOR-HISTORY POPUP ══════════════
     Registering by name is checked against the backend patient registry
     (case/whitespace-insensitive). A match means this person has been
     treated before — the doctor sees that history before continuing. */
  function showPatientHistoryModal(name, records, mode) {
    var modal = $('#patientHistoryModal');
    if (!modal) return;
    var isView = mode === 'view';
    var eyebrow = $('#patientHistoryModalEyebrow');
    if (eyebrow) eyebrow.textContent = t(isView ? 'medical.patientHistoryTitle' : 'medical.priorHistoryTitle');
    var lede = $('#patientHistoryModalLede');
    if (lede) lede.textContent = t(isView ? 'medical.patientHistoryNote' : 'medical.priorHistoryNote');
    var title = $('#patientHistoryModalTitle');
    if (title) title.textContent = name;
    var body = $('#patientHistoryModalBody');
    if (body) body.innerHTML = records.map(function (r) {
      var when = new Date(r.registered_at).toLocaleString(curLang() === 'mr' ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      return '<div class="patient-history-row">' +
        '<span class="patient-history-row__when">' + when + '</span>' +
        '<div class="patient-history-row__main"><b>' + (r.condition || '—') + '</b><span>' + campLabel(r.camp_id) + '</span></div>' +
        '<span class="fstat">' + patientStatusLabel(r.status) + '</span>' +
        (r.notes ? '<div class="patient-history-row__notes">' + r.notes + '</div>' : '') +
      '</div>';
    }).join('');
    modal.hidden = false;
  }

  function hidePatientHistoryModal() {
    var modal = $('#patientHistoryModal');
    if (modal) modal.hidden = true;
  }

  function initPatientRegisterForm(role) {
    var panel = $('#patientRegisterPanel');
    var form = $('#patientRegisterForm');
    if (!panel || !form) return;

    /* Wari Supervisor reads everything but submits nothing — same rule
       Records already follows for that role. */
    var canRegister = role.id !== 'supervisor';
    panel.hidden = !canRegister;
    if (!canRegister) return;

    $('#pr-camp', form).innerHTML = campOptions();
    /* Not tOptions() here on purpose: that helper makes value === i18n key
       (matches the Records form's opt.* convention), but the backend needs
       the raw status word (admitted/discharged/referred) as the value while
       only the visible label is translated. */
    $('#pr-status', form).innerHTML = Object.keys(PSTATUS_LABEL).map(function (k) {
      return '<option value="' + k + '">' + t(PSTATUS_LABEL[k]) + '</option>';
    }).join('');

    form.onsubmit = function (e) {
      e.preventDefault();
      var name = $('#pr-name', form).value.trim();
      if (!name) return;

      fetch(BACKEND_URL + '/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          age: $('#pr-age', form).value || null,
          camp_id: $('#pr-camp', form).value || null,
          condition: $('#pr-condition', form).value.trim(),
          status: $('#pr-status', form).value,
          notes: $('#pr-notes', form).value.trim(),
          role: role.id
        })
      }).then(function (r) {
        return r.json().then(function (data) { return { ok: r.ok, data: data }; });
      }).then(function (res) {
        if (!res.ok) { toast(t('medical.registerFailed')); return; }
        form.reset();
        loadPatientsFromBackend();
        if (res.data.prior_history && res.data.prior_history.length) {
          showPatientHistoryModal(name, res.data.prior_history);
        } else {
          toast(t('medical.registerSuccess'));
        }
      }).catch(function (err) {
        console.warn('[Wari] patient register backend unavailable:', err.message);
        toast(t('medical.registerOffline'));
      });
    };
  }

  /* ══════════════ TOAST ══════════════ */
  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 3600);
  }

  /* ══════════════ APP SHELL / ROUTER ══════════════ */
  function showPage(pageId) {
    var page = null;
    $$('.page').forEach(function (p) {
      var on = p.dataset.page === pageId;
      p.classList.toggle('is-active', on);
      if (on) page = p;
    });
    $$('.app__tab').forEach(function (tab) {
      var on = tab.dataset.page === pageId;
      tab.classList.toggle('is-on', on);
      tab.setAttribute('aria-current', on ? 'page' : 'false');
    });

    /* The map can only be measured once its page is on screen — build
       it after the class toggle above, never before. */
    /* Dashboard: Palkhi tracking only — no domain colouring, no camps, no
       legend, and a click shows nothing beyond the marker's own tooltip.
       Live Ops keeps the full picture: domain-coloured halts, camps, the
       legend, and the location drawer on click. Both show both Palkhis. */
    if (pageId === 'dashboard') buildOpsMap($('#opsMapMini'), { id: 'mini', showCamps: false, domainColors: false, clickOpensDrawer: false, legend: false });
    if (pageId === 'live-ops') buildOpsMap($('#opsMapFull'), { id: 'full', showCamps: true, domainColors: true, clickOpensDrawer: true, legend: true });

    /* The entrance now runs per page, against the page being shown. It
       used to run once over every .panel in the document — including the
       hidden ones — so only the first tab ever animated and every other
       page arrived flat. */
    if (page) {
      invalidateMaps();
      M.revealPage(page);
      M.scrollReveal($$('.camp-card, .loc-card', page).slice(12));
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }
    window.scrollTo({ top: 0, behavior: M.on ? 'smooth' : 'auto' });
  }

  function initApp(roleId) {
    var role = roleById(roleId);
    if (!role) return;
    currentRole = role;

    $('#appRoleLabel').textContent = roleName(role);
    $('#appTabs').innerHTML = role.pages.map(function (p, i) {
      return '<button class="app__tab' + (i === 0 ? ' is-on' : '') + '" data-page="' + p + '">' + t('app.tab.' + p) + '</button>';
    }).join('');
    $('#appTabs').onclick = function (e) {
      var btn = e.target.closest('.app__tab');
      if (btn) showPage(btn.dataset.page);
    };

    renderDashboard(role);
    if (role.pages.indexOf('live-ops') !== -1) renderLiveOps();
    if (role.pages.indexOf('records') !== -1) renderRecords(role);
    if (role.pages.indexOf('medical') !== -1) renderMedical(role);

    var refreshBtn = $('#intelRefreshBtn');
    if (refreshBtn) {
      refreshBtn.onclick = function () { loadIntel(true); };
      M.magnetic(refreshBtn, 0.2);
    }
    M.magnetic($('#logoutBtn'), 0.2);
    loadIntel(false); // feeds the dashboard's Wari-status stat for every role; Intel tab only exists for the supervisor
    loadFeedFromBackend(); // real submitted-report history, not just this tab's in-memory pushes

    showPage(role.pages[0]);
    startFeedClock();
    startLiveSync();

    document.getElementById('loginScreen').style.display = 'none';
    var shell = document.getElementById('appShell');
    shell.hidden = false;
  }

  function logout() {
    /* Tell the backend to drop the session too, but never block the UI on
       it — the local session is cleared and the page reloads either way. */
    if (authToken) {
      try {
        fetch(BACKEND_URL + '/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + authToken },
          keepalive: true
        }).catch(function () {});
      } catch (e) {}
    }
    authToken = null;
    try { localStorage.removeItem('wci_session'); } catch (e) {}
    location.reload();
  }

  /* ══════════════ LOGIN ══════════════ */
  function initLogin() {
    var rolesWrap = $('#loginRoles');
    rolesWrap.innerHTML = ROLES.map(function (r) {
      return '<button type="button" class="role-tile" data-role="' + r.id + '">' +
        '<svg class="role-tile__icon" viewBox="0 0 120 100"><use href="#' + r.icon + '"/></svg>' +
        '<span class="role-tile__label"><span class="role-tile__en">' + r.en + '</span><span class="role-tile__mr">' + r.mr + '</span></span>' +
      '</button>';
    }).join('');

    var selected = null;
    var form = $('#loginForm');

    rolesWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.role-tile');
      if (!btn) return;
      selected = roleById(btn.dataset.role);
      $('#loginRoleChip').innerHTML = '<svg viewBox="0 0 120 100"><use href="#' + selected.icon + '"/></svg><span>' + selected.en + ' / ' + selected.mr + '</span>';
      rolesWrap.hidden = true;
      form.hidden = false;
      $('#loginUser').focus();
    });

    $('#loginBack').addEventListener('click', function () {
      form.hidden = true;
      rolesWrap.hidden = false;
    });

    var errBox = $('#loginError'), submitBtn = $('#loginSubmit');

    function showLoginError(msg) {
      if (!errBox) return;
      errBox.textContent = msg;
      errBox.hidden = false;
    }
    function clearLoginError() { if (errBox) errBox.hidden = true; }

    $('#loginUser').addEventListener('input', clearLoginError);
    $('#loginPass').addEventListener('input', clearLoginError);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!selected) return;
      clearLoginError();

      var user = $('#loginUser').value.trim(), pass = $('#loginPass').value;
      var label = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = t('login.signingIn'); }

      function done() {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = label; }
      }

      fetch(BACKEND_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass, role: selected.id })
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (r) {
          done();
          if (!r.ok) { showLoginError(r.data.error || t('login.errGeneric')); return; }
          // The role comes from the account, never from the clicked tile.
          var role = roleById(r.data.role);
          if (!role) { showLoginError(t('login.errGeneric')); return; }
          try {
            localStorage.setItem('wci_session', JSON.stringify({
              roleId: role.id, token: r.data.token, username: r.data.username
            }));
          } catch (err) {}
          authToken = r.data.token;
          $('#loginPass').value = '';
          initApp(role.id);
        })
        .catch(function () {
          done();
          showLoginError(t('login.errOffline'));
        });
    });

    revealIn($$('.role-tile'));
  }

  /* ══════════════ BOOT ══════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    if (window.WCI) WCI.initLangToggle();
    initLogin();

    $('#logoutBtn').addEventListener('click', logout);

    M.initCursor();

    var histClose = $('#patientHistoryModalClose'), histOverlay = $('#patientHistoryModalOverlay'), histOk = $('#patientHistoryModalOk');
    if (histClose) histClose.addEventListener('click', hidePatientHistoryModal);
    if (histOverlay) histOverlay.addEventListener('click', hidePatientHistoryModal);
    if (histOk) histOk.addEventListener('click', hidePatientHistoryModal);

    var drawerClose = $('#locDrawerClose'), drawerOverlay = $('#locDrawerOverlay');
    if (drawerClose) drawerClose.addEventListener('click', closeLocDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeLocDrawer);

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      hidePatientHistoryModal();
      closeLocDrawer();
    });

    /* Restore a previous sign-in. A session saved before this build has no
       token, so it is discarded and the authority signs in properly. The
       token is re-checked against the backend: a rejected one is cleared,
       but a network failure leaves the session alone — a backend that is
       merely down must not sign a supervisor out mid-Wari. */
    var session = null;
    try { session = JSON.parse(localStorage.getItem('wci_session') || 'null'); } catch (e) {}
    if (session && session.token && roleById(session.roleId)) {
      authToken = session.token;
      initApp(session.roleId);
      fetch(BACKEND_URL + '/api/auth/me', { headers: { 'Authorization': 'Bearer ' + session.token } })
        .then(function (res) {
          if (res.status === 401 || res.status === 403) {
            try { localStorage.removeItem('wci_session'); } catch (e) {}
            authToken = null;
            location.reload();
          }
        })
        .catch(function () { /* backend unreachable — keep the local session */ });
    } else if (session) {
      try { localStorage.removeItem('wci_session'); } catch (e) {}
    }
  });
})();
