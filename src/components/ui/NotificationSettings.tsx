import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Settings, Save, Send } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from './';
import { useAuth } from '../../hooks/useAuth';
import { emailService } from '../../services/emailService';
import toast from 'react-hot-toast';

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    address: string;
    faultCreated: boolean;
    faultUpdated: boolean;
    faultResolved: boolean;
    maintenanceDue: boolean;
    systemAlerts: boolean;
    dailyReports: boolean;
    weeklyReports: boolean;
  };
  sms: {
    enabled: boolean;
    number: string;
    criticalOnly: boolean;
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
}

interface NotificationSettingsProps {
  onSave?: (preferences: NotificationPreferences) => void;
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onSave,
  className = ""
}) => {
  const { userProfile } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      enabled: true,
      address: userProfile?.email || '',
      faultCreated: true,
      faultUpdated: true,
      faultResolved: true,
      maintenanceDue: true,
      systemAlerts: true,
      dailyReports: false,
      weeklyReports: true
    },
    sms: {
      enabled: false,
      number: '',
      criticalOnly: true
    },
    inApp: {
      enabled: true,
      sound: true,
      desktop: true
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }
  }, []);

  // Save preferences
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Save to localStorage
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
      
      // Call parent callback
      onSave?.(preferences);
      
      toast.success('Bildirim ayarları kaydedildi!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Ayarlar kaydedilirken hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  // Test email functionality
  const handleTestEmail = async () => {
    if (!preferences.email.enabled || !preferences.email.address) {
      toast.error('Email ayarlarını kontrol edin.');
      return;
    }

    try {
      setIsTesting(true);
      
      const result = await emailService.sendTestEmail({
        name: userProfile?.email?.split('@')[0] || 'Test User',
        email: preferences.email.address
      });

      if (result) {
        toast.success('Test emaili gönderildi! Gelen kutunuzu kontrol edin.');
      } else {
        toast.error('Test emaili gönderilemedi.');
      }
    } catch (error) {
      console.error('Test email error:', error);
      toast.error('Test emaili gönderilirken hata oluştu.');
    } finally {
      setIsTesting(false);
    }
  };

  // Update preferences
  const updatePreference = (section: keyof NotificationPreferences, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Email Bildirimleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Email Bildirimlerini Etkinleştir</h4>
              <p className="text-sm text-gray-500">Önemli olaylar için email alın</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email.enabled}
                onChange={(e) => updatePreference('email', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {preferences.email.enabled && (
            <>
              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Adresi
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={preferences.email.address}
                    onChange={(e) => updatePreference('email', 'address', e.target.value)}
                    placeholder="ornek@email.com"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    onClick={handleTestEmail}
                    disabled={isTesting}
                    leftIcon={<Send className="w-4 h-4" />}
                  >
                    {isTesting ? 'Gönderiliyor...' : 'Test'}
                  </Button>
                </div>
              </div>

              {/* Email Notification Types */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Bildirim Türleri</h4>
                
                <div className="space-y-2">
                  {[
                    { key: 'faultCreated', label: 'Yeni Arıza Bildirimleri', desc: 'Yeni arıza oluşturulduğunda' },
                    { key: 'faultUpdated', label: 'Arıza Güncellemeleri', desc: 'Arıza durumu değiştiğinde' },
                    { key: 'faultResolved', label: 'Arıza Çözüldü', desc: 'Arıza çözüldüğünde' },
                    { key: 'maintenanceDue', label: 'Bakım Hatırlatmaları', desc: 'Planlı bakım zamanı geldiğinde' },
                    { key: 'systemAlerts', label: 'Sistem Uyarıları', desc: 'Kritik sistem olayları' },
                    { key: 'dailyReports', label: 'Günlük Raporlar', desc: 'Her gün özet rapor' },
                    { key: 'weeklyReports', label: 'Haftalık Raporlar', desc: 'Haftalık performans raporu' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-2">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.email[item.key as keyof typeof preferences.email] as boolean}
                        onChange={(e) => updatePreference('email', item.key, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            SMS Bildirimleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">SMS Bildirimlerini Etkinleştir</h4>
              <p className="text-sm text-gray-500">Kritik durumlar için SMS alın</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.sms.enabled}
                onChange={(e) => updatePreference('sms', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {preferences.sms.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon Numarası
                </label>
                <Input
                  type="tel"
                  value={preferences.sms.number}
                  onChange={(e) => updatePreference('sms', 'number', e.target.value)}
                  placeholder="+90 5XX XXX XX XX"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm text-gray-900">Sadece Kritik Uyarılar</div>
                  <div className="text-xs text-gray-500">Yalnızca kritik öncelikli arızalar için SMS gönder</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.sms.criticalOnly}
                  onChange={(e) => updatePreference('sms', 'criticalOnly', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            Uygulama İçi Bildirimler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { key: 'enabled', label: 'Bildirimler', desc: 'Uygulama içi bildirimler göster' },
              { key: 'sound', label: 'Ses', desc: 'Bildirim sesi çal' },
              { key: 'desktop', label: 'Masaüstü', desc: 'Tarayıcı bildirimleri göster' }
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.inApp[item.key as keyof typeof preferences.inApp] as boolean}
                  onChange={(e) => updatePreference('inApp', item.key, e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </Button>
      </div>
    </div>
  );
};
