import React, { useEffect, useMemo, useState } from 'react';
import { createFeedback, getFeedbackForTarget, getUserFeedbackForTarget, toggleLike, deleteFeedback } from '../../services/feedbackService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/formatters';
import { z } from 'zod';
import toast from 'react-hot-toast';

interface Props {
  companyId: string;
  arizaId: string;
  sahaId?: string;
  santralId?: string;
}

// Basit müşteri geri bildirim bileşeni (MVP)
const FeedbackWidget: React.FC<Props> = ({ companyId, arizaId, sahaId, santralId }) => {
  const { userProfile } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [myFeedbackId, setMyFeedbackId] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string>('');

  const isMusteri = userProfile?.rol === 'musteri';

  // Sadece müşteri yorum/puan yapabilir
  const canInteract = useMemo(() => {
    return !!userProfile && userProfile.rol === 'musteri';
  }, [userProfile]);

  const reload = async () => {
    const list = await getFeedbackForTarget(companyId, 'ariza', arizaId, 20);
    setItems(list);
    if (userProfile?.id) {
      const mine = await getUserFeedbackForTarget(companyId, userProfile.id, 'ariza', arizaId);
      setMyFeedbackId(mine?.id || null);
      if (mine?.rating) setRating(mine.rating);
      if (mine?.comment) setComment(mine.comment);
    }
  };

  useEffect(() => {
    reload();
  }, [companyId, arizaId, userProfile?.id]);

  const submit = async () => {
    if (!userProfile) return;
    try {
      setLoading(true);
      // Doğrulama
      const schema = z.object({
        rating: z.number().min(1).max(5).optional(),
        comment: z.string().trim().min(3, 'Yorum en az 3 karakter olmalı').max(300, 'Yorum en fazla 300 karakter olabilir').optional(),
      }).refine((d) => typeof d.rating === 'number' || (d.comment && d.comment.length > 0), {
        message: 'Puan veya yorumdan en az biri olmalı',
        path: ['comment'],
      });

      const dataToSend = {
        rating: rating || undefined,
        comment: comment ? comment.trim() : undefined,
      } as { rating?: number; comment?: string };
      const parsed = schema.safeParse(dataToSend);
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message || 'Geçersiz giriş';
        setCommentError(msg);
        toast.error(msg);
        return;
      }

      setCommentError('');
      await createFeedback({
        companyId,
        targetType: 'ariza',
        targetId: arizaId,
        sahaId,
        santralId,
        userId: userProfile.id,
        userAd: userProfile.ad,
        rating: dataToSend.rating,
        comment: dataToSend.comment,
      } as any);
      setComment('');
      await reload();
    } finally {
      setLoading(false);
    }
  };

  const onToggleLike = async (fid: string) => {
    if (!userProfile) return;
    await toggleLike(fid, userProfile.id);
    await reload();
  };

  return (
    <div className="border rounded-lg p-3 space-y-3">
      <div className="font-medium text-gray-900">Geri Bildirim</div>

      {canInteract && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={()=>setRating(n)} className={`w-6 h-6 rounded-full ${rating>=n?'bg-yellow-400':'bg-gray-200'}`}></button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input value={comment} onChange={(e)=>{ setComment(e.target.value); setCommentError(''); }} placeholder="Yorum yaz (opsiyonel)" className="flex-1 border rounded px-2 py-1 text-sm" />
            <button disabled={loading} onClick={submit} className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-60">{myFeedbackId ? 'Güncelle' : 'Gönder'}</button>
          </div>
          <div className="flex items-center justify-between">
            <div className={`text-[11px] ${commentError ? 'text-red-600' : 'text-gray-500'}`}>{commentError || 'Puan veya yorumdan en az biri yeterli'}</div>
            <div className={`text-[11px] ${comment.length>300 ? 'text-red-600' : 'text-gray-400'}`}>{comment.length}/300</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.length === 0 && <div className="text-xs text-gray-500">Henüz yorum yok.</div>}
        {items.map(f => (
          <div key={f.id} className="border rounded p-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-900">{f.userAd || 'Müşteri'}</div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-500">{formatDateTime(f.createdAt)}</div>
                {/* Kendi yorumunu silme */}
                {f.userId === userProfile?.id && (
                  <button 
                    className="text-xs text-red-600 hover:text-red-700" 
                    title="Yorumu Sil"
                    onClick={async () => {
                      if (!confirm('Yorumunuzu silmek istediğinizden emin misiniz?')) return;
                      try {
                        await deleteFeedback(f.id);
                        await reload();
                        toast.success('Yorumunuz silindi');
                      } catch (err) {
                        console.error(err);
                        toast.error('Yorum silinemedi');
                      }
                    }}
                  >
                    Sil
                  </button>
                )}
              </div>
            </div>
            {f.rating && <div className="mt-1 text-yellow-600">{'★'.repeat(f.rating)}</div>}
            {f.comment && <div className="mt-1 text-gray-700">{f.comment}</div>}
            <div className="mt-2 flex items-center gap-2">
              <button onClick={()=>onToggleLike(f.id)} className="text-xs px-2 py-1 rounded border">👍 Beğen ({f.likeCount||0})</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackWidget;


