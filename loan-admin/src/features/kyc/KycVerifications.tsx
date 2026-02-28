import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Spinner } from '../../components/common/Spinner';
import { Table } from '../../components/common/Table';
import api from '../../lib/api';
import type { ApiEnvelope } from '../../types/api';

type AdminKyc = {
  id: string;
  userId: string;
  idType: string;
  idNumber: string;
  idImageUrl: string;
  idBackImageUrl?: string | null;
  selfieUrl: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    clerkId: string;
  };
};

export default function KycVerifications() {
  const [search, setSearch] = useState('');

  const kycQuery = useQuery({
    queryKey: ['admin', 'kyc'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AdminKyc[]>>('/admin/kyc');
      return res.data.data;
    },
  });

  const filtered = useMemo(() => {
    const list = kycQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((k) => {
      const email = (k.user?.email ?? '').toLowerCase();
      const userId = (k.userId ?? '').toLowerCase();
      const idNumber = (k.idNumber ?? '').toLowerCase();
      return email.includes(q) || userId.includes(q) || idNumber.includes(q);
    });
  }, [kycQuery.data, search]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">KYC Verifications</div>
        <div className="mt-1 text-sm text-slate-600">Verify user identity documents.</div>
      </div>

      <Card>
        <div className="mb-4 w-full max-w-md">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email, user id, or id number..." />
        </div>

        {kycQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Spinner />
            Loading KYC...
          </div>
        ) : kycQuery.isError ? (
          <div className="text-sm text-slate-600">Failed to load KYC submissions.</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-600">No KYC submissions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">User</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">ID Type</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">ID Number</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Status</th>
                  <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((k) => (
                  <tr key={k.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 text-sm text-slate-700">
                      <Link to={`/kyc/${k.userId}`} className="font-medium text-slate-900 hover:underline">
                        {k.user?.email ?? k.userId}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700">{k.idType}</td>
                    <td className="py-3 pr-4 text-sm text-slate-700">{k.idNumber}</td>
                    <td className="py-3 pr-4 text-sm text-slate-700">
                      <Badge>{k.verificationStatus}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700">{new Date(k.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
