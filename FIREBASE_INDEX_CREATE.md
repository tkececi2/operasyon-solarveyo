# Firebase Index Oluşturma

## Backup Index'i İçin

Firebase Console'da aşağıdaki linke gidin ve index'i oluşturun:

[Index Oluştur](https://console.firebase.google.com/v1/r/project/yenisirket-2ec3b/firestore/indexes?create_composite=ClBwcm9qZWN0cy95ZW5pc2lya2V0LTJlYzNiL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9iYWNrdXBzL2luZGV4ZXMvXxABGg0KCWNvbXBhbnlJZBABGgoKBnN0YXR1cxABGg0KCXRpbWVzdGFtcBACGgwKCF9fbmFtZV9fEAI)

Veya manuel olarak:

1. Firebase Console → Firestore Database → Indexes
2. "Create Index" tıklayın
3. Şu ayarları girin:
   - Collection ID: `backups`
   - Fields:
     - `companyId` - Ascending
     - `status` - Ascending  
     - `timestamp` - Descending
4. "Create Index" tıklayın

Index oluşturulması 2-3 dakika sürebilir.

---

## Elektrik Kesintileri İstatistik İndeksi

Elektrik kesintileri ekranında `companyId` + `baslangicTarihi` filtresi birlikte kullanıldığı için composite index gerekir.

Hızlı kurulum (tek tık):

[Index Oluştur (elektrikKesintileri)](https://console.firebase.google.com/v1/r/project/yenisirket-2ec3b/firestore/indexes?create_composite=Clxwcm9qZWN0cy95ZW5pc2lya2V0LTJlYzNiL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9lbGVrdHJpa0tlc2ludGlsZXJpL2luZGV4ZXMvXxABGg0KCWNvbXBhbnlJZBABGhMKD2Jhc2xhbmdpY1RhcmloaRABGgwKCF9fbmFtZV9fEAE)

Manuel kurulum:

1. Firebase Console → Firestore Database → Indexes → Create Index
2. Collection ID: `elektrikKesintileri`
3. Fields:
   - `companyId` – Ascending
   - `baslangicTarihi` – Ascending (veya ihtiyaca göre Descending)
4. Create Index

Not: İndeks hazır olana kadar uygulama geçici olarak memory filtrelemesi kullanır; performans için indeksin tamamlanması beklenmelidir.