#import <Capacitor/Capacitor.h>

CAP_PLUGIN(BadgePlugin, "Badge",
    CAP_PLUGIN_METHOD(setBadge, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getBadge, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(clearBadge, CAPPluginReturnPromise);
)
