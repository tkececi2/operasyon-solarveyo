import React from 'react';
import { 
  ShieldCheck, Wrench, LineChart, Building2, Users, Zap, 
  Bell, Calendar, FileText, BarChart3, Database, Globe,
  Smartphone, Lock, Clock, TrendingUp, ArrowRight, CheckCircle,
  Image, List, Grid3X3, PieChart, Camera, MapPin, Edit, Download,
  Filter, Search, User, MessageSquare, Package, Truck, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow h-full">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">{icon}</div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    </div>
    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{desc}</p>
  </div>
);

const FeaturesPage: React.FC = () => {
  const features = [
    { 
      icon: <Zap className="w-5 h-5" />, 
      title: "Arıza Yönetimi", 
      desc: "Kayıt, atama, SLA takibi, durum güncellemeleri ve bildirimler." 
    },
    { 
      icon: <Wrench className="w-5 h-5" />, 
      title: "Bakım Planlama", 
      desc: "Elektrik/mekanik bakım planları, iş emirleri ve kontrol listeleri." 
    },
    { 
      icon: <LineChart className="w-5 h-5" />, 
      title: "Üretim Analitiği", 
      desc: "Aylık üretim, tahmin, anomali tespiti ve performans metrikleri." 
    },
    { 
      icon: <Building2 className="w-5 h-5" />, 
      title: "GES & Saha Yönetimi", 
      desc: "Santral/saha envanteri, koordinatlar ve harita entegrasyonu." 
    },
    { 
      icon: <Users className="w-5 h-5" />, 
      title: "Ekip & Vardiya", 
      desc: "Vardiya bildirimleri, görev akışları ve mobil uyumlu süreçler." 
    },
    { 
      icon: <Package className="w-5 h-5" />, 
      title: "Stok Yönetimi", 
      desc: "Envanter takibi, kritik stok uyarıları ve tedarik zinciri yönetimi." 
    },
    { 
      icon: <ShieldCheck className="w-5 h-5" />, 
      title: "Güvenlik", 
      desc: "Rol tabanlı yetki, müşteri izolasyonu ve audit trail." 
    },
    { 
      icon: <Bell className="w-5 h-5" />, 
      title: "Gerçek Zamanlı Bildirimler", 
      desc: "SMS, e-posta ve WhatsApp ile anlık bildirimler." 
    },
    { 
      icon: <Calendar className="w-5 h-5" />, 
      title: "Otomatik Planlama", 
      desc: "Bakım ve görev planlarının otomatik oluşturulması." 
    },
    { 
      icon: <FileText className="w-5 h-5" />, 
      title: "Raporlama", 
      desc: "Özelleştirilebilir raporlar ve PDF/Excel dışa aktarım." 
    },
    { 
      icon: <BarChart3 className="w-5 h-5" />, 
      title: "Performans İzleme", 
      desc: "KPI göstergeleri ve verimlilik analizleri." 
    },
    { 
      icon: <Database className="w-5 h-5" />, 
      title: "Veri Entegrasyonu", 
      desc: "SCADA, IoT cihazları ve diğer sistemlerle entegrasyon." 
    }
  ];
  
  const benefits = [
    { 
      icon: <TrendingUp className="w-5 h-5" />, 
      title: "Operasyonel Verimlilik", 
      desc: "İş süreçlerinizi %40 daha verimli hale getirin." 
    },
    { 
      icon: <Clock className="w-5 h-5" />, 
      title: "Zaman Tasarrufu", 
      desc: "Rutin işlemleri otomatikleştirerek zamandan tasarruf edin." 
    },
    { 
      icon: <BarChart3 className="w-5 h-5" />, 
      title: "Veriye Dayalı Kararlar", 
      desc: "Gerçek zamanlı verilerle daha iyi kararlar alın." 
    },
    { 
      icon: <Lock className="w-5 h-5" />, 
      title: "Kurumsal Güvenlik", 
      desc: "ISO 27001 uyumlu güvenlik standartları." 
    }
  ];

  const userRoles = [
    {
      role: "Yöneticiler",
      description: "Tüm operasyonu tek bakışta yönetin",
      capabilities: [
        "Şirket genelindeki tüm verilere erişim",
        "Performans raporları ve analizler",
        "Kullanıcı yetkilendirme ve rol yönetimi",
        "Abonelik ve faturalama kontrolü"
      ],
      icon: <User className="w-5 h-5" />
    },
    {
      role: "Mühendisler",
      description: "Teknik operasyonları yönetin",
      capabilities: [
        "Arıza analizi ve çözüm önerileri",
        "Bakım planlama ve iş emri oluşturma",
        "Üretim verilerinin detaylı analizi",
        "Performans trendlerinin izlenmesi"
      ],
      icon: <Wrench className="w-5 h-5" />
    },
    {
      role: "Teknikerler",
      description: "Saha operasyonlarını yürütün",
      capabilities: [
        "Mobil cihazlarla görev akışı",
        "QR kod ile hızlı varlık erişimi",
        "Vardiya bildirimleri ve görev takibi",
        "Fotoğraf ile iş raporlama"
      ],
      icon: <Image className="w-5 h-5" />
    },
    {
      role: "Müşteriler",
      description: "Size atanmış sahaları görüntüleyin",
      capabilities: [
        "Kendinize atanmış saha ve santraller",
        "Arıza ve bakım durumlarının takibi",
        "Basit raporlar ve istatistikler",
        "İletişim ve bildirim kanalları"
      ],
      icon: <MessageSquare className="w-5 h-5" />
    }
  ];

  const dashboardFeatures = [
    {
      icon: <PieChart className="w-6 h-6" />,
      title: "Görsel Raporlama",
      description: "Arıza durumu, üretim verileri ve performans metriklerini grafiklerle görüntüleyin"
    },
    {
      icon: <Grid3X3 className="w-6 h-6" />,
      title: "Veri Tabloları",
      description: "Detaylı veri tabloları ile tüm işlemleri filtreleyip sıralayın"
    },
    {
      icon: <List className="w-6 h-6" />,
      title: "Liste Görünümü",
      description: "Kart veya liste görünümü arasında geçiş yaparak verileri inceleyin"
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: "Fotoğraf Yönetimi",
      description: "Arıza ve bakım işlemleri ile ilgili fotoğrafları görüntüleyin ve yönetin"
    },
    {
      icon: <Edit className="w-6 h-6" />,
      title: "Hızlı Düzenleme",
      description: "Verileri doğrudan tablo üzerinden hızlıca düzenleyin"
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Dışa Aktarma",
      description: "Verileri Excel, PDF veya CSV formatında dışa aktarın"
    },
    {
      icon: <Filter className="w-6 h-6" />,
      title: "Gelişmiş Filtreleme",
      description: "Çoklu kriter ile verileri filtreleyin ve bulun"
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Hızlı Arama",
      description: "Arama çubuğu ile anında veri bulun"
    }
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Kurumsal Özellikler</h1>
          <p className="mt-4 text-gray-600">Operasyonun bel kemiği: arıza, bakım, üretim, ekip ve daha fazlası.</p>
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900">Tüm Özellikler</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index} 
                icon={feature.icon} 
                title={feature.title} 
                desc={feature.desc} 
              />
            ))}
          </div>
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900">Her Rol İçin Özelleştirilmiş Deneyim</h2>
          <p className="mt-4 text-gray-600">Farklı kullanıcı rolleri için farklı yetkiler ve arayüzler</p>
          
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userRoles.map((role, index) => (
              <div key={index} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  {role.icon}
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{role.role}</h3>
                <p className="mt-2 text-sm text-gray-600">{role.description}</p>
                <ul className="mt-4 space-y-2">
                  {role.capabilities.map((capability, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{capability}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900">Kontrol Paneli Özellikleri</h2>
          <p className="mt-4 text-gray-600">Platformumuzun sunduğu tüm kontrol paneli özelliklerini keşfedin</p>
          
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardFeatures.map((feature, index) => (
              <div key={index} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900">Sizin İçin Ne Yapar?</h2>
          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  {benefit.icon}
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{benefit.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-16 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Kurumsal Düzeyde Güvenlik ve Uyumluluk</h2>
            <p className="mt-4 text-gray-700">
              ISO 27001 uyumlu güvenlik altyapısı, rol tabanlı erişim kontrolleri ve veri izolasyonu ile 
              kurumsal ihtiyaçlarınıza uygun çözümler sunuyoruz.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-4 py-2 rounded-full shadow-sm">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                ISO 27001 Uyumlu
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-4 py-2 rounded-full shadow-sm">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                GDPR Hazır
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-4 py-2 rounded-full shadow-sm">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                SOC 2 Tip II
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-4 py-2 rounded-full shadow-sm">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                %99.9 Uptime
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 p-8 md:p-12 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold">Hazır mısınız?</h2>
            <p className="mt-4 text-white/90">
              15 gün ücretsiz deneme ile tüm özellikleri test edin. Kurumsal ihtiyaçlarınız için özelleştirilmiş çözümler sunabiliriz.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link 
                to="/register" 
                className="inline-flex items-center rounded-md bg-white text-blue-700 px-6 py-3 text-sm font-medium shadow hover:bg-blue-50 w-full sm:w-auto justify-center"
              >
                Ücretsiz Dene
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link 
                to="/contact" 
                className="inline-flex items-center rounded-md bg-blue-700/30 text-white px-6 py-3 text-sm font-medium hover:bg-blue-700/40 w-full sm:w-auto justify-center"
              >
                Satış Ekibiyle Görüş
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesPage;