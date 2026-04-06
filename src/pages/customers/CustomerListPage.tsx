import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { customerApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDate } from '../../lib/utils';

// Mock data if service unavailable
const MOCK_CUSTOMERS = [
  { customerId: '1', cifNumber: 'CIF-001', fullName: 'Raj Kumar', customerType: 'INDIVIDUAL', status: 'ACTIVE', phone: '+91-9876543210', email: 'raj@example.com', createdAt: '2024-01-15' },
  { customerId: '2', cifNumber: 'CIF-002', fullName: 'Priya Sharma', customerType: 'INDIVIDUAL', status: 'ACTIVE', phone: '+91-9876543211', email: 'priya@example.com', createdAt: '2024-02-20' },
  { customerId: '3', cifNumber: 'CIF-003', fullName: 'Acme Corp Ltd', customerType: 'CORPORATE', status: 'ACTIVE', phone: '+91-9876543212', email: 'acme@example.com', createdAt: '2024-03-10' },
];

export default function CustomerListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ page: String(page), size: '20' });
        if (search) params.set('search', search);
        const res = await customerApi.get(`/v1/customers?${params}`);
        return res.data.data;
      } catch {
        return { content: MOCK_CUSTOMERS, totalElements: MOCK_CUSTOMERS.length };
      }
    },
  });

  const customers: Record<string, unknown>[] = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'cifNumber', header: 'CIF', render: row => <span className="font-mono text-[#185FA5]">{String(row.cifNumber ?? '—')}</span> },
    { key: 'fullName', header: 'Name', render: row => <span className="font-medium">{String(row.fullName ?? '—')}</span> },
    { key: 'customerType', header: 'Type' },
    { key: 'status', header: 'Status', render: row => <StatusBadge status={String(row.status ?? '')} /> },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    { key: 'createdAt', header: 'Created', render: row => formatDate(String(row.createdAt ?? '')) },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Customer lifecycle management"
        actions={<button onClick={() => navigate('/customers/new')} className="btn-primary"><UserPlus size={13} /> New Customer</button>}
      />
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BAB]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search customers..." className="input-field pl-8" />
        </div>
      </div>
      <DataTable columns={columns} data={customers} isLoading={isLoading} onRowClick={row => navigate(`/customers/${row.customerId}`)} pagination={{ page, pageSize: 20, total, onPageChange: setPage }} />
    </div>
  );
}
