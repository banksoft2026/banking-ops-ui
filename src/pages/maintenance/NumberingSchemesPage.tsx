import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { cbsApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { useUIStore } from '../../store/uiStore';

export default function NumberingSchemesPage() {
  const { addToast } = useUIStore();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    entityType: '',
    prefix: '',
    suffix: '',
    minLength: '',
    currentSequence: '',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['numbering-schemes'],
    queryFn: () => cbsApi.get('/v1/config/numbering?institutionId=INST-001').then(r => r.data.data).catch(() => []),
  });

  const schemes: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.content ?? []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'entityType', header: 'Entity Type', render: row => <span className="font-mono font-semibold text-[#185FA5]">{String(row.entityType ?? '—')}</span> },
    { key: 'prefix', header: 'Prefix' },
    { key: 'suffix', header: 'Suffix' },
    { key: 'minLength', header: 'Min Length' },
    { key: 'currentSequence', header: 'Current Seq' },
  ];

  const handleCreate = async () => {
    if (!form.entityType) {
      addToast('error', 'Entity Type is required');
      return;
    }
    setSaving(true);
    try {
      await cbsApi.post('/v1/config/numbering', {
        ...form,
        institutionId: 'INST-001',
        minLength: form.minLength ? parseInt(form.minLength) : undefined,
        currentSequence: form.currentSequence ? parseInt(form.currentSequence) : undefined,
      });
      addToast('success', 'Numbering scheme created');
      setShowModal(false);
      setForm({ entityType: '', prefix: '', suffix: '', minLength: '', currentSequence: '' });
      refetch();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to create scheme');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Numbering Schemes"
        subtitle="Reference number generation configuration"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <PlusCircle size={13} /> Add Scheme
          </button>
        }
      />
      <DataTable
        columns={columns}
        data={schemes}
        isLoading={isLoading}
        emptyMessage="No numbering schemes found"
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[500px] shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Add Numbering Scheme</h2>
            <div className="space-y-3">
              {[
                { field: 'entityType', label: 'Entity Type *', placeholder: 'e.g. ACCOUNT, CUSTOMER' },
                { field: 'prefix', label: 'Prefix', placeholder: 'e.g. ACC-' },
                { field: 'suffix', label: 'Suffix', placeholder: 'e.g. -01' },
                { field: 'minLength', label: 'Min Length', placeholder: 'e.g. 10' },
                { field: 'currentSequence', label: 'Starting Sequence', placeholder: 'e.g. 1000' },
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
              <button onClick={handleCreate} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Scheme'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
