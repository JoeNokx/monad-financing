import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export function UserForm() {
  return (
    <form className="space-y-3">
      <div>
        <div className="mb-1 text-xs font-semibold text-slate-600">Full name</div>
        <Input placeholder="Full name" />
      </div>
      <div>
        <div className="mb-1 text-xs font-semibold text-slate-600">Email</div>
        <Input placeholder="Email" type="email" />
      </div>
      <div className="flex justify-end">
        <Button type="button">Save</Button>
      </div>
    </form>
  );
}
