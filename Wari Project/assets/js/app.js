/* ═══════════════════════════════════════════════════════════════════
   WARI COMMAND INTELLIGENCE — Command Center app logic
   Vanilla JS. No build step. Mock/simulated data throughout.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  /* ══════════════ I18N (login screen) ══════════════ */
  var I18N = {
    mr: {
      'login.title': 'प्राधिकरण प्रवेश',
      'login.sub': 'पंढरपूर वारीच्या एका सामायिक कार्यचित्रात प्रवेश करण्यासाठी आपली भूमिका निवडा.',
      'login.back': 'मागे',
      'login.userLabel': 'वापरकर्ता आयडी',
      'login.passLabel': 'पासवर्ड',
      'login.submit': 'प्रवेश करा',
      'login.note': 'प्रोटोटाइप प्रवेश — निवडलेल्या भूमिकेसाठी कोणतेही तपशील स्वीकारले जातील.'
    },
    en: {
      'login.title': 'Authority Sign In',
      'login.sub': 'Choose your role to enter the shared operational picture of the Pandharpur Wari.',
      'login.back': 'Back',
      'login.userLabel': 'User ID',
      'login.passLabel': 'Password',
      'login.submit': 'Sign In',
      'login.note': 'Prototype access — any credentials are accepted for the selected role.'
    }
  };

  function applyLang(lang) {
    $$('[data-i18n]').forEach(function (node) {
      var key = node.getAttribute('data-i18n');
      var val = (I18N[lang] || {})[key];
      if (val) node.textContent = val;
    });
    $$('[data-lang-btn]').forEach(function (b) { b.classList.toggle('is-on', b.dataset.langBtn === lang); });
    document.body.setAttribute('data-lang', lang);
    try { localStorage.setItem('wci_lang', lang); } catch (e) {}
  }

  function initLangToggle() {
    var saved = 'mr';
    try { saved = localStorage.getItem('wci_lang') || 'mr'; } catch (e) {}
    applyLang(saved);
    $$('[data-lang-btn]').forEach(function (b) {
      b.addEventListener('click', function () { applyLang(b.dataset.langBtn); });
    });
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
  var PAGE_LABEL = { dashboard: 'Dashboard', 'live-ops': 'Live Ops', records: 'Records', medical: 'Medical', intel: 'Intel' };

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
  var STATUS_WORD = { ok: 'Adequate', warn: 'Reduced', crit: 'Critical' };

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
  var MED_LABEL = { ors: 'ORS', antipyretics: 'Antipyretics (fever)', analgesics: 'Analgesics (pain relief)', ivFluids: 'IV Fluids', antiseptics: 'Antiseptics' };
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
  var ST_LABEL = { reported: 'Reported', ack: 'Acknowledged', progress: 'In Progress', resolved: 'Resolved' };
  var ST_CLASS = { reported: '', ack: 'fstat--ack', progress: 'fstat--progress', resolved: 'fstat--resolved' };
  var CAT_AUTH = { police: 'Police Authority', medical: 'Medical Authority', dindi: 'Dindi Coordinator', municipal: 'Municipal Authority', sanitation: 'Nirmal Wari' };

  var feedItems = [
    { cat: 'medical', sev: 'critical', st: 'reported', loc: 'Jejuri', mr: 'जेजुरी', h: 'Ambulance availability down to 2 vehicles at Camp 3', d: 'Medical Authority', ts: Date.now() - 2 * 60000 },
    { cat: 'medical', sev: 'high', st: 'progress', loc: 'Jejuri', mr: 'जेजुरी', h: 'Camp 3 load at 88% — presentations rising', d: 'Medical Authority', ts: Date.now() - 10 * 60000 },
    { cat: 'police', sev: 'high', st: 'ack', loc: 'Lonand', mr: 'लोणंद', h: 'Congestion high on the state highway diversion', d: 'Police Authority', ts: Date.now() - 25 * 60000 },
    { cat: 'dindi', sev: 'high', st: 'reported', loc: 'Lonand', mr: 'लोणंद', h: '14 Dindis compressing into the approach road', d: 'Dindi Coordinator', ts: Date.now() - 38 * 60000 },
    { cat: 'dindi', sev: 'info', st: 'ack', loc: 'Lonand', mr: 'लोणंद', h: 'Palkhi 22 minutes behind published schedule', d: 'Dindi Coordinator', ts: Date.now() - 54 * 60000 },
    { cat: 'municipal', sev: 'info', st: 'progress', loc: 'Lonand', mr: 'लोणंद', h: 'Rainfall increasing — two shelter tents taking water', d: 'Municipal Authority', ts: Date.now() - 71 * 60000 },
    { cat: 'sanitation', sev: 'info', st: 'resolved', loc: 'Walhe', mr: 'वाल्हे', h: 'Mobile toilet block restored to service', d: 'Nirmal Wari', ts: Date.now() - 88 * 60000 }
  ];
  var FEED_POOL = [
    { cat: 'dindi', sev: 'info', st: 'reported', loc: 'Taradgaon', mr: 'तरडगाव', h: 'Dindi 214 reports headcount 1,180 — on schedule', d: 'Dindi Coordinator' },
    { cat: 'medical', sev: 'high', st: 'reported', loc: 'Wakhari', mr: 'वाखरी', h: 'Three heat-exhaustion cases at the forward camp', d: 'Medical Authority' },
    { cat: 'sanitation', sev: 'high', st: 'reported', loc: 'Malshiras', mr: 'माळशिरस', h: 'Sanitation block at 90% utilisation', d: 'Nirmal Wari' },
    { cat: 'police', sev: 'critical', st: 'reported', loc: 'Natepute', mr: 'नातेपुते', h: 'Two-wheeler collision on the approach — lane blocked', d: 'Police Authority' },
    { cat: 'municipal', sev: 'info', st: 'progress', loc: 'Velapur', mr: 'वेळापूर', h: 'Street lighting restored across halt point', d: 'Municipal Authority' },
    { cat: 'medical', sev: 'info', st: 'resolved', loc: 'Barad', mr: 'बरड', h: 'Patient referred to district hospital — record synced', d: 'Medical Authority' }
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
    var li = document.createElement('li');
    li.className = 'fitem' + (age < 1200 ? ' fitem--enter' : '');
    li.dataset.cat = item.cat;
    li.dataset.sev = item.sev;
    li.dataset.status = item.st;
    li.innerHTML =
      '<i class="fitem__sev"></i>' +
      '<div class="fitem__main">' +
        '<h4>' + item.h + (isNew ? '<span class="fitem__new">New</span>' : '') + '</h4>' +
        '<div class="fitem__meta">' +
          '<span class="tag ' + (CAT_TAG[item.cat] || '') + '">' + item.cat + '</span>' +
          '<span class="fitem__loc">' + item.loc + '<span>' + item.mr + '</span></span>' +
          '<span>' + item.d + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="fitem__side">' +
        '<span class="fitem__time">' + timeAgo(item.ts) + '</span>' +
        '<span class="fstat ' + (ST_CLASS[item.st] || '') + '">' + ST_LABEL[item.st] + '</span>' +
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
    if (updated) updated.textContent = 'Updated ' + timeAgo(sorted[0] ? sorted[0].ts : Date.now());
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
    state: 'HIGH',
    confidence: 'High',
    freshnessMin: 2,
    locationsTracked: 14,
    issuedLabel: 'ISSUED 15:16 · DAY 11',
    criticalNow: ['Jejuri medical capacity rising rapidly', 'Ambulance availability insufficient at Jejuri Camp 3'],
    developingRisks: ['Traffic and crowd concentration increasing near Lonand', 'Palkhi running 22 minutes behind schedule'],
    whatChanged: ['Medical load increased rapidly at Jejuri', 'Rainfall increased at Lonand', 'Traffic changed from medium to high on the state highway'],
    resourceGaps: ['Ambulances', 'Medicine stock — ORS, antipyretics', 'Medical camp capacity'],
    emergingRisks: ['Dindi concentration compressing into the Lonand approach', 'Continued rainfall could further degrade the route surface'],
    priorityActions: ['Review Jejuri medical deployment and reassign an ambulance', 'Monitor downstream congestion beyond Lonand', 'Prepare medicine resupply for Jejuri Camp 2 and 3']
  };

  function renderIntel(data) {
    var CIRC = 2 * Math.PI * 98;
    var arc = $('#intelArc'), num = $('#intelNum'), state = $('#intelState');
    if (arc) arc.style.strokeDashoffset = CIRC * (1 - data.riskScore / 100);
    if (num) num.textContent = Math.round(data.riskScore);
    var cls = data.riskScore >= 80 ? 'is-crit' : data.riskScore >= 65 ? 'is-high' : data.riskScore >= 40 ? 'is-mod' : '';
    var gauge = $('#intelGauge'); if (gauge) gauge.className = 'gauge' + (cls ? ' ' + cls : '');
    if (state) state.textContent = data.state;

    var conf = $('#intelConf');
    if (conf) conf.innerHTML =
      '<div><span>Data freshness</span><b>' + data.freshnessMin + ' min</b></div>' +
      '<div><span>Confidence</span><b>' + data.confidence + '</b></div>' +
      '<div><span>Locations</span><b>' + data.locationsTracked + '</b></div>';

    function block(heading, hClass, items) {
      return '<section class="doc__blk"><h4 class="doc__h' + (hClass ? ' ' + hClass : '') + '">' + heading + '</h4><ul>' +
        items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul></section>';
    }

    var doc = $('#intelDoc');
    if (doc) doc.innerHTML =
      '<div class="doc__orn"></div>' +
      '<header class="doc__head"><span>WARI STATUS</span><b>' + data.state + '</b></header>' +
      block('Critical Now', 'doc__h--crit', data.criticalNow) +
      block('Developing Risks', 'doc__h--warn', data.developingRisks) +
      block('What Changed', '', data.whatChanged) +
      block('Resource Gaps', '', data.resourceGaps) +
      block('Emerging Risks', '', data.emergingRisks) +
      block('Priority Actions', 'doc__h--act', data.priorityActions) +
      '<footer class="doc__foot"><span>' + data.issuedLabel + '</span><span>SIMULATION</span></footer>';
  }

  /* ══════════════ REPORT FORM (Records) ══════════════ */
  var LOC_OPTIONS = LOCATIONS.map(function (l) { return '<option value="' + l.id + '">' + l.en + ' / ' + l.mr + '</option>'; }).join('');
  var CAMP_OPTIONS = CAMPS.map(function (c) { return '<option value="' + c.id + '">' + c.en + '</option>'; }).join('');

  var REPORT_FIELDS = {
    dindi: [
      { key: 'location', label: 'Location', type: 'select', options: LOC_OPTIONS },
      { key: 'headcount', label: 'Current headcount', type: 'number' },
      { key: 'delay', label: 'Delay (minutes, if any)', type: 'number' },
      { key: 'details', label: 'Member / vehicle issue (optional)', type: 'textarea' }
    ],
    medical: [
      { key: 'camp', label: 'Camp', type: 'select', options: CAMP_OPTIONS },
      { key: 'type', label: 'Update type', type: 'select', options: ['Camp load update', 'Medicine shortage', 'Emergency / referral', 'Ambulance request'].map(function (o) { return '<option>' + o + '</option>'; }).join('') },
      { key: 'details', label: 'Details', type: 'textarea' }
    ],
    police: [
      { key: 'location', label: 'Location', type: 'select', options: LOC_OPTIONS },
      { key: 'type', label: 'Incident type', type: 'select', options: ['Accident', 'Congestion', 'Route blockage', 'Crowd issue'].map(function (o) { return '<option>' + o + '</option>'; }).join('') },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'].map(function (o) { return '<option>' + o + '</option>'; }).join('') },
      { key: 'details', label: 'Details', type: 'textarea' }
    ],
    municipal: [
      { key: 'location', label: 'Location', type: 'select', options: LOC_OPTIONS },
      { key: 'type', label: 'Category', type: 'select', options: ['Water', 'Shelter', 'Electricity', 'Infrastructure'].map(function (o) { return '<option>' + o + '</option>'; }).join('') },
      { key: 'details', label: 'Details', type: 'textarea' }
    ],
    sanitation: [
      { key: 'location', label: 'Location', type: 'select', options: LOC_OPTIONS },
      { key: 'type', label: 'Category', type: 'select', options: ['Toilet block', 'Cleanliness', 'Facility status'].map(function (o) { return '<option>' + o + '</option>'; }).join('') },
      { key: 'details', label: 'Details', type: 'textarea' }
    ]
  };
  var SEV_MAP = { Low: 'info', Medium: 'info', High: 'high', Critical: 'critical' };

  function renderRecords(role) {
    var form = $('#reportForm');
    if (!form) return;
    var fields = REPORT_FIELDS[role.id] || [];
    form.innerHTML = fields.map(function (f) {
      var input = f.type === 'textarea' ? '<textarea id="rf-' + f.key + '"></textarea>'
        : f.type === 'select' ? '<select id="rf-' + f.key + '">' + f.options + '</select>'
        : '<input id="rf-' + f.key + '" type="' + f.type + '" />';
      return '<label class="field"><span>' + f.label + '</span>' + input + '</label>';
    }).join('') + '<button type="submit" class="btn btn--lg report-form__submit">Submit report</button>';

    form.onsubmit = function (e) {
      e.preventDefault();
      var values = {};
      fields.forEach(function (f) { values[f.key] = $('#rf-' + f.key, form).value; });

      var loc = LOCATIONS.filter(function (l) { return l.id === values.location; })[0];
      var camp = CAMPS.filter(function (c) { return c.id === values.camp; })[0];
      var headline = values.type ? values.type + (values.details ? ' — ' + values.details : '') : (values.details || (role.en + ' update'));
      pushFeedItem({
        cat: role.id, sev: SEV_MAP[values.severity] || 'info', st: 'reported',
        loc: loc ? loc.en : (camp ? camp.en : '—'), mr: loc ? loc.mr : (camp ? camp.mr : ''),
        h: headline, d: role.en
      });
      toast('Report submitted — now visible on the shared live feed.');
      form.reset();
    };
  }

  /* ══════════════ DASHBOARD ══════════════ */
  var DOMAINS = [
    { id: 'police', icon: 'g-police', name: 'Police' },
    { id: 'medical', icon: 'g-medical', name: 'Medical' },
    { id: 'municipal', icon: 'g-municipal', name: 'Municipal' },
    { id: 'sanitation', icon: 'g-sanitation', name: 'Sanitation' }
  ];

  function domainOverall(domId) {
    return LOCATIONS.reduce(function (acc, loc) { return worst(acc, loc.dom[domId]); }, 'ok');
  }

  function renderDashboard(role) {
    $('#dashRoleName').textContent = role.en;

    var overallStatus = INTEL_DATA.state;
    $('#statStrip').innerHTML = [
      { n: '11 / 21', label: 'Days on foot' },
      { n: '138 km', label: 'Alandi → Pandharpur so far' },
      { n: '512+', label: 'Dindis in motion' },
      { n: '15', label: 'Tracked locations' },
      { n: INTEL_DATA.riskScore, label: 'Wari status — ' + overallStatus }
    ].map(function (s) { return '<div class="stat-strip__cell"><b class="stat-strip__n">' + s.n + '</b><span class="stat-strip__label">' + s.label + '</span></div>'; }).join('');

    var loc = LOCATIONS.filter(function (l) { return l.id === PALKHI.locId; })[0];
    $('#palkhiStatus').innerHTML =
      '<div class="palkhi-row"><span>Currently near</span><b>' + loc.en + ' <span style="font-family:var(--f-mr);color:var(--vermillion);font-size:1rem;">' + loc.mr + '</span></b></div>' +
      '<div class="palkhi-row"><span>Schedule</span><b>' + PALKHI.delayMin + ' min behind</b></div>';

    $('#domainGrid').innerHTML = DOMAINS.map(function (d) {
      var s = domainOverall(d.id);
      return '<div class="domain-cell"><svg viewBox="0 0 120 100"><use href="#' + d.icon + '"/></svg>' +
        '<span class="domain-cell__name">' + d.name + '</span>' + sBadge(s, STATUS_WORD[s]) + '</div>';
    }).join('');

    renderFeed();
  }

  /* ══════════════ LIVE OPS ══════════════ */
  var liveOpsActive = { police: true, medical: true, municipal: true, sanitation: true };

  function renderLiveOps() {
    var loc = LOCATIONS.filter(function (l) { return l.id === PALKHI.locId; })[0];
    $('#palkhiMini').innerHTML = 'Palkhi currently near <b>' + loc.en + '</b> <span style="font-family:var(--f-mr);color:var(--vermillion);">' + loc.mr + '</span> — <b>' + PALKHI.delayMin + ' min</b> behind schedule';

    $('#liveOpsFilters').innerHTML = DOMAINS.map(function (d) {
      return '<button class="chip is-on" data-dom="' + d.id + '">' + d.name + '</button>';
    }).join('');

    $('#locGrid').innerHTML = LOCATIONS.map(function (l) {
      var doms = DOMAINS.map(function (d) {
        var s = l.dom[d.id];
        return '<span class="loc-dom is-active" data-dom="' + d.id + '">' + sDot(s) + d.name + '</span>';
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
        return '<div class="med-item"><span class="med-item__name">' + sDot(s) + MED_LABEL[k] + '</span><span class="med-item__qty">' + m.stock + ' / ' + m.par + ' ' + m.unit + '</span></div>';
      }).join('');

      return '<div class="camp-card" data-camp="' + c.id + '">' +
        '<button type="button" class="camp-card__head">' +
          '<span class="camp-card__name">' + c.en + '<span>' + c.mr + '</span></span>' +
          sBadge(overall, STATUS_WORD[overall]) +
          '<span class="camp-card__chevron">▾</span>' +
        '</button>' +
        '<div class="camp-card__body">' +
          '<div class="metric-grid">' +
            '<div class="metric"><div class="metric__label">' + sDot(loadS) + 'Camp load</div><div class="metric__value">' + loadPct + '%</div><div class="metric__sub">how full the camp is versus its bed capacity</div></div>' +
            '<div class="metric"><div class="metric__label">Patients being treated</div><div class="metric__value">' + c.patients + ' / ' + c.capacity + '</div><div class="metric__sub">current patients out of total beds</div></div>' +
            '<div class="metric"><div class="metric__label">' + sDot(icuS) + 'ICU beds free</div><div class="metric__value">' + c.icuAvail + ' / ' + c.icuTotal + '</div><div class="metric__sub">intensive-care beds available right now</div></div>' +
            '<div class="metric"><div class="metric__label">' + sDot(ambS) + 'Ambulances ready</div><div class="metric__value">' + c.ambAvail + ' / ' + c.ambTotal + '</div><div class="metric__sub">vehicles available to dispatch immediately</div></div>' +
          '</div>' +
          '<div class="med-stock"><h4>Medicine stock</h4><div class="med-stock__grid">' + meds + '</div></div>' +
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
  }

  function renderPatients(query) {
    var list = $('#patientList');
    if (!list) return;
    var q = (query || '').trim().toLowerCase();
    var filtered = PATIENTS.filter(function (p) {
      if (!q) return true;
      return (p.name + ' ' + p.id + ' ' + p.camp + ' ' + p.condition).toLowerCase().indexOf(q) !== -1;
    });
    if (!filtered.length) { list.innerHTML = '<div class="patient-empty">No patient records match “' + query + '”.</div>'; return; }
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
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 3600);
  }

  /* ══════════════ APP SHELL / ROUTER ══════════════ */
  function showPage(pageId) {
    $$('.page').forEach(function (p) { p.classList.toggle('is-active', p.dataset.page === pageId); });
    $$('.app__tab').forEach(function (t) { t.classList.toggle('is-on', t.dataset.page === pageId); });
  }

  function initApp(roleId) {
    var role = roleById(roleId);
    if (!role) return;

    $('#appRoleLabel').textContent = role.en;
    $('#appTabs').innerHTML = role.pages.map(function (p, i) {
      return '<button class="app__tab' + (i === 0 ? ' is-on' : '') + '" data-page="' + p + '">' + PAGE_LABEL[p] + '</button>';
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
  }

  /* ══════════════ BOOT ══════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    initLangToggle();
    initLogin();

    $('#logoutBtn').addEventListener('click', logout);

    var session = null;
    try { session = JSON.parse(localStorage.getItem('wci_session') || 'null'); } catch (e) {}
    if (session && roleById(session.roleId)) {
      initApp(session.roleId);
    }
  });
})();
