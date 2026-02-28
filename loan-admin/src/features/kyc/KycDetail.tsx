import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import api from '../../lib/api';
import type { ApiEnvelope } from '../../types/api';
import { KycActions } from './KycActions';

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
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    clerkId: string;
  };
};

export default function KycDetail() {
  const { userId } = useParams();

  const kycQuery = useQuery({
    queryKey: ['admin', 'kyc'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AdminKyc[]>>('/admin/kyc');
      return res.data.data;
    },
  });

  const kyc = (kycQuery.data ?? []).find((k) => k.userId === userId);

  if (kycQuery.isLoading) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner />
          Loading KYC...
        </div>
      </Card>
    );
  }

  if (kycQuery.isError || !userId || !kyc) {
    return (
      <Card>
        <div className="text-base font-semibold text-slate-900">KYC not found</div>
        <div className="mt-2 text-sm text-slate-600">
          <Link to="/kyc" className="text-slate-900 underline">
            Back to KYC
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-base font-semibold text-slate-900">KYC Detail</div>
          <div className="mt-1 text-sm text-slate-600">User: {kyc.user?.email ?? kyc.userId}</div>
          <div className="mt-2 text-sm text-slate-600">
            Status: <Badge>{kyc.verificationStatus}</Badge>
          </div>
        </div>
        <KycActions />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">ID Type</div>
          <div className="mt-1">{kyc.idType}</div>
        </div>
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">ID Number</div>
          <div className="mt-1">{kyc.idNumber}</div>
        </div>
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Submitted</div>
          <div className="mt-1">{new Date(kyc.createdAt).toLocaleString()}</div>
        </div>
        <div className="text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Last Updated</div>
          <div className="mt-1">{new Date(kyc.updatedAt).toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-xs font-semibold text-slate-500">ID Front</div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <a className="text-slate-900 underline" href={kyc.idImageUrl} target="_blank" rel="noreferrer">
              View
            </a>
            <a className="text-slate-900 underline" href={kyc.idImageUrl} download>
              Download
            </a>
          </div>
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
            <img src={kyc.idImageUrl} alt="KYC ID" className="h-auto w-full" />
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500">Selfie</div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <a className="text-slate-900 underline" href={kyc.selfieUrl} target="_blank" rel="noreferrer">
              View
            </a>
            <a className="text-slate-900 underline" href={kyc.selfieUrl} download>
              Download
            </a>
          </div>
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
            <img src={kyc.selfieUrl} alt="KYC Selfie" className="h-auto w-full" />
          </div>
        </div>
      </div>

      {kyc.idBackImageUrl ? (
        <div className="mt-6">
          <div className="text-xs font-semibold text-slate-500">ID Back</div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <a className="text-slate-900 underline" href={kyc.idBackImageUrl} target="_blank" rel="noreferrer">
              View
            </a>
            <a className="text-slate-900 underline" href={kyc.idBackImageUrl} download>
              Download
            </a>
          </div>
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
            <img src={kyc.idBackImageUrl} alt="KYC ID Back" className="h-auto w-full" />
          </div>
        </div>
      ) : null}
    </Card>
  );
}
