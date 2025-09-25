import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  DocumentData,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AuditLog {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  companyId?: string | null;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  success: boolean;
}

export type AuditAction = 
  // Auth actions
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.password_reset'
  | 'user.password_change'
  | 'user.profile_update'
  // Company actions  
  | 'company.create'
  | 'company.update'
  | 'company.delete'
  | 'company.subscription_update'
  | 'company.status_change'
  // User management
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.role_change'
  | 'user.status_change'
  // Data actions
  | 'data.create'
  | 'data.update'
  | 'data.delete'
  | 'data.export'
  | 'data.import'
  // System actions
  | 'system.settings_update'
  | 'system.maintenance_toggle'
  | 'system.backup_create'
  | 'system.backup_restore'
  // Security actions
  | 'security.permission_denied'
  | 'security.suspicious_activity'
  | 'security.ip_blocked'
  | 'security.rate_limit_exceeded';

// Audit log oluştur
export const createAuditLog = async (log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> => {
  try {
    // IP adresini al (client-side'da mümkün değil, server-side'da yapılmalı)
    const ipAddress = await getClientIP();
    
    // User agent bilgisini al
    const userAgent = navigator.userAgent;
    
    const auditData = {
      ...log,
      ipAddress,
      userAgent,
      timestamp: Timestamp.now(),
      createdAt: Timestamp.now()
    };
    
    await addDoc(collection(db, 'auditLogs'), auditData);
    
    // Kritik olaylar için ekstra aksiyon al
    if (log.severity === 'critical' || log.severity === 'error') {
      await notifyCriticalEvent(log);
    }
  } catch (error) {
    console.error('Audit log oluşturulamadı:', error);
    // Audit log hatası sistemi durdurmamalı
  }
};

// Audit logları getir
export const getAuditLogs = async (
  filters?: {
    userId?: string;
    companyId?: string;
    action?: AuditAction;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    resource?: string;
  },
  pageSize: number = 50,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ logs: AuditLog[], lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    let q = query(collection(db, 'auditLogs'));
    
    // Filtreler
    if (filters?.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    if (filters?.companyId) {
      q = query(q, where('companyId', '==', filters.companyId));
    }
    if (filters?.action) {
      q = query(q, where('action', '==', filters.action));
    }
    if (filters?.severity) {
      q = query(q, where('severity', '==', filters.severity));
    }
    if (filters?.resource) {
      q = query(q, where('resource', '==', filters.resource));
    }
    if (filters?.startDate) {
      q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters?.endDate) {
      q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }
    
    // Sıralama ve limit
    q = query(q, orderBy('timestamp', 'desc'), limit(pageSize));
    
    // Pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const snapshot = await getDocs(q);
    const logs: AuditLog[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date()
      } as AuditLog);
    });
    
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    
    return { logs, lastDoc: newLastDoc };
  } catch (error) {
    console.error('Audit logları alınamadı:', error);
    return { logs: [], lastDoc: null };
  }
};

// Kullanıcı aktivitelerini özetle
export const getUserActivitySummary = async (
  userId: string,
  days: number = 30
): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  recentActions: AuditLog[];
  suspiciousActivities: number;
}> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { logs } = await getAuditLogs(
      { userId, startDate },
      1000 // Daha fazla log al
    );
    
    const actionsByType: Record<string, number> = {};
    let suspiciousActivities = 0;
    
    logs.forEach(log => {
      // Action tiplerini say
      const actionType = log.action.split('.')[0];
      actionsByType[actionType] = (actionsByType[actionType] || 0) + 1;
      
      // Şüpheli aktiviteleri say
      if (log.severity === 'warning' || log.severity === 'error' || log.severity === 'critical') {
        suspiciousActivities++;
      }
    });
    
    return {
      totalActions: logs.length,
      actionsByType,
      recentActions: logs.slice(0, 10),
      suspiciousActivities
    };
  } catch (error) {
    console.error('Kullanıcı aktivite özeti alınamadı:', error);
    return {
      totalActions: 0,
      actionsByType: {},
      recentActions: [],
      suspiciousActivities: 0
    };
  }
};

// Sistem geneli güvenlik olayları
export const getSecurityEvents = async (
  days: number = 7
): Promise<AuditLog[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { logs } = await getAuditLogs(
      { 
        startDate,
        severity: 'critical' // Sadece kritik olaylar
      },
      100
    );
    
    // Security action'ları da ekle
    const securityLogs = logs.filter(log => 
      log.action.startsWith('security.') || 
      log.severity === 'critical' ||
      log.severity === 'error'
    );
    
    return securityLogs;
  } catch (error) {
    console.error('Güvenlik olayları alınamadı:', error);
    return [];
  }
};

// Helper: IP adresi al (basit implementation)
async function getClientIP(): Promise<string> {
  try {
    // Gerçek uygulamada server-side'da yapılmalı
    // Burada sadece placeholder
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}

// Helper: Kritik olayları bildir
async function notifyCriticalEvent(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  try {
    // Email, SMS veya diğer bildirim servisleri ile entegre edilebilir
    console.error('🚨 KRİTİK OLAY:', log);
    
    // SuperAdmin'lere bildirim gönder
    // await emailService.sendCriticalAlert(log);
  } catch (error) {
    console.error('Kritik olay bildirimi gönderilemedi:', error);
  }
}

// Yaygın kullanım için helper fonksiyonlar
export const logUserAction = async (
  user: { id: string; email: string; name: string; role: string; companyId?: string | null },
  action: AuditAction,
  resource: string,
  resourceId?: string,
  details?: any,
  success: boolean = true
) => {
  await createAuditLog({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    userRole: user.role,
    companyId: user.companyId,
    action,
    resource,
    resourceId,
    details,
    severity: success ? 'info' : 'error',
    success
  });
};

export const logSecurityEvent = async (
  user: { id: string; email: string; name: string; role: string; companyId?: string | null },
  action: AuditAction,
  details: any,
  severity: 'warning' | 'error' | 'critical' = 'warning'
) => {
  await createAuditLog({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    userRole: user.role,
    companyId: user.companyId,
    action,
    resource: 'security',
    details,
    severity,
    success: false
  });
};
