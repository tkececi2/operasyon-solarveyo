/**
 * OneSignal iOS Native Setup
 * Firebase FCM → OneSignal Migration
 */

import UIKit
import Capacitor
import OneSignal

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // OneSignal initialization - Firebase FCM replacement
        OneSignal.initialize("c7477da8-21b8-4780-aabf-39ede0892ebd", withLaunchOptions: launchOptions)
        
        // Prompt for push notification permissions
        OneSignal.promptForPushNotifications(userResponse: { accepted in
            print("OneSignal permission granted: \(accepted)")
        })
        
        // Set external user ID handler
        self.setupOneSignalUserTracking()
        
        return true
    }
    
    // OneSignal user tracking for multi-tenant SAAS
    private func setupOneSignalUserTracking() {
        // Listen for external user ID updates from React
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleOneSignalUserUpdate),
            name: NSNotification.Name("OneSignalUserUpdate"),
            object: nil
        )
    }
    
    @objc func handleOneSignalUserUpdate(_ notification: NSNotification) {
        if let userInfo = notification.userInfo,
           let userId = userInfo["userId"] as? String,
           let tags = userInfo["tags"] as? [String: String] {
            
            print("🔔 OneSignal user update:", userId)
            
            // Set external user ID
            OneSignal.setExternalUserId(userId)
            
            // Set tags for multi-tenant targeting
            OneSignal.sendTags(tags)
            
            print("✅ OneSignal user setup completed")
        }
    }
    
    // MARK: - URL Opening
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    // MARK: - Continuing Activities
    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        ApplicationDelegateProxy.shared.applicationDidBecomeActive(application)
    }

    func applicationWillResignActive(_ application: UIApplication) {
        ApplicationDelegateProxy.shared.applicationWillResignActive(application)
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        ApplicationDelegateProxy.shared.applicationDidEnterBackground(application)
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        ApplicationDelegateProxy.shared.applicationWillEnterForeground(application)
    }

    func applicationWillTerminate(_ application: UIApplication) {
        ApplicationDelegateProxy.shared.applicationWillTerminate(application)
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        ApplicationDelegateProxy.shared.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
        
        // OneSignal automatically handles device token
        print("✅ Device token registered with OneSignal")
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        ApplicationDelegateProxy.shared.application(application, didFailToRegisterForRemoteNotificationsWithError: error)
        print("❌ OneSignal device token registration failed:", error)
    }
    
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        ApplicationDelegateProxy.shared.application(application, didReceiveRemoteNotification: userInfo, fetchCompletionHandler: completionHandler)
        
        // OneSignal handles notification automatically
        print("📱 OneSignal notification received")
    }
}
