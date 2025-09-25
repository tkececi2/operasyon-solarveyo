import React from 'react';
import { Database, Globe, CreditCard, MessageSquare, BarChart3, Zap, FileText, Calendar } from 'lucide-react';

const Integrations: React.FC = () => {
  const integrations = [
    { 
      label: 'Firebase', 
      icon: <Database className="w-5 h-5" />,
      description: 'Gerçek zamanlı veri senkronizasyonu ve güvenli depolama'
    },
    { 
      label: 'Google Maps', 
      icon: <Globe className="w-5 h-5" />,
      description: 'Saha konumları ve rota optimizasyonu'
    },
    { 
      label: 'Stripe', 
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Güvenli ödeme işlemleri ve abonelik yönetimi'
    },
    { 
      label: 'WhatsApp', 
      icon: <MessageSquare className="w-5 h-5" />,
      description: 'Anlık bildirimler ve müşteri iletişimi'
    },
    { 
      label: 'Excel/PDF', 
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Veri dışa aktarma ve raporlama'
    },
    { 
      label: 'QR Kod', 
      icon: <Zap className="w-5 h-5" />,
      description: 'Hızlı varlık erişimi ve envanter yönetimi'
    },
    { 
      label: 'API Erişimi', 
      icon: <FileText className="w-5 h-5" />,
      description: 'Özel entegrasyonlar için geliştirici API\'si'
    },
    { 
      label: 'Google Calendar', 
      icon: <Calendar className="w-5 h-5" />,
      description: 'Bakım planları ve görevler için takvim entegrasyonu'
    }
  ];
  
  const benefits = [
    "Mevcut sistemlerinizle sorunsuz entegrasyon",
    "Veri senkronizasyonu ile çift giriş engellenir",
    "Otomatik süreçlerle zaman tasarrufu",
    "Tek bir panele toplanmış tüm operasyonlar"
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Entegrasyonlar</h1>
          <p className="mt-3 text-gray-600">
            Kullandığınız araçlarla uyumlu çalışır. Mevcut sistemlerinize sorunsuz entegrasyon sağlarız.
          </p>
        </div>
        
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {integrations.map((integration, index) => (
            <div key={index} className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                {integration.icon}
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{integration.label}</h3>
              <p className="mt-2 text-sm text-gray-600">{integration.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 p-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">Neden Entegrasyon Önemlidir?</h2>
            <p className="mt-3 text-gray-600">
              Mevcut sistemlerinizle entegrasyon sağlayarak veri bütünlüğünü korur, 
              çift girişleri önler ve operasyonel verimliliği artırırız.
            </p>
            
            <ul className="mt-6 space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                    ✓
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-8">
              <h3 className="font-semibold text-gray-900">Özel Entegrasyon mu Gerekiyor?</h3>
              <p className="mt-2 text-gray-600 text-sm">
                Mevcut sistemleriniz için özel entegrasyon çözümleri sunuyoruz. 
                Uzman ekibimiz ihtiyaçlarınıza uygun çözümler geliştirir.
              </p>
              <a 
                href="/contact" 
                className="mt-4 inline-block rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm border border-gray-300 hover:bg-gray-50"
              >
                İletişim Kur
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Integrations;