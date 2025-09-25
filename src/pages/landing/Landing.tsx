import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Zap, BarChart3, ShieldCheck, Users, Wrench, Building2, LineChart, MessageSquare, Lock, Database, Globe, Cpu, CheckCircle, ArrowRight, CreditCard } from 'lucide-react';
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
            Ücretsiz Deneyin
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
            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
              <span className="bg-gradient-to-r from-gray-900 via-blue-700 to-sky-600 bg-clip-text text-transparent">GES Operasyonunuzu</span> tek platformdan yönetin
            </h1>
            <p className="mt-4 text-gray-600 text-base md:text-lg leading-relaxed">
              Arıza, bakım, üretim takibi, ekip ve stok yönetimi. Hepsi bir arada, hızlı ve güvenli.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center rounded-md bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow hover:bg-blue-700 hover:shadow-lg transition-shadow"
              >
                15 Gün Ücretsiz Dene
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-md px-5 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50"
              >
                Demo hesabına giriş
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Kayıtlı olaylarda %35 daha hızlı çözüm
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" /> Üretim verilerinde hatasız analiz
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
    <section className="py-12 bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-3 gap-4">
          <AnimatedCounter end={24} suffix="/7" label="Kesintisiz Takip" />
          <AnimatedCounter end={98} suffix="%" label="Uptime" />
          <AnimatedCounter end={120} suffix="+" label="Aktif Saha/Santral" />
        </div>
      </div>
    </section>
  );
};

const Testimonials: React.FC = () => {
  return (
    <section id="referanslar" className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Müşterilerimiz ne diyor?</h2>
          <p className="mt-3 text-gray-600">Gerçek iş akışlarında doğrulanmış verimlilik ve hız kazanımı.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[1,2,3].map((i) => (
            <div key={i} className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-gray-700">“SolarVeyo ile arıza çözüm sürelerimizi kısalttık, sahadaki ekipler daha senkron.”</p>
              <div className="mt-4 text-sm text-gray-500">Operasyon Müdürü</div>
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
    <section id="iletisim" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 p-8 md:p-12 text-white">
          <div className="md:flex items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold">SolarVeyo ilk 15 gün ücretsiz!</h3>
              <p className="mt-2 text-white/90">Kredi kartı gerekmez. 5 dakikada ekibinizle kullanmaya başlayın.</p>
            </div>
            <div className="mt-6 md:mt-0 flex items-center gap-3">
              <Link to="/register" className="rounded-md bg-white text-blue-700 px-5 py-3 text-sm font-medium shadow hover:bg-blue-50">Ücretsiz Deneyin</Link>
              <Link to="/login" className="rounded-md bg-blue-700/30 text-white px-5 py-3 text-sm font-medium hover:bg-blue-700/40">Demo Giriş</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FAQ: React.FC = () => {
  const items = [
    { q: 'SolarVeyo’yu denemek ücretli mi?', a: 'İlk 15 gün tamamen ücretsizdir. Kredi kartı gerekmez.' },
    { q: 'Çoklu şirket desteği var mı?', a: 'Evet. Tüm veriler companyId ile izole edilir ve güvenli erişim sağlanır.' },
    { q: 'Müşteri rolü neleri görür?', a: 'Sadece atandığı saha ve santrallere ait verileri görüntüler.' },
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
    const content = 'Arıza, bakım, üretim takibi ve daha fazlasını tek platformda yönetin. 15 gün ücretsiz deneyin.';
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
      <BrandStrip />
      <Stats />
      <ValueProps />
      <Features />
      <UseCases />
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


