import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Download } from 'lucide-react';
import { txnApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDateTime } from '../../lib/utils';

export default function TransactionListPage() {
  const navigate = useNavigate();
  const [accountId, setAccountId] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', accountId, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: '20' });
      if (accountId) params.set('accountId', accountId);
      const res = await txnApi.get(`/v1/transactions?${params}`).catch(() => ({ data: { data: null } }));
      return res.data.data;
    },
    retry: false,
  });

  const txns: Record<string, unknown>[] = data?.content ?? (Array.isArray(data) ? data : []);
  const total = data?.totalElements ?? 0;

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'txnReference', header: 'Reference', render: row => <span className="font-mono text-[#185FA5]">{String(row.txnReference ?? '—')}</span> },
    { key: 'bookingDate', header: 'Date', render: row => formatDateTime(String(row.bookingDate ?? row.createdAt ?? '')) },
    { key: 'accountId', header: 'Account', render: row => <span className="font-mono">{String(row.accountId ?? '—').slice(0, 8)}…</span> },
    { key: 'txnCode', header: 'Code' },
    { key: 'drCrIndicator', header: 'D/C', render: row => (
      <span className={`font-bold text-xs ${row.drCrIndicator === 'CR' ? 'text-[#0F6E56]' : 'text-[#A32D2D]'}`}>
        {String(row.drCrIndicator ?? '—')}
      </span>
    )},
    { key: 'txnAmount', header: 'Amount', render: row => <span className="font-semibold">{formatCurrency(Number(row.txnAmount) || 0)}</span>, className: 'text-right' },
    { key: 'txnStatus', header: 'Status', render: row => <StatusBadge status={String(row.txnStatus ?? '')} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Transaction ledger and manual postings"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={13} /> Export</button>
            <button onClick={() => navigate('/transactions/new')} className="btn-primary">
              <Plus size={13} /> Manual Entry
            </button>
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BAB]" />
          <input
            value={accountId}
            onChange={e => { setAccountId(e.target.value); setPage(0); }}
            placeholder="Filter by Account ID..."
            className="input-field pl-8"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={txns}
        isLoading={isLoading}
        onRowClick={row => navigate(`/transactions/${row.txnId ?? row.id}`)}
        pagination={{ page, pageSize: 20, total, onPageChange: setPage }}
        emptyMessage="No transactions found"
      />
    </div>
  );
}
