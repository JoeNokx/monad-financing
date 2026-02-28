import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/common/Button';
import api from '../../lib/api';

export function KycActions() {
  const { userId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const updateStatus = useMutation({
    mutationFn: async (status: 'APPROVED' | 'REJECTED') => {
      if (!userId) return;
      await api.patch(`/admin/kyc/${userId}/status`, { status });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] });
    },
  });

  const deleteKyc = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await api.delete(`/admin/kyc/${userId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] });
      navigate('/kyc');
    },
  });

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={updateStatus.isPending || deleteKyc.isPending}
        onClick={() => {
          if (!userId) return;
          const ok = window.confirm('Delete this KYC submission? The user will be able to submit again.');
          if (!ok) return;
          deleteKyc.mutate();
        }}
      >
        Delete
      </Button>
      <Button type="button" variant="secondary" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate('REJECTED')}>
        Reject
      </Button>
      <Button type="button" disabled={updateStatus.isPending || deleteKyc.isPending} onClick={() => updateStatus.mutate('APPROVED')}>
        Approve
      </Button>
    </div>
  );
}
