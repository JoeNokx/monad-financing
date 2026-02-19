import { createApiClient } from './api';

type LoanServiceOptions = {
  getToken?: () => Promise<string | null>;
};

export function createLoanService(options: LoanServiceOptions = {}) {
  const api = createApiClient({ getToken: options.getToken });

  return {
    me: () => api.request<unknown>({ path: '/api/users/me' }),

    listLoans: () => api.request<unknown>({ path: '/api/loans' }),

    getLoan: (loanId: string) => api.request<unknown>({ path: `/api/loans/${loanId}` }),

    applyLoan: (body: unknown) => api.request<unknown>({ method: 'POST', path: '/api/loans/apply', body }),

    repayLoan: (loanId: string, body: unknown) =>
      api.request<unknown>({ method: 'POST', path: `/api/loans/${loanId}/repay`, body }),
  };
}
