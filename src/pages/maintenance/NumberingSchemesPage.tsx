import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { cbsApi, DEFAULT_INSTITUTION_ID } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { useUIStore } from '../../store/uiStore';

const F = ({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[9px] text-[#8A9BAB] mt-0.5">{hint}</p>}
  </div>
);

const initForm = {
  entityType: 'ACCOUNT',
  prefix: '',
  suffix: '',
  formatMask: '',
  sequenceLength: '8',
  branchSpecific: false,
  dateEmbedded: true,
  dateFormat: 'YYYYMM',
  resetFrequency: 'NEVER',
  createdBy: 'OPS-PORTAL',
};

export default function NumberingSchemesPage() {
  const { addToast } = useUIStore();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...initForm });

  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['numbering-schemes'],
    queryFn: () => cbsApi.get(`/v1/config/numbering?institutionId=${DEFAULT_INSTITUTION_ID}`).then(r => r.data.data).catch(() => []),
  });

  const schemes: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.content ?? []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'entityType', header: 'Entity Type', render: row => <span className="font-mono font-semibold text-[#185FA5]">{String(row.entityType ?? '—')}</span> },
    { key: 'prefix', header: 'Prefix', render: row => <span className="font-mono text-[10px]">{String(row.prefix ?? '—')}</span> },
    { key: 'suffix', header: 'Suffix', render: row => <span className="font-mono text-[10px]">{String(row.suffix ?? '—')}</span> },
    { key: 'formatMask', header: 'Format Mask', render: row => <span className="font-mono text-[10px] text-[#5A6A7A]">{String(row.formatMask ?? '—')}</span> },
    { key: 'sequenceLength', header: 'Seq Length' },
    { key: 'dateEmbedded', header: 'Date', render: row => row.dateEmbedded ? <span className="text-[#0F6E56] font-semibold text-[10px]">✓</span> : <span className="text-[#8A9BAB] text-[10px]">—</span> },
    { key: 'resetFrequency', header: 'Reset' },
    { key: 'branchSpecific', header: 'Branch', render: row => row.branchSpecific ? <span className="text-[#185FA5] font-semibold text-[10px]">✓</span> : <span className="text-[#8A9BAB] text-[10px]">—</span> },
  ];

  const handleCreate = async () => {
    if (!form.entityType || !form.formatMask) {
      addToast('error', 'Entity Type and Format Mask are required');
      return;
    }
    setSaving(true);
    try {
      await cbsApi.post('/v1/config/numbering', {
        institutionId: DEFAULT_INSTITUTION_ID,
        entityType: form.entityType,
        formatMask: form.formatMask,
        sequenceLength: parseInt(form.sequenceLength),
        branchSpecific: form.branchSpecific,
        dateEmbedded: form.dateEmbedded,
        dateFormat: form.dateFormat,
        resetFrequency: form.resetFrequency,
        createdBy: form.createdBy,
        ...(form.prefix && { prefix: form.prefix }),
        ...(form.suffix && { suffix: form.suffix }),
      });
      addToast('success', 'Numbering scheme created');
      setShowModal(false);
      setForm({ ...initForm });
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
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><PlusCircle size={13} /> Add Scheme</button>}
      />
      <DataTable columns={columns} data={schemes} isLoading={isLoading} emptyMessage="No numbering schemes found — check CBS Maintenance service (port 8080)" />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[560px] max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Add Numbering Scheme</h2>
            <div className="space-y-4">
              <F label="Entity Type" required>
                <select value={form.entityType} onChange={e => set('entityType', e.target.value)} className="input-field">
                  <option value="ACCOUNT">Account</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="TRANSACTION">Transaction</option>
                  <option value="BATCH">Batch</option>
                  <option value="STATEMENT">Statement</option>
                  <option value="LOAN">Loan</option>
                </select>
              </F>
              <F label="Format Mask" required hint="P=prefix chars, Y=year, M=month, D=day, S=sequence digit. e.g. PPPYYYYMMSSSSSSSS">
                <input value={form.formatMask} onChange={e => set('formatMask', e.target.value)} className="input-field" placeholder="e.g. ACCYYYYMMSSSSSSSS" />
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Prefix">
                  <input value={form.prefix} onChange={e => set('prefix', e.target.value)} className="input-field" placeholder="e.g. ACC-" maxLength={10} />
                </F>
                <F label="Suffix">
                  <input value={form.suffix} onChange={e => set('suffix', e.target.value)} className="input-field" placeholder="e.g. -GB" maxLength={10} />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Sequence Length" hint="Number of sequence digits">
                  <input type="number" value={form.sequenceLength} onChange={e => set('sequenceLength', e.target.value)} className="input-field" min="1" max="18" />
                </F>
                <F label="Reset Frequency">
                  <select value={form.resetFrequency} onChange={e => set('resetFrequency', e.target.value)} className="input-field">
                    <option value="NEVER">Never</option>
                    <option value="DAILY">Daily</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </F>
              </div>
              {form.dateEmbedded && (
                <F label="Date Format">
                  <select value={form.dateFormat} onChange={e => set('dateFormat', e.target.value)} className="input-field">
                    <option value="YYYYMM">YYYYMM</option>
                    <option value="YYYYMMDD">YYYYMMDD</option>
                    <option value="YYMM">YYMM</option>
                  </select>
                </F>
              )}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.dateEmbedded} onChange={e => set('dateEmbedded', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                  <span className="text-[11px] text-[#5A6A7A]">Embed date in number</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.branchSpecific} onChange={e => set('branchSpecific', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                  <span className="text-[11px] text-[#5A6A7A]">Branch-specific sequence</span>
                </label>
              </div>
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
