import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { customerApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';

const ENTITY_TYPES = ['ALL', 'SOLE_TRADER', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'TRUST', 'CHARITY'];
const STATUSES = ['ALL', 'ACTIVE', 'INACTIVE', 'PENDING'];

export default function EntityListPage() {
  const navigate = useNavigate();
  const [entityType, setEntityType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['entities', entityType, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: '20' });
      if (entityType !== 'ALL') params.set('entityType', entityType);
      if (status !== 'ALL') params.set('status', status);
      const res = await customerApi.get(`/v1/entities?${params}`).catch(() => ({ data: { data: null } }));
      return res.data.data;
    },
    retry: false,
  });

  const entities: Record<string, unknown>[] = data?.content ?? (Array.isArray(data) ? data : []);
  const total = data?.totalElements ?? 0;

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'entityName', header: 'Entity Name', render: row => <span className="font-medium">{String(row.entityName ?? '—')}</span> },
    { key: 'entityType', header: 'Type' },
    { key: 'registrationNumber', header: 'Reg. Number', render: row => <span className="font-mono text-[#185FA5] text-[10px]">{String(row.registrationNumber ?? '—')}</span> },
    { key: 'registrationCountry', header: 'Country' },
    { key: 'status', header: 'Status', render: row => <StatusBadge status={String(row.status ?? '')} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Entities"
        subtitle="Corporate entities and organisations"
        actions={
          <button onClick={() => navigate('/entities/new')} className="btn-primary">
            <PlusCircle size={13} /> Onboard Entity
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div>
          <label className="text-xs text-[#5A6A7A] mr-2">Type:</label>
          <select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(0); }} className="input-field w-44">
            {ENTITY_TYPES.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#5A6A7A] mr-2">Status:</label>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); }} className="input-field w-36">
            {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={entities}
        isLoading={isLoading}
        onRowClick={row => navigate(`/entities/${row.entityId ?? row.id}`)}
        pagination={{ page, pageSize: 20, total, onPageChange: setPage }}
        emptyMessage="No entities found"
      />
    </div>
  );
}
