import React, { useState, useEffect } from 'react';
import { Mail, Bell, CreditCard, AlertTriangle, Wrench, FileText, Shield, Megaphone, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, LoadingSpinner } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { functions } from '../../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';

interface EmailCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export const EmailPreferences: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<EmailCategory[]>([
    {
      id: 'welcome',
      name: 'Hoşgeldin',
      description: 'Yeni kullanıcı ve şirket kayıt bildirimleri',
      icon: <Mail className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'planChanged',
      name: 'Plan Değişiklikleri',
      description: 'Abonelik planı güncellemeleri ve limit değişiklikleri',
      icon: <CreditCard className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'faultAlert',
      name: 'Arıza Bildirimleri',
      description: 'Kritik ve yüksek öncelikli arıza uyarıları',
      icon: <AlertTriangle className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'maintenanceReminder',
      name: 'Bakım Hatırlatmaları',
      description: 'Planlanan bakım işlemleri için hatırlatmalar',
      icon: <Wrench className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'paymentSuccess',
      name: 'Ödeme Bildirimleri',
      description: 'Ödeme alındı ve fatura bildirimleri',
      icon: <CreditCard className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'report',
      name: 'Raporlar',
      description: 'Haftalık ve aylık performans raporları',
      icon: <FileText className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'security',
      name: 'Güvenlik',
      description: 'Oturum açma ve güvenlik uyarıları',
      icon: <Shield className="h-5 w-5" />,
      enabled: true
    },
    {
      id: 'marketing',
      name: 'Pazarlama',
      description: 'Yeni özellikler ve promosyonlar',
      icon: <Megaphone className="h-5 w-5" />,
      enabled: false
    }
  ]);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user || !userProfile) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'kullanicilar', user.uid));
      const preferences = userDoc.data()?.emailPreferences || {};

      setCategories(prev => prev.map(cat => ({
        ...cat,
        enabled: preferences[cat.id] !== false // Varsayılan true
      })));
    } catch (error) {
      console.error('Email tercihleri yüklenemedi:', error);
      toast.error('Tercihler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
    ));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Tercihleri objeye dönüştür
      const preferences: Record<string, boolean> = {};
      categories.forEach(cat => {
        preferences[cat.id] = cat.enabled;
      });

      // Firebase Functions ile güncelle
      const updateEmailPreferences = httpsCallable(functions, 'updateEmailPreferences');
      await updateEmailPreferences({ preferences });

      toast.success('Email tercihleri güncellendi');
    } catch (error) {
      console.error('Email tercihleri güncellenemedi:', error);
      toast.error('Tercihler güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Email Bildirimleri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-6">
            Hangi durumlarda email almak istediğinizi seçin. Kritik bildirimler her zaman gönderilir.
          </p>

          <div className="space-y-3">
            {categories.map(category => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${category.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    {category.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={category.enabled}
                    onChange={() => handleToggle(category.id)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">Önemli Bildirimler</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Kritik arızalar, güvenlik uyarıları ve ödeme bildirimleri tercihlerinizden bağımsız olarak gönderilir.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Tercihleri Kaydet
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
