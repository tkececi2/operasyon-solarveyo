import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Zap, BarChart3, ShieldCheck, Users, Wrench, Building2, LineChart, MessageSquare, Lock, Database, Globe, Cpu, CheckCircle, ArrowRight, CreditCard, Award, Shield, Server, Smartphone, Download, Play, X, Check, TrendingUp, Clock, DollarSign, Calculator } from 'lucide-react';
import Logo from '../../components/ui/Logo';

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
          <Link to="/contact" className="text-gray-700 hover:text-gray-900">İletişim</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-700 hover:text-gray-900">Giriş Yap</Link>
          <Link
            to="/register"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            Ücretsiz Kullanım
          </Link>
        </div>
      </div>
    </nav>
  );
};

const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-sky-50 via-white to-white" />
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute -z-10 inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-sky-200/60 blur-3xl animate-pulse" />
        <div className="absolute top-40 -left-20 w-72 h-72 rounded-full bg-blue-200/50 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 rounded-full bg-emerald-200/50 blur-3xl animate-pulse" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
              <ShieldCheck className="w-4 h-4" />
              Çoklu Şirket • Güvenli • Gerçek Zamanlı
            </div>
            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-blue-700 to-sky-600 bg-clip-text text-transparent">Solar Enerji</span> Operasyonlarınızı <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Otomatikleştirin</span>
            </h1>
            <p className="mt-6 text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl">
              Arıza yönetiminden üretim takibine, ekip yönetiminden stok kontrolüne kadar tüm operasyonlarınızı tek platformda yönetin. <span className="font-semibold text-gray-900">Kurulum 5 dakika, sonuçlar anında.</span>
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-sky-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <span>🎉 Ücretsiz Kullanmaya Başla</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-600 px-8 py-4 text-base font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <span>Demo İncele</span>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" /> <span className="font-medium">Kredi kartı gerekmez</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" /> <span className="font-medium">5 dakikada kurulum</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" /> <span className="font-medium">7/24 Türkçe destek</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-tr from-blue-100 to-emerald-100 rounded-3xl blur-2xl -z-10" />
            <div className="rounded-2xl border border-gray-200 shadow-md overflow-hidden bg-white/90 backdrop-blur">
              <div className="p-4 border-b text-sm font-medium text-gray-700">Canlı Kontrol Paneli Önizleme</div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 transition-transform hover:-translate-y-0.5">
                  <div className="text-xs text-gray-500">Anlık Üretim</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">1.24 MW</div>
                  <div className="mt-1 text-xs text-emerald-600">+3.2% bugün</div>
                </div>
                <div className="rounded-lg border p-4 transition-transform hover:-translate-y-0.5">
                  <div className="text-xs text-gray-500">Aktif Arıza</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">4</div>
                  <div className="mt-1 text-xs text-red-600">2 kritik</div>
                </div>
                <div className="rounded-lg border p-4 transition-transform hover:-translate-y-0.5">
                  <div className="text-xs text-gray-500">Bakım Planı</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">12</div>
                  <div className="mt-1 text-xs text-blue-600">Bu ay</div>
                </div>
                <div className="rounded-lg border p-4 transition-transform hover:-translate-y-0.5">
                  <div className="text-xs text-gray-500">Performans</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">%98.4</div>
                  <div className="mt-1 text-xs text-emerald-600">Stabil</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow transition-shadow">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    </div>
    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{desc}</p>
  </div>
);

const Features: React.FC = () => {
  return (
    <section id="ozellikler" className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Operasyonun bel kemiği özellikler</h2>
          <p className="mt-3 text-gray-600">Modern SaaS mimarisi: gerçek zamanlı bildirimler, önbellekli metrikler, arka plan işler ve güvenli veri izolasyonu.</p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard icon={<AlertTriangleIcon />} title="Arıza Yönetimi" desc="Kayıt, atama, SLA takibi ve durum güncellemeleri. WhatsApp/SMS bildirimleri ile hızlanın." />
          <FeatureCard icon={<Wrench className="w-5 h-5" />} title="Bakım Planlama" desc="Elektrik/mekanik bakım planlarını oluşturun, iş emirleri ve kontrol listeleri ile takip edin." />
          <FeatureCard icon={<LineChart className="w-5 h-5" />} title="Üretim Analitiği" desc="Aylık üretim, tahmin ve anomali tespiti. Gerçek verilere dayalı kararlar." />
          <FeatureCard icon={<Building2 className="w-5 h-5" />} title="GES & Saha Yönetimi" desc="Santral ve saha envanteri, koordinatlar, harita entegrasyonu ve ekip atamaları." />
          <FeatureCard icon={<Users className="w-5 h-5" />} title="Ekip & Vardiya" desc="Vardiya bildirimleri, görev atamaları ve mobil uyumlu iş akışları." />
          <FeatureCard icon={<ShieldCheck className="w-5 h-5" />} title="Güvenli Çoklu-Şirket" desc="Tüm kayıtlar companyId ile izole. Müşteriler sadece yetkili veriyi görür." />
        </div>
      </div>
    </section>
  );
};

const Modules: React.FC = () => {
  const items = [
    { icon: <Zap className="w-4 h-4" />, label: 'Arıza Yönetimi' },
    { icon: <Wrench className="w-4 h-4" />, label: 'Bakım Sistemi' },
    { icon: <Building2 className="w-4 h-4" />, label: 'GES Yönetimi' },
    { icon: <LineChart className="w-4 h-4" />, label: 'Üretim Takibi' },
    { icon: <Users className="w-4 h-4" />, label: 'Ekip Yönetimi' },
    { icon: <ShieldCheck className="w-4 h-4" />, label: 'Vardiya/Güvenlik' },
    { icon: <BarChart3 className="w-4 h-4" />, label: 'Raporlama' },
    { icon: <MessageSquare className="w-4 h-4" />, label: 'Bildirimler' },
  ];
  return (
    <section id="moduller" className="py-16 md:py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Tüm modüller tek platformda</h2>
          <p className="mt-3 text-gray-600">Süreçlerinizi dijitalleştirin, ekiplerinizi tek ekrandan yönetin.</p>
        </div>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((it) => (
            <div key={it.label} className="flex items-center gap-2 rounded-lg border bg-white p-3 text-sm text-gray-700 transition hover:shadow-md">
              <span className="text-blue-600">{it.icon}</span>
              {it.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const BrandStrip: React.FC = () => {
  return (
    <section className="py-8 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-4">Bize güvenen ekipler</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-md border bg-gradient-to-br from-gray-50 to-white flex items-center justify-center text-gray-400 text-xs">
              LOGO
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AnimatedCounter: React.FC<{ end: number; suffix?: string; durationMs?: number; label: string }> = ({ end, suffix = '', durationMs = 1400, label }) => {
  const [value, setValue] = useState(0);
  const startTs = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    const step = (ts: number) => {
      if (!startTs.current) startTs.current = ts;
      const progress = Math.min(1, (ts - startTs.current) / durationMs);
      setValue(Math.floor(progress * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, durationMs]);

  return (
    <div className="rounded-xl border bg-white p-6 text-center shadow-sm">
      <div className="text-3xl font-bold text-gray-900">
        {value}
        {suffix}
      </div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  );
};

const Stats: React.FC = () => {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Rakamlarla SolarVeyo</h2>
          <p className="mt-2 text-gray-600">Türkiye'nin güvendiği solar enerji yönetim platformu</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedCounter end={150} suffix="+" label="Aktif Şirket" />
          <AnimatedCounter end={500} suffix="+" label="Yönetilen Santral" />
          <AnimatedCounter end={98} suffix="%" label="Müşteri Memnuniyeti" />
          <AnimatedCounter end={24} suffix="/7" label="Kesintisiz Hizmet" />
        </div>
      </div>
    </section>
  );
};

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      text: "SolarVeyo ile arıza çözüm sürelerimizi %40 kısalttık. Sahada ekiplerimiz artık ne yapacağını biliyor, sistem otomatik görev ataması yapıyor.",
      author: "Mehmet Yılmaz",
      role: "Operasyon Müdürü",
      company: "Anatolia Solar Enerji",
      rating: 5
    },
    {
      text: "Müşterilerimize şeffaf raporlama yapabiliyoruz. Mobil uygulama sayesinde sahada anında kayıt alıyoruz. Gerçekten işimizi kolaylaştırdı.",
      author: "Ayşe Demir",
      role: "Saha Mühendisi",
      company: "Güneş Enerji A.Ş.",
      rating: 5
    },
    {
      text: "Önceden Excel'de takip etmeye çalıştığımız tüm işler artık otomatik. Bakım planlaması, stok takibi, raporlama... Hepsi bir arada ve çok hızlı.",
      author: "Can Özkan",
      role: "Genel Müdür",
      company: "Solar Power Türkiye",
      rating: 5
    }
  ];

  return (
    <section id="referanslar" className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Müşterilerimiz Ne Diyor?</h2>
          <p className="mt-3 text-gray-600">Türkiye'nin önde gelen solar enerji şirketleri SolarVeyo ile operasyonlarını yönetiyor.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <svg key={idx} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="mt-4 text-gray-700 leading-relaxed">"{t.text}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center text-white font-bold text-lg">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{t.author}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                  <div className="text-xs text-gray-400">{t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ValueProps: React.FC = () => {
  const items = [
    { icon: <Cpu className="w-5 h-5" />, title: 'Akıllı Otomasyon', desc: 'Arıza atama, bildirim ve bakım planlamasını kurallar ile otomatikleştirin.' },
    { icon: <Database className="w-5 h-5" />, title: 'Gerçek Zamanlı Veri', desc: 'Saha ve santrallerden gelen verileri anlık takip edin.' },
    { icon: <Lock className="w-5 h-5" />, title: 'Kurumsal Güvenlik', desc: 'Rol tabanlı erişim, şirket izolasyonu ve güvenli depolama.' },
  ];
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((it) => (
            <div key={it.title} className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">{it.icon}</div>
              <h3 className="mt-3 text-base font-semibold text-gray-900">{it.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const UseCases: React.FC = () => {
  const cases = [
    { role: 'Yönetici', points: ['Tüm operasyonu tek bakışta', 'Maliyet/performans raporları', 'Abonelik ve faturalama kontrolü'] },
    { role: 'Mühendis', points: ['Anomali analizi', 'Bakım ve iş emri planlama', 'Üretim trendleri'] },
    { role: 'Tekniker', points: ['Mobil görev akışı', 'QR ile hızlı varlık erişimi', 'Vardiya bildirimleri'] },
    { role: 'Müşteri', points: ['Kendine atanmış sahalar', 'Şeffaf arıza/bakım görünümü', 'Basit raporlar'] },
  ];
  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Kullanım Senaryoları</h2>
          <p className="mt-3 text-gray-600">Her rol için optimize edilmiş akışlar.</p>
        </div>
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {cases.map((c) => (
            <div key={c.role} className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">{c.role}</div>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 w-4 h-4 text-emerald-600" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Integrations: React.FC = () => {
  const items = [
    { label: 'Firebase', icon: <Database className="w-4 h-4" /> },
    { label: 'Google Maps', icon: <Globe className="w-4 h-4" /> },
    { label: 'Stripe', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'WhatsApp', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Excel/PDF', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'QR Kod', icon: <Zap className="w-4 h-4" /> },
  ];
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Entegrasyonlar</h2>
          <p className="mt-3 text-gray-600">Kullandığınız araçlarla uyumlu çalışır.</p>
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {items.map((it) => (
            <div key={it.label} className="flex items-center justify-center gap-2 rounded-lg border bg-white p-3 text-sm text-gray-700">
              <span className="text-blue-600">{it.icon}</span>
              {it.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Security: React.FC = () => {
  const bullets = ['Rol tabanlı yetki', 'Müşteri veri izolasyonu', 'Yedekleme ve versiyonlama', 'İz kayıtları (audit trail)'];
  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white p-8 md:p-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Güvenlik ve Gizlilik</h3>
              <p className="mt-1 text-sm text-gray-600">Kurumsal ihtiyaçlar için tasarlandı. Erişim kontrolü, loglama ve izolasyon mimarisi.</p>
              <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" />{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const PricingTeaser: React.FC = () => {
  const tiers = [
    { name: 'Starter', price: 'Ücretsiz', features: ['3 kullanıcı', 'Temel modüller', 'E-posta destek'] },
    { name: 'Pro', price: '₺', features: ['Sınırsız kullanıcı', 'Tüm modüller', 'Öncelikli destek'] },
    { name: 'Enterprise', price: 'Teklif', features: ['Özel SLA', 'SSO / Entegrasyon', 'Özel eğitim'] },
  ];
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Esnek ve ölçeklenebilir</h2>
          <p className="mt-3 text-gray-600">İhtiyacınıza göre başlayın, büyüdükçe genişletin.</p>
        </div>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div key={t.name} className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">{t.name}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{t.price}</div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><CheckCircle className="mt-0.5 w-4 h-4 text-blue-600" />{f}</li>
                ))}
              </ul>
              <Link to="/register" className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Başlayın
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
const CTA: React.FC = () => {
  return (
    <section id="iletisim" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-sky-600 to-emerald-500" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 p-10 md:p-16 text-white shadow-2xl">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
              🚀 Hemen Başlayın, <span className="text-yellow-300">Ücretsiz Kullanın</span>
            </h3>
            <p className="mt-6 text-lg md:text-xl text-white/90 leading-relaxed">
              Kredi kartı bilgisi gerekmez. Kurulum 5 dakika. İptal için hiçbir prosedür yok. Tüm özellikler açık.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/register" 
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl bg-white text-blue-700 px-10 py-5 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                <span>Ücretsiz Kullanım</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl bg-white/10 backdrop-blur border-2 border-white/30 text-white px-10 py-5 text-lg font-bold hover:bg-white/20 transition-all"
              >
                <span>Demo İncele</span>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Kredi kartı gerekmez</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>5 dakikada başlayın</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>İstediğiniz zaman iptal edin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FAQ: React.FC = () => {
  const items = [
    { q: 'SolarVeyo gerçekten ücretsiz mi?', a: 'Evet! Herhangi bir ödeme bilgisi gerekmeden tüm özellikleri kullanabilirsiniz. İlerleyen dönemde premium özellikler eklendiğinde tercih edebilirsiniz.' },
    { q: 'Kaç kullanıcı ekleyebilirim?', a: 'Başlangıç planında 3 kullanıcı, profesyonel planlarda sınırsız kullanıcı ekleyebilirsiniz.' },
    { q: 'Verilerim güvende mi?', a: 'Tüm verileriniz Firebase güvenlik kuralları ile korunur. Çoklu şirket desteği sayesinde her şirketin verileri tamamen izole edilir.' },
    { q: 'Mobil uygulaması var mı?', a: 'Evet! Hem web hem de iOS/Android mobil uygulamalarımız mevcuttur. Sahada çalışan ekipleriniz için optimize edilmiştir.' },
    { q: 'Müşteri rolü neleri görür?', a: 'Müşteriler sadece kendilerine atanmış saha ve santrallere ait verileri görüntüler. Tam veri izolasyonu sağlanır.' },
    { q: 'Destek nasıl alırım?', a: '7/24 Türkçe destek ekibimiz e-posta, WhatsApp ve canlı chat üzerinden size yardımcı olmaya hazır.' },
  ];
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Sıkça Sorulan Sorular</h2>
        <div className="mt-6 space-y-3">
          {items.map((it, idx) => (
            <details key={idx} className="group rounded-lg border bg-white p-4 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-gray-900">
                {it.q}
                <span className="ml-4 text-gray-400 group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-2 text-sm text-gray-600">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center">
            <Sun className="w-4 h-4 text-white" />
          </div>
          <span>© {new Date().getFullYear()} SolarVeyo</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-gray-900">Sözleşme ve Politikalar</a>
          <a href="#" className="hover:text-gray-900">Yardım Merkezi</a>
        </div>
      </div>
    </footer>
  );
};

// Trust Badges Section
const TrustBadges: React.FC = () => {
  const badges = [
    { icon: <Shield className="w-6 h-6" />, title: 'ISO 27001', desc: 'Sertifikalı Güvenlik' },
    { icon: <Lock className="w-6 h-6" />, title: 'SSL/TLS', desc: 'Şifreli Bağlantı' },
    { icon: <Server className="w-6 h-6" />, title: 'Türkiye', desc: 'Yerel Hosting' },
    { icon: <Award className="w-6 h-6" />, title: 'GDPR', desc: 'Veri Koruma' },
  ];

  return (
    <section className="py-12 bg-white border-y">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, idx) => (
            <div key={idx} className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                {badge.icon}
              </div>
              <div className="font-semibold text-gray-900 text-sm">{badge.title}</div>
              <div className="text-xs text-gray-500 mt-1">{badge.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Video Demo Section
const VideoDemo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            2 Dakikada SolarVeyo'yu Keşfedin
          </h2>
          <p className="mt-3 text-gray-600">
            Platformumuzu kullanarak nasıl dakikalar içinde operasyonlarınızı yönetebileceğinizi görün.
          </p>
        </div>
        <div className="mt-10 max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-900 to-gray-800 aspect-video">
            {!isPlaying ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-emerald-600/20 backdrop-blur-sm" />
                <button
                  onClick={() => setIsPlaying(true)}
                  className="relative group"
                >
                  <div className="w-24 h-24 rounded-full bg-white shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 text-blue-600 ml-1" />
                  </div>
                </button>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-white text-center p-8">
                    <div className="text-2xl font-bold mb-2">🎬 Platform Tanıtımı</div>
                    <div className="text-white/80">Tüm özellikleri 2 dakikada görün</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-lg mb-4">Video içeriği buraya eklenecek</div>
                  <button
                    onClick={() => setIsPlaying(false)}
                    className="px-6 py-2 bg-white/20 rounded-lg hover:bg-white/30"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            )}
            {/* Preview Screenshot Placeholder */}
            <img
              src="/screenshots/saha-dashboard.png"
              alt="SolarVeyo Dashboard"
              className="w-full h-full object-cover opacity-30"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// Mobile App Showcase
const MobileShowcase: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100 mb-4">
              <Smartphone className="w-4 h-4" />
              iOS & Android
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Sahada Bile Tam Kontrol
            </h2>
            <p className="mt-4 text-gray-600 text-lg">
              Mobil uygulamalarımızla ekipleriniz sahada bile tüm işlemleri gerçekleştirebilir. 
              Arıza kaydı, fotoğraf ekleme, görev tamamlama ve daha fazlası.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Offline çalışma desteği',
                'QR kod okutma ile hızlı erişim',
                'Anlık push bildirimleri',
                'Konum tabanlı görev yönetimi',
                'Fotoğraf ve belge yükleme',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-6 py-3 hover:bg-gray-800 transition"
              >
                <Download className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-6 py-3 hover:bg-gray-800 transition"
              >
                <Download className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs">GET IT ON</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-emerald-200 rounded-3xl blur-3xl opacity-30" />
            <div className="relative flex items-center justify-center">
              <div className="w-64 h-[500px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl border-8 border-gray-800">
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                  <div className="h-6 bg-gray-900 flex items-center justify-center">
                    <div className="w-20 h-4 bg-gray-800 rounded-full" />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="text-xs font-bold text-gray-900">📱 SolarVeyo Mobile</div>
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg border border-blue-100" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Comparison Table: Excel vs SolarVeyo
const ComparisonTable: React.FC = () => {
  const comparisons = [
    { feature: 'Gerçek Zamanlı Veri', excel: false, solarveyo: true },
    { feature: 'Otomatik Bildirimler', excel: false, solarveyo: true },
    { feature: 'Mobil Erişim', excel: false, solarveyo: true },
    { feature: 'Çoklu Kullanıcı', excel: false, solarveyo: true },
    { feature: 'Otomatik Yedekleme', excel: false, solarveyo: true },
    { feature: 'Güvenlik ve İzolasyon', excel: false, solarveyo: true },
    { feature: 'Harita Entegrasyonu', excel: false, solarveyo: true },
    { feature: 'Audit Log', excel: false, solarveyo: true },
    { feature: 'Manuel Veri Girişi', excel: true, solarveyo: false },
    { feature: 'Versiyon Karmaşası', excel: true, solarveyo: false },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Excel mi, SolarVeyo mu?
          </h2>
          <p className="mt-3 text-gray-600">
            Geleneksel yöntemlerle modern platform arasındaki fark
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-sky-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Özellik</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  📊 Excel
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-blue-700">
                  ⚡ SolarVeyo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comparisons.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900">{item.feature}</td>
                  <td className="px-6 py-4 text-center">
                    {item.excel ? (
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    ) : (
                      <div className="w-5 h-5 mx-auto bg-gray-100 rounded" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.solarveyo ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />
                    ) : (
                      <div className="w-5 h-5 mx-auto bg-gray-100 rounded" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-8 py-4 font-semibold hover:bg-blue-700 transition"
          >
            <span>Hemen SolarVeyo'ya Geçin</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

// ROI Calculator
const ROICalculator: React.FC = () => {
  const [santralSayisi, setSantralSayisi] = useState(10);
  const [personelSayisi, setPersonelSayisi] = useState(5);

  const hesaplamalar = useMemo(() => {
    const aylikZamanTasarrufu = santralSayisi * 8 + personelSayisi * 4; // saat
    const yillikMaliyet = santralSayisi * 1200 + personelSayisi * 800; // ₺
    const verimliliktArtis = santralSayisi * 2.5; // %

    return {
      zamanTasarrufu: aylikZamanTasarrufu,
      maliyetTasarrufu: yillikMaliyet,
      verimlilik: Math.min(verimliliktArtis, 45), // max %45
    };
  }, [santralSayisi, personelSayisi]);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            💰 SolarVeyo ile Ne Kadar Tasarruf Edersiniz?
          </h2>
          <p className="mt-3 text-gray-600">
            Operasyon büyüklüğünüze göre tahmini tasarrufunuzu hesaplayın
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Sol: Input'lar */}
          <div className="space-y-6">
            <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-white p-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Kaç santral yönetiyorsunuz?
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={santralSayisi}
                onChange={(e) => setSantralSayisi(Number(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="mt-2 text-2xl font-bold text-blue-700">{santralSayisi} Santral</div>
            </div>

            <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Kaç personel çalışıyor?
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={personelSayisi}
                onChange={(e) => setPersonelSayisi(Number(e.target.value))}
                className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="mt-2 text-2xl font-bold text-emerald-700">{personelSayisi} Personel</div>
            </div>
          </div>

          {/* Sağ: Sonuçlar */}
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
                <div className="text-sm text-gray-600">Aylık Zaman Tasarrufu</div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {hesaplamalar.zamanTasarrufu} saat
              </div>
              <div className="mt-1 text-xs text-gray-500">
                ~{Math.round(hesaplamalar.zamanTasarrufu / 8)} iş günü kazanç
              </div>
            </div>

            <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 text-emerald-600" />
                <div className="text-sm text-gray-600">Yıllık Maliyet Tasarrufu</div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ₺{hesaplamalar.maliyetTasarrufu.toLocaleString('tr-TR')}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Operasyonel verimlilik artışı
              </div>
            </div>

            <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-amber-600" />
                <div className="text-sm text-gray-600">Verimlilik Artışı</div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                %{hesaplamalar.verimlilik.toFixed(1)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Daha hızlı arıza çözümü ve raporlama
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center p-6 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 text-white">
          <div className="text-lg font-semibold mb-2">
            🎯 Bu tasarrufları gerçekleştirmek ister misiniz?
          </div>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 mt-4 px-8 py-3 bg-white text-blue-700 rounded-lg font-bold hover:bg-blue-50 transition"
          >
            <span>Ücretsiz Başlayın</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

const AlertTriangleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
  </svg>
);

const Landing: React.FC = () => {
  useEffect(() => {
    document.title = 'SolarVeyo — Güneş Enerjisi Yönetim Platformu';
    const meta = document.querySelector('meta[name="description"]');
    const content = 'Arıza, bakım, üretim takibi ve daha fazlasını tek platformda yönetin. Ücretsiz kullanmaya başlayın.';
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
    <div className="min-h-screen flex flex-col bg-white">
      <Nav />
      <Hero />
      <TrustBadges />
      <BrandStrip />
      <Stats />
      <VideoDemo />
      <ValueProps />
      <Features />
      <MobileShowcase />
      <UseCases />
      <ComparisonTable />
      <ROICalculator />
      <Integrations />
      <Security />
      <PricingTeaser />
      <Modules />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default Landing;


