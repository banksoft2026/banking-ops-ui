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
  branchCode: '',
  branchName: '',
  branchType: 'STANDARD',
  timezone: 'UTC',
  sortCode: '',
  ifscCode: '',
  bsbCode: '',
  routingNumber: '',
  phone: '',
  email: '',
  managerId: '',
  workingDays: 'MON,TUE,WED,THU,FRI',
  openingTime: '09:00',
  closingTime: '17:00',
  cashEnabled: true,
  forexEnabled: false,
  loansEnabled: false,
  tradeEnabled: false,
  cashHoldingLimit: '',
  createdBy: 'OPS-PORTAL',
};

export default function BranchPage() {
  const { addToast } = useUIStore();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...initForm });

  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['branches'],
    queryFn: () => cbsApi.get(`/v1/config/branches?institutionId=${DEFAULT_INSTITUTION_ID}`).then(r => r.data.data).catch(() => []),
  });

  const branches: Record<string, unknown>[] = data?.content ?? (Array.isArray(data) ? data : []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'branchCode', header: 'Code', render: row => <span className="font-mono font-bold text-[#185FA5]">{String(row.branchCode ?? '—')}</span> },
    { key: 'branchName', header: 'Name' },
    { key: 'branchType', header: 'Type' },
    { key: 'timezone', header: 'Timezone' },
    { key: 'phone', header: 'Phone' },
    { key: 'cashEnabled', header: 'Cash', render: row => <span className={row.cashEnabled ? 'text-[#0F6E56] font-semibold text-[10px]' : 'text-[#8A9BAB] text-[10px]'}>{row.cashEnabled ? '✓' : '—'}</span> },
    { key: 'isActive', header: 'Status', render: row => <StatusBadge status={(row.isActive ?? row.active) ? 'ACTIVE' : 'INACTIVE'} /> },
  ];

  const handleCreate = async () => {
    if (!form.branchCode || !form.branchName || !form.timezone) {
      addToast('error', 'Branch Code, Name and Timezone are required');
      return;
    }
    setSaving(true);
    try {
      await cbsApi.post('/v1/config/branches', {
        institutionId: DEFAULT_INSTITUTION_ID,
        branchCode: form.branchCode,
        branchName: form.branchName,
        branchType: form.branchType,
        timezone: form.timezone,
        createdBy: form.createdBy,
        ...(form.sortCode && { sortCode: form.sortCode }),
        ...(form.ifscCode && { ifscCode: form.ifscCode }),
        ...(form.bsbCode && { bsbCode: form.bsbCode }),
        ...(form.routingNumber && { routingNumber: form.routingNumber }),
        ...(form.phone && { phone: form.phone }),
        ...(form.email && { email: form.email }),
        ...(form.managerId && { managerId: form.managerId }),
        workingDays: form.workingDays,
        openingTime: form.openingTime,
        closingTime: form.closingTime,
        cashEnabled: form.cashEnabled,
        forexEnabled: form.forexEnabled,
        loansEnabled: form.loansEnabled,
        tradeEnabled: form.tradeEnabled,
        ...(form.cashHoldingLimit && { cashHoldingLimit: parseFloat(form.cashHoldingLimit) }),
      });
      addToast('success', 'Branch created');
      setShowModal(false);
      setForm({ ...initForm });
      refetch();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to create branch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Branches"
        subtitle="Branch network management"
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><PlusCircle size={13} /> Create Branch</button>}
      />
      <DataTable columns={columns} data={branches} isLoading={isLoading} emptyMessage="No branches found — check CBS Maintenance service (port 8080)" />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[620px] max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Create Branch</h2>

            <div className="space-y-4">
              {/* Identity */}
              <div className="grid grid-cols-2 gap-3">
                <F label="Branch Code" required>
                  <input value={form.branchCode} onChange={e => set('branchCode', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. BR001" />
                </F>
                <F label="Branch Type" required>
                  <select value={form.branchType} onChange={e => set('branchType', e.target.value)} className="input-field">
                    <option value="HEAD_OFFICE">Head Office</option>
                    <option value="REGIONAL">Regional</option>
                    <option value="STANDARD">Standard</option>
                    <option value="MINI">Mini</option>
                    <option value="DIGITAL">Digital</option>
                    <option value="AGENT">Agent</option>
                  </select>
                </F>
              </div>
              <F label="Branch Name" required>
                <input value={form.branchName} onChange={e => set('branchName', e.target.value)} className="input-field" placeholder="e.g. London City Branch" />
              </F>
              <F label="Timezone" required>
                <input value={form.timezone} onChange={e => set('timezone', e.target.value)} className="input-field" placeholder="e.g. Europe/London, UTC, America/New_York" />
              </F>

              {/* Routing codes */}
              <div className="border-t border-[#D8E2EC] pt-3">
                <p className="text-[9px] font-bold text-[#5A6A7A] uppercase tracking-widest mb-2">Routing Codes</p>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Sort Code">
                    <input value={form.sortCode} onChange={e => set('sortCode', e.target.value)} className="input-field" placeholder="e.g. 20-45-67" />
                  </F>
                  <F label="IFSC Code">
                    <input value={form.ifscCode} onChange={e => set('ifscCode', e.target.value)} className="input-field" placeholder="e.g. SBIN0001234" />
                  </F>
                  <F label="BSB Code">
                    <input value={form.bsbCode} onChange={e => set('bsbCode', e.target.value)} className="input-field" placeholder="e.g. 062-000" />
                  </F>
                  <F label="Routing Number">
                    <input value={form.routingNumber} onChange={e => set('routingNumber', e.target.value)} className="input-field" placeholder="e.g. 021000021" />
                  </F>
                </div>
              </div>

              {/* Contact */}
              <div className="border-t border-[#D8E2EC] pt-3">
                <p className="text-[9px] font-bold text-[#5A6A7A] uppercase tracking-widest mb-2">Contact</p>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Phone">
                    <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="+44 20 1234 5678" />
                  </F>
                  <F label="Email">
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="branch@bank.com" />
                  </F>
                </div>
                <F label="Manager ID">
                  <input value={form.managerId} onChange={e => set('managerId', e.target.value)} className="input-field" placeholder="Manager user UUID" />
                </F>
              </div>

              {/* Operating hours */}
              <div className="border-t border-[#D8E2EC] pt-3">
                <p className="text-[9px] font-bold text-[#5A6A7A] uppercase tracking-widest mb-2">Operating Hours</p>
                <F label="Working Days" hint="Comma-separated: MON,TUE,WED,THU,FRI">
                  <input value={form.workingDays} onChange={e => set('workingDays', e.target.value)} className="input-field" placeholder="MON,TUE,WED,THU,FRI" />
                </F>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <F label="Opening Time">
                    <input type="time" value={form.openingTime} onChange={e => set('openingTime', e.target.value)} className="input-field" />
                  </F>
                  <F label="Closing Time">
                    <input type="time" value={form.closingTime} onChange={e => set('closingTime', e.target.value)} className="input-field" />
                  </F>
                </div>
              </div>

              {/* Capabilities */}
              <div className="border-t border-[#D8E2EC] pt-3">
                <p className="text-[9px] font-bold text-[#5A6A7A] uppercase tracking-widest mb-2">Capabilities</p>
                <div className="grid grid-cols-2 gap-2">
                  {([['cashEnabled', 'Cash Enabled'], ['forexEnabled', 'Forex Enabled'], ['loansEnabled', 'Loans Enabled'], ['tradeEnabled', 'Trade Finance']] as [keyof typeof form, string][]).map(([field, label]) => (
                    <label key={field} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[field] as boolean} onChange={e => set(field, e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                      <span className="text-[11px] text-[#5A6A7A]">{label}</span>
                    </label>
                  ))}
                </div>
                {form.cashEnabled && (
                  <div className="mt-3">
                    <F label="Cash Holding Limit">
                      <input type="number" value={form.cashHoldingLimit} onChange={e => set('cashHoldingLimit', e.target.value)} className="input-field" placeholder="Max cash on premises" min="0" />
                    </F>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Branch'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
