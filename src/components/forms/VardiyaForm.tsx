import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Camera, 
  AlertTriangle, 
  User,
  Shield,
  Sun,
  Cloud,
  CheckCircle,
  X,
  Plus,
  Trash2,
  Upload,
  ChevronRight,
  ChevronLeft,
  Building2,
  Users,
  FileText,
  Check
} from 'lucide-react';
import { Button, Input, Select, LoadingSpinner } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { vardiyaService } from '../../services/vardiyaService';
import { getAllSahalar } from '../../services/sahaService';
import { getAllSantraller } from '../../services/santralService';
import { ekipService } from '../../services/ekipService';
import { storageService } from '../../services/storageService';
import { Timestamp } from 'firebase/firestore';
import { getAddressFromCoordinates, generateGoogleMapsUrls, getGoogleMapsApiKey } from '../../utils/googleMaps';
import toast from 'react-hot-toast';

interface VardiyaFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editData?: any;
  initialDate?: string; // YYYY-MM-DD formatında tarih
}

export const VardiyaForm: React.FC<VardiyaFormProps> = ({ 
  onSuccess, 
  onCancel,
  editData,
  initialDate
}) => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [sahalar, setSahalar] = useState<any[]>([]);
  const [santraller, setSantraller] = useState<any[]>([]);
  const [ekipUyeleri, setEkipUyeleri] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const [formData, setFormData] = useState({
    sahaId: '',
    santralId: '',
    tarih: initialDate || new Date().toISOString().split('T')[0],
    vardiyaTipi: 'sabah' as 'sabah' | 'ogle' | 'aksam' | 'gece',
    vardiyaSaatleri: {
      baslangic: '08:00',
      bitis: '16:00'
    },
    personeller: [] as any[],
    durum: 'normal' as 'normal' | 'dikkat' | 'acil',
    acilDurum: false,
    yapılanIsler: [] as string[],
    konum: null as any,
    havaKosullari: {
      sicaklik: '',
      durum: ''
    },
    guvenlikKontrolleri: {
      kameraKontrol: false,
      telOrguKontrol: false,
      aydinlatmaKontrol: false,
      girisKontrol: false,
      notlar: ''
    },
    aciklama: ''
  });

  const [newIs, setNewIs] = useState('');

  // Veri yükleme
  useEffect(() => {
    if (company?.id) {
      loadData();
    }
  }, [company]);

  const loadData = async () => {
    try {
      // Bekçi rolü için sadece atanan sahaları getir
      const [sahaData, santralData, ekipData] = await Promise.all([
        getAllSahalar(
          company!.id, 
          userProfile?.rol, 
          userProfile?.sahalar as string[] | undefined
        ),
        getAllSantraller(
          company!.id,
          userProfile?.rol,
          userProfile?.santraller as string[] | undefined
        ),
        ekipService.getAllEkipUyeleri(company!.id)
      ]);
      
      setSahalar(sahaData);
      setSantraller(santralData);
      // Bekçi rolü için ekip üyelerini filtrele
      if (userProfile?.rol === 'bekci' && userProfile?.sahalar) {
        const userSahalar = userProfile.sahalar as string[];
        const filteredEkip = ekipData.filter(ekip => {
          // Sadece aynı sahaya atanan bekçileri göster
          if (ekip.rol === 'bekci' && ekip.sahalar) {
            return ekip.sahalar.some((saha: string) => userSahalar.includes(saha));
          }
          return false;
        });
        setEkipUyeleri(filteredEkip);
      } else {
        setEkipUyeleri(ekipData);
      }
      
      // Formu dolduran kişiyi otomatik olarak personel listesine ekle
      if (userProfile) {
        setFormData(prev => ({
          ...prev,
          personeller: [{
            id: userProfile.id,
            ad: userProfile.ad,
            rol: userProfile.rol,
            telefon: userProfile.telefon || ''
          }]
        }));
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    }
  };

  // Vardiya tipine göre saat ayarla
  useEffect(() => {
    const saatler = {
      sabah: { baslangic: '08:00', bitis: '16:00' },
      ogle: { baslangic: '12:00', bitis: '20:00' },
      aksam: { baslangic: '16:00', bitis: '00:00' },
      gece: { baslangic: '00:00', bitis: '08:00' }
    };
    
    setFormData(prev => ({
      ...prev,
      vardiyaSaatleri: saatler[prev.vardiyaTipi]
    }));
  }, [formData.vardiyaTipi]);

  // Saha değiştiğinde santralleri filtrele
  const filteredSantraller = santraller.filter(s => s.sahaId === formData.sahaId);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Tarayıcı konum servisini desteklemiyor');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        let adres: string | null = null;
        try {
          adres = await getAddressFromCoordinates({ lat: latitude, lng: longitude });
        } catch {}
        setFormData(prev => ({
          ...prev,
          konum: {
            lat: latitude,
            lng: longitude,
            adres: adres || undefined
          }
        }));
        toast.success('Konum alındı');
      } catch (e) {
        console.error(e);
        toast.error('Konum alınamadı');
      } finally {
        setLocating(false);
      }
    }, (err) => {
      console.error(err);
      setLocating(false);
      toast.error('Konum izni verilmedi');
    }, { enableHighAccuracy: true, timeout: 15000 });
  };

  // Adım kontrolü
  const canProceed = () => {
    switch(currentStep) {
      case 1:
        return formData.sahaId !== '';
      case 2:
        return formData.personeller.length > 0;
      case 3:
        return true; // Güvenlik kontrolleri opsiyonel
      case 4:
        return true; // Özet her zaman görüntülenebilir
      default:
        return false;
    }
  };
  
  const nextStep = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Personel ekle/çıkar
  const togglePersonel = (personel: any) => {
    // Formu dolduran kişiyi kaldırmaya izin verme
    if (personel.id === userProfile?.id) {
      toast('Kendinizi listeden çıkaramazsınız', { icon: '⚠️' });
      return;
    }
    
    setFormData(prev => {
      const exists = prev.personeller.find(p => p.id === personel.id);
      if (exists) {
        return {
          ...prev,
          personeller: prev.personeller.filter(p => p.id !== personel.id)
        };
      } else {
        return {
          ...prev,
          personeller: [...prev.personeller, {
            id: personel.id,
            ad: personel.ad,
            rol: personel.rol,
            telefon: personel.telefon
          }]
        };
      }
    });
  };

  // Yapılan iş ekle
  const addYapilanIs = () => {
    if (!newIs.trim()) {
      toast.error('Yapılan iş açıklaması gerekli');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      yapılanIsler: [...prev.yapılanIsler, newIs.trim()]
    }));
    
    setNewIs('');
  };

  // Resim seçme
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length + uploadedImages.length > 10) {
      toast.error('En fazla 10 resim yükleyebilirsiniz');
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  // Resim yükleme
  const uploadImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return uploadedImages;
    
    setIsUploading(true);
    const urls: string[] = [...uploadedImages];
    
    try {
      for (const file of selectedFiles) {
        const path = `companies/${company!.id}/vardiya/${Date.now()}_${file.name}`;
        const url = await storageService.uploadFile(file, path);
        urls.push(url);
      }
      
      setUploadedImages(urls);
      setSelectedFiles([]);
      return urls;
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      toast.error('Resimler yüklenirken hata oluştu');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Form gönderme
  const handleSubmit = async () => {
    if (!formData.sahaId) {
      toast.error('Saha seçimi zorunludur');
      setCurrentStep(1);
      return;
    }
    
    if (formData.personeller.length === 0) {
      toast.error('En az bir personel seçmelisiniz');
      setCurrentStep(2);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Resimleri yükle
      const fotograflar = await uploadImages();
      
      // Saha ve santral bilgilerini al
      const saha = sahalar.find(s => s.id === formData.sahaId);
      const santral = filteredSantraller.find(s => s.id === formData.santralId);
      
      // Tarihi güvenli biçimde (yerel) oluştur
      const [yStr, mStr, dStr] = formData.tarih.split('-');
      const tarihDate = new Date(Number(yStr), Number(mStr) - 1, Number(dStr), 12, 0, 0);

      const vardiyaData = {
        companyId: company!.id,
        olusturanId: userProfile!.id,
        olusturanAdi: userProfile!.ad,
        olusturanRol: userProfile!.rol,
        olusturanFotoUrl: userProfile!.fotoURL,
        sahaId: formData.sahaId,
        sahaAdi: saha?.ad || '',
        santralId: formData.santralId || undefined,
        santralAdi: santral?.ad || undefined,
        tarih: Timestamp.fromDate(tarihDate),
        vardiyaTipi: formData.vardiyaTipi,
        vardiyaSaatleri: formData.vardiyaSaatleri,
        personeller: formData.personeller,
        durum: formData.durum,
        acilDurum: formData.acilDurum,
        gozlemler: [],
        yapılanIsler: formData.yapılanIsler,
        fotograflar,
        konum: formData.konum,
        havaKosullari: {
          sicaklik: formData.havaKosullari.sicaklik ? Number(formData.havaKosullari.sicaklik) : undefined,
          durum: formData.havaKosullari.durum || undefined,
          ruzgarHizi: undefined
        },
        guvenlikKontrolleri: formData.guvenlikKontrolleri,
        ekipmanKontrolleri: {
          panelTemizlik: false,
          inverterKontrol: false,
          kablolama: false,
          topraklama: false,
          notlar: ''
        },
        aciklama: formData.aciklama || ''
      };
      
      if (editData) {
        await vardiyaService.updateVardiyaBildirimi(editData.id, vardiyaData);
        toast.success('Vardiya bildirimi güncellendi');
      } else {
        await vardiyaService.createVardiyaBildirimi(vardiyaData);
        toast.success('Vardiya bildirimi oluşturuldu');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Vardiya kaydetme hatası:', error);
      toast.error('Vardiya kaydedilirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Adım Göstergesi */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex-1 flex items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                  ${currentStep === step 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                    : currentStep > step 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {currentStep > step ? <Check className="h-5 w-5" /> : step}
              </div>
              {step < 4 && (
                <div className="flex-1 mx-2">
                  <div 
                    className={`h-1 transition-all ${
                      currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 px-2">
          <span className="text-xs text-gray-600">Konum</span>
          <span className="text-xs text-gray-600">Personel</span>
          <span className="text-xs text-gray-600">Detaylar</span>
          <span className="text-xs text-gray-600">Özet</span>
        </div>
      </div>

      {/* ADIM 1: Konum ve Zaman */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-blue-600" />
            Konum ve Zaman Bilgileri
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Saha *"
                options={[
                  { value: '', label: sahalar.length === 0 ? 'Size atanan saha bulunamadı' : 'Saha Seçin' },
                  ...sahalar.map(s => ({ value: s.id, label: s.ad }))
                ]}
                value={formData.sahaId}
                onChange={(e) => setFormData({ ...formData, sahaId: e.target.value, santralId: '' })}
                required
              />
              {userProfile?.rol === 'bekci' && sahalar.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Sadece size atanan sahalar listelenmektedir
                </p>
              )}
            </div>
            
            <Select
              label="Santral"
              options={[
                { value: '', label: 'Santral Seçin (Opsiyonel)' },
                ...filteredSantraller.map(s => ({ value: s.id, label: s.ad }))
              ]}
              value={formData.santralId}
              onChange={(e) => setFormData({ ...formData, santralId: e.target.value })}
              disabled={!formData.sahaId}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="date"
              label="Tarih *"
              value={formData.tarih}
              onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
              required
            />
            
            <Select
              label="Vardiya Tipi *"
              options={[
                { value: 'sabah', label: 'Sabah (08:00-16:00)' },
                { value: 'ogle', label: 'Öğle (12:00-20:00)' },
                { value: 'aksam', label: 'Akşam (16:00-00:00)' },
                { value: 'gece', label: 'Gece (00:00-08:00)' }
              ]}
              value={formData.vardiyaTipi}
              onChange={(e) => setFormData({ ...formData, vardiyaTipi: e.target.value as any })}
              required
            />
            
            <Select
              label="Durum *"
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'dikkat', label: 'Dikkat Gerekli' },
                { value: 'acil', label: 'Acil Durum' }
              ]}
              value={formData.durum}
              onChange={(e) => setFormData({ ...formData, durum: e.target.value as any })}
              required
            />
          </div>

          {/* Konum Bilgisi */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Vardiya Konumu</span>
              </div>
              <Button type="button" size="sm" onClick={getCurrentLocation} disabled={locating}>
                {locating ? 'Alınıyor...' : 'Konumumu Al'}
              </Button>
            </div>
            {formData.konum && (
              <div className="mt-3 text-sm text-gray-700 space-y-1">
                <p>Koordinatlar: {formData.konum.lat.toFixed(5)}, {formData.konum.lng.toFixed(5)}</p>
                {formData.konum.adres && <p>Adres: {formData.konum.adres}</p>}
                <div className="flex gap-3">
                  <a
                    href={generateGoogleMapsUrls({ lat: formData.konum.lat, lng: formData.konum.lng }).viewUrl}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                    rel="noreferrer"
                  >Haritada Aç</a>
                  <a
                    href={generateGoogleMapsUrls({ lat: formData.konum.lat, lng: formData.konum.lng }).directionsUrl}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                    rel="noreferrer"
                  >Yol Tarifi</a>
                </div>
                {/* Statik harita görseli (varsa API key) */}
                {(() => {
                  const key = getGoogleMapsApiKey();
                  const url = generateGoogleMapsUrls({ lat: formData.konum.lat, lng: formData.konum.lng }).staticMapUrl(key, 640, 240, 15);
                  return url ? (
                    <img src={url} alt="Konum haritası" className="mt-2 rounded border" />
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {formData.durum === 'acil' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.acilDurum}
                  onChange={(e) => setFormData({ ...formData, acilDurum: e.target.checked })}
                  className="h-4 w-4 text-red-600"
                />
                <span className="text-red-700 font-medium">
                  Acil durum bildirimi (Yöneticilere anında bildirim gönderilir)
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* ADIM 2: Personel Seçimi */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Vardiya Personeli
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personel Seçimi * ({formData.personeller.length} kişi seçili)
            </label>
            
            {/* Formu dolduran kişi - her zaman seçili */}
            {userProfile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="h-4 w-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {userProfile.ad} 
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Vardiya Sorumlusu
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">{userProfile.rol}</p>
                    </div>
                  </div>
                  {userProfile.telefon && (
                    <span className="text-sm text-gray-500">{userProfile.telefon}</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Diğer personeller seçimi gizlendi - bildirimi oluşturan kişi tek sorumludur */}
          </div>
        </div>
      )}

      {/* ADIM 3: Detaylar */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Vardiya Detayları
          </h3>

          {/* Güvenlik Kontrolleri */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Güvenlik Kontrolleri</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'kameraKontrol', label: 'Kamera Sistemleri', icon: Camera },
                { key: 'telOrguKontrol', label: 'Tel Örgü/Çit', icon: Shield },
                { key: 'aydinlatmaKontrol', label: 'Aydınlatma', icon: Sun },
                { key: 'girisKontrol', label: 'Giriş Kontrol', icon: MapPin }
              ].map(item => (
                <label 
                  key={item.key} 
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <item.icon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-center mb-2">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(formData.guvenlikKontrolleri as any)[item.key] || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      guvenlikKontrolleri: {
                        ...formData.guvenlikKontrolleri,
                        [item.key]: e.target.checked
                      }
                    })}
                    className="h-4 w-4 text-blue-600"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Yapılan İşler */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Yapılan İşler</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Yapılan iş açıklaması"
                value={newIs}
                onChange={(e) => setNewIs(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addYapilanIs())}
              />
              <Button type="button" onClick={addYapilanIs} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.yapılanIsler.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.yapılanIsler.map((is, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm">{is}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        yapılanIsler: formData.yapılanIsler.filter((_, i) => i !== index)
                      })}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notlar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genel Notlar
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Vardiya ile ilgili genel notlarınız..."
              value={formData.aciklama}
              onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
            />
          </div>

          {/* Fotoğraf Yükleme */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Fotoğraflar</h4>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2"
                >
                  Fotoğraf Seç
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Maksimum 10 fotoğraf yükleyebilirsiniz
                </p>
              </div>
              
              {(selectedFiles.length > 0 || uploadedImages.length > 0) && (
                <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-2">
                  {[...uploadedImages, ...selectedFiles].map((item, index) => (
                    <div key={index} className="relative group">
                      {typeof item === 'string' ? (
                        <img
                          src={item}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      ) : (
                        <img
                          src={URL.createObjectURL(item)}
                          alt={`Selected ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof item === 'string') {
                            setUploadedImages(uploadedImages.filter(img => img !== item));
                          } else {
                            setSelectedFiles(selectedFiles.filter(f => f !== item));
                          }
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADIM 4: Özet */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Vardiya Özeti
          </h3>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Saha</p>
                <p className="font-medium">{sahalar.find(s => s.id === formData.sahaId)?.ad || '-'}</p>
              </div>
              {formData.santralId && (
                <div>
                  <p className="text-sm text-gray-600">Santral</p>
                  <p className="font-medium">{filteredSantraller.find(s => s.id === formData.santralId)?.ad || '-'}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Tarih</p>
                <p className="font-medium">{new Date(formData.tarih).toLocaleDateString('tr-TR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vardiya</p>
                <p className="font-medium">
                  {formData.vardiyaTipi === 'sabah' && 'Sabah (08:00-16:00)'}
                  {formData.vardiyaTipi === 'ogle' && 'Öğle (12:00-20:00)'}
                  {formData.vardiyaTipi === 'aksam' && 'Akşam (16:00-00:00)'}
                  {formData.vardiyaTipi === 'gece' && 'Gece (00:00-08:00)'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Durum</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  formData.durum === 'normal' ? 'bg-green-100 text-green-800' :
                  formData.durum === 'dikkat' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {formData.durum === 'normal' ? 'Normal' :
                   formData.durum === 'dikkat' ? 'Dikkat Gerekli' : 'Acil Durum'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Personeller ({formData.personeller.length})</p>
              <div className="flex flex-wrap gap-2">
                {formData.personeller.map(p => (
                  <span 
                    key={p.id} 
                    className={`px-3 py-1 rounded-full text-sm ${
                      p.id === userProfile?.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {p.ad}
                    {p.id === userProfile?.id && ' (Sorumlu)'}
                  </span>
                ))}
              </div>
            </div>

            {formData.yapılanIsler.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Yapılan İşler ({formData.yapılanIsler.length})</p>
                <ul className="list-disc list-inside space-y-1">
                  {formData.yapılanIsler.map((is, index) => (
                    <li key={index} className="text-sm">{is}</li>
                  ))}
                </ul>
              </div>
            )}

            {formData.aciklama && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Notlar</p>
                <p className="text-sm">{formData.aciklama}</p>
              </div>
            )}

            {(selectedFiles.length > 0 || uploadedImages.length > 0) && (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Fotoğraflar ({selectedFiles.length + uploadedImages.length})
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigasyon Butonları */}
      <div className="flex justify-between pt-6 border-t">
        <div>
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Geri
            </Button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            İptal
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              İleri
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || isUploading}
              variant="primary"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {editData ? 'Güncelle' : 'Oluştur'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};