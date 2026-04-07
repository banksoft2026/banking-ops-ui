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
  branchId: '',
  txnCodeId: '',
  channel: '',
  accountType: '',
  currencyCode: '',
  singleAuthBelow: '',
  dualAuthFrom: '',
  dualAuthTo: '',
  boardAuthAbove: '',
  firstAuthRole: 'TELLER',
  secondAuthRole: 'BRANCH_MANAGER',
  boardAuthRole: 'SENIOR_MANAGER',
  timeRestricted: false,
  authStartTime: '09:00',
  authEndTime: '17:00',
};

export default function AuthMatrixPage() {
  const { addToast } = useUIStore();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...initForm });

  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth-matrix'],
    queryFn: () => cbsApi.get(`/v1/config/auth-matrix?institutionId=${DEFAULT_INSTITUTION_ID}`).then(r => r.data.data).catch(() => []),
  });

  const rules: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.content ?? []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'txnCodeId', header: 'Txn Code', render: row => <span className="font-mono text-[#185FA5] font-semibold">{String(row.txnCodeId ?? row.txnCode ?? '— Any —')}</span> },
    { key: 'channel', header: 'Channel', render: row => <span className="text-[10px]">{String(row.channel ?? '— Any —')}</span> },
    { key: 'accountType', header: 'Acct Type', render: row => <span className="text-[10px]">{String(row.accountType ?? '— Any —')}</span> },
    { key: 'singleAuthBelow', header: 'Single Auth Below', render: row => row.singleAuthBelow != null ? Number(row.singleAuthBelow).toLocaleString() : '—', className: 'text-right' },
    { key: 'dualAuthFrom', header: 'Dual Auth From', render: row => row.dualAuthFrom != null ? Number(row.dualAuthFrom).toLocaleString() : '—', className: 'text-right' },
    { key: 'dualAuthTo', header: 'Dual Auth To', render: row => row.dualAuthTo != null ? Number(row.dualAuthTo).toLocaleString() : 'Unlimited', className: 'text-right' },
    { key: 'firstAuthRole', header: 'First Auth Role' },
    { key: 'timeRestricted', header: 'Time Restricted', render: row => row.timeRestricted ? <span className="text-[#185FA5] font-semibold text-[10px]">✓</span> : <span className="text-[#8A9BAB] text-[10px]">—</span> },
  ];

  const handleCreate = async () => {
    if (!form.singleAuthBelow || !form.dualAuthFrom) {
      addToast('error', 'Single Auth Below and Dual Auth From amounts are required');
      return;
    }
    setSaving(true);
    try {
      await cbsApi.post('/v1/config/auth-matrix', {
        institutionId: DEFAULT_INSTITUTION_ID,
        singleAuthBelow: parseFloat(form.singleAuthBelow),
        dualAuthFrom: parseFloat(form.dualAuthFrom),
        firstAuthRole: form.firstAuthRole,
        secondAuthRole: form.secondAuthRole,
        boardAuthRole: form.boardAuthRole,
        timeRestricted: form.timeRestricted,
        ...(form.branchId && { branchId: form.branchId }),
        ...(form.txnCodeId && { txnCodeId: form.txnCodeId }),
        ...(form.channel && { channel: form.channel }),
        ...(form.accountType && { accountType: form.accountType }),
        ...(form.currencyCode && { currencyCode: form.currencyCode }),
        ...(form.dualAuthTo && { dualAuthTo: parseFloat(form.dualAuthTo) }),
        ...(form.boardAuthAbove && { boardAuthAbove: parseFloat(form.boardAuthAbove) }),
        ...(form.timeRestricted && form.authStartTime && { authStartTime: form.authStartTime }),
        ...(form.timeRestricted && form.authEndTime && { authEndTime: form.authEndTime }),
      });
      addToast('success', 'Auth rule created');
      setShowModal(false);
      setForm({ ...initForm });
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
        subtitle="Transaction authorisation threshold rules"
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><PlusCircle size={13} /> Add Rule</button>}
      />
      <DataTable columns={columns} data={rules} isLoading={isLoading} emptyMessage="No auth rules found — check CBS Maintenance service (port 8080)" />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Add Auth Rule</h2>
            <div className="space-y-4">

              <div className="border-b border-[#D8E2EC] pb-3">
                <p className="text-[9px] font-bold text-[#5A6A7A] uppercase tracking-widest mb-3">Scope (all optional — blank means applies to all)</p>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Branch ID" hint="Leave blank for all branches">
                    <input value={form.branchId} onChange={e => set('branchId', e.target.value)} className="input-field" placeholder="Branch UUID" />
                  </F>
                  <F label="Transaction Code ID" hint="Leave blank for all codes">
                    <input value={form.txnCodeId} onChange={e => set('txnCodeId', e.target.value)} className="input-field" placeholder="Txn code UUID or code" />
                  </F>
                  <F label="Channel" hint="e.g. BRANCH, SWIFT, SEPA, API">
                    <input value={form.channel} onChange={e => set('channel', e.target.value)} className="input-field" placeholder="Leave blank for all channels" />
                  </F>
                  <F label="Account Type" hint="e.g. CURRENT, SAVINGS">
                    <input value={form.accountType} onChange={e => set('accountType', e.target.value)} className="input-field" placeholder="Leave blank for all types" />
                  </F>
                  <F label="Currency Code">
                    <input value={form.currencyCode} onChange={e => set('currencyCode', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. USD (blank = all)" maxLength={3} />
                  </F>
                </div>
              </div>

              <div className="border-b border-[#D8E2EC] pb-3">
                <p className="text-[9px] font-bold text-[#5A6A7A] uppercase tracking-widest mb-3">Authorisation Thresholds</p>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Single Auth — amounts below" required hint="Transactions below this value need 1 authoriser">
                    <input type="number" value={form.singleAuthBelow} onChange={e => set('singleAuthBelow', e.target.value)} className="input-field" placeholder="e.g. 10000" min="0" step="0.01" />
                  </F>
                  <F label="Dual Auth — from amount" required hint="Transactions from this value need 2 authorisers">
                    <input type="number" value={form.dualAuthFrom} onChange={e => set('dualAuthFrom', e.target.value)} className="input-field" placeholder="e.g. 10000" min="0" step="0.01" />
                  </F>
                  <F label="Dual Auth — to amount" hint="Leave blank for unlimited upper bound">
                    <input type="number" value={form.dualAuthTo} onChange={e => set('dualAuthTo', e.target.value)} className="input-field" placeholder="e.g. 500000 or blank" min="0" />
                  </F>
                  <F label="Board Auth — above amount" hint="Transactions above this need board-level approval">
                    <input type="number" value={form.boardAuthAbove} onChange={e => set('boardAuthAbove', e.target.value)} className="input-field" placeholder="e.g. 1000000" min="0" />
                  </F>
                </div>
              </div>

              <div className="border-b border-[#D8E2EC] pb-3">
                <p className="text-[9px] font-bold text-[#5A6A7A] uppercase tracking-widest mb-3">Authoriser Roles</p>
                <div className="grid grid-cols-3 gap-3">
                  <F label="First Auth Role">
                    <input value={form.firstAuthRole} onChange={e => set('firstAuthRole', e.target.value)} className="input-field" placeholder="e.g. TELLER" />
                  </F>
                  <F label="Second Auth Role">
                    <input value={form.secondAuthRole} onChange={e => set('secondAuthRole', e.target.value)} className="input-field" placeholder="e.g. BRANCH_MANAGER" />
                  </F>
                  <F label="Board Auth Role">
                    <input value={form.boardAuthRole} onChange={e => set('boardAuthRole', e.target.value)} className="input-field" placeholder="e.g. SENIOR_MANAGER" />
                  </F>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={form.timeRestricted} onChange={e => set('timeRestricted', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                  <span className="text-[11px] text-[#5A6A7A]">Time-restricted authorisation window</span>
                </label>
                {form.timeRestricted && (
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Auth Start Time">
                      <input type="time" value={form.authStartTime} onChange={e => set('authStartTime', e.target.value)} className="input-field" />
                    </F>
                    <F label="Auth End Time">
                      <input type="time" value={form.authEndTime} onChange={e => set('authEndTime', e.target.value)} className="input-field" />
                    </F>
                  </div>
                )}
              </div>
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
