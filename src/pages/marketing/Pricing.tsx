import React from 'react';
import { Check, } from 'lucide-react';
import { Link } from 'react-router-dom';

const Pricing: React.FC = () => {
  const tiers = [
    {
      name: 'Başlangıç',
      features: ['5 Kullanıcı', '1GB Depolama', 'Tüm Özellikler'],
      cta: 'Teklif Al'
    },
    {
      name: 'Profesyonel',
      features: ['15 Kullanıcı', '50GB Depolama', 'Tüm Özellikler'],
      cta: 'Teklif Al'
    },
    {
      name: 'Kurumsal',
      features: ['-1 Kullanıcı', '500GB Depolama', 'Tüm Özellikler'],
      cta: 'Teklif Al'
    }
  ];
  
  const features = [
    'Arıza Yönetimi',
    'Bakım Planlama',
    'Üretim Analitiği',
    'GES & Saha Yönetimi',
    'Ekip & Vardiya',
    'Güvenlik',
    'Mobil Uyumluluk',
    'Raporlama',
    'Bildirimler'
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Fiyatlandırma</h1>
          <p className="mt-4 text-gray-600">İhtiyacınıza göre başlayın, büyüdükçe genişletin. Tüm planlar 15 gün ücretsiz deneme içerir.</p>
        </div>
        
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div key={t.name} className={`rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow relative`}>
              <div className="text-sm font-semibold text-gray-900">{t.name}</div>
              {/* Fiyat ve açıklama gösterilmez — şirket bazlı fiyatlandırma */}
              
              <div className="mt-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kullanıcılar ve Depolama</h4>
                <ul className="mt-3 space-y-3 text-sm text-gray-700">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Yetenekler listesi bu görünümde kullanılmıyor */}
              
              <Link 
                to={'/contact'} 
                className={`mt-8 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium w-full ${
                  'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900">Tüm Planlarda Bulunan Özellikler</h2>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>
        
        {/* Kurumsal özel bölüm kaldırıldı */}
      </div>
    </section>
  );
};

export default Pricing;