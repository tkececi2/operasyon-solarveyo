import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
// Email servisi devre dışı - resendService kaldırıldı
import { analyticsService } from './analyticsService';
import { createNotification } from './notificationService';
import type { User, Company } from '../types';

export interface UserSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentCriteria {
  // Şirket kriterleri
  subscriptionStatus?: ('active' | 'trial' | 'expired' | 'cancelled')[];
  subscriptionPlan?: string[];
  companySize?: {
    min?: number;
    max?: number;
  };
  
  // Kullanıcı kriterleri
  userRole?: string[];
  lastLoginDays?: number; // Son X gün içinde giriş yapmış
  registrationDays?: number; // Son X gün içinde kayıt olmuş
  
  // Aktivite kriterleri
  hasUsedFeature?: string[];
  hasNotUsedFeature?: string[];
  
  // Coğrafi kriterler
  country?: string[];
  city?: string[];
  
  // Özel alanlar
  customFields?: Record<string, any>;
}

export interface BulkNotificationRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  segment: UserSegment | 'all';
  channels: {
    inApp: boolean;
    email: boolean;
    sms?: boolean;
  };
  emailTemplate?: {
    subject: string;
    html: string;
    text: string;
  };
  scheduledFor?: Date;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

class SegmentedNotificationService {
  
  // Kullanıcıları segmente göre filtrele
  async getUsersBySegment(segment: UserSegment): Promise<{ users: User[]; companies: Company[] }> {
    try {
      const { criteria } = segment;
      
      // Önce şirketleri filtrele
      let companiesQuery = collection(db, 'companies');
      const companiesSnapshot = await getDocs(companiesQuery);
      
      let filteredCompanies = companiesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Company))
        .filter(company => this.matchesCompanyCriteria(company, criteria));

      // Şirket ID'lerini al
      const companyIds = filteredCompanies.map(c => c.id);
      
      if (companyIds.length === 0) {
        return { users: [], companies: [] };
      }

      // Kullanıcıları filtrele
      const usersQuery = query(
        collection(db, 'kullanicilar'),
        where('companyId', 'in', companyIds.slice(0, 10)) // Firestore 'in' limiti
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      let filteredUsers = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as User))
        .filter(user => this.matchesUserCriteria(user, criteria));

      return { 
        users: filteredUsers, 
        companies: filteredCompanies.filter(c => 
          filteredUsers.some(u => u.companyId === c.id)
        )
      };
    } catch (error) {
      console.error('Segment filtreleme hatası:', error);
      analyticsService.trackError(error as Error, { context: 'segment_filtering' });
      return { users: [], companies: [] };
    }
  }

  // Şirket kriterlerini kontrol et
  private matchesCompanyCriteria(company: Company, criteria: SegmentCriteria): boolean {
    // Abonelik durumu kontrolü
    if (criteria.subscriptionStatus && criteria.subscriptionStatus.length > 0) {
      if (!criteria.subscriptionStatus.includes(company.subscriptionStatus as any)) {
        return false;
      }
    }

    // Abonelik planı kontrolü
    if (criteria.subscriptionPlan && criteria.subscriptionPlan.length > 0) {
      if (!criteria.subscriptionPlan.includes(company.subscriptionPlan || '')) {
        return false;
      }
    }

    // Şirket boyutu kontrolü (kullanıcı sayısına göre)
    if (criteria.companySize) {
      // Bu bilgi ayrıca hesaplanmalı - şimdilik atlıyoruz
    }

    return true;
  }

  // Kullanıcı kriterlerini kontrol et
  private matchesUserCriteria(user: User, criteria: SegmentCriteria): boolean {
    // Rol kontrolü
    if (criteria.userRole && criteria.userRole.length > 0) {
      if (!criteria.userRole.includes(user.rol)) {
        return false;
      }
    }

    // Son giriş kontrolü
    if (criteria.lastLoginDays) {
      const daysSinceLogin = this.getDaysSince(user.sonGirisTarihi?.toDate());
      if (daysSinceLogin > criteria.lastLoginDays) {
        return false;
      }
    }

    // Kayıt tarihi kontrolü
    if (criteria.registrationDays) {
      const daysSinceRegistration = this.getDaysSince(user.olusturmaTarihi?.toDate());
      if (daysSinceRegistration > criteria.registrationDays) {
        return false;
      }
    }

    return true;
  }

  // Tarih farkını gün olarak hesapla
  private getDaysSince(date?: Date): number {
    if (!date) return Infinity;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Toplu bildirim gönder
  async sendBulkNotification(request: BulkNotificationRequest): Promise<{
    success: number;
    failed: number;
    details: {
      inApp: { success: number; failed: number };
      email: { success: number; failed: number };
    };
  }> {
    try {
      let targetUsers: User[] = [];
      let targetCompanies: Company[] = [];

      // Hedef kullanıcıları belirle
      if (request.segment === 'all') {
        // Tüm kullanıcılar
        const allUsersSnapshot = await getDocs(collection(db, 'kullanicilar'));
        targetUsers = allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        
        const allCompaniesSnapshot = await getDocs(collection(db, 'companies'));
        targetCompanies = allCompaniesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      } else {
        // Segmente göre filtrele
        const segmentResult = await this.getUsersBySegment(request.segment);
        targetUsers = segmentResult.users;
        targetCompanies = segmentResult.companies;
      }

      const results = {
        success: 0,
        failed: 0,
        details: {
          inApp: { success: 0, failed: 0 },
          email: { success: 0, failed: 0 }
        }
      };

      // In-app bildirimler
      if (request.channels.inApp) {
        for (const user of targetUsers) {
          try {
            await createNotification({
              companyId: user.companyId,
              userId: user.id,
              title: request.title,
              message: request.message,
              type: request.type,
              metadata: {
                segment: request.segment === 'all' ? 'all' : request.segment.name,
                priority: request.priority,
                bulkNotification: true
              }
            });
            results.details.inApp.success++;
          } catch (error) {
            console.error(`In-app bildirim hatası (${user.email}):`, error);
            results.details.inApp.failed++;
          }
        }
      }

      // Email bildirimleri
      if (request.channels.email) {
        const emailPromises = targetUsers.map(async (user) => {
          try {
            const company = targetCompanies.find(c => c.id === user.companyId);
            
            // Email gönderimi devre dışı
            /* await resendService.sendEmail({
              type: 'system_alert',
              recipient: {
                name: `${user.ad} ${user.soyad}`,
                email: user.email
              },
              subject: request.emailTemplate?.subject || request.title,
              data: {
                title: request.title,
                message: request.message,
                userName: `${user.ad} ${user.soyad}`,
                companyName: company?.name || 'Şirketiniz',
                priority: request.priority
              },
              priority: request.priority
            }); */
            
            results.details.email.success++;
            return true;
          } catch (error) {
            console.error(`Email hatası (${user.email}):`, error);
            results.details.email.failed++;
            return false;
          }
        });

        await Promise.all(emailPromises);
      }

      results.success = results.details.inApp.success + results.details.email.success;
      results.failed = results.details.inApp.failed + results.details.email.failed;

      // Analytics
      analyticsService.track('bulk_notification_sent', {
        segment: request.segment === 'all' ? 'all' : request.segment.name,
        target_users: targetUsers.length,
        channels: Object.keys(request.channels).filter(k => request.channels[k as keyof typeof request.channels]),
        success_count: results.success,
        failed_count: results.failed,
        priority: request.priority
      });

      console.log(`📢 Toplu bildirim gönderildi: ${results.success} başarılı, ${results.failed} başarısız`);
      
      return results;
    } catch (error) {
      console.error('Toplu bildirim hatası:', error);
      analyticsService.trackError(error as Error, { context: 'bulk_notification' });
      throw error;
    }
  }

  // Önceden tanımlı segmentler
  getPreDefinedSegments(): UserSegment[] {
    return [
      {
        id: 'trial_users',
        name: 'Deneme Kullanıcıları',
        description: 'Deneme sürecindeki şirketlerin kullanıcıları',
        criteria: {
          subscriptionStatus: ['trial']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'expired_users',
        name: 'Süresi Dolan Kullanıcılar',
        description: 'Aboneliği sona eren şirketlerin kullanıcıları',
        criteria: {
          subscriptionStatus: ['expired']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'inactive_users',
        name: 'Pasif Kullanıcılar',
        description: 'Son 30 günde giriş yapmayan kullanıcılar',
        criteria: {
          lastLoginDays: 30
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'new_users',
        name: 'Yeni Kullanıcılar',
        description: 'Son 7 günde kayıt olan kullanıcılar',
        criteria: {
          registrationDays: 7
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'admin_users',
        name: 'Yönetici Kullanıcılar',
        description: 'Yönetici rolündeki kullanıcılar',
        criteria: {
          userRole: ['yonetici', 'superadmin']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'professional_users',
        name: 'Profesyonel Plan Kullanıcıları',
        description: 'Profesyonel plana sahip şirketlerin kullanıcıları',
        criteria: {
          subscriptionPlan: ['professional', 'enterprise']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  // Segment kullanıcı sayısını hesapla
  async getSegmentUserCount(segment: UserSegment): Promise<number> {
    try {
      const { users } = await this.getUsersBySegment(segment);
      return users.length;
    } catch (error) {
      console.error('Segment kullanıcı sayısı hesaplama hatası:', error);
      return 0;
    }
  }

  // Bildirim şablonları
  getNotificationTemplates() {
    return {
      welcome: {
        title: 'SolarVeyo\'ya Hoş Geldiniz! 🎉',
        message: 'Sistemi keşfetmeye başlayabilirsiniz.',
        emailSubject: 'SolarVeyo\'ya Hoş Geldiniz!'
      },
      trial_reminder: {
        title: 'Deneme Süreniz Bitiyor ⏰',
        message: 'Hizmetlerimizden kesintisiz yararlanmak için planınızı yükseltin.',
        emailSubject: 'Deneme Süreniz Bitiyor - Planınızı Yükseltin'
      },
      feature_announcement: {
        title: 'Yeni Özellik Duyurusu 🚀',
        message: 'Sisteme yeni özellikler eklendi. Keşfetmeye başlayın!',
        emailSubject: 'Yeni Özellikler Eklendi!'
      },
      maintenance_notice: {
        title: 'Sistem Bakımı Bildirimi 🔧',
        message: 'Planlı sistem bakımı hakkında bilgilendirme.',
        emailSubject: 'Planlı Sistem Bakımı Bildirimi'
      },
      security_alert: {
        title: 'Güvenlik Uyarısı 🔒',
        message: 'Hesabınızla ilgili güvenlik bildirimi.',
        emailSubject: 'Önemli Güvenlik Bildirimi'
      }
    };
  }
}

export const segmentedNotificationService = new SegmentedNotificationService();

