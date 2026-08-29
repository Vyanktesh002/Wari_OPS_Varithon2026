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
    { id: 'P-1042', name: 'Ramesh Jadhav',    age: 58, camp: 'Jejuri Camp 3',       condition: 'Heat exhaustion',   status: 'Admitted' },
    { id: 'P-1043', name: 'Sunita More',      age: 34, camp: 'Jejuri Camp 3',       condition: 'Dehydration',       status: 'Admitted' },
    { id: 'P-1044', name: 'Anil Kadam',       age: 61, camp: 'Jejuri Camp 2',       condition: 'High blood pressure', status: 'Treated & Discharged' },
    { id: 'P-1045', name: 'Vaishali Pawar',   age: 27, camp: 'Wakhari Forward Camp',condition: 'Minor foot injury', status: 'Treated & Discharged' },
    { id: 'P-1046', name: 'Ganesh Shinde',    age: 45, camp: 'Phaltan Camp',        condition: 'Fever',             status: 'Admitted' },
    { id: 'P-1047', name: 'Kavita Bhosale',   age: 39, camp: 'Jejuri Camp 1',       condition: 'Gastro upset',      status: 'Treated & Discharged' },
    { id: 'P-1048', name: 'Dattu Salunkhe',   age: 66, camp: 'Jejuri Camp 3',       condition: 'Chest discomfort',  status: 'Referred' },
    { id: 'P-1049', name: 'Meera Gaikwad',    age: 22, camp: 'Wakhari Forward Camp',condition: 'Blister / abrasion',status: 'Treated & Discharged' },
    { id: 'P-1050', name: 'Baban Chavan',     age: 71, camp: 'Jejuri Camp 2',       condition: 'Dehydration',       status: 'Admitted' },
    { id: 'P-1051', name: 'Pratibha Kale',    age: 48, camp: 'Phaltan Camp',        condition: 'Fracture (wrist)',  status: 'Referred' },
    { id: 'P-1052', name: 'Suresh Deshmukh',  age: 55, camp: 'Jejuri Camp 1',       condition: 'Fever',             status: 'Admitted' },
    { id: 'P-1053', name: 'Nirmala Jagtap',   age: 63, camp: 'Jejuri Camp 3',       condition: 'Heat exhaustion',   status: 'Admitted' },
    { id: 'P-1054', name: 'Vitthal Pathare',  age: 40, camp: 'Wakhari Forward Camp',condition: 'Minor injury',      status: 'Treated & Discharged' },
    { id: 'P-1055', name: 'Sarika Wagh',      age: 31, camp: 'Phaltan Camp',        condition: 'Gastro upset',      status: 'Treated & Discharged' }
  ];

  /* ══════════════ LIVE FEED ══════════════ */
  var CAT_TAG = { police: 'tag--police', medical: 'tag--med', dindi: 'tag--dindi', municipal: 'tag--muni', sanitation: 'tag--san' };
  var ST_CLASS = { reported: '', ack: 'fstat--ack', progress: 'fstat--progress', resolved: 'fstat--resolved' };

  var feedItems = [
    { cat: 'medical', sev: 'critical', st: 'reported', loc: 'Jejuri', mr: 'जेजुरी', h: 'Ambulance availability down to 2 vehicles at Camp 3', h_mr: 'शिबिर ३ मध्ये रुग्णवाहिका उपलब्धता २ वाहनांवर घसरली', d: 'Medical Authority', ts: Date.now() - 2 * 60000 },
    { cat: 'medical', sev: 'high', st: 'progress', loc: 'Jejuri', mr: 'जेजुरी', h: 'Camp 3 load at 88% — presentations rising', h_mr: 'शिबिर ३ चा भार ८८% — रुग्णसंख्या वाढते आहे', d: 'Medical Authority', ts: Date.now() - 10 * 60000 },
    { cat: 'police', sev: 'high', st: 'ack', loc: 'Lonand', mr: 'लोणंद', h: 'Congestion high on the state highway diversion', h_mr: 'राज्य महामार्ग वळणमार्गावर तीव्र कोंडी', d: 'Police Authority', ts: Date.now() - 25 * 60000 },
    { cat: 'dindi', sev: 'high', st: 'reported', loc: 'Lonand', mr: 'लोणंद', h: '14 Dindis compressing into the approach road', h_mr: '१४ दिंड्या प्रवेशमार्गावर एकवटत आहेत', d: 'Dindi Coordinator', ts: Date.now() - 38 * 60000 },
    { cat: 'dindi', sev: 'info', st: 'ack', loc: 'Lonand', mr: 'लोणंद', h: 'Palkhi 22 minutes behind published schedule', h_mr: 'पालखी जाहीर वेळापत्रकापेक्षा २२ मिनिटे मागे', d: 'Dindi Coordinator', ts: Date.now() - 54 * 60000 },
    { cat: 'municipal', sev: 'info', st: 'progress', loc: 'Lonand', mr: 'लोणंद', h: 'Rainfall increasing — two shelter tents taking water', h_mr: 'पावसाचा जोर वाढतो आहे — दोन निवारा तंबूंत पाणी शिरले', d: 'Municipal Authority', ts: Date.now() - 71 * 60000 },
    { cat: 'sanitation', sev: 'info', st: 'resolved', loc: 'Walhe', mr: 'वाल्हे', h: 'Mobile toilet block restored to service', h_mr: 'फिरते शौचालय विभाग पुन्हा सुरू', d: 'Nirmal Wari', ts: Date.now() - 88 * 60000 }
  ];
  var FEED_POOL = [
    { cat: 'dindi', sev: 'info', st: 'reported', loc: 'Taradgaon', mr: 'तरडगाव', h: 'Dindi 214 reports headcount 1,180 — on schedule', h_mr: 'दिंडी २१४ ने संख्या १,१८० नोंदवली — वेळापत्रकानुसार', d: 'Dindi Coordinator' },
    { cat: 'medical', sev: 'high', st: 'reported', loc: 'Wakhari', mr: 'वाखरी', h: 'Three heat-exhaustion cases at the forward camp', h_mr: 'अग्रगामी शिबिरात उष्माघाताची तीन प्रकरणे', d: 'Medical Authority' },
    { cat: 'sanitation', sev: 'high', st: 'reported', loc: 'Malshiras', mr: 'माळशिरस', h: 'Sanitation block at 90% utilisation', h_mr: 'स्वच्छता विभाग ९०% वापरात', d: 'Nirmal Wari' },
    { cat: 'police', sev: 'critical', st: 'reported', loc: 'Natepute', mr: 'नातेपुते', h: 'Two-wheeler collision on the approach — lane blocked', h_mr: 'प्रवेशमार्गावर दुचाकी अपघात — मार्गिका अडवली', d: 'Police Authority' },
    { cat: 'municipal', sev: 'info', st: 'progress', loc: 'Velapur', mr: 'वेळापूर', h: 'Street lighting restored across halt point', h_mr: 'थांबा बिंदूवर रस्ता दिवे पुन्हा सुरू', d: 'Municipal Authority' },
    { cat: 'medical', sev: 'info', st: 'resolved', loc: 'Barad', mr: 'बरड', h: 'Patient referred to district hospital — record synced', h_mr: 'रुग्णाला जिल्हा रुग्णालयात संदर्भित — नोंद समक्रमित', d: 'Medical Authority' }
  ];
  var feedPoolIdx = 0;
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
    sorted.slice(0, 12).forEach(function (item) { list.appendChild(feedNode(item)); });
    var updated = $('#feedUpdated');
    if (updated) updated.textContent = t('feed.updated') + ' ' + timeAgo(sorted[0] ? sorted[0].ts : Date.now());
  }

  function pushFeedItem(item) {
    item.ts = Date.now();
    feedItems.unshift(item);
    if (feedItems.length > 30) feedItems.length = 30;
    renderFeed();
  }

  function startFeedSimulation() {
    setInterval(function () {
      var base = FEED_POOL[feedPoolIdx % FEED_POOL.length];
      feedPoolIdx++;
      pushFeedItem(Object.assign({}, base));
    }, 14000);
    setInterval(renderFeed, 30000); // keep "time ago" labels fresh
  }

  /* ══════════════ INTEL (placeholder shell — data separated from layout) ══════════════ */
  var INTEL_DATA = {
    riskScore: 74,
    stateKey: 'gauge.high',
    freshnessMin: 2,
    locationsTracked: 14,
    criticalNow: ['intel.critical1', 'intel.critical2'],
    developingRisks: ['intel.dev1', 'intel.dev2'],
    whatChanged: ['intel.changed1', 'intel.changed2', 'intel.changed3'],
    resourceGaps: ['intel.gap1', 'intel.gap2', 'intel.gap3'],
    emergingRisks: ['intel.emerging1', 'intel.emerging2'],
    priorityActions: ['intel.action1', 'intel.action2', 'intel.action3']
  };

  function renderIntel(data) {
    var CIRC = 2 * Math.PI * 98;
    var arc = $('#intelArc'), num = $('#intelNum'), state = $('#intelState');
    if (arc) arc.style.strokeDashoffset = CIRC * (1 - data.riskScore / 100);
    if (num) num.textContent = Math.round(data.riskScore);
    var cls = data.riskScore >= 80 ? 'is-crit' : data.riskScore >= 65 ? 'is-high' : data.riskScore >= 40 ? 'is-mod' : '';
    var gauge = $('#intelGauge'); if (gauge) gauge.className = 'gauge' + (cls ? ' ' + cls : '');
    if (state) state.textContent = t(data.stateKey);

    var conf = $('#intelConf');
    if (conf) conf.innerHTML =
      '<div><span>' + t('brief.freshness') + '</span><b>' + data.freshnessMin + ' min</b></div>' +
      '<div><span>' + t('brief.confidence') + '</span><b>' + t('brief.confHigh') + '</b></div>' +
      '<div><span>' + t('brief.locations') + '</span><b>' + data.locationsTracked + '</b></div>';

    function block(headingKey, hClass, keys) {
      return '<section class="doc__blk"><h4 class="doc__h' + (hClass ? ' ' + hClass : '') + '">' + t(headingKey) + '</h4><ul>' +
        keys.map(function (k) { return '<li>' + t(k) + '</li>'; }).join('') + '</ul></section>';
    }

    var doc = $('#intelDoc');
    if (doc) doc.innerHTML =
      '<div class="doc__orn"></div>' +
      '<header class="doc__head"><span>' + t('doc.status') + '</span><b>' + t(data.stateKey) + '</b></header>' +
      block('doc.critNow', 'doc__h--crit', data.criticalNow) +
      block('doc.developing', 'doc__h--warn', data.developingRisks) +
      block('doc.whatChanged', '', data.whatChanged) +
      block('doc.resourceGaps', '', data.resourceGaps) +
      block('doc.emerging', '', data.emergingRisks) +
      block('doc.attention', 'doc__h--act', data.priorityActions) +
      '<footer class="doc__foot"><span>' + t('intel.issued') + '</span><span>' + t('doc.sim') + '</span></footer>';
    revealIn($$('.doc__blk', doc));
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
      toast(t('toast.reportSubmitted'));
      form.reset();
    };
  }

  /* ══════════════ DASHBOARD ══════════════ */
  var DOMAINS = [
    { id: 'police', icon: 'g-police' },
    { id: 'medical', icon: 'g-medical' },
    { id: 'municipal', icon: 'g-municipal' },
    { id: 'sanitation', icon: 'g-sanitation' }
  ];

  function domainOverall(domId) {
    return LOCATIONS.reduce(function (acc, loc) { return worst(acc, loc.dom[domId]); }, 'ok');
  }

  function renderDashboard(role) {
    $('#dashRoleName').textContent = roleName(role);

    $('#statStrip').innerHTML = [
      { n: '11 / 21', label: t('stat.daysOnFoot') },
      { n: '138 km', label: t('stat.kmSoFar') },
      { n: '512+', label: t('stat.dindisMotion') },
      { n: '15', label: t('stat.trackedLoc') },
      { n: INTEL_DATA.riskScore, label: t('stat.wariStatus') + ' — ' + t(INTEL_DATA.stateKey) }
    ].map(function (s) { return '<div class="stat-strip__cell"><b class="stat-strip__n">' + s.n + '</b><span class="stat-strip__label">' + s.label + '</span></div>'; }).join('');

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
        var s = l.dom[d.id];
        return '<span class="loc-dom is-active" data-dom="' + d.id + '">' + sDot(s) + t('chip.' + d.id) + '</span>';
      }).join('');
      return '<article class="loc-card"><div class="loc-card__head"><span class="loc-card__name">' + l.en + '</span><span class="loc-card__mr">' + l.mr + '</span></div>' +
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
    return DOMAINS.reduce(function (acc, d) { return worst(acc, loc.dom[d.id]); }, 'ok');
  }

  function positionTip(tip, container, targetEl) {
    var cRect = container.getBoundingClientRect();
    var tRect = targetEl.getBoundingClientRect();
    tip.style.left = (tRect.left + tRect.width / 2 - cRect.left) + 'px';
    tip.style.top = (tRect.top - cRect.top) + 'px';
  }

  function showLocTip(tip, container, el, loc) {
    var doms = DOMAINS.map(function (d) {
      var s = loc.dom[d.id];
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
  function renderMedical() {
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

    renderPatients('');
    var search = $('#patientSearch');
    if (search) search.oninput = function () { renderPatients(search.value); };
    revealIn($$('.camp-card'));
  }

  function renderPatients(query) {
    var list = $('#patientList');
    if (!list) return;
    var q = (query || '').trim().toLowerCase();
    var filtered = PATIENTS.filter(function (p) {
      if (!q) return true;
      return (p.name + ' ' + p.id + ' ' + p.camp + ' ' + p.condition).toLowerCase().indexOf(q) !== -1;
    });
    if (!filtered.length) { list.innerHTML = '<div class="patient-empty">' + t('patient.noMatch') + ' “' + query + '”.</div>'; return; }
    list.innerHTML = filtered.map(function (p) {
      return '<div class="patient-row">' +
        '<span class="patient-row__id">' + p.id + '</span>' +
        '<span><span class="patient-row__name">' + p.name + '</span><div class="patient-row__meta">' + p.age + ' yrs · ' + p.condition + ' · ' + p.status + '</div></span>' +
        '<span class="patient-row__camp">' + p.camp + '</span>' +
      '</div>';
    }).join('');
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
    if (role.pages.indexOf('medical') !== -1) renderMedical();
    if (role.pages.indexOf('intel') !== -1) renderIntel(INTEL_DATA);

    showPage(role.pages[0]);
    startFeedSimulation();

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

    var session = null;
    try { session = JSON.parse(localStorage.getItem('wci_session') || 'null'); } catch (e) {}
    if (session && roleById(session.roleId)) {
      initApp(session.roleId);
    }
  });
})();
