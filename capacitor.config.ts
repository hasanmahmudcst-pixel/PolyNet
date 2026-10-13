import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.polynet.app',
  appName: 'PolyNet',
  webDir: 'dist',
  server: {
    allowNavigation: [
      'mypolynet.com',
      '*.mypolynet.com',
      '*.run.app',
      '*.google.com',
      '*.googleapis.com',
      '*.googleusercontent.com',
      '*.firebasestorage.app',
      'vendor-mentor-hub--hasanmahmudcst.replit.app',
      'provash-bondhu.web.app',
      '*.replit.app',
      '*.web.app'
    ],
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#ffffffff"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_launcher",
      iconColor: "#0D9488",
      sound: "beep.wav"
    }
  }
};

export default config;
