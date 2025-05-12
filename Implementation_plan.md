## **SweepSafe \- Implementation Plan (Web Version)**

### **Phase 1: MVP**

**Goal:** A working mobile-first web app that detects parked location, matches sweep schedule, and sends alerts.

#### **Tasks**

* Set up project with React (or Next.js) and Tailwind CSS

* Integrate Geolocation API for parking detection

* Implement basic stop-time heuristic (e.g., location unchanged for 2+ minutes)

* Display parked location using Mapbox or Leaflet.js

* Fetch and parse LA street cleaning GeoJSON

* Match user's parked location against sweep schedule

* Schedule alerts using Web Push API or OneSignal

* Build alert settings screen (alert timing toggle, auto-park on/off)

* Implement Google sign-in with Firebase or Auth0

* Save last 5 parking events locally with localStorage or IndexedDB

  ### **Phase 2: V1 Launch**

**Goal:** Add full auth options, parking history sync, and more controls.

#### **Tasks**

* Add Facebook and X.com sign-in options

* Sync parking history to cloud using Firebase Firestore or Supabase

* Build Parking History screen with filter/sort options

* Add manual parking entry (backup to auto-detect)

* Customize alert intervals (e.g., 15 min, 1 hour)

* Add disclaimer \+ feedback form in settings page

  ### **Phase 3: V2 Enhancements**

**Goal:** Personalize and expand reach.

#### **Tasks**

* Enable optional SMS alerts via Twilio

* Generate weekly parking digest (push/email)

* Add PWA support: offline mode \+ home screen install

* Add notification snooze and repeat settings

* Optimize geolocation and polling intervals to reduce battery usage

  ### **Optional/Bonus Tasks**

* Detect fake/spoofed GPS coordinates

* Add link to LA parking ticket dispute/payment portals

* Integrate dark mode toggle and accessibility improvements

* Community-sourced sweep alerts feature

  ### **Team Setup Recommendations**

* **1 Full-Stack Web Developer** for React \+ Firebase/Supabase

* **1 Product Designer** for UI/UX mobile-first flows

* **QA Tester or small beta group** for testing and feedback

  ### **Timeline Summary**

* **Weeks 1–3:** Build and test MVP features

* **Weeks 4–6:** Add V1 enhancements and polish

* **Week 7+:** Launch, collect feedback, and iterate

* 
