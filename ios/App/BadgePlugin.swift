import Capacitor
import UIKit

@objc(BadgePlugin)
public class BadgePlugin: CAPPlugin {
    
    @objc func setBadge(_ call: CAPPluginCall) {
        guard let count = call.getInt("count") else {
            call.reject("Count parameter is required")
            return
        }
        
        DispatchQueue.main.async {
            UIApplication.shared.applicationIconBadgeNumber = count
            print("Badge set to: \(count)")
            call.resolve([
                "success": true,
                "count": count
            ])
        }
    }
    
    @objc func getBadge(_ call: CAPPluginCall) {
        let count = UIApplication.shared.applicationIconBadgeNumber
        call.resolve([
            "count": count
        ])
    }
    
    @objc func clearBadge(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            UIApplication.shared.applicationIconBadgeNumber = 0
            print("Badge cleared")
            call.resolve([
                "success": true
            ])
        }
    }
}
