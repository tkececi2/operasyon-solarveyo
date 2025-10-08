import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.solarveyo.arizatakip',
  appName: 'Solarveyo',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',  // capacitor yerine https kullan
    hostname: 'localhost', // solarveyo.app yerine localhost
    allowNavigation: ['*']
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false,  // Manuel olarak kapatacağız
      backgroundColor: "#1E40AF",
      showSpinner: true,
      spinnerColor: "#FBBF24"
    },
    Keyboard: {
      resize: "body",
      style: "dark"
    },
    Preferences: {
      group: "SolarveyoApp"  // iOS için grup adı
    }
  },
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: false,
    preferredContentMode: 'mobile'
  }
};

export default config;