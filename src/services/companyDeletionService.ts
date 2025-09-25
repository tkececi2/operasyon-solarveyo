import { 
  collection, 
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch,
  DocumentData
} from 'firebase/firestore';
import { 
  ref, 
  listAll, 
  deleteObject,
  getStorage 
} from 'firebase/storage';
import { db } from '../lib/firebase';
import { logUserAction } from './auditLogService';
import { getDocs as getDocsFs } from 'firebase/firestore';

interface DeletionResult {
  success: boolean;
  deletedCounts: {
    users: number;
    santraller: number;
    sahalar: number;
    arizalar: number;
    elektrikBakimlar: number;
    mekanikBakimlar: number;
    stoklar: number;
    stokHareketleri: number;
    vardiyaBildirimleri: number;
    musteriler: number;
    uretimVerileri: number;
    storageFiles: number;
    subscription: number;
    auditLogs: number;
  };
  errors: string[];
}

/**
 * Şirkete ait TÜM verileri siler (CASCADE DELETE)
 * Bu işlem geri alınamaz!
 */
export const deleteCompanyCompletely = async (
  companyId: string,
  deletedBy: { userId: string; userEmail: string; userName: string }
): Promise<DeletionResult> => {
  console.log(`🗑️ ${companyId} şirketi ve tüm verileri siliniyor...`);
  
  const result: DeletionResult = {
    success: false,
    deletedCounts: {
      users: 0,
      santraller: 0,
      sahalar: 0,
      arizalar: 0,
      elektrikBakimlar: 0,
      mekanikBakimlar: 0,
      stoklar: 0,
      stokHareketleri: 0,
      vardiyaBildirimleri: 0,
      musteriler: 0,
      uretimVerileri: 0,
      storageFiles: 0,
      subscription: 0,
      auditLogs: 0
    },
    errors: []
  };
  
  try {
    // Yardımcı: bir collection'ı companyId ile toplu sil (batched)
    const deleteByCompany = async (collectionName: string, extraWhere?: { field: string; op: any; value: any }) => {
      try {
        let qBase = query(collection(db, collectionName), where('companyId', '==', companyId));
        if (extraWhere) {
          qBase = query(qBase, where(extraWhere.field, extraWhere.op, extraWhere.value));
        }
        const snap = await getDocs(qBase);
        let count = 0;
        let batch = writeBatch(db);
        let ops = 0;
        snap.forEach((d) => {
          batch.delete(d.ref);
          ops++; count++;
          if (ops >= 400) { (async()=>{ await batch.commit(); })(); batch = writeBatch(db); ops = 0; }
        });
        if (ops > 0) await batch.commit();
        return count;
      } catch (e) { result.errors.push(`${collectionName} silme hatası: ${e}`); return 0; }
    };

    // Yardımcı: feedback + likes alt koleksiyonlarını sil
    const deleteAllFeedbacks = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'feedback'), where('companyId', '==', companyId)));
        for (const d of snap.docs) {
          try {
            const likesSnap = await getDocs(collection(db, 'feedback', d.id, 'likes'));
            let batch = writeBatch(db); let ops = 0;
            likesSnap.forEach((l)=>{ batch.delete(l.ref); ops++; if (ops>=450){ (async()=>{await batch.commit();})(); batch=writeBatch(db); ops=0; } });
            if (ops>0) await batch.commit();
            await deleteDoc(doc(db, 'feedback', d.id));
          } catch (err) {
            result.errors.push(`Feedback silme hatası (${d.id}): ${err}`);
          }
        }
      } catch (err) {
        result.errors.push(`Feedback listeleme hatası: ${err}`);
      }
    };
    // 1. Önce şirket bilgisini al (log için)
    const companyDoc = await getDocs(query(collection(db, 'companies'), where('__name__', '==', companyId)));
    const companyData = companyDoc.docs[0]?.data();
    const companyName = companyData?.name || companyData?.ad || companyId;
    
    console.log(`📋 ${companyName} şirketinin verileri siliniyor...`);
    
    // 2. Kullanıcıları sil
    try {
      const usersQuery = query(collection(db, 'kullanicilar'), where('companyId', '==', companyId));
      const usersSnapshot = await getDocs(usersQuery);
      
      for (const userDoc of usersSnapshot.docs) {
        await deleteDoc(doc(db, 'kullanicilar', userDoc.id));
        result.deletedCounts.users++;
      }
      console.log(`✅ ${result.deletedCounts.users} kullanıcı silindi`);
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error);
      result.errors.push(`Kullanıcı silme hatası: ${error}`);
    }
    
    // 3. Santralleri ve alt verilerini sil
    try {
      const santrallerQuery = query(collection(db, 'santraller'), where('companyId', '==', companyId));
      const santrallerSnapshot = await getDocs(santrallerQuery);
      
      for (const santralDoc of santrallerSnapshot.docs) {
        // Santral alt koleksiyonlarını sil (aylikUretim, uretimVerileri)
        const aylikUretimRef = collection(db, 'santraller', santralDoc.id, 'aylikUretim');
        const aylikUretimSnapshot = await getDocs(aylikUretimRef);
        
        for (const aylikDoc of aylikUretimSnapshot.docs) {
          await deleteDoc(doc(db, 'santraller', santralDoc.id, 'aylikUretim', aylikDoc.id));
        }
        
        const uretimVerileriRef = collection(db, 'santraller', santralDoc.id, 'uretimVerileri');
        const uretimVerileriSnapshot = await getDocs(uretimVerileriRef);
        
        for (const uretimDoc of uretimVerileriSnapshot.docs) {
          await deleteDoc(doc(db, 'santraller', santralDoc.id, 'uretimVerileri', uretimDoc.id));
          result.deletedCounts.uretimVerileri++;
        }
        
        // Ana santral belgesini sil
        await deleteDoc(doc(db, 'santraller', santralDoc.id));
        result.deletedCounts.santraller++;
      }
      console.log(`✅ ${result.deletedCounts.santraller} santral silindi`);
    } catch (error) {
      console.error('Santral silme hatası:', error);
      result.errors.push(`Santral silme hatası: ${error}`);
    }
    
    // 4. Sahaları sil
    try {
      const sahalarQuery = query(collection(db, 'sahalar'), where('companyId', '==', companyId));
      const sahalarSnapshot = await getDocs(sahalarQuery);
      
      for (const sahaDoc of sahalarSnapshot.docs) {
        await deleteDoc(doc(db, 'sahalar', sahaDoc.id));
        result.deletedCounts.sahalar++;
      }
      console.log(`✅ ${result.deletedCounts.sahalar} saha silindi`);
    } catch (error) {
      console.error('Saha silme hatası:', error);
      result.errors.push(`Saha silme hatası: ${error}`);
    }
    
    // 5. Arızaları sil
    try {
      const arizalarQuery = query(collection(db, 'arizalar'), where('companyId', '==', companyId));
      const arizalarSnapshot = await getDocs(arizalarQuery);
      
      for (const arizaDoc of arizalarSnapshot.docs) {
        await deleteDoc(doc(db, 'arizalar', arizaDoc.id));
        result.deletedCounts.arizalar++;
      }
      console.log(`✅ ${result.deletedCounts.arizalar} arıza kaydı silindi`);
    } catch (error) {
      console.error('Arıza silme hatası:', error);
      result.errors.push(`Arıza silme hatası: ${error}`);
    }

    // 5.b Elektrik kesintilerini sil
    try {
      await deleteByCompany('elektrikKesintileri');
    } catch (_) {}
    
    // 6. Bakım kayıtlarını sil
    try {
      // Elektrik bakımları
      const elektrikBakimlarQuery = query(collection(db, 'elektrikBakimlar'), where('companyId', '==', companyId));
      const elektrikBakimlarSnapshot = await getDocs(elektrikBakimlarQuery);
      
      for (const bakimDoc of elektrikBakimlarSnapshot.docs) {
        await deleteDoc(doc(db, 'elektrikBakimlar', bakimDoc.id));
        result.deletedCounts.elektrikBakimlar++;
      }
      
      // Mekanik bakımları
      const mekanikBakimlarQuery = query(collection(db, 'mekanikBakimlar'), where('companyId', '==', companyId));
      const mekanikBakimlarSnapshot = await getDocs(mekanikBakimlarQuery);
      
      for (const bakimDoc of mekanikBakimlarSnapshot.docs) {
        await deleteDoc(doc(db, 'mekanikBakimlar', bakimDoc.id));
        result.deletedCounts.mekanikBakimlar++;
      }
      console.log(`✅ ${result.deletedCounts.elektrikBakimlar + result.deletedCounts.mekanikBakimlar} bakım kaydı silindi`);
    } catch (error) {
      console.error('Bakım silme hatası:', error);
      result.errors.push(`Bakım silme hatası: ${error}`);
    }
    
    // 7. Stok kayıtlarını sil
    try {
      const stoklarQuery = query(collection(db, 'stoklar'), where('companyId', '==', companyId));
      const stoklarSnapshot = await getDocs(stoklarQuery);
      
      for (const stokDoc of stoklarSnapshot.docs) {
        await deleteDoc(doc(db, 'stoklar', stokDoc.id));
        result.deletedCounts.stoklar++;
      }
      
      // Stok hareketleri
      const stokHareketleriQuery = query(collection(db, 'stokHareketleri'), where('companyId', '==', companyId));
      const stokHareketleriSnapshot = await getDocs(stokHareketleriQuery);
      
      for (const hareketDoc of stokHareketleriSnapshot.docs) {
        await deleteDoc(doc(db, 'stokHareketleri', hareketDoc.id));
        result.deletedCounts.stokHareketleri++;
      }
      console.log(`✅ ${result.deletedCounts.stoklar} stok, ${result.deletedCounts.stokHareketleri} hareket silindi`);
    } catch (error) {
      console.error('Stok silme hatası:', error);
      result.errors.push(`Stok silme hatası: ${error}`);
    }
    
    // 8. Vardiya bildirimlerini sil
    try {
      const vardiyaQuery = query(collection(db, 'vardiyaBildirimleri'), where('companyId', '==', companyId));
      const vardiyaSnapshot = await getDocs(vardiyaQuery);
      
      for (const vardiyaDoc of vardiyaSnapshot.docs) {
        await deleteDoc(doc(db, 'vardiyaBildirimleri', vardiyaDoc.id));
        result.deletedCounts.vardiyaBildirimleri++;
      }
      console.log(`✅ ${result.deletedCounts.vardiyaBildirimleri} vardiya bildirimi silindi`);
    } catch (error) {
      console.error('Vardiya silme hatası:', error);
      result.errors.push(`Vardiya silme hatası: ${error}`);
    }
    
    // 8.b Envanterleri sil
    try {
      await deleteByCompany('envanterler');
      // Eksik companyId alanı olan eski kayıtlar için sahaId/santralId üzerinden temizlik
      try {
        const sahalarSnap = await getDocs(query(collection(db, 'sahalar'), where('companyId', '==', companyId)));
        const santrallerSnap = await getDocs(query(collection(db, 'santraller'), where('companyId', '==', companyId)));
        const sahaIds = sahalarSnap.docs.map(d=>d.id);
        const santralIds = santrallerSnap.docs.map(d=>d.id);
        const chunk = <T,>(arr: T[], n: number) => {
          const out: T[][] = []; for (let i=0;i<arr.length;i+=n) out.push(arr.slice(i, i+n)); return out;
        };
        const seen = new Set<string>();
        // sahaId üzerinden
        for (const group of chunk(sahaIds, 10)) {
          if (group.length === 0) continue;
          const snap = await getDocs(query(collection(db, 'envanterler'), where('sahaId', 'in', group)) as any);
          let batch = writeBatch(db); let ops = 0;
          snap.forEach(d=>{ if (seen.has(d.id)) return; batch.delete(d.ref); seen.add(d.id); ops++; if (ops>=450){ (async()=>{await batch.commit();})(); batch=writeBatch(db); ops=0;} });
          if (ops>0) await batch.commit();
        }
        // santralId üzerinden
        for (const group of chunk(santralIds, 10)) {
          if (group.length === 0) continue;
          const snap = await getDocs(query(collection(db, 'envanterler'), where('santralId', 'in', group)) as any);
          let batch = writeBatch(db); let ops = 0;
          snap.forEach(d=>{ if (seen.has(d.id)) return; batch.delete(d.ref); seen.add(d.id); ops++; if (ops>=450){ (async()=>{await batch.commit();})(); batch=writeBatch(db); ops=0;} });
          if (ops>0) await batch.commit();
        }
      } catch (fallbackErr) {
        console.warn('Envanter fallback temizliği sırasında uyarı:', fallbackErr);
      }
    } catch (_) {}

    // 8.c Yapılan işler
    try { await deleteByCompany('yapilanIsler'); } catch (_) {}

    // 8.d Notifications (in-app)
    try { await deleteByCompany('notifications'); } catch (_) {}

    // 8.e Feedback + likes
    await deleteAllFeedbacks();

    // 9. Müşterileri sil
    try {
      const musterilerQuery = query(collection(db, 'musteriler'), where('companyId', '==', companyId));
      const musterilerSnapshot = await getDocs(musterilerQuery);
      
      for (const musteriDoc of musterilerSnapshot.docs) {
        await deleteDoc(doc(db, 'musteriler', musteriDoc.id));
        result.deletedCounts.musteriler++;
      }
      console.log(`✅ ${result.deletedCounts.musteriler} müşteri silindi`);
    } catch (error) {
      console.error('Müşteri silme hatası:', error);
      result.errors.push(`Müşteri silme hatası: ${error}`);
    }
    
    // 10. Storage'daki dosyaları sil (resimler, PDF'ler vb.)
    try {
      const storage = getStorage();
      const companyStorageRef = ref(storage, `companies/${companyId}`);
      
      // Rekürsif silme yardımcı fonksiyonu
      const deleteFolderRecursive = async (folderRef: any): Promise<number> => {
        let count = 0;
        const res = await listAll(folderRef);
        for (const item of res.items) {
          try { await deleteObject(item); count++; } catch (e) { result.errors.push(`Storage dosya silinemedi: ${item.fullPath} - ${e}`); }
        }
        for (const prefix of res.prefixes) {
          count += await deleteFolderRecursive(prefix);
        }
        return count;
      };

      const deleted = await deleteFolderRecursive(companyStorageRef);
      result.deletedCounts.storageFiles += deleted;
      console.log(`✅ Storage temizlendi: ${deleted} dosya silindi`);
    } catch (error) {
      console.error('Storage silme hatası:', error);
      result.errors.push(`Storage silme hatası: ${error}`);
    }
    
    // 11. Abonelik ve istekleri sil
    try {
      await deleteDoc(doc(db, 'subscriptions', companyId));
      result.deletedCounts.subscription = 1;
      console.log(`✅ Abonelik bilgisi silindi`);
    } catch (error) {
      console.error('Abonelik silme hatası:', error);
      result.errors.push(`Abonelik silme hatası: ${error}`);
    }

    try {
      // Plan yükseltme talepleri
      await deleteByCompany('subscriptionUpgradeRequests');
    } catch (_) {}
    
    // 12. Audit loglarını sil (opsiyonel - saklamak isteyebilirsiniz)
    try {
      const auditLogsQuery = query(collection(db, 'auditLogs'), where('companyId', '==', companyId));
      const auditLogsSnapshot = await getDocs(auditLogsQuery);
      
      for (const logDoc of auditLogsSnapshot.docs) {
        await deleteDoc(doc(db, 'auditLogs', logDoc.id));
        result.deletedCounts.auditLogs++;
      }
      console.log(`✅ ${result.deletedCounts.auditLogs} audit log silindi`);
    } catch (error) {
      console.error('Audit log silme hatası:', error);
      // Audit log silme hatası kritik değil, devam et
    }

    // 12.b Admin activity logs (hedef şirket)
    try {
      const adminLogsQuery = query(collection(db, 'adminActivityLogs'), where('targetCompanyId', '==', companyId));
      const logsSnap = await getDocs(adminLogsQuery);
      let batch = writeBatch(db); let ops = 0;
      logsSnap.forEach((d)=>{ batch.delete(d.ref); ops++; if (ops>=450){ (async()=>{await batch.commit();})(); batch=writeBatch(db); ops=0; } });
      if (ops>0) await batch.commit();
    } catch (error) {
      console.error('Admin log silme hatası:', error);
    }

    // 12.c Leave (izin) yapıları
    try { await deleteByCompany('leaveRequests'); } catch (_) {}
    try { await deleteByCompany('leaveBalances'); } catch (_) {}
    try { await deleteByCompany('leaveTransactions'); } catch (_) {}
    try { await deleteByCompany('leaveYears'); } catch (_) {}
    try { await deleteByCompany('employeeLeaveProfiles'); } catch (_) {}
    try { await deleteByCompany('leaveRules'); } catch (_) {}
    try { await deleteByCompany('holidays'); } catch (_) {}
    try { await deleteByCompany('shiftSchedules'); } catch (_) {}

    // 12.d Backups + backupLogs
    try {
      const backupsSnap = await getDocs(query(collection(db, 'backups'), where('companyId', '==', companyId)));
      for (const b of backupsSnap.docs) {
        try {
          // Storage: backups/<companyId>/<backupId>.json
          const storage = getStorage();
          const path = `backups/${companyId}/${(b.data() as any).id || b.id}.json`;
          await deleteObject(ref(storage, path));
        } catch (_) {}
        await deleteDoc(b.ref);
      }
      // İlgili backupLogs kayıtları
      const logsSnap = await getDocs(query(collection(db, 'backupLogs')));
      let batch = writeBatch(db); let ops = 0;
      logsSnap.forEach((d)=>{ const data = d.data() as any; if ((data.backupId||'').includes(companyId)) { batch.delete(d.ref); ops++; if (ops>=450){ (async()=>{await batch.commit();})(); batch=writeBatch(db); ops=0; } } });
      if (ops>0) await batch.commit();
    } catch (error) {
      console.error('Backup kayıtları silinemedi:', error);
    }
    
    // 13. Son olarak şirket belgesini sil
    await deleteDoc(doc(db, 'companies', companyId));
    
    // 14. Silme işlemini logla
    await logUserAction({
      action: 'company.delete.complete',
      resource: 'company',
      resourceId: companyId,
      details: {
        companyName,
        deletedCounts: result.deletedCounts,
        deletedBy: deletedBy.userName,
        timestamp: new Date().toISOString()
      },
      severity: 'critical',
      userId: deletedBy.userId,
      userEmail: deletedBy.userEmail,
      userName: deletedBy.userName
    });
    
    result.success = true;
    
    console.log(`
    ✅ ${companyName} şirketi tamamen silindi!
    📊 Silinen veriler:
    - ${result.deletedCounts.users} kullanıcı
    - ${result.deletedCounts.santraller} santral
    - ${result.deletedCounts.sahalar} saha
    - ${result.deletedCounts.arizalar} arıza
    - ${result.deletedCounts.elektrikBakimlar + result.deletedCounts.mekanikBakimlar} bakım
    - ${result.deletedCounts.stoklar} stok
    - ${result.deletedCounts.vardiyaBildirimleri} vardiya
    - ${result.deletedCounts.musteriler} müşteri
    - ${result.deletedCounts.storageFiles} dosya
    - ${result.deletedCounts.auditLogs} log
    `);
    
    return result;
  } catch (error) {
    console.error('❌ Şirket silme hatası:', error);
    result.errors.push(`Genel hata: ${error}`);
    return result;
  }
};

/**
 * Şirket silinmeden önce veri özeti al
 */
export const getCompanyDeletionSummary = async (companyId: string): Promise<{
  companyName: string;
  dataCounts: DeletionResult['deletedCounts'];
  storageSize: number;
}> => {
  try {
    // Şirket bilgisi
    const companyDoc = await getDocs(query(collection(db, 'companies'), where('__name__', '==', companyId)));
    const companyData = companyDoc.docs[0]?.data();
    const companyName = companyData?.name || companyData?.ad || companyId;
    
    // Veri sayıları
    const usersCount = (await getDocs(query(collection(db, 'kullanicilar'), where('companyId', '==', companyId)))).size;
    const santrallerCount = (await getDocs(query(collection(db, 'santraller'), where('companyId', '==', companyId)))).size;
    const sahalarCount = (await getDocs(query(collection(db, 'sahalar'), where('companyId', '==', companyId)))).size;
    const arizalarCount = (await getDocs(query(collection(db, 'arizalar'), where('companyId', '==', companyId)))).size;
    const elektrikBakimlarCount = (await getDocs(query(collection(db, 'elektrikBakimlar'), where('companyId', '==', companyId)))).size;
    const mekanikBakimlarCount = (await getDocs(query(collection(db, 'mekanikBakimlar'), where('companyId', '==', companyId)))).size;
    const stoklarCount = (await getDocs(query(collection(db, 'stoklar'), where('companyId', '==', companyId)))).size;
    const stokHareketleriCount = (await getDocs(query(collection(db, 'stokHareketleri'), where('companyId', '==', companyId)))).size;
    const vardiyaBildirimleriCount = (await getDocs(query(collection(db, 'vardiyaBildirimleri'), where('companyId', '==', companyId)))).size;
    const musterilerCount = (await getDocs(query(collection(db, 'musteriler'), where('companyId', '==', companyId)))).size;
    
    // Storage boyutu
    const storage = getStorage();
    const companyStorageRef = ref(storage, `companies/${companyId}`);
    let storageSize = 0;
    let storageFiles = 0;
    
    try {
      const listResult = await listAll(companyStorageRef);
      storageFiles = listResult.items.length;
      
      // Alt klasörleri say
      for (const folderRef of listResult.prefixes) {
        const subListResult = await listAll(folderRef);
        storageFiles += subListResult.items.length;
      }
    } catch (error) {
      console.log('Storage bilgisi alınamadı:', error);
    }
    
    return {
      companyName,
      dataCounts: {
        users: usersCount,
        santraller: santrallerCount,
        sahalar: sahalarCount,
        arizalar: arizalarCount,
        elektrikBakimlar: elektrikBakimlarCount,
        mekanikBakimlar: mekanikBakimlarCount,
        stoklar: stoklarCount,
        stokHareketleri: stokHareketleriCount,
        vardiyaBildirimleri: vardiyaBildirimleriCount,
        musteriler: musterilerCount,
        uretimVerileri: 0, // Hesaplanması zor, şimdilik 0
        storageFiles,
        subscription: 1,
        auditLogs: 0
      },
      storageSize: companyData?.storageUsed || 0
    };
  } catch (error) {
    console.error('Silme özeti alınamadı:', error);
    throw error;
  }
};
