import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, MapPin, Zap, Calculator, Calendar, DollarSign, Camera } from 'lucide-react';
import { Button, Input, Textarea } from '../ui';
import { Select } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../hooks/useCompany';
import { checkUsageLimit } from '../../domain/subscription/service';
import { getAllSahalar } from '../../services/sahaService';
import { createSantral, updateSantral, getAllSantraller } from '../../services/santralService';
import { uploadSantralPhotos, formatFileSize, isValidFileSize, isValidImageType } from '../../services/storageService';
import toast from 'react-hot-toast';

const santralSchema = z.object({
  ad: z.string().min(2, 'Santral adı en az 2 karakter olmalıdır'),
  sahaId: z.string().min(1, 'Saha seçimi zorunludur'),
  kapasite: z.number().min(1, 'Kapasite 1 kW\'dan büyük olmalıdır'),
  kurulumTarihi: z.string().min(1, 'Kurulum tarihi zorunludur'),
  // 12 aylık tahmini üretim değerleri (manuel giriş)
  aylikTahminler: z.object({
    ocak: z.number().min(0, 'Ocak üretim tahmini 0\'dan büyük olmalıdır'),
    subat: z.number().min(0, 'Şubat üretim tahmini 0\'dan büyük olmalıdır'),
    mart: z.number().min(0, 'Mart üretim tahmini 0\'dan büyük olmalıdır'),
    nisan: z.number().min(0, 'Nisan üretim tahmini 0\'dan büyük olmalıdır'),
    mayis: z.number().min(0, 'Mayıs üretim tahmini 0\'dan büyük olmalıdır'),
    haziran: z.number().min(0, 'Haziran üretim tahmini 0\'dan büyük olmalıdır'),
    temmuz: z.number().min(0, 'Temmuz üretim tahmini 0\'dan büyük olmalıdır'),
    agustos: z.number().min(0, 'Ağustos üretim tahmini 0\'dan büyük olmalıdır'),
    eylul: z.number().min(0, 'Eylül üretim tahmini 0\'dan büyük olmalıdır'),
    ekim: z.number().min(0, 'Ekim üretim tahmini 0\'dan büyük olmalıdır'),
    kasim: z.number().min(0, 'Kasım üretim tahmini 0\'dan büyük olmalıdır'),
    aralik: z.number().min(0, 'Aralık üretim tahmini 0\'dan büyük olmalıdır'),
  }),
  // Panel bilgileri
  panelSayisi: z.number().min(1, 'Panel sayısı 1\'den büyük olmalıdır').optional(),
  panelGucu: z.number().min(0, 'Panel gücü 0\'dan büyük olmalıdır').optional(),
  inverterSayisi: z.number().min(1, 'İnverter sayısı 1\'den büyük olmalıdır').optional(),
  aciklama: z.string().optional(),
});

type SantralFormData = z.infer<typeof santralSchema>;

interface SantralFormProps {
  santral?: any;
  onSuccess?: (santral?: any) => void;
  onCancel: () => void;
}

interface Saha {
  id: string;
  ad: string;
  musteriAdi: string;
  konum: {
    adres: string;
  };
}

export const SantralForm: React.FC<SantralFormProps> = ({ santral, onSuccess, onCancel }) => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [sahalar, setSahalar] = useState<Saha[]>([]);
  const [isLoadingSahalar, setIsLoadingSahalar] = useState(true);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: number]: number}>({});
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<SantralFormData>({
    resolver: zodResolver(santralSchema),
    defaultValues: {
      ad: santral?.ad || '',
      sahaId: santral?.sahaId || '',
      kapasite: santral?.kapasite || 0,
      kurulumTarihi: santral?.kurulumTarihi ? santral.kurulumTarihi.toDate().toISOString().split('T')[0] : '',
      // 12 aylık tahmini üretim değerleri (boş başlar, kullanıcı doldurur)
      aylikTahminler: {
        ocak: santral?.aylikTahminler?.ocak || 0,
        subat: santral?.aylikTahminler?.subat || 0,
        mart: santral?.aylikTahminler?.mart || 0,
        nisan: santral?.aylikTahminler?.nisan || 0,
        mayis: santral?.aylikTahminler?.mayis || 0,
        haziran: santral?.aylikTahminler?.haziran || 0,
        temmuz: santral?.aylikTahminler?.temmuz || 0,
        agustos: santral?.aylikTahminler?.agustos || 0,
        eylul: santral?.aylikTahminler?.eylul || 0,
        ekim: santral?.aylikTahminler?.ekim || 0,
        kasim: santral?.aylikTahminler?.kasim || 0,
        aralik: santral?.aylikTahminler?.aralik || 0,
      },
      panelSayisi: santral?.panelSayisi || undefined,
      panelGucu: santral?.panelGucu || undefined,
      inverterSayisi: santral?.inverterSayisi || undefined,
      aciklama: santral?.aciklama || '',
    },
  });

  // Sahaları getir
  const fetchSahalar = async () => {
    if (!userProfile?.companyId) return;
    
    setIsLoadingSahalar(true);
    try {
      const sahaListesi = await getAllSahalar(
        userProfile.companyId,
        userProfile.rol,
        userProfile.sahalar as string[]
      );
      setSahalar(sahaListesi);
    } catch (error) {
      console.error('Sahalar getirme hatası:', error);
      toast.error('Sahalar getirilemedi');
      setSahalar([]);
    } finally {
      setIsLoadingSahalar(false);
    }
  };

  useEffect(() => {
    fetchSahalar();
  }, [userProfile?.companyId]);

  // Aylık tahminler değiştiğinde yıllık toplamı hesapla
  const aylikTahminler = watch('aylikTahminler');

  useEffect(() => {
    if (aylikTahminler) {
      const yillikToplam = Object.values(aylikTahminler).reduce((toplam, aylik) => toplam + (aylik || 0), 0);
      // Yıllık hedefi form dışında tutuyoruz, sadece hesaplama için
    }
  }, [aylikTahminler]);

  // Resim seçme fonksiyonu
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      fileArray.forEach(file => {
        // Dosya tipi kontrolü
        if (!isValidImageType(file)) {
          invalidFiles.push(`${file.name}: Geçersiz dosya tipi`);
          return;
        }

        // Dosya boyutu kontrolü (10MB)
        if (!isValidFileSize(file, 10)) {
          invalidFiles.push(`${file.name}: ${formatFileSize(file.size)} - 10MB'dan büyük`);
          return;
        }

        validFiles.push(file);
      });

      // Geçersiz dosyalar varsa uyarı ver
      if (invalidFiles.length > 0) {
        toast.error(`Bazı dosyalar seçilemedi:\n${invalidFiles.join('\n')}`, {
          duration: 6000,
        });
      }

      // Geçerli dosyaları ekle
      if (validFiles.length > 0) {
        setSelectedImages(prev => [...prev, ...validFiles]);
        
        // Preview oluştur
        validFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              setPreviewImages(prev => [...prev, e.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        });

        toast.success(`${validFiles.length} resim seçildi`);
      }
    }

    // Input'u temizle (aynı dosyaları tekrar seçebilmek için)
    event.target.value = '';
  };

  // Resim silme fonksiyonu
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SantralFormData) => {
    if (!userProfile) {
      toast.error('Lütfen önce giriş yapın!');
      return;
    }

    if (!userProfile.companyId) {
      toast.error('Şirket bilgileri bulunamadı. Lütfen profil ayarlarınızı kontrol edin.');
      return;
    }

    setIsLoading(true);
    try {
      // Limit kontrolü (sadece yeni oluşturma)
      if (!santral) {
        const santraller = await getAllSantraller(userProfile.companyId);
        const currentCount = santraller.length;
        const limitCheck = await checkUsageLimit(userProfile.companyId, 'santraller', currentCount);
        
        if (!limitCheck.allowed) {
          toast.error(`Santral limiti dolu (${currentCount}/${limitCheck.limit}). Planınızı yükseltin.`);
          setIsLoading(false);
          return;
        }
      }
      // Seçilen saha bilgilerini bul
      const selectedSaha = sahalar.find(s => s.id === data.sahaId);
      
      // Yıllık hedefi aylık tahminlerden hesapla
      const yillikHedefUretim = Object.values(data.aylikTahminler).reduce((toplam, aylik) => toplam + (aylik || 0), 0);
      
      // Önce santralı oluştur, sonra resimleri yükle
      let resimUrls: string[] = [];
      
      // Eğer düzenleme modundaysa ve yeni resim yoksa mevcut resimleri koru
      if (santral && selectedImages.length === 0) {
        resimUrls = santral.resimler || [];
      }
      
      const santralData: any = {
        ...data,
        companyId: userProfile.companyId,
        sahaAdi: selectedSaha?.ad || 'Bilinmiyor',
        musteriAdi: selectedSaha?.musteriAdi || 'Bilinmiyor',
        konum: {
          lat: 0, // Saha koordinatlarından alınacak
          lng: 0,
          adres: selectedSaha?.konum?.adres || ''
        },
        durum: 'aktif' as const,
        sonUretim: 0,
        performans: 0,
        toplamUretim: 0,
        musteriSayisi: 1,
        aktif: true,
        yillikHedefUretim,
        aylikHedefUretim: Math.round(yillikHedefUretim / 12), // Eklendi
        gunlukHedefUretim: Math.round(yillikHedefUretim / 365), // Eklendi
        yazVerimlilikOrani: 85, // Varsayılan % değer
        kisVerimlilikOrani: 65, // Varsayılan % değer
        // Varsayılan ekonomik değerler
        elektrikFiyati: 1.85, // TL/kWh
        dagitimBedeli: 0.45,  // TL/kWh
        resimler: resimUrls,
        kapakResmi: resimUrls[0] || null,
        kurulumTarihi: new Date(data.kurulumTarihi)
      };

      // Firebase'e santral ekle/güncelle
      let santralId: string;
      if (santral) {
        santralId = santral.id;
        await updateSantral(santral.id, santralData);
        toast.success('Santral güncellendi!');
      } else {
        const result = await createSantral(santralData);
        santralId = result.id;
        toast.success('Santral eklendi!');
        console.log('Yeni santral oluşturuldu:', result);
      }

      // Resim yükleme işlemi
      if (selectedImages.length > 0) {
        setIsUploadingImages(true);
        try {
          console.log('🔍 DEBUG - Upload bilgileri:');
          console.log('📋 SantralId:', santralId);
          console.log('🏢 CompanyId:', userProfile.companyId);
          console.log('👤 User Profile:', userProfile);
          console.log('📸 Resim sayısı:', selectedImages.length);
          
          toast.loading('Resimler yükleniyor...', { id: 'upload-images' });
          
          const uploadedUrls = await uploadSantralPhotos(
            selectedImages,
            santralId,
            userProfile.companyId
          );

          // Santralı resim URL'leri ile güncelle
          if (uploadedUrls && uploadedUrls.length > 0) {
            await updateSantral(santralId, {
              kapakResmi: uploadedUrls[0], // İlk resmi kapak resmi olarak ayarla
              resimler: uploadedUrls
            });
          }

          toast.success('Resimler başarıyla yüklendi!', { id: 'upload-images' });
        } catch (error) {
          console.error('Resim yükleme hatası:', error);
          toast.error('Resimler yüklenirken hata oluştu!', { id: 'upload-images' });
        } finally {
          setIsUploadingImages(false);
          setUploadProgress({});
        }
      }
      
      reset();
      setSelectedImages([]);
      setPreviewImages([]);
      onSuccess?.(santralData);
    } catch (error) {
      console.error('Santral işlemi hatası:', error);
      toast.error('Santral işlemi başarısız oldu');
    } finally {
      setIsLoading(false);
    }
  };

  const sahaOptions = sahalar.map(saha => ({
    value: saha.id,
    label: `${saha.ad} (${saha.musteriAdi})`
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Temel Bilgiler */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Sun className="h-5 w-5 text-yellow-500" />
          Temel Bilgiler
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Santral Adı"
            placeholder="Örn: Güneş Santralı #1"
            error={errors.ad?.message}
            {...register('ad')}
            required
          />
          
          <div>
            <Select
              label="Bağlı Saha"
              options={sahaOptions}
              placeholder="Saha seçin..."
              error={errors.sahaId?.message}
              {...register('sahaId')}
              required
              disabled={isLoadingSahalar}
            />
            {isLoadingSahalar && (
              <p className="text-xs text-gray-500 mt-1">Sahalar yükleniyor...</p>
            )}
            {sahalar.length === 0 && !isLoadingSahalar && (
              <p className="text-xs text-orange-600 mt-1">
                Önce bir saha eklemeniz gerekiyor.
              </p>
            )}
          </div>
          
          <Input
            label="Kurulu Güç (kW)"
            type="number"
            placeholder="Örn: 1500"
            error={errors.kapasite?.message}
            {...register('kapasite', { valueAsNumber: true })}
            required
          />
          
          <Input
            label="Kurulum Tarihi"
            type="date"
            error={errors.kurulumTarihi?.message}
            {...register('kurulumTarihi')}
            required
          />
        </div>
      </div>



      {/* 12 Aylık Tahmini Üretim Değerleri */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          12 Aylık Tahmini Üretim Değerleri (kWh)
        </h3>
        <p className="text-sm text-gray-600">
          Her ay için tahmini üretim değerlerini manuel olarak girin. Bu değerler yıllık hedef üretimi hesaplamak için kullanılacaktır.
        </p>
        
        {/* İlk 6 ay */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Input
            label="Ocak"
            type="number"
            placeholder="kWh"
            error={errors.aylikTahminler?.ocak?.message}
            {...register('aylikTahminler.ocak', { valueAsNumber: true })}
            required
          />
          <Input
            label="Şubat"
            type="number"
            placeholder="kWh"
            error={errors.aylikTahminler?.subat?.message}
            {...register('aylikTahminler.subat', { valueAsNumber: true })}
            required
          />
          <Input
            label="Mart"
            type="number"
            placeholder="kWh"
            error={errors.aylikTahminler?.mart?.message}
            {...register('aylikTahminler.mart', { valueAsNumber: true })}
            required
          />
          <Input
            label="Nisan"
            type="number"
            placeholder="kWh"
            error={errors.aylikTahminler?.nisan?.message}
            {...register('aylikTahminler.nisan', { valueAsNumber: true })}
            required
          />
          <Input
            label="Mayıs"
            type="number"
            placeholder="kWh"
            error={errors.aylikTahminler?.mayis?.message}
            {...register('aylikTahminler.mayis', { valueAsNumber: true })}
            required
          />
          <Input
            label="Haziran"
            type="number"
            placeholder="kWh"
            error={errors.aylikTahminler?.haziran?.message}
            {...register('aylikTahminler.haziran', { valueAsNumber: true })}
            required
          />
        </div>

        {/* Son 6 ay */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Input
            label="Temmuz"
            type="number"
            placeholder="kWh"
            error={errors.aylikTahminler?.temmuz?.message}
            {...register('aylikTahminler.temmuz', { valueAsNumber: true })}
            required
          />
          <Input
            label="Ağustos"
            type="number"
            placeholder="kWh"
            error={errors.aylikTahminler?.agustos?.message}
            {...register('aylikTahminler.agustos', { valueAsNumber: true })}
            required
          />
          <Input
            label="Eylül"
            type="number"
            placeholder="kWh"
            error={errors.aylikTahminler?.eylul?.message}
            {...register('aylikTahminler.eylul', { valueAsNumber: true })}
            required
          />
          <Input
            label="Ekim"
            type="number"
            placeholder="kWh"
            error={errors.aylikTahminler?.ekim?.message}
            {...register('aylikTahminler.ekim', { valueAsNumber: true })}
            required
          />
          <Input
            label="Kasım"
            type="number"
            placeholder="kWh"
            error={errors.aylikTahminler?.kasim?.message}
            {...register('aylikTahminler.kasim', { valueAsNumber: true })}
            required
          />
          <Input
            label="Aralık"
            type="number"
            placeholder="kWh"
            error={errors.aylikTahminler?.aralik?.message}
            {...register('aylikTahminler.aralik', { valueAsNumber: true })}
            required
          />
        </div>

        {/* Yıllık toplam göstergesi */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Yıllık Toplam Tahmini:</span>
            <span className="text-lg font-bold text-blue-900">
              {Object.values(aylikTahminler || {}).reduce((toplam, aylik) => toplam + (aylik || 0), 0).toLocaleString()} kWh
            </span>
          </div>
        </div>
      </div>

      {/* Teknik Detaylar */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-500" />
          Teknik Detaylar (Opsiyonel)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Panel Sayısı"
            type="number"
            placeholder="Örn: 600"
            error={errors.panelSayisi?.message}
            {...register('panelSayisi', { valueAsNumber: true })}
          />
          
          <Input
            label="Panel Gücü (W)"
            type="number"
            placeholder="Örn: 450"
            error={errors.panelGucu?.message}
            {...register('panelGucu', { valueAsNumber: true })}
          />
          
          <Input
            label="İnverter Sayısı"
            type="number"
            placeholder="Örn: 3"
            error={errors.inverterSayisi?.message}
            {...register('inverterSayisi', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Santral Resimleri */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Camera className="h-5 w-5 text-green-500" />
          Santral Resimleri
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resim Ekle
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="block w-full text-sm text-gray-500 
                file:mr-4 file:py-2 file:px-4 
                file:rounded-full file:border-0 
                file:text-sm file:font-semibold 
                file:bg-blue-50 file:text-blue-700 
                hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, JPEG formatları desteklenir. Maksimum dosya boyutu: 10MB. Birden fazla resim seçebilirsiniz.
            </p>
          </div>

          {/* Resim Önizlemeleri */}
          {previewImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seçilen Resimler
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewImages.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Önizleme ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    
                    {/* Upload Progress */}
                    {isUploadingImages && uploadProgress[index] !== undefined && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="text-white text-center">
                          <div className="text-sm">Yükleniyor...</div>
                          <div className="text-xs">%{Math.round(uploadProgress[index])}</div>
                          <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[index]}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={isUploadingImages}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      ×
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Kapak
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Açıklama */}
      <div>
        <Textarea
          label="Açıklama"
          placeholder="Santral hakkında ek bilgiler..."
          rows={3}
          error={errors.aciklama?.message}
          {...register('aciklama')}
        />
      </div>

      {/* Butonlar */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel}
          disabled={isLoading}
        >
          İptal
        </Button>
        <Button 
          type="submit"
          loading={isLoading || isUploadingImages}
          disabled={isLoading || isUploadingImages}
        >
          {isUploadingImages 
            ? 'Resimler Yükleniyor...' 
            : santral ? 'Santralı Güncelle' : 'Santralı Ekle'
          }
        </Button>
      </div>
    </form>
  );
};
