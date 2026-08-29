/* ═══════════════════════════════════════════════════════════════════
   WARI COMMAND INTELLIGENCE — Shared i18n
   One dictionary, used by index.html, app.html, main.js and app.js.
   Language choice is stored once (localStorage: wci_lang) and read by
   every page. Switching language reloads the current page so every
   piece of text — static markup and JS-rendered content alike —
   resolves from a single, consistent pass.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DICT = {
    en: {
      'a11y.skip': 'Skip to content',

      'nav.platform': 'Platform',
      'nav.authorities': 'Authorities',
      'nav.intelligence': 'Intelligence',
      'nav.enterCommand': 'Enter Command',

      'menu.navigate': 'Navigate',
      'menu.link1': 'The Problem',
      'menu.link2': 'Five Movements',
      'menu.link3': 'The Route',
      'menu.link4': 'Seven Authorities',
      'menu.link5': 'Live Feed',
      'menu.link6': 'Escalation',
      'menu.link7': 'Supervisor Brief',
      'menu.days': '21 Days · 250 KM',

      'hero.railLeft': 'Pandharpur Wari  ·  21 Days  ·  250 KM',
      'hero.railRight': 'Ashadhi Ekadashi  ·  Since 13th C.',
      'hero.title1': 'THE WARI',
      'hero.title2': 'THAT MOVES',
      'hero.title3': 'AS ONE',
      'hero.framePalkhi': 'PALKHI · LIVE',
      'hero.frameDindi': 'DINDI · 512 ACTIVE',
      'hero.promoTitleA': 'Command',
      'hero.promoTitleB': 'Center',
      'hero.promoBody': 'ONE SHARED, REAL-TIME OPERATIONAL PICTURE FOR EVERY AUTHORITY MOVING WITH THE PALKHI — DINDI, MEDICAL, POLICE, MUNICIPAL, SANITATION.',
      'hero.begin': 'Begin',
      'hero.scroll': 'SCROLL',

      'marquee.connect': 'CONNECT',
      'marquee.observe': 'OBSERVE',
      'marquee.detect': 'DETECT',
      'marquee.predict': 'PREDICT',
      'marquee.prioritize': 'PRIORITIZE',

      'fracture.label': 'The Problem',
      'fracture.h1': 'Six authorities.',
      'fracture.h2': 'One Wari.',
      'fracture.h3': 'Six separate truths.',
      'fracture.lede': 'A twenty-one day, two-hundred-and-fifty kilometre moving city. Half a million people on foot. Five hundred Dindis. Medical camps that appear and vanish overnight. And every authority keeping its own notebook, its own WhatsApp group, its own version of what is happening.',
      'scard.dindi.title': 'Dindi',
      'scard.dindi.desc': 'Headcount and delay, known only to the Dindi.',
      'scard.medical.title': 'Medical',
      'scard.medical.desc': 'A patient treated at Jejuri arrives at Wakhari with no history.',
      'scard.police.title': 'Police',
      'scard.police.desc': 'A blocked route logged on paper, radioed to no one else.',
      'scard.municipal.title': 'Municipal',
      'scard.municipal.desc': 'Water and shelter readiness, invisible until it fails.',
      'scard.sanitation.title': 'Sanitation',
      'scard.sanitation.desc': 'Facility status held in a separate register entirely.',
      'scard.supervisor.title': 'Supervisor',
      'scard.supervisor.desc': 'Asked to decide, with no way to see the whole.',
      'fracture.strike1': 'No shared picture.',
      'fracture.strike2': 'Wari Command Intelligence is the connection layer.',

      'stats.days': 'Days on foot',
      'stats.km': 'Alandi → Pandharpur',
      'stats.dindis': 'Dindis in motion',
      'stats.locations': 'Tracked route locations',
      'stats.roles': 'Authority roles',
      'stats.zero': 'Shared operational picture',

      'movements.label': 'Five Movements',
      'mv.connect.verb': 'CONNECT', 'mv.connect.mr': 'जोडणी',
      'mv.connect.txt': 'Six authorities that have never shared a screen now write into one operational state. Not a chat group — a structured, role-scoped record every other authority can read.',
      'mv.connect.l1': 'Role-based authentication', 'mv.connect.l2': 'Scoped permissions per authority', 'mv.connect.l3': 'One shared board, many views',
      'mv.observe.verb': 'OBSERVE', 'mv.observe.mr': 'निरीक्षण',
      'mv.observe.txt': 'The Wari is more than a GPS dot. Halt readiness, camp load, ambulance count, medicine stock, shelter capacity, sanitation, weather — the whole moving environment, tracked.',
      'mv.observe.l1': 'Palkhi schedule vs actual', 'mv.observe.l2': 'Dindi and crowd concentration', 'mv.observe.l3': 'Twelve live operational overlays',
      'mv.detect.verb': 'DETECT', 'mv.detect.mr': 'शोध',
      'mv.detect.txt': 'Meaningful change, not noise. The engine separates stable high pressure from pressure that is worsening fast, and suppresses the same alert repeating when nothing has actually moved.',
      'mv.detect.l1': 'Cross-domain correlation', 'mv.detect.l2': 'Newly critical vs. steady state', 'mv.detect.l3': 'Duplicate-alert suppression',
      'mv.predict.verb': 'PREDICT', 'mv.predict.mr': 'अंदाज',
      'mv.predict.txt': 'Current state plus the last few ticks of history. A deterministic, explainable risk model — every score can be traced back to the readings that produced it.',
      'mv.predict.l1': 'Trend over recent history', 'mv.predict.l2': 'Emerging risk, before it lands', 'mv.predict.l3': 'Data freshness and confidence',
      'mv.prioritize.verb': 'PRIORITIZE', 'mv.prioritize.mr': 'प्राधान्य',
      'mv.prioritize.txt': 'The supervisor should not have to discover the emerging situation by reading four hundred reports. The system says what deserves attention first, and why.',
      'mv.prioritize.l1': 'Ranked priority actions', 'mv.prioritize.l2': 'Named resource gaps', 'mv.prioritize.l3': 'End-of-day summary',

      'route.label': 'The Route',
      'route.h1': 'Alandi to',
      'route.h2': 'Pandharpur.',
      'route.lede': 'The Sant Dnyaneshwar Maharaj Palkhi route — fifteen tracked locations across twenty-one days. Every halt is an operational location with its own readiness, capacity and risk.',
      'route.tagPalkhi': 'PALKHI',
      'route.behindSchedule': 'behind schedule',
      'route.legendOk': 'Halt ready',
      'route.legendWarn': 'Capacity rising',
      'route.legendCrit': 'Needs attention',
      'route.sim': 'SIMULATION DATA',

      'authorities.label': 'Seven Authorities',
      'authorities.h1': 'Every role sees',
      'authorities.h2': 'what it must.',
      'acard.dindi.title': 'Dindi Coordinator',
      'acard.dindi.l1': 'Location & headcount', 'acard.dindi.l2': 'Delay reporting', 'acard.dindi.l3': 'Member & vehicle issues',
      'acard.medical.title': 'Medical Authority',
      'acard.medical.l1': 'Camp capacity & patient load', 'acard.medical.l2': 'Ambulance and ICU availability', 'acard.medical.l3': 'Medicine stock & referrals', 'acard.medical.l4': 'Cross-camp patient continuity',
      'acard.police.title': 'Police Authority',
      'acard.police.l1': 'Accidents & congestion', 'acard.police.l2': 'Route blockage', 'acard.police.l3': 'Incident lifecycle',
      'acard.municipal.title': 'Municipal Authority',
      'acard.municipal.l1': 'Water & electricity', 'acard.municipal.l2': 'Shelter capacity', 'acard.municipal.l3': 'Infrastructure faults',
      'acard.sanitation.title': 'Sanitation Authority',
      'acard.sanitation.l1': 'Toilet & facility status', 'acard.sanitation.l2': 'Cleanliness reporting', 'acard.sanitation.l3': 'Halt-point readiness',
      'acard.supervisor.title': 'Wari Supervisor',
      'acard.supervisor.note': 'Reads everything. Submits nothing. The only role with access to cross-authority intelligence — risk, resource gaps, emerging risk and the end-of-day brief.',
      'acard.supervisor.l1': 'Cross-authority intelligence', 'acard.supervisor.l2': 'Escalated incidents', 'acard.supervisor.l3': 'Unresolved issue tracking',
      'acard.admin.title': 'System Administrator',
      'acard.admin.l1': 'Users, roles & access', 'acard.admin.l2': 'Camp & Dindi configuration', 'acard.admin.l3': 'Audit trail',

      'feed.label': 'Shared Live Feed',
      'feed.h1': 'Not a chat.',
      'feed.h2': 'A record.',
      'feed.lede': 'Every update carries a timestamp, a location, an authority, a category, a severity and a status. Meaningful change only — filtered the way a field officer actually thinks.',
      'feed.live': 'LIVE',
      'feed.updated': 'Updated',
      'feed.empty': 'No reports yet — updates submitted on the Records page will appear here.',
      'chip.all': 'All', 'chip.police': 'Police', 'chip.medical': 'Medical', 'chip.dindi': 'Dindi',
      'chip.municipal': 'Municipal', 'chip.sanitation': 'Sanitation', 'chip.critical': 'Critical', 'chip.resolved': 'Resolved',
      'feed.simFooter': 'SIMULATION DATA — NOT LIVE GOVERNMENT FEED',

      'chain.label': 'Escalation',
      'gauge.label': 'WARI STATUS',
      'gauge.low': 'LOW', 'gauge.mod': 'MODERATE', 'gauge.high': 'HIGH', 'gauge.crit': 'CRITICAL',
      'chain.caption': 'One afternoon near Lonand. Nobody reports a crisis — six authorities each report something small. Scroll, and watch the score move.',
      'ev1.tag': 'MUNICIPAL', 'ev1.h': 'Rainfall increases at Lonand', 'ev1.p': 'Route surface degrading. Two shelter tents reported taking water.',
      'ev2.tag': 'DINDI', 'ev2.h': 'Palkhi falls 22 minutes behind', 'ev2.p': 'Schedule deviation crosses the twenty-minute threshold for the first time today.',
      'ev3.tag': 'DINDI', 'ev3.h': 'Dindi concentration rises', 'ev3.p': 'Fourteen Dindis compress into the Lonand approach. Density up 40% in twenty minutes.',
      'ev4.tag': 'POLICE', 'ev4.h': 'Traffic worsens on the state highway', 'ev4.p': 'Congestion moves from medium to high. Two-kilometre queue at the diversion.',
      'ev5.tag': 'MEDICAL', 'ev5.h': 'Medical load spikes at Jejuri camp', 'ev5.p': 'Capacity at 88%. Presentations rising faster than any camp today.',
      'ev6.tag': 'CRITICAL', 'ev6.h': 'Ambulance availability falls to two', 'ev6.p': 'Rising load, degraded route, blocked highway, two vehicles. The correlation the engine was built to catch.',
      'pipe1': 'Authority update', 'pipe2': 'Live feed', 'pipe3': 'Operational state', 'pipe4': 'Cross-domain detection',
      'pipe5': 'Risk escalation', 'pipe6': 'Resource gap', 'pipe7': 'Supervisor priority',

      'brief.label': 'Supervisor Brief',
      'brief.h1': 'The whole day,',
      'brief.h2': 'on one page.',
      'brief.lede': 'The supervisor should understand the situation without reading every report. This is the output of the intelligence service — deterministic, explainable, and traceable to the readings that produced it.',
      'brief.freshness': 'Data freshness', 'brief.confidence': 'Confidence', 'brief.locations': 'Locations', 'brief.confHigh': 'High',
      'doc.status': 'WARI STATUS',
      'doc.critNow': 'Critical Now', 'doc.developing': 'Developing', 'doc.emerging': 'Emerging Risks', 'doc.resourceGaps': 'Resource Gaps', 'doc.whatChanged': 'What Changed', 'doc.attention': 'Attention',
      'doc.item1': 'Jejuri medical capacity rising rapidly', 'doc.item2': 'Ambulance availability insufficient',
      'doc.item3': 'Traffic and crowd concentration increasing', 'doc.item4': 'Palkhi running 22 minutes late',
      'doc.item5': 'Ambulances', 'doc.item6': 'Medicine stock', 'doc.item7': 'Medical capacity',
      'doc.item8': 'Medical load increased rapidly', 'doc.item9': 'Rainfall increased', 'doc.item10': 'Traffic changed from medium to high',
      'doc.item11': 'Review Jejuri medical deployment', 'doc.item12': 'Monitor downstream congestion',
      'doc.issued': 'ISSUED 15:16 · DAY 11', 'doc.sim': 'SIMULATION',

      'cta.t1': 'FIELD UPDATES', 'cta.t2': 'BECOME SHARED STATE.', 'cta.t3': 'SHARED STATE BECOMES', 'cta.t4': 'ACTIONABLE INTELLIGENCE.',
      'cta.enter': 'Enter Command Center', 'cta.back': 'Back to top',

      'foot.brand.p': 'Authorities report → Wari state changes → relevant users see the change → intelligence identifies what matters → the supervisor acts.',
      'foot.screens': 'Screens',
      'foot.screens.1': 'Login', 'foot.screens.2': 'Common Dashboard', 'foot.screens.3': 'Live Operations',
      'foot.screens.4': 'Report / Update', 'foot.screens.5': 'Medical Operations', 'foot.screens.6': 'Supervisor Intelligence', 'foot.screens.7': 'Admin Panel',
      'foot.authorities': 'Authorities',
      'foot.built': 'Built with',
      'foot.built.5': 'Intelligence service (Python)',
      'foot.prototype': 'Prototype interface · All operational data shown is simulated',

      'login.title': 'Authority Sign In',
      'login.sub': 'Choose your role to enter the shared operational picture of the Pandharpur Wari.',
      'login.back': 'Back',
      'login.userLabel': 'User ID',
      'login.passLabel': 'Password',
      'login.submit': 'Sign In',
      'login.note': 'Sign in with your authority account.',
      'login.signingIn': 'Signing in…',
      'login.errOffline': 'Cannot reach the authentication server. Start the backend (backend/app.py) and try again.',
      'login.errGeneric': 'Sign in failed. Please try again.',

      'app.nav.logout': 'Logout',
      'app.tab.dashboard': 'Dashboard', 'app.tab.live-ops': 'Live Ops', 'app.tab.records': 'Reports', 'app.tab.medical': 'Medical', 'app.tab.intel': 'Intel',

      'dash.label': 'Command Dashboard',
      'dash.greeting': 'Namaskar,',
      'dash.lede': 'One shared, real-time picture of the Wari right now.',
      'dash.palkhiStatus': 'Palkhi Status',
      'dash.domainReadiness': 'Domain Readiness',
      'dash.liveActivity': 'Live Activity',
      'dash.routeMap': 'Route Map — Live Tracking',
      'dash.mapHint': 'Hover a marker for live status',
      'dash.currentlyNear': 'Currently near',
      'dash.schedule': 'Schedule',
      'dash.minBehind': 'min behind',
      'stat.daysOnFoot': 'Days on foot',
      'stat.kmSoFar': 'Alandi → Pandharpur so far',
      'stat.dindisMotion': 'Dindis in motion',
      'stat.trackedLoc': 'Tracked locations',
      'stat.wariStatus': 'Wari status',

      'liveops.label': 'Live Operations',
      'liveops.h1': 'Wari, in motion.',
      'liveops.lede': 'Location-by-location operational status across the route.',
      'liveops.mapTitle': 'Live Tracking Map',
      'liveops.mapHint': 'Hover a marker for live status · camps are shown with a medical marker',
      'liveops.palkhi': 'Palkhi currently near',
      'liveops.behind': 'behind schedule',
      'liveops.camps': 'Camps',
      'liveops.locations': 'Locations',

      'records.label': 'Reports',
      'records.h1': 'File an update.',
      'records.lede': 'Your report becomes shared operational state the moment you submit it.',
      'records.submit': 'Submit report',
      'field.location': 'Location', 'field.headcount': 'Current headcount', 'field.delay': 'Delay (minutes, if any)',
      'field.memberIssue': 'Member / vehicle issue (optional)', 'field.camp': 'Camp', 'field.updateType': 'Update type',
      'field.details': 'Details', 'field.incidentType': 'Incident type', 'field.severity': 'Severity', 'field.category': 'Category',
      'opt.campLoad': 'Camp load update', 'opt.medShortage': 'Medicine shortage', 'opt.emergency': 'Emergency / referral', 'opt.ambRequest': 'Ambulance request',
      'opt.accident': 'Accident', 'opt.congestion': 'Congestion', 'opt.blockage': 'Route blockage', 'opt.crowdIssue': 'Crowd issue',
      'opt.low': 'Low', 'opt.medium': 'Medium', 'opt.high': 'High', 'opt.critical': 'Critical',
      'opt.water': 'Water', 'opt.shelter': 'Shelter', 'opt.electricity': 'Electricity', 'opt.infra': 'Infrastructure',
      'opt.toilet': 'Toilet block', 'opt.cleanliness': 'Cleanliness', 'opt.facility': 'Facility status',

      'medical.label': 'Medical Command',
      'medical.h1': 'Camps & patients.',
      'medical.lede': 'Tap a camp to see its full status — load, beds, ambulances and medicine stock together.',
      'medical.campStatus': 'Camp Status',
      'medical.patientRecords': 'Patient Records',
      'medical.restricted': 'Restricted to Medical Authority & Wari Supervisor',
      'medical.searchPlaceholder': 'Search by name, ID, camp, or condition…',
      'metric.campLoad': 'Camp load', 'metric.campLoadSub': 'how full the camp is versus its bed capacity',
      'metric.patientsTreated': 'Patients being treated', 'metric.patientsSub': 'current patients out of total beds',
      'metric.icuFree': 'ICU beds free', 'metric.icuSub': 'intensive-care beds available right now',
      'metric.ambReady': 'Ambulances ready', 'metric.ambSub': 'vehicles available to dispatch immediately',
      'medical.medStock': 'Medicine stock',
      'patient.noMatch': 'No patient records match',
      'medical.yrs': 'yrs',

      'medical.registerPatient': 'Register Patient',
      'medical.registerHint': 'Registering by name checks for prior visits automatically.',
      'field.patientName': 'Patient name', 'field.age': 'Age', 'field.condition': 'Condition / ailment',
      'field.status': 'Status', 'field.notes': 'Notes (optional)',
      'medical.registerSubmit': 'Register patient',
      'medical.registerSuccess': 'Patient registered.',
      'medical.registerFailed': 'Could not register patient — check the details and try again.',
      'medical.registerOffline': 'Patient registry backend is offline — the record was not saved.',
      'pstatus.admitted': 'Admitted', 'pstatus.discharged': 'Treated & Discharged', 'pstatus.referred': 'Referred',
      'medical.priorHistoryTitle': 'Prior treatment history found',
      'medical.priorHistoryNote': 'A patient with this name has been treated before — review before proceeding:',
      'medical.patientHistoryTitle': 'Patient history',
      'medical.patientHistoryNote': 'All recorded visits for this patient, most recent first:',
      'medical.priorHistoryAck': 'Got it, continue',

      'intel.label': 'Supervisor Intelligence',
      'intel.h1': 'The whole day, on one page.',
      'intel.lede': 'Live, deterministic risk scoring from the Wari model service — one call per location, merged into a single supervisor picture.',

      'status.ok': 'Adequate', 'status.warn': 'Reduced', 'status.crit': 'Critical',
      'fstat.reported': 'Reported', 'fstat.ack': 'Acknowledged', 'fstat.progress': 'In Progress', 'fstat.resolved': 'Resolved',
      'med.ors': 'ORS', 'med.antipyretics': 'Antipyretics (fever)', 'med.analgesics': 'Analgesics (pain relief)', 'med.ivFluids': 'IV Fluids', 'med.antiseptics': 'Antiseptics',
      'toast.reportSubmitted': 'Report submitted — now visible on the shared live feed.',

      'domain.palkhi': 'Palkhi', 'domain.dindi': 'Dindi', 'domain.medical': 'Medical', 'domain.traffic': 'Traffic',
      'domain.municipal': 'Municipal', 'domain.sanitation': 'Sanitation', 'domain.weather': 'Weather',
      'domain.halt': 'Halt', 'domain.incidents': 'Incidents',
      'intel.live': 'LIVE MODEL', 'intel.loading': 'Loading live intelligence…',
      'intel.offline': 'Supervisor intelligence backend is offline. Start the model service and Flask backend to see live analysis.',
      'intel.refresh': 'Refresh analysis', 'intel.refreshing': 'Refreshing…',
      'intel.keyFactors': 'Key Factors', 'intel.locationsAtRisk': 'Locations at Risk',
      'intel.modelVersion': 'Model', 'intel.asOf': 'As of',
      'intel.avgRisk': 'Network average', 'intel.worstLocation': 'Highest risk',
      'intel.noGaps': 'No resource gaps reported.', 'intel.noEmerging': 'No emerging risks detected.',
      'intel.noActions': 'No priority actions right now.', 'intel.allCalm': 'All locations calm — no significant factors.',
      'freshness.fresh': 'Fresh', 'freshness.aging': 'Aging', 'freshness.stale': 'Stale',
      'confidence.high': 'High', 'confidence.medium': 'Medium', 'confidence.low': 'Low',
      'situation.stable': 'Stable', 'situation.stable_high_pressure': 'Stable — high pressure',
      'situation.rapidly_worsening': 'Rapidly worsening', 'situation.improving': 'Improving',
      'situation.newly_critical': 'Newly critical', 'situation.resolved': 'Resolved',

      /* ── v2 command-centre UI ── */
      'ui.moreDetails': 'More details', 'ui.close': 'Close', 'ui.filter': 'Filter',
      'ui.clearFilters': 'Reset filters', 'ui.expand': 'Expand', 'ui.collapse': 'Collapse',
      'time.now': 'just now', 'time.min': 'min ago', 'time.hr': 'h ago',

      'dial.label': 'Route Readiness', 'dial.center': 'READINESS',
      'dial.clear': 'Clear', 'dial.flagged': 'Flagged',
      'dial.outer': 'Route covered', 'dial.inner': 'Domain checks',
      'dial.more': 'Open live operations',

      'dcard.checks': 'checks green', 'dcard.authorities': 'Authorities on the board',
      'dcard.online': 'online', 'dcard.ctaText': 'Every authority reports into one shared board.',
      'dcard.ctaBtn': 'File an update',

      'liveops.coverage': 'Route Coverage', 'liveops.showing': 'Showing',
      'liveops.noMatch': 'No locations match these filters.',
      'liveops.sortRisk': 'By risk', 'liveops.sortRoute': 'Route order',

      'drawer.eyebrow': 'Location detail', 'drawer.domains': 'Domain status',
      'drawer.camps': 'Medical camps here', 'drawer.noCamps': 'No medical camp at this location.',
      'drawer.palkhiHere': 'Palkhi is here now', 'drawer.position': 'Route position',
      'drawer.critSentence': '{domain} needs immediate attention here — conditions are critical.',
      'drawer.warnSentence': '{domain} capacity is reduced here and should be watched.',
      'drawer.allClearSentence': 'All services — police, medical, municipal and sanitation — are operating normally here.',

      'palkhi.dnyaneshwar': 'Sant Dnyaneshwar Palkhi', 'palkhi.tukaram': 'Sant Tukaram Palkhi',

      'medical.capacity': 'Network Capacity', 'medical.occupancy': 'OCCUPANCY',
      'medical.bedsUsed': 'Beds in use', 'medical.stockLevel': 'Stock level',
      'medical.allCamps': 'All camps', 'medical.campsOnline': 'camps reporting',

      'patient.all': 'All', 'patient.showing': 'Showing',

      'intel.distribution': 'Risk distribution', 'intel.detail': 'Detail', 'intel.domains': 'Domains',

      'map.zoomHint': 'Click the map to zoom',

      'intel.aiBadge': 'AI Analysis',
      'intel.aiNote': 'Written by the Wari model from live operational data, not by hand. Re-generated on every report.',
      'intel.generating': 'Generating analysis',
      'intel.showAll': 'Show all locations', 'intel.showLess': 'Show only at risk',
      'intel.noBand': 'No locations in this band.',
      'intel.atRisk': 'at risk'
    },
    mr: {
      'a11y.skip': 'मुख्य मजकुराकडे जा',

      'nav.platform': 'व्यासपीठ',
      'nav.authorities': 'प्राधिकरणे',
      'nav.intelligence': 'बुद्धिमत्ता',
      'nav.enterCommand': 'कमांड प्रविष्ट करा',

      'menu.navigate': 'मार्गक्रमण',
      'menu.link1': 'समस्या',
      'menu.link2': 'पाच हालचाली',
      'menu.link3': 'मार्ग',
      'menu.link4': 'सात प्राधिकरणे',
      'menu.link5': 'थेट फीड',
      'menu.link6': 'तीव्रता वाढ',
      'menu.link7': 'पर्यवेक्षक अहवाल',
      'menu.days': '२१ दिवस · २५० किमी',

      'hero.railLeft': 'पंढरपूर वारी  ·  २१ दिवस  ·  २५० किमी',
      'hero.railRight': 'आषाढी एकादशी  ·  १३ व्या शतकापासून',
      'hero.title1': 'जी वारी',
      'hero.title2': 'एकत्र चालते',
      'hero.title3': 'एक होऊन',
      'hero.framePalkhi': 'पालखी · थेट',
      'hero.frameDindi': 'दिंडी · ५१२ सक्रिय',
      'hero.promoTitleA': 'कमांड',
      'hero.promoTitleB': 'सेंटर',
      'hero.promoBody': 'पालखीसोबत चालणाऱ्या प्रत्येक प्राधिकरणासाठी — दिंडी, वैद्यकीय, पोलीस, नगरपालिका, स्वच्छता — एक सामायिक, प्रत्यक्ष-वेळ कार्यचित्र.',
      'hero.begin': 'सुरू करा',
      'hero.scroll': 'स्क्रोल करा',

      'marquee.connect': 'जोडणी',
      'marquee.observe': 'निरीक्षण',
      'marquee.detect': 'शोध',
      'marquee.predict': 'अंदाज',
      'marquee.prioritize': 'प्राधान्य',

      'fracture.label': 'समस्या',
      'fracture.h1': 'सहा प्राधिकरणे.',
      'fracture.h2': 'एक वारी.',
      'fracture.h3': 'सहा वेगवेगळी सत्ये.',
      'fracture.lede': 'एकवीस दिवसांचे, दोनशे पन्नास किलोमीटरचे चालते शहर. पाच लाख लोक पायी. पाचशे दिंड्या. रात्रीत उभी राहणारी आणि नाहीशी होणारी वैद्यकीय शिबिरे. आणि प्रत्येक प्राधिकरण आपली स्वतःची वही, स्वतःचा व्हॉट्सअॅप गट, घडणाऱ्या घटनांची स्वतःची आवृत्ती सांभाळत आहे.',
      'scard.dindi.title': 'दिंडी',
      'scard.dindi.desc': 'संख्या आणि विलंब, फक्त दिंडीलाच माहीत.',
      'scard.medical.title': 'वैद्यकीय',
      'scard.medical.desc': 'जेजुरीत उपचार घेतलेला रुग्ण वाखरीत कोणत्याही नोंदीशिवाय पोहोचतो.',
      'scard.police.title': 'पोलीस',
      'scard.police.desc': 'अडवलेला मार्ग कागदावर नोंदवला, इतर कोणालाच कळवला नाही.',
      'scard.municipal.title': 'नगरपालिका',
      'scard.municipal.desc': 'पाणी आणि निवारा सज्जता, बिघडेपर्यंत अदृश्य.',
      'scard.sanitation.title': 'स्वच्छता',
      'scard.sanitation.desc': 'सुविधेची स्थिती पूर्णपणे वेगळ्या नोंदवहीत.',
      'scard.supervisor.title': 'पर्यवेक्षक',
      'scard.supervisor.desc': 'संपूर्ण चित्र न पाहताच निर्णय घेण्यास सांगितले जाते.',
      'fracture.strike1': 'कोणतेही सामायिक चित्र नाही.',
      'fracture.strike2': 'वारी कमांड इंटेलिजन्स हा जोडणीचा स्तर आहे.',

      'stats.days': 'पायी चाललेले दिवस',
      'stats.km': 'आळंदी → पंढरपूर',
      'stats.dindis': 'गतिमान दिंड्या',
      'stats.locations': 'नोंदवलेली मार्गस्थळे',
      'stats.roles': 'प्राधिकरण भूमिका',
      'stats.zero': 'सामायिक कार्यचित्र',

      'movements.label': 'पाच हालचाली',
      'mv.connect.verb': 'जोडणी', 'mv.connect.mr': 'जोडणी',
      'mv.connect.txt': 'कधीही एकत्र स्क्रीन न पाहिलेली सहा प्राधिकरणे आता एकाच कार्यस्थितीत नोंद करतात. हा चॅट गट नाही — प्रत्येक इतर प्राधिकरणाला वाचता येईल असा संरचित, भूमिका-निहाय अभिलेख आहे.',
      'mv.connect.l1': 'भूमिकेनुसार प्रमाणीकरण', 'mv.connect.l2': 'प्रत्येक प्राधिकरणासाठी मर्यादित अधिकार', 'mv.connect.l3': 'एक सामायिक फलक, अनेक दृश्ये',
      'mv.observe.verb': 'निरीक्षण', 'mv.observe.mr': 'निरीक्षण',
      'mv.observe.txt': 'वारी म्हणजे केवळ जीपीएस ठिपका नाही. थांबा सज्जता, शिबिर भार, रुग्णवाहिका संख्या, औषध साठा, निवारा क्षमता, स्वच्छता, हवामान — संपूर्ण चालते वातावरण नोंदवले जाते.',
      'mv.observe.l1': 'पालखीचे वेळापत्रक विरुद्ध प्रत्यक्ष स्थिती', 'mv.observe.l2': 'दिंडी आणि गर्दीची घनता', 'mv.observe.l3': 'बारा थेट कार्यात्मक स्तर',
      'mv.detect.verb': 'शोध', 'mv.detect.mr': 'शोध',
      'mv.detect.txt': 'अर्थपूर्ण बदल, गोंगाट नव्हे. स्थिर उच्च दाब आणि वेगाने बिघडणारा दाब यांत इंजिन फरक करते, आणि प्रत्यक्षात काहीच न बदलल्यास तोच इशारा पुन्हा पुन्हा येण्यापासून थांबवते.',
      'mv.detect.l1': 'क्षेत्रांमधील परस्परसंबंध', 'mv.detect.l2': 'नव्याने गंभीर विरुद्ध स्थिर स्थिती', 'mv.detect.l3': 'पुनरावृत्त इशारे रोखणे',
      'mv.predict.verb': 'अंदाज', 'mv.predict.mr': 'अंदाज',
      'mv.predict.txt': 'सध्याची स्थिती आणि नुकत्याच इतिहासाचे काही टप्पे. एक निश्चित, स्पष्ट करता येणारे जोखीम प्रतिमान — प्रत्येक गुणांक तो निर्माण करणाऱ्या नोंदींपर्यंत मागे नेता येतो.',
      'mv.predict.l1': 'अलीकडील इतिहासातील कल', 'mv.predict.l2': 'उद्भवणारी जोखीम, प्रत्यक्षात येण्यापूर्वी', 'mv.predict.l3': 'माहितीची ताजेपणा आणि विश्वासार्हता',
      'mv.prioritize.verb': 'प्राधान्य', 'mv.prioritize.mr': 'प्राधान्य',
      'mv.prioritize.txt': 'पर्यवेक्षकाला चारशे अहवाल वाचून उद्भवणारी परिस्थिती शोधावी लागू नये. प्रणाली सांगते आधी कशाकडे लक्ष द्यायचे, आणि का.',
      'mv.prioritize.l1': 'क्रमवारीत प्राधान्य कृती', 'mv.prioritize.l2': 'निश्चित संसाधन तुटवडे', 'mv.prioritize.l3': 'दिवसअखेरचा सारांश',

      'route.label': 'मार्ग',
      'route.h1': 'आळंदी ते',
      'route.h2': 'पंढरपूर.',
      'route.lede': 'संत ज्ञानेश्वर महाराज पालखी मार्ग — एकवीस दिवसांत पंधरा नोंदवलेली स्थळे. प्रत्येक थांबा स्वतःची सज्जता, क्षमता आणि जोखीम असलेले कार्यस्थळ आहे.',
      'route.tagPalkhi': 'पालखी',
      'route.behindSchedule': 'वेळापत्रकापेक्षा मागे',
      'route.legendOk': 'थांबा सज्ज',
      'route.legendWarn': 'क्षमता वाढते आहे',
      'route.legendCrit': 'लक्ष देण्याची गरज',
      'route.sim': 'अनुरूपित माहिती',

      'authorities.label': 'सात प्राधिकरणे',
      'authorities.h1': 'प्रत्येक भूमिका पाहते',
      'authorities.h2': 'जे आवश्यक आहे तेच.',
      'acard.dindi.title': 'दिंडी समन्वयक',
      'acard.dindi.l1': 'स्थान आणि संख्या', 'acard.dindi.l2': 'विलंब नोंद', 'acard.dindi.l3': 'सदस्य व वाहन समस्या',
      'acard.medical.title': 'वैद्यकीय अधिकारी',
      'acard.medical.l1': 'शिबिर क्षमता व रुग्ण भार', 'acard.medical.l2': 'रुग्णवाहिका व आयसीयू उपलब्धता', 'acard.medical.l3': 'औषध साठा व संदर्भ', 'acard.medical.l4': 'शिबिरांदरम्यान रुग्ण सातत्य',
      'acard.police.title': 'पोलीस प्रशासन',
      'acard.police.l1': 'अपघात व वाहतूक कोंडी', 'acard.police.l2': 'मार्ग अडथळा', 'acard.police.l3': 'घटनेचा संपूर्ण प्रवास',
      'acard.municipal.title': 'नगरपालिका',
      'acard.municipal.l1': 'पाणी व वीज', 'acard.municipal.l2': 'निवारा क्षमता', 'acard.municipal.l3': 'पायाभूत सुविधा बिघाड',
      'acard.sanitation.title': 'निर्मल वारी',
      'acard.sanitation.l1': 'शौचालय व सुविधा स्थिती', 'acard.sanitation.l2': 'स्वच्छता नोंद', 'acard.sanitation.l3': 'थांबा-बिंदू सज्जता',
      'acard.supervisor.title': 'वारी नियंत्रक',
      'acard.supervisor.note': 'सर्व काही वाचतो. काहीही सादर करत नाही. जोखीम, संसाधन तुटवडे, उद्भवणारी जोखीम आणि दिवसअखेरचा अहवाल — या सर्व-प्राधिकरण बुद्धिमत्तेचा प्रवेश असलेली एकमेव भूमिका.',
      'acard.supervisor.l1': 'सर्व-प्राधिकरण बुद्धिमत्ता', 'acard.supervisor.l2': 'तीव्र झालेल्या घटना', 'acard.supervisor.l3': 'प्रलंबित समस्यांचा मागोवा',
      'acard.admin.title': 'प्रणाली प्रशासक',
      'acard.admin.l1': 'वापरकर्ते, भूमिका व प्रवेश', 'acard.admin.l2': 'शिबिर व दिंडी संरचना', 'acard.admin.l3': 'अंकेक्षण नोंद',

      'feed.label': 'सामायिक थेट फीड',
      'feed.h1': 'गप्पा नव्हे.',
      'feed.h2': 'एक अभिलेख.',
      'feed.lede': 'प्रत्येक अद्ययावतीत वेळ, स्थान, प्राधिकरण, प्रकार, तीव्रता आणि स्थिती असते. फक्त अर्थपूर्ण बदल — क्षेत्रीय अधिकारी प्रत्यक्षात विचार करतो त्या पद्धतीने गाळलेले.',
      'feed.live': 'थेट',
      'feed.updated': 'अद्ययावत',
      'feed.empty': 'अद्याप कोणतेही अहवाल नाहीत — नोंदी पानावर सादर केलेले अद्ययावत इथे दिसतील.',
      'chip.all': 'सर्व', 'chip.police': 'पोलीस', 'chip.medical': 'वैद्यकीय', 'chip.dindi': 'दिंडी',
      'chip.municipal': 'नगरपालिका', 'chip.sanitation': 'स्वच्छता', 'chip.critical': 'गंभीर', 'chip.resolved': 'निकाली',
      'feed.simFooter': 'अनुरूपित माहिती — शासकीय थेट फीड नाही',

      'chain.label': 'तीव्रता वाढ',
      'gauge.label': 'वारी स्थिती',
      'gauge.low': 'निम्न', 'gauge.mod': 'मध्यम', 'gauge.high': 'उच्च', 'gauge.crit': 'गंभीर',
      'chain.caption': 'लोणंदजवळची एक दुपार. कोणीही संकट नोंदवत नाही — सहा प्राधिकरणे प्रत्येकी काहीतरी लहान नोंदवतात. स्क्रोल करा, आणि गुणांक बदलताना पहा.',
      'ev1.tag': 'नगरपालिका', 'ev1.h': 'लोणंदमध्ये पावसाचा जोर वाढला', 'ev1.p': 'मार्गाची पृष्ठभाग खराब होत आहे. दोन निवारा तंबूंमध्ये पाणी शिरल्याची नोंद.',
      'ev2.tag': 'दिंडी', 'ev2.h': 'पालखी २२ मिनिटे मागे पडली', 'ev2.p': 'वेळापत्रकातील फरकाने आज प्रथमच वीस मिनिटांची मर्यादा ओलांडली.',
      'ev3.tag': 'दिंडी', 'ev3.h': 'दिंडी घनता वाढली', 'ev3.p': 'चौदा दिंड्या लोणंद प्रवेशमार्गावर एकवटल्या. वीस मिनिटांत घनता ४०% वाढली.',
      'ev4.tag': 'पोलीस', 'ev4.h': 'राज्य महामार्गावर वाहतूक बिघडली', 'ev4.p': 'कोंडी मध्यम वरून उच्च झाली. वळणमार्गावर दोन किलोमीटरची रांग.',
      'ev5.tag': 'वैद्यकीय', 'ev5.h': 'जेजुरी शिबिरात वैद्यकीय भार वाढला', 'ev5.p': 'क्षमता ८८%. आज कोणत्याही शिबिरापेक्षा वेगाने रुग्ण वाढत आहेत.',
      'ev6.tag': 'गंभीर', 'ev6.h': 'रुग्णवाहिका उपलब्धता दोनवर घसरली', 'ev6.p': 'वाढता भार, बिघडलेला मार्ग, अडवलेला महामार्ग, फक्त दोन वाहने. हाच परस्परसंबंध पकडण्यासाठी इंजिन तयार केले आहे.',
      'pipe1': 'प्राधिकरण अद्ययावत', 'pipe2': 'थेट फीड', 'pipe3': 'कार्यस्थिती', 'pipe4': 'क्षेत्रांतर्गत शोध',
      'pipe5': 'जोखीम तीव्रता वाढ', 'pipe6': 'संसाधन तुटवडा', 'pipe7': 'पर्यवेक्षक प्राधान्य',

      'brief.label': 'पर्यवेक्षक अहवाल',
      'brief.h1': 'संपूर्ण दिवस,',
      'brief.h2': 'एका पानावर.',
      'brief.lede': 'पर्यवेक्षकाला प्रत्येक अहवाल न वाचता परिस्थिती समजली पाहिजे. हे बुद्धिमत्ता सेवेचे निष्पादन आहे — निश्चित, स्पष्ट करता येणारे, आणि ते निर्माण करणाऱ्या नोंदींपर्यंत मागोवा घेता येणारे.',
      'brief.freshness': 'माहितीचा ताजेपणा', 'brief.confidence': 'विश्वासार्हता', 'brief.locations': 'स्थळे', 'brief.confHigh': 'उच्च',
      'doc.status': 'वारी स्थिती',
      'doc.critNow': 'सध्या गंभीर', 'doc.developing': 'उद्भवत आहे', 'doc.emerging': 'उद्भवणारी जोखीम', 'doc.resourceGaps': 'संसाधन तुटवडे', 'doc.whatChanged': 'काय बदलले', 'doc.attention': 'लक्ष आवश्यक',
      'doc.item1': 'जेजुरीत वैद्यकीय क्षमता वेगाने वाढते आहे', 'doc.item2': 'रुग्णवाहिका उपलब्धता अपुरी',
      'doc.item3': 'वाहतूक आणि गर्दीची घनता वाढते आहे', 'doc.item4': 'पालखी २२ मिनिटे उशिराने चालू आहे',
      'doc.item5': 'रुग्णवाहिका', 'doc.item6': 'औषध साठा', 'doc.item7': 'वैद्यकीय क्षमता',
      'doc.item8': 'वैद्यकीय भार वेगाने वाढला', 'doc.item9': 'पावसाचा जोर वाढला', 'doc.item10': 'वाहतूक मध्यम वरून उच्च झाली',
      'doc.item11': 'जेजुरी वैद्यकीय तैनातीचा आढावा घ्या', 'doc.item12': 'पुढील मार्गावरील कोंडीवर लक्ष ठेवा',
      'doc.issued': 'जारी १५:१६ · दिवस ११', 'doc.sim': 'अनुरूपित',

      'cta.t1': 'क्षेत्रीय अद्ययावती', 'cta.t2': 'सामायिक स्थिती बनतात.', 'cta.t3': 'सामायिक स्थिती बनते', 'cta.t4': 'कृतीयोग्य बुद्धिमत्ता.',
      'cta.enter': 'कमांड सेंटरमध्ये प्रवेश करा', 'cta.back': 'वर परत जा',

      'foot.brand.p': 'प्राधिकरणे नोंदवतात → वारी स्थिती बदलते → संबंधित वापरकर्त्यांना बदल दिसतो → बुद्धिमत्ता महत्त्वाचे ओळखते → पर्यवेक्षक कृती करतो.',
      'foot.screens': 'पडदे',
      'foot.screens.1': 'प्रवेश', 'foot.screens.2': 'सामायिक डॅशबोर्ड', 'foot.screens.3': 'थेट कार्यप्रणाली',
      'foot.screens.4': 'अहवाल / अद्ययावत', 'foot.screens.5': 'वैद्यकीय कार्यप्रणाली', 'foot.screens.6': 'पर्यवेक्षक बुद्धिमत्ता', 'foot.screens.7': 'प्रशासक फलक',
      'foot.authorities': 'प्राधिकरणे',
      'foot.built': 'यासह तयार',
      'foot.built.5': 'बुद्धिमत्ता सेवा (Python)',
      'foot.prototype': 'प्रोटोटाइप इंटरफेस · दर्शवलेली सर्व कार्यात्मक माहिती अनुरूपित आहे',

      'login.title': 'प्राधिकरण प्रवेश',
      'login.sub': 'पंढरपूर वारीच्या एका सामायिक कार्यचित्रात प्रवेश करण्यासाठी आपली भूमिका निवडा.',
      'login.back': 'मागे',
      'login.userLabel': 'वापरकर्ता आयडी',
      'login.passLabel': 'पासवर्ड',
      'login.submit': 'प्रवेश करा',
      'login.note': 'आपल्या प्राधिकरण खात्याने प्रवेश करा.',
      'login.signingIn': 'प्रवेश करत आहे…',
      'login.errOffline': 'प्रमाणीकरण सर्व्हरशी संपर्क होत नाही. बॅकएंड (backend/app.py) सुरू करा आणि पुन्हा प्रयत्न करा.',
      'login.errGeneric': 'प्रवेश अयशस्वी. कृपया पुन्हा प्रयत्न करा.',

      'app.nav.logout': 'बाहेर पडा',
      'app.tab.dashboard': 'डॅशबोर्ड', 'app.tab.live-ops': 'थेट कार्यप्रणाली', 'app.tab.records': 'अहवाल', 'app.tab.medical': 'वैद्यकीय', 'app.tab.intel': 'बुद्धिमत्ता',

      'dash.label': 'कमांड डॅशबोर्ड',
      'dash.greeting': 'नमस्कार,',
      'dash.lede': 'वारीचे सध्याचे एक सामायिक, प्रत्यक्ष-वेळ चित्र.',
      'dash.palkhiStatus': 'पालखी स्थिती',
      'dash.domainReadiness': 'क्षेत्र सज्जता',
      'dash.liveActivity': 'थेट हालचाल',
      'dash.routeMap': 'मार्ग नकाशा — थेट मागोवा',
      'dash.mapHint': 'स्थिती पाहण्यासाठी चिन्हावर माउस न्या',
      'dash.currentlyNear': 'सध्या जवळ',
      'dash.schedule': 'वेळापत्रक',
      'dash.minBehind': 'मिनिटे मागे',
      'stat.daysOnFoot': 'पायी चाललेले दिवस',
      'stat.kmSoFar': 'आळंदी → पंढरपूर आतापर्यंत',
      'stat.dindisMotion': 'गतिमान दिंड्या',
      'stat.trackedLoc': 'नोंदवलेली स्थळे',
      'stat.wariStatus': 'वारी स्थिती',

      'liveops.label': 'थेट कार्यप्रणाली',
      'liveops.h1': 'वारी, गतिमान.',
      'liveops.lede': 'मार्गावरील प्रत्येक स्थळाची कार्यात्मक स्थिती.',
      'liveops.mapTitle': 'थेट मागोवा नकाशा',
      'liveops.mapHint': 'स्थिती पाहण्यासाठी चिन्हावर माउस न्या · शिबिरे वैद्यकीय चिन्हाने दाखवली आहेत',
      'liveops.palkhi': 'पालखी सध्या जवळ आहे',
      'liveops.behind': 'वेळापत्रकापेक्षा मागे',
      'liveops.camps': 'शिबिरे',
      'liveops.locations': 'स्थळे',

      'records.label': 'अहवाल',
      'records.h1': 'अद्ययावत नोंदवा.',
      'records.lede': 'तुमचा अहवाल सादर करताच तो सामायिक कार्यस्थिती बनतो.',
      'records.submit': 'अहवाल सादर करा',
      'field.location': 'स्थान', 'field.headcount': 'सध्याची संख्या', 'field.delay': 'विलंब (मिनिटे, असल्यास)',
      'field.memberIssue': 'सदस्य / वाहन समस्या (ऐच्छिक)', 'field.camp': 'शिबिर', 'field.updateType': 'अद्ययावत प्रकार',
      'field.details': 'तपशील', 'field.incidentType': 'घटना प्रकार', 'field.severity': 'तीव्रता', 'field.category': 'प्रकार',
      'opt.campLoad': 'शिबिर भार अद्ययावत', 'opt.medShortage': 'औषध तुटवडा', 'opt.emergency': 'आणीबाणी / संदर्भ', 'opt.ambRequest': 'रुग्णवाहिका विनंती',
      'opt.accident': 'अपघात', 'opt.congestion': 'वाहतूक कोंडी', 'opt.blockage': 'मार्ग अडथळा', 'opt.crowdIssue': 'गर्दी समस्या',
      'opt.low': 'कमी', 'opt.medium': 'मध्यम', 'opt.high': 'उच्च', 'opt.critical': 'गंभीर',
      'opt.water': 'पाणी', 'opt.shelter': 'निवारा', 'opt.electricity': 'वीज', 'opt.infra': 'पायाभूत सुविधा',
      'opt.toilet': 'शौचालय विभाग', 'opt.cleanliness': 'स्वच्छता', 'opt.facility': 'सुविधा स्थिती',

      'medical.label': 'वैद्यकीय कमांड',
      'medical.h1': 'शिबिरे व रुग्ण.',
      'medical.lede': 'शिबिराची संपूर्ण स्थिती पाहण्यासाठी टॅप करा — भार, खाटा, रुग्णवाहिका आणि औषध साठा एकत्र.',
      'medical.campStatus': 'शिबिर स्थिती',
      'medical.patientRecords': 'रुग्ण नोंदी',
      'medical.restricted': 'फक्त वैद्यकीय प्राधिकरण व वारी पर्यवेक्षक यांच्यासाठी मर्यादित',
      'medical.searchPlaceholder': 'नाव, आयडी, शिबिर किंवा स्थितीनुसार शोधा…',
      'metric.campLoad': 'शिबिर भार', 'metric.campLoadSub': 'खाट क्षमतेच्या तुलनेत शिबिर किती भरले आहे',
      'metric.patientsTreated': 'उपचार घेत असलेले रुग्ण', 'metric.patientsSub': 'एकूण खाटांपैकी सध्याचे रुग्ण',
      'metric.icuFree': 'रिकाम्या आयसीयू खाटा', 'metric.icuSub': 'सध्या उपलब्ध अतिदक्षता खाटा',
      'metric.ambReady': 'सज्ज रुग्णवाहिका', 'metric.ambSub': 'तात्काळ पाठवण्यासाठी उपलब्ध वाहने',
      'medical.medStock': 'औषध साठा',
      'patient.noMatch': 'कोणत्याही रुग्ण नोंदी जुळत नाहीत',
      'medical.yrs': 'वर्षे',

      'medical.registerPatient': 'रुग्ण नोंदणी',
      'medical.registerHint': 'नावाने नोंदणी केल्यास आधीच्या भेटी आपोआप तपासल्या जातात.',
      'field.patientName': 'रुग्णाचे नाव', 'field.age': 'वय', 'field.condition': 'आजार / तक्रार',
      'field.status': 'स्थिती', 'field.notes': 'टिपा (ऐच्छिक)',
      'medical.registerSubmit': 'रुग्ण नोंदवा',
      'medical.registerSuccess': 'रुग्ण नोंदवला.',
      'medical.registerFailed': 'रुग्ण नोंदवता आला नाही — तपशील तपासून पुन्हा प्रयत्न करा.',
      'medical.registerOffline': 'रुग्ण नोंदणी बॅकएंड बंद आहे — नोंद जतन झाली नाही.',
      'pstatus.admitted': 'दाखल', 'pstatus.discharged': 'उपचार करून सोडले', 'pstatus.referred': 'संदर्भित',
      'medical.priorHistoryTitle': 'आधीचा उपचार इतिहास आढळला',
      'medical.priorHistoryNote': 'या नावाच्या रुग्णावर याआधी उपचार झाले आहेत — पुढे जाण्यापूर्वी पहा:',
      'medical.patientHistoryTitle': 'रुग्ण इतिहास',
      'medical.patientHistoryNote': 'या रुग्णाच्या सर्व नोंदवलेल्या भेटी, अलीकडील आधी:',
      'medical.priorHistoryAck': 'समजले, पुढे जा',

      'intel.label': 'पर्यवेक्षक बुद्धिमत्ता',
      'intel.h1': 'संपूर्ण दिवस, एका पानावर.',
      'intel.lede': 'वारी मॉडेल सेवेकडून थेट, निश्चित जोखीम गुणांकन — प्रत्येक स्थळासाठी एक विनंती, एका पर्यवेक्षक चित्रात एकत्रित.',

      'status.ok': 'पुरेसे', 'status.warn': 'कमी झालेले', 'status.crit': 'गंभीर',
      'fstat.reported': 'नोंदवले', 'fstat.ack': 'मान्य केले', 'fstat.progress': 'प्रगतीपथावर', 'fstat.resolved': 'निकाली',
      'med.ors': 'ओआरएस', 'med.antipyretics': 'ज्वरनाशक (ताप)', 'med.analgesics': 'वेदनाशामक', 'med.ivFluids': 'आयव्ही द्रव', 'med.antiseptics': 'जंतुनाशक',
      'toast.reportSubmitted': 'अहवाल सादर झाला — आता सामायिक थेट फीडवर दिसत आहे.',

      'domain.palkhi': 'पालखी', 'domain.dindi': 'दिंडी', 'domain.medical': 'वैद्यकीय', 'domain.traffic': 'वाहतूक',
      'domain.municipal': 'नगरपालिका', 'domain.sanitation': 'स्वच्छता', 'domain.weather': 'हवामान',
      'domain.halt': 'थांबा', 'domain.incidents': 'घटना',
      'intel.live': 'थेट प्रतिमान', 'intel.loading': 'थेट बुद्धिमत्ता लोड होत आहे…',
      'intel.offline': 'पर्यवेक्षक बुद्धिमत्ता बॅकएंड बंद आहे. थेट विश्लेषण पाहण्यासाठी मॉडेल सेवा व Flask बॅकएंड सुरू करा.',
      'intel.refresh': 'विश्लेषण पुन्हा ताजे करा', 'intel.refreshing': 'ताजे करत आहे…',
      'intel.keyFactors': 'मुख्य घटक', 'intel.locationsAtRisk': 'जोखीम असलेली स्थळे',
      'intel.modelVersion': 'प्रतिमान', 'intel.asOf': 'नुसार',
      'intel.avgRisk': 'सरासरी जोखीम', 'intel.worstLocation': 'सर्वाधिक जोखीम',
      'intel.noGaps': 'कोणतीही संसाधन तूट नोंदवलेली नाही.', 'intel.noEmerging': 'कोणतीही उद्भवणारी जोखीम आढळली नाही.',
      'intel.noActions': 'सध्या कोणतीही प्राधान्य कृती नाही.', 'intel.allCalm': 'सर्व स्थळे शांत — कोणतेही लक्षणीय घटक नाहीत.',
      'freshness.fresh': 'ताजे', 'freshness.aging': 'जुने होत आहे', 'freshness.stale': 'शिळे',
      'confidence.high': 'उच्च', 'confidence.medium': 'मध्यम', 'confidence.low': 'कमी',
      'situation.stable': 'स्थिर', 'situation.stable_high_pressure': 'स्थिर — उच्च दाब',
      'situation.rapidly_worsening': 'वेगाने बिघडत आहे', 'situation.improving': 'सुधारत आहे',
      'situation.newly_critical': 'नव्याने गंभीर', 'situation.resolved': 'निकाली',

      /* ── v2 command-centre UI ── */
      'ui.moreDetails': 'अधिक तपशील', 'ui.close': 'बंद करा', 'ui.filter': 'गाळणी',
      'ui.clearFilters': 'गाळण्या रद्द करा', 'ui.expand': 'उघडा', 'ui.collapse': 'बंद करा',
      'time.now': 'आत्ताच', 'time.min': 'मिनिटांपूर्वी', 'time.hr': 'तासांपूर्वी',

      'dial.label': 'मार्ग सज्जता', 'dial.center': 'सज्जता',
      'dial.clear': 'सुरळीत', 'dial.flagged': 'निदर्शित',
      'dial.outer': 'पूर्ण झालेला मार्ग', 'dial.inner': 'विभागनिहाय तपासण्या',
      'dial.more': 'लाइव्ह ऑपरेशन्स उघडा',

      'dcard.checks': 'तपासण्या सुरळीत', 'dcard.authorities': 'फलकावरील प्राधिकरणे',
      'dcard.online': 'सक्रिय', 'dcard.ctaText': 'प्रत्येक प्राधिकरण एकाच सामायिक फलकावर नोंद करते.',
      'dcard.ctaBtn': 'नोंद करा',

      'liveops.coverage': 'मार्ग व्याप्ती', 'liveops.showing': 'दाखवत आहे',
      'liveops.noMatch': 'या गाळण्यांशी जुळणारे कोणतेही स्थळ नाही.',
      'liveops.sortRisk': 'जोखमीनुसार', 'liveops.sortRoute': 'मार्गक्रमानुसार',

      'drawer.eyebrow': 'स्थळ तपशील', 'drawer.domains': 'विभागनिहाय स्थिती',
      'drawer.camps': 'येथील वैद्यकीय शिबिरे', 'drawer.noCamps': 'या स्थळी वैद्यकीय शिबिर नाही.',
      'drawer.palkhiHere': 'पालखी सध्या येथेच आहे', 'drawer.position': 'मार्गातील स्थान',
      'drawer.critSentence': '{domain} ला येथे तातडीने लक्ष देण्याची गरज आहे — परिस्थिती गंभीर आहे.',
      'drawer.warnSentence': '{domain} ची क्षमता येथे कमी झाली आहे आणि त्यावर लक्ष ठेवायला हवे.',
      'drawer.allClearSentence': 'सर्व सेवा — पोलीस, वैद्यकीय, नगरपालिका आणि स्वच्छता — येथे सुरळीत सुरू आहेत.',

      'palkhi.dnyaneshwar': 'संत ज्ञानेश्वर पालखी', 'palkhi.tukaram': 'संत तुकाराम पालखी',

      'medical.capacity': 'एकूण क्षमता', 'medical.occupancy': 'वापर',
      'medical.bedsUsed': 'वापरातील खाटा', 'medical.stockLevel': 'साठा पातळी',
      'medical.allCamps': 'सर्व शिबिरे', 'medical.campsOnline': 'शिबिरे नोंदवत आहेत',

      'patient.all': 'सर्व', 'patient.showing': 'दाखवत आहे',

      'intel.distribution': 'जोखीम वितरण', 'intel.detail': 'तपशील', 'intel.domains': 'विभाग',

      'map.zoomHint': 'झूमसाठी नकाशावर क्लिक करा',

      'intel.aiBadge': 'AI विश्लेषण',
      'intel.aiNote': 'हे विश्लेषण वारी प्रतिमानाने थेट कार्यचित्रातून तयार केले आहे, हाताने लिहिलेले नाही. प्रत्येक नोंदीनंतर पुन्हा तयार होते.',
      'intel.generating': 'विश्लेषण तयार होत आहे',
      'intel.showAll': 'सर्व स्थळे दाखवा', 'intel.showLess': 'फक्त जोखमीची दाखवा',
      'intel.noBand': 'या पातळीत कोणतेही स्थळ नाही.',
      'intel.atRisk': 'जोखमीत'
    }
  };

  function curLang() {
    try { return localStorage.getItem('wci_lang') || 'mr'; } catch (e) { return 'mr'; }
  }

  function t(key, lang) {
    lang = lang || curLang();
    var d = DICT[lang] || DICT.mr;
    if (key in d) return d[key];
    if (DICT.en && key in DICT.en) return DICT.en[key];
    return key;
  }

  function applyLang(lang) {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var key = node.getAttribute('data-i18n');
      var val = t(key, lang);
      if (val) node.textContent = val;
    }
    var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    for (var p = 0; p < placeholders.length; p++) {
      var pnode = placeholders[p];
      var pkey = pnode.getAttribute('data-i18n-placeholder');
      var pval = t(pkey, lang);
      if (pval) pnode.setAttribute('placeholder', pval);
    }
    var btns = document.querySelectorAll('[data-lang-btn]');
    for (var j = 0; j < btns.length; j++) {
      btns[j].classList.toggle('is-on', btns[j].getAttribute('data-lang-btn') === lang);
    }
    document.documentElement.setAttribute('lang', lang === 'mr' ? 'mr' : 'en');
    document.body.setAttribute('data-lang', lang);
    try { localStorage.setItem('wci_lang', lang); } catch (e) {}
  }

  function initLangToggle() {
    var lang = curLang();
    applyLang(lang);
    var btns = document.querySelectorAll('[data-lang-btn]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function (e) {
        var next = e.currentTarget.getAttribute('data-lang-btn');
        if (next === curLang()) return;
        try { localStorage.setItem('wci_lang', next); } catch (err) {}
        location.reload();
      });
    }
  }

  window.WCI = { t: t, applyLang: applyLang, initLangToggle: initLangToggle, curLang: curLang, DICT: DICT };
})();
