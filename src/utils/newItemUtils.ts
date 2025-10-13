/**
 * Yeni Kayıt Belirleme Utility Fonksiyonları
 * Web ve iOS için yeni eklenen kayıtları highlight etmek için
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Bir kaydın "yeni" olup olmadığını kontrol eder
 * @param createdDate - Oluşturma tarihi (Date, Timestamp veya number)
 * @param hoursThreshold - Kaç saat içindeki kayıtlar yeni sayılsın (varsayılan: 48 saat)
 * @returns boolean - Yeni mi?
 */
export const isNewItem = (
  createdDate: Date | Timestamp | number | undefined | null, 
  hoursThreshold: number = 48
): boolean => {
  if (!createdDate) return false;

  try {
    let date: Date;

    // Timestamp ise Date'e çevir
    if (createdDate instanceof Timestamp) {
      date = createdDate.toDate();
    } 
    // Number ise (Unix timestamp)
    else if (typeof createdDate === 'number') {
      date = new Date(createdDate);
    }
    // Date ise direkt kullan
    else if (createdDate instanceof Date) {
      date = createdDate;
    }
    else {
      return false;
    }

    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

    return diffInHours <= hoursThreshold && diffInHours >= 0;
  } catch (error) {
    console.error('isNewItem error:', error);
    return false;
  }
};

/**
 * Yeni kayıt için CSS class'larını döndürür
 * @param isNew - Kayıt yeni mi?
 * @returns string - Tailwind CSS class'ları
 */
export const getNewItemClasses = (isNew: boolean): string => {
  if (!isNew) return '';
  return 'bg-gradient-to-br from-blue-50/80 to-indigo-50/80 ring-2 ring-blue-300/50 shadow-blue-100';
};

/**
 * Yeni kayıt için hover class'larını döndürür
 * @param isNew - Kayıt yeni mi?
 * @returns string - Tailwind CSS class'ları
 */
export const getNewItemHoverClasses = (isNew: boolean): string => {
  if (!isNew) return 'hover:shadow-lg';
  return 'hover:shadow-xl hover:ring-blue-400/60';
};

/**
 * Kaç saat/gün önce eklendiğini döndürür
 * @param createdDate - Oluşturma tarihi
 * @returns string - "2 saat önce", "1 gün önce" gibi
 */
export const getTimeAgo = (createdDate: Date | Timestamp | number | undefined | null): string => {
  if (!createdDate) return '';

  try {
    let date: Date;

    if (createdDate instanceof Timestamp) {
      date = createdDate.toDate();
    } else if (typeof createdDate === 'number') {
      date = new Date(createdDate);
    } else if (createdDate instanceof Date) {
      date = createdDate;
    } else {
      return '';
    }

    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} dakika önce`;
    } else if (diffInHours < 24) {
      return `${diffInHours} saat önce`;
    } else if (diffInDays === 1) {
      return 'Dün';
    } else if (diffInDays < 7) {
      return `${diffInDays} gün önce`;
    } else {
      return '';
    }
  } catch (error) {
    console.error('getTimeAgo error:', error);
    return '';
  }
};

