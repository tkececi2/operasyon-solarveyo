import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createNotificationWithEmail } from './notificationService';
import { notificationService } from './notificationService';
import type { PowerOutage } from '../types';

// Elektrik kesintisi oluşturma
export const createPowerOutage = async (
  outageData: Omit<PowerOutage, 'id' | 'olusturmaTarihi'>
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const newOutage = {
      ...outageData,
      olusturmaTarihi: now
    };

    const docRef = await addDoc(collection(db, 'elektrikKesintileri'), newOutage);
    
    // Bildirim (scoped) + Email (opsiyonel)
    try {
      await notificationService.createScopedNotificationClient({
        companyId: outageData.companyId,
        title: '⚠️ Elektrik Kesintisi',
        message: outageData.neden 
          ? `${outageData.saha || 'Saha'} - ${outageData.neden}` 
          : `${outageData.saha || 'Saha'} - Elektrik kesintisi bildirildi.`,
        type: 'error',
        actionUrl: '/arizalar/elektrik-kesintileri',
        metadata: { 
          outageId: docRef.id, 
          sahaId: outageData.sahaId, 
          santralId: outageData.santralId,
          targetType: 'outage',
          targetId: docRef.id,
          sahaAdi: outageData.saha
        },
        roles: ['yonetici','muhendis','tekniker','bekci','musteri']
      });
    } catch (err) { /* ignore */ }

    return docRef.id;
  } catch (error) {
    console.error('Elektrik kesintisi oluşturma hatası:', error);
    throw error;
  }
};

// Elektrik kesintisi güncelleme
export const updatePowerOutage = async (
  outageId: string,
  updates: Partial<PowerOutage>
): Promise<void> => {
  try {
    const outageRef = doc(db, 'elektrikKesintileri', outageId);
    
    // Eğer bitiş tarihi güncelleniyor ve başlangıç tarihi varsa, süreyi hesapla
    if (updates.bitisTarihi && !updates.sure) {
      const outageDoc = await getDoc(outageRef);
      if (outageDoc.exists()) {
        const outageData = outageDoc.data() as PowerOutage;
        const baslangic = outageData.baslangicTarihi.toDate();
        const bitis = updates.bitisTarihi.toDate();
        const sureDakika = Math.floor((bitis.getTime() - baslangic.getTime()) / (1000 * 60));
        updates.sure = sureDakika;
        
      }
    }
    
    await updateDoc(outageRef, updates);
  } catch (error) {
    console.error('Elektrik kesintisi güncelleme hatası:', error);
    throw error;
  }
};

// Elektrik kesintisi silme
export const deletePowerOutage = async (outageId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'elektrikKesintileri', outageId));
  } catch (error) {
    console.error('Elektrik kesintisi silme hatası:', error);
    throw error;
  }
};

// Tek elektrik kesintisi getirme
export const getPowerOutage = async (outageId: string): Promise<PowerOutage | null> => {
  try {
    const outageDoc = await getDoc(doc(db, 'elektrikKesintileri', outageId));
    
    if (outageDoc.exists()) {
      return { id: outageDoc.id, ...outageDoc.data() } as PowerOutage;
    }
    
    return null;
  } catch (error) {
    console.error('Elektrik kesintisi getirme hatası:', error);
    throw error;
  }
};

// Elektrik kesintileri listesi getirme
export interface GetPowerOutagesOptions {
  companyId: string;
  sahaId?: string;
  baslangicTarihi?: Date;
  bitisTarihi?: Date;
  devamEdenler?: boolean;
  userRole?: string;
  userSahalar?: string[];
  userSantraller?: string[];
}

export const getPowerOutages = async (options: GetPowerOutagesOptions) => {
  try {
    const { companyId, sahaId, baslangicTarihi, bitisTarihi, devamEdenler, userRole, userSahalar, userSantraller } = options;

    const constraints: QueryConstraint[] = [
      where('companyId', '==', companyId),
      orderBy('baslangicTarihi', 'desc')
    ];

    // Filtreler
    if (sahaId) {
      constraints.splice(-1, 0, where('sahaId', '==', sahaId));
    }

    if (baslangicTarihi) {
      constraints.splice(-1, 0, where('baslangicTarihi', '>=', Timestamp.fromDate(baslangicTarihi)));
    }

    if (bitisTarihi) {
      constraints.splice(-1, 0, where('baslangicTarihi', '<=', Timestamp.fromDate(bitisTarihi)));
    }

    const q = query(collection(db, 'elektrikKesintileri'), ...constraints);
    const querySnapshot = await getDocs(q);

    let outages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PowerOutage[];

    // Devam eden kesintileri filtrele
    if (devamEdenler) {
      outages = outages.filter(outage => !outage.bitisTarihi);
    }

    // Rol bazlı görünürlük: musteri/tekniker/muhendis/bekci -> yalnız atanan saha/santral
    if (userRole === 'musteri' || userRole === 'tekniker' || userRole === 'muhendis' || userRole === 'bekci') {
      const allowedSahalar = Array.isArray(userSahalar) ? userSahalar : [];
      const allowedSantraller = Array.isArray(userSantraller) ? userSantraller : [];
      outages = outages.filter(o => {
        const sahaMatch = o.sahaId ? allowedSahalar.includes(o.sahaId as any) : false;
        const santralMatch = (o as any).santralId ? allowedSantraller.includes((o as any).santralId) : false;
        return sahaMatch || santralMatch;
      });
    }

    return outages;
  } catch (error) {
    console.error('Elektrik kesintileri listesi getirme hatası:', error);
    throw error;
  }
};

// Elektrik kesintisi istatistikleri
export const getPowerOutageStatistics = async (companyId: string, year?: number) => {
  try {
    const constraints: QueryConstraint[] = [
      where('companyId', '==', companyId)
    ];

    // Yıl filtresi
    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      constraints.push(
        where('baslangicTarihi', '>=', Timestamp.fromDate(startOfYear)),
        where('baslangicTarihi', '<=', Timestamp.fromDate(endOfYear))
      );
    }

    let outages: PowerOutage[] = [];
    try {
      const q = query(collection(db, 'elektrikKesintileri'), ...constraints);
      const querySnapshot = await getDocs(q);
      outages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PowerOutage[];
    } catch (err: any) {
      const message: string = (err && err.message) || '';
      // Index hazır değilse geçici olarak companyId ile çekip tarihe göre bellekte filtrele
      if (message.includes('requires an index') || (err && err.code === 'failed-precondition')) {
        const fallbackQ = query(collection(db, 'elektrikKesintileri'), where('companyId', '==', companyId));
        const snap = await getDocs(fallbackQ);
        let all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PowerOutage[];
        if (year) {
          const startOfYear = new Date(year, 0, 1);
          const endOfYear = new Date(year, 11, 31, 23, 59, 59);
          all = all.filter(o => {
            const t = (o.baslangicTarihi as any)?.toDate ? (o.baslangicTarihi as any).toDate() : new Date(o.baslangicTarihi as any);
            return t >= startOfYear && t <= endOfYear;
          });
        }
        outages = all;
        console.warn('Index yok, geçici bellek filtresi kullanıldı. Lütfen Firestore index oluşturun.');
      } else {
        throw err;
      }
    }

    // İstatistikleri hesapla
    const toplamKesinti = outages.length;
    const devamEdenKesinti = outages.filter(o => !o.bitisTarihi).length;
    const toplamSure = outages.reduce((sum, o) => sum + (o.sure || 0), 0);
    const toplamKayipUretim = outages.reduce((sum, o) => sum + (o.kayilanUretim || 0), 0);
    const toplamKayipGelir = outages.reduce((sum, o) => sum + (o.kayilanGelir || 0), 0);

    // Saha bazlı istatistikler
    const sahaBazliIstatistik = outages.reduce((acc, outage) => {
      if (!acc[outage.sahaId]) {
        acc[outage.sahaId] = {
          kesintisayisi: 0,
          toplamSure: 0,
          kayipUretim: 0,
          kayipGelir: 0
        };
      }
      acc[outage.sahaId].kesintisayisi++;
      acc[outage.sahaId].toplamSure += outage.sure || 0;
      acc[outage.sahaId].kayipUretim += outage.kayilanUretim || 0;
      acc[outage.sahaId].kayipGelir += outage.kayilanGelir || 0;
      return acc;
    }, {} as Record<string, any>);

    // Neden bazlı istatistikler
    const nedenBazliIstatistik = outages.reduce((acc, outage) => {
      const neden = outage.neden || 'Belirtilmemiş';
      if (!acc[neden]) {
        acc[neden] = 0;
      }
      acc[neden]++;
      return acc;
    }, {} as Record<string, number>);

    return {
      toplamKesinti,
      devamEdenKesinti,
      toplamSure,
      toplamKayipUretim,
      toplamKayipGelir,
      ortalamaSure: toplamKesinti > 0 ? Math.round(toplamSure / toplamKesinti) : 0,
      sahaBazliIstatistik,
      nedenBazliIstatistik
    };
  } catch (error) {
    console.error('Elektrik kesintisi istatistikleri getirme hatası:', error);
    throw error;
  }
};

// Saha bazlı elektrik kesintileri
export const getSahaPowerOutages = async (
  companyId: string,
  sahaId: string,
  limit?: number
) => {
  try {
    const constraints: QueryConstraint[] = [
      where('companyId', '==', companyId),
      where('sahaId', '==', sahaId),
      orderBy('baslangicTarihi', 'desc')
    ];

    if (limit) {
      constraints.push(limit as any);
    }

    const q = query(collection(db, 'elektrikKesintileri'), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PowerOutage[];
  } catch (error) {
    console.error('Saha elektrik kesintileri getirme hatası:', error);
    throw error;
  }
};

// Elektrik kesintisi servisi objesi
export const elektrikKesintiService = {
  createPowerOutage,
  getPowerOutages,
  getPowerOutage,
  updatePowerOutage,
  deletePowerOutage,
  getSahaPowerOutages,
  getPowerOutageStatistics
};
