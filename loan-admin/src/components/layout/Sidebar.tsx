import { NavLink } from 'react-router-dom';

import { NAV_ITEMS } from '../../constants/routes';
import { cn } from '../../lib/utils';

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="px-5 py-5">
        <div className="text-lg font-semibold text-slate-900">Loan Admin</div>
        <div className="mt-1 text-xs text-slate-500">Dashboard</div>
      </div>

      <nav className="px-3 pb-4">
        <div className="space-y-1">
          {NAV_ITEMS.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100',
                  isActive && 'bg-slate-100 text-slate-900',
                )
              }
              end={i.to === '/'}
            >
              {i.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}
