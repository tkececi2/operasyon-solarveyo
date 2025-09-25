import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type LiveActivityType =
  | 'stok-hareketi'
  | 'vardiya'
  | 'ariza'
  | 'bakim-elektrik'
  | 'bakim-mekanik';

export interface LiveActivityItemMeta {
  sahaId?: string;
  santralId?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface LiveActivityItem {
  id: string;
  type: LiveActivityType;
  title: string;
  description?: string;
  createdAt: Date;
  meta?: LiveActivityItemMeta;
}

export interface SubscribeActivityFeedOptions {
  companyId: string;
  userRole?: string;
  userSahalar?: string[];
  userSantraller?: string[];
  limit?: number; // toplam item limiti (varsayılan 50)
}

type FeedUpdater = (items: LiveActivityItem[]) => void;

// Yardımcı: Timestamp | Date | number -> Date
function toDate(input: unknown): Date {
  if (!input) return new Date(0);
  if (input instanceof Date) return input;
  if (typeof input === 'number') return new Date(input);
  if (typeof input === 'object' && input !== null && 'toDate' in (input as any)) {
    try {
      return (input as Timestamp).toDate();
    } catch (_) {
      return new Date(0);
    }
  }
  return new Date(0);
}

function applyRoleIsolation(
  items: LiveActivityItem[],
  opts: SubscribeActivityFeedOptions
): LiveActivityItem[] {
  const role = opts.userRole || '';
  if (role === 'superadmin' || role === 'yonetici') return items;
  const allowedSahalar = Array.isArray(opts.userSahalar) ? opts.userSahalar : [];
  const allowedSantraller = Array.isArray(opts.userSantraller) ? opts.userSantraller : [];
  return items.filter((i) => {
    const sahaOk = i.meta?.sahaId ? allowedSahalar.includes(i.meta.sahaId) : false;
    const santralOk = i.meta?.santralId ? allowedSantraller.includes(i.meta.santralId) : false;
    // Atama yoksa müşteri/tekniker/mühendis/bekçi görmesin
    if (role === 'musteri' || role === 'tekniker' || role === 'muhendis' || role === 'bekci') {
      return sahaOk || santralOk;
    }
    return true;
  });
}

export function subscribeToActivityFeed(
  opts: SubscribeActivityFeedOptions,
  callback: FeedUpdater
): Unsubscribe {
  const totalLimit = Math.max(10, Math.min(opts.limit || 50, 200));

  // Tüm kaynaklardan gelen kayıtları tek haritada tut
  const map = new Map<string, LiveActivityItem>();

  function emit() {
    const all = Array.from(map.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, totalLimit);
    const isolated = applyRoleIsolation(all, opts);
    callback(isolated);
  }

  const unsubscribers: Unsubscribe[] = [];

  // Stok hareketleri
  try {
    const qStok = query(
      collection(db, 'stokHareketleri'),
      where('companyId', '==', opts.companyId),
      orderBy('tarih', 'desc'),
      firestoreLimit(50)
    );
    const u1 = onSnapshot(qStok, (snap) => {
      snap.docChanges().forEach((chg) => {
        const d: any = chg.doc.data();
        const id = `stok-hareketi_${chg.doc.id}`;
        map.set(id, {
          id,
          type: 'stok-hareketi',
          title: d.hareketTipi === 'cikis' ? 'Stok Çıkışı' : d.hareketTipi === 'transfer' ? 'Stok Transferi' : 'Stok Girişi',
          description: d.aciklama || undefined,
          createdAt: toDate(d.tarih || d.createdAt || d.olusturmaTarihi),
          meta: { sahaId: d.sahaId, santralId: d.santralId, stokId: d.stokId }
        });
      });
      emit();
    });
    unsubscribers.push(u1);
  } catch (_) {}

  // Vardiya bildirimleri
  try {
    const qVardiya = query(
      collection(db, 'vardiyaBildirimleri'),
      where('companyId', '==', opts.companyId),
      orderBy('olusturmaTarihi', 'desc'),
      firestoreLimit(50)
    );
    const u2 = onSnapshot(qVardiya, (snap) => {
      snap.docChanges().forEach((chg) => {
        const d: any = chg.doc.data();
        const id = `vardiya_${chg.doc.id}`;
        map.set(id, {
          id,
          type: 'vardiya',
          title: d.durum === 'acil' ? 'Acil Vardiya Bildirimi' : 'Vardiya Bildirimi',
          description: d.aciklama || undefined,
          createdAt: toDate(d.olusturmaTarihi || d.tarih),
          meta: { sahaId: d.sahaId, santralId: d.santralId, userId: d.bekciId }
        });
      });
      emit();
    });
    unsubscribers.push(u2);
  } catch (_) {}

  // Arızalar
  try {
    const qAriza = query(
      collection(db, 'arizalar'),
      where('companyId', '==', opts.companyId),
      orderBy('olusturmaTarihi', 'desc'),
      firestoreLimit(50)
    );
    const u3 = onSnapshot(qAriza, (snap) => {
      snap.docChanges().forEach((chg) => {
        const d: any = chg.doc.data();
        const id = `ariza_${chg.doc.id}`;
        map.set(id, {
          id,
          type: 'ariza',
          title: d.baslik || 'Yeni Arıza Kaydı',
          description: d.aciklama || undefined,
          createdAt: toDate(d.olusturmaTarihi || d.createdAt),
          meta: { sahaId: d.sahaId, santralId: d.santralId, oncelik: d.oncelik }
        });
      });
      emit();
    });
    unsubscribers.push(u3);
  } catch (_) {}

  // Elektrik bakımları
  try {
    const qEB = query(
      collection(db, 'elektrikBakimlar'),
      where('companyId', '==', opts.companyId),
      orderBy('olusturmaTarihi', 'desc'),
      firestoreLimit(50)
    );
    const u4 = onSnapshot(qEB, (snap) => {
      snap.docChanges().forEach((chg) => {
        const d: any = chg.doc.data();
        const id = `bakim-elektrik_${chg.doc.id}`;
        map.set(id, {
          id,
          type: 'bakim-elektrik',
          title: 'Elektrik Bakım Kaydı',
          description: d.aciklama || d.isAdi || undefined,
          createdAt: toDate(d.olusturmaTarihi || d.tarih),
          meta: { sahaId: d.sahaId, santralId: d.santralId }
        });
      });
      emit();
    });
    unsubscribers.push(u4);
  } catch (_) {}

  // Mekanik bakımlar
  try {
    const qMB = query(
      collection(db, 'mekanikBakimlar'),
      where('companyId', '==', opts.companyId),
      orderBy('olusturmaTarihi', 'desc'),
      firestoreLimit(50)
    );
    const u5 = onSnapshot(qMB, (snap) => {
      snap.docChanges().forEach((chg) => {
        const d: any = chg.doc.data();
        const id = `bakim-mekanik_${chg.doc.id}`;
        map.set(id, {
          id,
          type: 'bakim-mekanik',
          title: 'Mekanik Bakım Kaydı',
          description: d.aciklama || d.isAdi || undefined,
          createdAt: toDate(d.olusturmaTarihi || d.tarih),
          meta: { sahaId: d.sahaId, santralId: d.santralId }
        });
      });
      emit();
    });
    unsubscribers.push(u5);
  } catch (_) {}

  return () => {
    unsubscribers.forEach((u) => u());
  };
}


