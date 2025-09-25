import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

type Plan = any;

const CONFIG_DOC_PATH = ['config', 'saas_plans'] as const;

// Firebase'de plan yoksa boş obje döndür
const getEmptyStructure = () => ({});

// Firebase'den planları al (SuperAdmin'in belirlediği)
export const fetchRemotePlans = async (): Promise<Record<string, Plan> | null> => {
  try {
    const ref = doc(db, CONFIG_DOC_PATH[0], CONFIG_DOC_PATH[1]);
    const snap = await getDoc(ref);
    
    if (!snap.exists()) {
      // Plan yok - null döndür, otomatik oluşturma
      return null;
    }
    
    const data = snap.data() as any;
    return data?.PLANS || null;
  } catch (error) {
    console.error('Firebase plan okuma hatası:', error);
    return null;
  }
};

// Varsayılan planları al (eski uyumluluk için) - Artık boş döndürüyor
export const getDefaultPlans = (): Record<string, Plan> => {
  return getEmptyStructure();
};

// Planları birleştir - Sadece Firebase'den al
export const getMergedPlans = async (): Promise<Record<string, Plan>> => {
  const remotePlans = await fetchRemotePlans();
  
  if (!remotePlans) {
    // Firebase'de plan yok - boş obje döndür
    return getEmptyStructure();
  }
  
  // Firebase'de plan varsa onları kullan
  return remotePlans;
};

// Planları Firebase'e kaydet
export const savePlans = async (plans: Record<string, Plan>): Promise<void> => {
  const ref = doc(db, CONFIG_DOC_PATH[0], CONFIG_DOC_PATH[1]);
  await setDoc(ref, { PLANS: plans, updatedAt: new Date().toISOString() });
};

// Tek bir planı güncelle
export const updateSinglePlan = async (planId: string, partial: Partial<Plan>): Promise<Record<string, Plan>> => {
  const current = await getMergedPlans();
  const updatedPlan = {
    ...current[planId],
    ...partial
  };
  
  const updatedPlans = {
    ...current,
    [planId]: updatedPlan
  };
  
  await savePlans(updatedPlans);
  return updatedPlans;
};

// Canlı dinleme - SuperAdmin değişikliklerini anında yansıt
export const subscribeToMergedPlans = (
  listener: (plans: Record<string, Plan>) => void
): (() => void) => {
  const ref = doc(db, CONFIG_DOC_PATH[0], CONFIG_DOC_PATH[1]);
  
  try {
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          // Firebase'de veri yok - boş obje döndür
          listener(getEmptyStructure());
          return;
        }
        
        const data = snap.data() as any;
        const plans = data?.PLANS || getEmptyStructure();
        listener(plans);
      },
      (error) => {
        console.error('Plan dinleme hatası:', error);
        // Hata durumunda da boş obje döndür
        listener(getEmptyStructure());
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Plan dinleyici başlatılamadı:', error);
    // Başlatma hatası durumunda da boş obje döndür
    listener(getEmptyStructure());
    return () => {};
  }
};

// İlk kurulum - Artık otomatik plan oluşturma yok
export const initializePlans = async (): Promise<void> => {
  // Hiçbir şey yapma, SuperAdmin manuel oluşturacak
  console.log('Plan sistemi başlatıldı. SuperAdmin planları oluşturmalı.');
};