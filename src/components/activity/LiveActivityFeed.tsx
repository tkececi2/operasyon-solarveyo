import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { subscribeToActivityFeed, LiveActivityItem, LiveActivityType } from '../../services/activityFeedService';
import { Activity, Package, Bell, Wrench, AlertTriangle } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle, LoadingSpinner, Button } from '../ui';

type FilterState = {
  [K in LiveActivityType]: boolean;
};

const DEFAULT_FILTERS: FilterState = {
  'stok-hareketi': true,
  'vardiya': true,
  'ariza': true,
  'bakim-elektrik': true,
  'bakim-mekanik': true
};

function getIcon(type: LiveActivityType) {
  switch (type) {
    case 'stok-hareketi':
      return <Package className="w-4 h-4 text-blue-600" />;
    case 'vardiya':
      return <Bell className="w-4 h-4 text-emerald-600" />;
    case 'ariza':
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case 'bakim-elektrik':
    case 'bakim-mekanik':
      return <Wrench className="w-4 h-4 text-amber-600" />;
    default:
      return <Activity className="w-4 h-4 text-gray-600" />;
  }
}

interface Props {
  height?: number;
  compact?: boolean;
}

const LiveActivityFeed: React.FC<Props> = ({ height = 256, compact = false }) => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const [items, setItems] = useState<LiveActivityItem[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userProfile?.companyId || !company?.id) return;
    setLoading(true);
    const unsub = subscribeToActivityFeed(
      {
        companyId: userProfile.companyId,
        userRole: userProfile.rol,
        userSahalar: (userProfile.sahalar || []) as string[],
        userSantraller: (userProfile.santraller || []) as string[],
        limit: 50
      },
      (data) => {
        setItems(data);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [userProfile?.companyId, userProfile?.rol, userProfile?.sahalar, userProfile?.santraller, company?.id]);

  const filtered = useMemo(() => items.filter((i) => filters[i.type]), [items, filters]);

  const toggle = (key: LiveActivityType) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  if (loading) {
    return (
      <Card className="h-full" padding={compact ? 'sm' : 'md'}>
        <CardHeader className={compact ? 'mb-2' : 'mb-3'}>
          <CardTitle className={compact ? 'text-base' : 'text-lg'}>Canlı Akış</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <LoadingSpinner size="sm" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full" padding={compact ? 'sm' : 'md'}>
      <CardHeader className={compact ? 'mb-2' : 'mb-3'}>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className={compact ? 'text-base' : 'text-lg'}>Canlı Akış</CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge variant={filters['stok-hareketi'] ? 'default' : 'outline'} onClick={() => toggle('stok-hareketi')} className="cursor-pointer">Stok</Badge>
            <Badge variant={filters['vardiya'] ? 'default' : 'outline'} onClick={() => toggle('vardiya')} className="cursor-pointer">Vardiya</Badge>
            <Badge variant={filters['ariza'] ? 'default' : 'outline'} onClick={() => toggle('ariza')} className="cursor-pointer">Arıza</Badge>
            <Badge variant={filters['bakim-elektrik'] ? 'default' : 'outline'} onClick={() => toggle('bakim-elektrik')} className="cursor-pointer">E-Bakım</Badge>
            <Badge variant={filters['bakim-mekanik'] ? 'default' : 'outline'} onClick={() => toggle('bakim-mekanik')} className="cursor-pointer">M-Bakım</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 overflow-auto" style={{ maxHeight: height }}>
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-600">Henüz aktivite yok.</p>
          ) : (
            filtered.slice(0, 50).map((a) => (
              <div key={a.id} className="flex items-start gap-2">
                <div className="mt-0.5">{getIcon(a.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 font-medium truncate">
                    {a.title}
                  </div>
                  {a.description ? (
                    <div className="text-gray-600 text-xs truncate">{a.description}</div>
                  ) : null}
                </div>
                <div className="text-gray-500 text-xs whitespace-nowrap">
                  {a.createdAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveActivityFeed;


