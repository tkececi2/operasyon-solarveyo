import React, { useState } from 'react';
import { Modal, Button, Input, Textarea } from '../ui';
import { SAAS_CONFIG, getPlanById } from '../../config/saas.config';
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

  const bank = SAAS_CONFIG.PAYMENT.bankTransfer;
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
      toast.success('Yükseltme talebiniz iletildi. Onay sonrası planınız güncellenecek.');
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

        <div className="bg-gray-50 p-4 rounded">
          <div className="font-medium text-gray-900 mb-1">Banka Havalesi / EFT Bilgileri</div>
          <div className="text-sm text-gray-700 space-y-1">
            <div><strong>Banka:</strong> {bank.bankName}</div>
            <div><strong>Hesap Adı:</strong> {bank.accountName}</div>
            <div><strong>IBAN:</strong> {bank.iban}</div>
            <div className="text-gray-600">{bank.instructions}</div>
          </div>
        </div>

        <Textarea
          label="Not / Açıklama (opsiyonel)"
          value={note}
          onChange={(e: any) => setNote(e.target.value)}
          placeholder="Örn: Ödemeyi bugün gerçekleştireceğiz. Fatura bilgileri..."
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
