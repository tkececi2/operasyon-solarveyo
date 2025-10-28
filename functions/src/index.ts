/**
 * Firebase Functions - Solarveyo Arıza Takip
 * Minimal Functions - Email devre dışı
 */

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// Firebase Admin SDK'yı başlat
admin.initializeApp();

// Basit test fonksiyonu
export const testFunction = functions.https.onCall(async (data: any, context: any) => {
  return {
    success: true,
    message: "Firebase Functions çalışıyor",
    timestamp: new Date().toISOString()
  };
});

/**
 * notifications/{id} oluşturulunca FCM push gönder
 * iOS'ta arka planda/kapalıyken de banner görünsün diye notification payload kullanılır
 */
export const sendPushOnNotificationCreate = functions
  .region("us-central1")
  .firestore.document("notifications/{notificationId}")
  .onCreate(async (snap, context) => {
    const data = snap.data() as any;
    const { userId, companyId, title, message, type, metadata } = data || {};
    
    try {
      console.log("🔔 sendPushOnNotificationCreate BAŞLADI - NotificationId:", context.params.notificationId);

      console.log("📝 Bildirim Data:", { 
        userId: userId || "YOK ❌", 
        companyId: companyId || "YOK ❌", 
        title: title || "YOK ❌", 
        messageLength: message?.length || 0,
        type 
      });

      if (!companyId || !title || !message) {
        console.error("❌ sendPushOnNotificationCreate: eksik alan", { userId, companyId, title, hasMessage: !!message });
        await snap.ref.update({ 
          pushTriedAt: admin.firestore.FieldValue.serverTimestamp(), 
          pushError: `Eksik alan: ${!userId ? 'userId ' : ''}${!companyId ? 'companyId ' : ''}${!title ? 'title ' : ''}${!message ? 'message' : ''}`
        });
        return null;
      }

      // Fallback fan-out: userId yoksa saha/santral hedeflemesine göre doğrudan token'lara gönder
      if (!userId) {
        try {
          const db = admin.firestore();
          const sahaId: string | undefined = (metadata && (metadata as any).sahaId) || undefined;
          const santralId: string | undefined = (metadata && (metadata as any).santralId) || undefined;
          const targetRoles: string[] | undefined = (Array.isArray((data as any)?.roles) ? (data as any).roles : (Array.isArray((metadata as any)?.targetRoles) ? (metadata as any).targetRoles : undefined));

          console.log("🎯 Fan-out Bildirim Hedefleme:", {
            sahaId: sahaId || "YOK",
            santralId: santralId || "YOK", 
            targetRoles: targetRoles || "TÜM ROLLER",
            companyId: companyId
          });

          // ÖNEMLİ: Aynı cihazdan birden fazla kullanıcı giriş yapabilir
          // Bu yüzden token bazlı değil, kullanıcı bazlı bildirim göndermeliyiz
          const processedTokens = new Set<string>(); // Aynı token'a birden fazla gönderimi önle
          
          let q = db.collection("kullanicilar").where("companyId", "==", companyId) as FirebaseFirestore.Query;
          if (Array.isArray(targetRoles) && targetRoles.length > 0 && targetRoles.length <= 10) {
            q = q.where("rol", "in", targetRoles as any);
          }

          const usersSnap = await q.get();
          console.log(`📊 Toplam kullanıcı sayısı (companyId=${companyId}): ${usersSnap.size}`);
          
          const recipients = usersSnap.docs.filter((uDoc) => {
            const u = uDoc.data() as any;
            const userSahalar: string[] = Array.isArray(u.sahalar) ? u.sahalar : [];
            const userSantraller: string[] = Array.isArray(u.santraller) ? u.santraller : [];
            
            // Debug log her kullanıcı için
            console.log(`👤 Kullanıcı: ${u.email || u.ad || uDoc.id} (${u.rol})`);
            console.log(`   - Atandığı sahalar: [${userSahalar.join(', ')}]`);
            console.log(`   - Atandığı santraller: [${userSantraller.join(', ')}]`);
            console.log(`   - Hedef sahaId: ${sahaId || 'YOK'}`);
            console.log(`   - Hedef santralId: ${santralId || 'YOK'}`);
            
            // ÖNEMLİ: YÖNETİCİ VE MÜHENDİS TÜM SAHALARI GÖRÜR
            if (u.rol === 'yonetici' || u.rol === 'muhendis') {
              console.log(`   ✅ Rol: ${u.rol} - TÜM SAHALARA ERİŞİM`);
              return true;
            }
            
            // ÖNEMLİ: SAHA BAZLI BİLDİRİM SİSTEMİ (Müşteri, Bekçi, Tekniker için)
            // Eğer sahaId yoksa, TÜM kullanıcılara gönder
            if (!sahaId) {
              console.log(`   ✅ SahaId YOK - TÜM kullanıcılara gönderilecek`);
              return true;
            }
            
            // SahaId varsa, SADECE o sahaya atanan kullanıcılara gönder
            const sahaOk = userSahalar.includes(sahaId);
            
            console.log(`   - Saha kontrolü (${sahaId}): ${sahaOk ? '✅ Atanmış' : '❌ Atanmamış'}`);
            console.log(`   - SONUÇ: ${sahaOk ? '✅ Bildirim gönderilecek' : '❌ Filtrelendi'}`);
            
            return sahaOk;
          });

          if (recipients.length === 0) {
            await snap.ref.update({ pushTriedAt: admin.firestore.FieldValue.serverTimestamp(), pushError: "fanout-no-recipients" });
            return null;
          }

          const deliveredUserIds: string[] = [];
          const errors: Array<{ userId: string; error: string }> = [];

          await Promise.all(recipients.map(async (uDoc) => {
            const u = uDoc.data() as any;
            
            // MULTI-DEVICE: Kullanıcının tüm cihaz token'larını al
            const devices = u?.devices || {};
            const userTokens: string[] = Object.values(devices)
              .map((d: any) => d?.token)
              .filter(Boolean);
            
            // Fallback: Eski format token varsa ekle
            const oldToken = u?.pushTokens?.fcm || u?.fcmToken || u?.fcm;
            if (oldToken && !userTokens.includes(oldToken)) {
              userTokens.push(oldToken);
            }
            
            if (userTokens.length === 0) {
              errors.push({ userId: uDoc.id, error: "no-token" });
              return;
            }

            // ÖNEMLI: Aynı token'a birden fazla gönderimi önle
            // Aynı cihazdan farklı kullanıcılar giriş yapmış olabilir
            const tokensToSend = userTokens.filter(token => !processedTokens.has(token));
            if (tokensToSend.length === 0) {
              console.log(`⚠️ Kullanıcının tüm token'ları zaten işlendi, atlanıyor: ${uDoc.id}`);
              return;
            }
            
            tokensToSend.forEach(token => processedTokens.add(token));

            const screen = (metadata && ((metadata as any).screen || (metadata as any).deepLink)) || "/bildirimler";
            
            console.log(`📤 (fanout) ${tokensToSend.length} cihaza FCM mesajı gönderiliyor...`, { 
              userId: uDoc.id, 
              email: u.email || u.ad,
              rol: u.rol,
              tokenCount: tokensToSend.length,
              tokens: tokensToSend.map(t => t.substring(0, 20) + "...")
            });

            try {
              // MULTI-DEVICE: sendEachForMulticast ile tüm cihazlara gönder
              const response = await admin.messaging().sendEachForMulticast({
                tokens: tokensToSend,
                notification: { title, body: message },
                data: {
                  type: String(type || "info"),
                  companyId: String(companyId),
                  userId: String(uDoc.id),
                  screen: String(screen),
                  notificationId: String(context.params.notificationId),
                },
                apns: {
                  headers: { "apns-push-type": "alert", "apns-priority": "10" },
                  payload: { aps: { sound: "default", badge: 1 } },
                },
              });
              
              console.log(`✅ (fanout) ${response.successCount}/${tokensToSend.length} cihaza gönderildi`, { 
                userId: uDoc.id,
                success: response.successCount,
                failed: response.failureCount
              });
              
              if (response.successCount > 0) {
                deliveredUserIds.push(uDoc.id);
              }
              
              // Başarısız token'ları temizle
              if (response.failureCount > 0) {
                const failedTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                  if (!resp.success) {
                    const errorCode = (resp.error as any)?.code;
                    if (errorCode === 'messaging/invalid-registration-token' || 
                        errorCode === 'messaging/registration-token-not-registered') {
                      failedTokens.push(tokensToSend[idx]);
                    }
                  }
                });
                
                // Geçersiz token'ları sil
                if (failedTokens.length > 0) {
                  console.log(`🗑️ ${failedTokens.length} geçersiz token temizleniyor...`);
                  const deviceKeys = Object.keys(devices).filter(key => 
                    failedTokens.includes(devices[key]?.token)
                  );
                  
                  const updateObj: any = {};
                  deviceKeys.forEach(key => {
                    updateObj[`devices.${key}`] = admin.firestore.FieldValue.delete();
                  });
                  
                  if (Object.keys(updateObj).length > 0) {
                    await db.collection("kullanicilar").doc(uDoc.id).update(updateObj).catch(() => {});
                  }
                }
              }
            } catch (e: any) {
              console.error("❌ (fanout) gönderilemedi", { userId: uDoc.id, error: e?.message || e });
              errors.push({ userId: uDoc.id, error: String(e?.message || e) });
            }
          }));

          const updateBody: any = {
            pushFanoutAt: admin.firestore.FieldValue.serverTimestamp(),
            pushFanoutCount: deliveredUserIds.length,
          };
          if (deliveredUserIds.length > 0) {
            updateBody.deliveredTo = admin.firestore.FieldValue.arrayUnion(...deliveredUserIds);
            updateBody.pushSentAt = admin.firestore.FieldValue.serverTimestamp();
          }
          if (errors.length > 0) {
            updateBody.pushErrors = errors;
          } else {
            updateBody.pushError = admin.firestore.FieldValue.delete();
          }
          await snap.ref.update(updateBody);
          return null;
        } catch (fanErr) {
          console.error("❌ Fanout hata", fanErr);
          try {
            await snap.ref.update({ pushTriedAt: admin.firestore.FieldValue.serverTimestamp(), pushError: String((fanErr as any)?.message || fanErr) });
          } catch {}
          return null;
        }
      }

      const db = admin.firestore();
      const userRef = db.collection("kullanicilar").doc(userId);
      
      console.log("👤 Kullanıcı sorgulanıyor:", userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        console.error("❌ Kullanıcı bulunamadı:", { userId });
        await snap.ref.update({ pushTriedAt: admin.firestore.FieldValue.serverTimestamp(), pushError: "user-not-found" });
        return null;
      }

      const user = userDoc.data() as any;
      console.log("✅ Kullanıcı bulundu:", { userId, userCompanyId: user.companyId, rol: user.rol });
      
      if (user.companyId !== companyId) {
        console.error("❌ CompanyId uyuşmuyor:", { userCompanyId: user.companyId, notificationCompanyId: companyId });
        await snap.ref.update({ pushTriedAt: admin.firestore.FieldValue.serverTimestamp(), pushError: "company-mismatch" });
        return null;
      }

      // MULTI-DEVICE: Kullanıcının tüm cihaz token'larını al
      const devices = user?.devices || {};
      const tokens: string[] = Object.values(devices)
        .map((d: any) => d?.token)
        .filter(Boolean);
      
      // Fallback: Eski format token varsa ekle
      const oldToken = user?.pushTokens?.fcm || user?.fcmToken || (user as any)?.fcm;
      if (oldToken && !tokens.includes(oldToken)) {
        tokens.push(oldToken);
      }
      
      console.log("🔑 FCM Token kontrolü:", { 
        hasDevices: !!user?.devices,
        deviceCount: Object.keys(devices).length,
        tokenCount: tokens.length,
        hasOldToken: !!oldToken
      });
      
      if (tokens.length === 0) {
        console.error("❌ FCM Token yok:", { userId });
        await snap.ref.update({ pushTriedAt: admin.firestore.FieldValue.serverTimestamp(), pushError: "no-token" });
        return null;
      }

      const screen = (metadata && (metadata.screen || metadata.deepLink)) || "/bildirimler";

      console.log(`📤 ${tokens.length} cihaza FCM mesajı gönderiliyor...`, { 
        userId: userId,
        email: user.email || user.ad,
        rol: user.rol,
        tokenCount: tokens.length,
        tokens: tokens.map(t => t.substring(0, 20) + "..."),
        title, 
        screen 
      });
      
      // MULTI-DEVICE: sendEachForMulticast ile tüm cihazlara gönder
      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        notification: {
          title: title,
          body: message,
        },
        data: {
          type: String(type || "info"),
          companyId: String(companyId),
          userId: String(userId),
          screen: String(screen),
          notificationId: String(context.params.notificationId),
        },
        apns: {
          headers: {
            "apns-push-type": "alert",
            "apns-priority": "10",
          },
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      });
      
      console.log(`✅ FCM mesajı gönderildi: ${response.successCount}/${tokens.length} cihaz`, { 
        success: response.successCount, 
        failed: response.failureCount 
      });
      
      // Başarısız token'ları temizle
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = (resp.error as any)?.code;
            console.log(`❌ Token başarısız: ${tokens[idx].substring(0, 20)}... - Hata: ${errorCode}`);
            
            if (errorCode === 'messaging/invalid-registration-token' || 
                errorCode === 'messaging/registration-token-not-registered') {
              failedTokens.push(tokens[idx]);
            }
          }
        });
        
        // Geçersiz token'ları sil
        if (failedTokens.length > 0) {
          console.log(`🗑️ ${failedTokens.length} geçersiz token temizleniyor...`);
          const deviceKeys = Object.keys(devices).filter(key => 
            failedTokens.includes(devices[key]?.token)
          );
          
          const updateObj: any = {};
          deviceKeys.forEach(key => {
            updateObj[`devices.${key}`] = admin.firestore.FieldValue.delete();
          });
          
          if (Object.keys(updateObj).length > 0) {
            await db.collection("kullanicilar").doc(userId).update(updateObj);
            console.log(`✅ ${deviceKeys.length} geçersiz cihaz temizlendi`);
          }
        }
      }
      
      await snap.ref.update({ 
        pushSentAt: admin.firestore.FieldValue.serverTimestamp(), 
        pushSentToDevices: response.successCount,
        pushFailedDevices: response.failureCount,
        pushError: admin.firestore.FieldValue.delete() 
      });
      
      console.log("✅ Bildirim güncellendi: pushSentAt eklendi");
      return null;
    } catch (err: any) {
      console.error("❌❌❌ sendPushOnNotificationCreate HATA:", err);
      console.error("Hata detayı:", { 
        message: err?.message, 
        code: err?.code, 
        stack: err?.stack 
      });
      
      // Token geçersizse otomatik temizle
      if (err?.code === 'messaging/registration-token-not-registered' && userId) {
        console.log(`🗑️ Geçersiz token temizleniyor: ${userId}`);
        try {
          const db = admin.firestore();
          await db.collection("kullanicilar").doc(userId).update({
            'pushTokens': admin.firestore.FieldValue.delete(),
            'fcmToken': admin.firestore.FieldValue.delete(),
            'pushTokenUpdatedAt': admin.firestore.FieldValue.delete()
          });
          console.log(`✅ Token temizlendi, kullanıcı yeniden giriş yaptığında yeni token alınacak`);
        } catch (cleanupErr) {
          console.error("Token temizleme hatası:", cleanupErr);
        }
      }
      
      try {
        await snap.ref.update({ 
          pushTriedAt: admin.firestore.FieldValue.serverTimestamp(), 
          pushError: String(err?.message || err) 
        });
        console.log("❌ Bildirim güncellendi: pushError eklendi");
      } catch (updateErr) {
        console.error("Bildirim güncellenemedi:", updateErr);
      }
      return null;
    }
  });

/**
 * deleteUserAccount
 * Kullanıcıyı hem Firebase Authentication'dan hem de Firestore'dan siler
 * Girdi:
 *  - userId: string (zorunlu) - Silinecek kullanıcının UID'si
 */
export const deleteUserAccount = functions
  .region("us-central1")
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
      const { userId } = data || {};

      console.log("🗑️ deleteUserAccount çağrıldı:", { userId: userId || "YOK" });

      // Yetki kontrolü - sadece authenticated kullanıcılar silebilir
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "Bu işlem için giriş yapmalısınız"
        );
      }

      if (!userId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "userId zorunludur"
        );
      }

      const db = admin.firestore();
      
      // 1. Firestore'dan kullanıcıyı kontrol et
      const userDoc = await db.collection("kullanicilar").doc(userId).get();
      if (!userDoc.exists) {
        console.warn("⚠️ Kullanıcı Firestore'da bulunamadı, sadece Auth'tan silinecek:", userId);
      } else {
        // Firestore'dan sil
        await db.collection("kullanicilar").doc(userId).delete();
        console.log("✅ Kullanıcı Firestore'dan silindi:", userId);
      }

      // 2. Firebase Authentication'dan sil
      try {
        await admin.auth().deleteUser(userId);
        console.log("✅ Kullanıcı Firebase Auth'tan silindi:", userId);
      } catch (authError: any) {
        // Kullanıcı Auth'ta yoksa hata atma, zaten silinmiş demektir
        if (authError.code === 'auth/user-not-found') {
          console.warn("⚠️ Kullanıcı Auth'ta bulunamadı (zaten silinmiş):", userId);
        } else {
          throw authError;
        }
      }

      console.log("✅ Kullanıcı başarıyla silindi:", userId);
      return { success: true, userId };
    } catch (err: any) {
      console.error("❌ deleteUserAccount hata:", err);
      throw new functions.https.HttpsError(
        "internal",
        err?.message || "Kullanıcı silinirken hata oluştu"
      );
    }
  });

/**
 * createScopedNotification
 * Kullanıcı atamalarına göre (sahaId/santralId) hedeflenen bildirimleri kullanıcıya özel dokümanlar olarak oluşturur.
 * Girdi:
 *  - companyId: string (zorunlu)
 *  - title: string, message: string, type: 'info'|'success'|'warning'|'error'
 *  - actionUrl?: string
 *  - metadata?: { sahaId?: string; santralId?: string; [k:string]: any }
 *  - roles?: string[]  // hedef roller (yoksa tüm roller)
 *  - expiresAt?: string // ISO tarih, opsiyonel
 */
export const createScopedNotification = functions
  .region("us-central1")
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
      const { companyId, title, message, type, actionUrl, metadata, roles, expiresAt } = data || {};

      console.log("🔔 createScopedNotification çağrıldı:", {
        companyId: companyId || "YOK",
        title: title || "YOK",
        type: type || "YOK",
        roles: roles || "TÜM ROLLER",
        sahaId: metadata?.sahaId || "YOK",
        santralId: metadata?.santralId || "YOK"
      });

      if (!companyId || !title || !message || !type) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "companyId, title, message ve type zorunludur"
        );
      }

      const db = admin.firestore();
      const usersRef = db.collection("kullanicilar");
      let q = usersRef.where("companyId", "==", companyId) as FirebaseFirestore.Query;

      // roles <= 10 koşulu Firestore 'in' operatörü için gereklidir
      if (Array.isArray(roles) && roles.length > 0 && roles.length <= 10) {
        q = q.where("rol", "in", roles as any);
      }

      const snapshot = await q.get();
      const sahaId: string | undefined = metadata?.sahaId;
      
      console.log(`📊 Toplam kullanıcı sayısı (companyId=${companyId}): ${snapshot.size}`);

      const recipients = snapshot.docs.filter((docSnap) => {
        const u = docSnap.data() as any;
        
        // Kullanıcının atandığı sahalar
        const userSahalar: string[] = Array.isArray(u.sahalar) ? u.sahalar : [];
        
        // Debug log
        console.log(`👤 Kullanıcı kontrolü: ${u.email || u.ad} (${u.rol})`);
        console.log(`   - Atandığı sahalar: ${userSahalar.join(', ') || 'YOK'}`);
        console.log(`   - Bildirim sahaId: ${sahaId || 'YOK'}`);
        
        // ÖNEMLİ: YÖNETİCİ VE MÜHENDİS TÜM SAHALARI GÖRÜR
        if (u.rol === 'yonetici' || u.rol === 'muhendis') {
          console.log(`   ✅ Rol: ${u.rol} - TÜM SAHALARA ERİŞİM`);
          return true;
        }
        
        // ÖNEMLİ: SAHA BAZLI BİLDİRİM SİSTEMİ (Müşteri, Bekçi, Tekniker için)
        // Eğer sahaId yoksa, TÜM kullanıcılara gönder
        if (!sahaId) {
          console.log(`   ✅ SahaId YOK - TÜM kullanıcılara gönderilecek`);
          return true;
        }
        
        // SahaId varsa, SADECE o sahaya atanan kullanıcılara gönder
        const sahaOk = userSahalar.includes(sahaId);
        
        console.log(`   - Saha kontrolü (${sahaId}): ${sahaOk ? '✅ Atanmış' : '❌ Atanmamış'}`);
        console.log(`   - SONUÇ: ${sahaOk ? '✅ Bildirim gönderilecek' : '❌ Filtrelendi'}`);
        
        return sahaOk;
      });

      // Batch yazım (500 limit)
      const createdAt = admin.firestore.FieldValue.serverTimestamp();
      const coll = db.collection("notifications");
      let batch = db.batch();
      let ops = 0;
      let created = 0;

      const expiresTs = expiresAt ? admin.firestore.Timestamp.fromDate(new Date(expiresAt)) : undefined;

      for (const docSnap of recipients) {
        const nRef = coll.doc();
        const body: any = {
          companyId,
          userId: docSnap.id,
          title,
          message,
          type,
          // Yeni okundu modeli: kullanıcı-bazlı okundu listesi
          readBy: [],
          // Geriye dönük uyumluluk için read alanını false bırakıyoruz
          read: false,
          createdAt,
        };
        if (actionUrl) body.actionUrl = actionUrl;
        if (metadata) body.metadata = metadata;
        if (expiresTs) body.expiresAt = expiresTs;

        batch.set(nRef, body);
        ops++;
        created++;
        if (ops >= 450) { // güvenli limit
          await batch.commit();
          batch = db.batch();
          ops = 0;
        }
      }

      if (ops > 0) {
        await batch.commit();
      }

      return { success: true, created };
    } catch (err: any) {
      console.error("createScopedNotification error", err);
      throw new functions.https.HttpsError("internal", err?.message || "Beklenmeyen hata");
    }
  });