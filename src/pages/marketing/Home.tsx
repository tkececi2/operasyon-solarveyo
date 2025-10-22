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
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'backdrop-blur-xl bg-white/90 border-b border-gray-200/50 shadow-sm' 
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Logo />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            <Link 
              to="/features" 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
            >
              Özellikler
            </Link>
            <Link 
              to="/pricing" 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
            >
              Fiyatlandırma
            </Link>
            <Link 
              to="/integrations" 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
            >
              Entegrasyonlar
            </Link>
            <Link 
              to="/about" 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
            >
              Hakkında
            </Link>
            <Link 
              to="/contact" 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
            >
              İletişim
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
            >
              Giriş Yap
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Ücretsiz Dene</span>
              <span className="sm:hidden">Dene</span>
            </Link>
          </div>
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
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-blue-50 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-sky-50 to-transparent rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(800px circle at ${spot.x}% ${spot.y}%, rgba(59,130,246,0.06), transparent 70%)`,
          }}
        />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 px-4 py-2 text-xs font-semibold text-gray-700 mb-6 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Kurumsal Güvenlik</span>
              <span className="text-gray-400">•</span>
              <span>KVKK Uyumlu</span>
              <span className="text-gray-400">•</span>
              <span>Multi-Tenant SaaS</span>
            </div>

            {/* Ana Başlık */}
            <motion.h1
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={reveal}
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]"
            >
              <span className="block text-gray-900">GES Operasyonlarınızı</span>
              <span className="block mt-2 bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
                Dijital Dönüşüm
              </span>
            </motion.h1>

            {/* Alt Başlık */}
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={reveal}
              className="mt-6 text-gray-600 text-xl md:text-2xl leading-relaxed font-light"
            >
              Türkiye'nin en gelişmiş güneş enerjisi operasyon platformu ile arıza takibi, bakım yönetimi ve performans raporlamasını tek merkezden yönetin.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={reveal}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link
                to="/register"
                className="group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Ücretsiz Deneyin
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              
              <button
                type="button"
                onClick={onOpenVideo}
                className="inline-flex items-center gap-3 rounded-xl px-8 py-4 text-base font-semibold text-gray-700 hover:text-gray-900 bg-white border-2 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-sky-500 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white ml-0.5" />
                </div>
                Demo İzle
              </button>
            </motion.div>

            {/* Social Proof & Trust Indicators */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={reveal}
              className="mt-12 pt-8 border-t border-gray-200"
            >
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600 mt-1">Aktif Santral</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">99.9%</div>
                  <div className="text-sm text-gray-600 mt-1">Uptime</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600 mt-1">Destek</div>
                </div>
              </div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={reveal}
              className="mt-8 flex flex-wrap items-center gap-4 text-xs text-gray-500"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">SSL Şifreli</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Firebase Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span className="font-medium">ISO 27001 Ready</span>
              </div>
            </motion.div>
          </div>

          {/* Sağ taraf - Dashboard Preview */}
          <div className="relative lg:scale-110" ref={containerRef} onMouseMove={handleMove} onMouseLeave={resetTilt}>
            <div className="absolute -inset-12 bg-gradient-to-tr from-blue-100/40 via-sky-100/40 to-emerald-100/40 rounded-3xl blur-3xl -z-10" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.7 } }}
              viewport={{ once: true, margin: '-80px' }}
              className="relative rounded-3xl border-2 border-gray-200/50 shadow-2xl overflow-hidden bg-white backdrop-blur"
              style={{ 
                transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, 
                transition: 'transform .08s ease' 
              }}
            >
              {/* Browser Chrome */}
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex items-center justify-between">
                <div className="flex gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-green-600 transition-colors"></div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700 font-medium">app.solarveyo.com</span>
                </div>
                <div className="w-16"></div>
              </div>

              {/* Dashboard Screenshot - Ana Dashboard */}
              <div className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50">
                <img
                  src="/screenshots/saha-dashboard.png"
                  alt="SolarVeyo Ana Dashboard - Saha ve Santral Yönetimi"
                  className="w-full h-auto"
                  loading="eager"
                  onError={(e) => {
                    // Fallback olarak arıza sayfasını göster
                    (e.target as HTMLImageElement).src = encodeURI('/screenshots/arızasayfası.png');
                  }}
                />
              </div>
            </motion.div>

            {/* Floating Stats Cards - Daha Büyük */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              viewport={{ once: true }}
              className="absolute -left-8 top-1/4 hidden xl:block"
            >
              <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Arıza Çözüm Süresi</div>
                    <div className="text-3xl font-extrabold text-gray-900">-35%</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              viewport={{ once: true }}
              className="absolute -right-8 bottom-1/4 hidden xl:block"
            >
              <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Operasyonel Verimlilik</div>
                    <div className="text-3xl font-extrabold text-gray-900">+45%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SectorFit: React.FC = () => (
  <section className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-50">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={reveal}
          className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 mb-6"
        >
          <Award className="w-4 h-4" />
          Sektör Lideri Çözümler
        </motion.div>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={reveal}
          className="text-4xl md:text-5xl font-extrabold text-gray-900"
        >
          Neden <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">SolarVeyo</span>?
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={reveal}
          className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto font-light"
        >
          GES sektörüne özel geliştirilmiş, binlerce kullanıcı tarafından test edilmiş ve güvenilen profesyonel çözümler
        </motion.p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          variants={reveal} 
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-sky-500 rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-all duration-500" />
          <div className="relative rounded-3xl border border-gray-200 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-sky-500 rounded-2xl blur-md opacity-30"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Gerçek Zamanlı İzleme</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Tüm santrallerinizi tek bir merkezden izleyin. Anlık performans metrikleri ve proaktif arıza bildirimleri ile her zaman kontrol sizde.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">7/24 Canlı Durum Takibi</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Akıllı Uyarı Sistemi</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">iOS & Android Mobil Uygulama</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: '-60px' }} 
          variants={reveal} 
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-all duration-500" />
          <div className="relative rounded-3xl border border-gray-200 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl blur-md opacity-30"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-500 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Akıllı Veri Analizi</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Yapay zeka destekli analizler ve otomatik raporlama ile operasyonel verimliliğinizi maksimize edin, maliyetleri optimize edin.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Otomatik PDF/Excel Raporlama</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Performans & KPI Dashboard</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Tahmine Dayalı Bakım Önerileri</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: '-60px' }} 
          variants={reveal} 
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-all duration-500" />
          <div className="relative rounded-3xl border border-gray-200 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-md opacity-30"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Kurumsal Güvenlik</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Bankacılık düzeyinde güvenlik altyapısı. Verileriniz ISO 27001 standartlarında şifrelenir ve çoklu katmanlı koruma ile güvende tutulur.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50/50 hover:bg-purple-50 transition-colors">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Rol Tabanlı Erişim Kontrolü (RBAC)</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50/50 hover:bg-purple-50 transition-colors">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">256-bit SSL/TLS Şifreleme</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50/50 hover:bg-purple-50 transition-colors">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">KVKK ve GDPR Uyumlu</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Alt Bilgi Şeridi */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={reveal}
        className="mt-16 text-center"
      >
        <div className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-gray-100 via-white to-gray-100 border border-gray-200 px-6 py-4 shadow-md">
          <Star className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-semibold text-gray-900">
            500+ Aktif Santral • 99.9% Uptime • 4.9/5 Müşteri Memnuniyeti
          </span>
        </div>
      </motion.div>
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
    <section className="py-24 md:py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
      {/* Animasyonlu arka plan */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-60"></div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={reveal}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm font-semibold text-white mb-6">
              <TrendingUp className="w-4 h-4" />
              Gerçek Rakamlar, Gerçek Sonuçlar
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Sektörde <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Lider Performans</span>
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto font-light">
              Binlerce şirket güveniyor, milyonlarca işlem başarıyla tamamlanıyor
            </p>
          </motion.div>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }} 
            variants={reveal} 
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-500/30 mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="text-5xl md:text-6xl font-extrabold text-white mb-2">{uptime.toFixed(1)}%</div>
              <div className="text-lg text-white/90 font-semibold mb-1">Sistem Uptime</div>
              <div className="text-sm text-white/60">7/24 kesintisiz hizmet garantisi</div>
            </div>
          </motion.div>
          
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: '-60px' }} 
            variants={reveal} 
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-sky-500/20 border border-sky-500/30 mb-4">
                <Clock className="w-7 h-7 text-sky-400" />
              </div>
              <div className="text-5xl md:text-6xl font-extrabold text-white mb-2">-{Math.round(mttr)}%</div>
              <div className="text-lg text-white/90 font-semibold mb-1">Daha Hızlı Çözüm</div>
              <div className="text-sm text-white/60">Arıza müdahale süresinde iyileşme</div>
            </div>
          </motion.div>
          
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: '-60px' }} 
            variants={reveal} 
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-500/30 mb-4">
                <Star className="w-7 h-7 text-amber-400" />
              </div>
              <div className="text-5xl md:text-6xl font-extrabold text-white mb-2">{satisfaction.toFixed(1)}<span className="text-3xl text-white/80">/5</span></div>
              <div className="text-lg text-white/90 font-semibold mb-1">Müşteri Memnuniyeti</div>
              <div className="text-sm text-white/60">1,200+ kullanıcı değerlendirmesi</div>
            </div>
          </motion.div>
          
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: '-60px' }} 
            variants={reveal} 
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-500/20 border border-purple-500/30 mb-4">
                <Bell className="w-7 h-7 text-purple-400" />
              </div>
              <div className="text-5xl md:text-6xl font-extrabold text-white mb-2">{alerts.toFixed(1)}%</div>
              <div className="text-lg text-white/90 font-semibold mb-1">Anlık Bildirim</div>
              <div className="text-sm text-white/60">Gerçek zamanlı uyarı başarı oranı</div>
            </div>
          </motion.div>
        </div>

        {/* Alt bilgi */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={reveal}
          className="mt-16 text-center"
        >
          <p className="text-white/60 text-sm">
            * Rakamlar son 12 aylık dönem ortalamalarıdır ve düzenli olarak güncellenmektedir.
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
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
    { 
      name: 'Ahmet Yılmaz', 
      role: 'Operasyon Müdürü', 
      company: 'SolarTech Energy',
      quote: 'SolarVeyo sayesinde arıza çözüm süremizi %40 kısalttık. Müşterilerimize anlık durum güncellemesi yapabiliyoruz, bu da güven tazeliyor.',
      avatar: '👨‍💼'
    },
    { 
      name: 'Elif Demir', 
      role: 'Bakım Koordinatörü', 
      company: 'GreenPower GES',
      quote: 'Vardiya devir teslim ve bakım planlama modülü iş süreçlerimizi standardize etti. Artık hiçbir detay atlanmıyor.',
      avatar: '👩‍💼'
    },
    { 
      name: 'Mehmet Kaya', 
      role: 'Saha Mühendisi', 
      company: 'Enerji Solar A.Ş.',
      quote: 'Mobil uygulamadan fotoğraf ve koordinat ekleyerek arıza bildirimi yapmak işimizi inanılmaz kolaylaştırdı. Saha ekibi olarak verimlilik %50 arttı.',
      avatar: '👷‍♂️'
    },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);
  
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Dekoratif background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={reveal}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 mb-6">
              <Star className="w-4 h-4" />
              Müşteri Yorumları
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Kullanıcılarımız <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Ne Diyor?</span>
            </h2>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Binlerce operasyon profesyoneli SolarVeyo ile daha verimli çalışıyor
            </p>
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={reveal}
          className="max-w-5xl mx-auto"
        >
          <div className="relative rounded-3xl border-2 border-gray-200 bg-white shadow-2xl overflow-hidden">
            {/* Ana içerik */}
            <div className="relative min-h-[280px] sm:min-h-[320px]">
              {items.map((testimonial, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-all duration-700 ${
                    i === idx 
                      ? 'opacity-100 translate-x-0' 
                      : i > idx 
                        ? 'opacity-0 -translate-x-full' 
                        : 'opacity-0 translate-x-full'
                  }`}
                >
                  <div className="p-8 sm:p-12">
                    {/* Quote icon */}
                    <div className="mb-6">
                      <svg className="w-12 h-12 text-blue-200" fill="currentColor" viewBox="0 0 32 32">
                        <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                      </svg>
                    </div>

                    {/* Quote text */}
                    <p className="text-xl sm:text-2xl text-gray-700 leading-relaxed mb-8 font-light italic">
                      "{testimonial.quote}"
                    </p>

                    {/* Author info */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-2xl shadow-lg">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                        <div className="text-sm text-blue-600 font-medium">{testimonial.company}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation dots */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setI(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    i === idx 
                      ? 'w-8 h-3 bg-blue-600' 
                      : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Yorum ${idx + 1}'e git`}
                />
              ))}
            </div>
          </div>

          {/* Alt bilgi */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">4.9/5</div>
              <div className="text-sm text-gray-600 mt-1">Ortalama Puan</div>
              <div className="flex gap-1 mt-2 justify-center">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
            <div>
              <div className="text-3xl font-bold text-gray-900">500+</div>
              <div className="text-sm text-gray-600 mt-1">Mutlu Müşteri</div>
            </div>
            <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
            <div>
              <div className="text-3xl font-bold text-gray-900">1,200+</div>
              <div className="text-sm text-gray-600 mt-1">Kullanıcı</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};


const FAQ: React.FC = () => {
  const faqs = [
    { q: 'Ücretsiz kullanım nasıl çalışır?', a: 'Herhangi bir ödeme bilgisi gerekmeden platformu kullanmaya başlayabilirsiniz. İlerleyen dönemde premium özellikleri tercih edebilirsiniz.' },
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
    <section className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-sky-500 to-emerald-500"></div>
      
      {/* Arka plan pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </div>

      {/* Dekoratif elementler */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-sm font-semibold text-white mb-6">
              <Zap className="w-4 h-4" />
              Bugün Başlayın, Hemen Sonuç Alın
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6">
              Dijital Dönüşümünüze
              <br />
              <span className="bg-gradient-to-r from-yellow-200 to-emerald-200 bg-clip-text text-transparent">
                Hemen Başlayın
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto font-light leading-relaxed">
              14 gün ücretsiz deneme. Kredi kartı gerekmez. Kurulum ve eğitim dahil. İptal garantisi.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link 
            to="/register" 
            className="group relative inline-flex items-center justify-center rounded-xl bg-white px-8 py-5 text-lg font-bold text-blue-700 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 w-full sm:w-auto"
          >
            <span className="flex items-center gap-3">
              <Zap className="w-5 h-5" />
              Ücretsiz Deneyin
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          
          <a 
            href="https://api.whatsapp.com/send?phone=905318984145&text=Merhaba%2C%20SolarVeyo%20sat%C4%B1%C5%9F%20ekibiyle%20g%C3%B6r%C3%BC%C5%9Fmek%20istiyorum"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/30 px-8 py-5 text-lg font-bold text-white hover:bg-white/20 transition-all duration-300 w-full sm:w-auto"
          >
            <MessageSquare className="w-5 h-5" />
            Satış Ekibiyle Görüş
          </a>
        </motion.div>

        {/* Güven göstergeleri */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <div className="text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">Kredi Kartı Yok</span>
            </div>
            <p className="text-xs text-white/70">Hiçbir ödeme bilgisi gerekmez</p>
          </div>
          <div className="text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-semibold">5 Dakikada Hazır</span>
            </div>
            <p className="text-xs text-white/70">Anında kullanmaya başlayın</p>
          </div>
          <div className="text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-semibold">Ücretsiz Eğitim</span>
            </div>
            <p className="text-xs text-white/70">Ekibiniz için onboarding</p>
          </div>
          <div className="text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-semibold">İptal Garantisi</span>
            </div>
            <p className="text-xs text-white/70">İstediğiniz zaman iptal edin</p>
          </div>
        </motion.div>

        {/* Alt bilgi */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center text-white/80 text-sm"
        >
          <p>500+ şirket SolarVeyo ile operasyonlarını yönetiyor. Siz de katılın.</p>
        </motion.div>
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

// Ürünler Bölümü - Operasyon ve SCADA - Premium Tasarım
const ProductsShowcase: React.FC = () => {
  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      {/* Arka plan dekoratif elementler */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Başlık Bölümü */}
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          variants={reveal}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-emerald-100 px-4 py-2 text-sm font-medium text-gray-700 mb-6">
            <Star className="w-4 h-4 text-amber-500" />
            Profesyonel Çözümler
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
              İki Güçlü Uygulama
            </span>
            <br />
            <span className="text-gray-900">Tek Platform</span>
          </h2>
          <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            İhtiyacınıza göre operasyon yönetimi veya SCADA izleme çözümlerini kullanın. 
            <strong className="text-gray-900"> Hem ayrı hem birlikte çalışabilir.</strong>
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
          {/* Solarveyo Operasyon - Premium Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }} 
            className="relative group"
          >
            {/* Glow efekt */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 rounded-3xl blur-2xl opacity-25 group-hover:opacity-40 transition-all duration-500 animate-gradient-x"></div>
            
            {/* Ana Kart */}
            <div className="relative rounded-3xl border border-gray-200 bg-white p-8 md:p-10 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden group-hover:scale-[1.02]">
              {/* Üst köşe badge */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                ÜCRETSİZ DENE
              </div>

              {/* Başlık ve Icon */}
              <div className="flex items-start gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl blur-md opacity-50"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg">
                    <Wrench className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Solarveyo Operasyon</h3>
                  <p className="text-sm text-blue-600 font-semibold">Arıza & Operasyon Yönetimi</p>
                </div>
              </div>
              
              <p className="text-gray-700 text-base leading-relaxed mb-8">
                Arıza takibi, bakım planlama, ekip yönetimi, stok kontrolü ve vardiya bildirimleri için kapsamlı çözüm. 
                <strong className="text-gray-900"> Operasyonel mükemmelliğe giden yol.</strong>
              </p>

              {/* Özellikler Grid */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-transparent hover:from-blue-100 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Arıza Yönetimi</div>
                    <div className="text-sm text-gray-600">Fotoğraflı raporlama, SLA takibi, otomatik atama</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-sky-50 to-transparent hover:from-sky-100 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Bakım & Vardiya</div>
                    <div className="text-sm text-gray-600">Planlama, iş emirleri, kontrol listeleri, devir teslim</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-transparent hover:from-blue-100 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Ekip & Stok</div>
                    <div className="text-sm text-gray-600">Personel yönetimi, envanter takibi, kritik stok uyarıları</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-sky-50 to-transparent hover:from-sky-100 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Müşteri Portalı</div>
                    <div className="text-sm text-gray-600">Şeffaf raporlama, PDF export, bilgilendirme</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">13+</div>
                  <div className="text-xs text-gray-600">Modül</div>
                </div>
                <div className="text-center border-x border-gray-200">
                  <div className="text-2xl font-bold text-blue-600">7/24</div>
                  <div className="text-xs text-gray-600">Destek</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">%99.9</div>
                  <div className="text-xs text-gray-600">Uptime</div>
                </div>
              </div>

              {/* CTA Butonları */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/register"
                  className="group/btn flex-1 relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white px-6 py-3.5 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    🎉 Ücretsiz Kullan
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  to="/features"
                  className="flex-1 inline-flex items-center justify-center rounded-xl border-2 border-blue-600 text-blue-600 px-6 py-3.5 text-sm font-semibold hover:bg-blue-50 transition-all duration-300"
                >
                  Detaylı Bilgi
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Solarveyo SCADA - Premium Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }} 
            className="relative group"
          >
            {/* Glow efekt */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 rounded-3xl blur-2xl opacity-25 group-hover:opacity-40 transition-all duration-500 animate-gradient-x"></div>
            
            {/* Ana Kart */}
            <div className="relative rounded-3xl border border-gray-200 bg-white p-8 md:p-10 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden group-hover:scale-[1.02]">
              {/* Üst köşe badge */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                KURUMSAL
              </div>

              {/* Başlık ve Icon */}
              <div className="flex items-start gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-green-500 rounded-2xl blur-md opacity-50"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-500 flex items-center justify-center shadow-lg">
                    <LineChart className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Solarveyo SCADA</h3>
                  <p className="text-sm text-emerald-600 font-semibold">Gerçek Zamanlı İzleme & Telemetri</p>
                </div>
              </div>
              
              <p className="text-gray-700 text-base leading-relaxed mb-8">
                İnverter, dizi, sayaç ve sensör verilerini canlı izleyin. Sapmaları anında yakalayın, performansı optimize edin. 
                <strong className="text-gray-900"> Her saniye sayar.</strong>
              </p>

              {/* Özellikler Grid */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-transparent hover:from-emerald-100 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Gerçek Zamanlı Telemetri</div>
                    <div className="text-sm text-gray-600">Modbus/TCP, MQTT, REST API entegrasyonu</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-green-50 to-transparent hover:from-green-100 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Akıllı Alarmlar</div>
                    <div className="text-sm text-gray-600">Eşik, trend ve sapma takibi, tahmine dayalı bakım</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-transparent hover:from-emerald-100 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Multi-Vendor Destek</div>
                    <div className="text-sm text-gray-600">SANGROW, Huawei, SMA, Fronius ve daha fazlası</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-green-50 to-transparent hover:from-green-100 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Hibrit Mimari</div>
                    <div className="text-sm text-gray-600">Bulut + On-Prem kurulum, edge computing desteği</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">&lt;1s</div>
                  <div className="text-xs text-gray-600">Latency</div>
                </div>
                <div className="text-center border-x border-gray-200">
                  <div className="text-2xl font-bold text-emerald-600">1000+</div>
                  <div className="text-xs text-gray-600">Cihaz</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">100%</div>
                  <div className="text-xs text-gray-600">Güvenli</div>
                </div>
              </div>

              {/* CTA Butonları */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/scada"
                  className="group/btn flex-1 relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white px-6 py-3.5 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    📊 Detaylı İncele
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  to="/contact"
                  className="flex-1 inline-flex items-center justify-center rounded-xl border-2 border-emerald-600 text-emerald-600 px-6 py-3.5 text-sm font-semibold hover:bg-emerald-50 transition-all duration-300"
                >
                  Demo Talep Et
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Alt Bilgi - Geliştirilmiş */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-gray-100 via-white to-gray-100 border border-gray-200 px-6 py-4 shadow-md">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-900">Multi-Tenant Kurumsal Güvenlik</div>
              <div className="text-xs text-gray-600">Her iki uygulama da RBAC, şirket izolasyonu ve KVKK uyumlu</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CSS Animasyonları */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
          background-size: 200% 200%;
        }
        .bg-size-200 {
          background-size: 200% 100%;
        }
        .bg-pos-0 {
          background-position: 0% 50%;
        }
        .bg-pos-100 {
          background-position: 100% 50%;
        }
      `}</style>
    </section>
  );
};

const Home: React.FC = () => {
  const [showVideo, setShowVideo] = useState(false);
  useEffect(() => {
    document.title = 'SolarVeyo — Güneş Enerjisi Yönetim Platformu';
    const meta = document.querySelector('meta[name="description"]');
    const content = 'Arıza takibi, bakım, vardiya kontrolü ve şeffaf müşteri hizmetini tek platformda yönetin. Ücretsiz kullanmaya başlayın.';
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
      <ProductsShowcase />
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