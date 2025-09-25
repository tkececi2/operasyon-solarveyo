import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Camera, X, Plus, Trash2, Clock, Package } from 'lucide-react';
import { Button, Input, Textarea, Select } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { getAllSantraller } from '../../services/santralService';
import { getAllSahalar } from '../../services/sahaService';
import { bakimService } from '../../services/bakimService';
import { isValidFileSize } from '../../services/storageService';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const yapilanIsSchema = z.object({
  baslik: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),
  santralId: z.string().min(1, 'Santral seçimi zorunludur'),
  sahaId: z.string().min(1, 'Saha seçimi zorunludur'),
  tarih: z.string().min(1, 'Tarih zorunludur'),
  baslangicSaati: z.string().min(1, 'Başlangıç saati zorunludur'),
  bitisSaati: z.string().min(1, 'Bitiş saati zorunludur'),
  personel: z.string().min(1, 'Personel bilgisi zorunludur'),
  yapilanIsler: z.string().min(10, 'Yapılan işler açıklaması en az 10 karakter olmalıdır'),
  aciklama: z.string().optional(),
});

type YapilanIsFormData = z.infer<typeof yapilanIsSchema>;

interface Malzeme {
  ad: string;
  miktar: string;
  birim: string;
}

interface YapilanIsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const YapilanIsForm: React.FC<YapilanIsFormProps> = ({ onSuccess, onCancel }) => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([{ ad: '', miktar: '', birim: 'adet' }]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<YapilanIsFormData>({
    resolver: zodResolver(yapilanIsSchema),
    defaultValues: {
      tarih: new Date().toISOString().split('T')[0],
      baslangicSaati: '08:00',
      bitisSaati: '17:00',
      personel: userProfile?.ad || '',
    },
  });

  const selectedSantralId = watch('santralId');

  // Santral ve saha verilerini yükle
  const [santralOptions, setSantralOptions] = useState<{value: string, label: string}[]>([]);
  const [sahaOptions, setSahaOptions] = useState<{value: string, label: string}[]>([]);
  const [santraller, setSantraller] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!company?.id) return;
      
      try {
        // Santralleri yükle
        const santrallerData = await getAllSantraller(company.id);
        setSantraller(santrallerData);
        setSantralOptions(santrallerData.map(s => ({ value: s.id, label: s.ad })));
        
        // Sahaları yükle
        const sahalarData = await getAllSahalar(company.id);
        setSahaOptions(sahalarData.map(s => ({ value: s.id, label: s.ad })));
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        toast.error('Veriler yüklenirken hata oluştu');
      }
    };
    
    loadData();
  }, [company?.id]);

  // Santral seçildiğinde ilgili sahayı otomatik seç
  useEffect(() => {
    if (selectedSantralId && santraller.length > 0) {
      const selectedSantral = santraller.find(s => s.id === selectedSantralId);
      if (selectedSantral?.sahaId) {
        setValue('sahaId', selectedSantral.sahaId);
      }
    }
  }, [selectedSantralId, santraller, setValue]);

  const birimOptions = [
    { value: 'adet', label: 'Adet' },
    { value: 'kg', label: 'Kg' },
    { value: 'metre', label: 'Metre' },
    { value: 'litre', label: 'Litre' },
    { value: 'paket', label: 'Paket' },
    { value: 'kutu', label: 'Kutu' },
  ];

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

  const addMalzeme = () => {
    setMalzemeler(prev => [...prev, { ad: '', miktar: '', birim: 'adet' }]);
  };

  const removeMalzeme = (index: number) => {
    setMalzemeler(prev => prev.filter((_, i) => i !== index));
  };

  const updateMalzeme = (index: number, field: keyof Malzeme, value: string) => {
    setMalzemeler(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const onSubmit = async (data: YapilanIsFormData) => {
    if (!userProfile || !company) {
      toast.error('Kullanıcı bilgileri bulunamadı.');
      return;
    }

    // En az bir malzeme girilmiş mi kontrol et
    const validMalzemeler = malzemeler.filter(m => m.ad && m.miktar);

    setIsLoading(true);
    try {
      const yapilanIsData = {
        companyId: company.id,
        baslik: data.baslik,
        santralId: data.santralId,
        sahaId: data.sahaId,
        tarih: Timestamp.fromDate(new Date(data.tarih)),
        baslangicSaati: data.baslangicSaati,
        bitisSaati: data.bitisSaati,
        personel: data.personel,
        yapilanIsler: data.yapilanIsler,
        aciklama: data.aciklama || '',
        kullanilanMalzemeler: validMalzemeler,
        fotograflar: [],
        olusturmaTarihi: Timestamp.now(),
      };

      // Yapılan iş kaydını oluştur
      await bakimService.createYapilanIs?.(yapilanIsData, selectedFiles);

      toast.success('İş raporu başarıyla oluşturuldu!');
      reset();
      setSelectedFiles([]);
      setMalzemeler([{ ad: '', miktar: '', birim: 'adet' }]);
      onSuccess?.();
    } catch (error) {
      console.error('İş raporu kaydetme hatası:', error);
      toast.error('İş raporu kaydedilemedi. Tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Başlık */}
      <Input
        label="İş Başlığı"
        placeholder="Örn: Panel Temizliği ve Bakımı"
        error={errors.baslik?.message}
        {...register('baslik')}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Santral */}
        <Select
          label="Santral"
          placeholder="Santral seçiniz"
          options={santralOptions}
          error={errors.santralId?.message}
          {...register('santralId')}
          required
        />

        {/* Saha */}
        <Select
          label="Saha/Bölge"
          placeholder="Saha seçiniz"
          options={sahaOptions}
          error={errors.sahaId?.message}
          {...register('sahaId')}
          required
        />

        {/* Tarih */}
        <Input
          label="Tarih"
          type="date"
          error={errors.tarih?.message}
          {...register('tarih')}
          required
        />

        {/* Personel */}
        <Input
          label="Personel"
          placeholder="İşi yapan kişi"
          error={errors.personel?.message}
          {...register('personel')}
          required
        />

        {/* Başlangıç Saati */}
        <Input
          label="Başlangıç Saati"
          type="time"
          leftIcon={<Clock className="h-4 w-4" />}
          error={errors.baslangicSaati?.message}
          {...register('baslangicSaati')}
          required
        />

        {/* Bitiş Saati */}
        <Input
          label="Bitiş Saati"
          type="time"
          leftIcon={<Clock className="h-4 w-4" />}
          error={errors.bitisSaati?.message}
          {...register('bitisSaati')}
          required
        />
      </div>

      {/* Yapılan İşler */}
      <Textarea
        label="Yapılan İşler"
        placeholder="Yapılan işleri detaylı olarak açıklayın..."
        rows={4}
        error={errors.yapilanIsler?.message}
        {...register('yapilanIsler')}
        required
      />

      {/* Kullanılan Malzemeler */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Kullanılan Malzemeler
              <span className="text-gray-500 text-xs ml-2">(Opsiyonel)</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={addMalzeme}
            >
              <Plus className="h-4 w-4 mr-1" />
              Malzeme Ekle
            </Button>
          </div>
        </label>
        
        <div className="space-y-3">
          {malzemeler.map((malzeme, index) => (
            <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
              <div className="flex-1">
                <Input
                  placeholder="Malzeme adı"
                  value={malzeme.ad}
                  onChange={(e) => updateMalzeme(index, 'ad', e.target.value)}
                />
              </div>
              <div className="w-24">
                <Input
                  placeholder="Miktar"
                  type="number"
                  value={malzeme.miktar}
                  onChange={(e) => updateMalzeme(index, 'miktar', e.target.value)}
                />
              </div>
              <div className="w-32">
                <Select
                  options={birimOptions}
                  value={malzeme.birim}
                  onChange={(e) => updateMalzeme(index, 'birim', e.target.value)}
                />
              </div>
              {malzemeler.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeMalzeme(index)}
                  className="mt-1"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Açıklama */}
      <Textarea
        label="Açıklama / Notlar"
        placeholder="Varsa ek açıklama ve notlar..."
        rows={3}
        error={errors.aciklama?.message}
        {...register('aciklama')}
      />

      {/* Fotoğraf Yükleme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          İş Fotoğrafları
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
              id="yapilanis-foto-upload"
            />
            <label
              htmlFor="yapilanis-foto-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Camera className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                İş fotoğrafları eklemek için tıklayın
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
        <Button type="submit" loading={isLoading}>
          <FileText className="h-4 w-4 mr-2" />
          İş Raporunu Kaydet
        </Button>
      </div>
    </form>
  );
};








