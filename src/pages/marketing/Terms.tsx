import React from 'react';
import { FileText, Shield, CreditCard, AlertCircle, Users, Clock } from 'lucide-react';

const Terms: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Kullanım Şartları</h1>
          <p className="mt-4 text-lg text-gray-600">
            SolarVeyo platformlarını kullanarak aşağıdaki şartları kabul etmiş olursunuz
          </p>
          <p className="mt-2 text-sm text-gray-500">Yürürlük Tarihi: 1 Ocak 2024</p>
        </div>

        <div className="space-y-8">
          <section className="rounded-xl border bg-white p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Hesap Güvenliği ve Sorumluluklar</h2>
                <div className="space-y-3 text-gray-600">
                  <p>
                    Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi güvende tutmalı ve yetkisiz erişimleri önlemelisiniz.
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• Güçlü ve benzersiz şifre kullanın</li>
                    <li>• Şifrenizi kimseyle paylaşmayın</li>
                    <li>• Şüpheli aktiviteleri derhal bildirin</li>
                    <li>• Hesabınızdaki tüm aktivitelerden sorumlusunuz</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <div className="flex items-start gap-4">
              <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Hizmet Kullanımı</h2>
                <div className="space-y-3 text-gray-600">
                  <p>SolarVeyo hizmetlerini kullanırken:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Türkiye Cumhuriyeti yasalarına uygun hareket etmelisiniz</li>
                    <li>• Başkalarının haklarına saygı göstermelisiniz</li>
                    <li>• Sistemi kötüye kullanmamalısınız</li>
                    <li>• Tersine mühendislik yapmamalısınız</li>
                    <li>• Spam veya zararlı içerik yaymamaısınız</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <div className="flex items-start gap-4">
              <CreditCard className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Ödeme ve Abonelik</h2>
                <div className="space-y-3 text-gray-600">
                  <p>Abonelik ve ödeme koşulları:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Ödemeler aylık veya yıllık olarak alınır</li>
                    <li>• 15 günlük ücretsiz deneme süresi vardır</li>
                    <li>• Abonelik otomatik yenilenir</li>
                    <li>• İptal işlemleri dönem sonunda geçerli olur</li>
                    <li>• Fiyat değişiklikleri 30 gün önceden bildirilir</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <div className="flex items-start gap-4">
              <Users className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Fikri Mülkiyet Hakları</h2>
                <div className="space-y-3 text-gray-600">
                  <p>
                    SolarVeyo platformu ve içeriği SolarVeyo Teknoloji A.Ş.'ye aittir.
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• Yazlım, tasarım ve içerik telif hakkı ile korunmaktadır</li>
                    <li>• İzinsiz kopyalama, dağıtma veya değiştirme yasaktır</li>
                    <li>• Kendi verilerinizin mülkiyeti size aittir</li>
                    <li>• Hizmeti iyileştirmek için anonim veri kullanım hakkımız saklıdır</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <div className="flex items-start gap-4">
              <Clock className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Hizmet Seviyesi ve Garanti</h2>
                <div className="space-y-3 text-gray-600">
                  <p>Hizmet seviyesi taahhütlerimiz:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• %99.9 uptime garantisi (planlı bakımlar hariç)</li>
                    <li>• 7/24 teknik destek (Enterprise plan)</li>
                    <li>• Veri yedekleme ve kurtarma hizmetleri</li>
                    <li>• Güvenlik güncellemeleri ve yama yönetimi</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Sorumluluk Sınırı</h2>
                <div className="space-y-3 text-gray-600">
                  <p>
                    SolarVeyo, yasaların izin verdiği ölçüde:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• Dolaylı zararlardan sorumlu değildir</li>
                    <li>• Veri kaybından doğan zararlar için sorumluluk sınırlıdır</li>
                    <li>• Üçüncü taraf hizmetlerindeki aksaklıklardan sorumlu değildir</li>
                    <li>• Mücbir sebep durumlarında sorumluluk taşımaz</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 rounded-xl bg-yellow-50 border border-yellow-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Değişiklikler</h3>
          <p className="text-gray-600">
            Bu şartlar zaman zaman güncellenebilir. Önemli değişiklikler email ile bildirilecektir.
            Güncel şartlar her zaman bu sayfada yayınlanacaktır.
          </p>
        </div>

        <div className="mt-12 rounded-xl bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">İletişim</h3>
          <p className="text-gray-600">
            Kullanım şartları hakkında sorularınız için:
          </p>
          <div className="mt-3 space-y-1 text-gray-700">
            <p>Email: info@solarveyo.com</p>
            <p>Telefon: +90 531 898 41 45</p>
            <p>Adres: 100.Yıl Bulvarı No:12 Kat:3 Muratpaşa/Antalya</p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          © 2024 SolarVeyo Teknoloji A.Ş. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  </div>
);

export default Terms;


