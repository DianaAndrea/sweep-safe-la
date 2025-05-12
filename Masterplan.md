## **SweepSafe \- Masterplan (Web Version)**

### **App Overview and Objectives**

SweepSafe is a **mobile-first web application** designed to help drivers in Los Angeles avoid costly street cleaning tickets. By leveraging browser-based GPS, motion heuristics, and public street sweeping schedules, the app delivers proactive alerts to users before they are at risk of getting ticketed. SweepSafe requires minimal input, offers a modern map-focused interface, and creates a smooth, trustworthy experience for everyday drivers.

### **Target Audience**

* Los Angeles residents who rely on street parking

* Visitors to LA unfamiliar with rotating parking rules

* Commuters and neighborhood drivers tired of street sweeping tickets

  ### **Core Features and Functionality**

* **Auto Park Detection** using Geolocation API and stop-time logic

* **Map View** showing current or parked location and next street cleaning time

* **Smart Alerts** with customizable web push or SMS notifications

* **Parking History Log** for recent parking activity

* **Settings** to adjust alert behavior and toggle detection features

* **Sign-In Options** via Google, Facebook, and X.com

  ### **High-Level Technical Stack Recommendations**

* **Platform:** Mobile-first Web App (React or Next.js, Tailwind CSS)

* **Location Services:** Geolocation API (HTML5)

* **Map Display:** Mapbox or Leaflet.js

* **Notifications:** Web Push API, OneSignal (optionally SMS via Twilio)

* **Street Data Source:** LA Open Data (GeoJSON)

* **Authentication:** Firebase Auth or Auth0

* **Backend:** Firebase Firestore or Supabase for settings and parking logs

  ### **Conceptual Data Model**

* **User**

  * ID

  * Email/Provider

  * Preferences (alert timing, auto-park toggle)

* **ParkingEvent**

  * Timestamp

  * Latitude & Longitude

  * Detected method (auto/manual)

  * Matched sweep time

  ### **User Interface Design Principles**

* Responsive, mobile-first interface

* Map-first experience with clearly labeled info

* Emphasis on visual countdowns and alert clarity

* Minimalist UI with collapsible panels

* Dark mode and accessibility-first approach

  ### **Security Considerations**

* OAuth sign-in via trusted providers

* Secure HTTPS connections

* Local or opt-in cloud storage of location data

* Clear privacy policy and consent-based alerts

  ### **Development Phases or Milestones**

1. **MVP Phase**

   * Auto-park detection (via time \+ location)

   * Sweep time matching using LA GeoJSON

   * Web push alerts

   * Sign-in with Google

2. **V1 Launch**

   * Add Facebook and X.com auth

   * Historical log view (cloud synced)

   * Fully customizable alerts

3. **V2 Enhancements**

   * SMS alerts and PWA support

   * Weekly digest notifications

   * Offline map fallback

   ### **Potential Challenges and Solutions**

* **Browser GPS accuracy:** Use timing thresholds and map pin verification

* **Sweep schedule variance:** Pull and cache latest GeoJSON weekly

* **Push notification opt-ins:** Offer fallback SMS and clear benefit messaging

* **User trust:** Simple onboarding, transparent controls

  ### **Future Expansion Possibilities**

* Add coverage for SF, NYC, Chicago

* Native wrapper for iOS/Android stores

* Integrate with parking ticket payment APIs

* Community street alert submissions

