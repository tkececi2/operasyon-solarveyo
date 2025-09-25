import React from 'react';
import { MapPin, Phone, Mail, Clock, MessageSquare, Send } from 'lucide-react';

const ContactScada: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">İletişim</h1>
          <p className="mt-4 text-lg text-gray-600">
            Size nasıl yardımcı olabiliriz? Uzman ekibimiz sorularınızı yanıtlamaya hazır.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="rounded-xl border bg-white p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">İletişim Bilgileri</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Merkez Ofis</p>
                    <p className="text-gray-600">100.Yıl Bulvarı No:12 Kat:3</p>
                    <p className="text-gray-600">Muratpaşa/Antalya</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Telefon</p>
                    <p className="text-gray-600">+90 531 898 41 45</p>
                    <p className="text-sm text-gray-500">Hafta içi 09:00 - 18:00</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">E-posta</p>
                    <p className="text-gray-600">info@solarveyo.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">WhatsApp Business</p>
                    <p className="text-gray-600">+90 531 898 41 45</p>
                    <p className="text-sm text-gray-500">Anlık destek için</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Departmanlar</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="font-medium text-gray-900">Satış</p>
                  <p className="text-sm text-gray-600">Yeni müşteri ve fiyatlandırma</p>
                  <p className="text-sm text-blue-600">info@solarveyo.com</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="font-medium text-gray-900">Teknik Destek</p>
                  <p className="text-sm text-gray-600">Mevcut müşteri desteği</p>
                  <p className="text-sm text-blue-600">info@solarveyo.com</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="font-medium text-gray-900">İş Ortaklığı</p>
                  <p className="text-sm text-gray-600">Partner ve entegrasyon</p>
                  <p className="text-sm text-blue-600">info@solarveyo.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mesaj Gönderin</h2>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adınız
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Adınız"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Soyadınız
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Soyadınız"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="ornek@sirket.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="+90 5XX XXX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konu
                </label>
                <select name="subject" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option>Satış</option>
                  <option>Teknik Destek</option>
                  <option>Demo Talebi</option>
                  <option>İş Ortaklığı</option>
                  <option>Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mesajınız
                </label>
                <textarea
                  name="message"
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Size nasıl yardımcı olabiliriz?"
                />
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" id="kvkk" className="mt-1" />
                <label htmlFor="kvkk" className="text-sm text-gray-600">
                  <a href="/privacy/scada" className="text-blue-600 hover:underline">KVKK Aydınlatma Metni</a>'ni 
                  okudum ve kabul ediyorum.
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  const form = document.querySelector('form') as HTMLFormElement;
                  const formData = new FormData(form);
                  const name = formData.get('name') || '';
                  const subject = formData.get('subject') || 'Genel';
                  const message = formData.get('message') || '';
                  const whatsappMessage = `Merhaba, ben ${name}. Konu: ${subject}. Mesajım: ${message}`;
                  window.open(`https://api.whatsapp.com/send?phone=905318984145&text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                }}
                className="w-full rounded-md bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                WhatsApp ile Gönder
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 p-8 text-white">
          <div className="text-center">
            <Clock className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">Hızlı Demo Talebi</h3>
            <p className="mt-2">15 dakikalık online demo ile platformumuzu keşfedin</p>
            <a 
              href="https://api.whatsapp.com/send?phone=905318984145&text=Merhaba%2C%2015%20dakikal%C4%B1k%20online%20demo%20planlamak%20istiyorum"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 rounded-md bg-white text-blue-600 px-6 py-3 font-medium hover:bg-blue-50"
            >
              Demo Planla
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactScada;
