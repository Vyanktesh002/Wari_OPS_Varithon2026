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

  function revealIn(nodes) {
    if (!nodes || !nodes.length) return;
    if (!HAS_GSAP || REDUCED) return;
    gsap.fromTo(nodes, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .6, stagger: .05, ease: 'power2.out', clearProps: 'transform' });
  }

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
  var LOCATIONS = [
    { id: 'alandi',    en: 'Alandi',        mr: 'आळंदी',      dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'pune',      en: 'Pune',          mr: 'पुणे',        dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'warn' } },
    { id: 'saswad',    en: 'Saswad',        mr: 'सासवड',      dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'jejuri',    en: 'Jejuri',        mr: 'जेजुरी',      dom: { police: 'warn', medical: 'crit', municipal: 'ok',   sanitation: 'warn' } },
    { id: 'walhe',     en: 'Walhe',         mr: 'वाल्हे',      dom: { police: 'ok',   medical: 'ok',   municipal: 'warn', sanitation: 'ok' } },
    { id: 'lonand',    en: 'Lonand',        mr: 'लोणंद',      dom: { police: 'warn', medical: 'warn', municipal: 'warn', sanitation: 'ok' } },
    { id: 'taradgaon', en: 'Taradgaon',     mr: 'तरडगाव',     dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'phaltan',   en: 'Phaltan',       mr: 'फलटण',       dom: { police: 'ok',   medical: 'warn', municipal: 'ok',   sanitation: 'ok' } },
    { id: 'natepute',  en: 'Natepute',      mr: 'नातेपुते',    dom: { police: 'crit', medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'malshiras', en: 'Malshiras',     mr: 'माळशिरस',    dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'warn' } },
    { id: 'velapur',   en: 'Velapur',       mr: 'वेळापूर',     dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'bhandishegaon', en: 'Bhandishegaon', mr: 'भंडीशेगाव', dom: { police: 'ok', medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'wakhari',   en: 'Wakhari',       mr: 'वाखरी',      dom: { police: 'ok',   medical: 'warn', municipal: 'ok',   sanitation: 'ok' } },
    { id: 'barad',     en: 'Barad',         mr: 'बरड',        dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } },
    { id: 'pandharpur',en: 'Pandharpur',    mr: 'पंढरपूर',     dom: { police: 'ok',   medical: 'ok',   municipal: 'ok',   sanitation: 'ok' } }
  ];
  var PALKHI = { locId: 'lonand', delayMin: 22 };

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

  function timeAgo(ts) {
    var mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 min ago';
    if (mins < 60) return mins + ' min ago';
    var h = Math.floor(mins / 60);
    return h + 'h ' + (mins % 60) + 'm ago';
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
        '<h4>' + headline + (isNew ? '<span class="fitem__new">New</span>' : '') + '</h4>' +
        '<div class="fitem__meta">' +
          '<span class="tag ' + (CAT_TAG[item.cat] || '') + '">' + t('chip.' + item.cat) + '</span>' +
          '<span class="fitem__loc">' + item.loc + '<span>' + item.mr + '</span></span>' +
          '<span>' + item.d + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="fitem__side">' +
        '<span class="fitem__time">' + timeAgo(item.ts) + '</span>' +
        '<span class="fstat ' + (ST_CLASS[item.st] || '') + '">' + t('fstat.' + item.st) + '</span>' +
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
      sorted.slice(0, 12).forEach(function (item) { list.appendChild(feedNode(item)); });
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

  function loadFeedFromBackend() {
    return fetch(BACKEND_URL + '/api/feed?limit=30', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('backend responded ' + r.status); return r.json(); })
      .then(function (events) {
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

  /* ══════════════ INTEL (live — backed by the Flask backend + model service) ══════════════
     GET {BACKEND}/api/intel returns an aggregate across every location, built by the
     backend from real POST /model/analyze calls (see MODEL_INTEGRATION.md). Nothing here
     invents scores or copy — it only renders what the model actually returned. */
  var BACKEND_URL = window.WCI_BACKEND_URL || 'http://127.0.0.1:5050';
  var RISK_STATUS_KEY = { NORMAL: 'gauge.low', ELEVATED: 'gauge.mod', HIGH: 'gauge.high', CRITICAL: 'gauge.crit' };
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

  function renderIntelFromModel(data) {
    lastIntelSummary = data;
    setIntelStatus(null);

    var CIRC = 2 * Math.PI * 98;
    var arc = $('#intelArc'), num = $('#intelNum'), state = $('#intelState');
    if (arc) arc.style.strokeDashoffset = CIRC * (1 - data.risk_score / 100);
    if (num) num.textContent = Math.round(data.risk_score);
    var gauge = $('#intelGauge');
    if (gauge) gauge.className = 'gauge' + (RISK_STATUS_CLASS[data.status] ? ' ' + RISK_STATUS_CLASS[data.status] : '');
    if (state) state.textContent = t(RISK_STATUS_KEY[data.status] || 'gauge.low');

    var freshMin = Math.round(data.data_freshness.current_age_minutes);
    var conf = $('#intelConf');
    if (conf) conf.innerHTML =
      '<div><span>' + t('brief.freshness') + '</span><b>' + t('freshness.' + data.data_freshness.grade) + ' · ' + freshMin + ' min</b></div>' +
      '<div><span>' + t('brief.confidence') + '</span><b>' + t('confidence.' + data.confidence.grade) + '</b></div>' +
      '<div><span>' + t('brief.locations') + '</span><b>' + data.locations_ranked.length + '</b></div>';

    var locList = $('#intelLocList');
    if (locList) locList.innerHTML = data.locations_ranked.map(function (l, i) {
      return '<div class="intel-loc-item intel-loc-item--' + l.status + '">' +
        '<span class="intel-loc-item__rank">' + (i + 1) + '</span>' +
        '<span class="intel-loc-item__main"><span class="intel-loc-item__name">' + (l.name || l.id) + '</span>' +
        '<div class="intel-loc-item__headline">' + l.headline + '</div></span>' +
        '<span class="intel-loc-item__class">' + t('situation.' + l.situation_class) + '</span>' +
        '<span class="intel-loc-item__score">' + l.risk_score + '</span>' +
      '</div>';
    }).join('');

    function tagged(label, locName) { return label + (locName ? ' <span class="intel-tag">— ' + locName + '</span>' : ''); }
    function block(headingKey, hClass, items, emptyKey) {
      var body = items.length ? '<ul>' + items.join('') + '</ul>' : '<p class="panel__hint">' + t(emptyKey) + '</p>';
      return '<section class="doc__blk"><h4 class="doc__h' + (hClass ? ' ' + hClass : '') + '">' + t(headingKey) + '</h4>' + body + '</section>';
    }

    var keyFactorItems = data.key_factors.map(function (f) { return '<li>' + f + '</li>'; });
    var gapItems = data.resource_gaps.map(function (g) { return '<li>' + tagged(t('domain.' + g.domain) + ' — ' + g.detail, g.location_name) + '</li>'; });
    var emergingItems = data.emerging_risks.map(function (e) { return '<li>' + tagged(e.title + ' — ' + e.rationale, e.location_name) + '</li>'; });
    var actionItems = data.priority_actions.map(function (a) {
      return '<li>' + tagged(a.action + ' — ' + a.why, a.location_name) + ' <span class="intel-tag">(' + a.authority + ')</span></li>';
    });

    var doc = $('#intelDoc');
    if (doc) doc.innerHTML =
      '<div class="doc__orn"></div>' +
      '<header class="doc__head"><span>' + t('doc.status') + '</span><b>' + t(RISK_STATUS_KEY[data.status] || 'gauge.low') + '</b></header>' +
      block('intel.keyFactors', '', keyFactorItems, 'intel.allCalm') +
      block('doc.resourceGaps', '', gapItems, 'intel.noGaps') +
      block('doc.emerging', '', emergingItems, 'intel.noEmerging') +
      block('doc.attention', 'doc__h--act', actionItems, 'intel.noActions') +
      '<footer class="doc__foot"><span>' + t('intel.modelVersion') + ' ' + data.model_version + ' · ' + t('intel.asOf') + ' ' + new Date(data.analyzed_at).toLocaleTimeString() + '</span><span>' + t('doc.sim') + '</span></footer>';

    revealIn($$('.doc__blk', doc));
    if (locList) revealIn($$('.intel-loc-item', locList));
    updateWariStatusStat();
    refreshLiveStatuses();
  }

  function loadIntel(refresh) {
    var btn = $('#intelRefreshBtn');
    if (btn) { btn.disabled = true; btn.textContent = t('intel.refreshing'); }
    if (!lastIntelSummary) setIntelStatus(t('intel.loading'));
    return fetchIntel(refresh)
      .then(renderIntelFromModel)
      .catch(function (err) {
        console.warn('[Wari] intel backend unavailable:', err.message);
        if (!lastIntelSummary) setIntelStatus(t('intel.offline'), true);
      })
      .then(function () {
        if (btn) { btn.disabled = false; btn.textContent = t('intel.refresh'); }
      });
  }

  function updateWariStatusStat() {
    var cell = $('#statWariStatus');
    if (!cell || !lastIntelSummary) return;
    cell.querySelector('.stat-strip__n').textContent = lastIntelSummary.risk_score;
    cell.querySelector('.stat-strip__label').textContent = t('stat.wariStatus') + ' — ' + t(RISK_STATUS_KEY[lastIntelSummary.status] || 'gauge.low');
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

  function renderRecords(role) {
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

  /* ══════════════ DASHBOARD ══════════════ */
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

  /* Re-render everything driven by domain status once live data lands or
     changes (called from renderIntelFromModel, i.e. after every report). */
  function refreshLiveStatuses() {
    if ($('#domainGrid')) {
      $('#domainGrid').innerHTML = DOMAINS.map(function (d) {
        var s = domainOverall(d.id);
        return '<div class="domain-cell"><svg viewBox="0 0 120 100"><use href="#' + d.icon + '"/></svg>' +
          '<span class="domain-cell__name">' + t('chip.' + d.id) + '</span>' + sBadge(s, statusWord(s)) + '</div>';
      }).join('');
    }
    $$('.loc-card[data-loc]').forEach(function (card) {
      var locId = card.dataset.loc;
      $$('.loc-dom', card).forEach(function (badge) {
        var domId = badge.dataset.dom;
        badge.innerHTML = sDot(domainStatus(locId, domId)) + t('chip.' + domId);
      });
    });
    $$('.ops-map__stop[data-loc]').forEach(function (g) {
      var loc = LOCATIONS.filter(function (l) { return l.id === g.dataset.loc; })[0];
      if (!loc) return;
      var s = locWorstStatus(loc);
      g.classList.toggle('is-warn', s === 'warn');
      g.classList.toggle('is-crit', s === 'crit');
    });
  }

  function renderDashboard(role) {
    $('#dashRoleName').textContent = roleName(role);

    $('#statStrip').innerHTML = [
      { n: '11 / 21', label: t('stat.daysOnFoot') },
      { n: '138 km', label: t('stat.kmSoFar') },
      { n: '512+', label: t('stat.dindisMotion') },
      { n: '15', label: t('stat.trackedLoc') },
      { n: '—', label: t('stat.wariStatus'), id: 'statWariStatus' }
    ].map(function (s) { return '<div class="stat-strip__cell"' + (s.id ? ' id="' + s.id + '"' : '') + '><b class="stat-strip__n">' + s.n + '</b><span class="stat-strip__label">' + s.label + '</span></div>'; }).join('');
    updateWariStatusStat();

    var loc = LOCATIONS.filter(function (l) { return l.id === PALKHI.locId; })[0];
    $('#palkhiStatus').innerHTML =
      '<div class="palkhi-row"><span>' + t('dash.currentlyNear') + '</span><b>' + loc.en + ' <span style="font-family:var(--f-mr);color:var(--vermillion);font-size:1rem;">' + loc.mr + '</span></b></div>' +
      '<div class="palkhi-row"><span>' + t('dash.schedule') + '</span><b>' + PALKHI.delayMin + ' ' + t('dash.minBehind') + '</b></div>';

    $('#domainGrid').innerHTML = DOMAINS.map(function (d) {
      var s = domainOverall(d.id);
      return '<div class="domain-cell"><svg viewBox="0 0 120 100"><use href="#' + d.icon + '"/></svg>' +
        '<span class="domain-cell__name">' + t('chip.' + d.id) + '</span>' + sBadge(s, statusWord(s)) + '</div>';
    }).join('');

    renderFeed();
    revealIn($$('.panel'));
  }

  /* ══════════════ LIVE OPS ══════════════ */
  var liveOpsActive = { police: true, medical: true, municipal: true, sanitation: true };

  function renderLiveOps() {
    var loc = LOCATIONS.filter(function (l) { return l.id === PALKHI.locId; })[0];
    $('#palkhiMini').innerHTML = t('liveops.palkhi') + ' <b>' + loc.en + '</b> <span style="font-family:var(--f-mr);color:var(--vermillion);">' + loc.mr + '</span> — <b>' + PALKHI.delayMin + ' min</b> ' + t('liveops.behind');

    $('#liveOpsFilters').innerHTML = DOMAINS.map(function (d) {
      return '<button class="chip is-on" data-dom="' + d.id + '">' + t('chip.' + d.id) + '</button>';
    }).join('');

    $('#locGrid').innerHTML = LOCATIONS.map(function (l) {
      var doms = DOMAINS.map(function (d) {
        var s = domainStatus(l.id, d.id);
        return '<span class="loc-dom is-active" data-dom="' + d.id + '">' + sDot(s) + t('chip.' + d.id) + '</span>';
      }).join('');
      return '<article class="loc-card" data-loc="' + l.id + '"><div class="loc-card__head"><span class="loc-card__name">' + l.en + '</span><span class="loc-card__mr">' + l.mr + '</span></div>' +
        '<div class="loc-card__doms">' + doms + '</div></article>';
    }).join('');

    $('#liveOpsFilters').onclick = function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      var dom = btn.dataset.dom;
      liveOpsActive[dom] = !liveOpsActive[dom];
      btn.classList.toggle('is-on', liveOpsActive[dom]);
      $$('.loc-dom[data-dom="' + dom + '"]').forEach(function (n) { n.style.display = liveOpsActive[dom] ? '' : 'none'; });
    };

    revealIn($$('.loc-card'));
  }

  /* ══════════════ LIVE TRACKING MAP (Dashboard + Live Ops) ══════════════
     A stylised route path — the same visual language as the landing
     page's Route section — with hoverable markers per halt (worst
     domain status) and, on the full map, a marker per medical camp. */
  var ROUTE_PATH_D = 'M60 96 C 150 60, 210 150, 288 154 S 420 226, 486 200 S 596 108, 668 138 S 780 250, 852 244 S 972 178, 1042 220 S 1120 300, 1146 330';
  var mapsBuilt = {};

  function locWorstStatus(loc) {
    return DOMAINS.reduce(function (acc, d) { return worst(acc, domainStatus(loc.id, d.id)); }, 'ok');
  }

  function positionTip(tip, container, targetEl) {
    var cRect = container.getBoundingClientRect();
    var tRect = targetEl.getBoundingClientRect();
    tip.style.left = (tRect.left + tRect.width / 2 - cRect.left) + 'px';
    tip.style.top = (tRect.top - cRect.top) + 'px';
  }

  function showLocTip(tip, container, el, loc) {
    var doms = DOMAINS.map(function (d) {
      var s = domainStatus(loc.id, d.id);
      return '<div class="ops-map__tip-row">' + sDot(s) + t('chip.' + d.id) + ' — ' + statusWord(s) + '</div>';
    }).join('');
    tip.innerHTML = '<b>' + loc.en + '</b><span class="ops-map__tip-mr">' + loc.mr + '</span>' + doms;
    positionTip(tip, container, el);
    tip.classList.add('is-on');
  }

  function showCampTip(tip, container, el, camp) {
    var loadPct = Math.round((camp.patients / camp.capacity) * 100);
    var loadS = loadStatus(loadPct), icuS = ratioStatus(camp.icuAvail, camp.icuTotal), ambS = ratioStatus(camp.ambAvail, camp.ambTotal);
    tip.innerHTML = '<b>' + camp.en + '</b><span class="ops-map__tip-mr">' + camp.mr + '</span>' +
      '<div class="ops-map__tip-row">' + sDot(loadS) + t('metric.campLoad') + ' — ' + loadPct + '%</div>' +
      '<div class="ops-map__tip-row">' + sDot(icuS) + t('metric.icuFree') + ' — ' + camp.icuAvail + '/' + camp.icuTotal + '</div>' +
      '<div class="ops-map__tip-row">' + sDot(ambS) + t('metric.ambReady') + ' — ' + camp.ambAvail + '/' + camp.ambTotal + '</div>';
    positionTip(tip, container, el);
    tip.classList.add('is-on');
  }

  function buildOpsMap(container, opts) {
    if (!container || mapsBuilt[opts.id]) return;
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

    container.insertAdjacentHTML('afterend',
      '<div class="ops-map__legend">' +
        '<span><i class="dot dot--ok"></i>' + t('route.legendOk') + '</span>' +
        '<span><i class="dot dot--warn"></i>' + t('route.legendWarn') + '</span>' +
        '<span><i class="dot dot--crit"></i>' + t('route.legendCrit') + '</span>' +
        (opts.showCamps ? '<span>✚ ' + t('liveops.camps') + '</span>' : '') +
      '</div>');

    var path = $('#opsPath-' + opts.id, container);
    var stopsG = $('#opsStops-' + opts.id, container);
    var campsG = opts.showCamps ? $('#opsCamps-' + opts.id, container) : null;
    var palkhiMarker = $('#opsPalkhi-' + opts.id, container);
    var tip = $('#opsTip-' + opts.id, container);

    var len = 0;
    try { len = path.getTotalLength(); } catch (e) {}
    if (!len) return;
    mapsBuilt[opts.id] = true;

    var pts = [];
    LOCATIONS.forEach(function (loc, i) {
      var tt = i / (LOCATIONS.length - 1);
      var pt = path.getPointAtLength(len * tt);
      pts.push({ loc: loc, pt: pt });

      var s = locWorstStatus(loc);
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'routemap__stop ops-map__stop' + (s === 'warn' ? ' is-warn' : s === 'crit' ? ' is-crit' : ''));
      g.setAttribute('data-loc', loc.id);
      g.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')');
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', (i === 0 || i === LOCATIONS.length - 1) ? '8' : '6');
      g.appendChild(c);
      stopsG.appendChild(g);

      g.addEventListener('mouseenter', function () { showLocTip(tip, container, g, loc); });
      g.addEventListener('mouseleave', function () { tip.classList.remove('is-on'); });
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
        g.addEventListener('mouseenter', function () { showCampTip(tip, container, g, camp); });
        g.addEventListener('mouseleave', function () { tip.classList.remove('is-on'); });
      });
    }

    var palkhiPt = pts.filter(function (p) { return p.loc.id === PALKHI.locId; })[0];
    if (palkhiPt) palkhiMarker.setAttribute('transform', 'translate(' + palkhiPt.pt.x.toFixed(1) + ',' + palkhiPt.pt.y.toFixed(1) + ')');

    if (HAS_GSAP && !REDUCED) {
      gsap.to($('.routemap__pulse', container), { scale: 1.7, opacity: 0, transformOrigin: '50% 50%', duration: 1.8, repeat: -1, ease: 'power2.out' });
    }
  }

  /* ══════════════ MEDICAL ══════════════ */
  function renderMedical(role) {
    var list = $('#campList');
    if (!list) return;
    list.innerHTML = CAMPS.map(function (c) {
      var overall = campOverall(c);
      var loadPct = Math.round((c.patients / c.capacity) * 100);
      var loadS = loadStatus(loadPct), icuS = ratioStatus(c.icuAvail, c.icuTotal), ambS = ratioStatus(c.ambAvail, c.ambTotal);

      var meds = Object.keys(c.meds).map(function (k) {
        var m = c.meds[k], s = stockStatus(m.stock, m.par);
        return '<div class="med-item"><span class="med-item__name">' + sDot(s) + t(MED_KEY_LABEL[k]) + '</span><span class="med-item__qty">' + m.stock + ' / ' + m.par + ' ' + m.unit + '</span></div>';
      }).join('');

      return '<div class="camp-card" data-camp="' + c.id + '">' +
        '<button type="button" class="camp-card__head">' +
          '<span class="camp-card__name">' + c.en + '<span>' + c.mr + '</span></span>' +
          sBadge(overall, statusWord(overall)) +
          '<span class="camp-card__chevron">▾</span>' +
        '</button>' +
        '<div class="camp-card__body">' +
          '<div class="metric-grid">' +
            '<div class="metric"><div class="metric__label">' + sDot(loadS) + t('metric.campLoad') + '</div><div class="metric__value">' + loadPct + '%</div><div class="metric__sub">' + t('metric.campLoadSub') + '</div></div>' +
            '<div class="metric"><div class="metric__label">' + t('metric.patientsTreated') + '</div><div class="metric__value">' + c.patients + ' / ' + c.capacity + '</div><div class="metric__sub">' + t('metric.patientsSub') + '</div></div>' +
            '<div class="metric"><div class="metric__label">' + sDot(icuS) + t('metric.icuFree') + '</div><div class="metric__value">' + c.icuAvail + ' / ' + c.icuTotal + '</div><div class="metric__sub">' + t('metric.icuSub') + '</div></div>' +
            '<div class="metric"><div class="metric__label">' + sDot(ambS) + t('metric.ambReady') + '</div><div class="metric__value">' + c.ambAvail + ' / ' + c.ambTotal + '</div><div class="metric__sub">' + t('metric.ambSub') + '</div></div>' +
          '</div>' +
          '<div class="med-stock"><h4>' + t('medical.medStock') + '</h4><div class="med-stock__grid">' + meds + '</div></div>' +
        '</div>' +
      '</div>';
    }).join('');

    list.onclick = function (e) {
      var head = e.target.closest('.camp-card__head');
      if (!head) return;
      head.closest('.camp-card').classList.toggle('is-open');
    };

    initPatientRegisterForm(role);
    renderPatients('');
    loadPatientsFromBackend();
    var search = $('#patientSearch');
    if (search) search.oninput = function () { renderPatients(search.value); };
    revealIn($$('.camp-card'));
  }

  function renderPatients(query) {
    var list = $('#patientList');
    if (!list) return;
    var q = (query || '').trim().toLowerCase();
    var filtered = patientsCache.filter(function (p) {
      if (!q) return true;
      return (p.name + ' ' + p.id + ' ' + p.camp + ' ' + p.condition).toLowerCase().indexOf(q) !== -1;
    });
    if (!filtered.length) { list.innerHTML = '<div class="patient-empty">' + t('patient.noMatch') + ' “' + query + '”.</div>'; return; }
    list.innerHTML = filtered.map(function (p) {
      return '<div class="patient-row">' +
        '<span class="patient-row__id">' + p.id + '</span>' +
        '<span><span class="patient-row__name">' + p.name + '</span><div class="patient-row__meta">' + p.age + ' ' + t('medical.yrs') + ' · ' + p.condition + ' · ' + patientStatusLabel(p.status) + '</div></span>' +
        '<span class="patient-row__camp">' + p.camp + '</span>' +
      '</div>';
    }).join('');
  }

  /* Backend is the source of truth for the patient roster — see
     backend/app.py's /api/patients. patientsCache above is only the
     instant fallback shown before this first resolves. */
  function backendPatientToRow(p) {
    return { id: p.id, name: p.name, age: p.age, camp: campLabel(p.camp_id), condition: p.condition || '—', status: p.status };
  }

  function loadPatientsFromBackend() {
    return fetch(BACKEND_URL + '/api/patients', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('backend responded ' + r.status); return r.json(); })
      .then(function (rows) {
        patientsCache = rows.map(backendPatientToRow);
        var search = $('#patientSearch');
        renderPatients(search ? search.value : '');
      })
      .catch(function (err) { console.warn('[Wari] patients backend unavailable:', err.message); });
  }

  /* ══════════════ PATIENT REGISTER + PRIOR-HISTORY POPUP ══════════════
     Registering by name is checked against the backend patient registry
     (case/whitespace-insensitive). A match means this person has been
     treated before — the doctor sees that history before continuing. */
  function showPatientHistoryModal(name, records) {
    var modal = $('#patientHistoryModal');
    if (!modal) return;
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
    $$('.page').forEach(function (p) { p.classList.toggle('is-active', p.dataset.page === pageId); });
    $$('.app__tab').forEach(function (tab) { tab.classList.toggle('is-on', tab.dataset.page === pageId); });

    if (pageId === 'dashboard') buildOpsMap($('#opsMapMini'), { id: 'mini', showCamps: false });
    if (pageId === 'live-ops') buildOpsMap($('#opsMapFull'), { id: 'full', showCamps: true });
  }

  function initApp(roleId) {
    var role = roleById(roleId);
    if (!role) return;

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
    if (refreshBtn) refreshBtn.onclick = function () { loadIntel(true); };
    loadIntel(false); // feeds the dashboard's Wari-status stat for every role; Intel tab only exists for the supervisor
    loadFeedFromBackend(); // real submitted-report history, not just this tab's in-memory pushes

    showPage(role.pages[0]);
    startFeedClock();

    document.getElementById('loginScreen').style.display = 'none';
    var shell = document.getElementById('appShell');
    shell.hidden = false;
  }

  function logout() {
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

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!selected) return;
      try { localStorage.setItem('wci_session', JSON.stringify({ roleId: selected.id })); } catch (err) {}
      initApp(selected.id);
    });

    revealIn($$('.role-tile'));
  }

  /* ══════════════ BOOT ══════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    if (window.WCI) WCI.initLangToggle();
    initLogin();

    $('#logoutBtn').addEventListener('click', logout);

    var histClose = $('#patientHistoryModalClose'), histOverlay = $('#patientHistoryModalOverlay'), histOk = $('#patientHistoryModalOk');
    if (histClose) histClose.addEventListener('click', hidePatientHistoryModal);
    if (histOverlay) histOverlay.addEventListener('click', hidePatientHistoryModal);
    if (histOk) histOk.addEventListener('click', hidePatientHistoryModal);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hidePatientHistoryModal(); });

    var session = null;
    try { session = JSON.parse(localStorage.getItem('wci_session') || 'null'); } catch (e) {}
    if (session && roleById(session.roleId)) {
      initApp(session.roleId);
    }
  });
})();
