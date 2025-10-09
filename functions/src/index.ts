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
    try {
      console.log("🔔 sendPushOnNotificationCreate BAŞLADI - NotificationId:", context.params.notificationId);
      
      const data = snap.data() as any;
      const { userId, companyId, title, message, type, metadata } = data || {};

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
            
            // Eğer sahaId veya santralId yoksa, tüm kullanıcılara gönder (rol bazlı)
            if (!sahaId && !santralId) {
              console.log(`   ✅ Saha/santral filtresi YOK - Bildirim gönderilecek`);
              return true;
            }
            
            const sahaOk = sahaId ? userSahalar.includes(sahaId) : true;
            const santralOk = santralId ? userSantraller.includes(santralId) : true;
            const result = sahaOk && santralOk;
            
            console.log(`   - Saha kontrolü: ${sahaOk ? '✅' : '❌'}`);
            console.log(`   - Santral kontrolü: ${santralOk ? '✅' : '❌'}`);
            console.log(`   - SONUÇ: ${result ? '✅ Bildirim gönderilecek' : '❌ Filtrelendi'}`);
            
            return result;
          });

          if (recipients.length === 0) {
            await snap.ref.update({ pushTriedAt: admin.firestore.FieldValue.serverTimestamp(), pushError: "fanout-no-recipients" });
            return null;
          }

          const deliveredUserIds: string[] = [];
          const errors: Array<{ userId: string; error: string }> = [];

          await Promise.all(recipients.map(async (uDoc) => {
            const u = uDoc.data() as any;
            const targetToken: string | undefined = u?.pushTokens?.fcm || u?.fcmToken;
            if (!targetToken) {
              errors.push({ userId: uDoc.id, error: "no-token" });
              return;
            }

            const screen = (metadata && ((metadata as any).screen || (metadata as any).deepLink)) || "/bildirimler";
            const payload: admin.messaging.Message = {
              token: targetToken,
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
            };

            try {
              console.log("📤 (fanout) FCM mesajı gönderiliyor...", { userId: uDoc.id, token: targetToken.substring(0, 20) + "..." });
              const res = await admin.messaging().send(payload);
              console.log("✅ (fanout) gönderildi", { userId: uDoc.id, messageId: res });
              deliveredUserIds.push(uDoc.id);
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

      const token: string | undefined = user?.pushTokens?.fcm || user?.fcmToken;
      console.log("🔑 FCM Token kontrolü:", { 
        hasPushTokens: !!user?.pushTokens, 
        hasFcm: !!user?.pushTokens?.fcm, 
        hasOldToken: !!user?.fcmToken,
        tokenLength: token?.length || 0 
      });
      
      if (!token) {
        console.error("❌ FCM Token yok:", { userId });
        await snap.ref.update({ pushTriedAt: admin.firestore.FieldValue.serverTimestamp(), pushError: "no-token" });
        return null;
      }

      const screen = (metadata && (metadata.screen || metadata.deepLink)) || "/bildirimler";

      const payload: admin.messaging.Message = {
        token,
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
      };

      console.log("📤 FCM mesajı gönderiliyor...", { 
        token: token.substring(0, 20) + "...", 
        title, 
        screen 
      });
      
      const res = await admin.messaging().send(payload);
      
      console.log("✅ FCM mesajı başarıyla gönderildi!", { messageId: res });
      
      await snap.ref.update({ 
        pushSentAt: admin.firestore.FieldValue.serverTimestamp(), 
        pushMessageId: res, 
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
      const santralId: string | undefined = metadata?.santralId;
      
      console.log(`📊 Toplam kullanıcı sayısı (companyId=${companyId}): ${snapshot.size}`);

      const recipients = snapshot.docs.filter((docSnap) => {
        const u = docSnap.data() as any;
        
        // Kullanıcının atandığı sahalar
        const userSahalar: string[] = Array.isArray(u.sahalar) ? u.sahalar : [];
        const userSantraller: string[] = Array.isArray(u.santraller) ? u.santraller : [];
        
        // Debug log
        console.log(`👤 Kullanıcı kontrolü: ${u.email || u.ad} (${u.rol})`);
        console.log(`   - Atandığı sahalar: ${userSahalar.join(', ') || 'YOK'}`);
        console.log(`   - Bildirim sahaId: ${sahaId || 'YOK'}`);
        
        // Saha kontrolü: Bildirimde sahaId varsa, kullanıcı o sahaya atanmış olmalı
        const sahaOk = sahaId ? userSahalar.includes(sahaId) : true;
        
        // Santral kontrolü: Bildirimde santralId varsa, kullanıcı o santrale atanmış olmalı
        const santralOk = santralId ? userSantraller.includes(santralId) : true;
        
        const result = sahaOk && santralOk;
        console.log(`   - Sonuç: ${result ? '✅ Bildirim gönderilecek' : '❌ Filtrelendi'}`);
        
        return result;
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