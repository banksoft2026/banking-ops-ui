import { useQuery } from '@tanstack/react-query';
import { cbsApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';

export default function CurrencyPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => cbsApi.get('/v1/config/currencies?institutionId=INST-001').then(r => r.data.data).catch(() => []),
  });

  const currencies: Record<string, unknown>[] = data?.content ?? (Array.isArray(data) ? data : []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'currencyCode', header: 'Code', render: row => <span className="font-mono font-bold">{String(row.currencyCode ?? '—')}</span> },
    { key: 'currencyName', header: 'Name' },
    { key: 'currencySymbol', header: 'Symbol' },
    { key: 'decimalPlaces', header: 'Decimals' },
    { key: 'isActive', header: 'Status', render: row => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
  ];

  return (
    <div>
      <PageHeader title="Currencies" subtitle="Currency configuration" />
      <DataTable columns={columns} data={currencies} isLoading={isLoading} emptyMessage="No currencies found — check CBS Maintenance service (port 8080)" />
    </div>
  );
}
