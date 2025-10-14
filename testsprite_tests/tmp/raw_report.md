
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** operasyon-solarveyo
- **Date:** 2025-10-14
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** Role-Based Authentication Success
- **Test Code:** [TC001_Role_Based_Authentication_Success.py](./TC001_Role_Based_Authentication_Success.py)
- **Test Error:** Login and 2FA verification test completed only for SuperAdmin role due to lack of valid credentials for other roles (Manager, Engineer, Technician, Customer, Guard). SuperAdmin login was successful with 2FA enabled. Other roles could not be tested due to invalid credentials. Please provide valid credentials for all roles to complete full testing.
Browser Console Logs:
[WARNING] Google Maps JavaScript API has been loaded directly without loading=async. This can result in suboptimal performance. For best-practice loading patterns please see https://goo.gle/js-api-loading (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1423:287)
[WARNING] [2025-10-14T09:07:45.146Z]  @firebase/firestore: Firestore (12.2.0): enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead. (at http://localhost:5173/node_modules/.vite/deps/chunk-CRJH3K3M.js?v=8213522c:1205:19)
[WARNING] 🔒 Güvenlik: Sistem güvenli hale getirildi (at http://localhost:5173/src/utils/quickFix.ts:98:10)
[ERROR] ❌ Web: Bildirim izni reddedildi (at http://localhost:5173/src/services/pushNotificationService.ts:144:16)
[ERROR] ❌ Push notification sistemi başlatılamadı (at http://localhost:5173/src/services/pushNotificationService.ts:240:16)
[WARNING] As of February 21st, 2024, google.maps.Marker is deprecated. Please use google.maps.marker.AdvancedMarkerElement instead. At this time, google.maps.Marker is not scheduled to be discontinued, but google.maps.marker.AdvancedMarkerElement is recommended over google.maps.Marker. While google.maps.Marker will continue to receive bug fixes for any major regressions, existing bugs in google.maps.Marker will not be addressed. At least 12 months notice will be given before support is discontinued. Please see https://developers.google.com/maps/deprecations for additional details and https://developers.google.com/maps/documentation/javascript/advanced-markers/migration for the migration guide. (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1324:150)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyAZdHmOkHazCMnRZuZ6STP17wjG4QMHaxk:0:0)
[ERROR] Giriş hatası: FirebaseError: Firebase: Error (auth/invalid-credential).
    at createErrorInternal (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:697:37)
    at _fail (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:659:9)
    at _performFetchWithErrorHandling (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:1137:9)
    at async _performSignInRequest (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:1148:26)
    at async _signInWithCredential (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:4630:20)
    at async login (http://localhost:5173/src/contexts/AuthContext.tsx:138:30)
    at async onSubmit (http://localhost:5173/src/pages/auth/Login.tsx:100:9)
    at async http://localhost:5173/node_modules/.vite/deps/chunk-GTJUZCIC.js?v=8213522c:1506:9 (at http://localhost:5173/src/contexts/AuthContext.tsx:257:14)
[ERROR] Login error: FirebaseError: Firebase: Error (auth/invalid-credential).
    at createErrorInternal (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:697:37)
    at _fail (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:659:9)
    at _performFetchWithErrorHandling (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:1137:9)
    at async _performSignInRequest (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:1148:26)
    at async _signInWithCredential (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:4630:20)
    at async login (http://localhost:5173/src/contexts/AuthContext.tsx:138:30)
    at async onSubmit (http://localhost:5173/src/pages/auth/Login.tsx:100:9)
    at async http://localhost:5173/node_modules/.vite/deps/chunk-GTJUZCIC.js?v=8213522c:1506:9 (at http://localhost:5173/src/pages/auth/Login.tsx:117:16)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/a93b0e35-fe2e-4efe-8f69-fc3d8508640e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** Role-Based Access Control Enforcement
- **Test Code:** [TC002_Role_Based_Access_Control_Enforcement.py](./TC002_Role_Based_Access_Control_Enforcement.py)
- **Test Error:** The login attempt for the next user role failed due to invalid credentials. Please provide valid credentials for the next user role to continue testing role-based access and tenant isolation, or specify another user role to test.
Browser Console Logs:
[WARNING] Google Maps JavaScript API has been loaded directly without loading=async. This can result in suboptimal performance. For best-practice loading patterns please see https://goo.gle/js-api-loading (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1423:287)
[WARNING] [2025-10-14T09:07:50.281Z]  @firebase/firestore: Firestore (12.2.0): enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead. (at http://localhost:5173/node_modules/.vite/deps/chunk-CRJH3K3M.js?v=8213522c:1205:19)
[WARNING] 🔒 Güvenlik: Sistem güvenli hale getirildi (at http://localhost:5173/src/utils/quickFix.ts:98:10)
[ERROR] ❌ Web: Bildirim izni reddedildi (at http://localhost:5173/src/services/pushNotificationService.ts:144:16)
[ERROR] ❌ Push notification sistemi başlatılamadı (at http://localhost:5173/src/services/pushNotificationService.ts:240:16)
[WARNING] As of February 21st, 2024, google.maps.Marker is deprecated. Please use google.maps.marker.AdvancedMarkerElement instead. At this time, google.maps.Marker is not scheduled to be discontinued, but google.maps.marker.AdvancedMarkerElement is recommended over google.maps.Marker. While google.maps.Marker will continue to receive bug fixes for any major regressions, existing bugs in google.maps.Marker will not be addressed. At least 12 months notice will be given before support is discontinued. Please see https://developers.google.com/maps/deprecations for additional details and https://developers.google.com/maps/documentation/javascript/advanced-markers/migration for the migration guide. (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1324:150)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyAZdHmOkHazCMnRZuZ6STP17wjG4QMHaxk:0:0)
[ERROR] Giriş hatası: FirebaseError: Firebase: Error (auth/invalid-credential).
    at createErrorInternal (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:697:37)
    at _fail (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:659:9)
    at _performFetchWithErrorHandling (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:1137:9)
    at async _performSignInRequest (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:1148:26)
    at async _signInWithCredential (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:4630:20)
    at async login (http://localhost:5173/src/contexts/AuthContext.tsx:138:30)
    at async onSubmit (http://localhost:5173/src/pages/auth/Login.tsx:100:9)
    at async http://localhost:5173/node_modules/.vite/deps/chunk-GTJUZCIC.js?v=8213522c:1506:9 (at http://localhost:5173/src/contexts/AuthContext.tsx:257:14)
[ERROR] Login error: FirebaseError: Firebase: Error (auth/invalid-credential).
    at createErrorInternal (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:697:37)
    at _fail (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:659:9)
    at _performFetchWithErrorHandling (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:1137:9)
    at async _performSignInRequest (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:1148:26)
    at async _signInWithCredential (http://localhost:5173/node_modules/.vite/deps/firebase_auth.js?v=8213522c:4630:20)
    at async login (http://localhost:5173/src/contexts/AuthContext.tsx:138:30)
    at async onSubmit (http://localhost:5173/src/pages/auth/Login.tsx:100:9)
    at async http://localhost:5173/node_modules/.vite/deps/chunk-GTJUZCIC.js?v=8213522c:1506:9 (at http://localhost:5173/src/pages/auth/Login.tsx:117:16)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/88735dd7-6f81-4c8b-8117-a685715605eb
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** Dashboard KPIs Load and Update Correctly
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/82dd0d79-deb0-4ffb-af24-6219e3768280
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** Fault Creation and Lifecycle Management
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/582eb6df-adce-49b1-891f-bd5b88eeee39
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** Maintenance Scheduling and Completion Tracking
- **Test Code:** [TC005_Maintenance_Scheduling_and_Completion_Tracking.py](./TC005_Maintenance_Scheduling_and_Completion_Tracking.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/4ca3a57a-db2f-4d53-b30b-f5b64975c313
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** Power Plant Management Data Accuracy
- **Test Code:** [TC006_Power_Plant_Management_Data_Accuracy.py](./TC006_Power_Plant_Management_Data_Accuracy.py)
- **Test Error:** Testing stopped due to critical validation error preventing creation of new solar power plant. The 'Bağlı Saha' field requires a customer assignment which is missing for the selected site 'CENTURION'. Please fix this issue to continue testing.
Browser Console Logs:
[WARNING] Google Maps JavaScript API has been loaded directly without loading=async. This can result in suboptimal performance. For best-practice loading patterns please see https://goo.gle/js-api-loading (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1423:287)
[WARNING] [2025-10-14T09:07:49.903Z]  @firebase/firestore: Firestore (12.2.0): enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead. (at http://localhost:5173/node_modules/.vite/deps/chunk-CRJH3K3M.js?v=8213522c:1205:19)
[WARNING] 🔒 Güvenlik: Sistem güvenli hale getirildi (at http://localhost:5173/src/utils/quickFix.ts:98:10)
[ERROR] ❌ Web: Bildirim izni reddedildi (at http://localhost:5173/src/services/pushNotificationService.ts:144:16)
[ERROR] ❌ Push notification sistemi başlatılamadı (at http://localhost:5173/src/services/pushNotificationService.ts:240:16)
[WARNING] As of February 21st, 2024, google.maps.Marker is deprecated. Please use google.maps.marker.AdvancedMarkerElement instead. At this time, google.maps.Marker is not scheduled to be discontinued, but google.maps.marker.AdvancedMarkerElement is recommended over google.maps.Marker. While google.maps.Marker will continue to receive bug fixes for any major regressions, existing bugs in google.maps.Marker will not be addressed. At least 12 months notice will be given before support is discontinued. Please see https://developers.google.com/maps/deprecations for additional details and https://developers.google.com/maps/documentation/javascript/advanced-markers/migration for the migration guide. (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1324:150)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/8eca75a3-7d7a-4c12-9333-ba1fa12660c9
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** Inventory Control and Alert System
- **Test Code:** [TC007_Inventory_Control_and_Alert_System.py](./TC007_Inventory_Control_and_Alert_System.py)
- **Test Error:** The task to ensure stock movements are logged, minimum threshold alerts trigger correctly, and inventory links with faults and maintenance records is not fully completed. We successfully logged in as Manager, navigated to the Maintenance section, and viewed maintenance task details including photos. However, attempts to navigate to the Faults section failed, and we could not locate or interact with the 'Add Stock Usage' control to record stock usage associated with faults or maintenance tasks. Consequently, we could not reduce inventory below minimum thresholds or verify alert generation and stock movement history. Further investigation or fixes in the application are needed to complete these critical steps.
Browser Console Logs:
[WARNING] Google Maps JavaScript API has been loaded directly without loading=async. This can result in suboptimal performance. For best-practice loading patterns please see https://goo.gle/js-api-loading (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1423:287)
[WARNING] [2025-10-14T09:07:47.787Z]  @firebase/firestore: Firestore (12.2.0): enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead. (at http://localhost:5173/node_modules/.vite/deps/chunk-CRJH3K3M.js?v=8213522c:1205:19)
[WARNING] 🔒 Güvenlik: Sistem güvenli hale getirildi (at http://localhost:5173/src/utils/quickFix.ts:98:10)
[ERROR] ❌ Web: Bildirim izni reddedildi (at http://localhost:5173/src/services/pushNotificationService.ts:144:16)
[ERROR] ❌ Push notification sistemi başlatılamadı (at http://localhost:5173/src/services/pushNotificationService.ts:240:16)
[WARNING] As of February 21st, 2024, google.maps.Marker is deprecated. Please use google.maps.marker.AdvancedMarkerElement instead. At this time, google.maps.Marker is not scheduled to be discontinued, but google.maps.marker.AdvancedMarkerElement is recommended over google.maps.Marker. While google.maps.Marker will continue to receive bug fixes for any major regressions, existing bugs in google.maps.Marker will not be addressed. At least 12 months notice will be given before support is discontinued. Please see https://developers.google.com/maps/deprecations for additional details and https://developers.google.com/maps/documentation/javascript/advanced-markers/migration for the migration guide. (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1324:150)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/f04ec768-da7e-4a7d-87bd-12cd0a88eeaa
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** Multi-Device and Multi-Channel Notification System
- **Test Code:** [TC008_Multi_Device_and_Multi_Channel_Notification_System.py](./TC008_Multi_Device_and_Multi_Channel_Notification_System.py)
- **Test Error:** Test notification trigger failed: 'Basit Test Bildirimi' button does not produce any visible notification. Push notifications are under redevelopment. Cannot verify notification delivery reliability. Stopping further testing as per instructions.
Browser Console Logs:
[WARNING] Google Maps JavaScript API has been loaded directly without loading=async. This can result in suboptimal performance. For best-practice loading patterns please see https://goo.gle/js-api-loading (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1423:287)
[WARNING] [2025-10-14T09:07:47.934Z]  @firebase/firestore: Firestore (12.2.0): enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead. (at http://localhost:5173/node_modules/.vite/deps/chunk-CRJH3K3M.js?v=8213522c:1205:19)
[WARNING] 🔒 Güvenlik: Sistem güvenli hale getirildi (at http://localhost:5173/src/utils/quickFix.ts:98:10)
[ERROR] ❌ Web: Bildirim izni reddedildi (at http://localhost:5173/src/services/pushNotificationService.ts:144:16)
[ERROR] ❌ Push notification sistemi başlatılamadı (at http://localhost:5173/src/services/pushNotificationService.ts:240:16)
[WARNING] As of February 21st, 2024, google.maps.Marker is deprecated. Please use google.maps.marker.AdvancedMarkerElement instead. At this time, google.maps.Marker is not scheduled to be discontinued, but google.maps.marker.AdvancedMarkerElement is recommended over google.maps.Marker. While google.maps.Marker will continue to receive bug fixes for any major regressions, existing bugs in google.maps.Marker will not be addressed. At least 12 months notice will be given before support is discontinued. Please see https://developers.google.com/maps/deprecations for additional details and https://developers.google.com/maps/documentation/javascript/advanced-markers/migration for the migration guide. (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1324:150)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/9ccece40-2f4f-42bb-b059-7447f6a74299
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** Subscription Enforcement and Quota Limits
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/630f8ab7-fa70-425d-aabb-bf7759975159
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** Mobile App Offline Data Entry and Start Performance
- **Test Code:** [TC010_Mobile_App_Offline_Data_Entry_and_Start_Performance.py](./TC010_Mobile_App_Offline_Data_Entry_and_Start_Performance.py)
- **Test Error:** The web landing page for the app is loaded. Next step is to launch the mobile app on an iOS device to measure launch time and test offline data entry capabilities as per instructions.
Browser Console Logs:
[WARNING] Google Maps JavaScript API has been loaded directly without loading=async. This can result in suboptimal performance. For best-practice loading patterns please see https://goo.gle/js-api-loading (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1423:287)
[WARNING] [2025-10-14T09:07:49.932Z]  @firebase/firestore: Firestore (12.2.0): enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead. (at http://localhost:5173/node_modules/.vite/deps/chunk-CRJH3K3M.js?v=8213522c:1205:19)
[WARNING] 🔒 Güvenlik: Sistem güvenli hale getirildi (at http://localhost:5173/src/utils/quickFix.ts:98:10)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/dc62f048-2fce-41c0-bf90-5b1f0f6efc0d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011
- **Test Name:** PDF and Excel Report Generation Validation
- **Test Code:** [TC011_PDF_and_Excel_Report_Generation_Validation.py](./TC011_PDF_and_Excel_Report_Generation_Validation.py)
- **Test Error:** The Excel export functionality on the 'Arıza Kayıtları' page is not working as expected. Clicking the Excel button does not trigger any export or download action, which is a critical failure for the task of testing report generation and export. PDF export works correctly, but Excel export does not. Further testing is stopped due to this issue.
Browser Console Logs:
[WARNING] Google Maps JavaScript API has been loaded directly without loading=async. This can result in suboptimal performance. For best-practice loading patterns please see https://goo.gle/js-api-loading (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1423:287)
[WARNING] [2025-10-14T09:07:46.466Z]  @firebase/firestore: Firestore (12.2.0): enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead. (at http://localhost:5173/node_modules/.vite/deps/chunk-CRJH3K3M.js?v=8213522c:1205:19)
[WARNING] 🔒 Güvenlik: Sistem güvenli hale getirildi (at http://localhost:5173/src/utils/quickFix.ts:98:10)
[ERROR] ❌ Web: Bildirim izni reddedildi (at http://localhost:5173/src/services/pushNotificationService.ts:144:16)
[ERROR] ❌ Push notification sistemi başlatılamadı (at http://localhost:5173/src/services/pushNotificationService.ts:240:16)
[WARNING] As of February 21st, 2024, google.maps.Marker is deprecated. Please use google.maps.marker.AdvancedMarkerElement instead. At this time, google.maps.Marker is not scheduled to be discontinued, but google.maps.marker.AdvancedMarkerElement is recommended over google.maps.Marker. While google.maps.Marker will continue to receive bug fixes for any major regressions, existing bugs in google.maps.Marker will not be addressed. At least 12 months notice will be given before support is discontinued. Please see https://developers.google.com/maps/deprecations for additional details and https://developers.google.com/maps/documentation/javascript/advanced-markers/migration for the migration guide. (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1324:150)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/627027ee-5846-44ef-a9cb-dbe22d22e0e4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012
- **Test Name:** Data Privacy and Compliance Verification
- **Test Code:** [TC012_Data_Privacy_and_Compliance_Verification.py](./TC012_Data_Privacy_and_Compliance_Verification.py)
- **Test Error:** Testing stopped due to inability to create new team members and missing audit logs. This prevents verifying compliance with KVKK and GDPR for personal data handling, audit logging, and data deletion requests. Issue reported for resolution.
Browser Console Logs:
[WARNING] Google Maps JavaScript API has been loaded directly without loading=async. This can result in suboptimal performance. For best-practice loading patterns please see https://goo.gle/js-api-loading (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1423:287)
[WARNING] [2025-10-14T09:07:49.713Z]  @firebase/firestore: Firestore (12.2.0): enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead. (at http://localhost:5173/node_modules/.vite/deps/chunk-CRJH3K3M.js?v=8213522c:1205:19)
[WARNING] 🔒 Güvenlik: Sistem güvenli hale getirildi (at http://localhost:5173/src/utils/quickFix.ts:98:10)
[ERROR] ❌ Web: Bildirim izni reddedildi (at http://localhost:5173/src/services/pushNotificationService.ts:144:16)
[ERROR] ❌ Push notification sistemi başlatılamadı (at http://localhost:5173/src/services/pushNotificationService.ts:240:16)
[WARNING] As of February 21st, 2024, google.maps.Marker is deprecated. Please use google.maps.marker.AdvancedMarkerElement instead. At this time, google.maps.Marker is not scheduled to be discontinued, but google.maps.marker.AdvancedMarkerElement is recommended over google.maps.Marker. While google.maps.Marker will continue to receive bug fixes for any major regressions, existing bugs in google.maps.Marker will not be addressed. At least 12 months notice will be given before support is discontinued. Please see https://developers.google.com/maps/deprecations for additional details and https://developers.google.com/maps/documentation/javascript/advanced-markers/migration for the migration guide. (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1324:150)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/a7ae53ef-714c-4b65-bd5b-c181a097c8a5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013
- **Test Name:** UI Accessibility and Turkish Language Support
- **Test Code:** [TC013_UI_Accessibility_and_Turkish_Language_Support.py](./TC013_UI_Accessibility_and_Turkish_Language_Support.py)
- **Test Error:** Accessibility and Turkish language validation completed for all accessible pages except the 'Bakım' page due to navigation failure. The 'Bakım' button does not navigate to the expected page, blocking further testing. Please fix the navigation issue to enable full validation.
Browser Console Logs:
[WARNING] Google Maps JavaScript API has been loaded directly without loading=async. This can result in suboptimal performance. For best-practice loading patterns please see https://goo.gle/js-api-loading (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1423:287)
[WARNING] [2025-10-14T09:07:49.715Z]  @firebase/firestore: Firestore (12.2.0): enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead. (at http://localhost:5173/node_modules/.vite/deps/chunk-CRJH3K3M.js?v=8213522c:1205:19)
[WARNING] 🔒 Güvenlik: Sistem güvenli hale getirildi (at http://localhost:5173/src/utils/quickFix.ts:98:10)
[ERROR] ❌ Web: Bildirim izni reddedildi (at http://localhost:5173/src/services/pushNotificationService.ts:144:16)
[ERROR] ❌ Push notification sistemi başlatılamadı (at http://localhost:5173/src/services/pushNotificationService.ts:240:16)
[WARNING] As of February 21st, 2024, google.maps.Marker is deprecated. Please use google.maps.marker.AdvancedMarkerElement instead. At this time, google.maps.Marker is not scheduled to be discontinued, but google.maps.marker.AdvancedMarkerElement is recommended over google.maps.Marker. While google.maps.Marker will continue to receive bug fixes for any major regressions, existing bugs in google.maps.Marker will not be addressed. At least 12 months notice will be given before support is discontinued. Please see https://developers.google.com/maps/deprecations for additional details and https://developers.google.com/maps/documentation/javascript/advanced-markers/migration for the migration guide. (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1324:150)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel?gsessionid=lWDTBoFk1xQVjp0g3dkj6XzrpavdiVUkg4faZp-8ggA&VER=8&database=projects%2Fyenisirket-2ec3b%2Fdatabases%2F(default)&RID=rpc&SID=rxUNlbTNQSAg9xkcjDrLNA&AID=5&CI=0&TYPE=xmlhttp&zx=mx6qnb4wkery&t=1:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/b44e09a1-753b-4b26-8828-486002d2ccf3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014
- **Test Name:** Shift Management and Guard Notification Workflow
- **Test Code:** [TC014_Shift_Management_and_Guard_Notification_Workflow.py](./TC014_Shift_Management_and_Guard_Notification_Workflow.py)
- **Test Error:** Reported the issue with the shift report submission form not advancing after filling required fields. Stopping further testing as the form cannot be submitted to verify notifications and other requirements.
Browser Console Logs:
[WARNING] Google Maps JavaScript API has been loaded directly without loading=async. This can result in suboptimal performance. For best-practice loading patterns please see https://goo.gle/js-api-loading (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1423:287)
[WARNING] [2025-10-14T09:07:49.991Z]  @firebase/firestore: Firestore (12.2.0): enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead. (at http://localhost:5173/node_modules/.vite/deps/chunk-CRJH3K3M.js?v=8213522c:1205:19)
[WARNING] 🔒 Güvenlik: Sistem güvenli hale getirildi (at http://localhost:5173/src/utils/quickFix.ts:98:10)
[ERROR] ❌ Web: Bildirim izni reddedildi (at http://localhost:5173/src/services/pushNotificationService.ts:144:16)
[ERROR] ❌ Push notification sistemi başlatılamadı (at http://localhost:5173/src/services/pushNotificationService.ts:240:16)
[WARNING] As of February 21st, 2024, google.maps.Marker is deprecated. Please use google.maps.marker.AdvancedMarkerElement instead. At this time, google.maps.Marker is not scheduled to be discontinued, but google.maps.marker.AdvancedMarkerElement is recommended over google.maps.Marker. While google.maps.Marker will continue to receive bug fixes for any major regressions, existing bugs in google.maps.Marker will not be addressed. At least 12 months notice will be given before support is discontinued. Please see https://developers.google.com/maps/deprecations for additional details and https://developers.google.com/maps/documentation/javascript/advanced-markers/migration for the migration guide. (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1324:150)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/b73da2b2-381f-4371-aea5-f7b1fd70dcd5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015
- **Test Name:** User Profile Management and Settings Update
- **Test Code:** [TC015_User_Profile_Management_and_Settings_Update.py](./TC015_User_Profile_Management_and_Settings_Update.py)
- **Test Error:** Test stopped due to inability to access password change section in settings. Profile updates and theme toggling were possible, but password change UI is missing or inaccessible. Notification preferences were not tested. Please fix the issue to allow full testing.
Browser Console Logs:
[WARNING] Google Maps JavaScript API has been loaded directly without loading=async. This can result in suboptimal performance. For best-practice loading patterns please see https://goo.gle/js-api-loading (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1423:287)
[WARNING] [2025-10-14T09:07:51.132Z]  @firebase/firestore: Firestore (12.2.0): enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead. (at http://localhost:5173/node_modules/.vite/deps/chunk-CRJH3K3M.js?v=8213522c:1205:19)
[WARNING] 🔒 Güvenlik: Sistem güvenli hale getirildi (at http://localhost:5173/src/utils/quickFix.ts:98:10)
[ERROR] ❌ Web: Bildirim izni reddedildi (at http://localhost:5173/src/services/pushNotificationService.ts:144:16)
[ERROR] ❌ Push notification sistemi başlatılamadı (at http://localhost:5173/src/services/pushNotificationService.ts:240:16)
[WARNING] As of February 21st, 2024, google.maps.Marker is deprecated. Please use google.maps.marker.AdvancedMarkerElement instead. At this time, google.maps.Marker is not scheduled to be discontinued, but google.maps.marker.AdvancedMarkerElement is recommended over google.maps.Marker. While google.maps.Marker will continue to receive bug fixes for any major regressions, existing bugs in google.maps.Marker will not be addressed. At least 12 months notice will be given before support is discontinued. Please see https://developers.google.com/maps/deprecations for additional details and https://developers.google.com/maps/documentation/javascript/advanced-markers/migration for the migration guide. (at https://maps.googleapis.com/maps/api/js?key=AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc&callback=initGoogleMaps&libraries=places:1324:150)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bfc9f21e-b1c6-494d-8d69-1d928ad6a7ce/d6f40f2a-b055-4179-b62f-394cf98c11bf
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **6.67** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---