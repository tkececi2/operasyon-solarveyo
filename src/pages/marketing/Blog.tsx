import React from 'react';
import { Calendar, User, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Blog: React.FC = () => {
  const posts = [
    { 
      title: 'GES Operasyonlarında Anomali Tespiti', 
      excerpt: 'Üretim verilerindeki sapmaları nasıl yakalarız?',
      date: '15 Mayıs 2023',
      author: 'Ahmet Yılmaz',
      category: 'Teknik'
    },
    { 
      title: 'Bakım Planlamada En İyi Pratikler', 
      excerpt: 'Elektrik ve mekanik bakımda sürdürülebilirlik.',
      date: '28 Nisan 2023',
      author: 'Mehmet Kaya',
      category: 'İş Süreçleri'
    },
    { 
      title: 'Arıza Yönetiminde SLA Optimizasyonu', 
      excerpt: 'Müşteri memnuniyetini artırmak için kritik stratejiler.',
      date: '12 Nisan 2023',
      author: 'Ayşe Demir',
      category: 'Müşteri İlişkileri'
    },
    { 
      title: 'Mobil Uygulamalarla Saha Verimliliği', 
      excerpt: 'Saha ekiplerinin verimliliğini artırmak için mobil teknoloji kullanımı.',
      date: '5 Nisan 2023',
      author: 'Fatma Şahin',
      category: 'Teknoloji'
    },
    { 
      title: 'Veriye Dayalı Karar Verme Süreci', 
      excerpt: 'GES operasyonlarında veri analitiğinin rolü ve uygulamaları.',
      date: '22 Mart 2023',
      author: 'Ahmet Yılmaz',
      category: 'Analitik'
    },
    { 
      title: 'Ekip Yönetimi ve Vardiya Planlama', 
      excerpt: 'Etkili ekip yönetimi için stratejiler ve araçlar.',
      date: '10 Mart 2023',
      author: 'Mehmet Kaya',
      category: 'İnsan Kaynakları'
    }
  ];
  
  const categories = [
    'Tümü',
    'Teknik',
    'İş Süreçleri',
    'Müşteri İlişkileri',
    'Teknoloji',
    'Analitik',
    'İnsan Kaynakları'
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Blog</h1>
          <p className="mt-3 text-gray-600">
            GES sektörüne dair teknik makaleler, iş süreçleri ve en iyi uygulamalar.
          </p>
        </div>
        
        <div className="mt-12">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-2 text-sm rounded-full ${
                  index === 0 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <article key={index} className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{post.category}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-gray-900 line-clamp-2">{post.title}</h3>
              <p className="mt-2 text-sm text-gray-600 line-clamp-3">{post.excerpt}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {post.author}
                </div>
              </div>
              <Link 
                to="#" 
                className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Devamını oku
                <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <button className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50">
            Daha Fazla Makale Yükle
          </button>
        </div>
        
        <div className="mt-16 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900">Bültenimize Abone Olun</h2>
            <p className="mt-2 text-gray-600">
              Yeni makaleler ve sektör gelişmelerinden ilk siz haberdar olun.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="E-posta adresinizi girin"
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
              <button className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700">
                Abone Ol
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Blog;