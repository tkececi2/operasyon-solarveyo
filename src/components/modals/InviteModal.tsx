import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Mail, Shield } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui';
import type { UserRole } from '../../types';
import toast from 'react-hot-toast';

const inviteSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  ad: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  telefon: z.string().optional(),
  rol: z.enum(['yonetici', 'muhendis', 'tekniker', 'musteri', 'bekci']),
  sahalar: z.array(z.string()).optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (userData: InviteFormData) => Promise<void>;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  onInvite
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      rol: 'tekniker'
    }
  });

  const selectedRole = watch('rol');

  const roleOptions = [
    { value: 'yonetici', label: 'Yönetici' },
    { value: 'muhendis', label: 'Mühendis' },
    { value: 'tekniker', label: 'Tekniker' },
    { value: 'musteri', label: 'Müşteri' },
    { value: 'bekci', label: 'Bekçi' },
  ];

  const roleDescriptions = {
    yonetici: 'Şirket içi tam erişim, ekip yönetimi, tüm raporlar',
    muhendis: 'Teknik analiz, bakım planlaması, AI tavsiyeleri',
    tekniker: 'Arıza müdahale, bakım işlemleri, fotoğraf yükleme',
    musteri: 'Atandığı sahaları görüntüleme, raporları indirme',
    bekci: 'Vardiya bildirimleri, güvenlik raporları, nöbet kontrolleri'
  };

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true);
    try {
      await onInvite(data);
      toast.success('Kullanıcı davet edildi!');
      reset();
      onClose();
    } catch (error) {
      console.error('Davet gönderme hatası:', error);
      toast.error('Davet gönderilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="p-3 bg-blue-50 rounded-lg mr-4">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Yeni Kullanıcı Davet Et
            </h3>
            <p className="text-sm text-gray-600">
              Ekibinize yeni bir üye eklemek için bilgileri doldurun
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Adresi *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                {...register('email')}
                type="email"
                placeholder="ornek@email.com"
                className="pl-10"
                error={errors.email?.message}
              />
            </div>
          </div>

          {/* Ad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ad Soyad *
            </label>
            <Input
              {...register('ad')}
              placeholder="Ahmet Yılmaz"
              error={errors.ad?.message}
            />
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon
            </label>
            <Input
              {...register('telefon')}
              placeholder="05XX XXX XX XX"
              error={errors.telefon?.message}
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kullanıcı Rolü *
            </label>
            <Select
              {...register('rol')}
              options={roleOptions}
              error={errors.rol?.message}
            />
            {selectedRole && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start">
                  <Shield className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">
                    {roleDescriptions[selectedRole]}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Saha Ataması (Müşteri ve Tekniker için) */}
          {(selectedRole === 'musteri' || selectedRole === 'tekniker') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saha Ataması
              </label>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-700">
                  Saha ataması kullanıcı oluşturulduktan sonra yapılabilir.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Gönderiliyor...' : 'Davet Gönder'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
