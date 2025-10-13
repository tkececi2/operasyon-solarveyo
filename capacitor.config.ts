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
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffff"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 500,  // Kısa süre göster
      launchAutoHide: true,  // Otomatik kapat
      backgroundColor: "#ffffff",  // Beyaz arka plan
      showSpinner: false,  // Spinner'ı kapat - React'ta göstereceğiz
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      iosSpinnerStyle: "small",
      spinnerColor: "#3b82f6"  // Mavi (opsiyonel, zaten kapalı)
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