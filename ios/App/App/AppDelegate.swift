import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Firebase'i başlat
        FirebaseApp.configure()
        
        // Push Notifications için gerekli
        UNUserNotificationCenter.current().delegate = self
        
        // Firebase Messaging delegate
        Messaging.messaging().delegate = self
        
        // APNs token'ı Firebase'e bağla
        application.registerForRemoteNotifications()
        
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
    
    // APNs token başarılı
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Firebase'e APNs token'ı ilet
        Messaging.messaging().apnsToken = deviceToken
        print("✅ APNs token Firebase'e iletildi")
        
        // APNs token geldi, şimdi FCM token'ı alabiliriz
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            Messaging.messaging().token { token, error in
                if let error = error {
                    print("❌ FCM Token alma hatası:", error)
                } else if let token = token {
                    print("🔥 FCM Token başarıyla alındı:", token)
                    
                    // Token'ı kaydet
                    UserDefaults.standard.set(token, forKey: "fcm_token")
                    UserDefaults.standard.synchronize()
                    
                    if let suite = UserDefaults(suiteName: "CapacitorPreferences") {
                        suite.set(token, forKey: "fcm_token")
                        suite.synchronize()
                        print("✅ FCM Token CapacitorPreferences'a kaydedildi")
                    }
                    
                    // Capacitor Preferences plugin'inde tanımlı özel grup: SolarveyoApp
                    if let solarveyoSuite = UserDefaults(suiteName: "SolarveyoApp") {
                        solarveyoSuite.set(token, forKey: "fcm_token")
                        solarveyoSuite.synchronize()
                        print("✅ FCM Token SolarveyoApp'a kaydedildi")
                    }
                    
                    // NotificationCenter ile JavaScript tarafına haber ver
                    NotificationCenter.default.post(
                        name: NSNotification.Name("FCMTokenReceived"),
                        object: nil,
                        userInfo: ["token": token]
                    )
                }
            }
        }
    }
    
    // APNs token hatası
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("❌ APNs token alma hatası:", error.localizedDescription)
    }

}

// MARK: - UNUserNotificationCenterDelegate
extension AppDelegate: UNUserNotificationCenterDelegate {
    // Bildirim geldiğinde (uygulama açıkken)
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // Bildirimi göster
        completionHandler([.banner, .sound, .badge])
    }
    
    // Bildirime tıklandığında
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        completionHandler()
    }
}

// MARK: - MessagingDelegate
extension AppDelegate: MessagingDelegate {
    // FCM token alındığında veya yenilendiğinde
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("🔥 FCM Token alındı/yenilendi:", fcmToken ?? "nil")
        
        // Token'ı hem UserDefaults hem Capacitor suite'e kaydet
        if let token = fcmToken {
            // Önceki token'ı kontrol et
            let previousToken = UserDefaults.standard.string(forKey: "fcm_token")
            
            if previousToken != token {
                print("⚠️ FCM Token değişti! Eski: \(previousToken?.prefix(20) ?? "nil")... Yeni: \(token.prefix(20))...")
                
                // Token değişti flag'ini set et
                UserDefaults.standard.set(true, forKey: "fcm_token_changed")
            }
            
            // Standard UserDefaults
            UserDefaults.standard.set(token, forKey: "fcm_token")
            UserDefaults.standard.synchronize()
            
            // Capacitor Preferences suite
            if let suite = UserDefaults(suiteName: "CapacitorPreferences") {
                suite.set(token, forKey: "fcm_token")
                suite.set(true, forKey: "fcm_token_refresh_needed")
                suite.synchronize()
                print("✅ FCM Token kaydedildi (CapacitorPreferences)")
            }
            
            // Capacitor Preferences için özel grup: SolarveyoApp
            if let solarveyoSuite = UserDefaults(suiteName: "SolarveyoApp") {
                solarveyoSuite.set(token, forKey: "fcm_token")
                solarveyoSuite.synchronize()
                print("✅ FCM Token kaydedildi (SolarveyoApp)")
            }
            
            print("✅ FCM Token kaydedildi (UserDefaults)")
            
            // JavaScript tarafına token yenilendiği bilgisini gönder
            NotificationCenter.default.post(name: NSNotification.Name("FCMTokenRefreshed"), object: token)
        }
    }
}

