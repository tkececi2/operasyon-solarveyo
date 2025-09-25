import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Package, Search, Download, FileText, MapPin, Building2, Edit, Trash2, List as ListIcon, Grid3X3, Sun, Zap, Gauge, Boxes, Filter, Plus } from 'lucide-react';
import { Button, Card, CardContent, Input, Select, LoadingSpinner, Modal } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { envanterService } from '../../services/envanterService';
import type { Envanter } from '../../types';
import { getAllSahalar } from '../../services/sahaService';
import { getAllSantraller } from '../../services/santralService';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { exportToExcel } from '../../utils/exportUtils';
import { formatDate } from '../../utils/formatters';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Timestamp } from 'firebase/firestore';
import { uploadFile } from '../../services/storageService';

const kategoriOptions = [
  { value: 'all', label: 'Tüm Kategoriler' },
  { value: 'panel', label: 'Panel' },
  { value: 'inverter', label: 'İnverter' },
  { value: 'trafo', label: 'Trafo' },
  { value: 'ac-pano', label: 'AC Pano' },
  { value: 'dc-pano', label: 'DC Pano' },
  { value: 'sayac', label: 'Sayaç' },
  { value: 'kablo', label: 'Kablo' },
  { value: 'montaj', label: 'Montaj' },
  { value: 'diger', label: 'Diğer' },
];

const EnvanterPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Envanter[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [kategori, setKategori] = useState<string>('all');
  const [sahaId, setSahaId] = useState<string>('all');
  const [santralFilter, setSantralFilter] = useState<string>('all');
  const [sahaOptions, setSahaOptions] = useState<{ value: string; label: string }[]>([]);
  const [santralMap, setSantralMap] = useState<Record<string, { id: string; ad: string }>>({});
  const [santralOptions, setSantralOptions] = useState<{ value: string; label: string; sahaId?: string }[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<Envanter | null>(null);
  const [viewing, setViewing] = useState<Envanter | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const canManage = (userProfile?.rol || '') !== 'musteri';

  const load = async () => {
    if (!userProfile?.companyId) return;
    try {
      setLoading(true);
      const res = await envanterService.getEnvanterler({
        companyId: userProfile.companyId,
        kategori: kategori === 'all' ? undefined : kategori,
        sahaId: sahaId === 'all' ? undefined : sahaId,
        santralId: santralFilter === 'all' ? undefined : santralFilter,
        searchTerm,
        userRole: userProfile.rol,
        userSahalar: userProfile.sahalar as any,
        userSantraller: userProfile.santraller as any,
      });
      setItems(res.items);
    } catch (e) {
      console.error(e);
      toast.error('Envanter yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.companyId, kategori, sahaId, santralFilter]);

  useEffect(() => {
    const init = async () => {
      if (!userProfile?.companyId) return;
      try {
        const sahas = await getAllSahalar(
          userProfile.companyId,
          userProfile.rol,
          userProfile.sahalar
        );
        setSahaOptions([{ value: 'all', label: 'Tüm Sahalar' }, ...sahas.map(s => ({ value: s.id, label: s.ad }))]);
        const santrals = await getAllSantraller(
          userProfile.companyId,
          userProfile.rol,
          userProfile.santraller
        );
        const sm: Record<string, { id: string; ad: string }> = {};
        santrals.forEach(s => { sm[s.id] = { id: s.id, ad: s.ad }; });
        setSantralMap(sm);
        setSantralOptions(santrals.map((s:any) => ({ value: s.id, label: s.ad, sahaId: s.sahaId })) as any);
      } catch {}
    };
    init();
  }, [userProfile?.companyId]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return items.filter(i =>
      (!term || (i.marka || '').toLowerCase().includes(term) || (i.model || '').toLowerCase().includes(term) || (i.seriNo || '').toLowerCase().includes(term))
    );
  }, [items, searchTerm]);

  const remainingDays = (ts?: any) => {
    try {
      if (!ts || !ts.toDate) return undefined;
      const end = ts.toDate() as Date;
      const now = new Date();
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    } catch { return undefined; }
  };

  const KategoriBadge: React.FC<{cat: string}> = ({ cat }) => {
    const common = 'text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 inline-flex items-center gap-1';
    const lower = (cat || '').toLowerCase();
    if (lower === 'panel') return <span className={common}><Sun className="w-3.5 h-3.5"/>panel</span>;
    if (lower === 'inverter' || lower === 'invertor') return <span className={common}><Zap className="w-3.5 h-3.5"/>inverter</span>;
    if (lower === 'trafo') return <span className={common}><Gauge className="w-3.5 h-3.5"/>trafo</span>;
    if (lower.includes('pano')) return <span className={common}><Boxes className="w-3.5 h-3.5"/>{cat}</span>;
    if (lower === 'sayac' || lower === 'sayaç') return <span className={common}><Gauge className="w-3.5 h-3.5"/>sayaç</span>;
    return <span className={common}>{cat}</span>;
  };

  const handlePdf = async () => {
    if (!contentRef.current) return;
    const loadingToast = toast.loading('PDF oluşturuluyor...');
    const toHide = document.querySelectorAll('[data-pdf-exclude="true"]') as NodeListOf<HTMLElement>;
    const prev: string[] = [];
    toHide.forEach(el => { prev.push(el.style.display); el.style.display = 'none'; });
    const header = document.createElement('div');
    header.setAttribute('data-pdf-temp', 'true');
    header.style.textAlign = 'center';
    header.style.margin = '12px 0 16px 0';
    header.innerHTML = `<div style=\"font-size:20px;font-weight:700;color:#111827;\">Envanter Raporu</div><div style=\"font-size:12px;color:#374151;\">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>`;
    contentRef.current.insertBefore(header, contentRef.current.firstChild);
    try {
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: contentRef.current.scrollWidth, windowHeight: contentRef.current.scrollHeight });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', margin, 10, imgWidth, imgHeight);
      let heightLeft = imgHeight - (pdfHeight - 10);
      while (heightLeft > 0) {
        const position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`envanter-raporu-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF indirildi');
    } catch (e) {
      console.error(e);
      toast.error('PDF oluşturulamadı');
    } finally {
      const temp = contentRef.current?.querySelector('[data-pdf-temp="true"]');
      if (temp && temp.parentElement) temp.parentElement.removeChild(temp);
      toHide.forEach((el, i) => { el.style.display = prev[i]; });
      toast.dismiss(loadingToast);
    }
  };

  const handleExcel = () => {
    try {
      const rows = filtered.map(i => ({
        Kategori: i.kategori,
        Marka: i.marka || '-',
        Model: i.model || '-',
        SeriNo: i.seriNo || '-',
        Saha: sahaOptions.find(s => s.value === i.sahaId)?.label || '-',
        Santral: i.santralId ? (santralMap[i.santralId]?.ad || '-') : '-',
        Durum: i.durum,
        Kurulum: i.kurulumTarihi ? formatDate(i.kurulumTarihi.toDate()) : '-',
        GarantiBitis: i.garantiBitis ? formatDate(i.garantiBitis.toDate()) : '-',
      }));
      exportToExcel(rows, 'envanter-raporu');
      toast.success('Excel indirildi');
    } catch (e) {
      console.error(e);
      toast.error('Excel indirilemedi');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center"><LoadingSpinner /></div>
    );
  }

  return (
    <div className="space-y-6" ref={contentRef}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6"/>Envanter</h1>
        <div className="flex gap-2 items-center" data-pdf-exclude="true">
          <div className="hidden md:flex rounded-md overflow-hidden border">
            <button className={`px-3 py-2 text-sm ${viewMode==='list'?'bg-gray-100 font-medium':''}`} onClick={()=>setViewMode('list')}><ListIcon className="w-4 h-4"/></button>
            <button className={`px-3 py-2 text-sm ${viewMode==='cards'?'bg-gray-100 font-medium':''}`} onClick={()=>setViewMode('cards')}><Grid3X3 className="w-4 h-4"/></button>
          </div>
          {/* Masaüstü butonlar */}
          <Button className="hidden sm:inline-flex" variant="secondary" onClick={handlePdf} leftIcon={<Download className="w-4 h-4"/>}>Rapor İndir</Button>
          <Button className="hidden sm:inline-flex" variant="secondary" onClick={handleExcel} leftIcon={<FileText className="w-4 h-4"/>}>Excel İndir</Button>
          {canManage && (
            <Button className="hidden sm:inline-flex" onClick={()=>setShowCreate(true)}>Yeni Envanter</Button>
          )}
          {/* Mobil ikonlar */}
          <div className="flex sm:hidden items-center gap-2">
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={handlePdf} title="Rapor indir">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={handleExcel} title="Excel indir">
              <FileText className="w-4 h-4" />
            </Button>
            {canManage && (
              <Button size="sm" className="px-2 py-1 text-xs" onClick={()=>setShowCreate(true)} title="Yeni Envanter">
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={()=>setShowMobileFilters(v=>!v)} title="Filtreler">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className={`grid grid-cols-1 md:grid-cols-5 gap-3 ${showMobileFilters ? '' : 'hidden md:grid'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input className="pl-10" placeholder="Marka / Model / Seri No" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
            </div>
            <Select value={kategori} onChange={e=>setKategori(e.target.value)}>
              {kategoriOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </Select>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Select className="pl-10" value={sahaId} onChange={e=>setSahaId(e.target.value)}>
                {sahaOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </Select>
            </div>
            <div>
              <Select value={santralFilter} onChange={e=>setSantralFilter(e.target.value)}>
                <option value="all">Tüm Santraller</option>
                {santralOptions.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </Select>
            </div>
            <Button onClick={load}>Filtrele</Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {viewMode==='cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <Card key={item.id} className="cursor-pointer" onClick={()=>setViewing(item)}>
              {/* Preview */}
              {item.fotoUrl && item.fotoUrl.length>0 && (
                <div className="h-32 w-full bg-gray-100 overflow-hidden">
                  <img src={item.fotoUrl[0]} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{(item.marka || '-') + ' ' + (item.model || '')}</div>
                  <KategoriBadge cat={item.kategori as any} />
                </div>
                <div className="text-sm text-gray-600">Seri No: {item.seriNo || '-'}</div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5"/>{sahaOptions.find(s=>s.value===item.sahaId)?.label || '-'}</div>
                  <div className="flex items-center gap-1"><Sun className="w-3.5 h-3.5"/>{item.santralId ? (santralMap[item.santralId]?.ad || '-') : '-'}</div>
                </div>
                {item.konum && (
                  <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{item.konum}</div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <div>Kurulum: {item.kurulumTarihi ? formatDate(item.kurulumTarihi.toDate()) : '-'}</div>
                  <div>
                    Garanti: {item.garantiBitis ? formatDate(item.garantiBitis.toDate()) : '-'}
                    {typeof remainingDays(item.garantiBitis) === 'number' && (
                      <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-full ${remainingDays(item.garantiBitis)! <= 30 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {remainingDays(item.garantiBitis)} gün kaldı
                      </span>
                    )}
                  </div>
                </div>
                {item.belgeUrl && (item.belgeUrl as any).length > 0 && (
                  <div className="text-xs text-blue-600 flex items-center gap-2 pt-1" onClick={(e)=>e.stopPropagation()}>
                    <FileText className="w-3.5 h-3.5"/>
                    <a href={(item.belgeUrl as any)[0]} target="_blank" rel="noreferrer" className="hover:underline">Dokümanları aç ({(item.belgeUrl as any).length})</a>
                  </div>
                )}
                {canManage && (
                  <div className="flex justify-end gap-2 pt-2" data-pdf-exclude="true" onClick={(e)=>e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={()=>setEditing(item)}><Edit className="w-4 h-4"/></Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={async()=>{
                      if (!confirm('Bu envanteri silmek istiyor musunuz?')) return;
                      try { await envanterService.deleteEnvanter(item.id); toast.success('Silindi'); load(); } catch { toast.error('Silinemedi'); }
                    }}><Trash2 className="w-4 h-4"/></Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Foto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marka / Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seri No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santral</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kurulum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Garanti Bitiş</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kalan Gün</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doküman</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={()=>setViewing(item)}>
                    <td className="px-4 py-3">
                      {item.fotoUrl && item.fotoUrl.length>0 ? (
                        <img src={item.fotoUrl[0]} alt="prev" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{item.kategori}</td>
                    <td className="px-4 py-3 text-sm">{(item.marka || '-') + ' ' + (item.model || '')}</td>
                    <td className="px-4 py-3 text-sm">{item.seriNo || '-'}</td>
                    <td className="px-4 py-3 text-sm">{sahaOptions.find(s=>s.value===item.sahaId)?.label || '-'}</td>
                    <td className="px-4 py-3 text-sm">{item.santralId ? (santralMap[item.santralId]?.ad || '-') : '-'}</td>
                    <td className="px-4 py-3 text-sm">{item.kurulumTarihi ? formatDate(item.kurulumTarihi.toDate()) : '-'}</td>
                    <td className="px-4 py-3 text-sm">{item.garantiBitis ? formatDate(item.garantiBitis.toDate()) : '-'}</td>
                    <td className="px-4 py-3 text-sm">{typeof remainingDays(item.garantiBitis) === 'number' ? `${remainingDays(item.garantiBitis)} gün` : '-'}</td>
                    <td className="px-4 py-3 text-sm" onClick={(e)=>e.stopPropagation()}>
                      {item.belgeUrl && (item.belgeUrl as any).length>0 ? (
                        <a href={(item.belgeUrl as any)[0]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline" onClick={(e)=>e.stopPropagation()}>
                          <FileText className="w-4 h-4"/> {(item.belgeUrl as any).length} adet
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <div className="flex gap-2" onClick={(e)=>e.stopPropagation()}>
                          <Button size="sm" variant="ghost" onClick={()=>setEditing(item)}><Edit className="w-4 h-4"/></Button>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={async()=>{ if (!confirm('Bu envanteri silmek istiyor musunuz?')) return; try { await envanterService.deleteEnvanter(item.id); toast.success('Silindi'); load(); } catch { toast.error('Silinemedi'); } }}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Modal */}
      <CreateEnvanterModal
        open={showCreate}
        onClose={()=>setShowCreate(false)}
        onSuccess={()=>{ setShowCreate(false); load(); }}
        sahaOptions={sahaOptions}
        santralOptions={santralOptions}
      />
      <EditEnvanterModal
        item={editing}
        onClose={()=>setEditing(null)}
        onSuccess={()=>{ setEditing(null); load(); }}
        sahaOptions={sahaOptions}
        santralOptions={santralOptions}
      />
      {viewing && (
        <Modal isOpen={!!viewing} onClose={()=>setViewing(null)} title="Envanter Detayı" size="lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-lg">{(viewing.marka||'-') + ' ' + (viewing.model||'')}</div>
              <KategoriBadge cat={viewing.kategori as any} />
            </div>
            {viewing.fotoUrl && (viewing.fotoUrl as any).length>0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Fotoğraflar</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(viewing.fotoUrl as any).map((url:string, i:number) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} className="w-full h-32 object-cover rounded" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {viewing.belgeUrl && (viewing.belgeUrl as any).length>0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Dokümanlar</h3>
                <ul className="list-disc pl-5 text-sm">
                  {(viewing.belgeUrl as any).map((url:string, i:number)=>(
                    <li key={i} className="text-blue-600"><a href={url} target="_blank" rel="noreferrer" className="hover:underline">Doküman {i+1}</a></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
              <div><span className="text-gray-500">Seri No:</span> {viewing.seriNo || '-'}</div>
              <div><span className="text-gray-500">Saha:</span> {sahaOptions.find(s=>s.value===viewing.sahaId)?.label || '-'}</div>
              <div><span className="text-gray-500">Santral:</span> {viewing.santralId ? (santralMap[viewing.santralId!]?.ad || '-') : '-'}</div>
              <div><span className="text-gray-500">Kurulum:</span> {viewing.kurulumTarihi ? formatDate((viewing.kurulumTarihi as any).toDate()) : '-'}</div>
              <div><span className="text-gray-500">Garanti Bitiş:</span> {viewing.garantiBitis ? formatDate((viewing.garantiBitis as any).toDate()) : '-'}</div>
              <div><span className="text-gray-500">Garanti Kalan:</span> {typeof remainingDays(viewing.garantiBitis) === 'number' ? `${remainingDays(viewing.garantiBitis)} gün` : '-'}</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EnvanterPage;

// Form şeması
const schema = z.object({
  kategori: z.string().min(1),
  marka: z.string().optional(),
  model: z.string().optional(),
  seriNo: z.string().optional(),
  sahaId: z.string().min(1),
  santralId: z.string().optional(),
  durum: z.enum(['aktif','arizali','degisti','sokuldu']),
  kurulumTarihi: z.string().optional(),
  garantiBaslangic: z.string().optional(),
  garantiSuresiAy: z.coerce.number().optional(),
  tedarikciAdi: z.string().optional(),
  servisIrtibat: z.string().optional(),
  konum: z.string().optional(),
  notlar: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sahaOptions: { value: string; label: string }[];
  santralOptions: { value: string; label: string }[];
}

const CreateEnvanterModal: React.FC<CreateProps> = ({ open, onClose, onSuccess, sahaOptions, santralOptions }) => {
  const { userProfile } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { kategori: 'panel', durum: 'aktif' as any } });
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const selectedSaha = watch('sahaId');

  const addMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const onSubmit = async (values: FormValues) => {
    if (!userProfile?.companyId) return;
    try {
      const payload: any = {
        companyId: userProfile.companyId,
        kategori: values.kategori,
        marka: values.marka,
        model: values.model,
        seriNo: values.seriNo,
        sahaId: values.sahaId,
        santralId: values.santralId || undefined,
        durum: values.durum,
        tedarikciAdi: values.tedarikciAdi,
        servisIrtibat: values.servisIrtibat,
        konum: values.konum,
        notlar: values.notlar,
      };
      if (values.kurulumTarihi) payload.kurulumTarihi = Timestamp.fromDate(new Date(values.kurulumTarihi));
      if (values.garantiBaslangic) payload.garantiBaslangic = Timestamp.fromDate(new Date(values.garantiBaslangic));
      if (values.garantiBaslangic && values.garantiSuresiAy && values.garantiSuresiAy > 0) {
        payload.garantiBitis = Timestamp.fromDate(addMonths(new Date(values.garantiBaslangic), values.garantiSuresiAy));
        payload.garantiSuresiAy = values.garantiSuresiAy;
      }
      const newId = await envanterService.createEnvanter(payload);
      // Dosyalar
      const uploadedDocs: string[] = [];
      for (let i=0; i<docFiles.length; i++) {
        const f = docFiles[i];
        const url = await uploadFile(f, `companies/${userProfile.companyId}/envanter/${newId}/docs/${Date.now()}_${i}.${f.name.split('.').pop()}`, userProfile.companyId);
        uploadedDocs.push(url);
      }
      const uploadedPhotos: string[] = [];
      for (let i=0; i<photoFiles.length; i++) {
        const f = photoFiles[i];
        const url = await uploadFile(f, `companies/${userProfile.companyId}/envanter/${newId}/photos/${Date.now()}_${i}.${f.name.split('.').pop()}`, userProfile.companyId);
        uploadedPhotos.push(url);
      }
      if (uploadedDocs.length || uploadedPhotos.length) {
        await envanterService.updateEnvanter(newId, { belgeUrl: uploadedDocs, fotoUrl: uploadedPhotos } as any);
      }
      toast.success('Envanter eklendi');
      reset();
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error('Kayıt oluşturulamadı');
    }
  };

  return (
    <Modal isOpen={open} onClose={()=>{ onClose(); reset(); }} title="Yeni Envanter" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Kategori</label>
            <select className="w-full border rounded px-3 py-2" {...register('kategori')}>
              {kategoriOptions.filter(k=>k.value!=='all').map(k=> (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Durum</label>
            <select className="w-full border rounded px-3 py-2" {...register('durum')}>
              <option value="aktif">Aktif</option>
              <option value="arizali">Arızalı</option>
              <option value="degisti">Değişti</option>
              <option value="sokuldu">Söküldü</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Marka</label>
            <Input {...register('marka')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Model</label>
            <Input {...register('model')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Seri No</label>
            <Input {...register('seriNo')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Saha</label>
            <select className="w-full border rounded px-3 py-2" defaultValue="" {...register('sahaId')}>
              <option value="">Seçiniz</option>
              {sahaOptions.filter(s=>s.value!=='all').map(s=> (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Santral</label>
            <select className="w-full border rounded px-3 py-2" defaultValue="" {...register('santralId')}>
              <option value="">Seçiniz</option>
              {santralOptions.filter((s:any)=> !selectedSaha ? true : s.sahaId===selectedSaha).map(s=> (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Kurulum Tarihi</label>
            <Input type="date" {...register('kurulumTarihi')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Garanti Başlangıç</label>
            <Input type="date" {...register('garantiBaslangic')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Garanti Süresi (Ay)</label>
            <Input type="number" min={0} {...register('garantiSuresiAy')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Tedarikçi</label>
            <Input {...register('tedarikciAdi')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Servis İrtibat</label>
            <Input {...register('servisIrtibat')} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Konum</label>
            <Input {...register('konum')} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Notlar</label>
            <Input {...register('notlar')} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Belgeler (PDF/Resim)</label>
            <input type="file" multiple accept="application/pdf,image/*" onChange={e=>setDocFiles(Array.from(e.target.files||[]))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Fotoğraflar</label>
            <input type="file" multiple accept="image/*" onChange={e=>setPhotoFiles(Array.from(e.target.files||[]))} />
          </div>
        </div>
        {Object.keys(errors).length>0 && (
          <div className="text-sm text-red-600">Lütfen zorunlu alanları doldurun.</div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={()=>{ onClose(); reset(); }}>Vazgeç</Button>
          <Button type="submit">Kaydet</Button>
        </div>
      </form>
    </Modal>
  );
};

interface EditProps {
  item: Envanter | null;
  onClose: () => void;
  onSuccess: () => void;
  sahaOptions: { value: string; label: string }[];
  santralOptions: { value: string; label: string }[];
}

const EditEnvanterModal: React.FC<EditProps> = ({ item, onClose, onSuccess, sahaOptions, santralOptions }) => {
  const { userProfile } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const sahaWatch = watch('sahaId');
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  useEffect(() => {
    if (item) {
      reset({
        kategori: item.kategori as any,
        marka: item.marka,
        model: item.model,
        seriNo: item.seriNo,
        sahaId: item.sahaId,
        santralId: item.santralId,
        durum: item.durum as any,
        kurulumTarihi: item.kurulumTarihi ? new Date(item.kurulumTarihi.toDate()).toISOString().substring(0,10) : undefined,
        garantiBaslangic: item.garantiBaslangic ? new Date(item.garantiBaslangic.toDate()).toISOString().substring(0,10) : undefined,
        tedarikciAdi: item.tedarikciAdi,
        servisIrtibat: item.servisIrtibat,
        konum: item.konum,
        notlar: item.notlar,
      });
    }
  }, [item, reset]);

  if (!item) return null;

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: any = {
        kategori: values.kategori,
        marka: values.marka,
        model: values.model,
        seriNo: values.seriNo,
        sahaId: values.sahaId,
        santralId: values.santralId || undefined,
        durum: values.durum,
        tedarikciAdi: values.tedarikciAdi,
        servisIrtibat: values.servisIrtibat,
        konum: values.konum,
        notlar: values.notlar,
      };
      if (values.kurulumTarihi) payload.kurulumTarihi = Timestamp.fromDate(new Date(values.kurulumTarihi));
      if (values.garantiBaslangic) payload.garantiBaslangic = Timestamp.fromDate(new Date(values.garantiBaslangic));
      await envanterService.updateEnvanter(item.id, payload);

      // Yüklemeler
      const newDocs: string[] = [];
      for (let i=0; i<docFiles.length; i++) {
        const f = docFiles[i];
        const url = await uploadFile(f, `companies/${userProfile!.companyId}/envanter/${item.id}/docs/${Date.now()}_${i}.${f.name.split('.').pop()}`, userProfile!.companyId);
        newDocs.push(url);
      }
      const newPhotos: string[] = [];
      for (let i=0; i<photoFiles.length; i++) {
        const f = photoFiles[i];
        const url = await uploadFile(f, `companies/${userProfile!.companyId}/envanter/${item.id}/photos/${Date.now()}_${i}.${f.name.split('.').pop()}`, userProfile!.companyId);
        newPhotos.push(url);
      }
      if (newDocs.length || newPhotos.length) {
        await envanterService.updateEnvanter(item.id, {
          belgeUrl: [...(item.belgeUrl || []), ...newDocs] as any,
          fotoUrl: [...(item.fotoUrl || []), ...newPhotos] as any,
        } as any);
      }

      toast.success('Envanter güncellendi');
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error('Güncellenemedi');
    }
  };

  return (
    <Modal isOpen={!!item} onClose={onClose} title="Envanter Düzenle" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Kategori</label>
            <select className="w-full border rounded px-3 py-2" {...register('kategori')}>
              {kategoriOptions.filter(k=>k.value!=='all').map(k=> (<option key={k.value} value={k.value}>{k.label}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Durum</label>
            <select className="w-full border rounded px-3 py-2" {...register('durum')}>
              <option value="aktif">Aktif</option>
              <option value="arizali">Arızalı</option>
              <option value="degisti">Değişti</option>
              <option value="sokuldu">Söküldü</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Marka</label>
            <Input {...register('marka')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Model</label>
            <Input {...register('model')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Seri No</label>
            <Input {...register('seriNo')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Saha</label>
            <select className="w-full border rounded px-3 py-2" defaultValue="" {...register('sahaId')}>
              <option value="">Seçiniz</option>
              {sahaOptions.filter(s=>s.value!=='all').map(s=> (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Santral</label>
            <select className="w-full border rounded px-3 py-2" defaultValue="" {...register('santralId')}>
              <option value="">Seçiniz</option>
              {santralOptions.filter((s:any)=> !sahaWatch ? true : s.sahaId===sahaWatch).map(s=> (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Kurulum Tarihi</label>
            <Input type="date" {...register('kurulumTarihi')} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Garanti Başlangıç</label>
            <Input type="date" {...register('garantiBaslangic')} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Konum</label>
            <Input {...register('konum')} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Notlar</label>
            <Input {...register('notlar')} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Belgeler Ekle (PDF/Resim)</label>
            <input type="file" multiple accept="application/pdf,image/*" onChange={e=>setDocFiles(Array.from(e.target.files||[]))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Fotoğraflar Ekle</label>
            <input type="file" multiple accept="image/*" onChange={e=>setPhotoFiles(Array.from(e.target.files||[]))} />
          </div>
        </div>
        {Object.keys(errors).length>0 && (
          <div className="text-sm text-red-600">Lütfen zorunlu alanları kontrol edin.</div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Kapat</Button>
          <Button type="submit">Güncelle</Button>
        </div>
      </form>
    </Modal>
  );
};


