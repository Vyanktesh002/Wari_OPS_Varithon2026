# Wari Command Intelligence — Product Requirements Document

## 1. Product Vision

**Wari Command Intelligence** is a mobile-first, browser-based operational coordination platform for the Pandharpur Wari.

It connects the major authorities operating the Wari into one shared real-time operational picture. Each authority has its own authenticated role, permissions, and reporting forms, while authorized authorities can see relevant live Wari information.

This is not a generic event-management system. It is designed around the Wari's specific operating structure: a large moving population, multiple Dindis, Palkhi schedule deviation, temporary medical/infrastructure resources, traffic, incidents, changing halt conditions, and several independently operating authorities. The source describes Wari as a 21-day, 250-km moving operation with multiple authorities and fragmented coordination. fileciteturn1file3L242-L289

Core question:

> **What is happening across the Wari right now, what has changed, what is becoming critical, and what requires attention?**

## 2. Core MSPs

### MSP 1 — Shared Authority Command Center

A common dashboard available after login, with role-based actions and visibility.

Core capabilities:
- Live Wari operational map
- Palkhi position, schedule and ETA/delay
- Dindi/crowd status
- Active incidents and emergency alerts
- Medical and infrastructure readiness
- Live authority update feed
- Key Wari statistics
- Location-based operational status

The common board is the connection layer between otherwise separate authorities. The source identifies lack of a shared operational picture as the central problem. fileciteturn1file3L270-L289

### MSP 2 — Authority Reporting & Live Updates

Each field authority gets a short, role-specific form. A submitted report enters the shared operational state and live feed.

Examples:
- **Dindi:** location, headcount, delay, member/vehicle issue
- **Medical:** camp load, medicine shortage, emergency/referral, ambulance need
- **Police:** accident, congestion, route blockage, crowd issue
- **Municipal:** water, shelter, electricity, infrastructure
- **Sanitation:** toilet, cleanliness and facility status

Event lifecycle:
**Reported → Acknowledged → In Progress → Resolved**

The system is structured around authority updates rather than unstructured chat. The source explicitly proposes role-specific forms and shared real-time updates. fileciteturn1file6L428-L459

### MSP 3 — Wari Live Operations Tracking

Track the Wari ecosystem, not only the Palkhi route.

Track:
- Palkhi schedule vs actual movement and ETA
- Dindi/crowd concentration
- Traffic/congestion and road incidents
- Halt readiness
- Medical camp capacity
- Ambulance availability
- Medicine/resource availability
- Temporary shelter capacity
- Food/water status where data exists
- Sanitation
- Weather/route conditions
- Active incidents

The goal is a live operational representation of the moving Wari. The original design explicitly includes live Palkhi positions, halt status, activity feed and multiple operational overlays. fileciteturn1file7L525-L535

### MSP 4 — Supervisor Operational Intelligence

Available only to the Wari Supervisor/Senior Coordinator.

The separate intelligence service consumes current state plus recent history and returns:
- Overall risk score
- Situation summary
- What changed
- Rapidly worsening conditions
- Resource gaps
- Emerging risks
- Top priority actions
- Data freshness/confidence
- End-of-day summary

The model is deterministic and explainable for the prototype. It is a decision-support layer, not an autonomous controller. Its current API already supports risk, trend, correlation, resource gaps, priorities, freshness and summary fields.

## 3. Authentication and Roles

### 1. Dindi Coordinator
- View shared dashboard
- View Wari tracking
- View relevant feed/alerts
- Submit Dindi updates

### 2. Doctor Dindi / Medical Authority
- View shared dashboard
- Monitor medical operations
- Submit medical updates
- Manage patient records
- Track medical capacity, ambulances and medicines

### 3. Police Authority
- View shared dashboard
- Submit incidents and traffic updates
- Track route/crowd problems
- Update incident status

### 4. Municipal / Infrastructure Authority
- View shared dashboard
- Submit water, shelter, electricity and infrastructure updates

### 5. Sanitation / Nirmal Wari Authority
- View shared dashboard
- Submit sanitation/facility updates

### 6. Wari Supervisor / Senior Coordinator
- Read all relevant operational data
- View cross-authority intelligence
- View risk, resource gaps and emerging risks
- Review escalated incidents
- View end-of-day summaries
- Monitor unresolved issues
- No normal field-report submission

### 7. System Administrator
Separate admin login for:
- User creation/disable/reset
- Role and authority assignment
- Location/camp/Dindi configuration
- Access control
- Audit information

The administrator is a system-management role, not a field authority.

## 4. Main Browser Screens

1. **Login** — role-based authentication.
2. **Common Dashboard** — statistics, live map, Palkhi status, incidents, alerts, live feed and domain status.
3. **Live Operations** — detailed operational map and filters.
4. **Report / Update** — role-specific field form.
5. **Medical Operations** — camp capacity, patient records, ambulances, ICU/resources and medicines.
6. **Supervisor Intelligence** — risk, situation summary, changes, resource gaps, emerging risks, priorities, timeline and end-of-day summary.
7. **Admin Panel** — users, roles, mappings, configuration and audit.

## 5. Shared Live Feed

Every update contains:
- timestamp
- location
- authority
- category
- severity
- status
- concise description

Filters:
**All | Police | Medical | Dindi | Municipal | Sanitation | Critical | Resolved**

The feed must show meaningful changes and active incidents rather than becoming another general chat stream.

## 6. Real-Time Flow

**Authority submits update**
→ backend validates/stores it
→ operational state updates
→ live feed updates
→ affected location recalculates
→ supervisor intelligence may recalculate
→ connected browsers receive updated state

No manual page refresh should be required for live events.

## 7. Supervisor Intelligence

Input to the separate model service:
- location ID
- current state
- recent 3–5 history ticks

Processing:
**State → readiness → risk → trend → cross-domain correlation → resource gaps → suppression → priority → summary**

The engine must distinguish:
- stable high pressure
- rapidly worsening pressure
- improving conditions
- newly critical conditions
- resolved conditions

It should suppress identical repeated alerts when nothing meaningful changed.

The model architecture is consistent with the source's trend, correlation, suppression and predictive/intelligence design. fileciteturn2file0L84-L114

## 8. Medical Command

Keep medical functionality Wari-specific, not generic hospital software.

Core capabilities:
- Medical camp capacity
- Patient load
- Ambulance availability
- ICU/resource availability
- Medicine stock
- Emergency/referral tracking
- Patient treatment records
- Cross-camp patient continuity
- Medical resource alerts

The source specifically identifies the problem of patients being treated at one camp and later appearing at another without prior context. fileciteturn1file3L283-L287

## 9. Wari Tracking and Data Sources

The platform represents the Wari as a moving operational environment.

Possible live/external data:
- Mapping/location services
- Weather APIs
- Traffic APIs where practical

Event-specific inputs such as medical capacity, ambulance state, Dindi reports, incidents, food/shelter status and municipal readiness may initially use synthetic data for the prototype.

Synthetic data must be clearly treated as simulation data, not claimed as live government data.

## 10. Daily Supervisor Summary

The supervisor should understand the current situation without reading every report.

Example structure:

**WARI STATUS — HIGH**

**Critical Now**
- Jejuri medical capacity rising rapidly
- Ambulance availability insufficient

**Developing**
- Traffic and crowd concentration increasing
- Palkhi running 22 minutes late

**Resource Gaps**
- Ambulances
- Medicine stock
- Medical capacity

**What Changed**
- Medical load increased rapidly
- Rainfall increased
- Traffic changed from medium to high

**Attention**
- Review Jejuri medical deployment
- Monitor downstream congestion

## 11. Mobile-First Browser Requirement

This is a **mobile-first browser application**, not a desktop-first application.

Primary target:
- Android/iOS phone browser
- Responsive touch UI
- Low typing burden
- Fast loading
- Simple navigation

Desktop screens should remain usable, but the main interface must be designed for field users on phones.

No React.

## 12. Technology Stack

### Frontend
- HTML
- CSS
- JavaScript
- Tailwind CSS where useful
- Leaflet/OpenStreetMap or equivalent mapping library

### Backend
- Python
- Flask
- REST API
- Flask-SocketIO or another lightweight real-time mechanism if practical

Do not use Django.

### Database
- MySQL

Core tables may include:
`users`, `authorities`, `roles`, `locations`, `dindis`, `halt_points`, `status_updates`, `incidents`, `resources`, `medical_camps`, `patient_records`, `palkhi_positions`, `alerts`, `intelligence_results`, `audit_logs`

### Intelligence Service
- Python
- FastAPI or standalone Python service
- Existing Wari Operational Intelligence API

The source architecture also separates the intelligence service from the application data layer. fileciteturn1file4L303-L328

## 13. Excluded From This Version

- Marathi NLP / voice input
- React
- Django
- Generic hospital-management platform
- Public social/community features
- Generic event-management features
- Autonomous emergency dispatch
- Unverified claims of government integration
- A trained ML model requiring unavailable historical data

The original source includes Marathi voice processing, but this product version intentionally excludes it. fileciteturn1file1L117-L126

## 14. Hackathon Demo Scenario

Start with normal Wari conditions.

Then simulate:
1. Rain increases
2. Palkhi begins falling behind schedule
3. Dindi concentration rises
4. Traffic worsens
5. Medical load increases
6. Ambulance availability falls

The visible chain should be:

**Authority updates → live feed → live operational state → cross-domain detection → risk escalation → resource gaps → supervisor priority → action/attention**

The key demonstration is that the supervisor does not have to manually discover the emerging situation.

## 15. Product Differentiation

**CONNECT** — connect independent Wari authorities.

**OBSERVE** — track operational state beyond Palkhi GPS.

**DETECT** — identify meaningful changes, shortages and cross-domain situations.

**PREDICT** — estimate emerging risk using current state and recent trends.

**PRIORITIZE** — tell the supervisor what deserves attention first.

Core value proposition:

> **Field updates become shared operational state, and shared operational state becomes actionable intelligence.**

## 16. Definition of Done

The project is complete when:

1. All seven roles can authenticate.
2. Role permissions are enforced.
3. Field authorities can submit permitted updates.
4. Updates appear in the common live feed.
5. Dashboard state updates without manual refresh.
6. Live operations tracks Wari operational conditions, not only route geography.
7. Medical module supports camps, resources and patient records.
8. Supervisor can view intelligence output.
9. Backend successfully calls the model service and validates its response.
10. A simulated emergency propagates through the system in real time.
11. The complete demo works on a mobile-sized browser viewport.

## 17. Guiding Principle

Do not build disconnected dashboards.

Build one connected operational system:

**Authorities report → Wari state changes → relevant users see the change → intelligence identifies what matters → supervisor acts.**
