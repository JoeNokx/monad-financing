import { Card } from '../../components/common/Card';

export default function Settings() {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Settings</div>
        <div className="mt-1 text-sm text-slate-600">Manage dashboard settings.</div>
      </div>
      <Card>
        <div className="text-sm text-slate-600">Settings pages will appear here.</div>
      </Card>
    </div>
  );
}
