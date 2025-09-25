import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Zap, Globe, Lightbulb, Target, Heart, Award, TrendingUp, ShieldCheck, CheckCircle, Leaf } from 'lucide-react';

const About: React.FC = () => {
  const values = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Misyonumuz",
      desc: "GES operasyonlarını veriye dayalı, şeffaf ve verimli hale getirmek."
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: "Vizyonumuz",
      desc: "Güneş enerjisi sektöründe dijital dönüşümün öncüsü olmak."
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Değerlerimiz",
      desc: "Şeffaflık, inovasyon, müşteri odaklılık ve sürdürülebilirlik."
    }
  ];

  const stats = [
    { value: "500+", label: "Aktif Saha/Santral" },
    { value: "120+", label: "Kurumsal Müşteri" },
    { value: "98%", label: "Memnuniyet Oranı" },
    { value: "24/7", label: "Destek" }
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Hakkımızda</h1>
          <p className="mt-4 text-gray-700 leading-relaxed text-lg">
            SolarVeyo, güneş enerjisi tesisleri için uçtan uca operasyon yönetim platformudur. 
            Arıza, bakım, üretim takibi, ekip ve stok süreçlerini modern SaaS mimarisi ile 
            tek bir yerde birleştirir.
          </p>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                {value.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{value.title}</h3>
              <p className="mt-2 text-gray-600">{value.desc}</p>
            </div>
          ))}
        </div>
        
        {/* Ekibimiz bölümü kaldırıldı */}

        {/* Neden SolarVeyo? */}
        <div className="mt-24">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900">Neden SolarVeyo?</h2>
            <p className="mt-4 text-gray-600">Kurumsal güvenlik, gerçek zamanlı mimari ve Türkiye'ye uygun süreçlerle.</p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[ 
              { icon: <ShieldCheck className="w-5 h-5" />, title: 'Çoklu-Şirket Güvenliği', desc: 'CompanyId ile tam veri izolasyonu ve audit log' },
              { icon: <Zap className="w-5 h-5" />, title: 'Gerçek Zamanlı', desc: 'Bildirimler ve canlı metrikler ile anlık görünürlük' },
              { icon: <TrendingUp className="w-5 h-5" />, title: 'Ölçeklenebilir', desc: 'Artan saha sayısına göre sorunsuz ölçeklenme' },
              { icon: <Award className="w-5 h-5" />, title: 'Şeffaf Raporlama', desc: 'PDF/Excel ve paylaşılabilir linklerle raporlar' },
              { icon: <Globe className="w-5 h-5" />, title: 'Mobil ve Web', desc: 'Tüm cihazlarda hızlı ve erişilebilir deneyim' },
              { icon: <Users className="w-5 h-5" />, title: 'Ekip Odaklı', desc: 'Rol bazlı yetki ve görev atama' },
            ].map((f, i) => (
              <div key={i} className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">{f.icon}</div>
                <div className="mt-3 font-semibold text-gray-900">{f.title}</div>
                <div className="text-sm text-gray-600">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-24 grid md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-xl border bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="mt-2 text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
        
        <div className="mt-24 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 p-8 md:p-12 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="md:flex items-center gap-8">
              <div className="md:w-1/3 flex justify-center">
                <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">
                  <Award className="w-16 h-16 text-white" />
                </div>
              </div>
              <div className="md:w-2/3 mt-8 md:mt-0">
                <h2 className="text-2xl md:text-3xl font-bold">Sektördeki Yolculuğumuz</h2>
                <p className="mt-4 text-white/90 text-lg">
                  2018'den beri güneş enerjisi sektöründe, yüzlerce saha ve santralda 
                  edindiğimiz bilgi ve tecrübeyi teknolojiyle birleştirerek müşterilerimize 
                  en iyi çözümü sunuyoruz.
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    <span>ISO 27001</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>SOC 2 Tip II</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prensiplerimiz */}
        <div className="mt-24 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">Çalışma Prensiplerimiz</h3>
            <ul className="mt-4 space-y-3 text-gray-700">
              {[
                'Müşteri verisi her zaman izole ve güvende',
                'Performans ilk günden: cache, lazy load, O(1) okumalar',
                'Şeffaflık: ölçülebilir KPI ve raporlama',
                'Saha ekipleri için pratik ve hızlı deneyim',
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 w-5 h-5 text-emerald-600" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center"><Leaf className="w-5 h-5" /></div>
              <h3 className="text-xl font-bold text-gray-900">Sürdürülebilirlik Sözümüz</h3>
            </div>
            <p className="mt-3 text-gray-700">Operasyonel verimlilikle karbon ayak izini azaltmaya katkı sağlıyoruz; ekiplerin daha az yol yapması, daha çok sonuç üretmesi için çalışıyoruz.</p>
          </div>
        </div>

        {/* İletişim CTA */}
        <div className="mt-24">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 p-8 md:p-12 text-white">
            <div className="md:flex items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold">Misyonumuza ortak olun</h3>
                <p className="mt-2 text-white/90">Saha bazlı şeffaf fiyatlandırma ve kurumsal güvenlikle operasyonlarınızı dönüştürelim.</p>
              </div>
              <div className="mt-6 md:mt-0">
                <Link to="/contact" className="rounded-md bg-white text-blue-700 px-6 py-3 text-sm font-medium shadow hover:bg-blue-50">Bizimle İletişime Geçin</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;