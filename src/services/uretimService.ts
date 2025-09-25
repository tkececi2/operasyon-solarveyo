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
  limit as firestoreLimit,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ProductionData, InverterControl, PowerOutage } from '../types';

// Üretim verisi oluşturma
export const createProductionData = async (
  productionData: Omit<ProductionData, 'id' | 'olusturmaTarihi'>
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const newProduction = {
      ...productionData,
      olusturmaTarihi: now,
    };

    const docRef = await addDoc(collection(db, 'uretimVerileri'), newProduction);
    return docRef.id;
  } catch (error) {
    console.error('Üretim verisi oluşturma hatası:', error);
    throw error;
  }
};

// Üretim verisi güncelleme
export const updateProductionData = async (
  productionId: string,
  updates: Partial<ProductionData>
): Promise<void> => {
  try {
    const productionRef = doc(db, 'uretimVerileri', productionId);
    await updateDoc(productionRef, updates);
  } catch (error) {
    console.error('Üretim verisi güncelleme hatası:', error);
    throw error;
  }
};

// Üretim verilerini getirme
export const getProductionData = async (
  companyId: string,
  santralId?: string,
  startDate?: Date,
  endDate?: Date,
  limit?: number
): Promise<ProductionData[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('companyId', '==', companyId),
      orderBy('tarih', 'desc')
    ];

    if (santralId) {
      constraints.splice(-1, 0, where('santralId', '==', santralId));
    }

    if (startDate) {
      constraints.splice(-1, 0, where('tarih', '>=', Timestamp.fromDate(startDate)));
    }

    if (endDate) {
      constraints.splice(-1, 0, where('tarih', '<=', Timestamp.fromDate(endDate)));
    }

    if (limit) {
      constraints.push(firestoreLimit(limit));
    }

    const q = query(collection(db, 'uretimVerileri'), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ProductionData[];
  } catch (error) {
    console.error('Üretim verileri getirme hatası:', error);
    throw error;
  }
};

// Günlük üretim özeti
export const getDailyProductionSummary = async (
  companyId: string,
  date: Date
) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const productionData = await getProductionData(
      companyId,
      undefined,
      startOfDay,
      endOfDay
    );

    const summary = {
      toplamUretim: productionData.reduce((sum, data) => sum + (data.gunlukUretim || 0), 0),
      toplamGelir: productionData.reduce((sum, data) => sum + (data.gelir || 0), 0),
      ortalamaPower: productionData.length > 0 
        ? productionData.reduce((sum, data) => sum + (data.anlikGuc || 0), 0) / productionData.length 
        : 0,
      ortalamaPerformans: productionData.length > 0 
        ? productionData.reduce((sum, data) => sum + (data.performansOrani || 0), 0) / productionData.length 
        : 0,
      toplamCO2Tasarrufu: productionData.reduce((sum, data) => sum + (data.tasarrufEdilenCO2 || 0), 0),
      santralSayisi: new Set(productionData.map(data => data.santralId)).size,
      veriSayisi: productionData.length
    };

    return summary;
  } catch (error) {
    console.error('Günlük üretim özeti getirme hatası:', error);
    throw error;
  }
};

// İnvertör kontrolü oluşturma
export const createInverterControl = async (
  controlData: Omit<InverterControl, 'id' | 'olusturmaTarihi'>,
  photos?: File[]
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const newControl = {
      ...controlData,
      olusturmaTarihi: now,
    };

    const docRef = await addDoc(collection(db, 'invertorKontroller'), newControl);
    return docRef.id;
  } catch (error) {
    console.error('İnvertör kontrolü oluşturma hatası:', error);
    throw error;
  }
};

// Performans anomali tespiti
export const detectPerformanceAnomalies = async (
  companyId: string,
  santralId: string,
  days: number = 30
) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const productionData = await getProductionData(
      companyId,
      santralId,
      startDate,
      endDate
    );

    if (productionData.length === 0) {
      return { anomalies: [], averagePerformance: 0 };
    }

    // Ortalama performansı hesapla
    const averagePerformance = productionData.reduce((sum, data) => sum + (data.performansOrani || 0), 0) / productionData.length;
    
    // Standart sapmayı hesapla
    const variance = productionData.reduce((sum, data) => {
      const diff = (data.performansOrani || 0) - averagePerformance;
      return sum + (diff * diff);
    }, 0) / productionData.length;
    const standardDeviation = Math.sqrt(variance);

    // Anomalileri tespit et (2 standart sapma altında)
    const threshold = averagePerformance - (2 * standardDeviation);
    
    const anomalies = productionData.filter(data => 
      (data.performansOrani || 0) < threshold
    ).map(data => ({
      ...data,
      anomalyType: 'low_performance',
      expectedPerformance: averagePerformance,
      actualPerformance: data.performansOrani || 0,
      deviation: averagePerformance - (data.performansOrani || 0),
      severity: (data.performansOrani || 0) < (averagePerformance - 3 * standardDeviation) ? 'high' : 'medium'
    }));

    return {
      anomalies,
      averagePerformance,
      standardDeviation,
      threshold,
      totalDataPoints: productionData.length
    };
  } catch (error) {
    console.error('Performans anomali tespiti hatası:', error);
    throw error;
  }
};

export const uretimService = {
  createProductionData,
  updateProductionData,
  getProductionData,
  getDailyProductionSummary,
  createInverterControl,
  detectPerformanceAnomalies
};