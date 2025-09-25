import React from 'react';
import { MessageSquare, Phone, Mail, FileText, Clock, Shield } from 'lucide-react';

const SupportScada: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">SCADA Destek Merkezi</h1>
          <p className="mt-4 text-lg text-gray-600">
            7/24 teknik destek, kurulum yardımı ve eğitim hizmetleri
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border bg-white p-6">
            <Phone className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Telefon Desteği</h3>
            <p className="mt-2 text-gray-600">+90 531 898 41 45</p>
            <p className="text-sm text-gray-500">Hafta içi 09:00 - 18:00</p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <Mail className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">E-posta Desteği</h3>
            <p className="mt-2 text-gray-600">info@solarveyo.com</p>
            <p className="text-sm text-gray-500">24 saat içinde yanıt</p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <MessageSquare className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Canlı Destek</h3>
            <p className="mt-2 text-gray-600">WhatsApp Business</p>
            <p className="text-sm text-gray-500">Anlık destek</p>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Destek Kategorileri</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Kurulum ve Yapılandırma</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• İlk kurulum yardımı</li>
                <li>• Cihaz entegrasyonu</li>
                <li>• Protokol yapılandırması</li>
                <li>• Alarm ve bildirim ayarları</li>
              </ul>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Teknik Sorunlar</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Bağlantı sorunları</li>
                <li>• Veri kaybı ve kurtarma</li>
                <li>• Performans optimizasyonu</li>
                <li>• Güvenlik güncellemeleri</li>
              </ul>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Eğitim ve Dokümantasyon</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Kullanıcı eğitimleri</li>
                <li>• Video rehberler</li>
                <li>• API dokümantasyonu</li>
                <li>• En iyi uygulamalar</li>
              </ul>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Bakım ve Güncelleme</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Periyodik bakım</li>
                <li>• Yazılım güncellemeleri</li>
                <li>• Yedekleme kontrolleri</li>
                <li>• Sistem sağlık kontrolü</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 p-8 text-white">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">Premium Destek Paketi</h3>
            <p className="mt-2">Öncelikli destek, 7/24 erişim ve özel eğitim imkanları</p>
            <a 
              href="https://api.whatsapp.com/send?phone=905318984145&text=Merhaba%2C%20Premium%20Destek%20Paketi%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 rounded-md bg-white text-blue-600 px-6 py-3 font-medium hover:bg-blue-50"
            >
              Detaylı Bilgi Al
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportScada;


