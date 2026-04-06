import { useQuery } from '@tanstack/react-query';
import { cbsApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDate } from '../../lib/utils';

export default function GlPeriodsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['gl-periods'],
    queryFn: () => cbsApi.get('/v1/gl/periods').then(r => r.data.data),
    retry: false,
  });

  const periods: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.content ?? []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'periodCode', header: 'Period Code', render: row => <span className="font-mono">{String(row.periodCode ?? '—')}</span> },
    { key: 'periodName', header: 'Name' },
    { key: 'startDate', header: 'Start Date', render: row => formatDate(String(row.startDate ?? '')) },
    { key: 'endDate', header: 'End Date', render: row => formatDate(String(row.endDate ?? '')) },
    { key: 'periodStatus', header: 'Status', render: row => <StatusBadge status={String(row.periodStatus ?? row.status ?? 'OPEN')} /> },
    { key: 'actions', header: 'Actions', render: row => (
      <div className="flex gap-1">
        {row.periodStatus === 'OPEN' && (
          <button className="btn-secondary text-[9px] px-2 py-1 h-6">Close</button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="GL Periods" subtitle="Accounting period management" />
      <DataTable columns={columns} data={periods} isLoading={isLoading} emptyMessage="No GL periods found" />
    </div>
  );
}
