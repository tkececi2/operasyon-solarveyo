import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, limit, startAfter, QueryConstraint, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Envanter } from '../types';

export interface GetEnvanterOptions {
  companyId: string;
  kategori?: string;
  sahaId?: string;
  santralId?: string;
  searchTerm?: string;
  pageSize?: number;
  lastDoc?: any;
  userRole?: string;
  userSahalar?: string[];
  userSantraller?: string[];
}

export const getEnvanterler = async (opts: GetEnvanterOptions) => {
  try {
    const {
      companyId,
      kategori,
      sahaId,
      searchTerm,
      pageSize = 20,
      lastDoc,
      userRole,
      userSahalar,
      userSantraller,
      santralId
    } = opts;

    // Server-side filtre + sıralama (gerekli composite indexler firestore.indexes.json'a eklendi)
    const constraints: QueryConstraint[] = [
      where('companyId', '==', companyId)
    ];

    if (kategori) constraints.push(where('kategori', '==', kategori));
    if (sahaId) constraints.push(where('sahaId', '==', sahaId));
    if (santralId) constraints.push(where('santralId', '==', santralId));
    constraints.push(orderBy('olusturmaTarihi', 'desc'));
    constraints.push(limit(pageSize));
    if (lastDoc) constraints.push(startAfter(lastDoc));

    const q = query(collection(db, 'envanterler'), ...constraints);
    const snap = await getDocs(q);
    let items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Envanter[];

    // Rol bazlı görünürlük: musteri/tekniker/muhendis/bekci -> atanan saha/santral
    if (userRole === 'musteri' || userRole === 'tekniker' || userRole === 'muhendis' || userRole === 'bekci') {
      const allowedSahalar = Array.isArray(userSahalar) ? userSahalar : [];
      const allowedSantraller = Array.isArray(userSantraller) ? userSantraller : [];
      items = items.filter(i => (i.sahaId && allowedSahalar.includes(i.sahaId)) || (i.santralId && allowedSantraller.includes(i.santralId!)));
    }

    // Client-side arama (term)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(i =>
        (i.marka || '').toLowerCase().includes(term) ||
        (i.model || '').toLowerCase().includes(term) ||
        (i.seriNo || '').toLowerCase().includes(term)
      );
    }

    return {
      items,
      lastDoc: snap.docs[snap.docs.length - 1] || null,
      hasMore: snap.docs.length === pageSize
    };
  } catch (e) {
    console.error('Envanter listesi getirilemedi', e);
    throw e;
  }
};

export const createEnvanter = async (data: Omit<Envanter, 'id' | 'olusturmaTarihi'>) => {
  try {
    const payload = { ...data, olusturmaTarihi: Timestamp.now() } as any;
    const ref = await addDoc(collection(db, 'envanterler'), payload);
    return ref.id;
  } catch (e) {
    console.error('Envanter oluşturulamadı', e);
    throw e;
  }
};

export const updateEnvanter = async (id: string, data: Partial<Envanter>) => {
  try {
    await updateDoc(doc(db, 'envanterler', id), data as any);
  } catch (e) {
    console.error('Envanter güncellenemedi', e);
    throw e;
  }
};

export const deleteEnvanter = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'envanterler', id));
  } catch (e) {
    console.error('Envanter silinemedi', e);
    throw e;
  }
};

export const envanterService = {
  getEnvanterler,
  createEnvanter,
  updateEnvanter,
  deleteEnvanter,
};


