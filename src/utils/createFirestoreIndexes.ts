/**
 * Firestore Index Oluşturma Rehberi
 * 
 * SuperAdmin Dashboard için gerekli index'ler:
 * 
 * 1. Firebase Console'a gidin: https://console.firebase.google.com
 * 2. Projenizi seçin: yenisirket-2ec3b
 * 3. Firestore Database > Indexes sekmesine gidin
 * 4. "Create Index" butonuna tıklayın ve aşağıdaki index'leri oluşturun:
 */

export const requiredIndexes = [
  {
    collection: 'auditLogs',
    fields: [
      { field: 'companyId', order: 'Ascending' },
      { field: 'timestamp', order: 'Descending' }
    ]
  },
  {
    collection: 'auditLogs', 
    fields: [
      { field: 'timestamp', order: 'Descending' }
    ]
  },
  {
    collection: 'companies',
    fields: [
      { field: 'subscriptionStatus', order: 'Ascending' },
      { field: 'createdAt', order: 'Descending' }
    ]
  },
  {
    collection: 'companies',
    fields: [
      { field: 'subscriptionPlan', order: 'Ascending' },
      { field: 'createdAt', order: 'Descending' }
    ]
  },
  {
    collection: 'companies',
    fields: [
      { field: 'createdAt', order: 'Descending' }
    ]
  },
  {
    collection: 'kullanicilar',
    fields: [
      { field: 'companyId', order: 'Ascending' },
      { field: 'olusturmaTarihi', order: 'Descending' }
    ]
  },
  {
    collection: 'kullanicilar',
    fields: [
      { field: 'rol', order: 'Ascending' }
    ]
  },
  {
    collection: 'kullanicilar',
    fields: [
      { field: 'email', order: 'Ascending' }
    ]
  }
];

// Index oluşturma linkleri
export const indexCreationLinks = {
  auditLogs_companyId_timestamp: 'https://console.firebase.google.com/v1/r/project/yenisirket-2ec3b/firestore/indexes?create_composite=ClJwcm9qZWN0cy95ZW5pc2lya2V0LTJlYzNiL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9hdWRpdExvZ3MvaW5kZXhlcy9fEAEaDQoJY29tcGFueUlkEAEaDQoJdGltZXN0YW1wEAIaDAoIX19uYW1lX18QAg',
  
  instructions: `
    MANUEL INDEX OLUŞTURMA:
    
    1. Firebase Console'a gidin
    2. Firestore Database > Indexes
    3. "Create Index" tıklayın
    4. Yukarıdaki index'leri tek tek oluşturun
    
    VEYA
    
    Hata mesajındaki linke tıklayarak otomatik oluşturun.
  `
};

console.log('🔥 Firestore Index Bilgileri:');
console.log('================================');
console.log('Gerekli index sayısı:', requiredIndexes.length);
console.log('\nIndex oluşturma talimatları:');
console.log(indexCreationLinks.instructions);
console.log('\nDetaylı index listesi:');
requiredIndexes.forEach((index, i) => {
  console.log(`\n${i + 1}. ${index.collection} koleksiyonu:`);
  index.fields.forEach(field => {
    console.log(`   - ${field.field}: ${field.order}`);
  });
});
