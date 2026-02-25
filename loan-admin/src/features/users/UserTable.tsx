import { Table } from '../../components/common/Table';

export function UserTable() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Name</th>
            <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Email</th>
            <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Created</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="py-3 pr-4 text-sm text-slate-700">—</td>
            <td className="py-3 pr-4 text-sm text-slate-700">—</td>
            <td className="py-3 pr-4 text-sm text-slate-700">—</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}
