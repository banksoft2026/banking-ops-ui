import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { customerApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { formatDate } from '../../lib/utils';

const TABS = ['Details', 'Contacts', 'Documents'] as const;
type Tab = typeof TABS[number];

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('Details');

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerApi.get(`/v1/customers/${customerId}`).then(r => r.data.data).catch(() => null),
    enabled: !!customerId,
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['customer-contacts', customerId],
    queryFn: () => customerApi.get(`/v1/customers/${customerId}/contacts`).then(r => r.data.data).catch(() => []),
    enabled: !!customerId && activeTab === 'Contacts',
  });

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['customer-documents', customerId],
    queryFn: () => customerApi.get(`/v1/customers/${customerId}/documents`).then(r => r.data.data).catch(() => []),
    enabled: !!customerId && activeTab === 'Documents',
  });

  const contactColumns: Column<Record<string, unknown>>[] = [
    { key: 'contactType', header: 'Type' },
    { key: 'contactValue', header: 'Value' },
    { key: 'isPrimary', header: 'Primary', render: row => row.isPrimary ? '✓' : '—' },
  ];

  const docColumns: Column<Record<string, unknown>>[] = [
    { key: 'documentType', header: 'Document Type' },
    { key: 'documentNumber', header: 'Number', render: row => <span className="font-mono">{String(row.documentNumber ?? '—')}</span> },
    { key: 'expiryDate', header: 'Expiry', render: row => formatDate(String(row.expiryDate ?? '')) },
    { key: 'verificationStatus', header: 'Status', render: row => <StatusBadge status={String(row.verificationStatus ?? '')} /> },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#5A6A7A] text-sm">Loading customer...</div></div>;
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-[#A32D2D]">Customer not found</p>
        <button onClick={() => navigate('/customers')} className="btn-secondary mt-4">Back to Customers</button>
      </div>
    );
  }

  const c = customer as Record<string, unknown>;

  return (
    <div>
      <button onClick={() => navigate('/customers')} className="btn-ghost mb-4"><ArrowLeft size={13} /> Back</button>
      <PageHeader
        title={String(c.fullName ?? c.firstName ?? 'Customer Detail')}
        subtitle={`CIF: ${String(c.cifNumber ?? customerId ?? '')}`}
        actions={<StatusBadge status={String(c.status ?? 'ACTIVE')} size="md" />}
      />

      {/* Tab nav */}
      <div className="flex gap-1 mb-5 border-b border-[#D8E2EC]">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[11px] font-semibold transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-[#185FA5] text-[#185FA5]' : 'border-transparent text-[#5A6A7A] hover:text-[#1B3A5C]'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Details' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-[14px] font-bold mb-3">Personal Information</h3>
            <dl className="space-y-2">
              {[
                ['Customer Type', String(c.customerType ?? '—')],
                ['Full Name', String(c.fullName ?? '—')],
                ['Date of Birth', formatDate(String(c.dateOfBirth ?? ''))],
                ['Nationality', String(c.nationality ?? '—')],
                ['Occupation', String(c.occupation ?? '—')],
                ['Employer', String(c.employerName ?? '—')],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-[10px] text-[#5A6A7A]">{label}</dt>
                  <dd className="text-[11px] font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="card">
            <h3 className="text-[14px] font-bold mb-3">Account Details</h3>
            <dl className="space-y-2">
              {[
                ['CIF Number', String(c.cifNumber ?? '—')],
                ['Segment', String(c.customerSegment ?? '—')],
                ['KYC Status', String(c.kycStatus ?? '—')],
                ['RM ID', String(c.rmId ?? '—')],
                ['Created', formatDate(String(c.createdAt ?? ''))],
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

      {activeTab === 'Contacts' && (
        <DataTable
          columns={contactColumns}
          data={Array.isArray(contacts) ? contacts : []}
          isLoading={contactsLoading}
          emptyMessage="No contacts found"
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
    </div>
  );
}
