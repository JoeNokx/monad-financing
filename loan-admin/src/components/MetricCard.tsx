import type { ReactNode } from 'react';

export default function MetricCard({ title, value }: { title: string; value: ReactNode }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-sm text-gray-500">{title}</h2>
      <p className="text-xl font-bold">{value ?? '—'}</p>
    </div>
  );
}
