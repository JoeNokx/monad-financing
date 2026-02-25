import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import MetricCard from '../components/MetricCard';

export default function Dashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/metrics');
      return res.data;
    },
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Users" value={metrics?.totalUsers} />
        <MetricCard title="Active Loans" value={metrics?.activeLoans} />
        <MetricCard title="Loan Volume" value={`GHS ${metrics?.loanVolume}`} />
        <MetricCard title="Default Rate" value={`${metrics?.defaultRate}%`} />
      </div>
    </div>
  );
}
