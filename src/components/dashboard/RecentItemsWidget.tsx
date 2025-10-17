/**
 * RecentItemsWidget Component
 * Dashboard'da son eklenen kayıtları gösterir
 * Arızalar, Bakımlar, Vardiya Bildirimleri
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, LoadingSpinner, Badge, NewBadge } from '../ui';
import { 
  AlertTriangle, 
  Wrench, 
  Shield, 
  Clock, 
  ChevronRight,
  Zap,
  Cog,
  FileText
} from 'lucide-react';
import { arizaService, bakimService } from '../../services';
import { getAllVardiyaBildirimleri, type VardiyaBildirimi } from '../../services/vardiyaService';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { isNewItem, getTimeAgo } from '../../utils/newItemUtils';
import type { Fault, ElectricalMaintenance, MechanicalMaintenance } from '../../types';
import toast from 'react-hot-toast';

interface RecentItemsWidgetProps {
  companyId: string;
  userRole?: string;
  userSahalar?: string[];
  userSantraller?: string[];
}

type RecentItem = {
  id: string;
  type: 'ariza' | 'elektrik' | 'mekanik' | 'vardiya';
  title: string;
  subtitle: string;
  date: Date;
  status?: string;
  priority?: string;
  icon: React.ReactNode;
  color: string;
  path: string;
};

export const RecentItemsWidget: React.FC<RecentItemsWidgetProps> = ({
  companyId,
  userRole,
  userSahalar,
  userSantraller
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    fetchRecentItems();
  }, [companyId]);

  const fetchRecentItems = async () => {
    try {
      setLoading(true);
      const allItems: RecentItem[] = [];

      // Son 10 arıza getir
      try {
        const arizalar = await arizaService.getFaults({
          companyId,
          pageSize: 10,
          userRole,
          userSahalar,
          userSantraller
        });

        arizalar.faults.forEach((ariza: Fault) => {
          allItems.push({
            id: ariza.id,
            type: 'ariza',
            title: ariza.baslik,
            subtitle: ariza.saha,
            date: ariza.olusturmaTarihi.toDate(),
            status: ariza.durum,
            priority: ariza.oncelik,
            icon: <AlertTriangle className="h-4 w-4" />,
            color: ariza.oncelik === 'kritik' ? 'text-red-500' : 
                   ariza.oncelik === 'yuksek' ? 'text-orange-500' : 'text-yellow-500',
            path: '/arizalar'
          });
        });
      } catch (error) {
        console.error('Arızalar yüklenemedi:', error);
      }

      // Son 5 elektrik bakım getir
      try {
        const elektrikBakimlar = await bakimService.getElectricalMaintenances(companyId, 5);
        elektrikBakimlar.forEach((bakim: ElectricalMaintenance) => {
          allItems.push({
            id: bakim.id,
            type: 'elektrik',
            title: 'Elektrik Bakımı',
            subtitle: bakim.santralId || '-',
            date: bakim.tarih?.toDate ? bakim.tarih.toDate() : new Date(bakim.tarih as any),
            status: bakim.genelDurum,
            icon: <Zap className="h-4 w-4" />,
            color: 'text-yellow-500',
            path: '/bakim/elektrik'
          });
        });
      } catch (error) {
        console.error('Elektrik bakımları yüklenemedi:', error);
      }

      // Son 5 mekanik bakım getir
      try {
        const mekanikBakimlar = await bakimService.getMechanicalMaintenances(companyId, 5);
        mekanikBakimlar.forEach((bakim: MechanicalMaintenance) => {
          allItems.push({
            id: bakim.id,
            type: 'mekanik',
            title: 'Mekanik Bakım',
            subtitle: bakim.santralId || '-',
            date: bakim.tarih?.toDate ? bakim.tarih.toDate() : new Date(bakim.tarih as any),
            status: bakim.genelDurum,
            icon: <Cog className="h-4 w-4" />,
            color: 'text-blue-500',
            path: '/bakim/mekanik'
          });
        });
      } catch (error) {
        console.error('Mekanik bakımları yüklenemedi:', error);
      }

      // Son 5 vardiya bildirimi getir
      try {
        const vardiyalar = await getAllVardiyaBildirimleri(companyId);
        vardiyalar.slice(0, 5).forEach((vardiya: VardiyaBildirimi) => {
          // Tarih güvenli dönüş
          const vardiyaTarihi = vardiya.tarih && typeof vardiya.tarih.toDate === 'function' 
            ? vardiya.tarih.toDate() 
            : vardiya.olusturmaTarihi && typeof vardiya.olusturmaTarihi.toDate === 'function'
            ? vardiya.olusturmaTarihi.toDate()
            : new Date();
            
          allItems.push({
            id: vardiya.id,
            type: 'vardiya',
            title: `Vardiya - ${vardiya.sahaAdi || 'Saha'}${vardiya.santralAdi ? ` (${vardiya.santralAdi})` : ''}`,
            subtitle: vardiya.vardiyaTipi?.toUpperCase() || 'Vardiya',
            date: vardiyaTarihi,
            status: vardiya.durum,
            icon: <Shield className="h-4 w-4" />,
            color: vardiya.durum === 'acil' ? 'text-red-500' : 
                   vardiya.durum === 'dikkat' ? 'text-yellow-500' : 'text-green-500',
            path: '/vardiya'
          });
        });
      } catch (error) {
        console.error('Vardiya bildirimleri yüklenemedi:', error);
      }

      // Tarihe göre sırala (en yeni en üstte)
      allItems.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Sadece son 48 saat içindeki yeni kayıtları göster
      const newItems = allItems.filter(item => isNewItem(item.date));

      setRecentItems(newItems.slice(0, 3)); // En fazla 3 kayıt göster
    } catch (error) {
      console.error('Son eklenenler yüklenemedi:', error);
      toast.error('Son eklenenler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusMap: Record<string, { label: string; variant: string }> = {
      'beklemede': { label: 'Beklemede', variant: 'bg-yellow-100 text-yellow-700' },
      'devam-ediyor': { label: 'Devam Ediyor', variant: 'bg-blue-100 text-blue-700' },
      'cozuldu': { label: 'Çözüldü', variant: 'bg-green-100 text-green-700' },
      'normal': { label: 'Normal', variant: 'bg-gray-100 text-gray-700' },
      'dikkat': { label: 'Dikkat', variant: 'bg-yellow-100 text-yellow-700' },
      'acil': { label: 'Acil', variant: 'bg-red-100 text-red-700' }
    };

    const config = statusMap[status] || { label: status, variant: 'bg-gray-100 text-gray-700' };
    
    return (
      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${config.variant}`}>
        {config.label}
      </span>
    );
  };

  const handleItemClick = (item: RecentItem) => {
    navigate(item.path);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>✨ Yeni Eklenenler</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (recentItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>✨ Yeni Eklenenler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Son 48 saat içinde yeni kayıt bulunmuyor</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            ✨ Yeni Eklenenler
            <Badge className="bg-blue-500 text-white">{recentItems.length}</Badge>
          </CardTitle>
          <span className="text-xs text-gray-500">Son 48 saat</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
          {recentItems.map((item) => {
            const timeAgo = getTimeAgo(item.date);
            
            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleItemClick(item)}
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group"
              >
                {/* Icon */}
                <div className={`p-1.5 rounded-lg bg-gray-50 ${item.color} group-hover:scale-105 transition-transform flex-shrink-0`}>
                  {item.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                  </div>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    {timeAgo && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo}
                      </span>
                    )}
                    {item.status && getStatusBadge(item.status)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentItemsWidget;

