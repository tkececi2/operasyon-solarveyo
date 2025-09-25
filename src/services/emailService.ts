import emailjs from '@emailjs/browser';
import { formatDate, formatDateTime } from '../utils/formatters';
import type { Fault, User } from '../types';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_solarveyo';
const EMAILJS_TEMPLATE_ID = 'template_solarveyo';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Bu production'da env'den gelecek

export interface EmailNotificationData {
  type: 'fault_created' | 'fault_updated' | 'fault_resolved' | 'maintenance_due' | 'system_alert';
  recipient: {
    name: string;
    email: string;
  };
  subject: string;
  data: any;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private initialized = false;

  // Initialize EmailJS
  init() {
    if (!this.initialized) {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      this.initialized = true;
    }
  }

  // Send email notification
  async sendNotification(notificationData: EmailNotificationData): Promise<boolean> {
    try {
      this.init();

      const template = this.generateTemplate(notificationData);
      
      const templateParams = {
        to_name: notificationData.recipient.name,
        to_email: notificationData.recipient.email,
        subject: template.subject,
        message_html: template.html,
        message_text: template.text,
        priority: notificationData.priority || 'normal',
        timestamp: new Date().toISOString()
      };

      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );

      console.log('Email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // Generate email template based on notification type
  private generateTemplate(data: EmailNotificationData): EmailTemplate {
    switch (data.type) {
      case 'fault_created':
        return this.generateFaultCreatedTemplate(data);
      case 'fault_updated':
        return this.generateFaultUpdatedTemplate(data);
      case 'fault_resolved':
        return this.generateFaultResolvedTemplate(data);
      case 'maintenance_due':
        return this.generateMaintenanceDueTemplate(data);
      case 'system_alert':
        return this.generateSystemAlertTemplate(data);
      default:
        return this.generateGenericTemplate(data);
    }
  }

  // Fault Created Template
  private generateFaultCreatedTemplate(data: EmailNotificationData): EmailTemplate {
    const fault = data.data as Fault;
    
    const subject = `🚨 Yeni Arıza Bildirimi - ${fault.baslik}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Yeni Arıza Bildirimi</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            ${fault.baslik}
          </h2>
          
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-weight: bold;">
              Öncelik: ${this.getPriorityText(fault.oncelik)} 
              ${fault.oncelik === 'kritik' ? '🔴' : fault.oncelik === 'yuksek' ? '🟠' : '🟡'}
            </p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Saha:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${fault.saha}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Durum:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${this.getStatusText(fault.durum)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Tarih:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${formatDateTime(fault.olusturmaTarihi.toDate())}</td>
            </tr>
          </table>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Açıklama:</h3>
            <p style="color: #1f2937; line-height: 1.6; margin-bottom: 0;">${fault.aciklama}</p>
          </div>
          
          ${fault.konum ? `
          <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;">
              📍 <strong>Konum:</strong> ${fault.konum}
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Bu otomatik bir bildirimdir. Lütfen sistemden detayları kontrol edin.
            </p>
          </div>
        </div>
      </div>
    `;
    
    const text = `
      YENİ ARIZA BİLDİRİMİ
      
      Başlık: ${fault.baslik}
      Saha: ${fault.saha}
      Öncelik: ${this.getPriorityText(fault.oncelik)}
      Durum: ${this.getStatusText(fault.durum)}
      Tarih: ${formatDateTime(fault.olusturmaTarihi.toDate())}
      
      Açıklama:
      ${fault.aciklama}
      
      ${fault.konum ? `Konum: ${fault.konum}` : ''}
      
      Bu otomatik bir bildirimdir.
    `;
    
    return { subject, html, text };
  }

  // Fault Updated Template
  private generateFaultUpdatedTemplate(data: EmailNotificationData): EmailTemplate {
    const fault = data.data as Fault;
    
    const subject = `🔄 Arıza Güncellendi - ${fault.baslik}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔄 Arıza Güncellendi</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">${fault.baslik}</h2>
          
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1e40af; font-weight: bold;">
              Güncel Durum: ${this.getStatusText(fault.durum)}
            </p>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">
            Arıza durumunda güncelleme yapılmıştır. Lütfen sistemi kontrol ederek gerekli işlemleri gerçekleştirin.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="#" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Detayları Görüntüle
            </a>
          </div>
        </div>
      </div>
    `;
    
    const text = `
      ARIZA GÜNCELLENDİ
      
      Başlık: ${fault.baslik}
      Güncel Durum: ${this.getStatusText(fault.durum)}
      
      Arıza durumunda güncelleme yapılmıştır.
    `;
    
    return { subject, html, text };
  }

  // Fault Resolved Template
  private generateFaultResolvedTemplate(data: EmailNotificationData): EmailTemplate {
    const fault = data.data as Fault;
    
    const subject = `✅ Arıza Çözüldü - ${fault.baslik}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">✅ Arıza Çözüldü</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">${fault.baslik}</h2>
          
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #047857; font-weight: bold;">
              🎉 Arıza başarıyla çözülmüştür!
            </p>
          </div>
          
          ${fault.cozumAciklamasi ? `
          <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Çözüm Açıklaması:</h3>
            <p style="color: #1f2937; line-height: 1.6; margin-bottom: 0;">${fault.cozumAciklamasi}</p>
          </div>
          ` : ''}
          
          <p style="color: #374151; line-height: 1.6; text-align: center; font-style: italic;">
            Teşekkürler! Sistem normal çalışma durumuna geçmiştir.
          </p>
        </div>
      </div>
    `;
    
    const text = `
      ARIZA ÇÖZÜLDÜ ✅
      
      Başlık: ${fault.baslik}
      
      ${fault.cozumAciklamasi ? `Çözüm: ${fault.cozumAciklamasi}` : ''}
      
      Arıza başarıyla çözülmüştür.
    `;
    
    return { subject, html, text };
  }

  // Maintenance Due Template
  private generateMaintenanceDueTemplate(data: EmailNotificationData): EmailTemplate {
    const maintenance = data.data;
    
    const subject = `⚠️ Bakım Hatırlatması - ${maintenance.title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Bakım Hatırlatması</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">${maintenance.title}</h2>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">
              Bakım zamanı yaklaşıyor!
            </p>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">
            Planlanan bakım işleminin zamanı gelmiştir. Lütfen gerekli hazırlıkları yapın.
          </p>
        </div>
      </div>
    `;
    
    const text = `
      BAKIM HATIRLATMASI
      
      ${maintenance.title}
      
      Bakım zamanı yaklaşıyor!
    `;
    
    return { subject, html, text };
  }

  // System Alert Template
  private generateSystemAlertTemplate(data: EmailNotificationData): EmailTemplate {
    const alert = data.data;
    
    const subject = `🚨 Sistem Uyarısı - ${alert.title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Sistem Uyarısı</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">${alert.title}</h2>
          
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-weight: bold;">
              Acil müdahale gerekebilir!
            </p>
          </div>
          
          <p style="color: #374151; line-height: 1.6;">
            ${alert.message}
          </p>
        </div>
      </div>
    `;
    
    const text = `
      SİSTEM UYARISI
      
      ${alert.title}
      
      ${alert.message}
    `;
    
    return { subject, html, text };
  }

  // Generic Template
  private generateGenericTemplate(data: EmailNotificationData): EmailTemplate {
    const subject = data.subject;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1f2937;">${subject}</h1>
        <p style="color: #374151; line-height: 1.6;">
          ${JSON.stringify(data.data, null, 2)}
        </p>
      </div>
    `;
    
    const text = `${subject}\n\n${JSON.stringify(data.data, null, 2)}`;
    
    return { subject, html, text };
  }

  // Helper methods
  private getPriorityText(priority: string): string {
    const priorities: Record<string, string> = {
      'dusuk': 'Düşük',
      'orta': 'Orta', 
      'yuksek': 'Yüksek',
      'kritik': 'Kritik'
    };
    return priorities[priority] || priority;
  }

  private getStatusText(status: string): string {
    const statuses: Record<string, string> = {
      'acik': 'Açık',
      'devam-ediyor': 'Devam Ediyor',
      'cozuldu': 'Çözüldü',
      'iptal': 'İptal'
    };
    return statuses[status] || status;
  }

  // Bulk email sending
  async sendBulkNotifications(notifications: EmailNotificationData[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        const result = await this.sendNotification(notification);
        if (result) {
          success++;
        } else {
          failed++;
        }
        // Rate limiting - wait 100ms between emails
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Bulk email error:', error);
        failed++;
      }
    }

    return { success, failed };
  }

  // Test email functionality
  async sendTestEmail(recipient: { name: string; email: string }): Promise<boolean> {
    const testData: EmailNotificationData = {
      type: 'system_alert',
      recipient,
      subject: 'Test Email - SolarVeyo Sistem',
      data: {
        title: 'Test Bildirimi',
        message: 'Bu bir test emailidir. Email sistemi çalışıyor! 🎉'
      },
      priority: 'normal'
    };

    return await this.sendNotification(testData);
  }
}

export const emailService = new EmailService();
