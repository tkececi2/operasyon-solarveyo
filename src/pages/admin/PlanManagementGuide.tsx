import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../components/ui';
import { Link } from 'react-router-dom';

const PlanManagementGuide: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Paket Yönetim Rehberi</h1>
        <Link to="/admin">
          <Button variant="outline">Geri Dön</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paket Yönetimine Genel Bakış</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            SolarVeyo SaaS platformu, abonelik planlarını merkezi bir yapılandırma dosyası üzerinden yönetir. 
            Bu yaklaşım sayesinde tüm plan bilgileri tek bir kaynaktan yönetilir ve tutarlılık sağlanır.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-bold mb-2">Merkezi Yapılandırma Dosyası</h3>
            <p>
              Tüm paket bilgileri <code className="bg-gray-200 px-1 rounded">src/config/saas.config.ts</code> dosyasında tanımlanmıştır. 
              Bu dosya, platformdaki tüm abonelik planlarının ve özelliklerinin tek doğruluk kaynağıdır.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Paket Ekleme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3">
              Yeni bir paket eklemek için şu adımları izleyin:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li><code className="bg-gray-200 px-1 rounded">src/config/saas.config.ts</code> dosyasını açın</li>
              <li><code>PLANS</code> objesi içerisine yeni paketinizi tanımlayın</li>
              <li>Gerekli alanları (isim, fiyat, limitler, özellikler) doldurun</li>
              <li>Değişikliklerinizi kaydedin ve uygulamayı yeniden başlatın</li>
            </ol>
            
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <h4 className="font-bold mb-2">Örnek Paket Tanımı:</h4>
              <pre className="text-xs overflow-x-auto">
{`business: {
  id: 'business',
  name: 'İşletme',
  displayName: 'İşletme Paketi',
  description: 'Küçük ve orta ölçekli işletmeler için',
  price: 1499,
  currency: 'TRY',
  billingPeriod: 'monthly',
  popular: false,
  limits: {
    users: 10,
    sahalar: 10,
    santraller: 20,
    storageGB: 20,
    // diğer limitler...
  },
  features: {
    dashboard: true,
    arizaYonetimi: true,
    // diğer özellikler...
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paket Düzenleme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3">
              Mevcut bir paketi düzenlemek için:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li><code className="bg-gray-200 px-1 rounded">src/config/saas.config.ts</code> dosyasını açın</li>
              <li>Düzenlemek istediğiniz paketi bulun</li>
              <li>İlgili alanları değiştirin (fiyat, limitler, özellikler vs.)</li>
              <li>Değişikliklerinizi kaydedin</li>
            </ol>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
              <h4 className="font-bold mb-2">Önemli Uyarı:</h4>
              <p>
                Paket değişiklikleri mevcut abonelikleri etkileyebilir. 
                Özellikle fiyat ve limit değişikliklerinde dikkatli olunmalıdır.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paket Özellikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Her paket aşağıdaki ana kategorilerde özelliklere sahip olabilir:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded p-4">
              <h4 className="font-bold mb-2">Temel Özellikler</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Kontrol Paneli</li>
                <li>Arıza Yönetimi</li>
                <li>Bakım Takibi</li>
                <li>Üretim Takibi</li>
                <li>Stok Yönetimi</li>
                <li>Vardiya Takibi</li>
              </ul>
            </div>
            
            <div className="border rounded p-4">
              <h4 className="font-bold mb-2">Gelişmiş Özellikler</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>AI Anomali Tespiti</li>
                <li>AI Tahminleme</li>
                <li>Özel Raporlar</li>
                <li>API Erişimi</li>
                <li>Webhook Entegrasyonları</li>
              </ul>
            </div>
            
            <div className="border rounded p-4">
              <h4 className="font-bold mb-2">Entegrasyonlar</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>WhatsApp Bildirimleri</li>
                <li>SMS Bildirimleri</li>
                <li>E-posta Bildirimleri</li>
                <li>Veri Aktarımı</li>
                <li>Özel Entegrasyonlar</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>En İyi Uygulamalar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Paket isimlerini açık ve anlaşılır tutun</li>
              <li>Fiyatlandırma stratejinizi düzenli olarak gözden geçirin</li>
              <li>Yeni özellikler eklerken mevcut paketleri güncellemeyi unutmayın</li>
              <li>Limitleri şirket ihtiyaçlarına göre ayarlayın</li>
              <li>Popüler paketi dikkatli seçin (dönüşüm oranı etkiler)</li>
              <li>Yıllık ödemeler için indirim oranlarını optimize edin</li>
            </ul>
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yapılandırma Dosyası Detayları</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            <code>saas.config.ts</code> dosyası aşağıdaki ana bölümlerden oluşur:
          </p>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-bold mb-2">PLANS</h4>
              <p className="text-sm mb-2">
                Tüm abonelik planlarını içeren objedir. Her plan aşağıdaki alanlara sahiptir:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><code>id</code>: Planın benzersiz tanımlayıcısı</li>
                <li><code>name</code>: Planın içsel adı</li>
                <li><code>displayName</code>: Kullanıcıya gösterilen ad</li>
                <li><code>description</code>: Plan açıklaması</li>
                <li><code>price</code>: Aylık fiyat (₺)</li>
                <li><code>limits</code>: Kullanım limitleri</li>
                <li><code>features</code>: Etkinleştirilen özellikler</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-2">FEATURE_DESCRIPTIONS</h4>
              <p className="text-sm">
                Özelliklerin kullanıcı dostu açıklamalarını içerir.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-2">Helper Fonksiyonlar</h4>
              <p className="text-sm">
                Plan bilgilerini almak ve işlemek için kullanılan yardımcı fonksiyonlardır:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><code>getPlanById</code>: ID ile plan bilgisi alır</li>
                <li><code>getActivePlans</code>: Aktif planları listeler</li>
                <li><code>formatPrice</code>: Fiyatı formatlar</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanManagementGuide;