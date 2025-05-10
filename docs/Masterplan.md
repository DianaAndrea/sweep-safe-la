## **SweepSafe \- Masterplan**

### **App Overview and Objectives**

SweepSafe is a native iOS application designed to help drivers in Los Angeles avoid costly street cleaning tickets. By leveraging GPS, motion detection, and public street sweeping schedules, the app delivers proactive alerts to users before they are at risk of getting ticketed. SweepSafe requires minimal input, offers a modern map-focused interface, and creates a smooth, trust-worthy experience for everyday drivers.

### **Target Audience**

* Los Angeles residents who rely on street parking

* Visitors to LA unfamiliar with rotating parking rules

* Commuters and neighborhood drivers tired of street sweeping tickets

### **Core Features and Functionality**

* **Auto Park Detection** using GPS and CoreMotion

* **Map View** showing current or parked location and next street cleaning time

* **Smart Alerts** with customizable push notifications before sweep times

* **Parking History Log** for recent parking activity

* **Settings** to adjust alert behavior and toggle detection features

* **Sign-In Options** via Google, Facebook, and X.com

### **High-Level Technical Stack Recommendations**

* **Platform:** Native iOS (Swift/SwiftUI)

* **Location Services:** CoreLocation, CoreMotion

* **Map Display:** MapKit

* **Notifications:** Local Notifications API

* **Street Data Source:** LA GeoJSON from Los Angeles Open Data

* **Authentication:** Firebase Auth or similar supporting social logins

* **Backend (optional):** Firebase/Firestore for storing user settings and parking history

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

* Minimal, modern, and intuitive

* Map-first experience with clearly labeled info

* Emphasis on visual countdowns and alert clarity

* Settings tucked away but accessible

* Dark mode support and high contrast for sunlight visibility

### **Security Considerations**

* OAuth sign-in via Google, Facebook, and X

* Secure local storage of location data

* Opt-in data logging

* Transparent privacy policy and disclaimer

### **Development Phases or Milestones**

1. **MVP Phase**

   * Auto-park detection

   * Sweep time matching

   * Basic alerts and settings

   * Sign-in with Google only

2. **V1 Launch**

   * Full social auth (Google, X.com, Facebook)

   * Historical log view

   * Alert customization

3. **V2 Enhancements**

   * User feedback integration

   * Weekly parking digest

   * Widgets and Siri shortcuts

### **Potential Challenges and Solutions**

* **Accurate park detection:** Tune GPS \+ motion data thresholds

* **Sweep schedule variance:** Regular sync with LA Open Data

* **Battery optimization:** Efficient polling intervals for motion/location

* **User trust:** Clear onboarding, privacy controls

### **Future Expansion Possibilities**

* Expansion to other cities (SF, NYC, Chicago)

* Android version

* Community-sourced street alerts

* Integration with parking ticket payment portals

