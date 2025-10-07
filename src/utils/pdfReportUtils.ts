import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Fault, Company, User } from '../types';
import html2canvas from 'html2canvas';

/**
 * Profesyonel Arıza Raporu PDF Oluşturucu
 * 
 * Özellikler:
 * - Sayfalama sistemi
 * - Header/Footer
 * - Özet istatistikler
 * - Detaylı arıza listesi
 * - Fotoğraf desteği
 * - Türkçe karakter desteği
 */

interface PDFReportOptions {
  arizalar: Fault[];
  company?: Company | null;
  santralMap?: Record<string, { id: string; ad: string }>;
  raporlayanMap?: Record<string, { ad: string; fotoURL?: string }>;
  filters?: {
    year?: number | 'all';
    month?: number | 'all';
    status?: string;
    priority?: string;
    saha?: string;
  };
}

// Sayfa boyutları ve margin sabitleri
const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
const HEADER_HEIGHT = 20;  // Daha ince header
const FOOTER_HEIGHT = 15;
const CONTENT_HEIGHT = PAGE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT - (MARGIN * 2);

// Renkler - Sade ve profesyonel (Mavi tonları - Solar Enerji teması)
const COLORS = {
  primary: '#1E40AF',      // Koyu mavi (Ana renk)
  secondary: '#64748B',    // Gri (İkincil)
  light: '#DBEAFE',        // Açık mavi (Arka plan)
  text: '#1F2937',         // Koyu gri (Metin)
  textLight: '#6B7280',    // Açık gri (Alt metin)
  border: '#E5E7EB',       // Çok açık gri (Kenarlık)
  white: '#FFFFFF',        // Beyaz
};

// Durum renkleri - Sade tonlar
const STATUS_COLORS: Record<string, string> = {
  'acik': '#3B82F6',           // Mavi (Açık)
  'devam-ediyor': '#60A5FA',   // Açık mavi (Devam ediyor)
  'beklemede': '#9CA3AF',      // Gri (Beklemede)
  'cozuldu': '#10B981',        // Yeşil (Çözüldü)
};

// Öncelik renkleri - Sade tonlar
const PRIORITY_COLORS: Record<string, string> = {
  'kritik': '#3B82F6',     // Mavi (Kritik)
  'yuksek': '#60A5FA',     // Açık mavi (Yüksek)
  'normal': '#93C5FD',     // Daha açık mavi (Normal)
  'dusuk': '#BFDBFE',      // Çok açık mavi (Düşük)
};

/**
 * Base64 image'ı yükle
 */
async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}

/**
 * Türkçe karakter düzeltme (jsPDF için)
 * jsPDF Türkçe karakterleri doğrudan desteklemiyor, bu yüzden ASCII alternatifler kullanıyoruz
 */
function fixTurkishChars(text: string): string {
  if (!text) return '';
  
  const turkishMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
  };
  
  return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => turkishMap[match] || match);
}

/**
 * Türkçe sayı formatı (binlik nokta, ondalık virgül)
 */
function formatTurkishNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Türkçe para formatı
 */
function formatTurkishCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Türkçe durum adı
 */
function getDurumText(durum: string): string {
  const durumMap: Record<string, string> = {
    'acik': 'Acik',
    'devam-ediyor': 'Devam Ediyor',
    'beklemede': 'Beklemede',
    'cozuldu': 'Cozuldu',
  };
  return durumMap[durum] || durum;
}

/**
 * Türkçe öncelik adı
 */
function getOncelikText(oncelik: string): string {
  const oncelikMap: Record<string, string> = {
    'kritik': 'Kritik',
    'yuksek': 'Yuksek',
    'normal': 'Normal',
    'dusuk': 'Dusuk',
  };
  return oncelikMap[oncelik] || oncelik;
}

/**
 * Metin kırpma (uzun metinleri kesmek için)
 */
function truncateText(text: string, maxLength: number): string {
  if (!text) return '-';
  const cleaned = fixTurkishChars(text);
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength - 3) + '...';
}

/**
 * Çok satırlı metin (word wrap)
 */
function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return ['-'];
  const lines = pdf.splitTextToSize(text, maxWidth);
  return lines;
}

/**
 * Header çiz - Sade ve minimalist
 */
function drawHeader(pdf: jsPDF, pageNumber: number, company?: Company | null, title: string = 'ARIZA RAPORU') {
  // Üst çizgi
  pdf.setDrawColor(COLORS.border);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, MARGIN, PAGE_WIDTH - MARGIN, MARGIN);
  
  // Başlık - Sol
  pdf.setTextColor(COLORS.text);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, MARGIN, MARGIN + 8);
  
  // Şirket adı - Sağ
  if (company?.name) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(COLORS.textLight);
    pdf.text(fixTurkishChars(company.name), PAGE_WIDTH - MARGIN, MARGIN + 8, { align: 'right' });
  }
  
  // Alt çizgi
  pdf.setDrawColor(COLORS.border);
  pdf.line(MARGIN, MARGIN + 12, PAGE_WIDTH - MARGIN, MARGIN + 12);
}

/**
 * Footer çiz - Sade ve minimalist
 */
function drawFooter(pdf: jsPDF, pageNumber: number, totalPages: number) {
  const y = PAGE_HEIGHT - 10;
  
  // Üst çizgi
  pdf.setDrawColor(COLORS.border);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, y - 5, PAGE_WIDTH - MARGIN, y - 5);
  
  pdf.setTextColor(COLORS.textLight);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  
  // Sol: Tarih
  const dateText = format(new Date(), 'dd.MM.yyyy HH:mm');
  pdf.text(dateText, MARGIN, y);
  
  // Sağ: Sayfa numarası
  const pageText = `Sayfa ${pageNumber} / ${totalPages}`;
  pdf.text(pageText, PAGE_WIDTH - MARGIN, y, { align: 'right' });
}

/**
 * Özet istatistikler sayfası
 */
function drawSummaryPage(pdf: jsPDF, options: PDFReportOptions, pageNumber: number, totalPages: number): number {
  let currentPage = pageNumber;
  
  drawHeader(pdf, currentPage, options.company);
  
  // İçerik başlangıç Y pozisyonu
  let y = HEADER_HEIGHT + MARGIN + 8;
  
  // Başlık
  pdf.setTextColor(COLORS.text);
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Ozet Istatistikler', MARGIN, y);
  y += 10;
  
  // İstatistikleri hesapla
  const total = options.arizalar.length;
  const acik = options.arizalar.filter(a => a.durum === 'acik').length;
  const devamEdiyor = options.arizalar.filter(a => a.durum === 'devam-ediyor').length;
  const beklemede = options.arizalar.filter(a => a.durum === 'beklemede').length;
  const cozuldu = options.arizalar.filter(a => a.durum === 'cozuldu').length;
  
  const kritik = options.arizalar.filter(a => a.oncelik === 'kritik').length;
  const yuksek = options.arizalar.filter(a => a.oncelik === 'yuksek').length;
  const normal = options.arizalar.filter(a => a.oncelik === 'normal').length;
  const dusuk = options.arizalar.filter(a => a.oncelik === 'dusuk').length;
  
  // Duruma göre istatistikler
  const boxWidth = (CONTENT_WIDTH - 15) / 4;
  const boxHeight = 25;
  
  // Durum kutuları
  drawStatBox(pdf, MARGIN, y, boxWidth, boxHeight, 'Acik', acik.toString(), STATUS_COLORS['acik']);
  drawStatBox(pdf, MARGIN + boxWidth + 5, y, boxWidth, boxHeight, 'Devam Ediyor', devamEdiyor.toString(), STATUS_COLORS['devam-ediyor']);
  drawStatBox(pdf, MARGIN + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 'Beklemede', beklemede.toString(), STATUS_COLORS['beklemede']);
  drawStatBox(pdf, MARGIN + (boxWidth + 5) * 3, y, boxWidth, boxHeight, 'Cozuldu', cozuldu.toString(), STATUS_COLORS['cozuldu']);
  
  y += boxHeight + 12;
  
  // Öncelik başlığı
  pdf.setTextColor(COLORS.text);
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Oncelik Dagilimi', MARGIN, y);
  y += 10;
  
  // Öncelik kutuları
  drawStatBox(pdf, MARGIN, y, boxWidth, boxHeight, 'Kritik', kritik.toString(), PRIORITY_COLORS['kritik']);
  drawStatBox(pdf, MARGIN + boxWidth + 5, y, boxWidth, boxHeight, 'Yuksek', yuksek.toString(), PRIORITY_COLORS['yuksek']);
  drawStatBox(pdf, MARGIN + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 'Normal', normal.toString(), PRIORITY_COLORS['normal']);
  drawStatBox(pdf, MARGIN + (boxWidth + 5) * 3, y, boxWidth, boxHeight, 'Dusuk', dusuk.toString(), PRIORITY_COLORS['dusuk']);
  
  y += boxHeight + 15;
  
  // Toplam arıza kutusu - Sade
  pdf.setDrawColor(COLORS.primary);
  pdf.setLineWidth(2);
  pdf.setFillColor(COLORS.white);
  pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 25, 3, 3, 'FD');
  
  // Sol kenar renk çubuğu
  pdf.setFillColor(COLORS.primary);
  pdf.rect(MARGIN, y, 4, 25, 'F');
  
  pdf.setTextColor(COLORS.textLight);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Toplam Ariza Sayisi', MARGIN + 10, y + 10);
  
  pdf.setTextColor(COLORS.primary);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text(total.toString(), MARGIN + 10, y + 20);
  
  y += 30;
  
  // Filtre bilgisi (varsa) - Sade kutu
  if (options.filters) {
    y += 3;
    
    const filters = [];
    if (options.filters.year && options.filters.year !== 'all') {
      filters.push(`Yil: ${options.filters.year}`);
    }
    if (options.filters.month !== undefined && options.filters.month !== 'all') {
      const monthNames = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
      filters.push(`Ay: ${monthNames[options.filters.month]}`);
    }
    if (options.filters.status) {
      filters.push(`Durum: ${getDurumText(options.filters.status)}`);
    }
    if (options.filters.priority) {
      filters.push(`Oncelik: ${getOncelikText(options.filters.priority)}`);
    }
    if (options.filters.saha && options.filters.saha !== 'Tum Sahalar') {
      filters.push(`Saha: ${fixTurkishChars(options.filters.saha)}`);
    }
    
    if (filters.length > 0) {
      // Filtre kutusu
      pdf.setDrawColor(COLORS.border);
      pdf.setLineWidth(0.5);
      pdf.setFillColor(COLORS.light);
      pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 8, 2, 2, 'FD');
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textLight);
      pdf.text('Filtreler: ' + filters.join(' | '), MARGIN + 5, y + 5.5);
    }
  }
  
  drawFooter(pdf, currentPage, totalPages);
  
  return currentPage;
}

/**
 * İstatistik kutusu çiz - Sade ve minimal
 */
function drawStatBox(pdf: jsPDF, x: number, y: number, width: number, height: number, label: string, value: string, color: string) {
  // Kenarlık
  pdf.setDrawColor(COLORS.border);
  pdf.setLineWidth(1);
  pdf.setFillColor(COLORS.white);
  pdf.roundedRect(x, y, width, height, 3, 3, 'FD');
  
  // Sol kenar renk çubuğu (ince)
  pdf.setFillColor(color);
  pdf.rect(x, y, 3, height, 'F');
  
  // Label
  pdf.setTextColor(COLORS.textLight);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(label, x + width / 2, y + 10, { align: 'center' });
  
  // Value
  pdf.setTextColor(COLORS.text);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(value, x + width / 2, y + 20, { align: 'center' });
}

/**
 * Arıza detay sayfaları
 */
async function drawFaultPages(pdf: jsPDF, options: PDFReportOptions, startPage: number, totalPages: number): Promise<number> {
  let currentPage = startPage;
  let y = HEADER_HEIGHT + MARGIN + 5;
  let faultIndex = 0;
  
  for (const ariza of options.arizalar) {
    // Yeni sayfa gerekirse ekle
    if (faultIndex > 0) {
      pdf.addPage();
      currentPage++;
      y = HEADER_HEIGHT + MARGIN + 5;
    }
    
    drawHeader(pdf, currentPage, options.company);
    
    // Arıza başlığı - Sade kenarlık
    pdf.setDrawColor(COLORS.border);
    pdf.setLineWidth(1);
    pdf.setFillColor(COLORS.white);
    pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 10, 2, 2, 'FD');
    
    // Sol kenar mavi çizgi
    pdf.setFillColor(COLORS.primary);
    pdf.rect(MARGIN, y, 3, 10, 'F');
    
    pdf.setTextColor(COLORS.text);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    const title = truncateText(ariza.baslik, 70); // truncateText içinde zaten fixTurkishChars var
    pdf.text(title, MARGIN + 8, y + 7);
    
    // Arıza numarası (sağda)
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.textLight);
    pdf.text(`#${faultIndex + 1}`, PAGE_WIDTH - MARGIN - 5, y + 7, { align: 'right' });
    
    y += 13;
    
    // Durum ve Öncelik badge'leri
    drawBadge(pdf, MARGIN, y, getDurumText(ariza.durum), STATUS_COLORS[ariza.durum]);
    drawBadge(pdf, MARGIN + 45, y, getOncelikText(ariza.oncelik), PRIORITY_COLORS[ariza.oncelik]);
    
    y += 12;
    
    // Detay bilgileri
    const lineHeight = 6;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Santral
    const santralAd = fixTurkishChars(options.santralMap?.[ariza.santralId]?.ad || '-');
    drawField(pdf, MARGIN, y, 'Santral:', santralAd);
    y += lineHeight;
    
    // Saha
    const sahaAd = fixTurkishChars(ariza.saha || '-');
    drawField(pdf, MARGIN, y, 'Saha:', sahaAd);
    y += lineHeight;
    
    // Raporlayan
    const raporlayan = fixTurkishChars(options.raporlayanMap?.[ariza.raporlayanId]?.ad || ariza.raporlayanId);
    drawField(pdf, MARGIN, y, 'Raporlayan:', raporlayan);
    y += lineHeight;
    
    // Tarih
    const tarih = format(ariza.olusturmaTarihi.toDate(), 'dd.MM.yyyy HH:mm');
    drawField(pdf, MARGIN, y, 'Tarih:', tarih);
    y += lineHeight;
    
    // Çözüm tarihi (varsa)
    if (ariza.cozumTarihi) {
      const cozumTarih = format(ariza.cozumTarihi.toDate(), 'dd.MM.yyyy HH:mm');
      drawField(pdf, MARGIN, y, 'Cozum Tarihi:', cozumTarih);
      y += lineHeight;
    }
    
    y += 3;
    
    // Açıklama
    if (ariza.aciklama) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.text);
      pdf.setFontSize(10);
      pdf.text('Aciklama:', MARGIN, y);
      y += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(COLORS.textLight);
      const aciklamaText = fixTurkishChars(ariza.aciklama);
      const aciklamaLines = wrapText(pdf, aciklamaText, CONTENT_WIDTH - 10);
      
      for (const line of aciklamaLines) {
        if (y > PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN - 10) {
          drawFooter(pdf, currentPage, totalPages);
          pdf.addPage();
          currentPage++;
          y = HEADER_HEIGHT + MARGIN + 5;
          drawHeader(pdf, currentPage, options.company);
        }
        pdf.text(line, MARGIN + 5, y);
        y += 5;
      }
      
      y += 3;
    }
    
    // Çözüm açıklaması (varsa)
    if (ariza.cozumAciklamasi) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(STATUS_COLORS['cozuldu']);
      pdf.setFontSize(10);
      pdf.text('Cozum:', MARGIN, y);
      y += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(COLORS.textLight);
      const cozumText = fixTurkishChars(ariza.cozumAciklamasi);
      const cozumLines = wrapText(pdf, cozumText, CONTENT_WIDTH - 10);
      
      for (const line of cozumLines) {
        if (y > PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN - 10) {
          drawFooter(pdf, currentPage, totalPages);
          pdf.addPage();
          currentPage++;
          y = HEADER_HEIGHT + MARGIN + 5;
          drawHeader(pdf, currentPage, options.company);
        }
        pdf.text(line, MARGIN + 5, y);
        y += 5;
      }
      
      y += 3;
    }
    
      // Fotoğraflar (varsa) - Thumbnail grid
    const allPhotos = [...(ariza.fotograflar || []), ...(ariza.cozumFotograflari || [])];
    if (allPhotos.length > 0) {
      y += 5;
      
      if (y > PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN - 60) {
        drawFooter(pdf, currentPage, totalPages);
        pdf.addPage();
        currentPage++;
        y = HEADER_HEIGHT + MARGIN + 5;
        drawHeader(pdf, currentPage, options.company);
      }
      
      // Fotoğraf başlığı
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.text);
      pdf.setFontSize(10);
      pdf.text('Fotograflar:', MARGIN, y);
      y += 7;
      
      // Fotoğrafları 3'lü grid'de göster
      const photoSize = 30; // mm
      const photoGap = 5;
      const photosPerRow = 3;
      let photoX = MARGIN;
      let photoRow = 0;
      
      for (let i = 0; i < Math.min(allPhotos.length, 6); i++) {
        // Yeni satır gerekirse
        if (i > 0 && i % photosPerRow === 0) {
          y += photoSize + photoGap;
          photoX = MARGIN;
          photoRow++;
          
          // Sayfa taşması kontrolü
          if (y + photoSize > PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN) {
            drawFooter(pdf, currentPage, totalPages);
            pdf.addPage();
            currentPage++;
            y = HEADER_HEIGHT + MARGIN + 5;
            drawHeader(pdf, currentPage, options.company);
            photoRow = 0;
          }
        }
        
        try {
          const photoUrl = allPhotos[i];
          
          // Önce fotoğraf kutusunu çiz
          pdf.setDrawColor(COLORS.border);
          pdf.setLineWidth(0.5);
          pdf.setFillColor(COLORS.white);
          pdf.roundedRect(photoX, y, photoSize, photoSize, 2, 2, 'FD');
          
          // Gerçek fotoğrafı yüklemeyi dene (timeout ile)
          try {
            const imageData = await Promise.race([
              loadImage(photoUrl),
              new Promise<string>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 3000)
              )
            ]);
            
            // Fotoğrafı PDF'e ekle
            pdf.addImage(imageData, 'JPEG', photoX + 1, y + 1, photoSize - 2, photoSize - 2);
            
          } catch (imgError) {
            // Fotoğraf yüklenemezse placeholder göster
            pdf.setFillColor(COLORS.light);
            pdf.rect(photoX + 2, y + 2, photoSize - 4, photoSize - 4, 'F');
            
            pdf.setFontSize(7);
            pdf.setTextColor(COLORS.textLight);
            pdf.text(`Foto ${i + 1}`, photoX + photoSize / 2, y + photoSize / 2, { align: 'center' });
          }
          
        } catch (error) {
          console.warn('Fotoğraf yüklenemedi:', error);
          
          // Hata durumunda placeholder
          pdf.setFillColor(COLORS.light);
          pdf.roundedRect(photoX, y, photoSize, photoSize, 2, 2, 'F');
          
          pdf.setFontSize(8);
          pdf.setTextColor(COLORS.textLight);
          pdf.text('?', photoX + photoSize / 2, y + photoSize / 2, { align: 'center' });
        }
        
        photoX += photoSize + photoGap;
      }
      
      y += photoSize + 5;
      
      // Eğer 6'dan fazla fotoğraf varsa
      if (allPhotos.length > 6) {
        pdf.setFontSize(8);
        pdf.setTextColor(COLORS.textLight);
        pdf.text(`+${allPhotos.length - 6} fotograf daha`, MARGIN, y);
        y += 5;
      }
    }
    
    drawFooter(pdf, currentPage, totalPages);
    faultIndex++;
  }
  
  return currentPage;
}

/**
 * Badge çiz - Sade ve minimal (sadece kenarlık, arka plan yok)
 */
function drawBadge(pdf: jsPDF, x: number, y: number, text: string, color: string) {
  const padding = 2;
  const textWidth = pdf.getTextWidth(text);
  const width = textWidth + (padding * 2) + 4;
  const height = 7;
  
  // Hafif arka plan
  pdf.setFillColor(COLORS.light);
  pdf.roundedRect(x, y, width, height, 2, 2, 'F');
  
  // Kenarlık
  pdf.setDrawColor(color);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(x, y, width, height, 2, 2, 'D');
  
  // Metin
  pdf.setTextColor(color);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(text, x + padding + 2, y + 5);
}

/**
 * Alan (field) çiz - Sade
 */
function drawField(pdf: jsPDF, x: number, y: number, label: string, value: string) {
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.textLight);
  pdf.setFontSize(9);
  pdf.text(label, x, y);
  
  const labelWidth = pdf.getTextWidth(label);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(COLORS.text);
  pdf.text(value, x + labelWidth + 2, y);
}

/**
 * Ana export fonksiyonu
 */
export async function exportArizalarToPDF(options: PDFReportOptions): Promise<void> {
  try {
    // PDF oluştur
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Toplam sayfa sayısını hesapla (yaklaşık)
    const estimatedPages = 1 + options.arizalar.length; // 1 özet + her arıza için 1 sayfa
    
    // 1. Özet sayfası
    let currentPage = 1;
    drawSummaryPage(pdf, options, currentPage, estimatedPages);
    
    // 2. Arıza detay sayfaları
    if (options.arizalar.length > 0) {
      pdf.addPage();
      currentPage++;
      await drawFaultPages(pdf, options, currentPage, estimatedPages);
    }
    
    // Dosya adı
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const fileName = `ariza_raporu_${timestamp}.pdf`;
    
    // PDF'i indir
    pdf.save(fileName);
    
    return Promise.resolve();
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    throw error;
  }
}

/**
 * Elektrik Kesintileri için PDF Export
 */
export async function exportElektrikKesintileriToPDF(options: {
  kesintiler: any[];
  company?: any | null;
  sahalar?: Array<{ id: string; ad: string }>;
  raporlayanMap?: Record<string, { ad: string; fotoURL?: string }>;
  filters?: {
    year?: number | 'all';
    month?: number | 'all';
    durum?: string;
    saha?: string;
  };
}): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const estimatedPages = 1 + options.kesintiler.length;
    let currentPage = 1;
    
    // Özet sayfası
    drawHeader(pdf, currentPage, options.company, 'ELEKTRIK KESINTILERI RAPORU');
    
    let y = HEADER_HEIGHT + MARGIN + 8;
    
    // Başlık
    pdf.setTextColor(COLORS.text);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Ozet Istatistikler', MARGIN, y);
    y += 10;
    
    // İstatistikler
    const total = options.kesintiler.length;
    const devam = options.kesintiler.filter(k => !k.bitisTarihi).length;
    const bitti = options.kesintiler.filter(k => k.bitisTarihi).length;
    
    // Toplam kayıp enerji ve süre hesapla
    let toplamKayipEnerji = 0;
    let toplamSure = 0;
    let toplamGelirKaybi = 0;
    
    options.kesintiler.forEach(k => {
      // Kayılan üretim (alan adı: kayilanUretim)
      if (k.kayilanUretim) {
        toplamKayipEnerji += k.kayilanUretim;
      }
      // Kayılan gelir (alan adı: kayilanGelir)
      if (k.kayilanGelir) {
        toplamGelirKaybi += k.kayilanGelir;
      }
      // Süre (eğer sure alanı varsa onu kullan, yoksa tarihlerden hesapla)
      if (k.sure) {
        toplamSure += k.sure;
      } else if (k.bitisTarihi) {
        const sure = Math.round((k.bitisTarihi.toDate().getTime() - k.baslangicTarihi.toDate().getTime()) / (1000 * 60));
        toplamSure += sure;
      }
    });
    
    const boxWidth = (CONTENT_WIDTH - 10) / 3;
    const boxHeight = 25;
    
    // İlk satır - Kesinti sayıları
    drawStatBox(pdf, MARGIN, y, boxWidth, boxHeight, 'Toplam Kesinti', total.toString(), COLORS.primary);
    drawStatBox(pdf, MARGIN + boxWidth + 5, y, boxWidth, boxHeight, 'Devam Ediyor', devam.toString(), STATUS_COLORS['devam-ediyor']);
    drawStatBox(pdf, MARGIN + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 'Bitti', bitti.toString(), STATUS_COLORS['cozuldu']);
    
    y += boxHeight + 10;
    
    // İkinci satır - Kayıp bilgileri (Türkçe format)
    const kayipEnerjiText = toplamKayipEnerji > 0 
      ? `${formatTurkishNumber(toplamKayipEnerji, 0)} kWh` 
      : '0 kWh';
    drawStatBox(pdf, MARGIN, y, boxWidth, boxHeight, 'Kayip Enerji', kayipEnerjiText, PRIORITY_COLORS['kritik']);
    
    const toplamSureText = toplamSure > 0 
      ? `${formatTurkishNumber(toplamSure, 0)} dk` 
      : '0 dk';
    drawStatBox(pdf, MARGIN + boxWidth + 5, y, boxWidth, boxHeight, 'Toplam Sure', toplamSureText, PRIORITY_COLORS['yuksek']);
    
    // Gelir kaybı (Türkçe format: 1.234,56 TL)
    const gelirKaybiValue = toplamGelirKaybi > 0 
      ? toplamGelirKaybi 
      : (toplamKayipEnerji * 2.5);
    const gelirKaybiText = gelirKaybiValue > 0 
      ? `${formatTurkishCurrency(gelirKaybiValue)} TL` 
      : '0,00 TL';
    drawStatBox(pdf, MARGIN + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 'Gelir Kaybi', gelirKaybiText, PRIORITY_COLORS['normal']);
    
    y += boxHeight + 15;
    
    // Filtre bilgisi
    if (options.filters) {
      y += 3;
      
      const filters = [];
      if (options.filters.year && options.filters.year !== 'all') {
        filters.push(`Yil: ${options.filters.year}`);
      }
      if (options.filters.month !== undefined && options.filters.month !== 'all') {
        const monthNames = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
        filters.push(`Ay: ${monthNames[options.filters.month - 1]}`);
      }
      if (options.filters.durum && options.filters.durum !== 'all') {
        filters.push(`Durum: ${options.filters.durum === 'devam' ? 'Devam Ediyor' : 'Bitti'}`);
      }
      if (options.filters.saha && options.filters.saha !== 'all') {
        const sahaAd = options.sahalar?.find(s => s.id === options.filters?.saha)?.ad;
        if (sahaAd) {
          filters.push(`Saha: ${fixTurkishChars(sahaAd)}`);
        }
      }
      
      if (filters.length > 0) {
        pdf.setDrawColor(COLORS.border);
        pdf.setLineWidth(0.5);
        pdf.setFillColor(COLORS.light);
        pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 8, 2, 2, 'FD');
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(COLORS.textLight);
        pdf.text('Filtreler: ' + filters.join(' | '), MARGIN + 5, y + 5.5);
        y += 10;
      }
    }
    
    drawFooter(pdf, currentPage, estimatedPages);
    
    // Kesinti detay sayfaları
    let kesintiIndex = 0;
    
    for (const kesinti of options.kesintiler) {
      if (kesintiIndex > 0 || y > PAGE_HEIGHT - 100) {
        pdf.addPage();
        currentPage++;
        y = HEADER_HEIGHT + MARGIN + 5;
        drawHeader(pdf, currentPage, options.company, 'ELEKTRIK KESINTILERI RAPORU');
      }
      
      // Kesinti başlığı
      const sahaAd = options.sahalar?.find(s => s.id === kesinti.sahaId)?.ad || '-';
      
      pdf.setDrawColor(COLORS.border);
      pdf.setLineWidth(1);
      pdf.setFillColor(COLORS.white);
      pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 10, 2, 2, 'FD');
      
      pdf.setFillColor(COLORS.primary);
      pdf.rect(MARGIN, y, 3, 10, 'F');
      
      pdf.setTextColor(COLORS.text);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(fixTurkishChars(truncateText(kesinti.neden || 'Kesinti', 60)), MARGIN + 8, y + 7);
      
      pdf.setFontSize(8);
      pdf.setTextColor(COLORS.textLight);
      pdf.text(`#${kesintiIndex + 1}`, PAGE_WIDTH - MARGIN - 5, y + 7, { align: 'right' });
      
      y += 13;
      
      // Durum badge
      const durumText = kesinti.bitisTarihi ? 'Bitti' : 'Devam Ediyor';
      const durumColor = kesinti.bitisTarihi ? STATUS_COLORS['cozuldu'] : STATUS_COLORS['devam-ediyor'];
      drawBadge(pdf, MARGIN, y, durumText, durumColor);
      
      y += 12;
      
      // Detay bilgileri
      const lineHeight = 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      drawField(pdf, MARGIN, y, 'Saha:', fixTurkishChars(sahaAd));
      y += lineHeight;
      
      const baslangic = format(kesinti.baslangicTarihi.toDate(), 'dd.MM.yyyy HH:mm');
      drawField(pdf, MARGIN, y, 'Baslangic:', baslangic);
      y += lineHeight;
      
      if (kesinti.bitisTarihi) {
        const bitis = format(kesinti.bitisTarihi.toDate(), 'dd.MM.yyyy HH:mm');
        drawField(pdf, MARGIN, y, 'Bitis:', bitis);
        y += lineHeight;
        
        const sure = Math.round((kesinti.bitisTarihi.toDate().getTime() - kesinti.baslangicTarihi.toDate().getTime()) / (1000 * 60));
        drawField(pdf, MARGIN, y, 'Sure:', `${sure} dakika`);
        y += lineHeight;
      }
      
      // Kaybedilen üretim (Türkçe format)
      if (kesinti.kayilanUretim) {
        const uretimText = formatTurkishNumber(kesinti.kayilanUretim, 0);
        drawField(pdf, MARGIN, y, 'Kaybedilen Uretim:', `${uretimText} kWh`);
        y += lineHeight;
      }
      
      // Gelir kaybı (Türkçe format: 1.234,56 TL)
      if (kesinti.kayilanGelir) {
        const gelirText = formatTurkishCurrency(kesinti.kayilanGelir);
        drawField(pdf, MARGIN, y, 'Gelir Kaybi:', `${gelirText} TL`);
        y += lineHeight;
      }
      
      // Raporlayan (PowerOutage tipinde alan adı: olusturanKisi)
      const raporlayanId = kesinti.olusturanKisi || kesinti.raporlayanId;
      const raporlayan = options.raporlayanMap?.[raporlayanId]?.ad || '-';
      drawField(pdf, MARGIN, y, 'Raporlayan:', fixTurkishChars(raporlayan));
      y += lineHeight;
      
      y += 3;
      
      // Açıklama
      if (kesinti.aciklama) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(COLORS.text);
        pdf.setFontSize(10);
        pdf.text('Aciklama:', MARGIN, y);
        y += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(COLORS.textLight);
        const aciklamaText = fixTurkishChars(kesinti.aciklama);
        const aciklamaLines = wrapText(pdf, aciklamaText, CONTENT_WIDTH - 10);
        
        for (const line of aciklamaLines) {
          if (y > PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN - 10) {
            drawFooter(pdf, currentPage, estimatedPages);
            pdf.addPage();
            currentPage++;
            y = HEADER_HEIGHT + MARGIN + 5;
            drawHeader(pdf, currentPage, options.company, 'ELEKTRIK KESINTILERI RAPORU');
          }
          pdf.text(line, MARGIN + 5, y);
          y += 5;
        }
        
        y += 5;
      }
      
      drawFooter(pdf, currentPage, estimatedPages);
      kesintiIndex++;
    }
    
    // Dosya adı
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const fileName = `elektrik_kesintileri_${timestamp}.pdf`;
    
    pdf.save(fileName);
    
    return Promise.resolve();
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    throw error;
  }
}

/**
 * Bakım Raporları için PDF Export (Elektrik, Mekanik, Yapılan İşler)
 */
export async function exportBakimToPDF(options: {
  bakimlar: any[];
  bakimTipi: 'elektrik' | 'mekanik' | 'yapilanisler';
  company?: any | null;
  santralMap?: Record<string, { id: string; ad: string }>;
  sahaMap?: Record<string, { id: string; ad: string }>;
  yapanKisiMap?: Record<string, { ad: string; fotoURL?: string }>;
  filters?: {
    year?: number | 'all';
    month?: number | 'all';
    saha?: string;
  };
}): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const estimatedPages = 1 + options.bakimlar.length;
    let currentPage = 1;
    
    // Başlık metni
    const titleMap = {
      'elektrik': 'ELEKTRIK BAKIM RAPORU',
      'mekanik': 'MEKANIK BAKIM RAPORU',
      'yapilanisler': 'YAPILAN ISLER RAPORU'
    };
    const title = titleMap[options.bakimTipi];
    
    // Özet sayfası
    drawHeader(pdf, currentPage, options.company, title);
    
    let y = HEADER_HEIGHT + MARGIN + 8;
    
    // Başlık
    pdf.setTextColor(COLORS.text);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Ozet Istatistikler', MARGIN, y);
    y += 10;
    
    // İstatistikler
    const total = options.bakimlar.length;
    const tamamlanan = options.bakimlar.filter((b: any) => b.durum === 'tamamlandi' || b.tamamlandiMi).length;
    const devam = total - tamamlanan;
    
    const boxWidth = (CONTENT_WIDTH - 10) / 3;
    const boxHeight = 25;
    
    drawStatBox(pdf, MARGIN, y, boxWidth, boxHeight, 'Toplam', total.toString(), COLORS.primary);
    drawStatBox(pdf, MARGIN + boxWidth + 5, y, boxWidth, boxHeight, 'Tamamlanan', tamamlanan.toString(), STATUS_COLORS['cozuldu']);
    drawStatBox(pdf, MARGIN + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 'Devam Eden', devam.toString(), STATUS_COLORS['devam-ediyor']);
    
    y += boxHeight + 15;
    
    // Filtre bilgisi
    if (options.filters) {
      y += 3;
      
      const filters = [];
      if (options.filters.year && options.filters.year !== 'all') {
        filters.push(`Yil: ${options.filters.year}`);
      }
      if (options.filters.month !== undefined && options.filters.month !== 'all') {
        const monthNames = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
        filters.push(`Ay: ${monthNames[options.filters.month]}`);
      }
      if (options.filters.saha) {
        const sahaAd = options.sahaMap?.[options.filters.saha]?.ad;
        if (sahaAd) {
          filters.push(`Saha: ${fixTurkishChars(sahaAd)}`);
        }
      }
      
      if (filters.length > 0) {
        pdf.setDrawColor(COLORS.border);
        pdf.setLineWidth(0.5);
        pdf.setFillColor(COLORS.light);
        pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 8, 2, 2, 'FD');
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(COLORS.textLight);
        pdf.text('Filtreler: ' + filters.join(' | '), MARGIN + 5, y + 5.5);
        y += 10;
      }
    }
    
    drawFooter(pdf, currentPage, estimatedPages);
    
    // Bakım detay sayfaları - Sayfa 2'den başla
    let bakimIndex = 0;
    
    for (const bakim of options.bakimlar) {
      // Her bakım yeni sayfada (ilk bakım için de yeni sayfa)
      pdf.addPage();
      currentPage++;
      y = HEADER_HEIGHT + MARGIN + 5;
      drawHeader(pdf, currentPage, options.company, title);
      
      // Bakım başlığı - Saha adı + Bakım tipi
      const sahaAd = bakim.sahaId ? (options.sahaMap?.[bakim.sahaId]?.ad || 'Bilinmeyen') : 'Genel';
      
      const bakimTipiMap = {
        'elektrik': 'Elektrik Bakim',
        'mekanik': 'Mekanik Bakim',
        'yapilanisler': 'Yapilan Is'
      };
      
      const baslik = `${sahaAd} - ${bakimTipiMap[options.bakimTipi]}`;
      
      pdf.setDrawColor(COLORS.border);
      pdf.setLineWidth(1);
      pdf.setFillColor(COLORS.white);
      pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 10, 2, 2, 'FD');
      
      pdf.setFillColor(COLORS.primary);
      pdf.rect(MARGIN, y, 3, 10, 'F');
      
      pdf.setTextColor(COLORS.text);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(fixTurkishChars(truncateText(baslik, 60)), MARGIN + 8, y + 7);
      
      pdf.setFontSize(8);
      pdf.setTextColor(COLORS.textLight);
      pdf.text(`#${bakimIndex + 1}`, PAGE_WIDTH - MARGIN - 5, y + 7, { align: 'right' });
      
      y += 18; // Boşluk artırıldı (13 → 18)
      
      // Detay bilgileri
      const lineHeight = 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      // Santral
      if (bakim.santralId) {
        const santralAd = fixTurkishChars(options.santralMap?.[bakim.santralId]?.ad || '-');
        drawField(pdf, MARGIN, y, 'Santral:', santralAd);
        y += lineHeight;
      }
      
      // Saha
      if (bakim.sahaId) {
        const sahaAd = fixTurkishChars(options.sahaMap?.[bakim.sahaId]?.ad || '-');
        drawField(pdf, MARGIN, y, 'Saha:', sahaAd);
        y += lineHeight;
      }
      
      // Tarih
      const tarih = format(bakim.tarih?.toDate() || bakim.olusturmaTarihi?.toDate() || new Date(), 'dd.MM.yyyy HH:mm');
      drawField(pdf, MARGIN, y, 'Tarih:', tarih);
      y += lineHeight;
      
      // Yapan kişi
      const yapanKisiId = bakim.yapanKisi || bakim.olusturanKisi;
      const yapanKisi = fixTurkishChars(options.yapanKisiMap?.[yapanKisiId]?.ad || '-');
      drawField(pdf, MARGIN, y, 'Yapan Kisi:', yapanKisi);
      y += lineHeight;
      
      y += 3;
      
      // Detaylar (elektrik/mekanik özel alanlar)
      if (options.bakimTipi === 'elektrik' && bakim.invertorNumarasi) {
        drawField(pdf, MARGIN, y, 'Invertor:', bakim.invertorNumarasi);
        y += lineHeight;
      }
      
      if (bakim.cihazTipi) {
        drawField(pdf, MARGIN, y, 'Cihaz Tipi:', fixTurkishChars(bakim.cihazTipi));
        y += lineHeight;
      }
      
      y += 2;
      
      // Genel durum
      if (bakim.genelDurum) {
        const durumMap: Record<string, string> = {
          'iyi': 'Iyi',
          'orta': 'Orta',
          'kotu': 'Kotu'
        };
        const durumColorMap: Record<string, string> = {
          'iyi': STATUS_COLORS['cozuldu'],
          'orta': STATUS_COLORS['devam-ediyor'],
          'kotu': PRIORITY_COLORS['kritik']
        };
        drawField(pdf, MARGIN, y, 'Genel Durum:', durumMap[bakim.genelDurum] || bakim.genelDurum);
        y += lineHeight;
      }
      
      y += 2;
      
      // Kontrol Listesi (Elektrik Bakım için) - Sadece genel durum
      if (options.bakimTipi === 'elektrik' && bakim.kontroller) {
        const kontroller = bakim.kontroller;
        const kontrolListesi: string[] = [];
        
        // Tüm kontrol kategorilerini topla
        const kategoriler = [
          { ad: 'OG Sistemleri', key: 'ogSistemleri' },
          { ad: 'Trafolar', key: 'trafolar' },
          { ad: 'Invertorler', key: 'invertorler' },
          { ad: 'AG Dagitim Panosu', key: 'agDagitimPanosu' },
          { ad: 'Toplama Kutulari', key: 'toplamaKutulari' },
          { ad: 'PV Modulleri', key: 'pvModulleri' }
        ];
        
        kategoriler.forEach((kategori) => {
          const data = kontroller[kategori.key];
          if (data && typeof data === 'object') {
            const durum = data.genel || data.durum;
            if (durum && durum !== 'false' && durum !== false && durum !== '') {
              kontrolListesi.push(`  • ${kategori.ad}: ${fixTurkishChars(String(durum))}`);
            }
          }
        });
        
        // Sadece kontrol varsa göster
        if (kontrolListesi.length > 0) {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(COLORS.text);
          pdf.setFontSize(10);
          pdf.text('Kontrol Listesi:', MARGIN, y);
          y += 6;
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(COLORS.textLight);
          
          kontrolListesi.forEach((kontrol) => {
            pdf.text(kontrol, MARGIN + 3, y);
            y += 4;
          });
          
          y += 3;
        }
      }
      
      // Kontrol Listesi (Mekanik Bakım için) - Sadece genel durum
      if (options.bakimTipi === 'mekanik' && bakim.kontroller) {
        const kontroller = bakim.kontroller;
        const kontrolListesi: string[] = [];
        
        // Tüm kontrol kategorilerini topla
        const mekanikKategoriler = [
          { ad: 'Panel Temizligi', key: 'panelTemizligi' },
          { ad: 'Yapisel Kontroller', key: 'yapiselKontroller' },
          { ad: 'Kablolar', key: 'kablolar' },
          { ad: 'Guvenlik Ekipmanlari', key: 'guvenlikEkipmanlari' },
          { ad: 'Montaj Elemanlari', key: 'montajElemanlari' }
        ];
        
        mekanikKategoriler.forEach((kategori) => {
          const data = kontroller[kategori.key];
          if (data && typeof data === 'object') {
            const durum = data.genel || data.durum;
            if (durum && durum !== 'false' && durum !== false && durum !== '') {
              kontrolListesi.push(`  • ${kategori.ad}: ${fixTurkishChars(String(durum))}`);
            }
          }
        });
        
        // Sadece kontrol varsa göster
        if (kontrolListesi.length > 0) {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(COLORS.text);
          pdf.setFontSize(10);
          pdf.text('Kontrol Listesi:', MARGIN, y);
          y += 6;
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(COLORS.textLight);
          
          kontrolListesi.forEach((kontrol) => {
            pdf.text(kontrol, MARGIN + 3, y);
            y += 4;
          });
          
          y += 3;
        }
      }
      
      // Açıklama/Not
      const aciklama = bakim.notlar || bakim.aciklama || bakim.yapilacakIs || bakim.isAciklamasi;
      if (aciklama) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(COLORS.text);
        pdf.setFontSize(10);
        pdf.text('Notlar:', MARGIN, y);
        y += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(COLORS.textLight);
        const notlarText = fixTurkishChars(aciklama);
        const notlarLines = wrapText(pdf, notlarText, CONTENT_WIDTH - 10);
        
        for (const line of notlarLines) {
          if (y > PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN - 10) {
            drawFooter(pdf, currentPage, estimatedPages);
            pdf.addPage();
            currentPage++;
            y = HEADER_HEIGHT + MARGIN + 5;
            drawHeader(pdf, currentPage, options.company, title);
          }
          pdf.text(line, MARGIN + 5, y);
          y += 5;
        }
        
        y += 5;
      }
      
      // Fotoğraflar (varsa) - Thumbnail grid
      const fotograflar = bakim.fotograflar || [];
      if (fotograflar.length > 0) {
        y += 5;
        
        if (y > PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN - 60) {
          drawFooter(pdf, currentPage, estimatedPages);
          pdf.addPage();
          currentPage++;
          y = HEADER_HEIGHT + MARGIN + 5;
          drawHeader(pdf, currentPage, options.company, title);
        }
        
        // Fotoğraf başlığı
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(COLORS.text);
        pdf.setFontSize(10);
        pdf.text('Fotograflar:', MARGIN, y);
        y += 7;
        
        // Fotoğrafları 3'lü grid'de göster
        const photoSize = 30; // mm
        const photoGap = 5;
        const photosPerRow = 3;
        let photoX = MARGIN;
        let photoRow = 0;
        
        for (let i = 0; i < Math.min(fotograflar.length, 6); i++) {
          // Yeni satır gerekirse
          if (i > 0 && i % photosPerRow === 0) {
            y += photoSize + photoGap;
            photoX = MARGIN;
            photoRow++;
            
            // Sayfa taşması kontrolü
            if (y + photoSize > PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN) {
              drawFooter(pdf, currentPage, estimatedPages);
              pdf.addPage();
              currentPage++;
              y = HEADER_HEIGHT + MARGIN + 5;
              drawHeader(pdf, currentPage, options.company, title);
              photoRow = 0;
            }
          }
          
          try {
            const photoUrl = fotograflar[i];
            
            // Fotoğraf kutusu çiz
            pdf.setDrawColor(COLORS.border);
            pdf.setLineWidth(0.5);
            pdf.setFillColor(COLORS.white);
            pdf.roundedRect(photoX, y, photoSize, photoSize, 2, 2, 'FD');
            
            // Gerçek fotoğrafı yüklemeyi dene (timeout ile)
            try {
              const imageData = await Promise.race([
                loadImage(photoUrl),
                new Promise<string>((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout')), 3000)
                )
              ]);
              
              // Fotoğrafı PDF'e ekle
              pdf.addImage(imageData, 'JPEG', photoX + 1, y + 1, photoSize - 2, photoSize - 2);
              
            } catch (imgError) {
              // Fotoğraf yüklenemezse placeholder göster
              pdf.setFillColor(COLORS.light);
              pdf.rect(photoX + 2, y + 2, photoSize - 4, photoSize - 4, 'F');
              
              pdf.setFontSize(7);
              pdf.setTextColor(COLORS.textLight);
              pdf.text(`Foto ${i + 1}`, photoX + photoSize / 2, y + photoSize / 2, { align: 'center' });
            }
            
          } catch (error) {
            console.warn('Fotoğraf yüklenemedi:', error);
            
            // Hata durumunda placeholder
            pdf.setFillColor(COLORS.light);
            pdf.roundedRect(photoX, y, photoSize, photoSize, 2, 2, 'F');
            
            pdf.setFontSize(8);
            pdf.setTextColor(COLORS.textLight);
            pdf.text('?', photoX + photoSize / 2, y + photoSize / 2, { align: 'center' });
          }
          
          photoX += photoSize + photoGap;
        }
        
        y += photoSize + 5;
        
        // Eğer 6'dan fazla fotoğraf varsa
        if (fotograflar.length > 6) {
          pdf.setFontSize(8);
          pdf.setTextColor(COLORS.textLight);
          pdf.text(`+${fotograflar.length - 6} fotograf daha`, MARGIN, y);
          y += 5;
        }
      }
      
      drawFooter(pdf, currentPage, estimatedPages);
      bakimIndex++;
    }
    
    // Dosya adı
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const fileName = `bakim_raporu_${options.bakimTipi}_${timestamp}.pdf`;
    
    pdf.save(fileName);
    
    return Promise.resolve();
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    throw error;
  }
}

/**
 * Üretim Verileri için PDF Export
 */
export async function exportUretimVerileriToPDF(options: {
  veriler: any[];
  santralMap: Record<string, any>;
  selectedSantrals: string[];
  viewYear: number;
  company?: any | null;
  toplamUretim: number;
  toplamCO2: number;
  ortalamaPerformans: number;
  aylikData?: Record<string, number>;
  aylikTahmin?: Record<string, number>;
  chartElementId?: string;
  toplamGelir?: number;
  enYuksekGun?: any;
  enYuksekPerf?: any;
}): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const estimatedPages = 2;
    let currentPage = 1;
    
    // Özet sayfası
    drawHeader(pdf, currentPage, options.company, 'URETIM VERILERI RAPORU');
    
    let y = HEADER_HEIGHT + MARGIN + 8;
    
    // Başlık
    pdf.setTextColor(COLORS.text);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${options.viewYear} Yili Uretim Ozeti`, MARGIN, y);
    y += 8;
    
    // Ana KPI'lar - 3 sütun (Daha büyük)
    const boxWidth = (CONTENT_WIDTH - 10) / 3;
    const boxHeight = 24; // Orta boy
    
    // Toplam Üretim
    drawStatBox(pdf, MARGIN, y, boxWidth, boxHeight, 'Toplam Uretim', 
      `${formatTurkishNumber(options.toplamUretim, 0)} kWh`, COLORS.primary);
    
    // CO₂ Tasarruf
    drawStatBox(pdf, MARGIN + boxWidth + 5, y, boxWidth, boxHeight, 'CO2 Tasarruf', 
      `${formatTurkishNumber(options.toplamCO2, 0)} kg`, STATUS_COLORS['cozuldu']);
    
    // Ortalama Performans
    drawStatBox(pdf, MARGIN + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 'Ort. Perf', 
      `%${options.ortalamaPerformans}`, PRIORITY_COLORS['yuksek']);
    
    y += boxHeight + 6;
    
    // Grafik ekle (varsa) - Aynı sayfa
    if (options.chartElementId) {
      const chartElement = document.getElementById(options.chartElementId);
      if (chartElement) {
        try {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(COLORS.text);
          pdf.text('Aylik Uretim Grafigi:', MARGIN, y);
          y += 6;
          
          // Grafiği canvas'a çevir
          const canvas = await html2canvas(chartElement, {
            scale: 1.5,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = CONTENT_WIDTH;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Maksimum 70mm yükseklik (daha büyük)
          const maxHeight = 70;
          const finalHeight = Math.min(imgHeight, maxHeight);
          const finalWidth = (canvas.width * finalHeight) / canvas.height;
          
          pdf.addImage(imgData, 'PNG', MARGIN, y, finalWidth, finalHeight);
          y += finalHeight + 6;
          
        } catch (error) {
          console.warn('Grafik eklenemedi:', error);
        }
      }
    }
    
    
    // Aylık üretim tablosu (detaylı - tahmin karşılaştırmalı)
    if (options.aylikData && options.aylikTahmin) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.text);
      pdf.text('Aylik Uretim Tablosu:', MARGIN, y);
      y += 6;
      
      // Tablo başlığı
      pdf.setFillColor(COLORS.primary);
      pdf.rect(MARGIN, y, CONTENT_WIDTH, 6, 'F');
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('Ay', MARGIN + 3, y + 4);
      pdf.text('Gercek', MARGIN + 28, y + 4);
      pdf.text('Tahmin', MARGIN + 65, y + 4);
      pdf.text('Fark', MARGIN + 100, y + 4);
      pdf.text('Perf', MARGIN + 130, y + 4);
      
      y += 7;
      
      // Aylar
      const monthNames = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 
                         'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
      const monthKeys = ['ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran',
                        'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik'];
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      
      let toplamGerceklesen = 0;
      let toplamTahmin = 0;
      let enBuyukSapma = { ay: '', fark: 0 };
      
      monthKeys.forEach((key, idx) => {
        const gerceklesen = options.aylikData![key] || 0;
        const tahmin = options.aylikTahmin![key] || 0;
        const fark = gerceklesen - tahmin;
        const performans = tahmin > 0 ? Math.round((gerceklesen / tahmin) * 100) : 0;
        
        toplamGerceklesen += gerceklesen;
        toplamTahmin += tahmin;
        
        // En büyük sapma
        if (Math.abs(fark) > Math.abs(enBuyukSapma.fark)) {
          enBuyukSapma = { ay: monthNames[idx], fark: fark };
        }
        
        // Zemin rengi (her ikinci satır)
        if (idx % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(MARGIN, y - 0.5, CONTENT_WIDTH, 4.5, 'F');
        }
        
        pdf.setTextColor(COLORS.text);
        pdf.setFontSize(7);
        pdf.text(monthNames[idx], MARGIN + 3, y + 2.5);
        
        pdf.setTextColor(COLORS.textLight);
        pdf.text(formatTurkishNumber(gerceklesen / 1000, 1), MARGIN + 28, y + 2.5);
        pdf.text(formatTurkishNumber(tahmin / 1000, 1), MARGIN + 65, y + 2.5);
        
        // Fark rengi (pozitif yeşil, negatif kırmızı)
        const farkColor = fark >= 0 ? STATUS_COLORS['cozuldu'] : PRIORITY_COLORS['kritik'];
        pdf.setTextColor(farkColor);
        const farkText = (fark >= 0 ? '+' : '') + formatTurkishNumber(fark / 1000, 1);
        pdf.text(farkText, MARGIN + 100, y + 2.5);
        
        // Performans
        const perfColor = performans >= 100 ? STATUS_COLORS['cozuldu'] : 
                         performans >= 80 ? STATUS_COLORS['devam-ediyor'] : 
                         PRIORITY_COLORS['kritik'];
        pdf.setTextColor(perfColor);
        pdf.text(`%${performans}`, MARGIN + 135, y + 2.5);
        
        y += 4.5; // Dengeli
      });
      
      // Toplam satırı
      y += 1;
      pdf.setFillColor(COLORS.light);
      pdf.rect(MARGIN, y - 0.5, CONTENT_WIDTH, 6, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(COLORS.text);
      pdf.text('TOPLAM', MARGIN + 3, y + 3.5);
      pdf.text(formatTurkishNumber(toplamGerceklesen / 1000, 1), MARGIN + 28, y + 3.5);
      pdf.text(formatTurkishNumber(toplamTahmin / 1000, 1), MARGIN + 65, y + 3.5);
      
      const toplamFark = toplamGerceklesen - toplamTahmin;
      const toplamPerf = toplamTahmin > 0 ? Math.round((toplamGerceklesen / toplamTahmin) * 100) : 0;
      
      pdf.setTextColor(toplamFark >= 0 ? STATUS_COLORS['cozuldu'] : PRIORITY_COLORS['kritik']);
      pdf.text((toplamFark >= 0 ? '+' : '') + formatTurkishNumber(toplamFark / 1000, 1), MARGIN + 100, y + 3.5);
      
      pdf.setTextColor(toplamPerf >= 100 ? STATUS_COLORS['cozuldu'] : PRIORITY_COLORS['kritik']);
      pdf.text(`%${toplamPerf}`, MARGIN + 135, y + 3.5);
      
      y += 9;
      
      // Önemli metrikler - 3 mini kart
      const enYuksekAy = monthKeys.reduce((max, key, idx) => {
        const val = options.aylikData![key] || 0;
        return val > (options.aylikData![max] || 0) ? key : max;
      }, monthKeys[0]);
      const enYuksekUretim = options.aylikData![enYuksekAy] || 0;
      const enYuksekAyIndex = monthKeys.indexOf(enYuksekAy);
      
      const enYuksekPerfAy = monthKeys.reduce((max, key, idx) => {
        const gercek = options.aylikData![key] || 0;
        const tahmin = options.aylikTahmin![key] || 1;
        const perf = (gercek / tahmin) * 100;
        const maxGercek = options.aylikData![max] || 0;
        const maxTahmin = options.aylikTahmin![max] || 1;
        const maxPerf = (maxGercek / maxTahmin) * 100;
        return perf > maxPerf ? key : max;
      }, monthKeys[0]);
      const enYuksekPerf = Math.round(((options.aylikData![enYuksekPerfAy] || 0) / (options.aylikTahmin![enYuksekPerfAy] || 1)) * 100);
      const enYuksekPerfIndex = monthKeys.indexOf(enYuksekPerfAy);
      
      const metricBoxWidth = (CONTENT_WIDTH - 10) / 3;
      const metricBoxHeight = 20; // Daha büyük
      
      // En Yüksek Üretim
      pdf.setDrawColor(COLORS.border);
      pdf.setLineWidth(0.5);
      pdf.setFillColor(COLORS.white);
      pdf.roundedRect(MARGIN, y, metricBoxWidth, metricBoxHeight, 2, 2, 'FD');
      pdf.setFillColor(PRIORITY_COLORS['kritik']);
      pdf.rect(MARGIN, y, 3, metricBoxHeight, 'F');
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textLight);
      pdf.text('En Yuksek Uretim', MARGIN + 5, y + 5);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.text);
      pdf.text(formatTurkishNumber(enYuksekUretim, 0) + ' kWh', MARGIN + 5, y + 12);
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textLight);
      pdf.text(monthNames[enYuksekAyIndex], MARGIN + 5, y + 17);
      
      // En Yüksek Performans
      pdf.setDrawColor(COLORS.border);
      pdf.setFillColor(COLORS.white);
      pdf.roundedRect(MARGIN + metricBoxWidth + 5, y, metricBoxWidth, metricBoxHeight, 2, 2, 'FD');
      pdf.setFillColor(PRIORITY_COLORS['yuksek']);
      pdf.rect(MARGIN + metricBoxWidth + 5, y, 3, metricBoxHeight, 'F');
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textLight);
      pdf.text('En Yuksek Performans', MARGIN + metricBoxWidth + 10, y + 5);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.text);
      pdf.text(`%${enYuksekPerf}`, MARGIN + metricBoxWidth + 10, y + 12);
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textLight);
      pdf.text(monthNames[enYuksekPerfIndex], MARGIN + metricBoxWidth + 10, y + 17);
      
      // En Büyük Sapma
      pdf.setDrawColor(COLORS.border);
      pdf.setFillColor(COLORS.white);
      pdf.roundedRect(MARGIN + (metricBoxWidth + 5) * 2, y, metricBoxWidth, metricBoxHeight, 2, 2, 'FD');
      
      const sapmaColor = enBuyukSapma.fark >= 0 ? STATUS_COLORS['cozuldu'] : PRIORITY_COLORS['kritik'];
      pdf.setFillColor(sapmaColor);
      pdf.rect(MARGIN + (metricBoxWidth + 5) * 2, y, 3, metricBoxHeight, 'F');
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textLight);
      pdf.text('En Buyuk Sapma', MARGIN + (metricBoxWidth + 5) * 2 + 5, y + 5);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(sapmaColor);
      const sapmaKWh = formatTurkishNumber(Math.abs(enBuyukSapma.fark), 0);
      pdf.text(`${enBuyukSapma.fark >= 0 ? '+' : '-'}${sapmaKWh} kWh`, MARGIN + (metricBoxWidth + 5) * 2 + 5, y + 12);
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textLight);
      pdf.text(`${enBuyukSapma.ay} (${enBuyukSapma.fark >= 0 ? 'Fazla' : 'Hedef alti'})`, MARGIN + (metricBoxWidth + 5) * 2 + 5, y + 17);
    }
    
    drawFooter(pdf, currentPage, estimatedPages);
    
    // Dosya adı
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const santralPart = options.selectedSantrals.length === 1 
      ? options.santralMap[options.selectedSantrals[0]]?.ad || 'santral'
      : 'toplam';
    const fileName = `uretim_raporu_${santralPart}_${options.viewYear}_${timestamp}.pdf`;
    
    pdf.save(fileName);
    
    return Promise.resolve();
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    throw error;
  }
}

/**
 * Stok Kontrol için PDF Export
 */
export async function exportStokToPDF(options: {
  stoklar: any[];
  company?: any | null;
  sahaMap?: Record<string, { id: string; ad: string }>;
  santralMap?: Record<string, { id: string; ad: string }>;
  filters?: {
    category?: string;
    status?: string;
    saha?: string;
  };
}): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const estimatedPages = 1 + options.stoklar.length;
    let currentPage = 1;
    
    // Özet sayfası
    drawHeader(pdf, currentPage, options.company, 'STOK KONTROL RAPORU');
    
    let y = HEADER_HEIGHT + MARGIN + 8;
    
    // Başlık
    pdf.setTextColor(COLORS.text);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Ozet Istatistikler', MARGIN, y);
    y += 10;
    
    // İstatistikler
    const total = options.stoklar.length;
    const normal = options.stoklar.filter((s: any) => s.durum === 'normal').length;
    const dusuk = options.stoklar.filter((s: any) => s.durum === 'dusuk').length;
    const kritik = options.stoklar.filter((s: any) => s.durum === 'kritik').length;
    
    // Toplam değer hesapla
    const toplamDeger = options.stoklar.reduce((sum: number, s: any) => 
      sum + (s.mevcutStok * s.birimFiyat), 0
    );
    
    const boxWidth = (CONTENT_WIDTH - 15) / 4;
    const boxHeight = 25;
    
    // Durum kutuları
    drawStatBox(pdf, MARGIN, y, boxWidth, boxHeight, 'Toplam', total.toString(), COLORS.primary);
    drawStatBox(pdf, MARGIN + boxWidth + 5, y, boxWidth, boxHeight, 'Normal', normal.toString(), STATUS_COLORS['cozuldu']);
    drawStatBox(pdf, MARGIN + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 'Dusuk', dusuk.toString(), STATUS_COLORS['devam-ediyor']);
    drawStatBox(pdf, MARGIN + (boxWidth + 5) * 3, y, boxWidth, boxHeight, 'Kritik', kritik.toString(), PRIORITY_COLORS['kritik']);
    
    y += boxHeight + 12;
    
    // Toplam değer kutusu
    pdf.setDrawColor(COLORS.primary);
    pdf.setLineWidth(2);
    pdf.setFillColor(COLORS.white);
    pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 25, 3, 3, 'FD');
    
    // Sol kenar renk çubuğu
    pdf.setFillColor(COLORS.primary);
    pdf.rect(MARGIN, y, 4, 25, 'F');
    
    pdf.setTextColor(COLORS.textLight);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Toplam Stok Degeri', MARGIN + 10, y + 10);
    
    pdf.setTextColor(COLORS.primary);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    const degerText = formatTurkishCurrency(toplamDeger) + ' TL';
    pdf.text(degerText, MARGIN + 10, y + 20);
    
    y += 30;
    
    // Filtre bilgisi (varsa)
    if (options.filters) {
      y += 3;
      
      const filters = [];
      if (options.filters.category && options.filters.category !== 'all') {
        filters.push(`Kategori: ${fixTurkishChars(options.filters.category)}`);
      }
      if (options.filters.status && options.filters.status !== 'all') {
        const durumMap: Record<string, string> = {
          'normal': 'Normal',
          'dusuk': 'Dusuk Stok',
          'kritik': 'Kritik Stok'
        };
        filters.push(`Durum: ${durumMap[options.filters.status] || options.filters.status}`);
      }
      if (options.filters.saha && options.filters.saha !== 'all') {
        const sahaAd = options.sahaMap?.[options.filters.saha]?.ad;
        if (sahaAd) {
          filters.push(`Saha: ${fixTurkishChars(sahaAd)}`);
        }
      }
      
      if (filters.length > 0) {
        pdf.setDrawColor(COLORS.border);
        pdf.setLineWidth(0.5);
        pdf.setFillColor(COLORS.light);
        pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 8, 2, 2, 'FD');
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(COLORS.textLight);
        pdf.text('Filtreler: ' + filters.join(' | '), MARGIN + 5, y + 5.5);
        y += 10;
      }
    }
    
    drawFooter(pdf, currentPage, estimatedPages);
    
    // Stok detay sayfaları
    let stokIndex = 0;
    
    for (const stok of options.stoklar) {
      // Her stok yeni sayfada
      pdf.addPage();
      currentPage++;
      y = HEADER_HEIGHT + MARGIN + 5;
      drawHeader(pdf, currentPage, options.company, 'STOK KONTROL RAPORU');
      
      // Stok başlığı
      const malzemeAdi = fixTurkishChars(stok.malzemeAdi || 'Bilinmeyen');
      
      pdf.setDrawColor(COLORS.border);
      pdf.setLineWidth(1);
      pdf.setFillColor(COLORS.white);
      pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 10, 2, 2, 'FD');
      
      pdf.setFillColor(COLORS.primary);
      pdf.rect(MARGIN, y, 3, 10, 'F');
      
      pdf.setTextColor(COLORS.text);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(truncateText(malzemeAdi, 60), MARGIN + 8, y + 7);
      
      pdf.setFontSize(8);
      pdf.setTextColor(COLORS.textLight);
      pdf.text(`#${stokIndex + 1}`, PAGE_WIDTH - MARGIN - 5, y + 7, { align: 'right' });
      
      y += 13;
      
      // Durum badge
      const durumMap: Record<string, string> = {
        'normal': 'Normal',
        'dusuk': 'Dusuk Stok',
        'kritik': 'Kritik Stok'
      };
      const durumColorMap: Record<string, string> = {
        'normal': STATUS_COLORS['cozuldu'],
        'dusuk': STATUS_COLORS['devam-ediyor'],
        'kritik': PRIORITY_COLORS['kritik']
      };
      drawBadge(pdf, MARGIN, y, durumMap[stok.durum] || 'Normal', durumColorMap[stok.durum] || STATUS_COLORS['cozuldu']);
      
      // Kategori badge
      if (stok.kategori) {
        drawBadge(pdf, MARGIN + 50, y, fixTurkishChars(stok.kategori), PRIORITY_COLORS['normal']);
      }
      
      y += 12;
      
      // Detay bilgileri
      const lineHeight = 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      // Saha
      const sahaAd = stok.sahaId 
        ? fixTurkishChars(options.sahaMap?.[stok.sahaId]?.ad || 'Bilinmeyen')
        : 'Genel Depo';
      drawField(pdf, MARGIN, y, 'Saha:', sahaAd);
      y += lineHeight;
      
      // Santral (varsa)
      if (stok.santralId) {
        const santralAd = fixTurkishChars(options.santralMap?.[stok.santralId]?.ad || '-');
        drawField(pdf, MARGIN, y, 'Santral:', santralAd);
        y += lineHeight;
      }
      
      // Konum (varsa)
      if (stok.konum) {
        drawField(pdf, MARGIN, y, 'Konum:', fixTurkishChars(stok.konum));
        y += lineHeight;
      }
      
      // Birim
      drawField(pdf, MARGIN, y, 'Birim:', stok.birim || '-');
      y += lineHeight;
      
      y += 3;
      
      // Stok bilgileri - öne çıkan kutu
      pdf.setDrawColor(COLORS.border);
      pdf.setLineWidth(0.5);
      pdf.setFillColor(COLORS.light);
      pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 20, 2, 2, 'FD');
      
      y += 7;
      
      // Mevcut Stok
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.text);
      pdf.setFontSize(10);
      pdf.text('Mevcut Stok:', MARGIN + 5, y);
      
      pdf.setFontSize(14);
      pdf.setTextColor(COLORS.primary);
      const mevcutText = formatTurkishNumber(stok.mevcutStok, 0) + ' ' + stok.birim;
      pdf.text(mevcutText, MARGIN + 35, y);
      
      // Minimum Seviye
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textLight);
      pdf.setFontSize(9);
      const minText = 'Min: ' + formatTurkishNumber(stok.minimumStokSeviyesi, 0) + ' ' + stok.birim;
      pdf.text(minText, MARGIN + 80, y);
      
      y += 8;
      
      // Birim Fiyat ve Toplam Değer
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(COLORS.textLight);
      pdf.setFontSize(9);
      const birimFiyatText = 'Birim Fiyat: ' + formatTurkishCurrency(stok.birimFiyat) + ' TL';
      pdf.text(birimFiyatText, MARGIN + 5, y);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.text);
      const toplamDeger = stok.mevcutStok * stok.birimFiyat;
      const toplamText = 'Toplam: ' + formatTurkishCurrency(toplamDeger) + ' TL';
      pdf.text(toplamText, MARGIN + 80, y);
      
      y += 8;
      
      // Tedarikçi (varsa)
      if (stok.tedarikci) {
        drawField(pdf, MARGIN, y, 'Tedarikci:', fixTurkishChars(stok.tedarikci));
        y += lineHeight;
      }
      
      // Son güncelleme (varsa)
      if (stok.sonGuncelleme) {
        const tarih = format(stok.sonGuncelleme.toDate(), 'dd.MM.yyyy HH:mm');
        drawField(pdf, MARGIN, y, 'Son Guncelleme:', tarih);
        y += lineHeight;
      }
      
      y += 3;
      
      // Notlar (varsa)
      if (stok.notlar) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(COLORS.text);
        pdf.setFontSize(10);
        pdf.text('Notlar:', MARGIN, y);
        y += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(COLORS.textLight);
        const notlarText = fixTurkishChars(stok.notlar);
        const notlarLines = wrapText(pdf, notlarText, CONTENT_WIDTH - 10);
        
        for (const line of notlarLines) {
          if (y > PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN - 10) {
            drawFooter(pdf, currentPage, estimatedPages);
            pdf.addPage();
            currentPage++;
            y = HEADER_HEIGHT + MARGIN + 5;
            drawHeader(pdf, currentPage, options.company, 'STOK KONTROL RAPORU');
          }
          pdf.text(line, MARGIN + 5, y);
          y += 5;
        }
        
        y += 5;
      }
      
      // Fotoğraflar (varsa) - Thumbnail grid
      const fotograflar = stok.resimler || [];
      if (fotograflar.length > 0) {
        y += 5;
        
        if (y > PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN - 60) {
          drawFooter(pdf, currentPage, estimatedPages);
          pdf.addPage();
          currentPage++;
          y = HEADER_HEIGHT + MARGIN + 5;
          drawHeader(pdf, currentPage, options.company, 'STOK KONTROL RAPORU');
        }
        
        // Fotoğraf başlığı
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(COLORS.text);
        pdf.setFontSize(10);
        pdf.text('Urun Fotograflari:', MARGIN, y);
        y += 7;
        
        // Fotoğrafları 3'lü grid'de göster
        const photoSize = 30; // mm
        const photoGap = 5;
        const photosPerRow = 3;
        let photoX = MARGIN;
        let photoRow = 0;
        
        for (let i = 0; i < Math.min(fotograflar.length, 6); i++) {
          // Yeni satır gerekirse
          if (i > 0 && i % photosPerRow === 0) {
            y += photoSize + photoGap;
            photoX = MARGIN;
            photoRow++;
            
            // Sayfa taşması kontrolü
            if (y + photoSize > PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN) {
              drawFooter(pdf, currentPage, estimatedPages);
              pdf.addPage();
              currentPage++;
              y = HEADER_HEIGHT + MARGIN + 5;
              drawHeader(pdf, currentPage, options.company, 'STOK KONTROL RAPORU');
              photoRow = 0;
            }
          }
          
          try {
            const photoUrl = fotograflar[i];
            
            // Fotoğraf kutusu çiz
            pdf.setDrawColor(COLORS.border);
            pdf.setLineWidth(0.5);
            pdf.setFillColor(COLORS.white);
            pdf.roundedRect(photoX, y, photoSize, photoSize, 2, 2, 'FD');
            
            // Gerçek fotoğrafı yüklemeyi dene (timeout ile)
            try {
              const imageData = await Promise.race([
                loadImage(photoUrl),
                new Promise<string>((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout')), 3000)
                )
              ]);
              
              // Fotoğrafı PDF'e ekle
              pdf.addImage(imageData, 'JPEG', photoX + 1, y + 1, photoSize - 2, photoSize - 2);
              
            } catch (imgError) {
              // Fotoğraf yüklenemezse placeholder göster
              pdf.setFillColor(COLORS.light);
              pdf.rect(photoX + 2, y + 2, photoSize - 4, photoSize - 4, 'F');
              
              pdf.setFontSize(7);
              pdf.setTextColor(COLORS.textLight);
              pdf.text(`Foto ${i + 1}`, photoX + photoSize / 2, y + photoSize / 2, { align: 'center' });
            }
            
          } catch (error) {
            console.warn('Fotoğraf yüklenemedi:', error);
            
            // Hata durumunda placeholder
            pdf.setFillColor(COLORS.light);
            pdf.roundedRect(photoX, y, photoSize, photoSize, 2, 2, 'F');
            
            pdf.setFontSize(8);
            pdf.setTextColor(COLORS.textLight);
            pdf.text('?', photoX + photoSize / 2, y + photoSize / 2, { align: 'center' });
          }
          
          photoX += photoSize + photoGap;
        }
        
        y += photoSize + 5;
        
        // Eğer 6'dan fazla fotoğraf varsa
        if (fotograflar.length > 6) {
          pdf.setFontSize(8);
          pdf.setTextColor(COLORS.textLight);
          pdf.text(`+${fotograflar.length - 6} fotograf daha`, MARGIN, y);
          y += 5;
        }
      }
      
      drawFooter(pdf, currentPage, estimatedPages);
      stokIndex++;
    }
    
    // Dosya adı
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const fileName = `stok_raporu_${timestamp}.pdf`;
    
    pdf.save(fileName);
    
    return Promise.resolve();
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    throw error;
  }
}

export default {
  exportArizalarToPDF,
  exportElektrikKesintileriToPDF,
  exportBakimToPDF,
  exportUretimVerileriToPDF,
  exportStokToPDF,
};

