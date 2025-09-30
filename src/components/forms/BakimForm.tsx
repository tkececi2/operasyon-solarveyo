import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, Zap, Settings, Camera, X } from 'lucide-react';
import { Button, Input, Textarea, Select } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { getAllSantraller } from '../../services/santralService';
import { getAllSahalar } from '../../services/sahaService';
import { bakimService } from '../../services/bakimService';
import { isValidFileSize } from '../../services/storageService';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const bakimSchema = z.object({
  santralId: z.string().min(1, 'Santral seçimi zorunludur'),
  sahaId: z.string().min(1, 'Saha seçimi zorunludur'),
  bakimTipi: z.enum(['elektrik', 'mekanik']),
  bakimTarihSaat: z.string().min(1, 'Bakım tarihi ve saati zorunludur'),
  yapanKisi: z.string().min(1, 'Bakımı yapan kişi bilgisi zorunludur'),
  genelDurum: z.enum(['iyi', 'orta', 'kotu']),
  notlar: z.string().optional(),
});

type BakimFormData = z.infer<typeof bakimSchema>;

interface BakimFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
}

export const BakimForm: React.FC<BakimFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [kontrolListesi, setKontrolListesi] = useState<Record<string, boolean>>({});
  const isMusteri = userProfile?.rol === 'musteri';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<BakimFormData>({
    resolver: zodResolver(bakimSchema),
    defaultValues: {
      bakimTipi: initialData?.bakimTipi || 'elektrik',
      bakimTarihSaat: initialData?.tarih
        ? (initialData.tarih.toDate ? initialData.tarih.toDate() : new Date(initialData.tarih)).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      yapanKisi: initialData?.yapanKisi || userProfile?.ad || '',
      genelDurum: initialData?.genelDurum || 'iyi',
      santralId: initialData?.santralId || undefined,
      sahaId: initialData?.sahaId || undefined,
    },
  });

  const bakimTipi = watch('bakimTipi');
  const selectedSantralId = watch('santralId');

  // Gerçek verilerden gelecek seçenekler
  const [santralOptions, setSantralOptions] = useState<{value: string, label: string}[]>([]);
  const [sahaOptions, setSahaOptions] = useState<{value: string, label: string}[]>([]);
  const [santraller, setSantraller] = useState<any[]>([]);

  const bakimTipiOptions = [
    { value: 'elektrik', label: 'Elektrik Bakım' },
    { value: 'mekanik', label: 'Mekanik Bakım' },
  ];

  const durumOptions = [
    { value: 'iyi', label: 'İyi' },
    { value: 'orta', label: 'Orta' },
    { value: 'kotu', label: 'Kötü' },
  ];

  // Elektrik bakım kontrol listesi
  const elektrikKontrolleri = [
    'OG Sistemleri Kontrolü',
    'Trafo Kontrolleri',
    'AG Dağıtım Panosu',
    'İnvertör Kontrolleri',
    'Toplama Kutuları',
    'PV Modül Kontrolleri',
    'Kablo Bağlantıları',
    'Güvenlik Sistemleri',
  ];

  // Mekanik bakım kontrol listesi
  const mekanikKontrolleri = [
    'Panel Temizliği',
    'Yapısal Kontroller',
    'Kablo Kontrolleri',
    'Güvenlik Ekipmanları',
    'Montaj Elemanları',
    'Çelik Konstrüksiyon',
    'İzolasyon Kontrolleri',
    'Mekanik Bağlantılar',
  ];

  const kontrolListesiItems = bakimTipi === 'elektrik' ? elektrikKontrolleri : mekanikKontrolleri;

  // Santral ve saha verilerini yükle
  useEffect(() => {
    const loadData = async () => {
      if (!company?.id) return;
      
      try {
        // Santralleri yükle
        const santrallerData = await getAllSantraller(company.id, userProfile?.rol, userProfile?.santraller as any);
        setSantraller(santrallerData);
        setSantralOptions(santrallerData.map(s => ({ value: s.id, label: s.ad })));
        
        // Sahaları yükle
        const sahalarData = await getAllSahalar(company.id, userProfile?.rol, userProfile?.sahalar as any);
        setSahaOptions(sahalarData.map(s => ({ value: s.id, label: s.ad })));

        // Düzenleme modunda alanları doldur
        if (initialData) {
          if (initialData.santralId) setValue('santralId', initialData.santralId);
          if (initialData.sahaId) setValue('sahaId', initialData.sahaId);
          if (initialData.bakimTipi) setValue('bakimTipi', initialData.bakimTipi);
          if (initialData.genelDurum) setValue('genelDurum', initialData.genelDurum);
          if (initialData.yapanKisi) setValue('yapanKisi', initialData.yapanKisi);
          if (initialData.kontroller && typeof initialData.kontroller === 'object') {
            setKontrolListesi(initialData.kontroller);
          }
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        toast.error('Veriler yüklenirken hata oluştu');
      }
    };
    
    loadData();
  }, [company?.id, initialData, setValue]);

  // Santral seçildiğinde ilgili sahayı otomatik seç
  useEffect(() => {
    if (selectedSantralId && santraller.length > 0) {
      const selectedSantral = santraller.find(s => s.id === selectedSantralId);
      if (selectedSantral?.sahaId) {
        setValue('sahaId', selectedSantral.sahaId);
      }
    }
  }, [selectedSantralId, santraller, setValue]);

  const handleKontrolChange = (kontrol: string, checked: boolean) => {
    setKontrolListesi(prev => ({
      ...prev,
      [kontrol]: checked
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast.error('Sadece resim dosyaları yükleyebilirsiniz.');
      return;
    }
    
    // Dosya boyutunu kontrol et (10MB)
    const invalidFiles = imageFiles.filter(file => !isValidFileSize(file, 10));
    if (invalidFiles.length > 0) {
      toast.error('Bazı dosyalar 10MB sınırını aşıyor.');
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...imageFiles].slice(0, 10)); // Max 10 dosya
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: BakimFormData) => {
    if (isMusteri) {
      toast.error('Müşteri rolünde bakım kaydı ekleme yetkiniz yok');
      return;
    }
    if (!userProfile || !company) {
      toast.error('Kullanıcı bilgileri bulunamadı.');
      return;
    }

    setIsLoading(true);
    try {
      // Tarih/saat string'ini Date objesine çevir
      const bakimDate = new Date(data.bakimTarihSaat);
      
      const bakimData: any = {
        companyId: company.id,
        santralId: data.santralId,
        sahaId: data.sahaId,
        tarih: Timestamp.fromDate(bakimDate),
        yapanKisi: data.yapanKisi, // Geriye uyumluluk için
        yapanKisiId: userProfile?.id, // Yeni: Kullanıcı ID'si (dinamik isim için)
        bakimTipi: data.bakimTipi,
        kontroller: kontrolListesi,
        genelDurum: data.genelDurum,
        notlar: data.notlar,
        fotograflar: [], // Service'de doldurulacak
      };

      // Oluşturma/Düzenleme ayrımı
      if (initialData?.id) {
        const updates: any = {
          ...bakimData,
        };
        if (data.bakimTipi === 'elektrik') {
          await bakimService.updateElectricalMaintenance(initialData.id, updates, selectedFiles);
        } else {
          await bakimService.updateMechanicalMaintenance?.(initialData.id, updates, selectedFiles);
        }
        toast.success('Bakım kaydı güncellendi!');
      } else {
        // Bakım tipine göre uygun servisi çağır
        if (data.bakimTipi === 'elektrik') {
          await bakimService.createElectricalMaintenance(bakimData, selectedFiles);
        } else {
          await bakimService.createMechanicalMaintenance(bakimData, selectedFiles);
        }
        toast.success('Bakım kaydı başarıyla oluşturuldu!');
      }

      reset();
      setSelectedFiles([]);
      setKontrolListesi({});
      onSuccess?.();
    } catch (error) {
      console.error('Bakım kaydetme hatası:', error);
      toast.error('Bakım kaydı işlenemedi. Tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Santral"
          placeholder="Santral seçiniz"
          options={santralOptions}
          error={errors.santralId?.message}
          {...register('santralId')}
          required
        />

        <Select
          label="Saha/Bölge"
          placeholder="Saha seçiniz"
          options={sahaOptions}
          error={errors.sahaId?.message}
          {...register('sahaId')}
          required
        />

        <Select
          label="Bakım Tipi"
          options={bakimTipiOptions}
          error={errors.bakimTipi?.message}
          {...register('bakimTipi')}
          required
        />

        <Input
          label="Bakım Tarihi ve Saati"
          type="datetime-local"
          error={errors.bakimTarihSaat?.message}
          {...register('bakimTarihSaat')}
          required
        />

        <Input
          label="Bakımı Yapan Kişi"
          placeholder="Tekniker adı"
          error={errors.yapanKisi?.message}
          {...register('yapanKisi')}
          required
        />
      </div>

      {/* Kontrol Listesi */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <div className="flex items-center">
            {bakimTipi === 'elektrik' ? (
              <Zap className="h-4 w-4 mr-2" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            {bakimTipi === 'elektrik' ? 'Elektrik Bakım' : 'Mekanik Bakım'} Kontrol Listesi
          </div>
        </label>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kontrolListesiItems.map((kontrol, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`kontrol_${index}`}
                  checked={kontrolListesi[kontrol] || false}
                  onChange={(e) => handleKontrolChange(kontrol, e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label 
                  htmlFor={`kontrol_${index}`}
                  className="ml-3 text-sm text-gray-700 cursor-pointer"
                >
                  {kontrol}
                </label>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Tamamlanan: {Object.values(kontrolListesi).filter(Boolean).length} / {kontrolListesiItems.length}
          </div>
        </div>
      </div>

      {/* Genel Durum */}
      <Select
        label="Genel Durum"
        options={durumOptions}
        error={errors.genelDurum?.message}
        {...register('genelDurum')}
        required
      />

      {/* Notlar */}
      <Textarea
        label="Bakım Notları"
        placeholder="Bakım sırasında tespit edilen durumlar, yapılan işlemler ve öneriler..."
        rows={4}
        error={errors.notlar?.message}
        {...register('notlar')}
      />

      {/* Fotoğraf Yükleme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bakım Fotoğrafları
          <span className="text-gray-500 text-xs ml-2">(Opsiyonel, max 10 adet)</span>
        </label>
        
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="bakim-foto-upload"
            />
            <label
              htmlFor="bakim-foto-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Camera className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                Bakım fotoğrafları eklemek için tıklayın
              </span>
              <span className="text-xs text-gray-500">
                PNG, JPG, GIF (Max 10MB)
              </span>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            İptal
          </Button>
        )}
        <Button type="submit" loading={isLoading} disabled={isMusteri}>
          <Wrench className="h-4 w-4 mr-2" />
          {initialData?.id ? 'Bakım Kaydını Güncelle' : 'Bakım Kaydını Oluştur'}
        </Button>
      </div>
    </form>
  );
};
