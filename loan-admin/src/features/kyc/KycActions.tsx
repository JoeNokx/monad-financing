import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { Button } from '../../components/common/Button';
import api from '../../lib/api';

export function KycActions() {
  const { userId } = useParams();
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (status: 'APPROVED' | 'REJECTED') => {
      if (!userId) return;
      await api.patch(`/admin/kyc/${userId}/status`, { status });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] });
    },
  });

  return (
    <div className="flex gap-2">
      <Button type="button" variant="secondary" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate('REJECTED')}>
        Reject
      </Button>
      <Button type="button" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate('APPROVED')}>
        Approve
      </Button>
    </div>
  );
}
