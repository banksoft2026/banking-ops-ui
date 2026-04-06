import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { customerApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { formatDate } from '../../lib/utils';

const TABS = ['Details', 'Addresses', 'Documents', 'Compliance', 'Linked Customers'] as const;
type Tab = typeof TABS[number];

export default function EntityDetailPage() {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('Details');

  const { data: entity, isLoading } = useQuery({
    queryKey: ['entity', entityId],
    queryFn: () => customerApi.get(`/v1/entities/${entityId}`).then(r => r.data.data).catch(() => null),
    enabled: !!entityId,
  });

  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['entity-addresses', entityId],
    queryFn: () => customerApi.get(`/v1/entities/${entityId}/addresses`).then(r => r.data.data).catch(() => []),
    enabled: !!entityId && activeTab === 'Addresses',
  });

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['entity-documents', entityId],
    queryFn: () => customerApi.get(`/v1/entities/${entityId}/documents`).then(r => r.data.data).catch(() => []),
    enabled: !!entityId && activeTab === 'Documents',
  });

  const { data: compliance, isLoading: complianceLoading } = useQuery({
    queryKey: ['entity-compliance', entityId],
    queryFn: () => customerApi.get(`/v1/entities/${entityId}/compliance`).then(r => r.data.data).catch(() => null),
    enabled: !!entityId && activeTab === 'Compliance',
  });

  const { data: linkedCustomers, isLoading: linkedLoading } = useQuery({
    queryKey: ['entity-customers', entityId],
    queryFn: () => customerApi.get(`/v1/entities/${entityId}/customers`).then(r => r.data.data).catch(() => []),
    enabled: !!entityId && activeTab === 'Linked Customers',
  });

  const addressColumns: Column<Record<string, unknown>>[] = [
    { key: 'addressType', header: 'Type' },
    { key: 'addressLine1', header: 'Address Line 1' },
    { key: 'city', header: 'City' },
    { key: 'country', header: 'Country' },
  ];

  const docColumns: Column<Record<string, unknown>>[] = [
    { key: 'documentType', header: 'Document Type' },
    { key: 'documentNumber', header: 'Number', render: row => <span className="font-mono">{String(row.documentNumber ?? '—')}</span> },
    { key: 'expiryDate', header: 'Expiry', render: row => formatDate(String(row.expiryDate ?? '')) },
    { key: 'verificationStatus', header: 'Status', render: row => <StatusBadge status={String(row.verificationStatus ?? '')} /> },
  ];

  const customerColumns: Column<Record<string, unknown>>[] = [
    { key: 'cifNumber', header: 'CIF', render: row => <span className="font-mono text-[#185FA5]">{String(row.cifNumber ?? '—')}</span> },
    { key: 'fullName', header: 'Name' },
    { key: 'customerType', header: 'Type' },
    { key: 'status', header: 'Status', render: row => <StatusBadge status={String(row.status ?? '')} /> },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#5A6A7A] text-sm">Loading entity...</div></div>;
  }

  if (!entity) {
    return (
      <div className="text-center py-16">
        <p className="text-[#A32D2D]">Entity not found</p>
        <button onClick={() => navigate('/entities')} className="btn-secondary mt-4">Back to Entities</button>
      </div>
    );
  }

  const e = entity as Record<string, unknown>;

  return (
    <div>
      <button onClick={() => navigate('/entities')} className="btn-ghost mb-4"><ArrowLeft size={13} /> Back</button>
      <PageHeader
        title={String(e.entityName ?? 'Entity Detail')}
        subtitle={`${String(e.entityType ?? '')} · ${String(e.registrationNumber ?? '')}`}
        actions={<StatusBadge status={String(e.status ?? 'ACTIVE')} size="md" />}
      />

      {/* Tab nav */}
      <div className="flex gap-1 mb-5 border-b border-[#D8E2EC] overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[11px] font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-[#185FA5] text-[#185FA5]' : 'border-transparent text-[#5A6A7A] hover:text-[#1B3A5C]'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Details' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-[14px] font-bold mb-3">Entity Information</h3>
            <dl className="space-y-2">
              {[
                ['Entity Name', String(e.entityName ?? '—')],
                ['Entity Type', String(e.entityType ?? '—')],
                ['Legal Form', String(e.legalForm ?? '—')],
                ['Reg. Number', String(e.registrationNumber ?? '—')],
                ['Reg. Country', String(e.registrationCountry ?? '—')],
                ['Incorporation Date', formatDate(String(e.incorporationDate ?? ''))],
                ['Primary Currency', String(e.primaryCurrency ?? '—')],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-[10px] text-[#5A6A7A]">{label}</dt>
                  <dd className="text-[11px] font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'Addresses' && (
        <DataTable
          columns={addressColumns}
          data={Array.isArray(addresses) ? addresses : []}
          isLoading={addressesLoading}
          emptyMessage="No addresses found"
        />
      )}

      {activeTab === 'Documents' && (
        <DataTable
          columns={docColumns}
          data={Array.isArray(documents) ? documents : []}
          isLoading={documentsLoading}
          emptyMessage="No documents found"
        />
      )}

      {activeTab === 'Compliance' && (
        <div className="card max-w-lg">
          {complianceLoading ? (
            <div className="animate-pulse h-32 bg-gray-100 rounded" />
          ) : compliance ? (
            <dl className="space-y-2">
              {Object.entries(compliance as Record<string, unknown>).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-[#D8E2EC] pb-2 last:border-0">
                  <dt className="text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide">{k.replace(/([A-Z])/g, ' $1').trim()}</dt>
                  <dd className="text-[11px] font-medium">{String(v ?? '—')}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-xs text-[#8A9BAB]">No compliance data available</p>
          )}
        </div>
      )}

      {activeTab === 'Linked Customers' && (
        <DataTable
          columns={customerColumns}
          data={Array.isArray(linkedCustomers) ? linkedCustomers : []}
          isLoading={linkedLoading}
          onRowClick={row => navigate(`/customers/${row.customerId ?? row.id}`)}
          emptyMessage="No linked customers found"
        />
      )}
    </div>
  );
}
