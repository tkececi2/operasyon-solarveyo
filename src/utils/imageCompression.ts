/**
 * Image Compression Utility
 * Fotoğrafları sıkıştırarak storage maliyetini düşürür
 */

import { logger } from './logger';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1 arası
  format?: 'jpeg' | 'webp' | 'png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  format: 'jpeg'
};

/**
 * Resmi sıkıştır
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Canvas oluştur
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Canvas context oluşturulamadı');
          }
          
          // Boyut hesaplama
          let { width, height } = calculateDimensions(
            img.width,
            img.height,
            opts.maxWidth!,
            opts.maxHeight!
          );
          
          canvas.width = width;
          canvas.height = height;
          
          // Resmi çiz
          ctx.drawImage(img, 0, 0, width, height);
          
          // Blob'a çevir
          canvas.toBlob(
            (blob) => {
              if (blob) {
                logger.info(`Resim sıkıştırıldı: ${formatBytes(file.size)} → ${formatBytes(blob.size)} (${Math.round((1 - blob.size / file.size) * 100)}% azalma)`);
                resolve(blob);
              } else {
                reject(new Error('Blob oluşturulamadı'));
              }
            },
            `image/${opts.format}`,
            opts.quality
          );
        } catch (error) {
          logger.error('Resim sıkıştırma hatası:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Resim yüklenemedi'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Dosya okunamadı'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Birden fazla resmi sıkıştır
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<Blob[]> {
  const promises = files.map(file => compressImage(file, options));
  return Promise.all(promises);
}

/**
 * Boyut hesaplama (aspect ratio koruyarak)
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  // Zaten küçükse değiştirme
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }
  
  // Aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  
  let width = maxWidth;
  let height = maxWidth / aspectRatio;
  
  if (height > maxHeight) {
    height = maxHeight;
    width = maxHeight * aspectRatio;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Byte'ı okunabilir formata çevir
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Dosya tipini kontrol et
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Maksimum dosya boyutunu kontrol et
 */
export function checkFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Resim önizleme URL'i oluştur
 */
export function createPreviewUrl(file: File | Blob): string {
  return URL.createObjectURL(file);
}

/**
 * Önizleme URL'ini temizle (memory leak önleme)
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

// Varsayılan export
export default {
  compressImage,
  compressImages,
  isImageFile,
  checkFileSize,
  createPreviewUrl,
  revokePreviewUrl
};

