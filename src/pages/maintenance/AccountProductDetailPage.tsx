import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { accountApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { useUIStore } from '../../store/uiStore';
import { formatCurrency } from '../../lib/utils';

const TABS = ['Parameters', 'Interest Tiers', 'Charges'] as const;
type Tab = typeof TABS[number];

export default function AccountProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<Tab>('Parameters');
  const [showModal, setShowModal] = useState(false);
  const [modalForm, setModalForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => accountApi.get(`/v1/products/${productId}`).then(r => r.data.data).catch(() => null),
    enabled: !!productId,
  });

  const { data: parameters, isLoading: paramsLoading, refetch: refetchParams } = useQuery({
    queryKey: ['product-parameters', productId],
    queryFn: () => accountApi.get(`/v1/products/${productId}/parameters`).then(r => r.data.data).catch(() => []),
    enabled: !!productId && activeTab === 'Parameters',
  });

  const { data: tiers, isLoading: tiersLoading, refetch: refetchTiers } = useQuery({
    queryKey: ['product-tiers', productId],
    queryFn: () => accountApi.get(`/v1/products/${productId}/interest-tiers`).then(r => r.data.data).catch(() => []),
    enabled: !!productId && activeTab === 'Interest Tiers',
  });

  const { data: charges, isLoading: chargesLoading, refetch: refetchCharges } = useQuery({
    queryKey: ['product-charges', productId],
    queryFn: () => accountApi.get(`/v1/products/${productId}/charges`).then(r => r.data.data).catch(() => []),
    enabled: !!productId && activeTab === 'Charges',
  });

  const paramColumns: Column<Record<string, unknown>>[] = [
    { key: 'paramCode', header: 'Code', render: row => <span className="font-mono">{String(row.paramCode ?? '—')}</span> },
    { key: 'paramName', header: 'Name' },
    { key: 'paramValue', header: 'Value' },
    { key: 'paramType', header: 'Type' },
  ];

  const tierColumns: Column<Record<string, unknown>>[] = [
    { key: 'tierOrder', header: 'Order' },
    { key: 'minBalance', header: 'Min Balance', render: row => formatCurrency(Number(row.minBalance) || 0) },
    { key: 'maxBalance', header: 'Max Balance', render: row => row.maxBalance != null ? formatCurrency(Number(row.maxBalance)) : 'Unlimited' },
    { key: 'interestRate', header: 'Rate (%)', render: row => `${Number(row.interestRate || 0).toFixed(4)}%` },
  ];

  const chargeColumns: Column<Record<string, unknown>>[] = [
    { key: 'chargeCode', header: 'Code', render: row => <span className="font-mono">{String(row.chargeCode ?? '—')}</span> },
    { key: 'chargeName', header: 'Name' },
    { key: 'chargeType', header: 'Type' },
    { key: 'chargeAmount', header: 'Amount', render: row => formatCurrency(Number(row.chargeAmount) || 0) },
    { key: 'frequency', header: 'Frequency' },
  ];

  const getModalFields = () => {
    if (activeTab === 'Parameters') return ['paramCode', 'paramName', 'paramValue', 'paramType'];
    if (activeTab === 'Interest Tiers') return ['tierOrder', 'minBalance', 'maxBalance', 'interestRate'];
    return ['chargeCode', 'chargeName', 'chargeType', 'chargeAmount', 'frequency'];
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      const endpoint = activeTab === 'Parameters' ? 'parameters' : activeTab === 'Interest Tiers' ? 'interest-tiers' : 'charges';
      await accountApi.post(`/v1/products/${productId}/${endpoint}`, modalForm);
      addToast('success', `${activeTab.slice(0, -1)} added`);
      setShowModal(false);
      setModalForm({});
      if (activeTab === 'Parameters') refetchParams();
      else if (activeTab === 'Interest Tiers') refetchTiers();
      else refetchCharges();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  if (productLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#5A6A7A] text-sm">Loading product...</div></div>;
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-[#A32D2D]">Product not found</p>
        <button onClick={() => navigate('/maintenance/products')} className="btn-secondary mt-4">Back to Products</button>
      </div>
    );
  }

  const p = product as Record<string, unknown>;

  return (
    <div>
      <button onClick={() => navigate('/maintenance/products')} className="btn-ghost mb-4"><ArrowLeft size={13} /> Back</button>
      <PageHeader
        title={String(p.productName ?? 'Product Detail')}
        subtitle={`${String(p.productCode ?? '')} · ${String(p.accountType ?? '')}`}
        actions={<StatusBadge status={String(p.status ?? 'ACTIVE')} size="md" />}
      />

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card">
          <h3 className="text-[14px] font-bold mb-3">Product Information</h3>
          <dl className="space-y-2">
            {[
              ['Code', String(p.productCode ?? '—')],
              ['Name', String(p.productName ?? '—')],
              ['Account Type', String(p.accountType ?? '—')],
              ['Segment', String(p.segment ?? '—')],
              ['Currency', String(p.currency ?? '—')],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-[10px] text-[#5A6A7A]">{label}</dt>
                <dd className="text-[11px] font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

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

      <div className="flex justify-end mb-3">
        <button onClick={() => { setModalForm({}); setShowModal(true); }} className="btn-primary">
          <PlusCircle size={13} /> Add {activeTab.endsWith('s') ? activeTab.slice(0, -1) : activeTab}
        </button>
      </div>

      {activeTab === 'Parameters' && (
        <DataTable columns={paramColumns} data={Array.isArray(parameters) ? parameters : []} isLoading={paramsLoading} emptyMessage="No parameters" />
      )}
      {activeTab === 'Interest Tiers' && (
        <DataTable columns={tierColumns} data={Array.isArray(tiers) ? tiers : []} isLoading={tiersLoading} emptyMessage="No interest tiers" />
      )}
      {activeTab === 'Charges' && (
        <DataTable columns={chargeColumns} data={Array.isArray(charges) ? charges : []} isLoading={chargesLoading} emptyMessage="No charges" />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[500px] shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Add to {activeTab}</h2>
            <div className="space-y-3">
              {getModalFields().map(field => (
                <div key={field}>
                  <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    value={modalForm[field] ?? ''}
                    onChange={e => setModalForm(f => ({ ...f, [field]: e.target.value }))}
                    className="input-field"
                    placeholder={field}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
