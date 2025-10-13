import React, { useState } from 'react';
import { Modal, Button, Input, Textarea } from '../ui';
import { getPlanById } from '../../config/saas.config';
import { createUpgradeRequest } from '../../services/subscriptionRequestService';
import { toast } from 'react-hot-toast';

interface UpgradeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName?: string;
  planPrice?: number;
  companyId: string;
  companyName?: string;
  currentPlanId?: string;
  requester?: { id: string; name?: string; email?: string };
}

export const UpgradeRequestModal: React.FC<UpgradeRequestModalProps> = ({
  isOpen,
  onClose,
  planId,
  planName,
  planPrice,
  companyId,
  companyName,
  currentPlanId,
  requester
}) => {
  const plan = getPlanById(planId);
  const displayName = plan?.displayName || planName || planId;
  const price = plan?.price ?? planPrice ?? 0;

  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    try {
      setIsLoading(true);
      await createUpgradeRequest({
        companyId,
        companyName,
        requestedPlanId: plan?.id || planId,
        currentPlanId,
        requestedBy: {
          id: requester?.id || 'unknown',
          name: requester?.name,
          email: requester?.email,
        },
        note
      });
      toast.success('✅ Talebiniz alındı! Ekibimiz en kısa sürede sizinle iletişime geçecektir.', {
        duration: 5000
      });
      onClose();
    } catch (e) {
      console.error('Upgrade request error', e);
      toast.error('Talep gönderilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Plan Yükseltme Talebi" size="lg">
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Yükseltilecek Plan</div>
              <div className="text-lg font-semibold text-gray-900">{displayName}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">₺{price.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Aylık ücret</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Plan Yükseltme Talebi</h3>
              <p className="text-sm text-gray-700">
                Talebiniz kaydedilecek ve en kısa sürede sizinle iletişime geçilecektir. 
                Ödeme detayları telefon görüşmesinde paylaşılacaktır.
              </p>
            </div>
          </div>
        </div>

        <Textarea
          label="İletişim Bilgileri veya Notunuz (opsiyonel)"
          value={note}
          onChange={(e: any) => setNote(e.target.value)}
          placeholder="Örn: En hızlı şekilde ulaşabileceğiniz telefon numarası veya tercih ettiğiniz iletişim saati..."
          rows={4}
        />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>İptal</Button>
          <Button onClick={submit} disabled={isLoading} className="min-w-[160px]">
            Talebi Gönder
          </Button>
        </div>
      </div>
    </Modal>
  );
};
