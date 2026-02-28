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

const PERSONAL_DAY_OPTIONS = [3, 7, 14, 21, 30, 40, 60, 90];
const BUSINESS_MONTH_OPTIONS = [3, 6, 12, 24, 36];
const BUSINESS_FREQUENCY_OPTIONS = ['WEEKLY', 'MONTHLY'] as const;

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseCsvTokens(value: string) {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
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
    const businessFreq = parseCsvTokens(settings.businessDefaultRepaymentFrequency ?? '').map((v) => v.toUpperCase());
    return {
      personalMinLoanAmount: settings.personalMinLoanAmount === null ? '' : String(toNumber(settings.personalMinLoanAmount)),
      personalMaxLoanAmount: settings.personalMaxLoanAmount === null ? '' : String(toNumber(settings.personalMaxLoanAmount)),
      personalDurationOptionsDays: Array.isArray(settings.personalDurationOptionsDays) ? settings.personalDurationOptionsDays : [],
      personalInterestRatePercent: settings.personalInterestRatePercent === null ? '' : String(toNumber(settings.personalInterestRatePercent)),
      personalServiceChargePercent: settings.personalServiceChargePercent === null ? '' : String(toNumber(settings.personalServiceChargePercent)),

      businessMinLoanAmount: settings.businessMinLoanAmount === null ? '' : String(toNumber(settings.businessMinLoanAmount)),
      businessMaxLoanAmount: settings.businessMaxLoanAmount === null ? '' : String(toNumber(settings.businessMaxLoanAmount)),
      businessDurationOptionsDays: Array.isArray(settings.businessDurationOptionsDays) ? settings.businessDurationOptionsDays : [],
      businessInterestRatePercent: settings.businessInterestRatePercent === null ? '' : String(toNumber(settings.businessInterestRatePercent)),
      businessServiceChargePercent: settings.businessServiceChargePercent === null ? '' : String(toNumber(settings.businessServiceChargePercent)),
      businessDefaultRepaymentFrequency: BUSINESS_FREQUENCY_OPTIONS.filter((f) => businessFreq.includes(f)),
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
    personalDurationOptionsDays: [] as number[],
    personalInterestRatePercent: '',
    personalServiceChargePercent: '',

    businessMinLoanAmount: '',
    businessMaxLoanAmount: '',
    businessDurationOptionsDays: [] as number[],
    businessInterestRatePercent: '',
    businessServiceChargePercent: '',
    businessDefaultRepaymentFrequency: [] as Array<(typeof BUSINESS_FREQUENCY_OPTIONS)[number]>,
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
                  <div>
                    <div className="mb-2 text-xs font-semibold text-slate-600">Repayment frequency (days)</div>
                    <div className="flex flex-wrap gap-3">
                      {PERSONAL_DAY_OPTIONS.map((d) => {
                        const checked = productsForm.personalDurationOptionsDays.includes(d);
                        return (
                          <label key={String(d)} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setProductsForm((s) => {
                                  const next = new Set(s.personalDurationOptionsDays);
                                  if (next.has(d)) next.delete(d);
                                  else next.add(d);
                                  return { ...s, personalDurationOptionsDays: Array.from(next).sort((a, b) => a - b) };
                                });
                              }}
                            />
                            {d} days
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-semibold text-slate-900">Business Loan</div>

                  <Field label="Interest rate (%)" value={productsForm.businessInterestRatePercent} onChange={(v) => setProductsForm((s) => ({ ...s, businessInterestRatePercent: v }))} />
                  <Field label="Service charge (%)" value={productsForm.businessServiceChargePercent} onChange={(v) => setProductsForm((s) => ({ ...s, businessServiceChargePercent: v }))} />
                  <Field label="Min amount" value={productsForm.businessMinLoanAmount} onChange={(v) => setProductsForm((s) => ({ ...s, businessMinLoanAmount: v }))} />
                  <Field label="Max amount" value={productsForm.businessMaxLoanAmount} onChange={(v) => setProductsForm((s) => ({ ...s, businessMaxLoanAmount: v }))} />
                  <div>
                    <div className="mb-2 text-xs font-semibold text-slate-600">Duration options (months)</div>
                    <div className="flex flex-wrap gap-3">
                      {BUSINESS_MONTH_OPTIONS.map((m) => {
                        const asDays = m * 30;
                        const checked = productsForm.businessDurationOptionsDays.includes(asDays);
                        return (
                          <label key={String(m)} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setProductsForm((s) => {
                                  const next = new Set(s.businessDurationOptionsDays);
                                  if (next.has(asDays)) next.delete(asDays);
                                  else next.add(asDays);
                                  return { ...s, businessDurationOptionsDays: Array.from(next).sort((a, b) => a - b) };
                                });
                              }}
                            />
                            {m} months
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-semibold text-slate-600">Repayment frequency</div>
                    <div className="flex flex-wrap gap-3">
                      {BUSINESS_FREQUENCY_OPTIONS.map((f) => {
                        const checked = productsForm.businessDefaultRepaymentFrequency.includes(f);
                        return (
                          <label key={f} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setProductsForm((s) => {
                                  const next = new Set(s.businessDefaultRepaymentFrequency);
                                  if (next.has(f)) next.delete(f);
                                  else next.add(f);
                                  return {
                                    ...s,
                                    businessDefaultRepaymentFrequency: BUSINESS_FREQUENCY_OPTIONS.filter((opt) => next.has(opt)) as any,
                                  };
                                });
                              }}
                            />
                            {f}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    const personalDurations = productsForm.personalDurationOptionsDays;
                    const businessDurations = productsForm.businessDurationOptionsDays;
                    const businessFreq = productsForm.businessDefaultRepaymentFrequency;
                    const payload: Record<string, unknown> = {
                      personalInterestRatePercent: productsForm.personalInterestRatePercent.trim() === '' ? null : Number(productsForm.personalInterestRatePercent),
                      personalServiceChargePercent: productsForm.personalServiceChargePercent.trim() === '' ? null : Number(productsForm.personalServiceChargePercent),
                      personalMinLoanAmount: productsForm.personalMinLoanAmount.trim() === '' ? null : Number(productsForm.personalMinLoanAmount),
                      personalMaxLoanAmount: productsForm.personalMaxLoanAmount.trim() === '' ? null : Number(productsForm.personalMaxLoanAmount),
                      personalDurationOptionsDays: personalDurations.length > 0 ? personalDurations : null,

                      businessInterestRatePercent: productsForm.businessInterestRatePercent.trim() === '' ? null : Number(productsForm.businessInterestRatePercent),
                      businessServiceChargePercent: productsForm.businessServiceChargePercent.trim() === '' ? null : Number(productsForm.businessServiceChargePercent),
                      businessMinLoanAmount: productsForm.businessMinLoanAmount.trim() === '' ? null : Number(productsForm.businessMinLoanAmount),
                      businessMaxLoanAmount: productsForm.businessMaxLoanAmount.trim() === '' ? null : Number(productsForm.businessMaxLoanAmount),
                      businessDurationOptionsDays: businessDurations.length > 0 ? businessDurations : null,
                      businessDefaultRepaymentFrequency: businessFreq.length > 0 ? businessFreq.join(',') : null,
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
