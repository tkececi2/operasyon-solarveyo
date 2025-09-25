# 🔐 SolarVeyo - Rol Erişim Matrisi

## 📋 Kullanıcı Rolleri

1. **SuperAdmin** - Sistem yöneticisi (tüm erişim)
2. **Yönetici** - Şirket yöneticisi
3. **Mühendis** - Teknik personel
4. **Tekniker** - Saha personeli
5. **Bekçi** - Vardiya personeli
6. **Müşteri** - İş veren/müşteri (sadece görüntüleme)

## 🚪 Sayfa Erişim İzinleri

| Sayfa | SuperAdmin | Yönetici | Mühendis | Tekniker | Bekçi | Müşteri |
|-------|------------|----------|----------|----------|--------|---------|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Arızalar** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Arıza Kayıtları | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| └─ Elektrik Kesintileri | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Bakım** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Elektrik Bakım | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ├─ Mekanik Bakım | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| └─ Yapılan İşler | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **GES Yönetimi** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Üretim Verileri** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Sahalar** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Ekip Yönetimi** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **İzin Yönetimi** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Stok Kontrol** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Envanter** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Vardiya** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Abonelik** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Ayarlar** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Yedekleme** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **SuperAdmin Panel** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Analytics** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 🛡️ Güvenlik Katmanları

### 1. Katman: Sidebar/Menu Kontrolü
- Kullanıcı rolüne göre menü öğeleri filtrelenir
- Yetkisiz menüler gösterilmez

### 2. Katman: Route Seviyesi Kontrolü (ProtectedRoute)
- URL'den direkt erişim engellenir
- Yetkisiz erişimde hata sayfası gösterilir

### 3. Katman: Sayfa İçi Kontrol
- Sayfa bileşeninde rol kontrolü yapılır
- Kritik işlemler için ek kontroller

### 4. Katman: Firebase Rules
- Veritabanı seviyesinde güvenlik kuralları
- Backend tarafında rol kontrolü

## 📝 Önemli Notlar

1. **Müşteri Rolü**: İş verenler için sadece görüntüleme yetkisi
2. **Bekçi Rolü**: Vardiya ve arıza yönetimi odaklı
3. **Tekniker Rolü**: Saha operasyonları odaklı
4. **Mühendis Rolü**: Teknik yönetim ve analiz
5. **Yönetici Rolü**: Tam yönetim yetkisi (SuperAdmin hariç)
6. **SuperAdmin**: Sistem genelinde tam yetki

## 🚨 Kritik Güvenlik Kuralları

1. **Ekip Yönetimi**: Sadece Yönetici erişebilir
2. **Abonelik/Ayarlar**: Sadece Yönetici erişebilir
3. **SuperAdmin Panelleri**: Sadece SuperAdmin erişebilir
4. **İzin Yönetimi**: Müşteriler hariç tüm çalışanlar
5. **GES/Sahalar**: Teknik personel ve müşteriler

## 🔄 Güncelleme Geçmişi

- **2024-01**: Rol tabanlı erişim sistemi oluşturuldu
- **2024-01**: ProtectedRoute komponenti eklendi
- **2024-01**: Müşteri rolü İzin Yönetimi'nden kaldırıldı
- **2024-01**: Bekçi rolüne İzin Yönetimi erişimi verildi
