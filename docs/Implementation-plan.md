## **SweepSafe \- Implementation Plan**

### **Phase 1: MVP**

**Goal:** A working iOS app that detects parked location, matches sweep schedule, and sends alerts.

#### **Tasks**

* Set up iOS project with Swift and SwiftUI

* Integrate CoreLocation and CoreMotion for parking detection

* Display current or last parked location using MapKit

* Fetch and parse LA Open Data street cleaning GeoJSON

* Build alert scheduler with local notifications

* Add settings screen for basic alert preferences

* Google Sign-In via Firebase Auth

* Local storage of last 5 parking events

### **Phase 2: V1 Launch**

**Goal:** Add polish, full auth, and history tracking.

#### **Tasks**

* Add Facebook and X.com auth options

* Sync parking history to cloud (Firebase/Firestore)

* Build Parking History screen

* Allow user to edit alert timing (15 min, 1 hr, etc.)

* Add disclaimer \+ feedback form in settings

### **Phase 3: V2 Enhancements**

**Goal:** Boost retention and personalization.

#### **Tasks**

* Weekly parking digest summary via push

* Widgets and Siri shortcut support

* User feedback-driven UI/UX tweaks

* Battery optimization improvements

### **Optional/Bonus Tasks**

* Location spoof detection for anti-fraud

* Link to LA ticket dispute/payment site

* Night mode and accessibility pass

### **Team Setup Recommendations**

* **1 iOS Developer** to own app logic and UI

* **1 Backend/Infra Developer** (optional, Firebase admin, data sync)

* **1 Product Designer** for UI/UX polish

* **QA Tester or Beta Program** for V1

### **Timeline Summary**

* **Weeks 1–3:** Build MVP core features

* **Weeks 4–6:** Add V1 features and polish

* **Week 7+:** Launch and iterate based on feedback

