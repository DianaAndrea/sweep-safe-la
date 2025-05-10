## **SweepSafe \- App Flow, Pages & User Roles**

### **Core Pages**

#### **1\. Main Map View**

* Shows current or last parked location

* Countdown timer until next sweep

* Overlay card with street info and sweep details

#### **2\. History**

* List of past parking events (location \+ time)

* Optional detail view with map snapshot

#### **3\. Settings**

* Toggle auto-park detection

* Customize alert timing

* Sign out option

* Disclaimer and feedback form

#### **4\. Authentication**

* Sign in with Google, Facebook, or X.com

* Lightweight onboarding for first-time users

### **User Roles**

#### **1\. Authenticated User (default)**

* Can receive alerts and track parking history

* Customize settings

* Data optionally synced to cloud

#### **2\. Anonymous (Pre-login)**

* Limited access: one-time use or preview of features

* Prompted to sign in to access full history \+ alerts

### **App Flow**

1. **Launch App**

   * Check for authentication

   * If not signed in, prompt login or allow limited preview

2. **Auto Park Detection**

   * App detects stop and saves parked location

   * Checks street cleaning schedule

   * Displays countdown and map info

3. **Alerts**

   * Scheduled notifications based on location data

   * Sent \~1 hour and \~15 minutes before street sweeping

4. **History and Settings Access**

   * Users can view recent parks and tweak alert settings

   * Feedback form available in settings

