import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppShell } from './components/layout/AppShell';
import { RouteGuard } from './components/layout/RouteGuard';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Accounts
import AccountListPage from './pages/accounts/AccountListPage';
import AccountDetailPage from './pages/accounts/AccountDetailPage';

// Customers
import CustomerListPage from './pages/customers/CustomerListPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';

// Transactions
import TransactionListPage from './pages/transactions/TransactionListPage';
import ManualTransactionPage from './pages/transactions/ManualTransactionPage';

// GL
import ChartOfAccountsPage from './pages/gl/ChartOfAccountsPage';
import TransactionCodesPage from './pages/gl/TransactionCodesPage';
import GlPeriodsPage from './pages/gl/GlPeriodsPage';
import TrialBalancePage from './pages/gl/TrialBalancePage';

// Maintenance
import InstitutionPage from './pages/maintenance/InstitutionPage';
import BranchPage from './pages/maintenance/BranchPage';
import CurrencyPage from './pages/maintenance/CurrencyPage';
import CalendarPage from './pages/maintenance/CalendarPage';

// Reports
import ReportsPage from './pages/reports/ReportsPage';

// Admin
import UserManagementPage from './pages/admin/UserManagementPage';
import RoleManagementPage from './pages/admin/RoleManagementPage';
import PermissionMatrixPage from './pages/admin/PermissionMatrixPage';
import ApprovalQueuePage from './pages/admin/ApprovalQueuePage';

// Audit
import AuditLogPage from './pages/audit/AuditLogPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — wrapped in AppShell */}
          <Route
            element={
              <RouteGuard>
                <AppShell />
              </RouteGuard>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Accounts */}
            <Route path="accounts" element={<AccountListPage />} />
            <Route path="accounts/:accountId" element={<AccountDetailPage />} />

            {/* Customers */}
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="customers/:customerId" element={<CustomerDetailPage />} />

            {/* Transactions */}
            <Route path="transactions" element={<TransactionListPage />} />
            <Route path="transactions/new" element={<ManualTransactionPage />} />

            {/* GL */}
            <Route path="gl/chart-of-accounts" element={<ChartOfAccountsPage />} />
            <Route path="gl/transaction-codes" element={<TransactionCodesPage />} />
            <Route path="gl/periods" element={<GlPeriodsPage />} />
            <Route path="gl/trial-balance" element={<TrialBalancePage />} />

            {/* Maintenance */}
            <Route path="maintenance/institution" element={<InstitutionPage />} />
            <Route path="maintenance/branches" element={<BranchPage />} />
            <Route path="maintenance/currencies" element={<CurrencyPage />} />
            <Route path="maintenance/calendar" element={<CalendarPage />} />

            {/* Reports */}
            <Route path="reports" element={<ReportsPage />} />

            {/* Administration */}
            <Route path="admin/users" element={<UserManagementPage />} />
            <Route path="admin/roles" element={<RoleManagementPage />} />
            <Route path="admin/permissions" element={<PermissionMatrixPage />} />
            <Route path="admin/approvals" element={<ApprovalQueuePage />} />

            {/* Audit */}
            <Route path="audit" element={<AuditLogPage />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
