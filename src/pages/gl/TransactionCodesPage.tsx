import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { cbsApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';

export default function TransactionCodesPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['txn-codes', page],
    queryFn: () => cbsApi.get(`/v1/transaction-codes?page=${page}&size=20`).then(r => r.data.data),
    retry: false,
  });

  const codes: Record<string, unknown>[] = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'txnCode', header: 'Code', render: row => <span className="font-mono font-semibold text-[#185FA5]">{String(row.txnCode ?? '—')}</span> },
    { key: 'txnName', header: 'Name' },
    { key: 'txnCategory', header: 'Category' },
    { key: 'txnDirection', header: 'Direction', render: row => (
      <span className={`font-semibold text-xs ${row.txnDirection === 'CREDIT' ? 'text-[#0F6E56]' : row.txnDirection === 'DEBIT' ? 'text-[#A32D2D]' : 'text-[#5A6A7A]'}`}>
        {String(row.txnDirection ?? '—')}
      </span>
    )},
    { key: 'isActive', header: 'Status', render: row => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'requiresAuthorisation', header: 'Auth Required', render: row => row.requiresAuthorisation ? '✓' : '—' },
  ];

  return (
    <div>
      <PageHeader
        title="Transaction Codes"
        subtitle="Manage transaction type definitions and GL mappings"
        actions={<button className="btn-primary"><PlusCircle size={13} /> Add Code</button>}
      />
      <DataTable columns={columns} data={codes} isLoading={isLoading} pagination={{ page, pageSize: 20, total, onPageChange: setPage }} />
    </div>
  );
}
