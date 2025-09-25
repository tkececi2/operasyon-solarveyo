/**
 * Automatic Backup Service
 * Firebase Firestore verilerini otomatik yedekleme servisi
 */

import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  Timestamp,
  query,
  where,
  orderBy,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';
import toast from 'react-hot-toast';

// Backup yapılacak collection'lar
const COLLECTIONS_TO_BACKUP = [
  'kullanicilar',
  'santraller', 
  'arizalar',
  'elektrikBakimlar',
  'mekanikBakimlar',
  'sahalar',
  'musteriler',
  'stoklar',
  'vardiyaBildirimleri'
];

// Backup konfigürasyonu
const BACKUP_CONFIG = {
  maxBackups: 30, // Maksimum 30 backup sakla
  retentionDays: 30, // 30 gün sakla
  autoBackupHour: 3, // Gece 3'te otomatik backup
  compressionEnabled: true
};

interface BackupMetadata {
  id: string;
  companyId: string;
  timestamp: Timestamp;
  collections: string[];
  documentCount: number;
  sizeBytes: number;
  storageUrl?: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  createdBy: string;
  type: 'manual' | 'automatic' | 'scheduled';
}

class BackupService {
  /**
   * Manuel backup başlat
   */
  async createManualBackup(companyId: string, userId: string): Promise<BackupMetadata> {
    console.log('🔄 Manuel backup başlatılıyor...');
    
    try {
      const backupId = `backup_${companyId}_${Date.now()}`;
      const backupData: Record<string, any> = {};
      let totalDocuments = 0;

      // Her collection'ı yedekle
      for (const collectionName of COLLECTIONS_TO_BACKUP) {
        console.log(`📁 ${collectionName} yedekleniyor...`);
        
        const collectionData = await this.backupCollection(collectionName, companyId);
        backupData[collectionName] = collectionData;
        totalDocuments += collectionData.length;
      }

      // JSON olarak hazırla
      const backupJson = JSON.stringify(backupData, null, 2);
      const sizeBytes = new Blob([backupJson]).size;

      // Storage'a yükle
      const storageRef = ref(storage, `backups/${companyId}/${backupId}.json`);
      await uploadString(storageRef, backupJson);
      const storageUrl = await getDownloadURL(storageRef);

      // Metadata'yı kaydet
      const metadata: BackupMetadata = {
        id: backupId,
        companyId,
        timestamp: Timestamp.now(),
        collections: COLLECTIONS_TO_BACKUP,
        documentCount: totalDocuments,
        sizeBytes,
        storageUrl,
        status: 'completed',
        createdBy: userId,
        type: 'manual'
      };

      // Firestore'a metadata kaydet
      await setDoc(doc(db, 'backups', backupId), metadata);

      console.log('✅ Backup tamamlandı!');
      console.log(`📊 ${totalDocuments} belge, ${(sizeBytes / 1024 / 1024).toFixed(2)} MB`);
      
      toast.success(`Yedekleme tamamlandı! (${totalDocuments} kayıt)`);
      
      // Eski backup'ları temizle
      await this.cleanOldBackups(companyId);
      
      return metadata;
    } catch (error) {
      console.error('❌ Backup hatası:', error);
      toast.error('Yedekleme başarısız!');
      throw error;
    }
  }

  /**
   * Collection'ı yedekle
   */
  private async backupCollection(collectionName: string, companyId: string): Promise<any[]> {
    try {
      let q = query(collection(db, collectionName));
      
      // Company bazlı filtreleme (companies collection'ı hariç)
      if (collectionName !== 'companies' && collectionName !== 'kullanicilar') {
        q = query(q, where('companyId', '==', companyId));
      }
      
      const snapshot = await getDocs(q);
      const data: any[] = [];
      
      snapshot.forEach((doc) => {
        const docData = doc.data();
        
        // Kullanıcılar için company kontrolü
        if (collectionName === 'kullanicilar') {
          if (docData.companyId === companyId) {
            data.push({
              id: doc.id,
              ...docData
            });
          }
        } else {
          data.push({
            id: doc.id,
            ...docData
          });
        }
      });
      
      return data;
    } catch (error) {
      console.error(`Collection backup hatası (${collectionName}):`, error);
      return [];
    }
  }

  /**
   * Backup'tan geri yükle
   */
  async restoreFromBackup(backupId: string, userId: string): Promise<void> {
    console.log('🔄 Backup geri yükleniyor...');
    
    try {
      // Backup metadata'sını al
      const backupDoc = await getDocs(
        query(collection(db, 'backups'), where('id', '==', backupId), limit(1))
      );
      
      if (backupDoc.empty) {
        throw new Error('Backup bulunamadı');
      }
      
      const backup = backupDoc.docs[0].data() as BackupMetadata;
      
      if (!backup.storageUrl) {
        throw new Error('Backup dosyası bulunamadı');
      }
      
      // Storage'dan backup'ı indir
      const response = await fetch(backup.storageUrl);
      const backupData = await response.json();
      
      let restoredCount = 0;
      
      // Her collection'ı geri yükle
      for (const collectionName of Object.keys(backupData)) {
        const collectionData = backupData[collectionName];
        console.log(`📁 ${collectionName} geri yükleniyor (${collectionData.length} belge)...`);
        
        for (const docData of collectionData) {
          const { id, ...data } = docData;
          
          // Timestamp'leri düzelt
          Object.keys(data).forEach(key => {
            if (data[key] && typeof data[key] === 'object' && data[key]._seconds) {
              data[key] = new Timestamp(data[key]._seconds, data[key]._nanoseconds || 0);
            }
          });
          
          await setDoc(doc(db, collectionName, id), data, { merge: true });
          restoredCount++;
        }
      }
      
      console.log(`✅ Geri yükleme tamamlandı! ${restoredCount} belge yüklendi.`);
      toast.success(`${restoredCount} kayıt başarıyla geri yüklendi!`);
      
      // Audit log
      await this.logBackupAction('restore', backupId, userId, restoredCount);
      
    } catch (error) {
      console.error('❌ Geri yükleme hatası:', error);
      toast.error('Geri yükleme başarısız!');
      throw error;
    }
  }

  /**
   * Backup listesini getir
   */
  async getBackupList(companyId: string): Promise<BackupMetadata[]> {
    try {
      const q = query(
        collection(db, 'backups'),
        where('companyId', '==', companyId),
        where('status', '==', 'completed'),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
      
      const snapshot = await getDocs(q);
      const backups: BackupMetadata[] = [];
      
      snapshot.forEach((doc) => {
        backups.push(doc.data() as BackupMetadata);
      });
      
      return backups;
    } catch (error) {
      console.error('Backup listesi alınamadı:', error);
      return [];
    }
  }

  /**
   * Tek bir backup'ı sil
   */
  async deleteBackup(backupId: string, companyId: string): Promise<void> {
    console.log('🗑️ Backup siliniyor:', backupId);
    
    try {
      // Önce backup metadata'sını bul
      const q = query(
        collection(db, 'backups'),
        where('id', '==', backupId),
        where('companyId', '==', companyId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Backup bulunamadı');
      }
      
      const backupDoc = snapshot.docs[0];
      const backupData = backupDoc.data() as BackupMetadata;
      
      // Storage'dan dosyayı sil
      if (backupData.storageUrl) {
        try {
          const storageRef = ref(storage, `backups/${companyId}/${backupId}.json`);
          await deleteObject(storageRef);
          console.log('✅ Storage dosyası silindi');
        } catch (storageError) {
          console.error('Storage silme hatası (devam ediliyor):', storageError);
          // Storage hatası olsa bile Firestore'dan silmeye devam et
        }
      }
      
      // Firestore'dan metadata'yı sil
      await deleteDoc(backupDoc.ref);
      console.log('✅ Backup metadata silindi');
      
      toast.success('Yedek başarıyla silindi');
    } catch (error) {
      console.error('❌ Backup silme hatası:', error);
      toast.error('Yedek silinemedi');
      throw error;
    }
  }

  /**
   * Eski backup'ları temizle
   */
  private async cleanOldBackups(companyId: string): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - BACKUP_CONFIG.retentionDays);
      
      const q = query(
        collection(db, 'backups'),
        where('companyId', '==', companyId),
        where('timestamp', '<', Timestamp.fromDate(cutoffDate))
      );
      
      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        const backup = doc.data() as BackupMetadata;
        
        // Storage'dan sil
        if (backup.storageUrl) {
          try {
            const storageRef = ref(storage, `backups/${companyId}/${backup.id}.json`);
            await deleteObject(storageRef);
          } catch (error) {
            console.error('Storage silme hatası:', error);
          }
        }
        
        // Firestore'dan sil
        await deleteDoc(doc.ref);
      }
      
      console.log(`🗑️ ${snapshot.size} eski backup silindi`);
    } catch (error) {
      console.error('Eski backup temizleme hatası:', error);
    }
  }

  /**
   * Otomatik backup planla
   */
  scheduleAutomaticBackup(companyId: string, userId: string): void {
    // Her gün kontrol et
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      
      // Gece 3'te backup al
      if (hours === BACKUP_CONFIG.autoBackupHour) {
        this.createAutomaticBackup(companyId, userId);
      }
    };
    
    // Her saat kontrol et
    setInterval(checkTime, 60 * 60 * 1000); // 1 saat
    
    console.log('⏰ Otomatik backup planlandı (her gün saat 03:00)');
  }

  /**
   * Otomatik backup oluştur
   */
  private async createAutomaticBackup(companyId: string, userId: string): Promise<void> {
    try {
      const metadata = await this.createManualBackup(companyId, userId);
      
      // Type'ı automatic olarak güncelle
      await setDoc(
        doc(db, 'backups', metadata.id), 
        { type: 'automatic' }, 
        { merge: true }
      );
      
      console.log('🤖 Otomatik backup tamamlandı');
    } catch (error) {
      console.error('Otomatik backup hatası:', error);
    }
  }

  /**
   * Backup işlemini logla
   */
  private async logBackupAction(
    action: 'create' | 'restore' | 'delete',
    backupId: string,
    userId: string,
    documentCount?: number
  ): Promise<void> {
    try {
      await setDoc(doc(collection(db, 'backupLogs')), {
        action,
        backupId,
        userId,
        documentCount,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Backup log hatası:', error);
    }
  }

  /**
   * Backup boyutunu hesapla
   */
  async calculateBackupSize(companyId: string): Promise<number> {
    let totalSize = 0;
    
    for (const collectionName of COLLECTIONS_TO_BACKUP) {
      const data = await this.backupCollection(collectionName, companyId);
      const json = JSON.stringify(data);
      totalSize += new Blob([json]).size;
    }
    
    return totalSize;
  }

  /**
   * Export backup as JSON file
   */
  exportBackup(backupData: any, filename: string = 'backup.json'): void {
    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `solarveyo_${filename}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Backup dosyası indirildi!');
  }
}

// Singleton instance
export const backupService = new BackupService();

// Helper functions
export const createBackup = (companyId: string, userId: string) => 
  backupService.createManualBackup(companyId, userId);

export const restoreBackup = (backupId: string, userId: string) => 
  backupService.restoreFromBackup(backupId, userId);

export const getBackups = (companyId: string) => 
  backupService.getBackupList(companyId);

export const deleteBackup = (backupId: string, companyId: string) => 
  backupService.deleteBackup(backupId, companyId);

export const scheduleBackup = (companyId: string, userId: string) => 
  backupService.scheduleAutomaticBackup(companyId, userId);

export const exportBackupFile = (data: any, filename?: string) => 
  backupService.exportBackup(data, filename);
