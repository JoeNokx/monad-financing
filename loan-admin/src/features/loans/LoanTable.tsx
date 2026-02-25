import { Table } from '../../components/common/Table';

export function LoanTable() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Loan ID</th>
            <th className="py-2 pr-4 text-xs font-semibold text-slate-500">User</th>
            <th className="py-2 pr-4 text-xs font-semibold text-slate-500">Status</th>
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
