import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Building2, Search } from 'lucide-react';
import { Button, Input, Textarea, Select } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { checkUsageLimit } from '../../domain/subscription/service';
import { useCompany } from '../../contexts/CompanyContext';
import { createSaha, updateSaha, getAllSahalar } from '../../services/sahaService';
import { getAllMusteriler } from '../../services/musteriService';
import { searchAddress, TURKEY_CITIES } from '../../utils/googleMaps';
import MapPicker from '../maps/MapPicker';
import toast from 'react-hot-toast';

const sahaSchema = z.object({
  ad: z.string().min(2, 'Saha adı en az 2 karakter olmalıdır'),
  musteriId: z.string().optional(), // Müşteri seçimi opsiyonel
  adres: z.string().min(10, 'Adres en az 10 karakter olmalıdır'),
  kapasite: z.number().min(0, 'Kapasite 0\'dan büyük olmalıdır').optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  aciklama: z.string().optional(),
});

type SahaFormData = z.infer<typeof sahaSchema>;

interface SahaFormProps {
  saha?: any; // Düzenleme için mevcut saha
  onSuccess?: (newSaha?: any) => void;
  onCancel?: () => void;
}

export const SahaForm: React.FC<SahaFormProps> = ({ saha, onSuccess, onCancel }) => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<SahaFormData>({
    resolver: zodResolver(sahaSchema),
    defaultValues: {
      ad: saha?.ad || '',
      musteriId: saha?.musteriId || '',
      adres: saha?.konum?.adres || '',
      kapasite: saha?.toplamKapasite || 0,
      lat: saha?.konum?.lat || undefined,
      lng: saha?.konum?.lng || undefined,
      aciklama: saha?.aciklama || '',
    },
  });

  // Gerçek müşteri listesi - Firebase'den gelecek
  const [musteriOptions, setMusteriOptions] = useState<{value: string, label: string}[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Form değerlerini izle
  const watchedAddress = watch('adres');

  // Müşterileri getir
  const fetchMusteriler = async () => {
    try {
      if (!userProfile?.companyId) return;
      
      const musteriler = await getAllMusteriler(userProfile.companyId);
      const options = musteriler.map(m => ({ value: m.id, label: m.ad }));
      setMusteriOptions(options);
    } catch (error) {
      console.error('Müşteriler getirilemedi:', error);
      setMusteriOptions([]);
    }
  };

  useEffect(() => {
    fetchMusteriler();
  }, [userProfile?.companyId]);

  // Adres arama fonksiyonu
  const handleAddressSearch = async () => {
    if (!watchedAddress || watchedAddress.length < 5) {
      toast.error('Arama için en az 5 karakter girin');
      return;
    }

    setIsSearchingAddress(true);
    try {
      const coordinates = await searchAddress(watchedAddress);
      if (coordinates) {
        setValue('lat', coordinates.lat);
        setValue('lng', coordinates.lng);
        toast.success('Koordinatlar bulundu ve otomatik dolduruldu!');
      } else {
        toast.error('Adres bulunamadı. Koordinatları manuel girebilirsiniz.');
      }
    } catch (error) {
      console.error('Adres arama hatası:', error);
      toast.error('Adres arama sırasında hata oluştu');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Şehir seçimi için hızlı koordinat doldurma
  const handleCitySelect = (cityName: string) => {
    const city = TURKEY_CITIES[cityName as keyof typeof TURKEY_CITIES];
    if (city) {
      setValue('lat', city.lat);
      setValue('lng', city.lng);
      toast.success(`${cityName} koordinatları dolduruldu`);
    }
  };

  const onSubmit = async (data: SahaFormData) => {
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
      if (!saha) {
        const sahalar = await getAllSahalar(userProfile.companyId);
        const currentCount = sahalar.length;
        const limitCheck = await checkUsageLimit(userProfile.companyId, 'sahalar', currentCount);
        
        if (!limitCheck.allowed) {
          toast.error(`Saha limiti dolu (${currentCount}/${limitCheck.limit}). Planınızı yükseltin.`);
          setIsLoading(false);
          return;
        }
      }
      // Seçilen müşteriyi bul (opsiyonel)
      const selectedMusteri = data.musteriId ? musteriOptions.find(m => m.value === data.musteriId) : null;
      
      const sahaData = {
        ...data,
        companyId: userProfile.companyId,
        musteriId: data.musteriId || '', // Boş string eğer müşteri seçilmemişse
        musteriAdi: selectedMusteri?.label || 'Müşteri Atanmamış',
        konum: {
          lat: data.lat || 0,
          lng: data.lng || 0,
          adres: data.adres
        },
        aktif: true,
        toplamKapasite: data.kapasite || 0
      };

      let result;
      if (saha) {
        // Güncelleme
        await updateSaha(saha.id, sahaData);
        result = { ...saha, ...sahaData };
      } else {
        // Yeni oluşturma
        const newId = await createSaha(sahaData);
        result = { id: newId, ...sahaData };
      }

      reset();
      onSuccess?.(result);
    } catch (error) {
      console.error('Saha kaydetme hatası:', error);
      // Toast mesajı service'de gösteriliyor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Saha Adı"
          placeholder="Örn: A Blok Sahası"
          error={errors.ad?.message}
          {...register('ad')}
          required
        />

        <Select
          label="Müşteri (Opsiyonel)"
          placeholder="Müşteri seçiniz (daha sonra atayabilirsiniz)"
          options={musteriOptions}
          error={errors.musteriId?.message}
          {...register('musteriId')}
        />
      </div>

      <div className="space-y-2">
        <Textarea
          label="Adres"
          placeholder="Saha adresi detaylı olarak... (Örn: Ankara, Çankaya, Kızılay Meydanı)"
          rows={3}
          error={errors.adres?.message}
          {...register('adres')}
          required
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddressSearch}
            disabled={isSearchingAddress || !watchedAddress || watchedAddress.length < 5}
            className="flex items-center gap-1"
          >
            <Search className="h-3 w-3" />
            {isSearchingAddress ? 'Aranıyor...' : 'Koordinat Bul'}
          </Button>
          <div className="flex gap-1 flex-wrap">
            {Object.keys(TURKEY_CITIES).slice(0, 5).map(city => (
              <Button
                key={city}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCitySelect(city)}
                className="text-xs"
              >
                {city}
              </Button>
            ))}
          </div>
        </div>
        {/* Haritadan Seç */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <MapPin className="h-4 w-4 text-red-500" />
              Haritadan Seç (tıklayın veya pini sürükleyin)
            </div>
            <div className="text-xs text-gray-500">
              Enlem/Boylam alanları otomatik doldurulur
            </div>
          </div>
          <MapPicker
            value={undefined}
            onChange={(coords) => {
              setValue('lat', coords.lat);
              setValue('lng', coords.lng);
            }}
            onAddress={(addr) => {
              // Adresi kullanıcı yazıyorsa ezmemek için yalnızca boşsa doldur
              const current = watch('adres');
              if (!current || current.trim().length < 5) {
                setValue('adres', addr);
              }
            }}
            height={280}
            mapType="roadmap"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Kapasite (kW)"
          type="number"
          placeholder="Örn: 500"
          error={errors.kapasite?.message}
          {...register('kapasite', { valueAsNumber: true })}
        />
        
        <Input
          label="Enlem (Latitude)"
          type="number"
          step="any"
          placeholder="Örn: 39.9334"
          error={errors.lat?.message}
          {...register('lat', { valueAsNumber: true })}
        />
        
        <Input
          label="Boylam (Longitude)"
          type="number"
          step="any"
          placeholder="Örn: 32.8597"
          error={errors.lng?.message}
          {...register('lng', { valueAsNumber: true })}
        />
      </div>

      <Textarea
        label="Açıklama"
        placeholder="Saha hakkında ek bilgiler (opsiyonel)"
        rows={2}
        error={errors.aciklama?.message}
        {...register('aciklama')}
      />

      <div className="flex justify-end space-x-3 pt-6 border-t">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            İptal
          </Button>
        )}
        <Button type="submit" loading={isLoading}>
          {saha ? 'Güncelle' : 'Saha Oluştur'}
        </Button>
      </div>
    </form>
  );
};
