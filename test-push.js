// Test Push Notification Script
const admin = require('firebase-admin');

// Firebase service account
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// FCM Token (Firestore'dan aldığınız)
const FCM_TOKEN = 'Cpk7-05Lp0tfrKc2pxtk5a:APA91bFw3sZmaRevsyBu-vPAdHwPNSMkgDnVlLcryWf-YGlwNmtUjBEYFl1BF7lCsobeNtK8t1MYT5XqjMV548SFpFgAlYLjJ78ohnrSlpUGT4icdEkVW';

const message = {
  token: FCM_TOKEN,
  notification: {
    title: '🚨 Test Arıza Bildirimi',
    body: 'CENTURION GES - İnverter hatası tespit edildi'
  },
  data: {
    type: 'fault',
    id: 'test123',
    screen: '/arizalar'
  },
  apns: {
    payload: {
      aps: {
        sound: 'default',
        badge: 1
      }
    }
  }
};

console.log('📤 Test bildirimi gönderiliyor...');
console.log('Token:', FCM_TOKEN.substring(0, 50) + '...');

admin.messaging().send(message)
  .then((response) => {
    console.log('✅ Bildirim başarıyla gönderildi!');
    console.log('Response:', response);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Bildirim gönderme hatası:', error);
    process.exit(1);
  });

