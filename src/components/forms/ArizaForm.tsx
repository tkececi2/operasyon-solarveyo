import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, MapPin, Camera } from 'lucide-react';
import { Button, Input, Textarea, Select } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { arizaService, getAllSantraller, getAllSahalar } from '../../services';
import type { Fault } from '../../types';
import { isValidImageType, isValidFileSize } from '../../services/storageService';
import toast from 'react-hot-toast';

const arizaSchema = z.object({
  baslik: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),
  aciklama: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
  santral: z.string().min(1, 'Santral seçimi zorunludur'),
  saha: z.string().min(1, 'Saha bilgisi zorunludur'),
  oncelik: z.enum(['dusuk', 'normal', 'yuksek', 'kritik']),
  konum: z.string().optional(),
  arizaTarihi: z.string().optional(),
  cozumTarihi: z.string().optional(),
});

type ArizaFormData = z.infer<typeof arizaSchema>;

interface ArizaFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  fault?: Fault | null;
}

export const ArizaForm: React.FC<ArizaFormProps> = ({ onSuccess, onCancel, fault }) => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const isMusteri = userProfile?.rol === 'musteri';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ArizaFormData>({
    resolver: zodResolver(arizaSchema),
    defaultValues: {
      oncelik: 'normal',
      arizaTarihi: new Date().toISOString().slice(0,16),
    },
  });

  const selectedSantralId = watch('santral');

  // Fault değiştiğinde formu doldur
  useEffect(() => {
    if (fault) {
      reset({
        baslik: fault.baslik,
        aciklama: fault.aciklama,
        santral: fault.santralId,
        saha: fault.saha,
        oncelik: fault.oncelik,
        konum: fault.konum || '',
        arizaTarihi: fault.olusturmaTarihi ? new Date(fault.olusturmaTarihi.toDate ? fault.olusturmaTarihi.toDate() : fault.olusturmaTarihi).toISOString().slice(0,16) : undefined,
        cozumTarihi: fault.cozumTarihi ? new Date(fault.cozumTarihi.toDate ? fault.cozumTarihi.toDate() : fault.cozumTarihi).toISOString().slice(0,16) : undefined,
      });
    }
  }, [fault, reset]);

  // Santral seçenekleri - gerçek verilerden gelecek
  const [santralOptions, setSantralOptions] = useState<{value: string, label: string}[]>([]);
  const [santraller, setSantraller] = useState<any[]>([]);
  const [sahaOptions, setSahaOptions] = useState<{value: string, label: string}[]>([]);

  // Şirkete ait santralleri ve sahaları çek
  useEffect(() => {
    const load = async () => {
      try {
        if (!company?.id) return;
        
        // Santralleri yükle (rol bazlı izolasyon)
        const santralList = await getAllSantraller(
          company.id,
          userProfile?.rol,
          userProfile?.santraller
        );
        setSantraller(santralList);
        setSantralOptions(santralList.map((s:any) => ({ value: s.id, label: s.ad })));
        
        // Sahaları yükle (rol bazlı izolasyon)
        const sahaList = await getAllSahalar(
          company.id,
          userProfile?.rol,
          userProfile?.sahalar
        );
        setSahaOptions(sahaList.map((s:any) => ({ value: s.ad, label: s.ad })));
      } catch (e) {
        console.error('Veriler yüklenemedi', e);
      }
    };
    load();
  }, [company?.id]);

  // Santral seçildiğinde ilgili sahayı otomatik doldur
  useEffect(() => {
    if (selectedSantralId && santraller.length > 0) {
      const selectedSantral = santraller.find(s => s.id === selectedSantralId);
      if (selectedSantral) {
        // Önce sahaId ile saha adını bulmaya çalış
        if (selectedSantral.sahaId) {
          const saha = sahaOptions.find(s => s.value === selectedSantral.sahaAdi || s.label === selectedSantral.sahaAdi);
          if (saha) {
            setValue('saha', saha.value);
          } else if (selectedSantral.sahaAdi) {
            setValue('saha', selectedSantral.sahaAdi);
          }
        } else if (selectedSantral.sahaAdi) {
          setValue('saha', selectedSantral.sahaAdi);
        }
      }
    }
  }, [selectedSantralId, santraller, sahaOptions, setValue]);

  const oncelikOptions = [
    { value: 'dusuk', label: 'Düşük' },
    { value: 'normal', label: 'Normal' },
    { value: 'yuksek', label: 'Yüksek' },
    { value: 'kritik', label: 'Kritik' },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Dosya validasyonu
    const validFiles = files.filter(file => {
      if (!isValidImageType(file)) {
        toast.error(`${file.name}: Geçersiz dosya tipi`);
        return false;
      }
      if (!isValidFileSize(file)) {
        toast.error(`${file.name}: Dosya boyutu 10MB'dan büyük olamaz`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 dosya
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ArizaFormData) => {
    if (isMusteri) {
      toast.error('Müşteri rolünde arıza ekleme/düzenleme yetkiniz yok');
      return;
    }
    if (!userProfile || !company) {
      toast.error('Kullanıcı bilgileri bulunamadı.');
      return;
    }

    setIsLoading(true);
    try {
      if (fault && fault.id) {
        // Güncelleme
        const updates: Partial<Fault> = {
          santralId: data.santral,
          saha: data.saha,
          baslik: data.baslik,
          aciklama: data.aciklama,
          oncelik: data.oncelik,
          konum: data.konum || '',
        } as any;

        // Tarih alanları
        if (data.arizaTarihi && data.arizaTarihi.trim().length > 0) {
          (updates as any).olusturmaTarihi = new Date(data.arizaTarihi);
        }
        if (data.cozumTarihi && data.cozumTarihi.trim().length > 0) {
          (updates as any).cozumTarihi = new Date(data.cozumTarihi);
        }
        await arizaService.updateFault(fault.id, updates, selectedFiles.length > 0 ? selectedFiles : undefined);
        toast.success('Arıza başarıyla güncellendi!');
      } else {
        // Oluşturma
        const arizaData = {
          companyId: company.id,
          santralId: data.santral,
          saha: data.saha,
          baslik: data.baslik,
          aciklama: data.aciklama,
          durum: 'acik' as const,
          oncelik: data.oncelik,
          konum: data.konum || '',
          fotograflar: [],
          cozumAciklamasi: '',
          cozumFotograflari: [],
          raporlayanId: userProfile.id,
          atananKisi: '',
        };
        const createdAt = data.arizaTarihi ? new Date(data.arizaTarihi) : undefined;
        const resolvedAt = data.cozumTarihi ? new Date(data.cozumTarihi) : undefined;
        await arizaService.createFault(arizaData, selectedFiles.length > 0 ? selectedFiles : undefined, {
          createdAt,
          resolvedAt,
          durum: resolvedAt ? 'cozuldu' : 'acik'
        });
        toast.success('Arıza başarıyla kaydedildi!');
      }
      reset();
      setSelectedFiles([]);
      onSuccess?.();
    } catch (error) {
      console.error('Arıza kaydetme hatası:', error);
      toast.error('Arıza kaydedilemedi. Tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Başlık */}
        <div className="md:col-span-2">
          <Input
            label="Arıza Başlığı"
            placeholder="Örn: İnvertör #3 Arızası"
            error={errors.baslik?.message}
            {...register('baslik')}
            required
          />
        </div>

        {/* Santral */}
        <Select
          label="Santral"
          placeholder="Santral seçiniz"
          options={santralOptions}
          error={errors.santral?.message}
          {...register('santral')}
          required
        />

        {/* Saha */}
        <Input
          label="Saha/Bölge"
          placeholder="Santral seçildiğinde otomatik dolar"
          error={errors.saha?.message}
          {...register('saha')}
          required
          readOnly
          className="bg-gray-50"
        />

        {/* Öncelik */}
        <Select
          label="Öncelik Seviyesi"
          options={oncelikOptions}
          error={errors.oncelik?.message}
          {...register('oncelik')}
          required
        />

        {/* Konum */}
        <Input
          label="Konum (GPS/Adres)"
          placeholder="Opsiyonel konum bilgisi"
          leftIcon={<MapPin className="h-4 w-4 text-gray-400" />}
          error={errors.konum?.message}
          {...register('konum')}
        />

        {/* Arıza Tarih-Saat */}
        <Input
          label="Arıza Tarih-Saat"
          type="datetime-local"
          error={errors.arizaTarihi?.message}
          {...register('arizaTarihi')}
        />

        {/* Çözüm Tarih-Saat (opsiyonel) */}
        <Input
          label="Çözüm Tarih-Saat (opsiyonel)"
          type="datetime-local"
          error={errors.cozumTarihi?.message}
          {...register('cozumTarihi')}
        />
      </div>

      {/* Açıklama */}
      <Textarea
        label="Detaylı Açıklama"
        placeholder="Arızanın detaylı açıklamasını yazın..."
        rows={4}
        error={errors.aciklama?.message}
        {...register('aciklama')}
        required
      />

      {/* Fotoğraf Yükleme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fotoğraflar
          <span className="text-gray-500 text-xs ml-2">(Opsiyonel, max 5 adet)</span>
        </label>
        
        <div className="space-y-3">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="foto-upload"
            />
            <label
              htmlFor="foto-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Camera className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                Fotoğraf eklemek için tıklayın veya sürükleyin
              </span>
              <span className="text-xs text-gray-500">
                PNG, JPG, GIF (Max 10MB)
              </span>
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
          {fault ? 'Arızayı Güncelle' : 'Arıza Kaydını Oluştur'}
        </Button>
      </div>
    </form>
  );
};
