import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PrivateRoute } from './components/PrivateRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/layouts/Layout';
import { LoadingSpinner, ErrorBoundary } from './components/ui';
import { initializePlans } from './services/planConfigService';
import { trackPageView } from './lib/posthog-events';
import PageTracker from './components/analytics/PageTracker';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { platform } from './utils/platform';
import { IOSAuthService } from './services/iosAuthService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { PushNotificationService } from './services/pushNotificationService';

// Lazy loaded components
const Home = React.lazy(() => import('./pages/marketing/Home'));
const CheckStorageCalculation = React.lazy(() => import('./pages/debug/CheckStorageCalculation'));
const StorageManager = React.lazy(() => import('./pages/admin/StorageManager'));
const MarketingLayout = React.lazy(() => import('./components/marketing/MarketingLayout'));
const FeaturesPage = React.lazy(() => import('./pages/marketing/Features'));
const PricingPage = React.lazy(() => import('./pages/marketing/Pricing'));
const IntegrationsPage = React.lazy(() => import('./pages/marketing/Integrations'));
const AboutPage = React.lazy(() => import('./pages/marketing/About'));
const ContactPage = React.lazy(() => import('./pages/marketing/Contact'));
const ScadaPage = React.lazy(() => import('./pages/marketing/Scada'));
const SupportScadaPage = React.lazy(() => import('./pages/marketing/SupportScada'));
const PrivacyScadaPage = React.lazy(() => import('./pages/marketing/PrivacyScada'));
const TermsPage = React.lazy(() => import('./pages/marketing/Terms'));
const ContactScadaPage = React.lazy(() => import('./pages/marketing/ContactScada'));
const BlogPage = React.lazy(() => import('./pages/marketing/Blog'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'));
const Arizalar = React.lazy(() => import('./pages/ariza/Arizalar'));
const ElektrikKesintileri = React.lazy(() => import('./pages/ariza/ElektrikKesintileri'));
const Bakim = React.lazy(() => import('./pages/bakim/Bakim'));
const GesYonetimi = React.lazy(() => import('./pages/ges/GesYonetimi'));
const UretimVerileri = React.lazy(() => import('./pages/ges/UretimVerileri'));
const EkipYonetimi = React.lazy(() => import('./pages/ekip/EkipYonetimi'));
const IzinYonetimi = React.lazy(() => import('./pages/ekip/IzinYonetimi'));
const StokKontrol = React.lazy(() => import('./pages/stok/StokKontrol'));
const Envanter = React.lazy(() => import('./pages/envanter/Envanter'));

const Sahalar = React.lazy(() => import('./pages/saha/Sahalar'));
const VardiyaBildirimleri = React.lazy(() => import('./pages/vardiya/VardiyaBildirimleri'));
const Bildirimler = React.lazy(() => import('./pages/bildirimler/Bildirimler'));
const CompanySettings = React.lazy(() => import('./pages/settings/CompanySettings'));
const BackupManagement = React.lazy(() => import('./pages/settings/BackupManagement'));
const GoogleMapsTestPage = React.lazy(() => import('./pages/test/GoogleMapsTestPage'));
const TestNotifications = React.lazy(() => import('./pages/test/TestNotifications'));
const TestPhoneAuth = React.lazy(() => import('./pages/test/TestPhoneAuth'));
const DevPhoneAuthTest = React.lazy(() => import('./pages/test/DevPhoneAuthTest'));
// const EmailTestPage = React.lazy(() => import('./pages/test/EmailTestPage')); // Email test kaldırıldı
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const PlanManagementGuide = React.lazy(() => import('./pages/admin/PlanManagementGuide'));
const SuperAdminDashboard = React.lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const PlanManagement = React.lazy(() => import('./pages/superadmin/PlanManagement'));
const UpgradeRequests = React.lazy(() => import('./pages/superadmin/UpgradeRequests'));
const AnalyticsDashboard = React.lazy(() => import('./pages/analytics/AnalyticsDashboard'));
const PaymentCallback = React.lazy(() => import('./pages/payment/PaymentCallback'));
const MockCheckout = React.lazy(() => import('./pages/payment/MockCheckout'));
const PaparaPayment = React.lazy(() => import('./pages/payment/PaparaPayment'));
const ManagerSubscription = React.lazy(() => import('./pages/subscription/ManagerSubscription'));
const StorageManagement = React.lazy(() => import('./pages/storage/StorageManagement'));
const StorageMigration = React.lazy(() => import('./pages/debug/StorageMigration'));
const QuickStorageFix = React.lazy(() => import('./pages/debug/QuickStorageFix'));
const CreateSampleData = React.lazy(() => import('./pages/debug/CreateSampleData'));
const ViewCompanySubscriptions = React.lazy(() => import('./pages/debug/ViewCompanySubscriptions'));
const SubscriptionMigration = React.lazy(() => import('./pages/debug/SubscriptionMigration'));
const IntegrationTests = React.lazy(() => import('./pages/debug/IntegrationTests'));
const CheckPlans = React.lazy(() => import('./pages/debug/CheckPlans'));
const FixPlans = React.lazy(() => import('./pages/debug/FixPlans'));
const ClearFirebasePlans = React.lazy(() => import('./pages/debug/ClearFirebasePlans'));
const ResetPlans = React.lazy(() => import('./pages/debug/ResetPlans'));
const RecalculateStorage = React.lazy(() => import('./pages/debug/RecalculateStorage'));
const ProfileSettings = React.lazy(() => import('./pages/ProfileSettings'));
const TestPasswordChange = React.lazy(() => import('./pages/TestPasswordChange'));
const MoreMenu = React.lazy(() => import('./pages/MoreMenu'));

// Legal pages removed - not needed

function App() {
  const [iosAuthChecked, setIosAuthChecked] = useState(false);
  
  // Uygulama başladığında planları başlat ve iOS ayarlarını yap
  useEffect(() => {
    initializePlans();
    
    // Push Notifications'ı başlat (Native platformlarda)
    PushNotificationService.initialize();
    
    // iOS Native ayarları ve otomatik giriş
    if (Capacitor.isNativePlatform()) {
      // Status Bar ayarları
      if (Capacitor.getPlatform() === 'ios') {
        StatusBar.setStyle({ style: 'dark' });
        StatusBar.setOverlaysWebView({ overlay: false });
      }
      
      // iOS için otomatik giriş dene
      const checkIOSAuth = async () => {
        console.log('📱 iOS: App başlatıldı, otomatik giriş kontrol ediliyor...');
        
        try {
          // Önce kaydedilmiş bilgi var mı kontrol et
          const hasCredentials = await IOSAuthService.hasCredentials();
          
          if (hasCredentials) {
            console.log('📱 iOS: Kaydedilmiş bilgiler bulundu, giriş deneniyor...');
            const success = await IOSAuthService.tryAutoLogin();
            
            if (success) {
              console.log('✅ iOS: Otomatik giriş başarılı!');
            } else {
              console.log('❌ iOS: Otomatik giriş başarısız');
            }
          } else {
            console.log('📱 iOS: Kaydedilmiş bilgi yok');
          }
        } catch (error) {
          console.error('iOS auth kontrol hatası:', error);
        } finally {
          setIosAuthChecked(true);
          // Splash screen'i kapat
          setTimeout(() => {
            SplashScreen.hide();
          }, 500);
        }
      };
      
      checkIOSAuth();
    } else {
      setIosAuthChecked(true);
    }
  }, []);
  
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ThemeProvider>
            <CompanyProvider>
              <NotificationProvider>
          <PageTracker />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner />
            </div>
          }>
            {Capacitor.isNativePlatform() && !iosAuthChecked ? (
              <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/payment/callback" element={<PaymentCallback />} />
              <Route path="/payment/mock-checkout" element={<MockCheckout />} />
              <Route path="/payment/papara" element={<PaparaPayment />} />
              
              {/* Ana sayfa: Mobilde login, Web'de landing page */}
              <Route path="/" element={platform.isNative() ? <Navigate to="/dashboard" replace /> : <Home />} />
              
              {/* Marketing sayfaları sadece web'de */}
              {!platform.isNative() && (
                <Route element={<MarketingLayout />}>
                  <Route path="/features" element={<FeaturesPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/integrations" element={<IntegrationsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/scada" element={<ScadaPage />} />
                  <Route path="/support/scada" element={<SupportScadaPage />} />
                  <Route path="/privacy/scada" element={<PrivacyScadaPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/contact/scada" element={<ContactScadaPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                </Route>
              )}
              
              {/* Legal Pages removed */}
              
              {/* Private Routes */}
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="arizalar" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'tekniker', 'musteri', 'bekci']}>
                    <Arizalar />
                  </ProtectedRoute>
                } />
                <Route path="arizalar/elektrik-kesintileri" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'tekniker', 'musteri', 'bekci']}>
                    <ElektrikKesintileri />
                  </ProtectedRoute>
                } />
                
                {/* Bakım Alt Sayfaları */}
                <Route path="bakim" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri']}>
                    <Bakim />
                  </ProtectedRoute>
                } />
                <Route path="bakim/elektrik" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri']}>
                    <Bakim />
                  </ProtectedRoute>
                } />
                <Route path="bakim/mekanik" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri']}>
                    <Bakim />
                  </ProtectedRoute>
                } />
                <Route path="bakim/yapilanisler" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri']}>
                    <Bakim />
                  </ProtectedRoute>
                } />
                
                <Route path="ges" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'musteri']}>
                    <GesYonetimi />
                  </ProtectedRoute>
                } />
                <Route path="uretim" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'tekniker', 'musteri']}>
                    <UretimVerileri />
                  </ProtectedRoute>
                } />
                <Route path="sahalar" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'musteri']}>
                    <Sahalar />
                  </ProtectedRoute>
                } />
                <Route path="ekip" element={
                  <ProtectedRoute allowedRoles={['yonetici']}>
                    <EkipYonetimi />
                  </ProtectedRoute>
                } />
                <Route path="izin" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'tekniker', 'bekci']}>
                    <IzinYonetimi />
                  </ProtectedRoute>
                } />
                <Route path="stok" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'tekniker', 'musteri']}>
                    <StokKontrol />
                  </ProtectedRoute>
                } />
                <Route path="envanter" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'tekniker', 'musteri', 'bekci']}>
                    <Envanter />
                  </ProtectedRoute>
                } />
                <Route path="vardiya" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri']}>
                    <VardiyaBildirimleri />
                  </ProtectedRoute>
                } />
                <Route path="bildirimler" element={
                  <ProtectedRoute allowedRoles={['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri']}>
                    <Bildirimler />
                  </ProtectedRoute>
                } />

                <Route path="subscription" element={
                  <ProtectedRoute allowedRoles={['yonetici']}>
                    <ManagerSubscription />
                  </ProtectedRoute>
                } />
                <Route path="storage-management" element={
                  <ProtectedRoute allowedRoles={['yonetici']}>
                    <StorageManagement />
                  </ProtectedRoute>
                } />
                <Route path="settings" element={
                  <ProtectedRoute allowedRoles={['yonetici']}>
                    <CompanySettings />
                  </ProtectedRoute>
                } />
                <Route path="menu" element={<MoreMenu />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="backup" element={
                  <ProtectedRoute allowedRoles={['yonetici']}>
                    <BackupManagement />
                  </ProtectedRoute>
                } />
                <Route path="admin" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/plan-guide" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <PlanManagementGuide />
                  </ProtectedRoute>
                } />
                <Route path="admin/storage" element={
                  <ProtectedRoute allowedRoles={['superadmin', 'yonetici']}>
                    <StorageManager />
                  </ProtectedRoute>
                } />
                <Route path="superadmin" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="superadmin/plans" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <PlanManagement />
                  </ProtectedRoute>
                } />
                <Route path="superadmin/requests" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <UpgradeRequests />
                  </ProtectedRoute>
                } />
                <Route path="analytics" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                } />
                
                {/* Test Pages */}
                <Route path="test/google-maps" element={<GoogleMapsTestPage />} />
                <Route path="test/notifications" element={<TestNotifications />} />
                <Route path="test/phone-auth" element={<TestPhoneAuth />} />
                <Route path="test/dev-phone-auth" element={<DevPhoneAuthTest />} />
                <Route path="test/password-change" element={<TestPasswordChange />} />
                {/* <Route path="test/email" element={<EmailTestPage />} /> Email test kaldırıldı */}
              </Route>
              
              {/* Test & Debug Pages - Development Only */}
              <Route path="/debug/storage-migration" element={<StorageMigration />} />
              <Route path="/debug/quick-fix" element={<QuickStorageFix />} />
              <Route path="/debug/create-sample-data" element={<CreateSampleData />} />
              <Route path="/debug/view-subscriptions" element={<ViewCompanySubscriptions />} />
              <Route path="/debug/subscription-migration" element={<SubscriptionMigration />} />
              <Route path="/debug/integration-tests" element={<IntegrationTests />} />
              <Route path="/debug/check-plans" element={<CheckPlans />} />
              <Route path="/debug/fix-plans" element={<FixPlans />} />
              <Route path="/debug/clear-firebase-plans" element={<ClearFirebasePlans />} />
              <Route path="/debug/reset-plans" element={<ResetPlans />} />
              <Route path="/debug/recalculate-storage" element={<RecalculateStorage />} />
              <Route path="/debug/check-storage" element={<CheckStorageCalculation />} />
              
              {/* 404 */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            )}
          </Suspense>
          </NotificationProvider>
        </CompanyProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;