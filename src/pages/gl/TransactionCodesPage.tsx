import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { cbsApi } from '../../lib/api';
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
  txnCode: '',
  txnName: '',
  txnCategory: 'PAYMENT',
  txnDirection: 'DEBIT',
  accountTypeScope: '',
  channelScope: '',
  affectsAvailableBalance: true,
  affectsLedgerBalance: true,
  affectsClearedBalance: false,
  requiresValueDate: false,
  valueDateOffsetDays: '0',
  reversible: true,
  reversalWindowHours: '24',
  requiresAuthorisation: false,
  authMatrixRef: '',
  limitCheckType: 'NONE',
  narrativeTemplate: '',
  isoTxnCode: '',
  createdBy: 'OPS-PORTAL',
};

export default function TransactionCodesPage() {
  const { addToast } = useUIStore();
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...initForm });

  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['txn-codes', page],
    queryFn: () => cbsApi.get(`/v1/transaction-codes?page=${page}&size=20`).then(r => r.data.data).catch(() => null),
    retry: false,
  });

  const codes: Record<string, unknown>[] = data?.content ?? (Array.isArray(data) ? data : []);
  const total = data?.totalElements ?? 0;

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'txnCode', header: 'Code', render: row => <span className="font-mono font-semibold text-[#185FA5]">{String(row.txnCode ?? '—')}</span> },
    { key: 'txnName', header: 'Name', render: row => <span className="font-medium">{String(row.txnName ?? '—')}</span> },
    { key: 'txnCategory', header: 'Category', render: row => <span className="text-[10px] uppercase">{String(row.txnCategory ?? '—')}</span> },
    { key: 'txnDirection', header: 'Direction', render: row => (
      <span className={`font-semibold text-[10px] uppercase ${row.txnDirection === 'CREDIT' ? 'text-[#0F6E56]' : row.txnDirection === 'DEBIT' ? 'text-[#A32D2D]' : 'text-[#5A6A7A]'}`}>
        {String(row.txnDirection ?? '—')}
      </span>
    )},
    { key: 'reversible', header: 'Reversible', render: row => row.reversible ? <span className="text-[#0F6E56] text-[10px] font-semibold">✓</span> : <span className="text-[#8A9BAB] text-[10px]">—</span> },
    { key: 'requiresAuthorisation', header: 'Auth Req.', render: row => row.requiresAuthorisation ? <span className="text-[#185FA5] text-[10px] font-semibold">✓</span> : <span className="text-[#8A9BAB] text-[10px]">—</span> },
    { key: 'isActive', header: 'Status', render: row => <StatusBadge status={row.isActive !== false ? 'ACTIVE' : 'INACTIVE'} /> },
  ];

  const handleCreate = async () => {
    if (!form.txnCode || !form.txnName || !form.txnCategory || !form.txnDirection) {
      addToast('error', 'Code, Name, Category and Direction are required');
      return;
    }
    setSaving(true);
    try {
      await cbsApi.post('/v1/transaction-codes', {
        txnCode: form.txnCode.toUpperCase(),
        txnName: form.txnName,
        txnCategory: form.txnCategory,
        txnDirection: form.txnDirection,
        affectsAvailableBalance: form.affectsAvailableBalance,
        affectsLedgerBalance: form.affectsLedgerBalance,
        affectsClearedBalance: form.affectsClearedBalance,
        requiresValueDate: form.requiresValueDate,
        reversible: form.reversible,
        requiresAuthorisation: form.requiresAuthorisation,
        limitCheckType: form.limitCheckType,
        createdBy: form.createdBy,
        ...(form.accountTypeScope && { accountTypeScope: form.accountTypeScope }),
        ...(form.channelScope && { channelScope: form.channelScope }),
        ...(form.requiresValueDate && form.valueDateOffsetDays && { valueDateOffsetDays: parseInt(form.valueDateOffsetDays) }),
        ...(form.reversible && form.reversalWindowHours && { reversalWindowHours: parseInt(form.reversalWindowHours) }),
        ...(form.requiresAuthorisation && form.authMatrixRef && { authMatrixRef: form.authMatrixRef }),
        ...(form.narrativeTemplate && { narrativeTemplate: form.narrativeTemplate }),
        ...(form.isoTxnCode && { isoTxnCode: form.isoTxnCode }),
      });
      addToast('success', 'Transaction code created');
      setShowModal(false);
      setForm({ ...initForm });
      refetch();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to create transaction code');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Transaction Codes"
        subtitle="Manage transaction type definitions and GL mappings"
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><PlusCircle size={13} /> Add Code</button>}
      />
      <DataTable
        columns={columns}
        data={codes}
        isLoading={isLoading}
        pagination={{ page, pageSize: 20, total, onPageChange: setPage }}
        emptyMessage="No transaction codes found — check CBS Maintenance service (port 8080)"
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[640px] max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Add Transaction Code</h2>
            <div className="space-y-4">

              {/* Core Fields */}
              <div className="grid grid-cols-2 gap-3">
                <F label="Transaction Code" required hint="Unique code e.g. CASH_DEP, WIRE_OUT">
                  <input value={form.txnCode} onChange={e => set('txnCode', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. CASH_DEP" maxLength={30} />
                </F>
                <F label="Transaction Name" required>
                  <input value={form.txnName} onChange={e => set('txnName', e.target.value)} className="input-field" placeholder="e.g. Cash Deposit" />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Category" required>
                  <select value={form.txnCategory} onChange={e => set('txnCategory', e.target.value)} className="input-field">
                    <option value="PAYMENT">Payment</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="CHARGE">Charge</option>
                    <option value="INTEREST">Interest</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                    <option value="REVERSAL">Reversal</option>
                    <option value="FEE">Fee</option>
                    <option value="INTERNAL">Internal</option>
                  </select>
                </F>
                <F label="Direction" required>
                  <select value={form.txnDirection} onChange={e => set('txnDirection', e.target.value)} className="input-field">
                    <option value="DEBIT">Debit</option>
                    <option value="CREDIT">Credit</option>
                    <option value="BOTH">Both</option>
                  </select>
                </F>
              </div>

              {/* Scope */}
              <div className="border-t border-[#D8E2EC] pt-3">
                <p className="text-[9px] font-bold text-[#5A6A7A] uppercase tracking-widest mb-3">Scope (optional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Account Type Scope" hint="Comma-separated e.g. CURRENT,SAVINGS">
                    <input value={form.accountTypeScope} onChange={e => set('accountTypeScope', e.target.value)} className="input-field" placeholder="e.g. CURRENT,SAVINGS" />
                  </F>
                  <F label="Channel Scope" hint="Comma-separated e.g. BRANCH,API">
                    <input value={form.channelScope} onChange={e => set('channelScope', e.target.value)} className="input-field" placeholder="e.g. BRANCH,SWIFT,API" />
                  </F>
                </div>
              </div>

              {/* Balance Impacts */}
              <div className="border-t border-[#D8E2EC] pt-3">
                <p className="text-[9px] font-bold text-[#5A6A7A] uppercase tracking-widest mb-3">Balance Impact</p>
                <div className="flex gap-6">
                  {([
                    ['affectsAvailableBalance', 'Available Balance'],
                    ['affectsLedgerBalance', 'Ledger Balance'],
                    ['affectsClearedBalance', 'Cleared Balance'],
                  ] as [keyof typeof form, string][]).map(([field, label]) => (
                    <label key={field} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[field] as boolean} onChange={e => set(field, e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                      <span className="text-[11px] text-[#5A6A7A]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Value Date */}
              <div className="border-t border-[#D8E2EC] pt-3">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={form.requiresValueDate} onChange={e => set('requiresValueDate', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                  <span className="text-[11px] text-[#5A6A7A] font-semibold">Requires Value Date</span>
                </label>
                {form.requiresValueDate && (
                  <F label="Value Date Offset Days" hint="Number of days offset from transaction date">
                    <input type="number" value={form.valueDateOffsetDays} onChange={e => set('valueDateOffsetDays', e.target.value)} className="input-field w-32" min="0" max="30" />
                  </F>
                )}
              </div>

              {/* Reversal */}
              <div className="border-t border-[#D8E2EC] pt-3">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={form.reversible} onChange={e => set('reversible', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                  <span className="text-[11px] text-[#5A6A7A] font-semibold">Reversible</span>
                </label>
                {form.reversible && (
                  <F label="Reversal Window (hours)" hint="Time window in which reversal is allowed">
                    <input type="number" value={form.reversalWindowHours} onChange={e => set('reversalWindowHours', e.target.value)} className="input-field w-32" min="1" max="720" />
                  </F>
                )}
              </div>

              {/* Authorisation */}
              <div className="border-t border-[#D8E2EC] pt-3">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={form.requiresAuthorisation} onChange={e => set('requiresAuthorisation', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                  <span className="text-[11px] text-[#5A6A7A] font-semibold">Requires Authorisation</span>
                </label>
                {form.requiresAuthorisation && (
                  <F label="Auth Matrix Reference" hint="Reference to auth matrix rule UUID">
                    <input value={form.authMatrixRef} onChange={e => set('authMatrixRef', e.target.value)} className="input-field" placeholder="Auth matrix rule UUID or code" />
                  </F>
                )}
              </div>

              {/* Limit & Misc */}
              <div className="border-t border-[#D8E2EC] pt-3">
                <p className="text-[9px] font-bold text-[#5A6A7A] uppercase tracking-widest mb-3">Limits & References</p>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Limit Check Type">
                    <select value={form.limitCheckType} onChange={e => set('limitCheckType', e.target.value)} className="input-field">
                      <option value="NONE">None</option>
                      <option value="DAILY">Daily</option>
                      <option value="TRANSACTION">Per Transaction</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </F>
                  <F label="ISO Transaction Code" hint="e.g. CRED, DBIT (ISO 20022)">
                    <input value={form.isoTxnCode} onChange={e => set('isoTxnCode', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. CRED" maxLength={10} />
                  </F>
                </div>
                <div className="mt-3">
                  <F label="Narrative Template" hint="Use {amount}, {account}, {date} as placeholders">
                    <input value={form.narrativeTemplate} onChange={e => set('narrativeTemplate', e.target.value)} className="input-field" placeholder="e.g. Cash deposit of {amount} to {account}" maxLength={200} />
                  </F>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Add Code'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
