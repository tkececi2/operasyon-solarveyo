import { addDoc, collection, Timestamp, getDocs, query, orderBy, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createNotification } from './notificationService';
import { updateCompanySubscription } from './superAdminService';

export interface UpgradeRequest {
  companyId: string;
  companyName?: string;
  requestedPlanId: string; // SAAS_CONFIG plan id
  currentPlanId?: string;
  requestedBy: {
    id: string;
    name?: string;
    email?: string;
  };
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any; // Firestore Timestamp
}

export const createUpgradeRequest = async (payload: Omit<UpgradeRequest, 'status' | 'createdAt'>) => {
  const data: UpgradeRequest = {
    ...payload,
    status: 'pending',
    createdAt: Timestamp.now()
  };
  const ref = await addDoc(collection(db, 'subscriptionUpgradeRequests'), data as any);

  // SuperAdmin'e görünür genel bildirim
  await createNotification({
    companyId: payload.companyId,
    title: 'Plan Yükseltme Talebi',
    message: `${payload.companyName || payload.companyId} → ${payload.requestedPlanId}`,
    type: 'info',
    actionUrl: '/admin/subscriptions',
    metadata: { requestId: ref.id, requestedPlanId: payload.requestedPlanId, currentPlanId: payload.currentPlanId, targetRoles: ['yonetici','superadmin'] }
  });

  return ref.id;
};

export const listUpgradeRequests = async (
  status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending',
  max: number = 100
) => {
  const base = collection(db, 'subscriptionUpgradeRequests');
  // Composite index gereksinimini önlemek için: status filtrele, sıralamayı client tarafında yap
  const q = status === 'all' ? query(base) : query(base, where('status', '==', status));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as any) }))
    .sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
      return tb - ta; // desc
    })
    .slice(0, max);
};

export const approveUpgradeRequest = async (
  requestId: string,
  admin: { id: string; name?: string }
) => {
  const ref = doc(db, 'subscriptionUpgradeRequests', requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Talep bulunamadı');
  const data = snap.data() as any;

  // Şirket planını güncelle
  await updateCompanySubscription(data.companyId, data.requestedPlanId, admin.id, admin.name || 'SuperAdmin');

  // Talebi onayla
  await updateDoc(ref, {
    status: 'approved',
    approvedAt: Timestamp.now(),
    approvedBy: { id: admin.id, name: admin.name || 'SuperAdmin' }
  } as any);

  // Şirkete bildirim gönder
  await createNotification({
    companyId: data.companyId,
    title: 'Plan Yükseltme Onaylandı',
    message: `Talep edilen plan aktifleştirildi: ${data.requestedPlanId}`,
    type: 'success',
    actionUrl: '/subscription',
    metadata: { requestId, targetRoles: ['yonetici','superadmin'] }
  });
};

export const rejectUpgradeRequest = async (
  requestId: string,
  admin: { id: string; name?: string },
  reason?: string
) => {
  const ref = doc(db, 'subscriptionUpgradeRequests', requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Talep bulunamadı');

  await updateDoc(ref, {
    status: 'rejected',
    rejectedAt: Timestamp.now(),
    rejectedBy: { id: admin.id, name: admin.name || 'SuperAdmin' },
    rejectReason: reason || ''
  } as any);
};
