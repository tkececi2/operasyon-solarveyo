// Bu dosya backup olarak saklanıyor
// Kullanılmayan admin fonksiyonları burada
// Gerekirse geri alınabilir

// Backup dosyası - Kullanılmayan admin fonksiyonları
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
// const auth = admin.auth();

// Yetki kontrolü
/* const checkAdminAuth = async (context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Kullanıcı girişi gerekli');
  }
  
  const userDoc = await db.collection('kullanicilar').doc(context.auth.uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Kullanıcı bulunamadı');
  }
  
  const userData = userDoc.data();
  if (userData?.rol !== 'yonetici') {
    throw new functions.https.HttpsError('permission-denied', 'Bu işlem için yönetici yetkisi gerekli');
  }
  
  return userData;
}; */

// NOT: Bu fonksiyonlar frontend'de direkt Firestore kullanıldığı için devre dışı bırakıldı
// Gerekirse yorum satırlarını kaldırarak aktif edilebilir

export {};
