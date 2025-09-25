import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Building2, Mail, Phone } from 'lucide-react';
import { Button, Input, Textarea } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { createMusteri, updateMusteri } from '../../services/musteriService';
import toast from 'react-hot-toast';

const musteriSchema = z.object({
  ad: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi girin'),
  telefon: z.string().min(10, 'Telefon numarası en az 10 karakter olmalıdır'),
  adres: z.string().min(5, 'Adres en az 5 karakter olmalıdır'),
  sirket: z.string().optional(),
  notlar: z.string().optional(),
});

type MusteriFormData = z.infer<typeof musteriSchema>;

interface MusteriFormProps {
  musteri?: any; // Düzenleme için mevcut müşteri
  onSuccess?: (newMusteri?: any) => void;
  onCancel?: () => void;
}

export const MusteriForm: React.FC<MusteriFormProps> = ({ musteri, onSuccess, onCancel }) => {
  const { userProfile } = useAuth();
  const { company } = useCompany();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MusteriFormData>({
    resolver: zodResolver(musteriSchema),
    defaultValues: {
      ad: musteri?.ad || '',
      email: musteri?.email || '',
      telefon: musteri?.telefon || '',
      adres: musteri?.adres || '',
      sirket: musteri?.sirket || '',
      notlar: musteri?.notlar || '',
    },
  });

  const onSubmit = async (data: MusteriFormData) => {
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
      const musteriData = {
        ...data,
        companyId: userProfile.companyId,
        aktif: true
      };

      let result;
      if (musteri) {
        // Güncelleme
        await updateMusteri(musteri.id, musteriData);
        result = { ...musteri, ...musteriData };
      } else {
        // Yeni oluşturma
        const newId = await createMusteri(musteriData);
        result = { id: newId, ...musteriData };
      }

      reset();
      onSuccess?.(result);
    } catch (error) {
      console.error('Müşteri kaydetme hatası:', error);
      // Toast mesajı service'de gösteriliyor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Ad Soyad"
          placeholder="Müşteri adı soyadı"
          leftIcon={<User className="h-4 w-4 text-gray-400" />}
          error={errors.ad?.message}
          {...register('ad')}
          required
        />

        <Input
          label="Email"
          type="email"
          placeholder="ornek@email.com"
          leftIcon={<Mail className="h-4 w-4 text-gray-400" />}
          error={errors.email?.message}
          {...register('email')}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Telefon"
          placeholder="0532 123 45 67"
          leftIcon={<Phone className="h-4 w-4 text-gray-400" />}
          error={errors.telefon?.message}
          {...register('telefon')}
          required
        />

        <Input
          label="Şirket"
          placeholder="Şirket adı (opsiyonel)"
          leftIcon={<Building2 className="h-4 w-4 text-gray-400" />}
          error={errors.sirket?.message}
          {...register('sirket')}
        />
      </div>

      <Textarea
        label="Adres"
        placeholder="Müşteri adresi"
        rows={2}
        error={errors.adres?.message}
        {...register('adres')}
        required
      />

      <Textarea
        label="Notlar"
        placeholder="Müşteri hakkında ek notlar (opsiyonel)"
        rows={2}
        error={errors.notlar?.message}
        {...register('notlar')}
      />

      <div className="flex justify-end space-x-3 pt-6 border-t">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            İptal
          </Button>
        )}
        <Button type="submit" loading={isLoading}>
          {musteri ? 'Güncelle' : 'Müşteri Oluştur'}
        </Button>
      </div>
    </form>
  );
};
