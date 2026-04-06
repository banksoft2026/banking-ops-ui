import { useQuery } from '@tanstack/react-query';
import { cbsApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';

export default function BranchPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => cbsApi.get('/v1/branches').then(r => r.data.data).catch(() => ({ content: [] })),
  });

  const branches: Record<string, unknown>[] = data?.content ?? (Array.isArray(data) ? data : []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'branchCode', header: 'Code', render: row => <span className="font-mono font-bold">{String(row.branchCode ?? '—')}</span> },
    { key: 'branchName', header: 'Name' },
    { key: 'city', header: 'City' },
    { key: 'state', header: 'State' },
    { key: 'isActive', header: 'Status', render: row => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
  ];

  return (
    <div>
      <PageHeader title="Branches" subtitle="Branch network management" />
      <DataTable columns={columns} data={branches} isLoading={isLoading} emptyMessage="No branches found — check CBS Maintenance service (port 8080)" />
    </div>
  );
}
