import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { cbsApi, DEFAULT_INSTITUTION_ID } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
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
  currencyCode: '',
  currencyName: '',
  currencySymbol: '',
  decimalPlaces: '2',
  roundingMethod: 'HALF_UP',
  baseCurrency: false,
  tradeable: true,
  nostroRequired: false,
  nostroGlAccountId: '',
  settlementDays: '2',
  createdBy: 'OPS-PORTAL',
};

export default function CurrencyPage() {
  const { addToast } = useUIStore();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...initForm });

  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => cbsApi.get(`/v1/config/currencies?institutionId=${DEFAULT_INSTITUTION_ID}`).then(r => r.data.data).catch(() => []),
  });

  const currencies: Record<string, unknown>[] = data?.content ?? (Array.isArray(data) ? data : []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'currencyCode', header: 'Code', render: row => <span className="font-mono font-bold text-[#185FA5]">{String(row.currencyCode ?? '—')}</span> },
    { key: 'currencyName', header: 'Name' },
    { key: 'currencySymbol', header: 'Symbol' },
    { key: 'decimalPlaces', header: 'Decimals' },
    { key: 'roundingMethod', header: 'Rounding' },
    { key: 'settlementDays', header: 'Settle Days' },
    { key: 'baseCurrency', header: 'Base', render: row => row.baseCurrency ? <span className="text-[#0F6E56] font-bold text-[10px]">✓ Base</span> : <span className="text-[#8A9BAB] text-[10px]">—</span> },
    { key: 'tradeable', header: 'Tradeable', render: row => <StatusBadge status={row.tradeable ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'active', header: 'Status', render: row => <StatusBadge status={(row.active ?? row.isActive) ? 'ACTIVE' : 'INACTIVE'} /> },
  ];

  const handleCreate = async () => {
    if (!form.currencyCode || !form.currencyName) {
      addToast('error', 'Currency Code and Name are required');
      return;
    }
    if (form.currencyCode.length !== 3) {
      addToast('error', 'Currency Code must be exactly 3 characters (ISO 4217)');
      return;
    }
    setSaving(true);
    try {
      await cbsApi.post('/v1/config/currencies', {
        institutionId: DEFAULT_INSTITUTION_ID,
        currencyCode: form.currencyCode.toUpperCase(),
        currencyName: form.currencyName,
        createdBy: form.createdBy,
        decimalPlaces: parseInt(form.decimalPlaces),
        roundingMethod: form.roundingMethod,
        baseCurrency: form.baseCurrency,
        tradeable: form.tradeable,
        nostroRequired: form.nostroRequired,
        settlementDays: parseInt(form.settlementDays),
        ...(form.currencySymbol && { currencySymbol: form.currencySymbol }),
        ...(form.nostroGlAccountId && { nostroGlAccountId: form.nostroGlAccountId }),
      });
      addToast('success', 'Currency added');
      setShowModal(false);
      setForm({ ...initForm });
      refetch();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to add currency');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Currencies"
        subtitle="Currency configuration and settings"
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><PlusCircle size={13} /> Add Currency</button>}
      />
      <DataTable columns={columns} data={currencies} isLoading={isLoading} emptyMessage="No currencies found — check CBS Maintenance service (port 8080)" />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[560px] max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Add Currency</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <F label="Currency Code (ISO 4217)" required hint="Exactly 3 characters">
                  <input value={form.currencyCode} onChange={e => set('currencyCode', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. USD" maxLength={3} />
                </F>
                <F label="Currency Name" required>
                  <input value={form.currencyName} onChange={e => set('currencyName', e.target.value)} className="input-field" placeholder="e.g. US Dollar" />
                </F>
                <F label="Symbol">
                  <input value={form.currencySymbol} onChange={e => set('currencySymbol', e.target.value)} className="input-field" placeholder="e.g. $" maxLength={5} />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Decimal Places" hint="0–4">
                  <input type="number" value={form.decimalPlaces} onChange={e => set('decimalPlaces', e.target.value)} className="input-field" min="0" max="4" />
                </F>
                <F label="Rounding Method">
                  <select value={form.roundingMethod} onChange={e => set('roundingMethod', e.target.value)} className="input-field">
                    <option value="HALF_UP">Half Up</option>
                    <option value="HALF_DOWN">Half Down</option>
                    <option value="HALF_EVEN">Half Even (Banker's)</option>
                    <option value="CEILING">Ceiling</option>
                    <option value="FLOOR">Floor</option>
                  </select>
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Settlement Days (0–5)">
                  <input type="number" value={form.settlementDays} onChange={e => set('settlementDays', e.target.value)} className="input-field" min="0" max="5" />
                </F>
                <F label="Nostro GL Account ID">
                  <input value={form.nostroGlAccountId} onChange={e => set('nostroGlAccountId', e.target.value)} className="input-field" placeholder="GL account UUID" />
                </F>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-1">
                {([['baseCurrency', 'Base Currency'], ['tradeable', 'Tradeable'], ['nostroRequired', 'Nostro Required']] as [keyof typeof form, string][]).map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[field] as boolean} onChange={e => set(field, e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                    <span className="text-[11px] text-[#5A6A7A]">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Currency'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
