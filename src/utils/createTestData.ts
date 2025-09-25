import { 
  collection, 
  addDoc, 
  Timestamp,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createAuditLog } from '../services/auditLogService';

export const createTestAuditLogs = async () => {
  try {
    const logs = [
      {
        userId: 'test-user-1',
        userEmail: 'admin@solarveyo.com',
        userName: 'Sistem Admin',
        userRole: 'superadmin',
        companyId: null,
        action: 'user.login' as const,
        resource: 'authentication',
        resourceId: 'auth-001',
        details: { loginMethod: 'email', ipAddress: '192.168.1.1' },
        severity: 'info' as const,
        success: true
      },
      {
        userId: 'test-user-2',
        userEmail: 'yonetici@sirket.com',
        userName: 'Şirket Yöneticisi',
        userRole: 'yonetici',
        companyId: 'company-001',
        action: 'company.update' as const,
        resource: 'company',
        resourceId: 'company-001',
        details: { field: 'abonelikPlani', oldValue: 'Başlangıç', newValue: 'Profesyonel' },
        severity: 'info' as const,
        success: true
      },
      {
        userId: 'test-user-3',
        userEmail: 'muhendis@sirket.com',
        userName: 'Ali Mühendis',
        userRole: 'muhendis',
        companyId: 'company-001',
        action: 'data.create' as const,
        resource: 'ariza',
        resourceId: 'ariza-001',
        details: { arizaTipi: 'Inverter Arızası', santral: 'Santral-1' },
        severity: 'warning' as const,
        success: true
      },
      {
        userId: 'test-user-4',
        userEmail: 'hacker@bad.com',
        userName: 'Unknown',
        userRole: 'unknown',
        companyId: null,
        action: 'security.permission_denied' as const,
        resource: 'admin-panel',
        resourceId: null,
        details: { attemptedAction: 'access-superadmin', ipAddress: '123.456.789.0' },
        severity: 'critical' as const,
        success: false
      },
      {
        userId: 'test-user-2',
        userEmail: 'yonetici@sirket.com',
        userName: 'Şirket Yöneticisi',
        userRole: 'yonetici',
        companyId: 'company-001',
        action: 'user.password_reset' as const,
        resource: 'authentication',
        resourceId: 'user-005',
        details: { targetUser: 'tekniker@sirket.com' },
        severity: 'info' as const,
        success: true
      },
      {
        userId: 'test-user-1',
        userEmail: 'admin@solarveyo.com',
        userName: 'Sistem Admin',
        userRole: 'superadmin',
        companyId: null,
        action: 'system.backup_create' as const,
        resource: 'system',
        resourceId: 'backup-001',
        details: { backupSize: '2.5GB', duration: '45s' },
        severity: 'info' as const,
        success: true
      },
      {
        userId: 'test-user-5',
        userEmail: 'tekniker@sirket.com',
        userName: 'Mehmet Tekniker',
        userRole: 'tekniker',
        companyId: 'company-001',
        action: 'data.update' as const,
        resource: 'bakim',
        resourceId: 'bakim-001',
        details: { bakimTipi: 'Elektrik Bakım', durum: 'Tamamlandı' },
        severity: 'info' as const,
        success: true
      },
      {
        userId: 'test-user-3',
        userEmail: 'muhendis@sirket.com',
        userName: 'Ali Mühendis',
        userRole: 'muhendis',
        companyId: 'company-001',
        action: 'data.export' as const,
        resource: 'report',
        resourceId: 'report-001',
        details: { reportType: 'Aylık Üretim', format: 'PDF' },
        severity: 'info' as const,
        success: true
      },
      {
        userId: 'test-user-2',
        userEmail: 'yonetici@sirket.com',
        userName: 'Şirket Yöneticisi',
        userRole: 'yonetici',
        companyId: 'company-001',
        action: 'user.create' as const,
        resource: 'user',
        resourceId: 'user-006',
        details: { newUserEmail: 'yeni@sirket.com', role: 'tekniker' },
        severity: 'info' as const,
        success: true
      },
      {
        userId: 'test-user-1',
        userEmail: 'admin@solarveyo.com',
        userName: 'Sistem Admin',
        userRole: 'superadmin',
        companyId: null,
        action: 'security.rate_limit_exceeded' as const,
        resource: 'api',
        resourceId: 'api-endpoint-001',
        details: { endpoint: '/api/v1/data', requestCount: 150, timeWindow: '1min' },
        severity: 'error' as const,
        success: false
      }
    ];

    // Her log için farklı zaman damgaları oluştur
    const now = new Date();
    for (let i = 0; i < logs.length; i++) {
      const logTime = new Date(now);
      logTime.setHours(logTime.getHours() - (logs.length - i) * 2); // Her log 2 saat arayla
      
      await addDoc(collection(db, 'auditLogs'), {
        ...logs[i],
        timestamp: Timestamp.fromDate(logTime),
        createdAt: Timestamp.fromDate(logTime),
        ipAddress: '192.168.1.' + (i + 1),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
    }

    console.log('Test audit logları oluşturuldu!');
    return { success: true, count: logs.length };
  } catch (error) {
    console.error('Test logları oluşturulamadı:', error);
    return { success: false, error };
  }
};

export const createTestCompanies = async () => {
  try {
    const companies = [
      {
        ad: 'Solar Enerji A.Ş.',
        email: 'info@solarenerji.com',
        telefon: '0212 555 0001',
        adres: 'İstanbul, Türkiye',
        vergiNo: '1234567890',
        vergiDairesi: 'Büyük Mükellefler',
        yetkili: 'Ahmet Yönetici',
        yetkiliTelefon: '0532 111 2233',
        aktif: true,
        abonelikDurumu: 'active',
        abonelikPlani: 'Profesyonel',
        abonelikBaslangic: Timestamp.fromDate(new Date('2024-01-01')),
        abonelikBitis: Timestamp.fromDate(new Date('2025-01-01')),
        olusturmaTarihi: Timestamp.fromDate(new Date('2024-01-01')),
        sonGiris: Timestamp.now()
      },
      {
        ad: 'Güneş Teknoloji Ltd.',
        email: 'bilgi@gunesteknoloji.com',
        telefon: '0216 444 5566',
        adres: 'Ankara, Türkiye',
        vergiNo: '9876543210',
        vergiDairesi: 'Çankaya',
        yetkili: 'Mehmet Müdür',
        yetkiliTelefon: '0533 444 5566',
        aktif: true,
        abonelikDurumu: 'trial',
        abonelikPlani: 'Deneme',
        abonelikBaslangic: Timestamp.now(),
        abonelikBitis: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
        olusturmaTarihi: Timestamp.fromDate(new Date('2024-11-01')),
        sonGiris: Timestamp.now()
      },
      {
        ad: 'Eko Enerji Sistemleri',
        email: 'destek@ekoenerji.com',
        telefon: '0232 333 4455',
        adres: 'İzmir, Türkiye',
        vergiNo: '5555666677',
        vergiDairesi: 'Konak',
        yetkili: 'Ayşe Koordinatör',
        yetkiliTelefon: '0544 777 8899',
        aktif: false,
        abonelikDurumu: 'expired',
        abonelikPlani: 'Başlangıç',
        abonelikBaslangic: Timestamp.fromDate(new Date('2024-06-01')),
        abonelikBitis: Timestamp.fromDate(new Date('2024-12-01')),
        olusturmaTarihi: Timestamp.fromDate(new Date('2024-06-01')),
        sonGiris: Timestamp.fromDate(new Date('2024-12-01'))
      }
    ];

    const createdIds = [];
    for (const company of companies) {
      const docRef = await addDoc(collection(db, 'companies'), company);
      createdIds.push(docRef.id);
    }

    console.log('Test şirketleri oluşturuldu!');
    return { success: true, ids: createdIds };
  } catch (error) {
    console.error('Test şirketleri oluşturulamadı:', error);
    return { success: false, error };
  }
};

export const createAllTestData = async () => {
  console.log('Test verileri oluşturuluyor...');
  
  const results = {
    companies: await createTestCompanies(),
    auditLogs: await createTestAuditLogs()
  };
  
  console.log('Test verileri oluşturma tamamlandı:', results);
  return results;
};
