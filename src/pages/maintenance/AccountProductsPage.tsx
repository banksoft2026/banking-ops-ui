import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { accountApi } from '../../lib/api';
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

const ACCOUNT_TYPES = ['ALL', 'CURRENT', 'SAVINGS', 'LOAN', 'DEPOSIT', 'CALL', 'OVERDRAFT'];
const STATUSES = ['ALL', 'ACTIVE', 'INACTIVE'];
const today = new Date().toISOString().split('T')[0];

const initForm = {
  productCode: '',
  productName: '',
  accountType: 'CURRENT',
  targetSegment: 'RETAIL',
  currencyCode: 'USD',
  description: '',
  allowJoint: false,
  allowCorporate: true,
  allowIndividual: true,
  minOpeningBalance: '0',
  maxBalance: '',
  maxAccountPerCustomer: '',
  effectiveFrom: today,
  effectiveTo: '',
  createdBy: 'OPS-PORTAL',
};

export default function AccountProductsPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [accountType, setAccountType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...initForm });

  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products', accountType, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: '20' });
      if (accountType !== 'ALL') params.set('accountType', accountType);
      if (status !== 'ALL') params.set('status', status);
      const res = await accountApi.get(`/v1/products?${params}`).catch(() => ({ data: { data: null } }));
      return res.data.data;
    },
    retry: false,
  });

  const products: Record<string, unknown>[] = data?.content ?? (Array.isArray(data) ? data : []);
  const total = data?.totalElements ?? 0;

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'productCode', header: 'Code', render: row => <span className="font-mono font-semibold text-[#185FA5]">{String(row.productCode ?? '—')}</span> },
    { key: 'productName', header: 'Name', render: row => <span className="font-medium">{String(row.productName ?? '—')}</span> },
    { key: 'accountType', header: 'Account Type' },
    { key: 'targetSegment', header: 'Segment', render: row => String(row.targetSegment ?? row.segment ?? '—') },
    { key: 'currencyCode', header: 'Currency', render: row => String(row.currencyCode ?? row.currency ?? '—') },
    { key: 'minOpeningBalance', header: 'Min Opening', render: row => row.minOpeningBalance != null ? Number(row.minOpeningBalance).toLocaleString() : '—', className: 'text-right' },
    { key: 'allowJoint', header: 'Joint', render: row => row.allowJoint ? <span className="text-[#0F6E56] text-[10px]">✓</span> : <span className="text-[#8A9BAB] text-[10px]">—</span> },
    { key: 'status', header: 'Status', render: row => <StatusBadge status={String(row.status ?? '')} /> },
  ];

  const handleCreate = async () => {
    if (!form.productCode || !form.productName || !form.effectiveFrom) {
      addToast('error', 'Product Code, Name and Effective From date are required');
      return;
    }
    setSaving(true);
    try {
      const res = await accountApi.post('/v1/products', {
        productCode: form.productCode.toUpperCase(),
        productName: form.productName,
        accountType: form.accountType,
        targetSegment: form.targetSegment,
        currencyCode: form.currencyCode.toUpperCase(),
        effectiveFrom: form.effectiveFrom,
        allowJoint: form.allowJoint,
        allowCorporate: form.allowCorporate,
        allowIndividual: form.allowIndividual,
        minOpeningBalance: parseFloat(form.minOpeningBalance) || 0,
        createdBy: form.createdBy,
        ...(form.description && { description: form.description }),
        ...(form.maxBalance && { maxBalance: parseFloat(form.maxBalance) }),
        ...(form.maxAccountPerCustomer && { maxAccountPerCustomer: parseInt(form.maxAccountPerCustomer) }),
        ...(form.effectiveTo && { effectiveTo: form.effectiveTo }),
      });
      const newId = (res.data.data ?? res.data)?.productId ?? (res.data.data ?? res.data)?.id;
      addToast('success', 'Product created');
      setShowModal(false);
      setForm({ ...initForm });
      refetch();
      if (newId) navigate(`/maintenance/products/${newId}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Account Products"
        subtitle="Product catalogue for account opening"
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><PlusCircle size={13} /> Create Product</button>}
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div>
          <label className="text-xs text-[#5A6A7A] mr-2">Type:</label>
          <select value={accountType} onChange={e => { setAccountType(e.target.value); setPage(0); }} className="input-field w-36">
            {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#5A6A7A] mr-2">Status:</label>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); }} className="input-field w-32">
            {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All' : s}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        onRowClick={row => navigate(`/maintenance/products/${row.productId ?? row.id}`)}
        pagination={{ page, pageSize: 20, total, onPageChange: setPage }}
        emptyMessage="No products found"
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[620px] max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Create Account Product</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <F label="Product Code" required hint="Unique identifier, e.g. SAV-001">
                  <input value={form.productCode} onChange={e => set('productCode', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. SAV-001" maxLength={20} />
                </F>
                <F label="Product Name" required>
                  <input value={form.productName} onChange={e => set('productName', e.target.value)} className="input-field" placeholder="e.g. Regular Savings Account" />
                </F>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <F label="Account Type" required>
                  <select value={form.accountType} onChange={e => set('accountType', e.target.value)} className="input-field">
                    <option value="CURRENT">Current</option>
                    <option value="SAVINGS">Savings</option>
                    <option value="LOAN">Loan</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="CALL">Call</option>
                    <option value="OVERDRAFT">Overdraft</option>
                  </select>
                </F>
                <F label="Target Segment" required>
                  <select value={form.targetSegment} onChange={e => set('targetSegment', e.target.value)} className="input-field">
                    <option value="RETAIL">Retail</option>
                    <option value="SME">SME</option>
                    <option value="CORPORATE">Corporate</option>
                    <option value="PRIVATE">Private</option>
                    <option value="ALL">All</option>
                  </select>
                </F>
                <F label="Currency Code" required>
                  <input value={form.currencyCode} onChange={e => set('currencyCode', e.target.value.toUpperCase())} className="input-field" placeholder="USD" maxLength={3} />
                </F>
              </div>
              <F label="Description">
                <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input-field h-16 resize-none" placeholder="Optional product description" />
              </F>
              <div className="border-t border-[#D8E2EC] pt-3">
                <p className="text-[9px] font-bold text-[#5A6A7A] uppercase tracking-widest mb-3">Limits & Restrictions</p>
                <div className="grid grid-cols-3 gap-3">
                  <F label="Min Opening Balance">
                    <input type="number" value={form.minOpeningBalance} onChange={e => set('minOpeningBalance', e.target.value)} className="input-field" placeholder="0" min="0" step="0.01" />
                  </F>
                  <F label="Max Balance" hint="Leave blank for no limit">
                    <input type="number" value={form.maxBalance} onChange={e => set('maxBalance', e.target.value)} className="input-field" placeholder="No limit" min="0" />
                  </F>
                  <F label="Max Accounts / Customer">
                    <input type="number" value={form.maxAccountPerCustomer} onChange={e => set('maxAccountPerCustomer', e.target.value)} className="input-field" placeholder="No limit" min="1" />
                  </F>
                </div>
              </div>
              <div className="border-t border-[#D8E2EC] pt-3">
                <p className="text-[9px] font-bold text-[#5A6A7A] uppercase tracking-widest mb-3">Eligibility</p>
                <div className="flex gap-6">
                  {([['allowIndividual', 'Allow Individual'], ['allowCorporate', 'Allow Corporate'], ['allowJoint', 'Allow Joint']] as [keyof typeof form, string][]).map(([field, label]) => (
                    <label key={field} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[field] as boolean} onChange={e => set(field, e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                      <span className="text-[11px] text-[#5A6A7A]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="border-t border-[#D8E2EC] pt-3">
                <p className="text-[9px] font-bold text-[#5A6A7A] uppercase tracking-widest mb-3">Effective Dates</p>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Effective From" required>
                    <input type="date" value={form.effectiveFrom} onChange={e => set('effectiveFrom', e.target.value)} className="input-field" />
                  </F>
                  <F label="Effective To (optional)">
                    <input type="date" value={form.effectiveTo} onChange={e => set('effectiveTo', e.target.value)} className="input-field" />
                  </F>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Product'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
