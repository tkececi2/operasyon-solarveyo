/**
 * Firebase Functions - Solarveyo Arıza Takip
 * Minimal Functions - Email devre dışı
 */

import * as functions from "firebase-functions";
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

      const recipients = snapshot.docs.filter((docSnap) => {
        const u = docSnap.data() as any;
        const role: string = u.rol;
        // Bekçi ve Müşteri sadece atandığı saha/santralde bildirim alır
        if (role === "bekci" || role === "musteri") {
          const userSahalar: string[] = Array.isArray(u.sahalar) ? u.sahalar : [];
          const userSantraller: string[] = Array.isArray(u.santraller) ? u.santraller : [];
          const sahaOk = sahaId ? userSahalar.includes(sahaId) : true;
          const santralOk = santralId ? userSantraller.includes(santralId) : true;
          return sahaOk && santralOk;
        }
        // Diğer roller: şirket içi tüm bildirimleri alır (opsiyonel roller ile sınırlandırılabilir)
        return true;
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