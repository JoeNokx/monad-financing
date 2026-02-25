import { Route, Routes } from 'react-router-dom';

import Layout from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Login from '../features/auth/Login';
import Logout from '../features/auth/Logout';
import Dashboard from '../features/dashboard/Dashboard';
import Users from '../features/users/Users';
import UserDetail from '../features/users/UserDetail';
import Loans from '../features/loans/Loans';
import LoanDetail from '../features/loans/LoanDetail';
import KycVerifications from '../features/kyc/KycVerifications';
import KycDetail from '../features/kyc/KycDetail';
import Transactions from '../features/transactions/Transactions';
import TransactionDetail from '../features/transactions/TransactionDetail';
import Reports from '../features/reports/Reports';
import Settings from '../features/settings/Settings';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<Logout />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:userId" element={<UserDetail />} />
        <Route path="loans" element={<Loans />} />
        <Route path="loans/:loanId" element={<LoanDetail />} />
        <Route path="kyc" element={<KycVerifications />} />
        <Route path="kyc/:userId" element={<KycDetail />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="transactions/:transactionId" element={<TransactionDetail />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
