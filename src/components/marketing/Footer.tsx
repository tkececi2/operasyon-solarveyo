import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Mail, Phone, MapPin, Shield, Cpu, Zap } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo ve Açıklama */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <Sun className="h-8 w-8 text-yellow-400 mr-2" />
              <span className="text-2xl font-bold">SolarVeyo</span>
            </div>
            <p className="text-gray-400 mb-4">
              Güneş enerjisi santrallerinizi akıllı ve verimli bir şekilde yönetin. 
              Gerçek zamanlı izleme, arıza takibi ve bakım yönetimi tek platformda.
            </p>
            
            {/* Güvenlik Rozeti */}
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-400">256-bit SSL Güvenlik Sertifikası</span>
            </div>
          </div>

          {/* Ürünler */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ürünler</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  <span>Operasyon Platformu</span>
                </Link>
              </li>
              <li>
                <Link to="/scada" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Cpu className="h-3 w-3" />
                  <span>SCADA Sistemi</span>
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-gray-400 hover:text-white transition-colors">
                  Özellikler
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">
                  Fiyatlandırma
                </Link>
              </li>
            </ul>
          </div>

          {/* Destek & Yasal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Destek & Yasal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  İletişim
                </Link>
              </li>
              <li>
                <Link to="/support/scada" className="text-gray-400 hover:text-white transition-colors">
                  SCADA Destek
                </Link>
              </li>
              <li>
                <Link to="/privacy/scada" className="text-gray-400 hover:text-white transition-colors">
                  Gizlilik / KVKK
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Kullanım Şartları
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* İletişim */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h4 className="text-sm font-semibold mb-3 text-gray-300">İletişim</h4>
              <ul className="space-y-1">
                <li className="flex items-center text-gray-400 text-sm">
                  <Phone className="h-3 w-3 mr-2" />
                  <span>0531 898 41 45</span>
                </li>
                <li className="flex items-center text-gray-400 text-sm">
                  <Mail className="h-3 w-3 mr-2" />
                  <span>info@solarveyo.com</span>
                </li>
                <li className="flex items-center text-gray-400 text-sm">
                  <MapPin className="h-3 w-3 mr-2" />
                  <span>100.Yıl Bulvarı No:12 Kat:3 Muratpaşa/Antalya</span>
                </li>
              </ul>
            </div>
            
            {/* Sosyal Medya */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-300">Bizi Takip Edin</h4>
              <div className="flex items-center gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12c0-3.403 2.759-6.162 6.162-6.162s6.162 2.759 6.162 6.162-2.759 6.162-6.162 6.162-6.162-2.759-6.162-6.162zm12-6.162c0-.796-.646-1.442-1.442-1.442s-1.442.646-1.442 1.442.646 1.442 1.442 1.442 1.442-.646 1.442-1.442z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm mb-2">
            &copy; 2025 SolarVeyo Teknoloji A.Ş. Tüm hakları saklıdır.
          </p>
          <p className="text-gray-500 text-xs">
            Vergi No: 123 456 7890 | Ticaret Sicil No: 987654 | Mersis No: 0123-4567-8900-0001
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
