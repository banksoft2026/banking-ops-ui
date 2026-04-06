import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { accountApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useUIStore } from '../../store/uiStore';

const ACCOUNT_TYPES = ['ALL', 'CURRENT', 'SAVINGS', 'LOAN', 'DEPOSIT'];
const STATUSES = ['ALL', 'ACTIVE', 'INACTIVE'];

export default function AccountProductsPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [accountType, setAccountType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    productCode: '',
    productName: '',
    accountType: 'CURRENT',
    segment: 'RETAIL',
    currency: 'USD',
  });

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
    { key: 'segment', header: 'Segment' },
    { key: 'currency', header: 'Currency' },
    { key: 'status', header: 'Status', render: row => <StatusBadge status={String(row.status ?? '')} /> },
  ];

  const handleCreate = async () => {
    if (!form.productCode || !form.productName) {
      addToast('error', 'Product Code and Name are required');
      return;
    }
    setSaving(true);
    try {
      await accountApi.post('/v1/products', form);
      addToast('success', 'Product created');
      setShowModal(false);
      setForm({ productCode: '', productName: '', accountType: 'CURRENT', segment: 'RETAIL', currency: 'USD' });
      refetch();
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
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <PlusCircle size={13} /> Create Product
          </button>
        }
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
          <div className="relative bg-white rounded-lg p-6 w-[500px] shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Create Account Product</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Product Code *</label>
                <input value={form.productCode} onChange={e => setForm(f => ({ ...f, productCode: e.target.value }))} className="input-field" placeholder="e.g. SAV-001" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Product Name *</label>
                <input value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} className="input-field" placeholder="e.g. Regular Savings Account" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Account Type</label>
                <select value={form.accountType} onChange={e => setForm(f => ({ ...f, accountType: e.target.value }))} className="input-field">
                  <option value="CURRENT">Current</option>
                  <option value="SAVINGS">Savings</option>
                  <option value="LOAN">Loan</option>
                  <option value="DEPOSIT">Deposit</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Segment</label>
                <select value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} className="input-field">
                  <option value="RETAIL">Retail</option>
                  <option value="SME">SME</option>
                  <option value="CORPORATE">Corporate</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Currency</label>
                <input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="input-field" placeholder="USD" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
