import React from 'react';
import { Shield, Lock, Eye, Database, FileText, CheckCircle } from 'lucide-react';

const PrivacyScada: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">SCADA Gizlilik Politikası</h1>
          <p className="mt-4 text-lg text-gray-600">
            Verilerinizin güvenliği ve gizliliği bizim için önceliklidir
          </p>
        </div>

        <div className="space-y-8">
          <section className="rounded-xl border bg-white p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Veri Güvenliği</h2>
                <p className="text-gray-600 mb-4">
                  SCADA sistemlerimizde toplanan tüm veriler, endüstri standardı şifreleme yöntemleri ile korunmaktadır.
                  Verileriniz hem iletim sırasında (TLS/SSL) hem de depolama aşamasında (AES-256) şifrelenir.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span>End-to-end şifreleme</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span>Güvenli veri merkezleri</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span>Düzenli güvenlik denetimleri</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <div className="flex items-start gap-4">
              <Database className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Veri Toplama ve Kullanım</h2>
                <p className="text-gray-600 mb-4">
                  SCADA sistemimiz aşağıdaki verileri toplar ve işler:
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li>
                    <strong>Operasyonel Veriler:</strong> İnverter verileri, üretim değerleri, alarm kayıtları
                  </li>
                  <li>
                    <strong>Sistem Verileri:</strong> Performans metrikleri, sistem logları, hata kayıtları
                  </li>
                  <li>
                    <strong>Kullanıcı Verileri:</strong> Giriş kayıtları, işlem geçmişi, tercihler
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <div className="flex items-start gap-4">
              <Lock className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">KVKK Uyumluluğu</h2>
                <p className="text-gray-600 mb-4">
                  6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>• Verileriniz yalnızca belirtilen amaçlar için kullanılır</li>
                  <li>• Açık rızanız olmadan üçüncü taraflarla paylaşılmaz</li>
                  <li>• Veri silme ve düzeltme hakkınız saklıdır</li>
                  <li>• Veri işleme süreçleri şeffaftır ve denetlenebilir</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <div className="flex items-start gap-4">
              <Eye className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Veri Erişim Kontrolü</h2>
                <p className="text-gray-600 mb-4">
                  Verilerinize erişim sıkı bir şekilde kontrol edilir:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>• Rol bazlı erişim kontrolü (RBAC)</li>
                  <li>• İki faktörlü kimlik doğrulama</li>
                  <li>• IP bazlı erişim kısıtlamaları</li>
                  <li>• Detaylı denetim kayıtları (Audit logs)</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <div className="flex items-start gap-4">
              <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Veri Saklama Süreleri</h2>
                <div className="space-y-3 text-gray-600">
                  <div>
                    <strong>Operasyonel Veriler:</strong>
                    <p className="text-sm mt-1">5 yıl (yasal zorunluluk)</p>
                  </div>
                  <div>
                    <strong>Sistem Logları:</strong>
                    <p className="text-sm mt-1">2 yıl</p>
                  </div>
                  <div>
                    <strong>Kullanıcı Aktivite Kayıtları:</strong>
                    <p className="text-sm mt-1">1 yıl</p>
                  </div>
                  <div>
                    <strong>Yedekleme Verileri:</strong>
                    <p className="text-sm mt-1">90 gün</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 rounded-xl bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">İletişim</h3>
          <p className="text-gray-600">
            Gizlilik politikamız hakkında sorularınız için:
          </p>
          <div className="mt-3 space-y-1 text-gray-700">
            <p>Email: info@solarveyo.com</p>
            <p>Telefon: +90 531 898 41 45</p>
            <p>Veri Sorumlusu: SolarVeyo Teknoloji A.Ş.</p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          Son güncelleme: Aralık 2024
        </div>
      </div>
    </div>
  </div>
);

export default PrivacyScada;


