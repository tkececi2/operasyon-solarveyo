import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import Footer from '../../components/marketing/Footer';
import { motion } from 'framer-motion';
import { 
  Sun, Zap, BarChart3, ShieldCheck, Users, Wrench, 
  Building2, LineChart, MessageSquare, Lock, Database, 
  Globe, Cpu, CheckCircle, ArrowRight, CreditCard,
  Play, Calendar, Check, TrendingUp, Clock, Award, X,
  Image, List, Grid3X3, PieChart, Camera, MapPin,
  Package, Truck, AlertTriangle, Star, Bell, Settings
} from 'lucide-react';
const reveal = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};


const Nav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-40 transition-colors ${scrolled ? 'backdrop-blur bg-white/80 border-b border-gray-200' : 'bg-transparent'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/"><Logo /></Link>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link to="/features" className="text-gray-700 hover:text-gray-900">Özellikler</Link>
          <Link to="/pricing" className="text-gray-700 hover:text-gray-900">Fiyatlandırma</Link>
          <Link to="/integrations" className="text-gray-700 hover:text-gray-900">Entegrasyonlar</Link>
          <Link to="/about" className="text-gray-700 hover:text-gray-900">Hakkında</Link>
          <Link to="/contact" className="text-gray-700 hover:text-gray-900">İletişim</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-700 hover:text-gray-900">Giriş Yap</Link>
          <Link
            to="/register"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            Ücretsiz Deneyin
          </Link>
        </div>
      </div>
    </nav>
  );
};

const Hero: React.FC<{ onOpenVideo?: () => void }> = ({ onOpenVideo }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spot, setSpot] = useState({ x: 50, y: 50 });
  const handleMove = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rotateY = (px - 0.5) * 10;
    const rotateX = (0.5 - py) * 10;
    setTilt({ x: rotateX, y: rotateY });
    setSpot({ x: Math.round(px * 100), y: Math.round(py * 100) });
  };
  const resetTilt = () => setTilt({ x: 0, y: 0 });
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-blue-100 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-sky-100 to-transparent rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(600px circle at ${spot.x}% ${spot.y}%, rgba(59,130,246,0.10), transparent 60%)`,
          }}
        />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              <ShieldCheck className="w-4 h-4" />
              Kurumsal Güvenlik • Çoklu Şirket • Gerçek Zamanlı
            </div>
            <motion.h1
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={reveal}
              className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100"
            >
              <span className="bg-gradient-to-r from-gray-900 via-blue-700 to-sky-600 bg-clip-text text-transparent">GES Operasyonlarınızı</span> dijitalleştirin
              <span className="block mt-2 text-xl md:text-2xl font-semibold text-gray-800/80">Saha bazlı fiyatlandırma ile EPC ve O&M ekipleri için</span>
            </motion.h1>
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={reveal}
              className="mt-4 text-gray-700 dark:text-gray-300 text-base md:text-lg leading-relaxed"
            >
              Solar sektörü için tasarlanmış uçtan uca platform: arıza, bakım, üretim ve ekip yönetimi tek yerde. 
              Saha başına şeffaf fiyat, müşteriye şeffaf raporlama ve kurumsal güvenlik bir arada.
            </motion.p>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={reveal}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/register"
                className="group relative inline-flex items-center rounded-md px-[2px] py-[2px] text-sm font-medium transition-shadow bg-gradient-to-r from-primary-600 via-emerald-500 to-purple-600 hover:shadow-lg"
              >
                <span className="relative inline-flex items-center rounded-[6px] bg-gray-900 text-white px-5 py-2.5 dark:bg-gray-100 dark:text-gray-900 overflow-hidden">
                15 Gün Ücretsiz Dene
                <ArrowRight className="ml-2 w-4 h-4" />
                  <span className="pointer-events-none absolute -left-1 top-0 h-full w-8 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-20%] group-hover:animate-[shine_1.2s_ease]" />
                </span>
              </Link>
              <button
                type="button"
                onClick={onOpenVideo}
                className="inline-flex items-center rounded-md px-6 py-3 text-sm font-medium text-primary-700 hover:bg-primary-50 border border-primary-200"
              >
                <Play className="mr-2 w-4 h-4" />
                Demo İzle
              </button>
            </motion.div>
            <style>{`@keyframes shine { 100% { transform: translateX(260%); } }`}</style>
            <div className="mt-6 flex items-center gap-6 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Şeffaf müşteri raporları
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Vardiya kontrol ve denetim
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Arıza çözüm süresinde azalma
              </div>
            </div>
          </div>
          <div className="relative" ref={containerRef} onMouseMove={handleMove} onMouseLeave={resetTilt}>
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-200/30 to-emerald-200/30 rounded-3xl blur-xl -z-10" />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1, transition: { duration: 0.5 } }}
              viewport={{ once: true, margin: '-80px' }}
              className="rounded-2xl border border-gray-200 shadow-lg overflow-hidden bg-black"
              style={{ transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: 'transform .06s ease' }}
            >
              <div className="relative aspect-[3036/1582] bg-gray-900">
                {/* Tarayıcı üst çubuğu benzeri görünüm */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-gray-900/90 flex items-center justify-between px-3">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-[10px] text-gray-300 hidden md:block">SolarVeyo • Arızalar</div>
                </div>
                <img
                  src={encodeURI('/screenshots/arızasayfası.png')}
                  alt="Arıza sayfası önizleme"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SectorFit: React.FC = () => (
  <section className="py-12 md:py-16 bg-white">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-white p-6">
          <div className="text-xs font-medium text-blue-700">Kimin İçin?</div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">EPC / O&M Şirketleri</h3>
          <p className="mt-2 text-sm text-gray-600">Saha sayınız arttıkça ölçeklenen ve saha bazlı fiyatlandırılan operasyon yazılımı.</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-6">
          <div className="text-xs font-medium text-emerald-700">Değer</div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">ROI odaklı</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-700">
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-emerald-600"/> MTTR’da %20–35 azalma</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-emerald-600"/> Müşteri memnuniyetinde artış</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-emerald-600"/> Şeffaf süreç ve denetim izi</li>
          </ul>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-purple-50 to-white p-6">
          <div className="text-xs font-medium text-purple-700">Fiyatlandırma</div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Saha Bazlı</h3>
          <p className="mt-2 text-sm text-gray-600">Küçükten büyüğe tüm portföyler için adil, ölçeklenebilir ve şeffaf model.</p>
          <div className="mt-4 flex gap-3">
            <Link to="/pricing" className="rounded-md bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700">Fiyatları Gör</Link>
            <a 
              href="https://api.whatsapp.com/send?phone=905318984145&text=Merhaba%2C%20SolarVeyo%20hakk%C4%B1nda%20demo%20talep%20etmek%20istiyorum" 
              target="_blank" 
              rel="noopener noreferrer"
              className="rounded-md border border-primary-200 text-primary-700 px-4 py-2 text-sm font-medium hover:bg-primary-50"
            >
              Demo Talep Et
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const AppPagesOverview: React.FC = () => {
  const pages = [
    { key: 'arizalar-1', title: 'Arızalar', desc: 'Arıza kayıtları, durum ve SLA takibi', image: encodeURI('/screenshots/arızasayfası.png') },
    { key: 'arizalar-2', title: 'Arıza Detayı', desc: 'Fotoğraf, yorum ve çözüm adımları', image: encodeURI('/screenshots/arızasayfası2.png') },
    { key: 'dashboard', title: 'Dashboard', desc: 'Genel görünüm ve KPI özetleri' },
    { key: 'bakim', title: 'Bakım', desc: 'Elektrik/Mekanik bakım planları' },
    { key: 'ges', title: 'GES Yönetimi', desc: 'Santral ve saha detayları' },
    { key: 'uretim', title: 'Üretim Verileri', desc: 'Üretim izleme ve grafikler' },
    { key: 'sahalar', title: 'Sahalar', desc: 'Saha envanteri ve harita' },
    { key: 'ekip', title: 'Ekip Yönetimi', desc: 'Personel ve roller' },
    { key: 'stok', title: 'Stok Kontrol', desc: 'Malzemeler ve kritik stok' },
    { key: 'vardiya', title: 'Vardiya', desc: 'Vardiya devri ve kontrol listeleri' },
    { key: 'analytics', title: 'Analytics', desc: 'Performans ve KPI raporları' },
    { key: 'subscription', title: 'Abonelik', desc: 'Plan ve kullanım limitleri' },
    { key: 'settings', title: 'Ayarlar', desc: 'Şirket ayarları ve tema' },
  ];
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-slate-50 to-blue-50" id="program-haritasi">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Program Haritası</h2>
          <p className="mt-3 text-gray-600">Tüm modüllerin geniş önizlemeleri</p>
        </div>
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {pages.map((p) => (
            <div key={p.key} className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm">
              {p.image ? (
                <div className="relative w-full aspect-[3036/1582] bg-gray-50">
                  <img src={p.image} alt={`${p.title} görseli`} className="absolute inset-0 w-full h-full object-contain p-2" loading="lazy" />
                </div>
              ) : (
                <div className="w-full h-64 md:h-80 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-800">{p.title}</div>
                    <div className="text-sm text-gray-500">{p.desc}</div>
                  </div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                <div className="text-white font-semibold">{p.title}</div>
                <div className="text-white/80 text-xs">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center text-xs text-gray-500">Daha fazla ekran görüntüsü eklendikçe bu bölüm genişleyecek.</div>
      </div>
    </section>
  );
};

const FeatureShowcase: React.FC = () => {
  const features = [
    {
      title: "Arıza Yönetimi",
      description: "Arıza bildirimi, atama, takip ve çözüm süreçlerini uçtan uca yönetin",
      icon: <Zap className="w-6 h-6" />,
      image: encodeURI("/screenshots/arızasayfası.png"),
      benefits: [
        "Fotoğraf ile arıza raporlama",
        "Otomatik atama ve çok kanallı bildirimler",
        "SLA takibi, müşteri bilgilendirme ve kök neden analizi"
      ]
    },
    {
      title: "Bakım Planlama",
      description: "Elektriksel ve mekanik bakım planlarını oluşturun ve takip edin",
      icon: <Wrench className="w-6 h-6" />,
      image: "/screenshots/bakim-planlama.png", // Buraya resim yolunu ekleyin
      benefits: [
        "Otomatik bakım planlama",
        "İş emri oluşturma",
        "Kontrol listeleri ile kalite güvencesi"
      ]
    },
    {
      title: "Stok Yönetimi",
      description: "Tüm envanterinizi dijital ortamda yönetin, kritik stokları takip edin",
      icon: <Package className="w-6 h-6" />,
      image: "/screenshots/stok-dashboard.png",
      benefits: [
        "Gerçek zamanlı stok takibi",
        "Kritik stok uyarıları",
        "Tedarik zinciri yönetimi"
      ]
    },
    {
      title: "Saha & Santral Yönetimi",
      description: "Tüm saha ve santrallerinizi harita üzerinde yönetin",
      icon: <MapPin className="w-6 h-6" />,
      image: "/screenshots/saha-dashboard.png",
      benefits: [
        "Harita üzerinde konum takibi",
        "Envanter yönetimi",
        "Koordinat bazlı atamalar"
      ]
    },
    {
      title: "Ekip & Vardiya Yönetimi",
      description: "Ekip üyeleri ve vardiyaları planlayın, devri denetleyin ve kayıt altına alın",
      icon: <Users className="w-6 h-6" />,
      image: "/screenshots/ekip-dashboard.png",
      benefits: [
        "Vardiya devri ve kontrol listeleri",
        "Anlık bildirim ve onay süreçleri",
        "Vardiya performans raporları"
      ]
    },
    {
      title: "Müşteri İletişimi & Şeffaf Raporlama",
      description: "Müşterilerinize anlık durum, performans ve servis seviyesi görünürlüğü sağlayın",
      icon: <MessageSquare className="w-6 h-6" />,
      image: "/screenshots/rapor-dashboard.png",
      benefits: [
        "Paylaşılabilir rapor linkleri",
        "PDF/Excel dışa aktarım",
        "SLA ve hizmet kalitesi göstergeleri"
      ]
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-white to-blue-50">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Neler Yapabilirsiniz?</h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Platformumuzun sunduğu tüm özellikleri keşfedin</p>
        </div>
        
        <div className="mt-12 space-y-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={reveal}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-10 lg:gap-12 items-center`}
            >
              <div className="lg:w-4/12 xl:w-3/12">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">{feature.title}</h3>
                </div>
                <p className="mt-2 text-sm md:text-base text-gray-600">{feature.description}</p>
                <ul className="mt-3 space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 w-4 h-4 md:w-5 md:h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm md:text-base text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link 
                    to="/features" 
                    className="group inline-flex items-center text-primary-700 hover:text-primary-800 font-medium"
                  >
                    <span className="relative">
                    Detaylı bilgi
                      <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100" />
                    </span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="lg:w-8/12 xl:w-9/12">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-500">Örnek Ekran Görüntüsü</div>
                  </div>
                  {feature.image ? (
                    <a href={feature.image} target="_blank" rel="noopener noreferrer">
                      <div className="relative w-full aspect-[3036/1582]">
                        <img src={feature.image} alt={`${feature.title} ekran görüntüsü`} className="absolute inset-0 w-full h-full object-contain rounded-lg border bg-gray-50 p-2" loading="lazy" />
                      </div>
                    </a>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <div className="text-center">
                        <Image className="w-12 h-12 text-gray-400 mx-auto" />
                        <p className="mt-2 text-gray-500 text-sm">{feature.title} Arayüzü</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};



const PricingStrip: React.FC = () => (
  <section className="py-8 bg-white">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-xl border bg-gradient-to-r from-blue-50 via-emerald-50 to-purple-50 p-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="text-sm font-semibold text-gray-800">Saha Bazlı Şeffaf Fiyatlandırma</div>
            <div className="text-xs text-gray-600">Küçükten büyüğe tüm portföyler için adil ölçeklenebilir model</div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-3 py-1 rounded-md bg-white border text-gray-800">Starter</span>
            <span className="px-3 py-1 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 text-white">Professional</span>
            <span className="px-3 py-1 rounded-md bg-white border text-gray-800">Enterprise</span>
            <Link to="/pricing" className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700">Detaylı Bilgi</Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Stats: React.FC = () => {
  const [uptime, setUptime] = useState(92);
  const [mttr, setMttr] = useState(0);
  const [satisfaction, setSatisfaction] = useState(0);
  const [alerts, setAlerts] = useState(0);
  useEffect(() => {
    const duration = 900;
    const steps = 45;
    const inc = duration / steps;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setUptime(92 + Math.min(7.9, (7.9 * i) / steps));
      setMttr(Math.min(35, (35 * i) / steps));
      setSatisfaction(Math.min(4.9, (4.9 * i) / steps));
      setAlerts(Math.min(99.5, (99.5 * i) / steps));
      if (i >= steps) clearInterval(timer);
    }, inc);
    return () => clearInterval(timer);
  }, []);
  return (
    <section className="py-12 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} className="rounded-xl border bg-white p-6 text-center">
            <div className="mx-auto w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{uptime.toFixed(1)}%</div>
            <div className="mt-1 text-sm text-gray-500">Sistem Uptime</div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={reveal} className="rounded-xl border bg-white p-6 text-center">
            <div className="mx-auto w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center"><Wrench className="w-5 h-5" /></div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">-{Math.round(mttr)}%</div>
            <div className="mt-1 text-sm text-gray-500">MTTR (çözüm süresi)</div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={reveal} className="rounded-xl border bg-white p-6 text-center">
            <div className="mx-auto w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center"><Star className="w-5 h-5" /></div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{satisfaction.toFixed(1)}/5</div>
            <div className="mt-1 text-sm text-gray-500">Memnuniyet</div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={reveal} className="rounded-xl border bg-white p-6 text-center">
            <div className="mx-auto w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center"><Bell className="w-5 h-5" /></div>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{alerts.toFixed(1)}%</div>
            <div className="mt-1 text-sm text-gray-500">Anlık Bildirim Teslimi</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const MiniChart: React.FC<{ color?: string; data?: number[] }> = ({ color = '#2563eb', data }) => {
  const defaultData = data ?? [10, 14, 12, 18, 16, 19, 22, 20, 24, 23, 27, 26];
  const max = Math.max(...defaultData);
  const min = Math.min(...defaultData);
  const points = defaultData
    .map((v, i) => {
      const x = (i / (defaultData.length - 1)) * 100;
      const y = 100 - ((v - min) / (max - min || 1)) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-16">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
        className="[stroke-dasharray:400] [stroke-dashoffset:400] animate-[dash_1.6s_ease-out_forwards]"
      />
      <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
};

const LivePreview: React.FC = () => (
  <section className="py-12 bg-white">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-white p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Üretim Eğilimi</div>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <MiniChart color="#2563eb" />
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Arıza Eğilimi</div>
            <Wrench className="w-4 h-4 text-red-500" />
          </div>
          <MiniChart color="#059669" data={[28, 25, 24, 20, 22, 19, 18, 16, 15, 14, 13, 12]} />
        </div>
      </div>
    </div>
  </section>
);

const HowItWorks: React.FC = () => {
  const steps = [
    { icon: <Zap className="w-6 h-6" />, title: 'Bildir', desc: 'Arıza/Bakım/Vardiya kaydını oluşturun' },
    { icon: <Wrench className="w-6 h-6" />, title: 'Yönet', desc: 'Atayın, izleyin, kanıtları toplayın' },
    { icon: <CheckCircle className="w-6 h-6" />, title: 'Kapat', desc: 'SLA içinde çözün, raporlayın' },
  ];
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Nasıl Çalışır?</h2>
          <p className="mt-3 text-gray-600">3 adımda uçtan uca şeffaf hizmet akışı</p>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="rounded-xl border bg-white p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">{s.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Testimonials: React.FC = () => {
  const items = [
    { name: 'Çağrı Y.', role: 'Operasyon Müdürü', quote: 'Arıza çözüm hızımız %30 arttı, müşteriye şeffaf raporlama sağladık.' },
    { name: 'Melis K.', role: 'Bakım Yöneticisi', quote: 'Vardiya devri ve kontrol listeleri ile hataları sıfıra indirdik.' },
    { name: 'Emre T.', role: 'Saha Sorumlusu', quote: 'Mobilden kayıt ve fotoğraf yükleme ekip işini çok hızlandırdı.' },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);
  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Kullanıcılarımız Ne Diyor?</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">Gerçek ekiplerin gerçek sonuçları</p>
        </div>
        <div className="mt-10">
          <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm overflow-hidden">
            <div className="transition-all duration-500" style={{ transform: `translateX(-${i * 100}%)` }}>
              <div className="flex">
                {items.map((t, idx) => (
                  <div key={idx} className="min-w-full">
                    <div className="mx-auto max-w-3xl text-center">
                      <div className="text-gray-700 dark:text-gray-300">“{t.quote}”</div>
                      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t.name} • {t.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              {items.map((_, idx) => (
                <button key={idx} onClick={() => setI(idx)} className={`w-2 h-2 rounded-full ${i===idx?'bg-blue-600':'bg-gray-300'}`} aria-label={`Go to testimonial ${idx+1}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


const FAQ: React.FC = () => {
  const faqs = [
    { q: 'Deneme süresi gerçekten ücretsiz mi?', a: 'Evet, 15 gün boyunca kredi kartı gerekmeden tüm özellikleri deneyebilirsiniz.' },
    { q: 'Saha bazlı fiyatlandırma nasıl çalışır?', a: 'Portföyünüzdeki saha sayısına göre esneyen şeffaf bir model uygularız.' },
    { q: 'Verilerim güvende mi?', a: 'RBAC, şirket bazlı izolasyon, audit loglar ve KVKK uyumu ile güvendedir.' },
    { q: 'İptal edebilir miyim?', a: 'İstediğiniz zaman planınızı iptal edebilir veya yükseltebilirsiniz.' },
  ];
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Sık Sorulan Sorular</h2>
          <p className="mt-3 text-gray-600">Kafanıza takılanları hızlıca yanıtlayalım</p>
        </div>
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-6">
              <div className="text-sm font-semibold text-gray-900">{f.q}</div>
              <div className="mt-2 text-sm text-gray-600">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


const WhatsAppBubble: React.FC = () => (
  <a
    href="https://api.whatsapp.com/send?phone=905318984145&text=Merhaba%2C%20SolarVeyo%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-24 right-6 z-40 rounded-full bg-emerald-500 text-white px-4 py-3 shadow-lg hover:bg-emerald-600"
    aria-label="WhatsApp ile iletişime geç"
  >
    <MessageSquare className="w-5 h-5" />
  </a>
);

const VideoModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-[90vw] max-w-3xl overflow-hidden">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-md bg-white/80 border hover:bg-white"><X className="w-4 h-4" /></button>
        <div className="aspect-video w-full">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Demo Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

const FloatingCTA: React.FC = () => (
  <a
    href="/register"
    className="fixed bottom-6 right-6 z-40 rounded-full bg-primary-600 text-white px-5 py-3 shadow-lg hover:bg-primary-700"
  >
    Hemen Başlayın
  </a>
);


const BusinessBenefits: React.FC = () => {
  const benefits = [
    {
      icon: <Award className="w-6 h-6" />,
      title: "Müşteri Memnuniyetinde Artış",
      description: "Şeffaf raporlama ve anlık bilgilendirme ile güven inşa edin"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Daha Kısa Çözüm Süreleri",
      description: "Standart süreçler ve bildirimlerle MTTR'ı kayda değer oranda azaltın"
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      title: "Operasyonel Verimlilik",
      description: "Vardiya, ekip ve stok koordinasyonu ile verimliliği artırın"
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "SLA Uyum ve Denetim İzleri",
      description: "Sözleşme taahhütlerini izleyin; denetime hazır kayıtlar tutun"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Maliyet Kontrolü",
      description: "Planlı bakım ve doğru stok ile gereksiz maliyetleri azaltın"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">İşletmeler İçin Avantajlar</h2>
          <p className="mt-4 text-gray-600">SolarVeyo’yu kullanan firmaların müşterilerine sunduğu hizmet kalitesini artırın</p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                {b.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{b.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTA: React.FC = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 p-8 md:p-12 text-white">
          <div className="md:flex items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold">SolarVeyo ile operasyonlarınızı dijitalleştirin</h3>
              <p className="mt-2 text-white/90">15 gün ücretsiz deneme ile tüm özellikleri test edin. Kredi kartı gerekmez.</p>
            </div>
            <div className="mt-6 md:mt-0 flex flex-col sm:flex-row items-center gap-3">
              <Link to="/register" className="rounded-md bg-white text-blue-700 px-6 py-3 text-sm font-medium shadow hover:bg-blue-50 w-full sm:w-auto text-center">
                Ücretsiz Deneyin
              </Link>
              <a 
                href="https://api.whatsapp.com/send?phone=905318984145&text=Merhaba%2C%20SolarVeyo%20sat%C4%B1%C5%9F%20ekibiyle%20g%C3%B6r%C3%BC%C5%9Fmek%20istiyorum"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-blue-700/30 text-white px-6 py-3 text-sm font-medium hover:bg-blue-700/40 w-full sm:w-auto text-center"
              >
                Satış Ekibiyle Görüş
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SectionDivider: React.FC = () => (
  <div className="w-full overflow-hidden">
    <svg className="w-full h-12 text-blue-50" preserveAspectRatio="none" viewBox="0 0 1200 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,0 C300,100 900,0 1200,100 L1200,0 L0,0 Z" fill="currentColor" />
    </svg>
  </div>
);

const Home: React.FC = () => {
  const [showVideo, setShowVideo] = useState(false);
  useEffect(() => {
    document.title = 'SolarVeyo — Güneş Enerjisi Yönetim Platformu';
    const meta = document.querySelector('meta[name="description"]');
    const content = 'Arıza takibi, bakım, vardiya kontrolü ve şeffaf müşteri hizmetini tek platformda yönetin. 15 gün ücretsiz deneyin.';
    if (meta) {
      meta.setAttribute('content', content);
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = content;
      document.head.appendChild(m);
    }
    // OpenGraph / Twitter
    const setMeta = (name: string, attr: 'name' | 'property', value: string) => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        (el as any)[attr] = name;
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };
    setMeta('og:title', 'property', 'SolarVeyo — Güneş Enerjisi Yönetim Platformu');
    setMeta('og:description', 'property', content);
    setMeta('og:type', 'property', 'website');
    setMeta('twitter:card', 'name', 'summary_large_image');
    setMeta('twitter:title', 'name', 'SolarVeyo');
    setMeta('twitter:description', 'name', content);

    // JSON-LD (SoftwareApplication)
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'SolarVeyo',
      applicationCategory: 'BusinessApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: 27 },
    } as const;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Nav />
      <Hero onOpenVideo={() => setShowVideo(true)} />
      <SectionDivider />
      <PricingStrip />
      <Stats />
      <SectorFit />
      {/* AppPagesOverview kaldırıldı */}
      <FeatureShowcase />
      {/* LivePreview kaldırıldı */}
      <HowItWorks />
      <BusinessBenefits />
      <CTA />
      <FAQ />
      <Testimonials />
      <FloatingCTA />
      <WhatsAppBubble />
      <VideoModal open={showVideo} onClose={() => setShowVideo(false)} />
      <Footer />
    </div>
  );
};

export default Home;