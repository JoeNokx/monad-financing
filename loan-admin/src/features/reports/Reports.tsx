import { Card } from '../../components/common/Card';

export default function Reports() {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Reports</div>
        <div className="mt-1 text-sm text-slate-600">Generate loan and payment reports.</div>
      </div>
      <Card>
        <div className="text-sm text-slate-600">Choose a report type to view.</div>
      </Card>
    </div>
  );
}
