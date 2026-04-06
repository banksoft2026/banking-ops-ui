import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userAdminApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDateTime } from '../../lib/utils';

export default function AuditLogPage() {
  const [page, setPage] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<Record<string, unknown> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', page],
    queryFn: () => userAdminApi.get(`/v1/audit-log?page=${page}&size=50`).then(r => r.data.data),
    retry: false,
  });

  const entries: Record<string, unknown>[] = Array.isArray(data) ? data : [];

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'created_at', header: 'Timestamp', render: row => formatDateTime(String(row.created_at ?? '')) },
    { key: 'username', header: 'User' },
    { key: 'role_code', header: 'Role', render: row => row.role_code ? <StatusBadge status={String(row.role_code)} /> : <span className="text-[#8A9BAB]">—</span> },
    { key: 'action_type', header: 'Action', render: row => <span className="font-semibold text-[11px]">{String(row.action_type ?? '—')}</span> },
    { key: 'entity_type', header: 'Entity' },
    { key: 'entity_id', header: 'Entity ID', render: row => <span className="font-mono text-[10px]">{String(row.entity_id ?? '—').slice(0, 12)}</span> },
    { key: 'ip_address', header: 'IP' },
    { key: 'status', header: 'Status', render: row => <StatusBadge status={String(row.status ?? 'SUCCESS')} /> },
  ];

  return (
    <div>
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedEntry(null)} />
          <div className="relative bg-white rounded-lg p-6 w-[520px] shadow-xl">
            <h3 className="text-[14px] font-bold mb-3">Audit Entry Detail</h3>
            <dl className="space-y-2 mb-3">
              {Object.entries(selectedEntry).filter(([k]) => !['payload_before','payload_after'].includes(k)).map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <dt className="text-[#5A6A7A] capitalize">{k.replace(/_/g, ' ')}</dt>
                  <dd className="font-medium max-w-xs text-right truncate">{String(v ?? '—')}</dd>
                </div>
              ))}
            </dl>
            <button onClick={() => setSelectedEntry(null)} className="btn-secondary w-full justify-center">Close</button>
          </div>
        </div>
      )}
      <PageHeader title="Audit Log" subtitle="Immutable record of all operator actions" />
      <DataTable columns={columns} data={entries} isLoading={isLoading} onRowClick={setSelectedEntry} pagination={{ page, pageSize: 50, total: entries.length + (page > 0 ? page * 50 : 0), onPageChange: setPage }} emptyMessage="No audit records found" />
    </div>
  );
}
