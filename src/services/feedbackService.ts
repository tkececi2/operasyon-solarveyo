import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as firestoreLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type FeedbackTargetType = 'ariza' | 'bakim' | 'envanter';

export interface Feedback {
  id: string;
  companyId: string;
  targetType: FeedbackTargetType;
  targetId: string;
  sahaId?: string;
  santralId?: string;
  parentId?: string; // üst yorum id'si (yanıtlar için)
  userId: string;
  userAd?: string;
  rating?: number; // 1..5
  comment?: string;
  likeCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Feedback oluştur
export const createFeedback = async (payload: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt' | 'likeCount' | 'status'> & { status?: Feedback['status'] }) => {
  const { sahaId, santralId, rating, comment, parentId, ...rest } = payload as any;
  const data = {
    ...rest,
    ...(sahaId ? { sahaId } : {}),
    ...(santralId ? { santralId } : {}),
    ...(parentId ? { parentId } : {}),
    ...(typeof rating === 'number' ? { rating } : {}),
    ...(comment ? { comment } : {}),
    likeCount: 0,
    status: 'approved',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as any;
  const ref = await addDoc(collection(db, 'feedback'), data);
  return ref.id;
};

// Listele (hedefe göre)
export const getFeedbackForTarget = async (
  companyId: string,
  targetType: FeedbackTargetType,
  targetId: string,
  max: number = 20
) => {
  // Şirket izolasyonu KRİTİK: companyId filtresi zorunlu
  // targetType filtresi eklenmedi; index ihtiyacını minimize etmek için targetId + createdAt ile sıralıyoruz.
  const q = query(
    collection(db, 'feedback'),
    where('companyId', '==', companyId),
    where('targetId', '==', targetId),
    orderBy('createdAt', 'desc'),
    firestoreLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Feedback[];
};

// Beğeni toggling: feedback/{id}/likes/{userId}
export const toggleLike = async (feedbackId: string, userId: string) => {
  const likeRef = doc(db, 'feedback', feedbackId, 'likes', userId);
  const fbRef = doc(db, 'feedback', feedbackId);
  const likeSnap = await getDoc(likeRef);

  const batch = writeBatch(db);
  if (likeSnap.exists()) {
    batch.delete(likeRef);
    batch.update(fbRef, { likeCount: increment(-1), updatedAt: serverTimestamp() });
  } else {
    batch.set(likeRef, { createdAt: serverTimestamp() });
    batch.update(fbRef, { likeCount: increment(1), updatedAt: serverTimestamp() });
  }
  await batch.commit();
};

// Yalnızca yönetici/superadmin için onay/ret
export const setFeedbackStatus = async (feedbackId: string, status: 'approved' | 'rejected') => {
  await updateDoc(doc(db, 'feedback', feedbackId), { status, updatedAt: serverTimestamp() });
};

// Kullanıcının aynı hedefe verdiği puanı getir (tek puan politikası için)
export const getUserFeedbackForTarget = async (
  companyId: string,
  userId: string,
  targetType: FeedbackTargetType,
  targetId: string
) => {
  const q = query(
    collection(db, 'feedback'),
    where('companyId', '==', companyId),
    where('userId', '==', userId),
    where('targetType', '==', targetType),
    where('targetId', '==', targetId),
    firestoreLimit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Feedback;
};

// Kullanıcının aynı tipte tüm geri bildirimlerini map olarak getir
export const getUserFeedbackMap = async (
  companyId: string,
  userId: string,
  targetType: FeedbackTargetType
) => {
  const q = query(
    collection(db, 'feedback'),
    where('companyId', '==', companyId),
    where('userId', '==', userId),
    where('targetType', '==', targetType)
  );
  const snap = await getDocs(q);
  const map: Record<string, Feedback> = {} as any;
  snap.forEach((d) => {
    const data = { id: d.id, ...(d.data() as any) } as Feedback;
    map[data.targetId] = data;
  });
  return map;
};

// Hızlı upsert: kullanıcı için hedefe ait feedback varsa güncelle, yoksa oluştur
export const upsertFeedbackForTarget = async (
  params: {
    companyId: string;
    userId: string;
    userAd?: string;
    targetType: FeedbackTargetType;
    targetId: string;
    sahaId?: string;
    santralId?: string;
    data: { rating?: number; comment?: string };
  }
) => {
  const { companyId, userId, userAd, targetType, targetId, sahaId, santralId, data } = params;
  const existing = await getUserFeedbackForTarget(companyId, userId, targetType, targetId);
  if (existing) {
    const upd: any = { updatedAt: serverTimestamp() };
    if (typeof data.rating === 'number') upd.rating = data.rating;
    if (data.comment) upd.comment = data.comment;
    await updateDoc(doc(db, 'feedback', existing.id), upd);
    return existing.id;
  }
  const ref = await addDoc(collection(db, 'feedback'), {
    companyId,
    userId,
    userAd,
    targetType,
    targetId,
    ...(sahaId ? { sahaId } : {}),
    ...(santralId ? { santralId } : {}),
    likeCount: 0,
    status: 'approved',
    ...(typeof data.rating === 'number' ? { rating: data.rating } : {}),
    ...(data.comment ? { comment: data.comment } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as any);
  return ref.id;
};

// Kullanıcının like durumlarını getir
export const getUserLikesForFeedbacks = async (feedbackIds: string[], userId: string) => {
  const result: Record<string, boolean> = {};
  await Promise.all(feedbackIds.map(async (fid) => {
    try {
      const likeRef = doc(db, 'feedback', fid, 'likes', userId);
      const snap = await getDoc(likeRef);
      result[fid] = snap.exists();
    } catch {
      result[fid] = false;
    }
  }));
  return result;
};

// Birden fazla hedef için özet (avg rating, count, likeCount)
// Feedback silme
export const deleteFeedback = async (feedbackId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'feedback', feedbackId));
  } catch (error) {
    console.error('Feedback silme hatası:', error);
    throw error;
  }
};

export const getFeedbackSummaryForTargets = async (
  companyId: string,
  targetType: FeedbackTargetType,
  targetIds: string[]
) => {
  const result: Record<string, { avg: number; count: number; likes: number }> = {};

  // Firestore 'in' 10 sınırı nedeniyle parça parça işlem veya tek tek sorgu
  const tasks = targetIds.map(async (tid) => {
    const q = query(
      collection(db, 'feedback'),
      where('companyId', '==', companyId),
      where('targetType', '==', targetType),
      where('targetId', '==', tid)
    );
    const snap = await getDocs(q);
    let sum = 0;
    let cnt = 0;
    let likes = 0;
    snap.forEach((d) => {
      const data = d.data() as any;
      if (typeof data.rating === 'number') {
        sum += data.rating;
        cnt += 1;
      }
      likes += Number(data.likeCount || 0);
    });
    result[tid] = { avg: cnt > 0 ? Number((sum / cnt).toFixed(1)) : 0, count: snap.size, likes };
  });

  await Promise.all(tasks);
  return result;
};


