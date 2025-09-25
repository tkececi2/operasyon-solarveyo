import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Users, Calendar, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this data to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    // Reset form
    setFormData({ name: '', email: '', company: '', message: '' });
  };

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">İletişim</h1>
          <p className="mt-4 text-gray-600">
            Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçin. 
            Ayrıca demo talep edebilir veya satış ekibimizle görüşebilirsiniz.
          </p>
        </div>
        
        <div className="mt-16 grid md:grid-cols-2 gap-12">
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Adınızı ve soyadınızı girin"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="E-posta adresinizi girin"
                />
              </div>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Şirket
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Şirket adınızı girin"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Mesajınız
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Mesajınızı buraya yazın"
                />
              </div>
              
              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 text-white px-6 py-3 text-sm font-medium hover:bg-blue-700"
              >
                Mesaj Gönder
              </button>
            </form>
            
            {submitted && (
              <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-4">
                <p className="text-green-800">
                  Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.
                </p>
              </div>
            )}
          </div>
          
          <div>
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">İletişim Bilgilerimiz</h2>
                <p className="mt-2 text-gray-600">
                  Bize aşağıdaki yollarla ulaşabilir, demo talep edebilir veya satış ekibimizle görüşebilirsiniz.
                </p>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Adres</h3>
                  <p className="mt-1 text-gray-600">
                    100.Yıl Bulvarı No:12 Kat:3<br />
                    Muratpaşa/Antalya
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Telefon</h3>
                  <p className="mt-1 text-gray-600">
                    +90 531 898 41 45
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">E-posta</h3>
                  <p className="mt-1 text-gray-600">
                    info@solarveyo.com
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Çalışma Saatlerimiz</h3>
                  <p className="mt-1 text-gray-600">
                    Pazartesi - Cuma: 09:00 - 18:00<br />
                    Cumartesi: 10:00 - 14:00
                  </p>
                </div>
              </div>
              
              <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-sky-50 p-6">
                <h3 className="font-semibold text-gray-900">Demo Talep Edin</h3>
                <p className="mt-2 text-gray-600 text-sm">
                  Platformumuzu canlı olarak görmek ister misiniz? 
                  Uzman ekibimiz size özel demo sunumu yapabilir.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link 
                    to="/register" 
                    className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm border border-gray-300 hover:bg-gray-50"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Demo Talep Et
                  </Link>
                  <Link 
                    to="/contact" 
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Toplantı Ayarla
                  </Link>
                </div>
              </div>
              
              <div className="rounded-lg border bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
                <h3 className="font-semibold text-gray-900">Satış Ekibiyle Görüşün</h3>
                <p className="mt-2 text-gray-600 text-sm">
                  Kurumsal ihtiyaçlarınız için özelleştirilmiş çözümler hakkında bilgi almak istiyor musunuz?
                </p>
                <Link 
                  to="/contact" 
                  className="mt-4 inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Teklif Al
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;