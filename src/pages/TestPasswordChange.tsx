import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import toast from 'react-hot-toast';

const TestPasswordChange: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [testResult, setTestResult] = useState<string>('');

  const testDirectSignIn = async () => {
    try {
      if (!currentUser?.email) {
        setTestResult('Kullanıcı email bulunamadı');
        return;
      }

      setTestResult('Test başlıyor...\n');
      
      // Test 1: Direkt sign in
      setTestResult(prev => prev + `\n1. Sign-in denemesi: ${currentUser.email}`);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        currentUser.email,
        currentPassword
      );
      
      setTestResult(prev => prev + '\n✅ Sign-in başarılı!');
      setTestResult(prev => prev + `\nUID: ${userCredential.user.uid}`);
      setTestResult(prev => prev + `\nEmail Verified: ${userCredential.user.emailVerified}`);
      
      // Test 2: Şifre güncelleme
      if (newPassword) {
        setTestResult(prev => prev + '\n\n2. Şifre güncelleme denemesi...');
        await updatePassword(userCredential.user, newPassword);
        setTestResult(prev => prev + '\n✅ Şifre güncellendi!');
        toast.success('Şifre başarıyla güncellendi!');
      }
      
    } catch (error: any) {
      setTestResult(prev => prev + `\n\n❌ Hata: ${error.code} - ${error.message}`);
      toast.error(`Hata: ${error.message}`);
    }
  };

  const checkAuthStatus = () => {
    if (!currentUser) {
      setTestResult('Kullanıcı oturum açmamış');
      return;
    }

    const info = {
      email: currentUser.email,
      uid: currentUser.uid,
      emailVerified: currentUser.emailVerified,
      providerId: currentUser.providerId,
      lastSignIn: currentUser.metadata?.lastSignInTime,
      creationTime: currentUser.metadata?.creationTime,
      providerData: currentUser.providerData?.map(p => ({
        providerId: p.providerId,
        uid: p.uid,
        email: p.email
      }))
    };

    setTestResult(JSON.stringify(info, null, 2));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Şifre Değiştirme Test Sayfası</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Mevcut Email: <strong>{currentUser?.email}</strong>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Mevcut Şifre
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Mevcut şifrenizi girin"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Yeni Şifre (Opsiyonel - Test için)
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Yeni şifre (boş bırakabilirsiniz)"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={checkAuthStatus}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Auth Durumunu Kontrol Et
          </button>
          
          <button
            onClick={testDirectSignIn}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!currentPassword}
          >
            Sign-In Test Et
          </button>
        </div>

        {testResult && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2">Test Sonucu:</h3>
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPasswordChange;
