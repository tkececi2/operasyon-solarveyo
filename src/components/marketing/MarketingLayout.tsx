import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import Logo from '../ui/Logo';

export const MarketingHeader: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  // Koyu tema devre dışı
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Her zaman açık tema
    const root = document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  

  return (
    <nav className={`sticky top-0 z-40 transition-colors ${scrolled ? 'backdrop-blur bg-white/80 border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-800' : 'bg-transparent'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/"><Logo compact={false} /></Link>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link to="/features" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">Özellikler</Link>
          <Link to="/pricing" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">Fiyatlandırma</Link>
          <Link to="/integrations" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">Entegrasyonlar</Link>
          <Link to="/scada" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">SCADA</Link>
          <Link to="/about" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">Hakkında</Link>
          <Link to="/contact" className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">İletişim</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-700 hover:text-gray-900">Giriş Yap</Link>
          <Link to="/register" className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700">Ücretsiz Deneyin</Link>
        </div>
      </div>
    </nav>
  );
};

export const MarketingFooter: React.FC = () => {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/"><Logo compact={false} /></Link>
          <span className="ml-2">© {new Date().getFullYear()} SolarVeyo</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/about" className="hover:text-gray-900">Hakkında</Link>
          <Link to="/contact" className="hover:text-gray-900">İletişim</Link>
          <Link to="/support/scada" className="hover:text-gray-900">SCADA Destek</Link>
          <Link to="/privacy/scada" className="hover:text-gray-900">Gizlilik</Link>
          <Link to="/terms" className="hover:text-gray-900">Şartlar</Link>
        </div>
      </div>
    </footer>
  );
};

export const MarketingLayout: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MarketingHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
};

export default MarketingLayout;