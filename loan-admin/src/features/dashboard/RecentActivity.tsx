import { Card } from '../../components/common/Card';

export function RecentActivity() {
  return (
    <Card>
      <div className="text-base font-semibold text-slate-900">Recent Activity</div>
      <div className="mt-2 text-sm text-slate-600">No activity yet.</div>
    </Card>
  );
}
