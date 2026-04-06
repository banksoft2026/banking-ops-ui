import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { cbsApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { useUIStore } from '../../store/uiStore';
import { formatCurrency } from '../../lib/utils';

export default function AuthMatrixPage() {
  const { addToast } = useUIStore();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    txnCode: '',
    minAmount: '',
    maxAmount: '',
    requiredAuthLevel: '',
    channel: '',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth-matrix'],
    queryFn: () => cbsApi.get('/v1/config/auth-matrix?institutionId=INST-001').then(r => r.data.data).catch(() => []),
  });

  const rules: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.content ?? []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'txnCode', header: 'Txn Code', render: row => <span className="font-mono font-semibold text-[#185FA5]">{String(row.txnCode ?? '—')}</span> },
    { key: 'minAmount', header: 'Min Amount', render: row => formatCurrency(Number(row.minAmount) || 0), className: 'text-right' },
    { key: 'maxAmount', header: 'Max Amount', render: row => row.maxAmount != null ? formatCurrency(Number(row.maxAmount)) : 'Unlimited', className: 'text-right' },
    { key: 'requiredAuthLevel', header: 'Auth Level' },
    { key: 'channel', header: 'Channel' },
  ];

  const handleCreate = async () => {
    if (!form.txnCode || !form.requiredAuthLevel) {
      addToast('error', 'Txn Code and Auth Level are required');
      return;
    }
    setSaving(true);
    try {
      await cbsApi.post('/v1/config/auth-matrix', {
        ...form,
        institutionId: 'INST-001',
        minAmount: form.minAmount ? parseFloat(form.minAmount) : 0,
        maxAmount: form.maxAmount ? parseFloat(form.maxAmount) : undefined,
      });
      addToast('success', 'Auth rule created');
      setShowModal(false);
      setForm({ txnCode: '', minAmount: '', maxAmount: '', requiredAuthLevel: '', channel: '' });
      refetch();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to create rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Auth Matrix"
        subtitle="Transaction authorisation rules"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <PlusCircle size={13} /> Add Rule
          </button>
        }
      />
      <DataTable
        columns={columns}
        data={rules}
        isLoading={isLoading}
        emptyMessage="No auth rules found"
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[500px] shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Add Auth Rule</h2>
            <div className="space-y-3">
              {[
                { field: 'txnCode', label: 'Transaction Code *', placeholder: 'e.g. WIRE_TRANSFER' },
                { field: 'minAmount', label: 'Min Amount', placeholder: '0.00' },
                { field: 'maxAmount', label: 'Max Amount (leave blank for unlimited)', placeholder: '' },
                { field: 'requiredAuthLevel', label: 'Required Auth Level *', placeholder: 'e.g. DUAL, SINGLE' },
                { field: 'channel', label: 'Channel (blank = all)', placeholder: 'e.g. INTERNET, MOBILE' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">{label}</label>
                  <input
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="input-field"
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Rule'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
