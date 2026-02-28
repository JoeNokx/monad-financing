import { useEffect, useMemo, useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Spinner } from '../../components/common/Spinner';
import api from '../../lib/api';
import type { ApiEnvelope } from '../../types/api';

type SystemSettings = {
  defaultGracePeriodDays: number;
  defaultPenaltyPerDay: string | number;
  defaultMaxPenalty: string | number;

  personalMinLoanAmount: string | number | null;
  personalMaxLoanAmount: string | number | null;
  personalDurationOptionsDays: number[];
  personalInterestRatePercent: string | number | null;
  personalServiceChargePercent: string | number | null;
  personalDefaultRepaymentFrequency: string | null;
  personalDefaultTotalInstallments: number | null;

  businessMinLoanAmount: string | number | null;
  businessMaxLoanAmount: string | number | null;
  businessDurationOptionsDays: number[];
  businessInterestRatePercent: string | number | null;
  businessServiceChargePercent: string | number | null;
  businessDefaultRepaymentFrequency: string | null;
  businessDefaultTotalInstallments: number | null;
};

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseIntList(text: string) {
  const parts = text
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const nums = parts
    .map((p) => Number(p.replace(/[^0-9]/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0);
  return nums;
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'products' | 'penalty'>('products');

  const settingsQuery = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<SystemSettings>>('/admin/settings');
      return res.data.data;
    },
  });

  const settings = settingsQuery.data ?? null;

  const productsDefaults = useMemo(() => {
    if (!settings) return null;
    return {
      personalMinLoanAmount: settings.personalMinLoanAmount === null ? '' : String(toNumber(settings.personalMinLoanAmount)),
      personalMaxLoanAmount: settings.personalMaxLoanAmount === null ? '' : String(toNumber(settings.personalMaxLoanAmount)),
      personalDurationOptionsDays: Array.isArray(settings.personalDurationOptionsDays) ? settings.personalDurationOptionsDays.join(', ') : '',
      personalInterestRatePercent: settings.personalInterestRatePercent === null ? '' : String(toNumber(settings.personalInterestRatePercent)),
      personalServiceChargePercent: settings.personalServiceChargePercent === null ? '' : String(toNumber(settings.personalServiceChargePercent)),
      personalDefaultRepaymentFrequency: settings.personalDefaultRepaymentFrequency ?? '',
      personalDefaultTotalInstallments: settings.personalDefaultTotalInstallments === null ? '' : String(settings.personalDefaultTotalInstallments ?? ''),

      businessMinLoanAmount: settings.businessMinLoanAmount === null ? '' : String(toNumber(settings.businessMinLoanAmount)),
      businessMaxLoanAmount: settings.businessMaxLoanAmount === null ? '' : String(toNumber(settings.businessMaxLoanAmount)),
      businessDurationOptionsDays: Array.isArray(settings.businessDurationOptionsDays) ? settings.businessDurationOptionsDays.join(', ') : '',
      businessInterestRatePercent: settings.businessInterestRatePercent === null ? '' : String(toNumber(settings.businessInterestRatePercent)),
      businessServiceChargePercent: settings.businessServiceChargePercent === null ? '' : String(toNumber(settings.businessServiceChargePercent)),
      businessDefaultRepaymentFrequency: settings.businessDefaultRepaymentFrequency ?? '',
      businessDefaultTotalInstallments: settings.businessDefaultTotalInstallments === null ? '' : String(settings.businessDefaultTotalInstallments ?? ''),
    };
  }, [settings]);

  const penaltyDefaults = useMemo(() => {
    if (!settings) return null;
    return {
      defaultGracePeriodDays: String(settings.defaultGracePeriodDays ?? 0),
      defaultPenaltyPerDay: String(toNumber(settings.defaultPenaltyPerDay)),
      defaultMaxPenalty: String(toNumber(settings.defaultMaxPenalty)),
    };
  }, [settings]);

  const [productsForm, setProductsForm] = useState(() => ({
    personalMinLoanAmount: '',
    personalMaxLoanAmount: '',
    personalDurationOptionsDays: '',
    personalInterestRatePercent: '',
    personalServiceChargePercent: '',
    personalDefaultRepaymentFrequency: '',
    personalDefaultTotalInstallments: '',

    businessMinLoanAmount: '',
    businessMaxLoanAmount: '',
    businessDurationOptionsDays: '',
    businessInterestRatePercent: '',
    businessServiceChargePercent: '',
    businessDefaultRepaymentFrequency: '',
    businessDefaultTotalInstallments: '',
  }));

  const [penaltyForm, setPenaltyForm] = useState(() => ({
    defaultGracePeriodDays: '',
    defaultPenaltyPerDay: '',
    defaultMaxPenalty: '',
  }));

  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    if (!settings) return;
    didInitRef.current = true;
    if (productsDefaults) setProductsForm(productsDefaults);
    if (penaltyDefaults) setPenaltyForm(penaltyDefaults);
  }, [settings, productsDefaults, penaltyDefaults]);

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      await api.patch('/admin/settings', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Settings</div>
        <div className="mt-1 text-sm text-slate-600">Configure loan products and repayment rules.</div>
      </div>

      <Card className="p-0">
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setTab('products')}
            className={`flex-1 px-4 py-3 text-sm font-semibold ${tab === 'products' ? 'text-slate-900' : 'text-slate-500'}`}
          >
            Loan Products
          </button>
          <button
            type="button"
            onClick={() => setTab('penalty')}
            className={`flex-1 px-4 py-3 text-sm font-semibold ${tab === 'penalty' ? 'text-slate-900' : 'text-slate-500'}`}
          >
            Grace & Penalty
          </button>
        </div>

        <div className="p-4">
          {settingsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Spinner />
              Loading settings...
            </div>
          ) : settingsQuery.isError || !settings ? (
            <div className="text-sm text-slate-600">Failed to load settings.</div>
          ) : tab === 'products' ? (
            <div className="space-y-6">
              <div className="text-sm text-slate-600">
                Changes apply to <span className="font-semibold text-slate-900">new loans only</span>. Active and completed loans keep their original terms.
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-slate-900">Personal Loan</div>

                  <Field label="Interest rate (%)" value={productsForm.personalInterestRatePercent} onChange={(v) => setProductsForm((s) => ({ ...s, personalInterestRatePercent: v }))} />
                  <Field label="Service charge (%)" value={productsForm.personalServiceChargePercent} onChange={(v) => setProductsForm((s) => ({ ...s, personalServiceChargePercent: v }))} />
                  <Field label="Min amount" value={productsForm.personalMinLoanAmount} onChange={(v) => setProductsForm((s) => ({ ...s, personalMinLoanAmount: v }))} />
                  <Field label="Max amount" value={productsForm.personalMaxLoanAmount} onChange={(v) => setProductsForm((s) => ({ ...s, personalMaxLoanAmount: v }))} />
                  <Field label="Duration options (days, comma-separated)" value={productsForm.personalDurationOptionsDays} onChange={(v) => setProductsForm((s) => ({ ...s, personalDurationOptionsDays: v }))} />
                  <Field label="Repayment frequency" value={productsForm.personalDefaultRepaymentFrequency} onChange={(v) => setProductsForm((s) => ({ ...s, personalDefaultRepaymentFrequency: v }))} placeholder="MONTHLY / WEEKLY" />
                  <Field label="Total installments" value={productsForm.personalDefaultTotalInstallments} onChange={(v) => setProductsForm((s) => ({ ...s, personalDefaultTotalInstallments: v }))} placeholder="e.g. 4" />
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-semibold text-slate-900">Business Loan</div>

                  <Field label="Interest rate (%)" value={productsForm.businessInterestRatePercent} onChange={(v) => setProductsForm((s) => ({ ...s, businessInterestRatePercent: v }))} />
                  <Field label="Service charge (%)" value={productsForm.businessServiceChargePercent} onChange={(v) => setProductsForm((s) => ({ ...s, businessServiceChargePercent: v }))} />
                  <Field label="Min amount" value={productsForm.businessMinLoanAmount} onChange={(v) => setProductsForm((s) => ({ ...s, businessMinLoanAmount: v }))} />
                  <Field label="Max amount" value={productsForm.businessMaxLoanAmount} onChange={(v) => setProductsForm((s) => ({ ...s, businessMaxLoanAmount: v }))} />
                  <Field label="Duration options (days, comma-separated)" value={productsForm.businessDurationOptionsDays} onChange={(v) => setProductsForm((s) => ({ ...s, businessDurationOptionsDays: v }))} />
                  <Field label="Repayment frequency" value={productsForm.businessDefaultRepaymentFrequency} onChange={(v) => setProductsForm((s) => ({ ...s, businessDefaultRepaymentFrequency: v }))} placeholder="WEEKLY / MONTHLY" />
                  <Field label="Total installments" value={productsForm.businessDefaultTotalInstallments} onChange={(v) => setProductsForm((s) => ({ ...s, businessDefaultTotalInstallments: v }))} placeholder="e.g. 8" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    const personalDurations = parseIntList(productsForm.personalDurationOptionsDays);
                    const businessDurations = parseIntList(productsForm.businessDurationOptionsDays);
                    const payload: Record<string, unknown> = {
                      personalInterestRatePercent: productsForm.personalInterestRatePercent.trim() === '' ? null : Number(productsForm.personalInterestRatePercent),
                      personalServiceChargePercent: productsForm.personalServiceChargePercent.trim() === '' ? null : Number(productsForm.personalServiceChargePercent),
                      personalMinLoanAmount: productsForm.personalMinLoanAmount.trim() === '' ? null : Number(productsForm.personalMinLoanAmount),
                      personalMaxLoanAmount: productsForm.personalMaxLoanAmount.trim() === '' ? null : Number(productsForm.personalMaxLoanAmount),
                      personalDurationOptionsDays: productsForm.personalDurationOptionsDays.trim() === '' ? null : personalDurations.length > 0 ? personalDurations : null,
                      personalDefaultRepaymentFrequency: productsForm.personalDefaultRepaymentFrequency.trim() === '' ? null : productsForm.personalDefaultRepaymentFrequency.trim(),
                      personalDefaultTotalInstallments:
                        productsForm.personalDefaultTotalInstallments.trim() === '' ? null : Number(productsForm.personalDefaultTotalInstallments),

                      businessInterestRatePercent: productsForm.businessInterestRatePercent.trim() === '' ? null : Number(productsForm.businessInterestRatePercent),
                      businessServiceChargePercent: productsForm.businessServiceChargePercent.trim() === '' ? null : Number(productsForm.businessServiceChargePercent),
                      businessMinLoanAmount: productsForm.businessMinLoanAmount.trim() === '' ? null : Number(productsForm.businessMinLoanAmount),
                      businessMaxLoanAmount: productsForm.businessMaxLoanAmount.trim() === '' ? null : Number(productsForm.businessMaxLoanAmount),
                      businessDurationOptionsDays: productsForm.businessDurationOptionsDays.trim() === '' ? null : businessDurations,
                      businessDefaultRepaymentFrequency: productsForm.businessDefaultRepaymentFrequency.trim() === '' ? null : productsForm.businessDefaultRepaymentFrequency.trim(),
                      businessDefaultTotalInstallments:
                        productsForm.businessDefaultTotalInstallments.trim() === '' ? null : Number(productsForm.businessDefaultTotalInstallments),
                    };

                    updateMutation.mutate(payload);
                  }}
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-slate-600">
                Changes apply to <span className="font-semibold text-slate-900">new loans only</span>. Existing loans keep their stored grace/penalty values.
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Grace period (days)" value={penaltyForm.defaultGracePeriodDays} onChange={(v) => setPenaltyForm((s) => ({ ...s, defaultGracePeriodDays: v }))} />
                <Field label="Penalty per day" value={penaltyForm.defaultPenaltyPerDay} onChange={(v) => setPenaltyForm((s) => ({ ...s, defaultPenaltyPerDay: v }))} />
                <Field label="Maximum penalty" value={penaltyForm.defaultMaxPenalty} onChange={(v) => setPenaltyForm((s) => ({ ...s, defaultMaxPenalty: v }))} />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    updateMutation.mutate({
                      defaultGracePeriodDays: Number(penaltyForm.defaultGracePeriodDays || '0'),
                      defaultPenaltyPerDay: Number(penaltyForm.defaultPenaltyPerDay || '0'),
                      defaultMaxPenalty: Number(penaltyForm.defaultMaxPenalty || '0'),
                    });
                  }}
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {updateMutation.isError ? <div className="mt-3 text-sm text-rose-600">Failed to save settings.</div> : null}
          {updateMutation.isSuccess ? <div className="mt-3 text-sm text-emerald-700">Settings updated.</div> : null}
        </div>
      </Card>
    </div>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-slate-600">{props.label}</div>
      <Input value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} />
    </div>
  );
}
