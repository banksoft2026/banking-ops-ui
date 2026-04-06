import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Snowflake, Edit } from 'lucide-react';
import { accountApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/utils';

export default function AccountDetailPage() {
  const { accountId: id } = useParams<{ accountId: string }>();
  const navigate = useNavigate();

  const { data: accountData, isLoading: accountLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: () => accountApi.get(`/v1/accounts/${id}`).then(r => r.data.data),
    enabled: !!id,
    retry: false,
  });

  const { data: balanceData } = useQuery({
    queryKey: ['account-balance', id],
    queryFn: () => accountApi.get(`/v1/accounts/${id}/balance`).then(r => r.data.data),
    enabled: !!id,
    retry: false,
  });

  const { data: txnData, isLoading: txnLoading } = useQuery({
    queryKey: ['account-transactions', id],
    queryFn: () => accountApi.get(`/v1/accounts/${id}/ledger?size=20`).then(r => r.data.data).catch(() => null),
    enabled: !!id,
    retry: false,
  });

  const account: Record<string, unknown> = accountData ?? {};
  const balance: Record<string, unknown> = balanceData ?? {};
  const transactions: Record<string, unknown>[] = txnData?.content ?? [];

  const txnColumns: Column<Record<string, unknown>>[] = [
    { key: 'txnReference', header: 'Reference', render: row => <span className="font-mono text-[#185FA5] text-[10px]">{String(row.txnReference ?? '—')}</span> },
    { key: 'txnCode', header: 'Type' },
    { key: 'drCrIndicator', header: 'D/C', render: row => <span className={`font-semibold ${row.drCrIndicator === 'CR' ? 'text-[#0F6E56]' : 'text-[#A32D2D]'}`}>{String(row.drCrIndicator ?? '—')}</span> },
    { key: 'txnAmount', header: 'Amount', render: row => formatCurrency(Number(row.txnAmount) || 0), className: 'text-right' },
    { key: 'txnStatus', header: 'Status', render: row => <StatusBadge status={String(row.txnStatus ?? '')} /> },
    { key: 'valueDate', header: 'Date', render: row => formatDate(String(row.valueDate ?? row.createdAt ?? '')) },
  ];

  if (accountLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#5A6A7A] text-sm">Loading account...</div>
      </div>
    );
  }

  if (!accountData) {
    return (
      <div className="text-center py-16">
        <p className="text-[#A32D2D]">Account not found</p>
        <button onClick={() => navigate('/accounts')} className="btn-secondary mt-4">Back to Accounts</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate('/accounts')} className="btn-ghost">
          <ArrowLeft size={13} /> Back
        </button>
      </div>

      <PageHeader
        title={String(account.accountNumber ?? 'Account Detail')}
        subtitle={String(account.accountType ?? '')}
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary"><Snowflake size={13} /> Freeze</button>
            <button className="btn-primary"><Edit size={13} /> Edit</button>
          </div>
        }
      />

      <div className="flex items-center gap-2 mb-5">
        <StatusBadge status={String(account.accountStatus ?? '')} size="md" />
        <span className="text-[10px] text-[#8A9BAB]">ID: {String(id ?? '').slice(0, 8)}…</span>
      </div>

      {/* Two-column info */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card">
          <h3 className="text-[14px] font-bold mb-3">Account Information</h3>
          <dl className="space-y-2">
            {[
              ['Customer', String(account.customerName ?? account.customerId ?? '—')],
              ['Account Type', String(account.accountType ?? '—')],
              ['Branch Code', String(account.branchCode ?? '—')],
              ['Currency', String(account.currencyCode ?? 'USD')],
              ['Opened Date', formatDate(String(account.openDate ?? account.createdAt ?? ''))],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-[10px] text-[#5A6A7A]">{label}</dt>
                <dd className="text-[11px] font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="card">
          <h3 className="text-[14px] font-bold mb-3">Balance</h3>
          <dl className="space-y-2">
            {[
              ['Available Balance', formatCurrency(Number(balance.availableBalance) || 0)],
              ['Ledger Balance', formatCurrency(Number(balance.ledgerBalance) || 0)],
              ['Earmarked', formatCurrency(Number(balance.earmarkedAmount) || 0)],
              ['Uncollected', formatCurrency(Number(balance.uncollectedAmount) || 0)],
              ['Overdraft Limit', formatCurrency(Number(balance.overdraftLimit) || 0)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-[10px] text-[#5A6A7A]">{label}</dt>
                <dd className="text-[11px] font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          {!!balance.balanceAsAt && (
            <p className="text-[9px] text-[#8A9BAB] mt-2">As at {formatDateTime(String(balance.balanceAsAt))}</p>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className="card">
        <h3 className="text-[14px] font-bold mb-3">Recent Transactions</h3>
        <DataTable
          columns={txnColumns}
          data={transactions}
          isLoading={txnLoading}
          emptyMessage="No transactions yet"
        />
      </div>
    </div>
  );
}
