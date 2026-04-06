import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { cbsApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { formatCurrency } from '../../lib/utils';

export default function TrialBalancePage() {
  const [periodId, setPeriodId] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trial-balance', periodId],
    queryFn: () => cbsApi.get(`/v1/gl/trial-balance${periodId ? `?periodId=${periodId}` : ''}`).then(r => r.data.data),
    enabled: false,
    retry: false,
  });

  const entries: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.entries ?? []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'glAccountCode', header: 'Account Code', render: row => <span className="font-mono">{String(row.glAccountCode ?? '—')}</span> },
    { key: 'glAccountName', header: 'Account Name' },
    { key: 'periodDebitTotal', header: 'Debits', render: row => formatCurrency(Number(row.periodDebitTotal) || 0), className: 'text-right' },
    { key: 'periodCreditTotal', header: 'Credits', render: row => formatCurrency(Number(row.periodCreditTotal) || 0), className: 'text-right' },
    { key: 'closingBalance', header: 'Balance', render: row => (
      <span className="font-semibold">{formatCurrency(Number(row.closingBalance) || 0)}</span>
    ), className: 'text-right' },
  ];

  return (
    <div>
      <PageHeader
        title="Trial Balance"
        subtitle="Period-based GL trial balance report"
        actions={<button className="btn-secondary"><Download size={13} /> Export CSV</button>}
      />
      <div className="flex items-center gap-3 mb-4">
        <input
          value={periodId}
          onChange={e => setPeriodId(e.target.value)}
          placeholder="Period ID (optional)"
          className="input-field max-w-xs"
        />
        <button onClick={() => refetch()} className="btn-primary">Generate</button>
      </div>
      <DataTable columns={columns} data={entries} isLoading={isLoading} emptyMessage="Click Generate to load trial balance" />
    </div>
  );
}
