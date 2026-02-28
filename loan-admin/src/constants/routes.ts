export const ROUTES = {
  login: '/login',
  logout: '/logout',
  dashboard: '/',
  users: '/users',
  loans: '/loans',
  kyc: '/kyc',
  referrals: '/referrals',
  transactions: '/transactions',
  reports: '/reports',
  settings: '/settings',
} as const;

export const NAV_ITEMS: Array<{ label: string; to: string }> = [
  { label: 'Dashboard', to: ROUTES.dashboard },
  { label: 'Users', to: ROUTES.users },
  { label: 'Loans', to: ROUTES.loans },
  { label: 'KYC', to: ROUTES.kyc },
  { label: 'Referrals', to: ROUTES.referrals },
  { label: 'Transactions', to: ROUTES.transactions },
  { label: 'Reports', to: ROUTES.reports },
  { label: 'Settings', to: ROUTES.settings },
];
