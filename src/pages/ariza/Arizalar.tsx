import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Search, Eye, Edit, Trash2, Download, FileText, Filter, Clock, MapPin, Building2, User, CheckCircle, MessageSquare, Image as ImageIcon, ThumbsUp, Star, X, Camera, Calendar, AlertCircle } from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  Modal,
  Input,
  DataTable,
  StatusBadge,
  PriorityBadge
} from '../../components/ui';
import { ResponsiveDetailModal } from '../../components/modals/ResponsiveDetailModal';
import { ArizaForm } from '../../components/forms/ArizaForm';
import { useAuth } from '../../hooks/useAuth';
import { useAdvancedFilter, FilterConfig } from '../../hooks/useAdvancedFilter';
import { arizaService } from '../../services';
import type { Fault } from '../../types';
import type { ColumnDef } from '../../components/ui/DataTable';
import { formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { getAllSahalar } from '../../services/sahaService';
import { getSantrallerBySaha, getAllSantraller } from '../../services/santralService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { exportToExcel } from '../../utils/exportUtils';
import FeedbackWidget from '../../components/ariza/FeedbackWidget';
import { getFeedbackSummaryForTargets, getUserFeedbackMap, toggleLike, createFeedback, upsertFeedbackForTarget, getUserLikesForFeedbacks, getFeedbackForTarget, deleteFeedback } from '../../services/feedbackService';

const Arizalar: React.FC = () => {
  const { userProfile, canPerformAction } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAriza, setSelectedAriza] = useState<Fault | null>(null);
  const [arizalar, setArizalar] = useState<Fault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDocument, setLastDocument] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [raporlayanAd, setRaporlayanAd] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
  const [cozumText, setCozumText] = useState<string>('');
  const [cozumFiles, setCozumFiles] = useState<File[]>([]);
  const [cozumDate, setCozumDate] = useState<string>('');
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [sahaOptions, setSahaOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedSaha, setSelectedSaha] = useState<string>(''); // sahaId
  const [sahaIdToSantralIds, setSahaIdToSantralIds] = useState<Record<string, string[]>>({});
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const listRef = useRef<HTMLDivElement>(null);
  const [santralMap, setSantralMap] = useState<Record<string, { id: string; ad: string }>>({});
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [feedbackSummary, setFeedbackSummary] = useState<Record<string, { avg: number; count: number; likes: number }>>({});
  const [myFeedbackMap, setMyFeedbackMap] = useState<Record<string, any>>({});
  const [ratingOpenId, setRatingOpenId] = useState<string | null>(null);
  const [ratingBusy, setRatingBusy] = useState<boolean>(false);
  const [commentOpenId, setCommentOpenId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentBusy, setCommentBusy] = useState<boolean>(false);
  const [feedbackModal, setFeedbackModal] = useState<Fault | null>(null);
  const [modalRating, setModalRating] = useState<number>(0);
  const [modalComment, setModalComment] = useState<string>('');
  const [modalBusy, setModalBusy] = useState<boolean>(false);
  const [feedbackComments, setFeedbackComments] = useState<Record<string, any[]>>({});
  const [myLikeMap, setMyLikeMap] = useState<Record<string, boolean>>({});
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyBusy, setReplyBusy] = useState<boolean>(false);
  const [raporlayanMap, setRaporlayanMap] = useState<Record<string, { ad: string; fotoURL?: string }>>({});

  // Sadece müşteri yorum/puan/beğeni yapabilir
  const canCreateFeedback = userProfile?.rol === 'musteri';
  // Personel sadece yanıt verebilir
  const canReply = userProfile?.rol && ['yonetici','muhendis','tekniker'].includes(userProfile.rol as string);

  // Simple filter configurations
  const filterConfigs: FilterConfig<Fault>[] = [
    {
      key: 'durum',
      type: 'select',
      label: 'Durum',
      options: [
        { value: 'acik', label: 'Açık' },
        { value: 'devam-ediyor', label: 'Devam Ediyor' },
        { value: 'cozuldu', label: 'Çözüldü' },
        { value: 'iptal', label: 'İptal' }
      ]
    },
    {
      key: 'oncelik',
      type: 'select',
      label: 'Öncelik',
      options: [
        { value: 'dusuk', label: 'Düşük' },
        { value: 'orta', label: 'Orta' },
        { value: 'yuksek', label: 'Yüksek' },
        { value: 'kritik', label: 'Kritik' }
      ]
    },
    {
      key: 'saha',
      type: 'text',
      label: 'Saha',
      placeholder: 'Saha adı...'
    },
    {
      key: 'raporlayanId',
      type: 'text',
      label: 'Raporlayan',
      placeholder: 'Raporlayan ID...'
    }
  ];

  // Advanced filter hook - sadece UI state yönetimi için kullanıyoruz
  const {
    searchTerm,
    setSearchTerm,
    activeFilters,
    addFilter,
    removeFilter,
    clearFilters,
    hasFilters
  } = useAdvancedFilter({
    data: [], // Veriyi artık doğrudan Firebase'den filtreliyoruz
    searchKeys: ['aciklama', 'saha', 'baslik'],
    filterConfigs,
    defaultSort: { key: 'olusturmaTarihi', direction: 'desc' },
    itemsPerPage: 1000
  });

  // Gösterilecek veriler
  const items = arizalar;
  const totalItems = arizalar.length;
  const sortConfig = null;
  const handleSort = () => {};
  const exportData = () => arizalar;

  // Görüntülenen kayıtlar için geri bildirim özetleri
  useEffect(() => {
    (async () => {
      try {
        if (!userProfile?.companyId) return;
        const ids = items.map((i) => i.id);
        if (ids.length === 0) return;
        const map = await getFeedbackSummaryForTargets(userProfile.companyId, 'ariza', ids);
        setFeedbackSummary(map);
        // Son yorumları getir (max 10)
        const lists = await Promise.all(ids.map((id) => getFeedbackForTarget(userProfile.companyId!, 'ariza', id, 10)));
        const cMap: Record<string, any[]> = {};
        ids.forEach((id, idx) => {
          const arr = (lists[idx] || []);
          cMap[id] = arr;
        });
        setFeedbackComments(cMap);
      } catch (e) {
        console.error('Feedback yükleme hatası:', e);
      }
    })();
  }, [items, userProfile?.companyId]);

  // Kullanıcının mevcut feedback kayıtları (müşteri CTA için)
  useEffect(() => {
    (async () => {
      if (!userProfile?.companyId || !userProfile?.id) return;
      try {
        const map = await getUserFeedbackMap(userProfile.companyId, userProfile.id, 'ariza');
        setMyFeedbackMap(map as any);
      } catch (e) {
        // sessiz
      }
    })();
  }, [userProfile?.companyId, userProfile?.id]);

  // Kullanıcının like durumlarını getir (feedback id'leri üzerinden)
  useEffect(() => {
    (async () => {
      if (!userProfile?.id) return;
      const feedbackIds = Object.values(myFeedbackMap || {}).map((f: any) => f.id).filter(Boolean) as string[];
      if (feedbackIds.length === 0) { setMyLikeMap({}); return; }
      try {
        const likeMap = await getUserLikesForFeedbacks(feedbackIds, userProfile.id);
        setMyLikeMap(likeMap);
      } catch {
        // sessiz
      }
    })();
  }, [myFeedbackMap, userProfile?.id]);

  // Kartlarda görünen arızalar için raporlayan kullanıcı bilgilerini getir (ad + foto)
  useEffect(() => {
    (async () => {
      try {
        const ids = Array.from(new Set(items.map((i) => i.raporlayanId))).filter(
          (id) => id && !raporlayanMap[id]
        );
        if (ids.length === 0) return;
        const results: Record<string, { ad: string; fotoURL?: string }> = {};
        await Promise.all(
          ids.map(async (uid) => {
            try {
              const s = await getDoc(doc(db, 'kullanicilar', uid));
              if (s.exists()) {
                const d = s.data() as any;
                results[uid] = { ad: d.ad || uid, fotoURL: d.fotoURL };
              } else {
                results[uid] = { ad: uid };
              }
            } catch {
              results[uid] = { ad: uid };
            }
          })
        );
        setRaporlayanMap((prev) => ({ ...prev, ...results }));
      } catch {
        // sessiz geç
      }
    })();
  }, [items]);

  const handleQuickLike = async (ariza: Fault) => {
    if (!userProfile) return;
    try {
      let fid = myFeedbackMap[ariza.id]?.id as string | undefined;
      if (!fid) {
        fid = await createFeedback({
          companyId: userProfile.companyId,
          targetType: 'ariza',
          targetId: ariza.id,
          santralId: ariza.santralId,
          userId: userProfile.id,
          userAd: userProfile.ad,
        } as any);
      }
      await toggleLike(fid!, userProfile.id);
      // özet ve map yenile
      const map = await getUserFeedbackMap(userProfile.companyId, userProfile.id, 'ariza');
      setMyFeedbackMap(map as any);
      const sum = await getFeedbackSummaryForTargets(userProfile.companyId, 'ariza', [ariza.id]);
      setFeedbackSummary(prev => ({ ...prev, ...sum }));
      setMyLikeMap(prev => ({ ...prev, [fid!]: !prev[fid!] }));
      toast.success('Geri bildiriminiz kaydedildi');
    } catch (e) {
      console.error(e);
      toast.error('İşlem yapılamadı');
    }
  };

  const handleQuickRate = async (ariza: Fault, value: number) => {
    if (!userProfile) return;
    try {
      setRatingBusy(true);
      await upsertFeedbackForTarget({
        companyId: userProfile.companyId,
        userId: userProfile.id,
        userAd: userProfile.ad,
        targetType: 'ariza',
        targetId: ariza.id,
        santralId: ariza.santralId,
        data: { rating: value }
      });
      const map = await getUserFeedbackMap(userProfile.companyId, userProfile.id, 'ariza');
      setMyFeedbackMap(map as any);
      const sum = await getFeedbackSummaryForTargets(userProfile.companyId, 'ariza', [ariza.id]);
      setFeedbackSummary(prev => ({ ...prev, ...sum }));
      setRatingOpenId(null);
      toast.success('Puanınız kaydedildi');
    } catch (e) {
      console.error(e);
      toast.error('Puan verilemedi');
    } finally {
      setRatingBusy(false);
    }
  };

  const handleQuickComment = async (ariza: Fault) => {
    if (!userProfile) return;
    const text = (commentDrafts[ariza.id] || '').trim();
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
        targetType: 'ariza',
        targetId: ariza.id,
        santralId: ariza.santralId,
        data: { comment: text }
      });
      const map = await getUserFeedbackMap(userProfile.companyId, userProfile.id, 'ariza');
      setMyFeedbackMap(map as any);
      const sum = await getFeedbackSummaryForTargets(userProfile.companyId, 'ariza', [ariza.id]);
      setFeedbackSummary(prev => ({ ...prev, ...sum }));
      // yorum listesini güncelle
      try {
        const list = await getFeedbackForTarget(userProfile.companyId!, 'ariza', ariza.id, 10);
        setFeedbackComments(prev => ({ ...prev, [ariza.id]: list }));
      } catch {}
      setCommentOpenId(null);
      setCommentDrafts(prev => ({ ...prev, [ariza.id]: '' }));
      toast.success('Yorumunuz kaydedildi');
    } catch (e) {
      console.error(e);
      toast.error('Yorum gönderilemedi');
    } finally {
      setCommentBusy(false);
    }
  };

  const openFeedbackModal = (ariza: Fault) => {
    setFeedbackModal(ariza);
    const mine = myFeedbackMap[ariza.id];
    setModalRating(mine?.rating || 0);
    setModalComment(mine?.comment || '');
  };

  const submitFeedbackModal = async () => {
    if (!userProfile || !feedbackModal) return;
    try {
      setModalBusy(true);
      await upsertFeedbackForTarget({
        companyId: userProfile.companyId,
        userId: userProfile.id,
        userAd: userProfile.ad,
        targetType: 'ariza',
        targetId: feedbackModal.id,
        santralId: feedbackModal.santralId,
        data: { rating: modalRating || undefined, comment: modalComment?.trim() || undefined }
      });
      const map = await getUserFeedbackMap(userProfile.companyId, userProfile.id, 'ariza');
      setMyFeedbackMap(map as any);
      const sum = await getFeedbackSummaryForTargets(userProfile.companyId, 'ariza', [feedbackModal.id]);
      setFeedbackSummary(prev => ({ ...prev, ...sum }));
      // yorum listesini güncelle
      try {
        const list = await getFeedbackForTarget(userProfile.companyId!, 'ariza', feedbackModal.id, 10);
        setFeedbackComments(prev => ({ ...prev, [feedbackModal.id]: list }));
      } catch {}
      setFeedbackModal(null);
      toast.success('Geri bildiriminiz kaydedildi');
    } catch (e) {
      console.error(e);
      toast.error('Geri bildirim kaydedilemedi');
    } finally {
      setModalBusy(false);
    }
  };

  // Table columns
  const columns: ColumnDef<Fault>[] = [
    {
      key: 'fotograflar' as keyof Fault,
      title: 'Foto',
      width: '72px',
      render: (_: any, row: Fault) => (
        row.fotograflar && row.fotograflar[0]
          ? <img src={row.fotograflar[0]} alt="thumb" className="w-16 h-10 object-cover rounded" />
          : <div className="w-16 h-10 bg-gray-100 rounded" />
      )
    },
    {
      key: 'durum',
      title: 'Durum',
      sortable: true,
      width: '120px',
      render: (durum) => <StatusBadge status={durum} />
    },
    {
      key: 'oncelik',
      title: 'Öncelik',
      sortable: true,
      width: '100px',
      render: (oncelik) => <PriorityBadge priority={oncelik} />
    },
    {
      key: 'memnuniyet' as any,
      title: 'Memnuniyet',
      width: '160px',
      render: (_: any, row: Fault) => {
        const sum = feedbackSummary[row.id];
        if (!sum) return <span className="text-xs text-gray-400">-</span>;
        return (
          <div className="text-xs text-gray-700 whitespace-nowrap flex items-center gap-2">
            <span><span className="text-yellow-500">★</span> {sum.avg || 0} <span className="text-gray-400">({sum.count})</span></span>
            <span className="flex items-center gap-0.5"><ThumbsUp className="w-3.5 h-3.5 text-blue-600" /> {sum.likes || 0}</span>
          </div>
        );
      }
    },
    {
      key: 'baslik',
      title: 'Başlık',
      sortable: true,
      render: (baslik) => (
        <div className="max-w-xs truncate font-medium" title={baslik}>
          {baslik}
        </div>
      )
    },
    {
      key: 'aciklama',
      title: 'Açıklama',
      sortable: true,
      render: (aciklama) => (
        <div className="max-w-xs truncate text-gray-600" title={aciklama}>
          {aciklama}
        </div>
      )
    },
    {
      key: 'saha',
      title: 'Saha',
      sortable: true,
      width: '150px'
    },
    {
      key: 'olusturmaTarihi',
      title: 'Tarih',
      sortable: true,
      width: '120px',
      render: (tarih) => formatDate(tarih.toDate())
    },
    {
      key: 'olusturmaTarihi' as keyof Fault,
      title: 'Süre',
      width: '100px',
      render: (_: any, r: Fault) => {
        if (!r.cozumTarihi) return '-';
        const ms = r.cozumTarihi.toDate().getTime() - r.olusturmaTarihi.toDate().getTime();
        const minutes = Math.floor(ms / 60000);
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}sa ${m}dk`;
      }
    },
    {
      key: 'id',
      title: 'İşlemler',
      width: '120px',
      render: (id, ariza) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewDetail(ariza)}
            leftIcon={<Eye className="w-3 h-3" />}
          >
          </Button>
          {canPerformAction('ariza_duzenle') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(ariza)}
              leftIcon={<Edit className="w-3 h-3" />}
            >
            </Button>
          )}
          {canPerformAction('ariza_sil') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(ariza)}
              leftIcon={<Trash2 className="w-3 h-3" />}
              className="text-red-600 hover:text-red-700"
            >
            </Button>
          )}
        </div>
      )
    }
  ];

  // İlk verileri yükle - tüm filtrelerle birlikte
  const fetchArizalar = async (reset: boolean = true, loadMore: boolean = false) => {
    if (!userProfile?.companyId) return;
    
    try {
      if (reset) {
        setIsLoading(true);
        setArizalar([]);
        setLastDocument(null);
      } else if (loadMore) {
        setLoadingMore(true);
      }
      
      // Aktif filtreleri kontrol et
      const statusFilter = activeFilters.find(f => f.key === 'durum')?.value;
      const priorityFilter = activeFilters.find(f => f.key === 'oncelik')?.value;
      
      // Saha seçimi varsa santralId'leri bul
      let santralIdForFilter: string | undefined;
      if (selectedSaha && sahaIdToSantralIds[selectedSaha]) {
        // Saha seçilmişse, o sahaya ait ilk santralı kullan (Firebase tek santral filtresi destekliyor)
        santralIdForFilter = sahaIdToSantralIds[selectedSaha][0];
      }
      
      // Filtreler varsa daha fazla veri çek
      const hasActiveFilters = statusFilter || priorityFilter || selectedSaha || filterYear !== 'all' || filterMonth !== 'all';
      const pageSize = hasActiveFilters ? 50 : 10;
      
      const data = await arizaService.getFaults({
        companyId: userProfile.companyId,
        userRole: userProfile.rol,
        userSahalar: userProfile.sahalar as any,
        userSantraller: userProfile.santraller as any,
        userId: userProfile.id,
        durum: statusFilter as any,
        oncelik: priorityFilter as any,
        santralId: santralIdForFilter,
        pageSize,
        lastDoc: loadMore ? lastDocument : undefined,
        searchTerm: searchTerm
      });
      
      // Tarih filtreleri için client-side filtreleme (Firebase tarih aralığı sorgusu karmaşık)
      let filteredFaults = data.faults;
      if (filterYear !== 'all' || filterMonth !== 'all' || selectedSaha) {
        filteredFaults = data.faults.filter(fault => {
          const date = fault.olusturmaTarihi.toDate();
          
          // Yıl filtresi
          if (filterYear !== 'all' && date.getFullYear() !== filterYear) {
            return false;
          }
          
          // Ay filtresi
          if (filterMonth !== 'all' && date.getMonth() !== filterMonth) {
            return false;
          }
          
          // Saha filtresi (birden fazla santral olabilir)
          if (selectedSaha && sahaIdToSantralIds[selectedSaha]) {
            const santralIds = sahaIdToSantralIds[selectedSaha];
            if (!santralIds.includes(fault.santralId)) {
              return false;
            }
          }
          
          return true;
        });
      }
      
      if (reset) {
        setArizalar(filteredFaults);
      } else {
        setArizalar(prev => [...prev, ...filteredFaults]);
      }
      
      setLastDocument(data.lastDoc);
      setHasMore(data.hasMore);
      setTotalCount(prev => reset ? filteredFaults.length : prev + filteredFaults.length);
    } catch (err) {
      console.error('Arızalar getirilemedi:', err);
      toast.error('Arızalar yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  // Daha fazla veri yükle
  const loadMoreArizalar = async () => {
    if (!userProfile?.companyId || !hasMore || loadingMore) return;
    await fetchArizalar(false, true);
  };

  // İlk yükleme
  useEffect(() => {
    if (userProfile?.companyId) {
      fetchArizalar(true);
    }
  }, [userProfile?.companyId, userProfile?.rol, userProfile?.sahalar, userProfile?.santraller]);

  // Filtreler değiştiğinde veriyi yeniden yükle
  useEffect(() => {
    if (!userProfile?.companyId) return;
    
    // İlk yüklemeden sonra filtre değişikliklerinde çalış
    const timer = setTimeout(() => {
      fetchArizalar(true);
    }, 300); // Debounce için kısa gecikme
    
    return () => clearTimeout(timer);
  }, [filterYear, filterMonth, selectedSaha, activeFilters.length, searchTerm]);


  // Saha seçenekleri yükle (müşteri izolasyonu ile)
  useEffect(() => {
    const load = async () => {
      try {
        if (!userProfile?.companyId) return;
        
        // Müşteri ise sadece atanan sahaları getir
        const sahas = await getAllSahalar(
          userProfile.companyId,
          userProfile.rol,
          userProfile.sahalar
        );
        setSahaOptions([{ value: '', label: 'Tüm Sahalar' }, ...sahas.map(s => ({ value: s.id, label: s.ad }))]);
        const map: Record<string, string[]> = {};
        sahas.forEach(s => { map[s.id] = s.santralIds || []; });
        setSahaIdToSantralIds(map);
        
        // Santral ad haritası (müşteri izolasyonu ile)
        const santrals = await getAllSantraller(
          userProfile.companyId,
          userProfile.rol,
          userProfile.santraller
        );
        const sm: Record<string, { id: string; ad: string }> = {};
        santrals.forEach(s => { sm[s.id] = { id: s.id, ad: s.ad }; });
        setSantralMap(sm);
      } catch (e) {
        console.error('Saha yükleme hatası', e);
      }
    };
    load();
  }, [userProfile?.companyId, userProfile?.rol, userProfile?.sahalar, userProfile?.santraller]);

  // Seçili saha için santralIds boşsa, santrallerden getir
  useEffect(() => {
    const loadSantralsIfNeeded = async () => {
      if (!userProfile?.companyId || !selectedSaha) return;
      const existing = sahaIdToSantralIds[selectedSaha];
      if (existing && existing.length > 0) return;
      try {
        const santrals = await getSantrallerBySaha(userProfile.companyId, selectedSaha);
        setSahaIdToSantralIds(prev => ({ ...prev, [selectedSaha]: santrals.map(s => s.id) }));
      } catch (e) {
        console.error('Santral listesi alınamadı', e);
      }
    };
    loadSantralsIfNeeded();
  }, [selectedSaha, userProfile?.companyId]);

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    const arr: { value: string; label: string }[] = [{ value: 'all', label: 'Tüm Yıllar' }];
    for (let y = now - 5; y <= now + 2; y++) arr.push({ value: String(y), label: String(y) });
    return arr;
  }, []);
  const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const monthOptions = [{ value: 'all', label: 'Tüm Aylar' }, ...monthNames.map((m, i) => ({ value: String(i), label: m }))];

  const handleExportPdf = async () => {
    if (!listRef.current) return;

    const loadingToast = toast.loading('PDF oluşturuluyor...');

    // PDF öncesi: kartlardaki kısaltmaları kaldır (truncate / line-clamp)
    const clampedEls = listRef.current.querySelectorAll('.truncate, .line-clamp-1, .line-clamp-2, .line-clamp-3') as NodeListOf<HTMLElement>;
    const removedClassMap: Array<{ el: HTMLElement; classes: string[]; prevStyle: string }> = [];
    clampedEls.forEach((el) => {
      const removed: string[] = [];
      ['truncate', 'line-clamp-1', 'line-clamp-2', 'line-clamp-3'].forEach((cls) => {
        if (el.classList.contains(cls)) {
          el.classList.remove(cls);
          removed.push(cls);
        }
      });
      removedClassMap.push({ el, classes: removed, prevStyle: el.getAttribute('style') || '' });
      // Uzun metinlerin tamamen görünmesi için
      el.style.overflow = 'visible';
      el.style.whiteSpace = 'normal';
      (el.style as any).WebkitLineClamp = 'unset';
    });

    try {
      // Reflow için küçük bir bekleme
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(listRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: listRef.current.scrollWidth,
        windowHeight: listRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth; // tam sayfa genişlik
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Başlık
      const topMargin = 25;
      pdf.setFontSize(16);
      pdf.text('ARIZALAR', pdfWidth / 2, 15, { align: 'center' });

      // İlk sayfaya üst marj bırakıp ekle
      pdf.addImage(imgData, 'PNG', 0, topMargin, imgWidth, imgHeight);

      // Kalan yükseklik hesabı (ilk sayfada başlık nedeniyle daha az alan var)
      let heightLeft = imgHeight - (pdfHeight - topMargin);
      while (heightLeft > 0) {
        const position = heightLeft - imgHeight; // sonraki sayfalarda başlık yok
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save('ariza-raporu.pdf');
      toast.success('PDF indirildi');
    } catch (e) {
      console.error(e);
      toast.error('PDF oluşturulamadı');
    } finally {
      // Sınıfları ve stilleri geri al
      removedClassMap.forEach(({ el, classes, prevStyle }) => {
        classes.forEach((c) => el.classList.add(c));
        if (prevStyle) el.setAttribute('style', prevStyle);
        else el.removeAttribute('style');
      });
      toast.dismiss(loadingToast);
    }
  };

  const handleExportExcel = () => {
    try {
      const rows = items.map((a) => {
        const sure = a.cozumTarihi
          ? (() => {
              const ms = a.cozumTarihi.toDate().getTime() - a.olusturmaTarihi.toDate().getTime();
              const minutes = Math.floor(ms / 60000);
              const h = Math.floor(minutes / 60);
              const m = minutes % 60;
              return `${h}sa ${m}dk`;
            })()
          : '-';
        return {
          Baslik: a.baslik,
          Aciklama: a.aciklama,
          Saha: a.saha,
          Santral: santralMap[a.santralId]?.ad || '-',
          Durum: a.durum,
          Oncelik: a.oncelik,
          Tarih: formatDate(a.olusturmaTarihi.toDate()),
          Sure: sure,
        };
      });
      exportToExcel(rows, 'arizalar-raporu');
      toast.success('Excel indirildi');
    } catch (e) {
      console.error('Excel export hatası', e);
      toast.error('Excel indirilemedi');
    }
  };

  // Handlers
  const handleCreate = async (data: any) => {
    try {
      await arizaService.createFault(data);
      toast.success('Arıza başarıyla oluşturuldu!');
      setShowCreateModal(false);
      fetchArizalar();
    } catch (error) {
      console.error('Arıza oluşturulamadı:', error);
      toast.error('Arıza oluşturulurken bir hata oluştu.');
    }
  };

  const handleViewDetail = (ariza: Fault) => {
    setSelectedAriza(ariza);
    setShowDetailModal(true);
    // Form değerlerini sıfırla
    setCozumText('');
    setCozumFiles([]);
    setCozumDate('');
    setShowSolutionForm(false);
    // Raporlayan adını getir
    (async () => {
      try {
        const u = await getDoc(doc(db, 'kullanicilar', ariza.raporlayanId));
        if (u.exists()) setRaporlayanAd((u.data() as any).ad || ariza.raporlayanId);
        else setRaporlayanAd(ariza.raporlayanId);
      } catch {
        setRaporlayanAd(ariza.raporlayanId);
      }
    })();
  };

  const handleEdit = (ariza: Fault) => {
    setSelectedAriza(ariza);
    setShowCreateModal(true);
  };

  const handleDelete = async (ariza: Fault) => {
    if (!confirm('Bu arızayı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await arizaService.deleteFault(ariza.id);
      toast.success('Arıza başarıyla silindi!');
      fetchArizalar();
    } catch (error) {
      console.error('Arıza silinemedi:', error);
      toast.error('Arıza silinirken bir hata oluştu.');
    }
  };

  const handleExport = () => {
    const dataToExport = exportData();
    console.log('Exporting:', dataToExport);
    toast.success(`${dataToExport.length} kayıt dışa aktarılıyor...`);
  };

  // Arıza çözüm işlemi
  const handleSolveFault = async () => {
    if (!selectedAriza) return;
    
    if (!cozumText.trim()) {
      toast.error('Lütfen çözüm açıklaması girin');
      return;
    }

    try {
      setSolutionLoading(true);
      
      // Tarih seçilmişse onu kullan, yoksa şu anki zamanı kullan
      const resolvedDate = cozumDate ? new Date(cozumDate) : new Date();
      
      await arizaService.updateFaultStatus(
        selectedAriza.id,
        'cozuldu',
        cozumText,
        cozumFiles.length > 0 ? cozumFiles : undefined,
        resolvedDate
      );
      
      toast.success('Arıza başarıyla çözüldü olarak işaretlendi!');
      
      // Formu temizle ve kapat
      setCozumText('');
      setCozumFiles([]);
      setCozumDate('');
      setShowSolutionForm(false);
      setShowDetailModal(false);
      
      // Listeyi yenile
      fetchArizalar(true);
      
    } catch (error) {
      console.error('Arıza çözüm hatası:', error);
      toast.error('Arıza çözülürken bir hata oluştu');
    } finally {
      setSolutionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ARIZALAR</h1>
          <p className="text-gray-600">
            {isLoading ? 'Yükleniyor...' : 
             hasMore ? `${arizalar.length} arıza gösteriliyor (daha fazla var)` : 
             `Toplam ${arizalar.length} arıza`}
            {hasFilters && ' (filtrelenmiş)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex rounded-md overflow-hidden border">
            <button className={`px-3 py-2 text-sm ${viewMode==='list'?'bg-gray-100 font-medium':''}`} onClick={()=>setViewMode('list')}>Liste</button>
            <button className={`px-3 py-2 text-sm ${viewMode==='cards'?'bg-gray-100 font-medium':''}`} onClick={()=>setViewMode('cards')}>Kart</button>
          </div>
          {canPerformAction('ariza_ekle') && (
            <Button
            className="hidden sm:inline-flex"
            onClick={() => {
              setSelectedAriza(null);
              setShowCreateModal(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Yeni Arıza
          </Button>
          )}
          {/* Mobil ikonlar */}
          <div className="flex sm:hidden items-center gap-2" data-pdf-exclude="true">
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={handleExportPdf} title="Rapor indir">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" className="px-2 py-1 text-xs" onClick={handleExportExcel} title="Excel indir">
              <FileText className="w-4 h-4" />
            </Button>
            {canPerformAction('ariza_ekle') && (
              <Button size="sm" className="px-2 py-1 text-xs" onClick={() => { setSelectedAriza(null); setShowCreateModal(true); }} title="Yeni Arıza">
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Üst satır: Arama + (mobil) Filtreler butonu */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Arıza ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {/* Mobilde filtre aç/kapa */}
              <Button
                variant="secondary"
                size="sm"
                className="sm:hidden"
                onClick={() => setShowMobileFilters(v => !v)}
                leftIcon={<Filter className="w-4 h-4" />}
              >
                Filtreler
              </Button>
            </div>

            {/* Orta ve üzeri ekranlar: yatay hızlı filtreler */}
            <div className="hidden md:flex items-center gap-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={activeFilters.find(f => f.key === 'durum')?.value || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    addFilter({ key: 'durum', value: e.target.value, operator: 'equals' });
                  } else {
                    removeFilter('durum');
                  }
                }}
              >
                <option value="">Tüm Durumlar</option>
                <option value="acik">Açık</option>
                <option value="devam-ediyor">Devam Ediyor</option>
                <option value="cozuldu">Çözüldü</option>
                <option value="iptal">İptal</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={activeFilters.find(f => f.key === 'oncelik')?.value || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    addFilter({ key: 'oncelik', value: e.target.value, operator: 'equals' });
                  } else {
                    removeFilter('oncelik');
                  }
                }}
              >
                <option value="">Tüm Öncelikler</option>
                <option value="dusuk">Düşük</option>
                <option value="orta">Orta</option>
                <option value="yuksek">Yüksek</option>
                <option value="kritik">Kritik</option>
              </select>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-red-600"
                >
                  Temizle
                </Button>
              )}
            </div>

            {/* Saha/Yıl/Ay + PDF: xl ve üstünde yan tarafta, mobilde panel içinde */}
            <div className="hidden xl:flex items-center gap-2 ml-auto">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={selectedSaha}
                onChange={(e)=>setSelectedSaha(e.target.value)}
              >
                {sahaOptions.map(o => (<option key={o.value || 'all'} value={o.value}>{o.label}</option>))}
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={String(filterYear)}
                onChange={(e)=>setFilterYear(e.target.value==='all'?'all':Number(e.target.value))}
              >
                {yearOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={String(filterMonth)}
                onChange={(e)=>setFilterMonth(e.target.value==='all'?'all':Number(e.target.value))}
              >
                {monthOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
              <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />} onClick={handleExportPdf}>Rapor İndir</Button>
              <Button variant="secondary" leftIcon={<FileText className="w-4 h-4" />} onClick={handleExportExcel}>Excel İndir</Button>
            </div>

            {/* Mobil filtre paneli */}
            {showMobileFilters && (
              <div className="md:hidden border-t pt-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={activeFilters.find(f => f.key === 'durum')?.value || ''}
                    onChange={(e) => {
                      if (e.target.value) addFilter({ key: 'durum', value: e.target.value, operator: 'equals' });
                      else removeFilter('durum');
                    }}
                  >
                    <option value="">Tüm Durumlar</option>
                    <option value="acik">Açık</option>
                    <option value="devam-ediyor">Devam Ediyor</option>
                    <option value="cozuldu">Çözüldü</option>
                    <option value="iptal">İptal</option>
                  </select>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={activeFilters.find(f => f.key === 'oncelik')?.value || ''}
                    onChange={(e) => {
                      if (e.target.value) addFilter({ key: 'oncelik', value: e.target.value, operator: 'equals' });
                      else removeFilter('oncelik');
                    }}
                  >
                    <option value="">Tüm Öncelikler</option>
                    <option value="dusuk">Düşük</option>
                    <option value="orta">Orta</option>
                    <option value="yuksek">Yüksek</option>
                    <option value="kritik">Kritik</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedSaha}
                    onChange={(e)=>setSelectedSaha(e.target.value)}
                  >
                    {sahaOptions.map(o => (<option key={o.value || 'all'} value={o.value}>{o.label}</option>))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={String(filterYear)}
                      onChange={(e)=>setFilterYear(e.target.value==='all'?'all':Number(e.target.value))}
                    >
                      {yearOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </select>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={String(filterMonth)}
                      onChange={(e)=>setFilterMonth(e.target.value==='all'?'all':Number(e.target.value))}
                    >
                      {monthOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" className="flex-1" leftIcon={<Download className="w-4 h-4" />} onClick={handleExportPdf}>Rapor</Button>
                  <Button variant="secondary" className="flex-1" leftIcon={<FileText className="w-4 h-4" />} onClick={handleExportExcel}>Excel</Button>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600">Temizle</Button>
                  )}
                </div>
              </div>
            )}

            {/* Mobil aksiyonlar filtre satırında artık gösterilmiyor (header'da ikonlar var) */}
          </div>

          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeFilters.map((filter) => (
                <div
                  key={filter.key}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  <Filter className="w-3 h-3" />
                  <span className="font-medium">{filter.key}:</span>
                  <span>{filter.value}</span>
                  <button
                    onClick={() => removeFilter(filter.key)}
                    className="ml-1 hover:text-blue-900"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div ref={listRef} className="space-y-4">
      {viewMode === 'list' ? (
        <DataTable
          data={items}
          columns={columns}
          loading={isLoading}
          sortConfig={sortConfig}
          onSort={handleSort}
          onExport={handleExport}
          emptyMessage="Arıza bulunamadı"
          onRowClick={handleViewDetail}
          rowClassName={(ariza) => 
            ariza.oncelik === 'kritik' ? 'bg-red-50 border-l-4 border-red-500' :
            ariza.oncelik === 'yuksek' ? 'bg-orange-50 border-l-4 border-orange-500' :
            ariza.durum === 'cozuldu' ? 'bg-green-50' : ''
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((ariza) => (
            <Card 
              key={ariza.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => handleViewDetail(ariza)}
            >
              <div className="relative">
                <img
                  src={(ariza.fotograflar && ariza.fotograflar[0]) || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'120\'></svg>'}
                  alt="thumb"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                  <div className="px-2 py-0.5 rounded-full bg-white/90 shadow text-xs"><StatusBadge status={ariza.durum} /></div>
                  <div className="px-2 py-0.5 rounded-full bg-white/90 shadow text-xs"><PriorityBadge priority={ariza.oncelik} /></div>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button className="p-1.5 rounded bg-white/90 hover:bg-white shadow" onClick={(e) => {e.stopPropagation(); handleViewDetail(ariza);}} title="Görüntüle"><Eye className="w-4 h-4"/></button>
                  {canPerformAction('ariza_duzenle') && (
                    <button className="p-1.5 rounded bg-white/90 hover:bg-white shadow" onClick={(e) => {e.stopPropagation(); handleEdit(ariza);}} title="Düzenle"><Edit className="w-4 h-4"/></button>
                  )}
                  {canPerformAction('ariza_sil') && (
                    <button className="p-1.5 rounded bg-white/90 hover:bg-white shadow" onClick={(e) => {e.stopPropagation(); handleDelete(ariza);}} title="Sil"><Trash2 className="w-4 h-4"/></button>
                  )}
                </div>
              </div>
              <CardContent className="p-3 space-y-2">
                <div className="font-semibold text-gray-900 truncate" title={ariza.baslik}>{ariza.baslik}</div>
                <div className="text-xs text-gray-600 line-clamp-1" title={ariza.aciklama}>{ariza.aciklama}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5"/>{santralMap[ariza.santralId]?.ad || '-'}</div>
                  <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{ariza.saha}</div>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const u = raporlayanMap[ariza.raporlayanId];
                      const initial = (u?.ad || '').trim().charAt(0).toUpperCase();
                      if (u?.fotoURL) {
                        return <img src={u.fotoURL} alt={u.ad} className="w-4 h-4 rounded-full object-cover" />;
                      }
                      return initial ? (
                        <div className="w-4 h-4 rounded-full bg-gray-200 text-[10px] text-gray-700 flex items-center justify-center">
                          {initial}
                        </div>
                      ) : (
                        <User className="w-3.5 h-3.5 text-gray-500" />
                      );
                    })()}
                    <span>{raporlayanMap[ariza.raporlayanId]?.ad || 'Raporlayan'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5"/>
                    {ariza.cozumTarihi ? (
                      <span className="text-green-700 font-medium">
                        {(() => { const ms = ariza.cozumTarihi.toDate().getTime() - ariza.olusturmaTarihi.toDate().getTime(); const minutes=Math.floor(ms/60000); const h=Math.floor(minutes/60); const m=minutes%60; return `${h} sa ${m} dk`; })()}
                      </span>
                    ) : (
                      <span className="text-gray-500">Beklemede</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/>{formatDate(ariza.olusturmaTarihi.toDate())}</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ariza.durum} />
                  </div>
                </div>

                {/* Yorumlar (son 3) */}
                {(feedbackComments[ariza.id] && feedbackComments[ariza.id].length > 0) && (
                  <div className="mt-2 border rounded-md p-2 bg-gray-50 text-xs text-gray-700" onClick={(e)=>e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-900">Yorumlar</div>
                      <button className="text-[11px] text-blue-600 hover:underline" onClick={(e)=>{ e.stopPropagation(); handleViewDetail(ariza); }}>Tümü</button>
                    </div>
                    <div className="space-y-2">
                      {(() => {
                        const base = (feedbackComments[ariza.id] || []) as any[];
                        const mine = myFeedbackMap[ariza.id];
                        // üst yorumlar
                        let top = base.filter((x:any) => !x.parentId).slice(0, 3);
                        if (mine && !mine.parentId && (mine.comment || typeof mine.rating === 'number') && !top.find((x:any)=>x.id===mine.id)) {
                          top = [mine, ...top].slice(0,3);
                        }
                        return top;
                      })().map((f: any) => (
                        <div key={f.id} className="border rounded p-2 bg-white relative">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900 truncate max-w-[60%]">{f.userAd || 'Müşteri'}</div>
                            <div className="flex items-center gap-2">
                              {typeof f.rating === 'number' && (
                                <div className="text-yellow-400 whitespace-nowrap">{'★'.repeat(f.rating)}<span className="text-gray-300">{'★'.repeat(Math.max(0,5-f.rating))}</span></div>
                              )}
                              <div className="flex items-center gap-0.5 text-[11px] text-blue-600"><ThumbsUp className="w-3 h-3" />{f.likeCount || 0}</div>
                              {/* Kendi yorumunu silme butonu */}
                              {f.userId === userProfile?.id && (
                                <button 
                                  className="p-0.5 rounded hover:bg-red-50" 
                                  title="Yorumu Sil"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm('Yorumunuzu silmek istediğinizden emin misiniz?')) return;
                                    try {
                                      await deleteFeedback(f.id);
                                      // Listeyi yenile
                                      const list = await getFeedbackForTarget(userProfile.companyId!, 'ariza', ariza.id, 10);
                                      setFeedbackComments(prev => ({ ...prev, [ariza.id]: list }));
                                      // Kendi feedback map'ini yenile
                                      const map = await getUserFeedbackMap(userProfile.companyId, userProfile.id, 'ariza');
                                      setMyFeedbackMap(map as any);
                                      // Özet bilgileri yenile
                                      const sum = await getFeedbackSummaryForTargets(userProfile.companyId, 'ariza', [ariza.id]);
                                      setFeedbackSummary(prev => ({ ...prev, ...sum }));
                                      toast.success('Yorumunuz silindi');
                                    } catch (err) {
                                      console.error(err);
                                      toast.error('Yorum silinemedi');
                                    }
                                  }}
                                >
                                  <X className="w-3 h-3 text-red-600" />
                                </button>
                              )}
                            </div>
                          </div>
                          {f.comment && <div className="mt-1 text-gray-700">{f.comment}</div>}
                          {f.createdAt && (
                            <div className="mt-1 text-[11px] text-gray-500">{formatDateTime((f.createdAt as any)?.toDate ? (f.createdAt as any).toDate() : f.createdAt)}</div>
                          )}
                          {/* Yanıtlar */}
                          {(() => {
                            const all = (feedbackComments[ariza.id] || []) as any[];
                            const replies = all.filter((x:any) => x.parentId === f.id);
                            if (replies.length === 0) return null;
                            return (
                              <div className="mt-2 pl-3 border-l text-[12px] space-y-2">
                                {replies.map((r:any)=> (
                                  <div key={r.id}>
                                    <div className="flex items-center justify-between">
                                      <div className="font-medium text-gray-800 truncate max-w-[60%]">{r.userAd || 'Yanıt'}</div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-blue-600 flex items-center gap-0.5"><ThumbsUp className="w-3 h-3" />{r.likeCount || 0}</span>
                                        {/* Kendi yanıtını silme */}
                                        {r.userId === userProfile?.id && (
                                          <button 
                                            className="p-0.5 rounded hover:bg-red-50" 
                                            title="Yanıtı Sil"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (!confirm('Yanıtınızı silmek istediğinizden emin misiniz?')) return;
                                              try {
                                                await deleteFeedback(r.id);
                                                const list = await getFeedbackForTarget(userProfile.companyId!, 'ariza', ariza.id, 10);
                                                setFeedbackComments(prev => ({ ...prev, [ariza.id]: list }));
                                                toast.success('Yanıtınız silindi');
                                              } catch (err) {
                                                console.error(err);
                                                toast.error('Yanıt silinemedi');
                                              }
                                            }}
                                          >
                                            <X className="w-3 h-3 text-red-600" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {r.comment && <div className="mt-0.5 text-gray-700">{r.comment}</div>}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                          {/* Yanıtla - sadece personel roller ve sadece müşteri yorumlarına */}
                          {canReply && f.userId && (
                            <div className="mt-2">
                              {replyOpenId === f.id ? (
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input className="flex-1 border rounded px-2 py-1 text-sm w-full" placeholder="Yanıt yazın" value={replyDrafts[f.id] || ''} onChange={(e)=>setReplyDrafts(prev=>({...prev, [f.id]: e.target.value}))} />
                                  <div className="flex gap-2">
                                    <button disabled={replyBusy} className="text-[12px] px-3 py-1 rounded-md bg-blue-600 text-white disabled:opacity-60 flex-1 sm:flex-initial" onClick={async (e)=>{
                                    e.stopPropagation();
                                    if (!userProfile) return;
                                    const txt = (replyDrafts[f.id]||'').trim();
                                    if (!txt) { toast.error('Yanıt boş olamaz'); return; }
                                    try {
                                      setReplyBusy(true);
                                      await createFeedback({
                                        companyId: userProfile.companyId,
                                        targetType: 'ariza',
                                        targetId: ariza.id,
                                        santralId: ariza.santralId,
                                        userId: userProfile.id,
                                        userAd: userProfile.ad,
                                        comment: txt,
                                        parentId: f.id,
                                      } as any);
                                      setReplyDrafts(prev=>({ ...prev, [f.id]: '' }));
                                      setReplyOpenId(null);
                                      // refresh list
                                      const sum = await getFeedbackSummaryForTargets(userProfile.companyId, 'ariza', [ariza.id]);
                                      setFeedbackSummary(prev => ({ ...prev, ...sum }));
                                      // reload comments for this card
                                      const list = await getFeedbackForTarget(userProfile.companyId!, 'ariza', ariza.id, 10);
                                      setFeedbackComments(prev => ({ ...prev, [ariza.id]: list.filter((x:any)=>!x.status || x.status==='approved') }));
                                      toast.success('Yanıt eklendi');
                                    } catch (err) {
                                      console.error(err);
                                      toast.error('Yanıt eklenemedi');
                                    } finally {
                                      setReplyBusy(false);
                                    }
                                  }}>Gönder</button>
                                    <button className="text-[12px] px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50 flex-1 sm:flex-initial" onClick={(e)=>{ e.stopPropagation(); setReplyOpenId(null); }}>İptal</button>
                                  </div>
                                </div>
                              ) : (
                                <button className="text-[12px] text-blue-600 hover:underline" onClick={(e)=>{ e.stopPropagation(); setReplyOpenId(f.id); }}>Yanıtla</button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kart altı etkileşim ve özet (herkese görünür, müşteri etkileşimli) */}
                <div className="mt-2" onClick={(e)=>e.stopPropagation()}>
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-white border border-gray-200 px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-3 text-xs text-gray-700">
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>
                          {(feedbackSummary[ariza.id]?.avg || 0)} <span className="text-gray-400">({feedbackSummary[ariza.id]?.count || 0})</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 text-blue-600" />{feedbackSummary[ariza.id]?.likes || 0}</span>
                    </div>
                    {canCreateFeedback && (
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-full border hover:bg-blue-50" title="Yorum Yap" onClick={(e)=>{e.stopPropagation(); setCommentOpenId(commentOpenId===ariza.id?null:ariza.id);}}>
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        </button>
                        <button className="p-1.5 rounded-full border hover:bg-yellow-50" title="Puanla" onClick={(e)=>{e.stopPropagation(); setRatingOpenId(ratingOpenId===ariza.id?null:ariza.id);}}>
                          <Star className="w-4 h-4 text-yellow-500" />
                        </button>
                        {(() => { const fid = myFeedbackMap[ariza.id]?.id; const liked = fid ? !!myLikeMap[fid] : false; return (
                          <button className={`p-1.5 rounded-full border ${liked?'bg-blue-50 border-blue-200':'hover:bg-blue-50'}`} title={liked?'Beğenildi':'Beğen'} onClick={(e)=>{e.stopPropagation(); handleQuickLike(ariza);}}>
                            <ThumbsUp className={`w-4 h-4 ${liked?'text-blue-600':'text-blue-600'}`} />
                          </button>
                        ); })()}
                      </div>
                    )}
                  </div>
                  {ratingOpenId===ariza.id && (
                    <div className="mt-2 w-full rounded-lg bg-white border border-gray-200 px-3 py-2 shadow-sm flex items-center gap-1 justify-center">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} disabled={ratingBusy} onClick={(e) => { e.stopPropagation(); handleQuickRate(ariza, n); }} className="text-xl leading-none">
                          <span className={`${n<= (myFeedbackMap[ariza.id]?.rating||0) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {commentOpenId===ariza.id && (
                    <div className="mt-2 w-full rounded-lg bg-white border border-gray-200 px-3 py-2 shadow-sm">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          className="flex-1 border rounded px-2 py-1 text-sm w-full"
                          placeholder="Yorumunuz..."
                          value={commentDrafts[ariza.id] || ''}
                          onChange={(e)=>setCommentDrafts(prev=>({ ...prev, [ariza.id]: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <button disabled={commentBusy} className="text-[12px] px-3 py-1 rounded-md bg-blue-600 text-white disabled:opacity-60 flex-1 sm:flex-initial" onClick={(e)=>{ e.stopPropagation(); handleQuickComment(ariza); }}>{myFeedbackMap[ariza.id]?.comment ? 'Güncelle' : 'Gönder'}</button>
                          <button className="text-[12px] px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50 flex-1 sm:flex-initial" onClick={(e)=>{ e.stopPropagation(); setCommentOpenId(null); }}>İptal</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>


      {/* Daha Fazla Yükle Butonu */}
      {hasMore && !hasFilters && (
        <div className="flex justify-center mt-6 mb-6">
          <Button
            variant="secondary"
            size="lg"
            onClick={loadMoreArizalar}
            disabled={loadingMore}
            leftIcon={loadingMore ? undefined : <Plus className="w-5 h-5" />}
          >
            {loadingMore ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Yükleniyor...</span>
              </div>
            ) : (
              'Daha Fazla Yükle'
            )}
          </Button>
        </div>
      )}

      {/* Tüm kayıtlar yüklendi mesajı */}
      {!hasMore && arizalar.length > 0 && (
        <div className="text-center py-4 text-gray-500 mb-6">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Tüm arızalar yüklendi ({arizalar.length} kayıt)</span>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedAriza(null);
        }}
        title={selectedAriza ? 'Arıza Düzenle' : 'Yeni Arıza Oluştur'}
        size="lg"
      >
        <ArizaForm
          fault={selectedAriza}
          onSuccess={() => {
            setShowCreateModal(false);
            setSelectedAriza(null);
            fetchArizalar();
          }}
          onCancel={() => {
            setShowCreateModal(false);
            setSelectedAriza(null);
          }}
        />
      </Modal>

      {/* Detail Modal - Responsive for Mobile */}
      <ResponsiveDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedAriza(null);
          setShowSolutionForm(false);
        }}
        title={selectedAriza?.baslik || 'Arıza Detayları'}
        subtitle={selectedAriza ? `${santralMap[selectedAriza.santralId]?.ad || ''} • ${selectedAriza.saha}` : undefined}
        status={selectedAriza ? {
          label: selectedAriza.durum === 'cozuldu' ? 'Çözüldü' : 
                 selectedAriza.durum === 'acik' ? 'Açık' :
                 selectedAriza.durum === 'devam-ediyor' ? 'Devam Ediyor' : 'İptal',
          variant: selectedAriza.durum === 'cozuldu' ? 'success' : 
                   selectedAriza.durum === 'acik' ? 'error' :
                   selectedAriza.durum === 'devam-ediyor' ? 'warning' : 'default'
        } : undefined}
        details={selectedAriza ? [
          {
            label: 'Açıklama',
            value: selectedAriza.aciklama,
            fullWidth: true
          },
          {
            label: 'Santral',
            value: santralMap[selectedAriza.santralId]?.ad || '-',
            icon: Building2
          },
          {
            label: 'Saha',
            value: selectedAriza.saha,
            icon: MapPin
          },
          {
            label: 'Öncelik',
            value: <PriorityBadge priority={selectedAriza.oncelik} />
          },
          {
            label: 'Raporlayan',
            value: raporlayanAd || selectedAriza.raporlayanId,
            icon: User
          },
          {
            label: 'Tarih',
            value: formatDate(selectedAriza.olusturmaTarihi.toDate()),
            icon: Clock
          },
          ...(selectedAriza.cozumTarihi ? [{
            label: 'Çözüm Tarihi',
            value: formatDate(selectedAriza.cozumTarihi.toDate()),
            icon: CheckCircle as any
          }] : []),
          ...(selectedAriza.cozumAciklamasi ? [{
            label: 'Çözüm Açıklaması',
            value: selectedAriza.cozumAciklamasi,
            fullWidth: true
          }] : [])
        ] : []}
        images={[
          ...(selectedAriza?.fotograflar || []),
          ...(selectedAriza?.cozumFotograflari || [])
        ]}
        actions={selectedAriza && selectedAriza.durum !== 'cozuldu' && canPerformAction('ariza_coz') ? [
          {
            label: 'Düzenle',
            onClick: () => {
              setShowDetailModal(false);
              handleEdit(selectedAriza);
            },
            variant: 'secondary' as const,
            icon: Edit
          },
          {
            label: 'Çözüldü İşaretle',
            onClick: () => {
              setShowSolutionForm(true);
            },
            variant: 'primary' as const,
            icon: CheckCircle
          }
        ] : []}
      />

      {/* Eski modal içeriği - artık kullanılmıyor */}
      {false && selectedAriza && (
          <div className="max-h-[75vh] overflow-y-auto p-2">
            {/* Clean Header */}
            <div className="border-b border-gray-200 pb-2 mb-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedAriza.baslik}</h2>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span className="text-sm">{santralMap[selectedAriza.santralId]?.ad || 'Santral'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{selectedAriza.saha}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{formatDate(selectedAriza.olusturmaTarihi.toDate())}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={selectedAriza.durum} />
                  <PriorityBadge priority={selectedAriza.oncelik} />
                </div>
              </div>
            </div>

            {/* Main Content - Responsive Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {/* Left Column - Details */}
              <div className="space-y-3">
                {/* Açıklama */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Açıklama</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedAriza.aciklama}</p>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Raporlayan:</span>
                        <div className="mt-1 flex items-center gap-2">
                          {(() => {
                            const u = raporlayanMap[selectedAriza.raporlayanId];
                            const name = u?.ad || raporlayanAd || selectedAriza.raporlayanId;
                            const initial = (name || '').trim().charAt(0).toUpperCase();
                            if (u?.fotoURL) {
                              return <img src={u.fotoURL} alt={name} className="w-5 h-5 rounded-full object-cover" />;
                            }
                            return initial ? (
                              <div className="w-5 h-5 rounded-full bg-gray-200 text-[11px] text-gray-700 flex items-center justify-center">
                                {initial}
                              </div>
                            ) : (
                              <User className="w-4 h-4 text-gray-500" />
                            );
                          })()}
                          <p className="font-medium text-gray-900">{raporlayanMap[selectedAriza.raporlayanId]?.ad || raporlayanAd || selectedAriza.raporlayanId}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Tarih:</span>
                        <p className="font-medium text-gray-900">{formatDateTime(selectedAriza.olusturmaTarihi.toDate())}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Çözüm Detayları */}
                {selectedAriza.cozumTarihi && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Çözüm Detayları</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-gray-500 text-sm">Çözüm Tarihi:</span>
                        <p className="font-medium text-gray-900">{formatDateTime(selectedAriza.cozumTarihi.toDate())}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Çözüm Süresi:</span>
                        <p className="font-medium text-green-700">
                          {(() => {
                            const ms = selectedAriza.cozumTarihi.toDate().getTime() - selectedAriza.olusturmaTarihi.toDate().getTime();
                            const minutes = Math.floor(ms / 60000);
                            const hours = Math.floor(minutes / 60);
                            const mins = minutes % 60;
                            const days = Math.floor(hours / 24);
                            const remainingHours = hours % 24;
                            
                            if (days > 0) {
                              return `${days} gün ${remainingHours} saat ${mins} dakika`;
                            } else {
                              return `${remainingHours} saat ${mins} dakika`;
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                    
                    {selectedAriza.cozumAciklamasi && (
                      <div>
                        <span className="text-gray-500 text-sm">Çözüm Açıklaması:</span>
                        <p className="text-gray-700 leading-relaxed mt-2">{selectedAriza.cozumAciklamasi}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Yorumlar - Sadece çözüm yetkisi olanlar için */}
                {canPerformAction('ariza_coz') && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Çözüm İşlemleri</h3>
                    <div className="space-y-4">
                      <textarea 
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        rows={3}
                        placeholder="Çözüm açıklamasını yazın..." 
                        value={cozumText} 
                        onChange={e=>setCozumText(e.target.value)} 
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input 
                          type="datetime-local" 
                          className="border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          value={cozumDate}
                          onChange={(e)=>setCozumDate(e.target.value)} 
                        />
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          className="border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onChange={(e)=>setCozumFiles(Array.from(e.target.files||[]))} 
                        />
                      </div>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white" 
                        onClick={async ()=>{
                          if (!selectedAriza) return;
                          try {
                            const resolvedAt = cozumDate ? new Date(cozumDate) : undefined;
                            await arizaService.updateFaultStatus(selectedAriza.id, 'cozuldu', cozumText, cozumFiles, resolvedAt);
                            toast.success('Arıza çözüldü olarak işaretlendi');
                            setCozumText(''); setCozumFiles([]);
                            setShowDetailModal(false);
                            fetchArizalar();
                          } catch (e) {
                            console.error(e);
                            toast.error('Güncelleme başarısız');
                          }
                        }}
                      >
                        Çözüldü Olarak İşaretle
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Fotoğraflar */}
              <div className="space-y-3">
                {/* Arıza Fotoğrafları */}
                {(selectedAriza.fotograflar && selectedAriza.fotograflar.length > 0) && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Arıza Fotoğrafları</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedAriza.fotograflar.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square border border-gray-200">
                            <img 
                              src={url} 
                              alt={`Arıza fotoğrafı ${i + 1}`} 
                              className="w-full h-full object-cover hover:opacity-90 transition-opacity" 
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Çözüm Fotoğrafları */}
                {(selectedAriza.cozumFotograflari && selectedAriza.cozumFotograflari.length > 0) && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Çözüm Fotoğrafları</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedAriza.cozumFotograflari.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square border border-gray-200">
                            <img 
                              src={url} 
                              alt={`Çözüm fotoğrafı ${i + 1}`} 
                              className="w-full h-full object-cover hover:opacity-90 transition-opacity" 
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Müşteri Geri Bildirimi */}
                {userProfile?.companyId && (
                  <FeedbackWidget 
                    companyId={userProfile.companyId}
                    arizaId={selectedAriza.id}
                    sahaId={undefined}
                    santralId={selectedAriza.santralId}
                  />
                )}
              </div>
            </div>
          </div>
        )}

      {/* Çözüm Formu Modal */}
      <Modal
        isOpen={showSolutionForm && !!selectedAriza}
        onClose={() => {
          setShowSolutionForm(false);
          setCozumText('');
          setCozumFiles([]);
          setCozumDate('');
        }}
        title="Arıza Çözüm Formu"
        size="lg"
      >
        {selectedAriza && (
          <div className="space-y-6">
            {/* Arıza Bilgileri Özeti */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedAriza.baslik}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedAriza.aciklama}</p>
                </div>
                <PriorityBadge priority={selectedAriza.oncelik} />
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                <div className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{santralMap[selectedAriza.santralId]?.ad || 'Santral'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedAriza.saha}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(selectedAriza.olusturmaTarihi.toDate())}</span>
                </div>
              </div>
            </div>

            {/* Çözüm Formu */}
            <div className="space-y-4">
              {/* Çözüm Açıklaması */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Çözüm Açıklaması <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Arıza nasıl çözüldü? Detaylı açıklama yazın..."
                  value={cozumText}
                  onChange={(e) => setCozumText(e.target.value)}
                />
              </div>

              {/* Tarih ve Saat Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Çözüm Tarihi ve Saati
                </label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={cozumDate}
                  onChange={(e) => setCozumDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 16)}
                />
                {!cozumDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Boş bırakırsanız şu anki tarih ve saat kullanılacaktır
                  </p>
                )}
              </div>

              {/* Fotoğraf Yükleme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Camera className="w-4 h-4 inline mr-1" />
                  Çözüm Fotoğrafları
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="cozum-photos"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setCozumFiles(prev => [...prev, ...files]);
                    }}
                  />
                  <label
                    htmlFor="cozum-photos"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Fotoğraf eklemek için tıklayın</span>
                    <span className="text-xs text-gray-500 mt-1">Birden fazla dosya seçebilirsiniz</span>
                  </label>
                </div>

                {/* Seçilen Fotoğraflar */}
                {cozumFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-600 font-medium">Seçilen Fotoğraflar ({cozumFiles.length})</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {cozumFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Çözüm ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => setCozumFiles(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black bg-opacity-50 text-white text-xs rounded">
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSolutionForm(false);
                  setCozumText('');
                  setCozumFiles([]);
                  setCozumDate('');
                }}
                disabled={solutionLoading}
              >
                İptal
              </Button>
              <Button
                variant="primary"
                onClick={handleSolveFault}
                disabled={solutionLoading || !cozumText.trim()}
                leftIcon={solutionLoading ? undefined : <CheckCircle className="w-4 h-4" />}
              >
                {solutionLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>İşleniyor...</span>
                  </div>
                ) : (
                  'Çözüldü Olarak İşaretle'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Feedback Modal - müşteri için kullanıcı dostu */}
      <Modal
        isOpen={!!feedbackModal}
        onClose={() => setFeedbackModal(null)}
        title="Müşteri Geri Bildirimi"
        size="lg"
      >
        {feedbackModal && (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-2">{santralMap[feedbackModal.santralId]?.ad} • {feedbackModal.saha}</div>
              <div className="text-lg font-semibold text-gray-900">{feedbackModal.baslik}</div>
            </div>
            <div className="flex items-center gap-1 justify-center">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={()=>setModalRating(n)} className="text-2xl leading-none">
                  <span className={`${modalRating>=n?'text-yellow-400':'text-gray-300'}`}>★</span>
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 text-center">Puanınızı seçin (1-5)</div>
            {/* Hazır sebep çipleri */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['Hızlı çözüm','İletişim iyiydi','Tekrar arıza oldu','Geç dönüş','Açıklayıcı değil'].map(tag => (
                <button key={tag} onClick={()=>setModalComment(prev => prev?.includes(tag)? prev : (prev ? prev + ' • ' + tag : tag))} className="px-2 py-1 text-xs rounded-full border hover:bg-gray-50">{tag}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <textarea className="flex-1 border rounded p-2 text-sm" rows={3} placeholder="Yorumunuz (opsiyonel)" value={modalComment} onChange={e=>setModalComment(e.target.value)} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={()=>setFeedbackModal(null)}>İptal</Button>
              <Button disabled={modalBusy} onClick={submitFeedbackModal}>Gönder</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Arizalar;
