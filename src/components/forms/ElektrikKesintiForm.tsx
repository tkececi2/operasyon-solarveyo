import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Button, 
  Input, 
  Label, 
  Select,
  Textarea,
  Switch
} from '../ui';
import { getAllSahalar } from '../../services/sahaService';
import { getSantrallerBySaha } from '../../services/santralService';
import { useAuth } from '../../hooks/useAuth';
import type { PowerOutage } from '../../types';
import toast from 'react-hot-toast';
import { CalendarIcon, Clock, Zap, AlertTriangle, Building2, TrendingDown } from 'lucide-react';

const elektrikKesintiSchema = z.object({
  sahaId: z.string().min(1, 'Saha seçimi zorunludur'),
  santralId: z.string().optional(),
  baslangicTarihi: z.string().min(1, 'Başlangıç tarihi zorunludur'),
  baslangicSaati: z.string().min(1, 'Başlangıç saati zorunludur'),
  bitisTarihi: z.string().optional(),
  bitisSaati: z.string().optional(),
  neden: z.string().min(1, 'Kesinti nedeni zorunludur'),
  etkilenenKapasite: z.number().min(0, 'Etkilenen kapasite 0 veya daha büyük olmalıdır'),
  kayilanUretim: z.number().min(0).optional(),
  kayilanGelir: z.number().min(0).optional(),
  aciklama: z.string().optional(),
  kesintiBitti: z.boolean().default(false)
});

type ElektrikKesintiFormData = z.infer<typeof elektrikKesintiSchema>;

interface ElektrikKesintiFormProps {
  initialData?: PowerOutage | null;
  onSubmit: (data: Partial<PowerOutage>) => Promise<void>;
  onCancel: () => void;
}

export const ElektrikKesintiForm: React.FC<ElektrikKesintiFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const { userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sahalar, setSahalar] = useState<Array<{ value: string; label: string }>>([]);
  const [santraller, setSantraller] = useState<Array<{ value: string; label: string; kapasite: number }>>([]);
  const [selectedSaha, setSelectedSaha] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<ElektrikKesintiFormData>({
    resolver: zodResolver(elektrikKesintiSchema),
    defaultValues: {
      kesintiBitti: false,
      etkilenenKapasite: 0,
      kayilanUretim: 0,
      kayilanGelir: 0
    }
  });

  const kesintiBitti = watch('kesintiBitti');
  const selectedSantralId = watch('santralId');

  // Saha listesini yükle
  useEffect(() => {
    const loadSahalar = async () => {
      if (!userProfile?.companyId) return;
      
      try {
        // Rol bazlı görünür sahalar (musteri/tekniker/muhendis/bekci => atananlar)
        const sahaList = await getAllSahalar(userProfile.companyId, userProfile.rol, userProfile.sahalar as any);
        
        setSahalar(sahaList.map(saha => ({
          value: saha.id,
          label: saha.ad
        })));
      } catch (error) {
        console.error('Sahalar yüklenemedi:', error);
        toast.error('Sahalar yüklenemedi');
      }
    };
    
    loadSahalar();
  }, [userProfile]);

  // Saha değiştiğinde santral listesini yükle
  useEffect(() => {
    const loadSantraller = async () => {
      if (!selectedSaha || !userProfile?.companyId) {
        setSantraller([]);
        return;
      }
      
      try {
        const santralList = await getSantrallerBySaha(userProfile.companyId, selectedSaha);
        setSantraller(santralList.map(santral => ({
          value: santral.id,
          label: santral.ad,
          kapasite: santral.kapasite
        })));
      } catch (error) {
        console.error('Santraller yüklenemedi:', error);
        toast.error('Santraller yüklenemedi');
      }
    };
    
    loadSantraller();
  }, [selectedSaha, userProfile]);

  // Santral seçildiğinde kapasiteyi otomatik doldur
  useEffect(() => {
    if (selectedSantralId) {
      const santral = santraller.find(s => s.value === selectedSantralId);
      if (santral) {
        setValue('etkilenenKapasite', santral.kapasite);
      }
    }
  }, [selectedSantralId, santraller, setValue]);

  // Başlangıç verilerini yükle
  useEffect(() => {
    if (initialData) {
      const baslangicDate = initialData.baslangicTarihi.toDate();
      const bitisDate = initialData.bitisTarihi?.toDate();
      
      reset({
        sahaId: initialData.sahaId,
        santralId: initialData.santralId || '',
        baslangicTarihi: baslangicDate.toISOString().split('T')[0],
        baslangicSaati: baslangicDate.toTimeString().slice(0, 5),
        bitisTarihi: bitisDate ? bitisDate.toISOString().split('T')[0] : '',
        bitisSaati: bitisDate ? bitisDate.toTimeString().slice(0, 5) : '',
        neden: initialData.neden,
        etkilenenKapasite: initialData.etkilenenKapasite,
        kayilanUretim: initialData.kayilanUretim || 0,
        kayilanGelir: initialData.kayilanGelir || 0,
        aciklama: initialData.aciklama || '',
        kesintiBitti: !!initialData.bitisTarihi
      });
      
      setSelectedSaha(initialData.sahaId);
    }
  }, [initialData, reset]);

  const onFormSubmit = async (data: ElektrikKesintiFormData) => {
    if (userProfile?.rol === 'musteri') {
      toast.error('Müşteri rolünde kesinti kaydı oluşturma/düzenleme yetkiniz yok');
      return;
    }
    setIsSubmitting(true);
    try {
      // Tarih ve saat birleştirme
      const baslangicDateTime = new Date(`${data.baslangicTarihi}T${data.baslangicSaati}`);
      
      let submitData: Partial<PowerOutage> = {
        companyId: userProfile?.companyId || '',
        sahaId: data.sahaId,
        santralId: data.santralId || '',
        baslangicTarihi: Timestamp.fromDate(baslangicDateTime),
        neden: data.neden,
        etkilenenKapasite: data.etkilenenKapasite,
        aciklama: data.aciklama || '',
        olusturanKisi: userProfile?.id || ''
      };

      // Eğer kesinti bitti ise bitiş tarihi ekle
      if (data.kesintiBitti && data.bitisTarihi && data.bitisSaati) {
        const bitisDateTime = new Date(`${data.bitisTarihi}T${data.bitisSaati}`);
        submitData.bitisTarihi = Timestamp.fromDate(bitisDateTime);
        
        // Süreyi hesapla (dakika)
        const sureDakika = Math.floor((bitisDateTime.getTime() - baslangicDateTime.getTime()) / (1000 * 60));
        submitData.sure = sureDakika;
        
        // Kayıp değerleri varsa ekle
        if (data.kayilanUretim) {
          submitData.kayilanUretim = data.kayilanUretim;
        }
        if (data.kayilanGelir) {
          submitData.kayilanGelir = data.kayilanGelir;
        }
      }

      await onSubmit(submitData);
      toast.success(initialData ? 'Elektrik kesintisi güncellendi' : 'Elektrik kesintisi kaydedildi');
      onCancel();
    } catch (error) {
      console.error('Form gönderme hatası:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Saha Seçimi */}
      <div>
        <Label htmlFor="sahaId">
          <Zap className="w-4 h-4 inline mr-1" />
          Saha
        </Label>
        <Select
          value={selectedSaha}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedSaha(value);
            setValue('sahaId', value);
            setValue('santralId', ''); // Santral seçimini sıfırla
          }}
          placeholder="Saha seçin"
        >
          {sahalar.map((saha) => (
            <option key={saha.value} value={saha.value}>
              {saha.label}
            </option>
          ))}
        </Select>
        {errors.sahaId && (
          <p className="text-sm text-red-500 mt-1">{errors.sahaId.message}</p>
        )}
      </div>

      {/* Santral Seçimi (Opsiyonel) */}
      {santraller.length > 0 && (
        <div>
          <Label htmlFor="santralId">
            <Building2 className="w-4 h-4 inline mr-1" />
            Santral (Opsiyonel)
          </Label>
          <Select
            value={watch('santralId') || ''}
            onChange={(e) => setValue('santralId', e.target.value)}
            placeholder="Tüm sahayı etkiliyor"
          >
            <option value="">Tüm sahayı etkiliyor</option>
            {santraller.map((santral) => (
              <option key={santral.value} value={santral.value}>
                {santral.label} ({santral.kapasite} kW)
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Başlangıç Tarihi ve Saati */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="baslangicTarihi">
            <CalendarIcon className="w-4 h-4 inline mr-1" />
            Başlangıç Tarihi
          </Label>
          <Input
            type="date"
            {...register('baslangicTarihi')}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.baslangicTarihi && (
            <p className="text-sm text-red-500 mt-1">{errors.baslangicTarihi.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="baslangicSaati">
            <Clock className="w-4 h-4 inline mr-1" />
            Başlangıç Saati
          </Label>
          <Input
            type="time"
            {...register('baslangicSaati')}
          />
          {errors.baslangicSaati && (
            <p className="text-sm text-red-500 mt-1">{errors.baslangicSaati.message}</p>
          )}
        </div>
      </div>

      {/* Kesinti Bitti mi? */}
      <div className="flex items-center space-x-2">
        <Switch
          id="kesintiBitti"
          checked={kesintiBitti}
          onCheckedChange={(checked) => setValue('kesintiBitti', checked)}
        />
        <Label htmlFor="kesintiBitti">Kesinti bitti mi?</Label>
      </div>

      {/* Bitiş Tarihi ve Saati */}
      {kesintiBitti && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bitisTarihi">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Bitiş Tarihi
            </Label>
            <Input
              type="date"
              {...register('bitisTarihi')}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <Label htmlFor="bitisSaati">
              <Clock className="w-4 h-4 inline mr-1" />
              Bitiş Saati
            </Label>
            <Input
              type="time"
              {...register('bitisSaati')}
            />
          </div>
        </div>
      )}

      {/* Kesinti Nedeni */}
      <div>
        <Label htmlFor="neden">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          Kesinti Nedeni
        </Label>
        <Select
          value={watch('neden') || ''}
          onChange={(e) => setValue('neden', e.target.value)}
          placeholder="Neden seçin"
        >
          <option value="planlı-bakım">Planlı Bakım</option>
          <option value="arıza">Arıza</option>
          <option value="şebeke-kesintisi">Şebeke Kesintisi</option>
          <option value="trafo-arızası">Trafo Arızası</option>
          <option value="og-kesintisi">OG Kesintisi</option>
          <option value="invertor-arızası">İnvertör Arızası</option>
          <option value="kablo-arızası">Kablo Arızası</option>
          <option value="doğal-afet">Doğal Afet</option>
          <option value="diğer">Diğer</option>
        </Select>
        {errors.neden && (
          <p className="text-sm text-red-500 mt-1">{errors.neden.message}</p>
        )}
      </div>

      {/* Etkilenen Kapasite */}
      <div>
        <Label htmlFor="etkilenenKapasite">
          <Zap className="w-4 h-4 inline mr-1" />
          Etkilenen Kapasite (kW)
        </Label>
        <Input
          type="number"
          step="0.01"
          {...register('etkilenenKapasite', { valueAsNumber: true })}
        />
        {errors.etkilenenKapasite && (
          <p className="text-sm text-red-500 mt-1">{errors.etkilenenKapasite.message}</p>
        )}
      </div>

      {/* Kayıp Üretim ve Gelir - Sadece kesinti bittiyse göster */}
      {kesintiBitti && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="kayilanUretim">
              <TrendingDown className="w-4 h-4 inline mr-1" />
              Kayıp Üretim (kWh)
            </Label>
            <Input
              type="number"
              step="0.01"
              {...register('kayilanUretim', { valueAsNumber: true })}
              placeholder="Opsiyonel"
            />
            {errors.kayilanUretim && (
              <p className="text-sm text-red-500 mt-1">{errors.kayilanUretim.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="kayilanGelir">
              <TrendingDown className="w-4 h-4 inline mr-1" />
              Kayıp Gelir (₺)
            </Label>
            <Input
              type="number"
              step="0.01"
              {...register('kayilanGelir', { valueAsNumber: true })}
              placeholder="Opsiyonel"
            />
            {errors.kayilanGelir && (
              <p className="text-sm text-red-500 mt-1">{errors.kayilanGelir.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Açıklama */}
      <div>
        <Label htmlFor="aciklama">Açıklama</Label>
        <Textarea
          {...register('aciklama')}
          rows={3}
          placeholder="Ek bilgiler..."
        />
      </div>

      {/* Butonlar */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting || userProfile?.rol === 'musteri'}>
          {isSubmitting ? 'Kaydediliyor...' : (initialData ? 'Güncelle' : 'Kaydet')}
        </Button>
      </div>
    </form>
  );
};
