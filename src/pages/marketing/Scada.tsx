import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, LineChart, Radio, Server, Cpu, ArrowRight } from 'lucide-react';

const Scada: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                SCADA • Gerçek Zamanlı İzleme
              </div>
              <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                SolarVeyo SCADA ile portföyünüzü canlı izleyin
              </h1>
              <p className="mt-4 text-gray-700 text-base md:text-lg leading-relaxed">
                İnverter, dizi, sayaç ve sensör verilerini tek ekranda toplayın; sapmaları anında yakalayın, 
                bakım ekiplerini harekete geçirin.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/contact" className="rounded-md bg-blue-600 text-white px-6 py-3 text-sm font-medium hover:bg-blue-700">Demo Talep Et</Link>
                <a href="https://solarveyo.com/scada" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-700 hover:text-blue-800 text-sm font-medium">
                  Web sitesinde gör <ArrowRight className="ml-1 w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2"><Radio className="w-5 h-5"/></div>
                    <div className="text-sm font-semibold text-gray-900">Gerçek Zamanlı Telemetri</div>
                    <div className="text-xs text-gray-600">Modbus/TCP, MQTT, REST</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2"><LineChart className="w-5 h-5"/></div>
                    <div className="text-sm font-semibold text-gray-900">Analitik & Alarmlar</div>
                    <div className="text-xs text-gray-600">Eşik, trend ve sapma takibi</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2"><Zap className="w-5 h-5"/></div>
                    <div className="text-sm font-semibold text-gray-900">Kesinti & Arıza Uyarıları</div>
                    <div className="text-xs text-gray-600">SMS/Email/WhatsApp entegrasyonları</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2"><Server className="w-5 h-5"/></div>
                    <div className="text-sm font-semibold text-gray-900">Bulut + On-Prem</div>
                    <div className="text-xs text-gray-600">Hibrit kurulum, veri güvenliği</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border bg-white p-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2"><Cpu className="w-5 h-5"/></div>
              <div className="text-base font-semibold text-gray-900">Cihaz Esnekliği</div>
              <div className="text-sm text-gray-600 mt-1">SANGROW, Huawei, SMA ve çok daha fazlası</div>
            </div>
            <div className="rounded-xl border bg-white p-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2"><ShieldCheck className="w-5 h-5"/></div>
              <div className="text-base font-semibold text-gray-900">Güvenlik</div>
              <div className="text-sm text-gray-600 mt-1">RBAC, şirket izolasyonu, KVKK uyumu</div>
            </div>
            <div className="rounded-xl border bg-white p-6">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2"><Zap className="w-5 h-5"/></div>
              <div className="text-base font-semibold text-gray-900">Yüksek Uptime</div>
              <div className="text-sm text-gray-600 mt-1">Otomatik yeniden bağlanma, tamponlama</div>
            </div>
          </div>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link to="/support/scada" className="rounded-md border border-blue-200 text-blue-700 px-5 py-2.5 text-sm font-medium hover:bg-blue-50">SCADA Destek</Link>
            <Link to="/privacy/scada" className="rounded-md border border-gray-200 text-gray-700 px-5 py-2.5 text-sm hover:bg-gray-50">Gizlilik</Link>
            <Link to="/terms" className="rounded-md border border-gray-200 text-gray-700 px-5 py-2.5 text-sm hover:bg-gray-50">Şartlar</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Scada;


