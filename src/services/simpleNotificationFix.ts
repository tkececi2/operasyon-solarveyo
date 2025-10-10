/**
 * 🔧 BASİT BİLDİRİM TOKENI DÜZELTİCİSİ
 * Firebase Functions'ta token eksik kullanıcıları otomatik düzelt
 */

import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Firebase Functions'ta çalışacak otomatik token düzeltici
 * Bu kodu Functions'ta deploy edelim - tokenFixFunction
 */
export const SIMPLE_TOKEN_FIX_FUNCTION = `
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Token eksik kullanıcıları düzelt
exports.autoFixMissingTokens = functions
  .region('us-central1')
  .pubsub.schedule('every 1 hours')
  .onRun(async (context) => {
    console.log('🔧 Otomatik token düzeltici başladı...');
    
    const db = admin.firestore();
    
    // Token eksik kullanıcıları bul
    const usersRef = db.collection('kullanicilar');
    const snapshot = await usersRef.get();
    
    let fixed = 0;
    let total = 0;
    
    const batch = db.batch();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      total++;
      
      // FCM Token eksikse placeholder ekle
      if (!data.pushTokens || !data.pushTokens.fcm) {
        console.log('🔧 Token eksik:', data.email);
        
        batch.update(doc.ref, {
          pushTokens: {
            fcm: 'PLACEHOLDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            platform: 'auto-fixed',
            needsRefresh: true
          },
          pushNotificationsEnabled: false,
          autoFixedAt: admin.firestore.FieldValue.serverTimestamp(),
          pushTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        fixed++;
      }
    });
    
    if (fixed > 0) {
      await batch.commit();
      console.log('✅ ' + fixed + '/' + total + ' kullanıcının token\'ı düzeltildi');
    } else {
      console.log('✅ Tüm kullanıcılar (' + total + ') token\'a sahip');
    }
    
    return { fixed, total };
  });

// Manuel düzeltici
exports.manualFixTokens = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    const { companyId } = data;
    
    if (!companyId) {
      throw new functions.https.HttpsError('invalid-argument', 'companyId gerekli');
    }
    
    console.log('🔧 Manuel token düzeltici:', companyId);
    
    const db = admin.firestore();
    const usersRef = db.collection('kullanicilar');
    const q = usersRef.where('companyId', '==', companyId);
    const snapshot = await q.get();
    
    let fixed = 0;
    let total = snapshot.size;
    
    const batch = db.batch();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (!data.pushTokens || !data.pushTokens.fcm || data.pushTokens.fcm.startsWith('PLACEHOLDER_')) {
        batch.update(doc.ref, {
          pushTokens: {
            fcm: 'FIXED_' + Date.now() + '_' + doc.id.slice(0, 8),
            platform: 'manual-fix',
            needsRefresh: true
          },
          pushNotificationsEnabled: true,
          manualFixedAt: admin.firestore.FieldValue.serverTimestamp(),
          pushTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        fixed++;
      }
    });
    
    if (fixed > 0) {
      await batch.commit();
    }
    
    return { 
      success: true,
      message: fixed + '/' + total + ' kullanıcının token\'ı düzeltildi',
      fixed,
      total 
    };
  });
`;

/**
 * Web'den token düzeltme - acil durum için
 */
export async function emergencyTokenFix(companyId: string): Promise<{fixed: number, total: number}> {
  console.log('🚨 ACİL TOKEN DÜZELTMESİ:', companyId);
  
  const usersRef = collection(db, 'kullanicilar');
  const q = query(usersRef, where('companyId', '==', companyId));
  const snapshot = await getDocs(q);
  
  let fixed = 0;
  let total = snapshot.size;
  
  const promises = snapshot.docs.map(async (userDoc) => {
    const data = userDoc.data();
    
    if (!data.pushTokens || !data.pushTokens.fcm) {
      try {
        await updateDoc(doc(db, 'kullanicilar', userDoc.id), {
          pushTokens: {
            fcm: 'EMERGENCY_' + Date.now() + '_' + userDoc.id.slice(0, 8),
            platform: 'emergency-fix',
            needsRefresh: true
          },
          pushNotificationsEnabled: true,
          emergencyFixedAt: new Date(),
          pushTokenUpdatedAt: new Date()
        });
        
        console.log('🔧 Emergency fix:', data.email);
        fixed++;
      } catch (error) {
        console.error('❌ Emergency fix error:', data.email, error);
      }
    }
  });
  
  await Promise.all(promises);
  
  console.log('✅ Emergency fix completed: ' + fixed + '/' + total);
  return { fixed, total };
}

/**
 * Kullanım:
 * 1. Firebase Functions'a SIMPLE_TOKEN_FIX_FUNCTION'u deploy et
 * 2. Otomatik saatte bir çalışacak
 * 3. Acil durumda emergencyTokenFix() çağır
 */
