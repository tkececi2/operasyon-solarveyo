import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// PDF Export
export const exportToPDF = async (
  elementId: string,
  fileName: string = 'rapor',
  options?: {
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | 'a3';
    title?: string;
    subtitle?: string;
  }
) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element bulunamadı');
    }

    // Element'i canvas'a çevir
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    // PDF oluştur
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: options?.orientation || 'portrait',
      unit: 'mm',
      format: options?.format || 'a4',
    });

    // Sayfa boyutları
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // 10mm margin
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Başlık ekle
    if (options?.title) {
      pdf.setFontSize(20);
      pdf.text(options.title, pageWidth / 2, 15, { align: 'center' });
    }

    if (options?.subtitle) {
      pdf.setFontSize(12);
      pdf.text(options.subtitle, pageWidth / 2, 25, { align: 'center' });
    }

    // Resmi ekle
    const yPosition = options?.title ? 35 : 10;
    pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);

    // Tarih ekle
    pdf.setFontSize(10);
    pdf.text(
      `Oluşturma Tarihi: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })}`,
      10,
      pageHeight - 10
    );

    // PDF'i indir
    pdf.save(`${fileName}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
    
    return true;
  } catch (error) {
    console.error('PDF export hatası:', error);
    throw error;
  }
};

// Excel Export
export const exportToExcel = (
  data: any[],
  fileName: string = 'veri',
  sheetName: string = 'Sayfa1',
  options?: {
    headers?: string[];
    columnWidths?: number[];
    dateFormat?: string;
  }
) => {
  try {
    // Worksheet oluştur
    const ws = XLSX.utils.json_to_sheet(data);

    // Özel başlıklar varsa ekle
    if (options?.headers) {
      XLSX.utils.sheet_add_aoa(ws, [options.headers], { origin: 'A1' });
    }

    // Kolon genişlikleri
    if (options?.columnWidths) {
      ws['!cols'] = options.columnWidths.map(width => ({ wch: width }));
    }

    // Workbook oluştur
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Excel dosyasını oluştur
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Dosyayı indir
    saveAs(blob, `${fileName}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Excel export hatası:', error);
    throw error;
  }
};

// CSV Export
export const exportToCSV = (
  data: any[],
  fileName: string = 'veri',
  delimiter: string = ','
) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Veri bulunamadı');
    }

    // Headers
    const headers = Object.keys(data[0]);
    let csv = headers.join(delimiter) + '\n';

    // Data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Virgül içeren değerleri tırnak içine al
        if (typeof value === 'string' && value.includes(delimiter)) {
          return `"${value}"`;
        }
        return value || '';
      });
      csv += values.join(delimiter) + '\n';
    });

    // Blob oluştur ve indir
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    
    return true;
  } catch (error) {
    console.error('CSV export hatası:', error);
    throw error;
  }
};

// Tablo verilerini export için hazırla
export const prepareTableData = (
  data: any[],
  columns: {
    key: string;
    label: string;
    format?: (value: any) => string;
  }[]
) => {
  return data.map(row => {
    const exportRow: any = {};
    columns.forEach(col => {
      const value = row[col.key];
      exportRow[col.label] = col.format ? col.format(value) : value;
    });
    return exportRow;
  });
};

// Rapor başlığı oluştur
export const generateReportHeader = (
  title: string,
  company: string,
  dateRange?: { start: Date; end: Date }
) => {
  let header = `${title}\n${company}\n`;
  
  if (dateRange) {
    header += `Tarih Aralığı: ${format(dateRange.start, 'dd.MM.yyyy', { locale: tr })} - ${format(dateRange.end, 'dd.MM.yyyy', { locale: tr })}\n`;
  } else {
    header += `Rapor Tarihi: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })}\n`;
  }
  
  return header;
};

// Finansal veri formatla
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(value);
};

// Sayı formatla
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Export menüsü için yardımcı
export const exportOptions = [
  { value: 'pdf', label: 'PDF olarak indir', icon: '📄' },
  { value: 'excel', label: 'Excel olarak indir', icon: '📊' },
  { value: 'csv', label: 'CSV olarak indir', icon: '📋' },
];

// Batch export - Birden fazla veriyi tek dosyada export et
export const batchExportToExcel = (
  datasets: {
    data: any[];
    sheetName: string;
    headers?: string[];
  }[],
  fileName: string = 'toplu_rapor'
) => {
  try {
    const wb = XLSX.utils.book_new();

    datasets.forEach(dataset => {
      const ws = XLSX.utils.json_to_sheet(dataset.data);
      
      if (dataset.headers) {
        XLSX.utils.sheet_add_aoa(ws, [dataset.headers], { origin: 'A1' });
      }
      
      XLSX.utils.book_append_sheet(wb, ws, dataset.sheetName);
    });

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, `${fileName}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Batch export hatası:', error);
    throw error;
  }
};

export default {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  prepareTableData,
  generateReportHeader,
  formatCurrency,
  formatNumber,
  exportOptions,
  batchExportToExcel,
};