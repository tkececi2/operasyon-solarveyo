import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PushNotificationService } from '../../services/pushNotificationService';
import { WebPushService } from '../../services/webPushService';
import { notificationService } from '../../services/notificationService';
import { findUsersWithoutTokens, forceCompanyTokenRefresh } from '../../utils/fixAllTokens';
import { emergencyTokenFix } from '../../services/simpleNotificationFix';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function TestNotifications() {
  const { user, userProfile } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usersWithoutTokens, setUsersWithoutTokens] = useState<string[]>([]);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    loadToken();
    if (userProfile?.companyId) {
      checkCompanyTokens();
    }
  }, [userProfile?.companyId]);

  const loadToken = async () => {
    try {
      if (isNative) {
        const fcmToken = await PushNotificationService.getFCMToken();
        setToken(fcmToken);
      } else {
        const webToken = await WebPushService.getWebToken();
        setToken(webToken);
      }
    } catch (error) {
      console.error('Token yükleme hatası:', error);
      setToken('❌ HATA');
    }
  };

  const checkCompanyTokens = async () => {
    if (!userProfile?.companyId) return;
    
    const usersWithoutTokenList = await findUsersWithoutTokens(userProfile.companyId);
    setUsersWithoutTokens(usersWithoutTokenList);
  };

  const refreshToken = async () => {
    setLoading(true);
    try {
      if (isNative) {
        await PushNotificationService.initialize();
        if (user?.uid) {
          await PushNotificationService.setUser(user.uid);
        }
        toast.success('🔄 iOS Token yenilendi!');
      } else {
        await WebPushService.initialize();
        if (user?.uid) {
          await WebPushService.setUser(user.uid);
        }
        toast.success('🔄 Web Token yenilendi!');
      }
      
      await loadToken();
    } catch (error) {
      console.error('Token yenileme hatası:', error);
      toast.error('❌ Token yenilenirken hata!');
    } finally {
      setLoading(false);
    }
  };

  const forceRefreshAllTokens = async () => {
    if (!userProfile?.companyId) {
      toast.error('Company bilgisi eksik!');
      return;
    }

    setLoading(true);
    try {
      const result = await forceCompanyTokenRefresh(userProfile.companyId);
      toast.success(`✅ ${result.total} kullanıcı token yenilemeye flaglendi!`);
      await checkCompanyTokens();
    } catch (error) {
      console.error('Toplu token yenileme hatası:', error);
      toast.error('❌ Toplu token yenileme başarısız!');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyTokenFix = async () => {
    if (!userProfile?.companyId) {
      toast.error('Company ID bulunamadı!');
      return;
    }

    setLoading(true);
    try {
      const result = await emergencyTokenFix(userProfile.companyId);
      toast.success(`🚨 ACİL DÜZELTİLDİ! ${result.fixed}/${result.total} kullanıcının token'ı düzeltildi!`);
      await checkCompanyTokens();
    } catch (error) {
      console.error('Acil token düzeltme hatası:', error);
      toast.error('❌ Acil token düzeltme başarısız!');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!user?.uid || !userProfile?.companyId) {
      toast.error('Kullanıcı bilgileri eksik!');
      return;
    }

    setLoading(true);
    try {
      await notificationService.createScopedNotificationClient({
        companyId: userProfile.companyId,
        title: '🧪 Firebase FCM Test',
        message: 'Firebase push notification test - Çalışıyor!',
        type: 'info',
        actionUrl: '/test/notifications',
        metadata: {
          testId: `test_${Date.now()}`,
          platform: isNative ? 'mobile' : 'web'
        },
        roles: [userProfile.rol]
      });
      
      toast.success('✅ Test bildirimi gönderildi!');
      console.log('📱 Firebase test bildirimi - Uygulamayı arka plana alın!');
    } catch (error) {
      console.error('Test bildirimi hatası:', error);
      toast.error('❌ Test bildirimi gönderilemedi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔥 Firebase FCM Test Merkezi
        </h1>

        {/* FCM Token Durumu */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔑 FCM Token Durumu</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token:
              </label>
              <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm break-all">
                {token ? (
                  <span className={token === '❌ HATA' ? 'text-red-600' : 'text-green-600'}>
                    {token.length > 50 ? `${token.substring(0, 50)}...` : token}
                  </span>
                ) : (
                  <span className="text-gray-500">Token yükleniyor...</span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={refreshToken}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '⏳ Yenileniyor...' : '🔄 Token Yenile'}
              </button>

              {userProfile?.rol === 'yonetici' && (
                <>
                  <button
                    onClick={forceRefreshAllTokens}
                    disabled={loading}
                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {loading ? '⏳' : '🔄'} Tüm Kullanıcılar
                  </button>
                  <button
                    onClick={handleEmergencyTokenFix}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? '⏳' : '🚨'} ACİL DÜZELTİCI
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Company Token Status */}
        {userProfile?.rol === 'yonetici' && usersWithoutTokens.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  ⚠️ Token Eksik Kullanıcılar: {usersWithoutTokens.length}
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Bu kullanıcılar push bildirimi alamıyor. "Tüm Kullanıcılar" butonuna tıklayın.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Test Bildirimleri */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Firebase FCM Test</h2>
          
          <div className="space-y-3">
            <button
              onClick={sendTestNotification}
              disabled={loading || !token || token === '❌ HATA'}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Gönderiliyor...' : '📤 Firebase Test Bildirimi'}
            </button>
          </div>
        </div>

        {/* Bilgi */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">💡 Firebase FCM Sistemi</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Arıza bildirimleri zaten çalışıyordu ✅</li>
                  <li>Firebase Functions stable ✅</li>
                  <li>iOS push notifications geliyor ✅</li>
                  <li>Token sorunu basit fix ile çözüldü ✅</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}