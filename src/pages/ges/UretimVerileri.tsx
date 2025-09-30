import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, TrendingUp, Sun, Zap, DollarSign, Leaf, Calendar, Download, AlertTriangle, Filter } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Select, LoadingSpinner, Modal, Input } from '../../components/ui';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../../contexts/AuthContext';
import { getProductionData } from '../../services/uretimService';
import { getAllSantraller, getAylikUretim, setAylikUretim } from '../../services/santralService';
import { CO2_FACTOR_KG_PER_KWH } from '../../utils/constants';
import { ProductionChart } from '../../components/charts/ProductionChart';

interface UretimVerisiUI {
  id: string;
  santralId: string;
  santralAdi: string;
  tarih: Date;
  gunlukUretim: number;
  anlikGuc: number;
  performansOrani: number;
  gelir: number;
  dagitimBedeli: number;
  tasarrufEdilenCO2: number;
  hava?: { sicaklik?: number; nem?: number; radyasyon?: number };
}

const UretimVerileri: React.FC = () => {
  const { userProfile, canPerformAction } = useAuth();
  const [selectedSantrals, setSelectedSantrals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [santralMap, setSantralMap] = useState<Record<string, any>>({});
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkYear, setBulkYear] = useState<number>(new Date().getFullYear());
  const [bulkSantralId, setBulkSantralId] = useState<string>('');
  const [bulkMonths, setBulkMonths] = useState<Record<string, number>>({
    ocak: 0, subat: 0, mart: 0, nisan: 0, mayis: 0, haziran: 0,
    temmuz: 0, agustos: 0, eylul: 0, ekim: 0, kasim: 0, aralik: 0,
  });
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [monthlyView, setMonthlyView] = useState<Record<string, number> | null>(null);
  const [veriler, setVeriler] = useState<UretimVerisiUI[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [santralQuery, setSantralQuery] = useState<string>('');

  // Rapor indirme (CSV)
  const handleExportReport = async () => {
    if (!reportRef.current) return;
    try {
      // PDF'e dahil edilmeyecek elemanları gizle
      const toHide = document.querySelectorAll('[data-pdf-exclude="true"]');
      const prevDisplays: string[] = [];
      toHide.forEach((el:any) => { prevDisplays.push(el.style.display); el.style.display = 'none'; });

      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      const namePart = selectedSantrals.length === 1 ? (santralMap[selectedSantrals[0]]?.ad || 'santral') : 'toplam';
      pdf.save(`uretim-raporu-${namePart}-${viewYear}.pdf`);

      // Gizlenenleri geri aç
      toHide.forEach((el:any, i:number) => { el.style.display = prevDisplays[i]; });
    } catch (e:any) {
      console.error('PDF export error', e);
      toast.error('PDF oluşturulurken hata oluştu');
    }
  };

  // Ay sıralaması ve isimleri
  const monthOrder: Array<keyof typeof bulkMonths> = ['ocak','subat','mart','nisan','mayis','haziran','temmuz','agustos','eylul','ekim','kasim','aralik'];
  const monthNames: Record<string,string> = { ocak:'Ocak', subat:'Şubat', mart:'Mart', nisan:'Nisan', mayis:'Mayıs', haziran:'Haziran', temmuz:'Temmuz', agustos:'Ağustos', eylul:'Eylül', ekim:'Ekim', kasim:'Kasım', aralik:'Aralık' };

  // Firestore'dan verileri yükle
  useEffect(() => {
    const load = async () => {
      if (!userProfile?.companyId) return;
      setIsLoading(true);
      try {
        const santraller = await getAllSantraller(
          userProfile.companyId,
          userProfile.rol,
          userProfile.santraller
        );
        const map: Record<string, any> = {};
        santraller.forEach(s => { map[s.id] = s; });
        setSantralMap(map);

        const prod = await getProductionData(userProfile.companyId);
        const ui: UretimVerisiUI[] = prod.map((p: any) => ({
          id: p.id,
          santralId: p.santralId,
          santralAdi: map[p.santralId]?.ad || p.santralId,
          tarih: p.tarih?.toDate ? p.tarih.toDate() : new Date(p.tarih),
          gunlukUretim: p.gunlukUretim || 0,
          anlikGuc: p.anlikGuc || 0,
          performansOrani: p.performansOrani || 0,
          gelir: p.gelir || 0,
          dagitimBedeli: p.dagitimBedeli || 0,
          tasarrufEdilenCO2: p.tasarrufEdilenCO2 || 0,
          hava: p.hava || undefined,
        }));
        setVeriler(ui);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [userProfile?.companyId, userProfile?.rol, userProfile?.santraller]);

  // Aylık görüntüleme verisini getir (tek veya çoklu santral)
  useEffect(() => {
    const loadMonthlyView = async () => {
      if (!selectedSantrals || selectedSantrals.length === 0) { setMonthlyView(null); return; }
      if (selectedSantrals.length === 1) {
        const data = await getAylikUretim(selectedSantrals[0], viewYear);
        setMonthlyView(data?.aylik || null);
        return;
      }
      // Çoklu seçim: aylık değerleri toplayarak birleştir
      const all = await Promise.all(selectedSantrals.map(id => getAylikUretim(id, viewYear)));
      const merged: Record<string, number> = { ocak:0, subat:0, mart:0, nisan:0, mayis:0, haziran:0, temmuz:0, agustos:0, eylul:0, ekim:0, kasim:0, aralik:0 };
      all.forEach(d => {
        const m = d?.aylik || {} as Record<string, number>;
        Object.keys(merged).forEach(k => { merged[k] += Number((m as any)[k] || 0); });
      });
      setMonthlyView(merged);
    };
    loadMonthlyView();
  }, [selectedSantrals, viewYear]);

  const santralOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    Object.values(santralMap).forEach(s => opts.push({ value: (s as any).id, label: (s as any).ad }));
    return opts;
  }, [santralMap]);

  const filteredSantralOptions = useMemo(() => {
    const q = santralQuery.trim().toLowerCase();
    if (!q) return santralOptions;
    return santralOptions.filter(o => o.label.toLowerCase().includes(q));
  }, [santralOptions, santralQuery]);

  const yearOptions = useMemo(() => {
    const nowY = new Date().getFullYear();
    const list: { value: string; label: string }[] = [];
    for (let y = nowY - 5; y <= nowY + 2; y++) list.push({ value: String(y), label: String(y) });
    return list;
  }, []);

  // Filtrelenmiş veriler
  const filteredData = veriler.filter(veri => 
    selectedSantrals.length === 0 || selectedSantrals.includes(veri.santralId)
  );

  // Özet hesaplamalar
  // Aylık/yıllık bazlı hesaplamalar (varsa öncelikli)
  const monthlySum = monthlyView ? Object.values(monthlyView).reduce((t:number,v:any)=> t + (Number(v)||0), 0) : 0;
  const tahminSum = selectedSantrals.length > 0
    ? selectedSantrals.reduce((sum, id) => {
        const t = santralMap[id]?.aylikTahminler ? Object.values(santralMap[id].aylikTahminler).reduce((a:number,b:any)=>a+(Number(b)||0),0) : 0;
        return sum + t;
      }, 0)
    : 0;
  const elektrikFiyati = 0; // Gelir kartı kaldırıldığı için kullanılmıyor

  const toplamUretim = monthlySum > 0
    ? monthlySum
    : filteredData.reduce((sum, veri) => sum + (veri.gunlukUretim || 0), 0);

  const toplamGelir = monthlySum > 0
    ? monthlySum * elektrikFiyati
    : filteredData.reduce((sum, veri) => sum + (veri.gelir || 0), 0);

  const toplamCO2Tasarruf = monthlySum > 0
    ? Math.round(monthlySum * CO2_FACTOR_KG_PER_KWH)
    : filteredData.reduce((sum, veri) => sum + (veri.tasarrufEdilenCO2 || 0), 0);

  const ortalamaPerformans = monthlySum > 0 && tahminSum > 0
    ? Math.round((monthlySum / tahminSum) * 100)
    : (filteredData.length > 0
        ? Math.round(filteredData.reduce((sum, veri) => sum + (veri.performansOrani || 0), 0) / filteredData.length)
        : 0);

  // Aylık ve yıllık kıyas metrikleri
  const now = new Date();
  const activeMonthIndex = viewYear === now.getFullYear() ? now.getMonth() : 0;
  const activeMonthKey = monthOrder[activeMonthIndex];
  const aylikGercek = (monthlyView && (monthlyView as any)[activeMonthKey]) ? Number((monthlyView as any)[activeMonthKey]) : 0;
  const aylikTahmin = selectedSantrals.length > 0
    ? selectedSantrals.reduce((sum, id) => sum + Number(santralMap[id]?.aylikTahminler?.[activeMonthKey] || 0), 0)
    : 0;
  const aylikOran = aylikTahmin > 0 ? Math.round((aylikGercek / aylikTahmin) * 100) : 0;
  const yillikOran = tahminSum > 0 ? Math.round((monthlySum / tahminSum) * 100) : 0;

  // Aylık tablo satırları
  const monthlyRows = selectedSantrals.length > 0
    ? monthOrder.map((k) => {
        const gercek = Number((monthlyView as any)?.[k] || 0);
        const tahmin = selectedSantrals.reduce((sum, id) => sum + Number(santralMap[id]?.aylikTahminler?.[k] || 0), 0);
        const fark = gercek - tahmin;
        const perf = tahmin > 0 ? Math.round((gercek / tahmin) * 100) : null;
        return { key: k, ad: monthNames[k], gercek, tahmin, fark, perf };
      })
    : [];
  const tableTotals = monthlyRows.length
    ? monthlyRows.reduce(
        (acc, r) => ({
          gercek: acc.gercek + r.gercek,
          tahmin: acc.tahmin + r.tahmin,
          fark: acc.fark + r.fark,
        }),
        { gercek: 0, tahmin: 0, fark: 0 }
      )
    : { gercek: 0, tahmin: 0, fark: 0 };

  // Toplu giriş modalı kaydet
  const handleBulkSave = async () => {
    if (!bulkSantralId || !userProfile?.companyId) return;
    const yillikToplam = Object.values(bulkMonths).reduce((t, v) => t + (Number(v) || 0), 0);
    const co2 = yillikToplam * CO2_FACTOR_KG_PER_KWH;
    await setAylikUretim(bulkSantralId, bulkYear, { aylik: bulkMonths as any, yillikToplam, co2TasarrufuKg: co2 });
    setShowBulkModal(false);
    toast.success('Aylık üretim kaydedildi');
    // Eğer şu an bu santral seçili listede ve yıl aynıysa tabloyu yenile
    if (selectedSantrals.includes(bulkSantralId) && viewYear === bulkYear) {
      const data = await getAylikUretim(bulkSantralId, bulkYear);
      if (selectedSantrals.length === 1) {
        setMonthlyView(data?.aylik || null);
      } else {
        // Çoklu seçimde tüm seçili santraller için yeniden birleştir
        const all = await Promise.all(selectedSantrals.map(id => getAylikUretim(id, bulkYear)));
        const merged: Record<string, number> = { ocak:0, subat:0, mart:0, nisan:0, mayis:0, haziran:0, temmuz:0, agustos:0, eylul:0, ekim:0, kasim:0, aralik:0 };
        all.forEach(d => {
          const m = d?.aylik || {} as Record<string, number>;
          Object.keys(merged).forEach(k => { merged[k] += Number((m as any)[k] || 0); });
        });
        setMonthlyView(merged);
      }
    }
  };

  

  // Modal açıkken seçili santral/yıl için varsa kayıtları yükle
  useEffect(() => {
    const loadMonthly = async () => {
      if (!showBulkModal || !bulkSantralId) return;
      const existing = await getAylikUretim(bulkSantralId, bulkYear);
      if (existing?.aylik) {
        setBulkMonths((prev) => ({ ...prev, ...existing.aylik }));
      }
    };
    loadMonthly();
  }, [showBulkModal, bulkSantralId, bulkYear]);

  return (
    <div ref={reportRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" data-pdf-exclude="true">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Üretim Verileri</h1>
          <p className="text-gray-600">Santral üretim performansını takip edin</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Masaüstü */}
          <Button className="hidden sm:inline-flex" variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={handleExportReport}>
            Rapor İndir
          </Button>
          {canPerformAction('uretim_ekle') && (
            <Button className="hidden sm:inline-flex" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowBulkModal(true)}>
              Toplu Aylık Giriş
            </Button>
          )}
          {/* Mobil ikonlar */}
          <div className="flex sm:hidden items-center gap-2">
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={handleExportReport} title="Rapor indir">
              <Download className="w-4 h-4" />
            </Button>
            {canPerformAction('uretim_ekle') && (
              <Button size="sm" className="px-2 py-1 text-xs" onClick={() => setShowBulkModal(true)} title="Toplu Aylık Giriş">
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={()=>setShowMobileFilters(v=>!v)} title="Filtreler">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filtreler - iOS'ta her zaman görünür */}
      <Card>
        <CardContent className={`p-4 md:p-6 ${showMobileFilters ? '' : 'hidden sm:block'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="text-sm font-medium text-gray-700 mb-2">Santral (Çoklu Seçim)</div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2">
                <Input
                  placeholder="Ara..."
                  value={santralQuery}
                  onChange={(e:any) => setSantralQuery(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSelectedSantrals(filteredSantralOptions.map(o => o.value))}
                >
                  Tümünü Seç
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedSantrals([])}
                >
                  Temizle
                </Button>
              </div>
              <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                <div className="flex flex-wrap sm:flex-nowrap sm:overflow-x-auto sm:whitespace-nowrap gap-2">
                  {filteredSantralOptions.length === 0 ? (
                    <div className="text-sm text-gray-500">Sonuç yok</div>
                  ) : (
                    filteredSantralOptions.map(opt => {
                      const selected = selectedSantrals.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSelectedSantrals(prev => {
                              return prev.includes(opt.value)
                                ? prev.filter(v => v !== opt.value)
                                : [...prev, opt.value];
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors inline-block ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500">Seçili: {selectedSantrals.length}</div>
            </div>
            <div className="flex items-end lg:justify-end">
              <div className="w-full lg:w-auto">
                <label className="sr-only">Yıl</label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-28"
                  value={String(viewYear)}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                >
                  {yearOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yıllık Gerçekleşme - Tam genişlik */}
      {selectedSantrals.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm font-semibold text-gray-900">Yıllık Gerçekleşme Oranı</div>
                <div className="text-xs text-gray-600">Tahmine göre üretim performansı</div>
              </div>
              <div className={`text-lg font-bold ${yillikOran>=100?'text-green-600':'text-red-600'}`}>%{yillikOran}</div>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-3 rounded-full ${yillikOran>=100?'bg-green-600':'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, yillikOran))}%` }} />
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm">
              {yillikOran < 100 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-gray-700">Hedefin altında performans</span>
                  <span className="text-gray-400 ml-auto text-xs">Hedef: %100</span>
                </>
              ) : (
                <>
                  <span className="text-green-700">Hedef aşıldı</span>
                  <span className="text-gray-400 ml-auto text-xs">Hedef: %100</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      

      

      {/* Loading */}
      {isLoading && (
        <div className="min-h-[120px] flex items-center justify-center"><LoadingSpinner /></div>
      )}

      {/* Summary Stats - Mobilde özel düzen */}
      <div className="space-y-4">
        {/* İlk satır - Toplam Üretim (tek kart, tam genişlik) */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
              <Sun className="h-12 w-12 text-solar-500 mb-3" />
              <p className="text-2xl md:text-3xl font-bold text-gray-900">
                {toplamUretim.toLocaleString()}
              </p>
              <p className="text-sm md:text-base text-gray-600 mt-1">kWh Toplam Üretim</p>
            </div>
          </CardContent>
        </Card>

        {/* İkinci satır - CO2 ve Performans (2 sütun) */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col items-center text-center">
                <Leaf className="h-10 w-10 text-green-600 mb-2" />
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {toplamCO2Tasarruf.toLocaleString()}
                </p>
                <p className="text-xs md:text-sm text-gray-600">kg CO₂ Tasarruf</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col items-center text-center">
                <TrendingUp className="h-10 w-10 text-blue-500 mb-2" />
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  %{ortalamaPerformans}
                </p>
                <p className="text-xs md:text-sm text-gray-600">Ortalama Performans</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performans Grafikleri (Aylık) */}
      {selectedSantrals.length > 0 && (
        <ProductionChart
          title={`Üretim Analizi - ${viewYear}`}
          data={monthOrder.map((k, idx) => ({
            date: new Date(viewYear, idx, 15).toISOString(),
            production: Number((monthlyView as any)?.[k] || 0),
            target: selectedSantrals.reduce((sum, id) => sum + Number(santralMap[id]?.aylikTahminler?.[k] || 0), 0),
          }))}
          height={320}
        />
      )}

      {/* Aylık Üretim Tablosu */}
      {selectedSantrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{viewYear} Yılı Aylık Üretim Tablosu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-600">Ay</th>
                    <th className="px-4 py-2 text-right text-gray-600">Gerçekleşen (MWh)</th>
                    <th className="px-4 py-2 text-right text-gray-600">Tahmin (MWh)</th>
                    <th className="px-4 py-2 text-right text-gray-600">Fark (MWh)</th>
                    <th className="px-4 py-2 text-right text-gray-600">Performans</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {monthlyRows.map((r) => (
                    <tr key={r.key}>
                      <td className="px-4 py-2">{r.ad}</td>
                      <td className="px-4 py-2 text-right text-gray-900">{(r.gercek/1000).toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                      <td className="px-4 py-2 text-right text-blue-600">{(r.tahmin/1000).toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                      <td className={`px-4 py-2 text-right ${r.fark>=0?'text-green-600':'text-red-600'}`}>{(r.fark/1000).toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                      <td className={`px-4 py-2 text-right ${r.perf!==null && r.perf>=100?'text-green-600':'text-gray-700'}`}>{r.perf!==null?`%${r.perf}`:'Veri Yok'}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-4 py-2">TOPLAM</td>
                    <td className="px-4 py-2 text-right">{(tableTotals.gercek/1000).toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                    <td className="px-4 py-2 text-right">{(tableTotals.tahmin/1000).toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                    <td className={`px-4 py-2 text-right ${tableTotals.fark>=0?'text-green-600':'text-red-600'}`}>{(tableTotals.fark/1000).toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                    <td className="px-4 py-2 text-right">%{yillikOran}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Günlük Üretim Verileri kaldırıldı */}

      {/* Toplu Aylık Giriş Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Toplu Aylık Üretim Girişi"
        size="xl"
      >
        <div className="space-y-6 pb-20 md:pb-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Santral"
              options={[{ value: '', label: 'Seçin...' }, ...santralOptions]}
              value={bulkSantralId}
              onChange={(e) => setBulkSantralId(e.target.value)}
            />
            <Input
              label="Yıl"
              type="number"
              value={bulkYear}
              onChange={(e:any) => setBulkYear(Number(e.target.value) || new Date().getFullYear())}
            />
            <div className="text-sm text-gray-600 flex items-end">Seçili santral: {bulkSantralId ? (santralMap[bulkSantralId]?.ad || '-') : '-'}</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {monthOrder.map((key) => (
              <Input
                key={key}
                label={`${monthNames[key]} (kWh)`}
                type="number"
                value={bulkMonths[key]}
                onChange={(e:any) => setBulkMonths(prev => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
              />
            ))}
          </div>

          {/* Özet ve Tahmin Karşılaştırma */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Yıllık Toplam</div>
                <div className="text-xl font-bold text-gray-900">
                  {Object.values(bulkMonths).reduce((t,v)=>t+(Number(v)||0),0).toLocaleString()} kWh
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">CO₂ Tasarrufu (kg)</div>
                <div className="text-xl font-bold text-green-700">
                  {Math.round(Object.values(bulkMonths).reduce((t,v)=>t+(Number(v)||0),0) * CO2_FACTOR_KG_PER_KWH).toLocaleString()} kg
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">Tahmine Göre Fark</div>
                {bulkSantralId && santralMap[bulkSantralId]?.aylikTahminler ? (
                  (() => {
                    const tahmin = Object.values(santralMap[bulkSantralId].aylikTahminler || {}).reduce((t:number,v:number)=>t+(v||0),0);
                    const gercek = Object.values(bulkMonths).reduce((t,v)=>t+(Number(v)||0),0);
                    const diff = gercek - tahmin;
                    const pct = tahmin>0 ? Math.round((diff/tahmin)*100) : 0;
                    return (
                      <div className={`text-xl font-bold ${diff>=0 ? 'text-green-700' : 'text-red-700'}`}>
                        {diff>=0?'+':''}{diff.toLocaleString()} kWh (%{pct})
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-sm text-gray-500">Seçili santral için tahmin bulunamadı</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={()=>setShowBulkModal(false)}>Kapat</Button>
            <Button onClick={handleBulkSave}>Kaydet</Button>
          </div>
        </div>
      </Modal>

      {/* Eski Performans Grafikleri kaldırıldı */}

      {/* Hava Durumu Etkisi kaldırıldı */}

      {/* Özet Kartları - Mobilde 2 sütun */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 pb-20 md:pb-0">
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">En Yüksek Üretim</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              if (monthlyRows.length > 0) {
                const max = monthlyRows.reduce((m, r) => (r.gercek > m.gercek ? r : m), monthlyRows[0]);
                return (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">{max.gercek.toLocaleString()} kWh</div>
                    <div className="text-sm text-gray-600">{max.ad} ({viewYear})</div>
                  </div>
                );
              }
              if (filteredData.length === 0) return <div className="text-sm text-gray-500">Veri yok</div>;
              const enYuksek = filteredData.reduce((max, veri) => veri.gunlukUretim > max.gunlukUretim ? veri : max);
              return (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {enYuksek.gunlukUretim.toLocaleString()} kWh
                  </div>
                  <div className="text-sm text-gray-600">
                    {enYuksek.santralAdi}
                  </div>
                  <div className="text-xs text-gray-500">
                    {enYuksek.tarih.toLocaleDateString('tr-TR')}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">En Yüksek Performans</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              if (monthlyRows.length > 0) {
                const rowsWithPerf = monthlyRows.filter(r => r.perf !== null) as Array<typeof monthlyRows[number] & { perf: number }>;
                if (rowsWithPerf.length === 0) return <div className="text-sm text-gray-500">Veri yok</div>;
                const best = rowsWithPerf.reduce((m, r:any) => (r.perf > m.perf ? r : m), rowsWithPerf[0]);
                return (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-blue-600">%{best.perf}</div>
                    <div className="text-sm text-gray-600">{best.ad} ({viewYear})</div>
                  </div>
                );
              }
              if (filteredData.length === 0) return <div className="text-sm text-gray-500">Veri yok</div>;
              const enYuksekPerformans = filteredData.reduce((max, veri) => veri.performansOrani > max.performansOrani ? veri : max);
              return (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">
                    %{enYuksekPerformans.performansOrani}
                  </div>
                  <div className="text-sm text-gray-600">
                    {enYuksekPerformans.santralAdi}
                  </div>
                  <div className="text-xs text-gray-500">
                    {enYuksekPerformans.tarih.toLocaleDateString('tr-TR')}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">En Büyük Sapma</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              if (monthlyRows.length > 0) {
                const byAbs = monthlyRows.reduce((m, r) => (Math.abs(r.fark) > Math.abs(m.fark) ? r : m), monthlyRows[0]);
                const pos = byAbs.fark >= 0;
                return (
                  <div className="space-y-2">
                    <div className={`text-2xl font-bold ${pos ? 'text-green-600' : 'text-red-600'}`}>
                      {pos ? '+' : ''}{byAbs.fark.toLocaleString()} kWh
                    </div>
                    <div className="text-sm text-gray-600">{byAbs.ad} ({viewYear})</div>
                    <div className="text-xs text-gray-500">{pos ? 'Hedef üzeri' : 'Hedef altı'}</div>
                  </div>
                );
              }
              return <div className="text-sm text-gray-500">Veri yok</div>;
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UretimVerileri;
