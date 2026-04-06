import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, PlusCircle } from 'lucide-react';
import { accountApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';

const STATUSES = ['ALL', 'ACTIVE', 'DORMANT', 'FROZEN', 'CLOSED'];

export default function AccountListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', search, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: '20' });
      if (search) params.set('search', search);
      if (status !== 'ALL') params.set('status', status);
      const res = await accountApi.get(`/v1/accounts?${params}`);
      return res.data.data;
    },
    retry: false,
  });

  const accounts: Record<string, unknown>[] = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'accountNumber', header: 'Account Number', render: row => <span className="font-mono text-[#185FA5]">{String(row.accountNumber ?? '—')}</span> },
    { key: 'customerName', header: 'Customer', render: row => String(row.customerName ?? row.customerId ?? '—') },
    { key: 'accountType', header: 'Type', render: row => <span className="capitalize">{String(row.accountType ?? '—').toLowerCase()}</span> },
    { key: 'accountStatus', header: 'Status', render: row => <StatusBadge status={String(row.accountStatus ?? '')} /> },
    { key: 'availableBalance', header: 'Balance', render: row => <span className="font-semibold">{formatCurrency(Number(row.availableBalance) || 0)}</span>, className: 'text-right' },
    { key: 'branchCode', header: 'Branch', render: row => String(row.branchCode ?? '—') },
    { key: 'openDate', header: 'Opened', render: row => formatDate(String(row.openDate ?? row.createdAt ?? '')) },
  ];

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Manage all customer accounts"
        actions={
          <button onClick={() => navigate('/accounts/new')} className="btn-primary">
            <PlusCircle size={13} /> Open Account
          </button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BAB]" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search accounts..."
            className="input-field pl-8"
          />
        </div>
        <div className="flex gap-1">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(0); }}
              className={`px-3 py-1.5 text-[10px] font-semibold rounded-md transition-colors ${status === s ? 'bg-[#1B3A5C] text-white' : 'bg-white text-[#5A6A7A] border border-[#D8E2EC] hover:bg-gray-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={accounts}
        isLoading={isLoading}
        onRowClick={row => navigate(`/accounts/${row.accountId}`)}
        pagination={{ page, pageSize: 20, total, onPageChange: setPage }}
        emptyMessage="No accounts found"
      />
    </div>
  );
}
