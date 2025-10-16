import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Package, Search, Download, FileText, Building2, Edit, Trash2, List as ListIcon, Grid3X3, Sun, Zap, Gauge, Boxes, Filter, Plus, MessageCircle, Heart, Send } from 'lucide-react';
import { Button, Card, CardContent, Input, Select, LoadingSpinner, Modal, Badge } from '../../components/ui';
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
import { getFeedbackForTarget, upsertFeedbackForTarget, getUserFeedbackMap, toggleLike, getUserLikesForFeedbacks, type Feedback, deleteFeedback } from '../../services/feedbackService';

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

  // Pagination state'leri
  const [displayLimit, setDisplayLimit] = useState<number>(20);
  const ITEMS_PER_PAGE = 20;

  // Yorum state'leri
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [myLikesMap, setMyLikesMap] = useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = useState<string>('');
  const [commentBusy, setCommentBusy] = useState<boolean>(false);

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

  // Gösterilecek itemlar (pagination ile)
  const displayedItems = useMemo(() => {
    return filtered.slice(0, displayLimit);
  }, [filtered, displayLimit]);

  const hasMore = filtered.length > displayLimit;

  const loadMore = () => {
    setDisplayLimit(prev => prev + ITEMS_PER_PAGE);
  };

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

  // Yorumları yükle
  const loadFeedbacks = async (envanterItem: Envanter) => {
    if (!userProfile?.companyId) return;
    try {
      const fbs = await getFeedbackForTarget(userProfile.companyId, 'envanter', envanterItem.id);
      setFeedbacks(fbs);
      if (fbs.length > 0) {
        const likesMap = await getUserLikesForFeedbacks(fbs.map(f => f.id), userProfile.id);
        setMyLikesMap(likesMap);
      }
    } catch (e) {
      console.error('Yorumlar yüklenemedi:', e);
    }
  };

  // Yorum gönder
  const handleSendComment = async () => {
    if (!userProfile || !viewing) return;
    const text = commentText.trim();
    if (!text) {
      toast.error('Lütfen bir yorum yazın');
      return;
    }
    try {
      setCommentBusy(true);
      await upsertFeedbackForTarget({
        companyId: userProfile.companyId,
        userId: userProfile.id,
        userAd: userProfile.ad,
        targetType: 'envanter',
        targetId: viewing.id,
        sahaId: viewing.sahaId,
        santralId: viewing.santralId,
        data: { comment: text }
      });
      setCommentText('');
      await loadFeedbacks(viewing);
      toast.success('Yorumunuz kaydedildi');
    } catch (e) {
      console.error(e);
      toast.error('Yorum gönderilemedi');
    } finally {
      setCommentBusy(false);
    }
  };

  // Beğeni toggle
  const handleToggleLike = async (feedbackId: string) => {
    if (!userProfile) return;
    try {
      await toggleLike(feedbackId, userProfile.id);
      setMyLikesMap(prev => ({ ...prev, [feedbackId]: !prev[feedbackId] }));
      setFeedbacks(prev => prev.map(f =>
        f.id === feedbackId
          ? { ...f, likeCount: f.likeCount + (myLikesMap[feedbackId] ? -1 : 1) }
          : f
      ));
    } catch (e) {
      console.error(e);
      toast.error('İşlem başarısız');
    }
  };

  // Yorum sil
  const handleDeleteComment = async (feedbackId: string) => {
    if (!confirm('Bu yorumu silmek istiyor musunuz?')) return;
    try {
      await deleteFeedback(feedbackId);
      setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
      toast.success('Yorum silindi');
    } catch (e) {
      console.error(e);
      toast.error('Yorum silinemedi');
    }
  };

  // Viewing değiştiğinde yorumları yükle
  useEffect(() => {
    if (viewing) {
      loadFeedbacks(viewing);
      setCommentText('');
    } else {
      setFeedbacks([]);
      setMyLikesMap({});
      setCommentText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center"><LoadingSpinner /></div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0" ref={contentRef}>
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

      {/* İstatistik - Daha Net */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            <span className="font-bold text-blue-900 text-lg">{items.length}</span> toplam envanter
            {filtered.length < items.length && (
              <span className="ml-2 text-xs text-gray-600">({filtered.length} filtreli sonuç)</span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            Gösteriliyor: <span className="font-semibold text-gray-900">{displayedItems.length}</span>
          </div>
        </div>
      </div>

      {/* List */}
      {viewMode==='cards' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {displayedItems.map(item => (
              <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={()=>setViewing(item)}>
                {/* Minimal Preview */}
                {item.fotoUrl && item.fotoUrl.length>0 && (
                  <div className="h-24 w-full bg-gray-100 overflow-hidden">
                    <img src={item.fotoUrl[0]} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-3 space-y-1.5">
                  {/* Başlık ve Kategori */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm text-gray-900 truncate flex-1">{(item.marka || '-') + ' ' + (item.model || '')}</div>
                    <KategoriBadge cat={item.kategori as any} />
                  </div>

                  {/* Seri No */}
                  <div className="text-xs text-gray-500">#{item.seriNo || '-'}</div>

                  {/* Lokasyon */}
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <Building2 className="w-3 h-3 flex-shrink-0"/>
                      <span className="truncate">{sahaOptions.find(s=>s.value===item.sahaId)?.label || '-'}</span>
                    </div>
                  </div>

                  {/* Garanti Durumu - Minimal */}
                  {typeof remainingDays(item.garantiBitis) === 'number' && (
                    <div className="pt-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        remainingDays(item.garantiBitis)! <= 0
                          ? 'bg-gray-100 text-gray-700'
                          : remainingDays(item.garantiBitis)! <= 30
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                      }`}>
                        {remainingDays(item.garantiBitis)! <= 0 ? '⚠️ Garanti Bitti' : `✓ ${remainingDays(item.garantiBitis)} gün`}
                      </span>
                    </div>
                  )}

                  {/* İşlemler - Daha Büyük */}
                  {canManage && (
                    <div className="flex justify-end gap-2 pt-2 border-t" data-pdf-exclude="true" onClick={(e)=>e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="h-10 w-10 p-0" onClick={()=>setEditing(item)}>
                        <Edit className="w-5 h-5"/>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 h-10 w-10 p-0" onClick={async()=>{
                        if (!confirm('Bu envanteri silmek istiyor musunuz?')) return;
                        try { await envanterService.deleteEnvanter(item.id); toast.success('Silindi'); load(); } catch { toast.error('Silinemedi'); }
                      }}>
                        <Trash2 className="w-5 h-5"/>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Daha Fazla Yükle Butonu - Daha Görünür */}
          {hasMore && (
            <div className="flex flex-col items-center gap-3 mt-8 mb-6 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-600">
                Daha fazla envanter var. <span className="font-semibold text-gray-900">{filtered.length - displayLimit}</span> kayıt gösterilemiyor.
              </p>
              <Button onClick={loadMore} variant="primary" size="lg" className="px-16 py-4 text-base font-semibold">
                📦 Daha Fazla Yükle ({filtered.length - displayLimit} kaldı)
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Envanter</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Saha</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Garanti</th>
                    {canManage && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">İşlem</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={()=>setViewing(item)}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          {item.fotoUrl && item.fotoUrl.length>0 ? (
                            <img src={item.fotoUrl[0]} alt="prev" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {(item.marka || '-') + ' ' + (item.model || '')}
                            </div>
                            <div className="text-xs text-gray-500">#{item.seriNo || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <KategoriBadge cat={item.kategori as any} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-gray-900">
                          {sahaOptions.find(s=>s.value===item.sahaId)?.label || '-'}
                        </div>
                        {item.santralId && (
                          <div className="text-xs text-gray-500">{santralMap[item.santralId]?.ad || '-'}</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {typeof remainingDays(item.garantiBitis) === 'number' ? (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                            remainingDays(item.garantiBitis)! <= 0
                              ? 'bg-gray-100 text-gray-700'
                              : remainingDays(item.garantiBitis)! <= 30
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                          }`}>
                            {remainingDays(item.garantiBitis)! <= 0 ? '⚠️ Bitti' : `✓ ${remainingDays(item.garantiBitis)} gün`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-3 py-2">
                          <div className="flex gap-2" onClick={(e)=>e.stopPropagation()}>
                            <Button size="sm" variant="ghost" className="h-10 w-10 p-0" onClick={()=>setEditing(item)}>
                              <Edit className="w-5 h-5"/>
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600 h-10 w-10 p-0" onClick={async()=>{
                              if (!confirm('Bu envanteri silmek istiyor musunuz?')) return;
                              try { await envanterService.deleteEnvanter(item.id); toast.success('Silindi'); load(); } catch { toast.error('Silinemedi'); }
                            }}>
                              <Trash2 className="w-5 h-5"/>
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Daha Fazla Yükle Butonu - Liste Görünümü */}
          {hasMore && (
            <div className="flex flex-col items-center gap-3 mt-8 mb-6 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-600">
                Daha fazla envanter var. <span className="font-semibold text-gray-900">{filtered.length - displayLimit}</span> kayıt gösterilemiyor.
              </p>
              <Button onClick={loadMore} variant="primary" size="lg" className="px-16 py-4 text-base font-semibold">
                📦 Daha Fazla Yükle ({filtered.length - displayLimit} kaldı)
              </Button>
            </div>
          )}
        </>
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
              <div>
                <span className="text-gray-500">Garanti Kalan:</span> {
                  typeof remainingDays(viewing.garantiBitis) === 'number'
                    ? (remainingDays(viewing.garantiBitis)! <= 0
                        ? <span className="text-gray-600 font-medium">Garantisi Bitti</span>
                        : <span className={remainingDays(viewing.garantiBitis)! <= 30 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>{remainingDays(viewing.garantiBitis)} gün</span>
                      )
                    : '-'
                }
              </div>
            </div>
            {viewing.notlar && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Notlar</h4>
                <p className="text-sm text-gray-700">{viewing.notlar}</p>
              </div>
            )}

            {/* Yorum Bölümü */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Yorumlar ({feedbacks.length})
              </h3>

              {/* Yorum Yap */}
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Yorumunuzu yazın..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                    disabled={commentBusy}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendComment}
                    disabled={commentBusy || !commentText.trim()}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Gönder
                  </Button>
                </div>
              </div>

              {/* Yorumlar Listesi */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {feedbacks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Henüz yorum yapılmamış.</p>
                ) : (
                  feedbacks.map((fb) => (
                    <div key={fb.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{fb.userAd || 'Anonim'}</span>
                            <span className="text-xs text-gray-500">
                              {fb.createdAt?.toDate ? new Date(fb.createdAt.toDate()).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{fb.comment}</p>
                        </div>
                        {userProfile?.id === fb.userId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(fb.id)}
                            className="text-red-600 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => handleToggleLike(fb.id)}
                          className={`flex items-center gap-1 text-sm ${
                            myLikesMap[fb.id] ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                          } transition-colors`}
                        >
                          <Heart className={`w-4 h-4 ${myLikesMap[fb.id] ? 'fill-current' : ''}`} />
                          <span>{fb.likeCount || 0}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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


