# banking-ops-ui — Prompt History & Development Log

This file documents every prompt, the steps taken, and any issues resolved during the development of the Banking Operations UI.

---

## Prompt 1 — Initial Build: Full Banking Ops UI

**Prompt:**
> "Build full banking-ops-ui with routing, all pages, CalendarPage, build passing, git commits."

### Steps Taken
1. Scaffolded React 19 + TypeScript + Vite project with Tailwind CSS
2. Installed dependencies: `react-router-dom`, `@tanstack/react-query`, `zustand`, `axios`, `lucide-react`, `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`
3. Created `src/lib/api.ts` with 5 Axios instances (one per microservice)
4. Created `src/store/authStore.ts` (Zustand with persist) and `src/store/uiStore.ts` (toast notifications)
5. Created shared components: `PageHeader`, `DataTable`, `StatusBadge`, `AppShell`, `Sidebar`, `Topbar`, `RouteGuard`
6. Built all pages:
   - `LoginPage` — JWT login via user-admin
   - `DashboardPage` — KPI cards + recent transactions chart
   - `CustomerOnboardPage`, `CustomerListPage`, `CustomerDetailPage`
   - `EntityOnboardPage`, `EntityListPage`, `EntityDetailPage`
   - `OpenAccountPage`, `AccountListPage`, `AccountDetailPage`
   - `ManualTransactionPage`, `TransactionListPage`, `TransactionDetailPage`
   - `ApprovalQueuePage`
   - `AuditLogPage`
   - `GlAccountsPage`, `GlPeriodsPage`, `TransactionCodesPage`, `JournalEnquiryPage`
   - `CalendarPage`
   - `ReportsPage`
   - `BranchPage`, `CurrencyPage`, `ChannelsPage`, `AccountProductsPage`, `AccountProductDetailPage`, `AuthMatrixPage`, `NumberingSchemesPage`, `InstitutionPage`
   - `UserManagementPage`, `RoleManagementPage`, `PermissionMatrixPage`
7. Configured React Router with `AppShell` layout and `RouteGuard`
8. Set up Tailwind config with custom colour palette (`#1B3A5C`, `#185FA5`, `#0F6E56`, etc.)
9. Ran `npm run build` — confirmed clean TypeScript compilation

### Issues Resolved
| Issue | Fix |
|-------|-----|
| `AppShell` and `RouteGuard` were named exports but imported as default | Changed to `import { AppShell }` and `import { RouteGuard }` |
| TS6133 unused imports (`ChevronRight`, `RotateCcw`, `Role`, `User`) | Removed unused imports from Sidebar, ApprovalQueuePage, RoleManagementPage, UserManagementPage |
| TS6133 unused variables `screensLoading`, `permsLoading` in PermissionMatrixPage | Renamed to remove aliases |
| TS2322 `unknown` not assignable to `ReactNode` in AccountDetailPage | Changed `{balance.balanceAsAt && ...}` to `{!!balance.balanceAsAt && ...}` |
| Recharts Tooltip `formatter` type error | Changed `(value: number) => string` to `(value) => formatCurrency(Number(value ?? 0))` |
| Tailwind CSS missing styles warning (`content: []`) | Added `'./index.html', './src/**/*.{ts,tsx}'` to `content` array in `tailwind.config.js` |

---

## Prompt 2 — API Integration & Maintenance Module Expansion

**Prompt:**
> "Enhance bank ops UI to make sure each module is using underlying APIs. For example open account is using account master create account API and so on. Also enhance UI to include all maintenance such as customer, entity, account product, account, calendars and all modules which we have built so far. Keep maintenance items separate from bank's BAU operations items separate in menu."

### Steps Taken
1. **Menu restructure** — Split Sidebar into two sections:
   - **Operations**: Dashboard, Customers, Entities, Accounts, Transactions, Approvals, Audit, GL
   - **Maintenance**: Institution, Branches, Currencies, Channels, Account Products, Auth Matrix, Numbering Schemes, Calendars
   - **Admin**: Users, Roles, Permissions
2. **API wiring per module:**
   - `CustomerOnboardPage` → `POST /v1/customers` via `customerApi` (port 8081)
   - `EntityOnboardPage` → `POST /v1/entities` via `customerApi` (port 8081)
   - `OpenAccountPage` → `POST /v1/accounts` via `accountApi` (port 8082)
   - `ManualTransactionPage` → `POST /v1/transactions` via `txnApi` (port 8083)
   - `AccountProductsPage` → `GET/POST /v1/products` via `accountApi` (port 8082)
   - `BranchPage` → `GET/POST /v1/config/branches` via `cbsApi` (port 8080)
   - `CurrencyPage` → `GET/POST /v1/config/currencies` via `cbsApi` (port 8080)
   - `ChannelsPage` → `GET/POST /v1/config/channels` via `cbsApi` (port 8080)
   - `AuthMatrixPage` → `GET/POST /v1/config/auth-matrix` via `cbsApi` (port 8080)
   - `NumberingSchemesPage` → `GET/POST /v1/config/numbering` via `cbsApi` (port 8080)
   - `InstitutionPage` → `GET /v1/config/institution` via `cbsApi` (port 8080)
   - `CalendarPage` → `GET/POST /v1/config/calendars` via `cbsApi` (port 8080)
3. Added `DEFAULT_INSTITUTION_ID = 'INST-001'` to `src/lib/api.ts`
4. Added `useUIStore` toast notifications on all create/update operations
5. Added pagination to all list pages via `DataTable` component

### Issues Resolved
| Issue | Fix |
|-------|-----|
| `OpenAccountPage` sending flat payload instead of nested | Corrected to `{ productId, master: { accountName, customerId, branchCode, ... } }` |
| Missing `DEFAULT_INSTITUTION_ID` in maintenance pages | Exported constant from `api.ts` and imported in all maintenance pages |

---

## Prompt 3 — Full Field Coverage (Required + Optional)

**Prompt:**
> "Enhance the screens to accommodate required and optional fields based on the underlying API and data structure. The screens should have all fields except system generated fields. At the end give me a list of changes done."

### Steps Taken & Changes Per File

#### `CustomerOnboardPage.tsx`
- Expanded from ~10 fields to full `CustomerRequest` DTO
- Added 3 collapsible sections using `ChevronDown`/`ChevronRight` toggle pattern
- **New fields**: fullName, countryOfBirth, customerStatus, kycReviewDate, onboardingChannel, onboardingBranch, relationshipManagerId, relationshipSince
- **Contact sub-object**: contactType, addressLine1/2, city, stateProvince, postalCode, countryCode, phonePrimary/Secondary, mobile, emailPrimary/Secondary, contactIsPrimary
- **Document sub-object**: docType, docNumber, issuingCountry, issuingAuthority, issueDate, expiryDate, docStatus, isMandatory
- Contact and document only included in payload when `addressLine1` / `docNumber` are present

#### `EntityOnboardPage.tsx`
- Expanded from ~7 fields to full `EntityRequest` DTO with 4 collapsible sections
- **New fields**: shortName, registrationDate, industryCode, sicCode, entityStatus, kybStatus, kybReviewDate, onboardingChannel, onboardingBranch, relationshipManagerId, parentEntityId, ultimateParentId
- **Address sub-form**: addressType, addressLine1–3, city, stateProvince, postalCode, countryCode, isPrimary
- **Financials sub-form**: financialYear, annualTurnover, turnoverCurrency, netWorth, totalAssets, totalLiabilities, employeeCount, auditorName, creditRating, creditRatingAgency, accountsFiledDate
- **Compliance sub-form**: amlRiskRating, sanctionsHit, sanctionsListRef, fatcaClassification, crsClassification, taxIdentificationNumber, vatNumber, leiCode, pepLinked, nextReviewDate

#### `OpenAccountPage.tsx`
- Fixed payload structure (`master: {}` nesting)
- **New fields**: shortName, riskCategory (LOW/MEDIUM/HIGH), ownershipType (SOLE/JOINT/CORPORATE/TRUST), relationshipManagerId
- Added product info panel with live display when productId entered

#### `BranchPage.tsx`
- Added full Create Branch modal
- **Required**: branchCode, branchName, branchType select, timezone
- **Routing**: sortCode, ifscCode, bsbCode, routingNumber
- **Contact**: phone, email, managerId
- **Hours**: workingDays, openingTime, closingTime
- **Services**: cashEnabled, forexEnabled, loansEnabled, tradeEnabled; cashHoldingLimit (conditional)
- Fixed `F` component to include `hint` prop

#### `CurrencyPage.tsx`
- Added Add Currency modal
- Fields: currencyCode, currencyName, currencySymbol, decimalPlaces, roundingMethod, baseCurrency, tradeable, nostroRequired, settlementDays, nostroGlAccountId (conditional)

#### `ChannelsPage.tsx`
- Added Create Channel modal
- Fields: channelCode, channelName, channelCategory, authType, maxTxnAmount, dailyLimit, maxRetries, sessionTimeoutMins, requiresTls, priority, allowedTxnCodes, allowedCurrencies, ipWhitelist, cutoffTime

#### `AuthMatrixPage.tsx`
- Complete modal rewrite with correct DTO field names
- **Scope**: branchId, txnCodeId, channel, accountType, currencyCode
- **Thresholds**: singleAuthBelow (required), dualAuthFrom (required), dualAuthTo, boardAuthAbove
- **Roles**: firstAuthRole, secondAuthRole, boardAuthRole
- **Time restriction**: conditional authStartTime/authEndTime

#### `NumberingSchemesPage.tsx`
- Complete modal rewrite
- Fields: entityType select, formatMask (required), prefix, suffix, sequenceLength, resetFrequency, dateEmbedded, branchSpecific, dateFormat (conditional)

#### `AccountProductsPage.tsx`
- Extended Create Product modal
- **New fields**: description, allowJoint/allowCorporate/allowIndividual, minOpeningBalance, maxBalance, maxAccountPerCustomer, effectiveFrom, effectiveTo
- Fixed field names: `targetSegment` (was `segment`), `currencyCode` (was `currency`)

#### `AccountProductDetailPage.tsx`
- Rewrote all 3 sub-resource modals with correct DTO field names
- **Parameters**: paramKey, paramLabel, valueType, defaultValue, minValue, maxValue, overridableAtAccount, mandatory, effectiveFrom/To
- **Tiers**: tierName, tierSequence, balanceFrom, balanceTo, creditRate, debitRate, rateType, calculationBasis, effectiveFrom/To
- **Charges**: chargeCode, chargeName, chargeType, chargeCurrency, percentageRate, frequency, triggerEvent, waivable, minBalanceForWaiver (conditional), isActive, effectiveFrom/To

#### `ManualTransactionPage.tsx`
- Expanded from 8 to full `TransactionPostRequest` DTO, 3 sections
- **Transaction Details**: accountId, txnCode, txnAmount, txnCurrency, channel select, valueDate, exchangeRate, narrative, auto-generated idempotencyKey
- **Counterparty**: counterpartyAccountNo, counterpartyName, counterpartyBankBic, counterpartySortCode, counterpartyAccountId
- **References**: endToEndRef, paymentSchemeRef, sourceSystem, batchId

#### `TransactionCodesPage.tsx`
- Added full Create Code modal (button was previously non-functional)
- Fields: txnCode, txnName, txnCategory, txnDirection (all required); accountTypeScope, channelScope, balance impact checkboxes, requiresValueDate + offset, reversible + window, requiresAuthorisation + ref, limitCheckType, isoTxnCode, narrativeTemplate

#### `GlPeriodsPage.tsx`
- Added Generate Periods modal → `POST /v1/config/accounting/periods/generate`
- Wired Close button → `PUT /v1/gl/periods/{id}/close`
- Added Lock button → `PUT /v1/gl/periods/{id}/lock`
- Added fiscalYear column

#### `InstitutionPage.tsx`
- Converted from read-only display to fully editable form
- Edit/Save/Cancel toggle
- Pre-populates from `GET /v1/config/institution`
- Saves via `PATCH /v1/config/institution`
- 4 sections: Core Identity, Regulatory, Geography & Currency, Contact & Branding

### Issues Resolved
| Issue | Fix |
|-------|-----|
| TS2322 `unknown` not assignable to `ReactNode` in `AccountProductDetailPage` line 225 | Changed `{p.description && ...}` to `{!!p.description && ...}` |
| TS2322 `hint` prop missing from `F` component in `BranchPage` | Added `hint?: string` to `F` component type definition and rendered it |

---

## Prompt 4 — Fix CORS Errors in Browser Console

**Prompt:**
> "Errors on UI — CORS policy errors on ports 8081, 8082, 8083; 403 errors on port 8084."

### Root Causes Identified
1. **Ports 8081, 8082, 8083, 8080** — No CORS configuration on backend services; browser preflight OPTIONS requests blocked
2. **Port 8084 (user-admin)** — Spring Security returning `403` for unauthenticated requests instead of `401`, causing the frontend interceptor to not trigger the redirect-to-login flow
3. **Frontend** — `auth-storage` (Zustand persist key) not cleared on logout, so `isAuthenticated` could remain `true` even after token expiry

### Steps Taken

#### Frontend (`src/lib/api.ts`)
- Added `localStorage.removeItem('auth-storage')` to the 401 interceptor so Zustand's persisted auth state is fully cleared, forcing `RouteGuard` to redirect to `/login`

### Issues Resolved
| Issue | Fix |
|-------|-----|
| CORS blocked on 8081, 8082, 8083, 8080 | Added `WebConfig.java` to each service (see individual repo logs) |
| 403 instead of 401 from user-admin | Fixed `SecurityConfig.java` (see user-admin repo log) |
| Zustand `isAuthenticated` remaining `true` after token expiry | Clear `auth-storage` key in 401 interceptor |

---

## Prompt 5 — Restart All Services After CORS Fix

**Prompt:**
> "Do the steps: cd ~/customer-entity && git pull && ./mvnw spring-boot:run (for all 5 services)"

### Steps Taken
1. Pulled latest code on all 5 repos (all already up to date)
2. Checked running processes — ports 8081, 8082, 8083, 8084 had stale processes; 8080 was down
3. Killed all stale processes with `kill -9`
4. Attempted startup with `./mvnw` — **failed** (no Maven wrapper in any repo)
5. Located Maven at `/Users/shubharthibhattacharya/tools/apache-maven-3.9.6/bin/mvn`
6. Attempted startup with Maven + system Java (Java 25) — **failed** with `ExceptionInInitializerError: com.sun.tools.javac.code.TypeTag :: UNKNOWN`
7. Located Java 21 at `/Users/shubharthibhattacharya/Library/Java/JavaVirtualMachines/jdk-21.0.6+7/Contents/Home`
8. Started all 5 services with `JAVA_HOME` pointing to Java 21 — **all succeeded**
9. Verified CORS headers present on all services via `curl -X OPTIONS` preflight test

### Issues Resolved
| Issue | Fix |
|-------|-----|
| `./mvnw: No such file or directory` | Used full Maven path `/Users/shubharthibhattacharya/tools/apache-maven-3.9.6/bin/mvn` |
| Java 25 incompatible with `maven-compiler-plugin:3.11.0` | Used Java 21 by setting `JAVA_HOME` explicitly |
| Port 8080 (cbs-maintenance) was not running | Included in restart batch |

---

## Service → Port Mapping

| Service | Port | Axios Instance |
|---------|------|---------------|
| user-admin | 8084 | `userAdminApi` |
| cbs-maintenance | 8080 | `cbsApi` |
| account-master | 8082 | `accountApi` |
| txn-posting-engine | 8083 | `txnApi` |
| customer-entity | 8081 | `customerApi` |

## Key Constants

| Constant | Value | File |
|----------|-------|------|
| `DEFAULT_INSTITUTION_ID` | `'INST-001'` | `src/lib/api.ts` |
| Auth token key | `'access_token'` | `localStorage` |
| Refresh token key | `'refresh_token'` | `localStorage` |
| Zustand persist key | `'auth-storage'` | `localStorage` |
