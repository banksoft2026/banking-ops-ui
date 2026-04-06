# banking-ops-ui

React-based operations dashboard for the CBS (Core Banking System) platform. Provides a unified interface for managing accounts, customers, transactions, general ledger, maintenance configuration, user administration, maker-checker approvals, and audit reporting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Routing | React Router v7 |
| Server State | TanStack Query v5 |
| Client State | Zustand v5 (with localStorage persistence) |
| Forms | React Hook Form v7 + Zod v4 |
| Styling | Tailwind CSS v3 (custom design tokens) |
| HTTP | Axios (5 separate instances, one per service) |
| Charts | Recharts v3 |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- Node.js 20+ (install via [nvm](https://github.com/nvm-sh/nvm))
- All CBS backend services running (see port map below)

### Install and run

```bash
cd banking-ops-ui
npm install
npm run dev
```

The app starts on **http://localhost:5173**

### Build for production

```bash
npm run build        # TypeScript check + Vite bundle → dist/
npm run preview      # Preview the production build locally
```

---

## Login

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `Admin@2026` |

Authentication is handled by the `user-admin` service (port 8084). The access token (JWT) is stored in Zustand's persisted store and attached to all API requests via an Axios request interceptor. On 401, the user is automatically redirected to `/login`.

---

## Backend Services

The UI connects to 5 microservices via dedicated Axios instances:

| Service | Port | Axios instance | Purpose |
|---|---|---|---|
| user-admin | 8084 | `userAdminApi` | Auth, users, roles, permissions, approvals |
| cbs-maintenance | 8080 | `cbsApi` | Institution, branches, currencies, calendar, GL |
| customer-entity | 8081 | `customerApi` | Customer profiles |
| account-service | 8082 | `accountApi` | Accounts, balances |
| transaction-service | 8083 | `txnApi` | Transactions, posting |

All instances share the same JWT interceptor. If a backend service is unavailable, pages degrade gracefully with empty states rather than crashing.

---

## Pages & Routes

### Overview
| Route | Page | Description |
|---|---|---|
| `/dashboard` | Dashboard | KPI cards, recent transactions, quick actions |

### Banking
| Route | Page | Description |
|---|---|---|
| `/accounts` | Account List | Search, filter by status, paginated table |
| `/accounts/:id` | Account Detail | Balance breakdown, recent transactions |
| `/customers` | Customer List | Customer search and listing |
| `/customers/:id` | Customer Detail | Customer profile |
| `/transactions` | Transaction List | Paginated ledger view |
| `/transactions/new` | Manual Transaction | Post manual debit/credit entries |

### General Ledger
| Route | Page | Description |
|---|---|---|
| `/gl/chart-of-accounts` | Chart of Accounts | Tree view with expand/collapse |
| `/gl/transaction-codes` | Transaction Codes | GL transaction code management |
| `/gl/periods` | GL Periods | Accounting period open/close |
| `/gl/trial-balance` | Trial Balance | Debit/credit summary by GL account |

### Maintenance
| Route | Page | Description |
|---|---|---|
| `/maintenance/institution` | Institution Settings | Core institution configuration |
| `/maintenance/branches` | Branches | Branch network |
| `/maintenance/currencies` | Currencies | Currency codes and decimal places |
| `/maintenance/calendar` | Business Calendar | Working days and public holidays |

### Reporting
| Route | Page | Description |
|---|---|---|
| `/reports` | Reports | Balance report + transaction volume bar chart |

### Administration
| Route | Page | Description |
|---|---|---|
| `/admin/users` | User Management | Create, lock, unlock, suspend, activate users |
| `/admin/roles` | Role Management | Create and view roles |
| `/admin/permissions` | Permission Matrix | Role × screen permission grid |
| `/admin/approvals` | Approval Queue | Maker-checker workflow with before/after diff |

### Audit
| Route | Page | Description |
|---|---|---|
| `/audit` | Audit Log | Paginated immutable audit trail with detail modal |

---

## Project Structure

```
src/
├── App.tsx                        # Root router + QueryClientProvider
├── main.tsx                       # React entry point
├── index.css                      # Tailwind directives + component classes
├── lib/
│   ├── api.ts                     # 5 Axios instances with JWT interceptor
│   └── utils.ts                   # cn(), formatCurrency(), formatDate()
├── store/
│   ├── authStore.ts               # Zustand: user, token, isAuthenticated
│   └── uiStore.ts                 # Zustand: sidebar state, toast queue
├── types/                         # TypeScript interfaces (User, Role, Account…)
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx           # Sidebar + Topbar + Outlet wrapper
│   │   ├── Sidebar.tsx            # Navy sidebar with 5 nav groups
│   │   ├── Topbar.tsx             # Breadcrumb + user menu
│   │   └── RouteGuard.tsx         # Auth redirect wrapper
│   └── shared/
│       ├── DataTable.tsx          # Generic paginated table component
│       ├── StatusBadge.tsx        # Coloured pill for 20+ status values
│       ├── PageHeader.tsx         # Page title / subtitle / actions slot
│       ├── ConfirmModal.tsx       # Reusable confirmation dialog
│       └── ToastContainer.tsx     # Auto-dismiss toast notifications
└── pages/
    ├── auth/                      # LoginPage
    ├── dashboard/                 # DashboardPage
    ├── accounts/                  # AccountListPage, AccountDetailPage
    ├── customers/                 # CustomerListPage, CustomerDetailPage
    ├── transactions/              # TransactionListPage, ManualTransactionPage
    ├── gl/                        # ChartOfAccountsPage, TransactionCodesPage,
    │                              #   GlPeriodsPage, TrialBalancePage
    ├── maintenance/               # InstitutionPage, BranchPage,
    │                              #   CurrencyPage, CalendarPage
    ├── reports/                   # ReportsPage
    ├── admin/                     # UserManagementPage, RoleManagementPage,
    │                              #   PermissionMatrixPage, ApprovalQueuePage
    └── audit/                     # AuditLogPage
```

---

## Design System

Custom Tailwind tokens defined in `tailwind.config.js`:

```js
brand: {
  navy:        '#1B3A5C',   // sidebar background
  'navy-light':'#2A5580',   // sidebar hover
  teal:        '#0F6E56',   // success / credit
  amber:       '#854F0B',   // warning
  info:        '#185FA5',   // links / primary actions
  danger:      '#A32D2D',   // errors / debit
}
page:   '#F0F2F5'           // main background
card:   '#FFFFFF'
border: '#D8E2EC'
```

Reusable component classes in `src/index.css`:

| Class | Usage |
|---|---|
| `.btn-primary` | Primary action button (navy) |
| `.btn-secondary` | Secondary / outline button |
| `.btn-danger` | Destructive action button |
| `.btn-ghost` | Low-emphasis / icon button |
| `.input-field` | Standard form input |
| `.card` | White rounded panel with border |
