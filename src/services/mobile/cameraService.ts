import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { uploadBytes, ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { platform } from '../../utils/platform';

/**
 * Mobil kamera servisi
 * Arıza fotoğrafları için kamera ve galeri erişimi
 */
export class MobileCameraService {
  /**
   * Kameradan fotoğraf çek ve Firebase Storage'a yükle
   */
  static async takePhoto(path: string): Promise<string | null> {
    if (!platform.isNative()) {
      console.log('Web platformunda native kamera kullanılamıyor');
      return null;
    }
    
    try {
      // Kamera izni kontrolü ve fotoğraf çekimi
      const image: Photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false // Gizlilik için galeriye kaydetme
      });
      
      if (!image.dataUrl) {
        throw new Error('Fotoğraf alınamadı');
      }
      
      // Firebase Storage'a yükle
      const uploadUrl = await this.uploadToFirebase(image.dataUrl, path);
      console.log('Fotoğraf başarıyla yüklendi:', uploadUrl);
      
      return uploadUrl;
    } catch (error) {
      console.error('Kamera hatası:', error);
      throw error;
    }
  }
  
  /**
   * Galeriden fotoğraf seç ve Firebase Storage'a yükle
   */
  static async selectFromGallery(path: string): Promise<string | null> {
    if (!platform.isNative()) {
      console.log('Web platformunda native galeri kullanılamıyor');
      return null;
    }
    
    try {
      const image: Photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });
      
      if (!image.dataUrl) {
        throw new Error('Fotoğraf seçilemedi');
      }
      
      // Firebase Storage'a yükle
      const uploadUrl = await this.uploadToFirebase(image.dataUrl, path);
      console.log('Galeriden seçilen fotoğraf yüklendi:', uploadUrl);
      
      return uploadUrl;
    } catch (error) {
      console.error('Galeri seçim hatası:', error);
      throw error;
    }
  }
  
  /**
   * Birden fazla fotoğraf çek
   */
  static async takeMultiplePhotos(path: string, maxPhotos: number = 5): Promise<string[]> {
    if (!platform.isNative()) {
      console.log('Web platformunda native kamera kullanılamıyor');
      return [];
    }
    
    const photos: string[] = [];
    
    try {
      for (let i = 0; i < maxPhotos; i++) {
        // Kullanıcıya devam etmek isteyip istemediğini sor
        if (i > 0) {
          const continueAdding = window.confirm(`${i} fotoğraf eklendi. Devam etmek istiyor musunuz?`);
          if (!continueAdding) break;
        }
        
        const photoUrl = await this.takePhoto(`${path}/foto_${i + 1}`);
        if (photoUrl) {
          photos.push(photoUrl);
        }
      }
      
      console.log(`${photos.length} fotoğraf başarıyla yüklendi`);
      return photos;
    } catch (error) {
      console.error('Çoklu fotoğraf çekme hatası:', error);
      return photos; // Başarılı olanları döndür
    }
  }
  
  /**
   * Firebase Storage'a fotoğraf yükle
   */
  private static async uploadToFirebase(dataUrl: string, path: string): Promise<string> {
    try {
      // Data URL'i blob'a çevir
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Dosya adı oluştur
      const timestamp = Date.now();
      const fileName = `${path}/foto_${timestamp}.jpg`;
      
      // Storage referansı oluştur
      const storageRef = ref(storage, fileName);
      
      // Yükle
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
        customMetadata: {
          platform: platform.getPlatformName(),
          uploadedAt: new Date().toISOString()
        }
      });
      
      // Download URL'i al
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      return downloadUrl;
    } catch (error) {
      console.error('Firebase Storage yükleme hatası:', error);
      throw error;
    }
  }
  
  /**
   * Kamera izinlerini kontrol et
   */
  static async checkPermissions() {
    if (!platform.isNative()) return { camera: 'granted', photos: 'granted' };
    
    try {
      const permissions = await Camera.checkPermissions();
      console.log('Kamera izinleri:', permissions);
      return permissions;
    } catch (error) {
      console.error('İzin kontrolü hatası:', error);
      return { camera: 'denied', photos: 'denied' };
    }
  }
  
  /**
   * Kamera izinlerini iste
   */
  static async requestPermissions() {
    if (!platform.isNative()) return { camera: 'granted', photos: 'granted' };
    
    try {
      const permissions = await Camera.requestPermissions();
      console.log('İzin sonucu:', permissions);
      return permissions;
    } catch (error) {
      console.error('İzin isteme hatası:', error);
      return { camera: 'denied', photos: 'denied' };
    }
  }
}
