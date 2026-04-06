import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { accountApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { useUIStore } from '../../store/uiStore';

export default function OpenAccountPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    productId: '',
    customerId: '',
    entityId: '',
    branchCode: '',
    currencyCode: 'USD',
    accountName: '',
    purposeCode: '',
    createdBy: 'SYSTEM',
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => accountApi.get('/v1/products').then(r => r.data.data).catch(() => []),
  });

  const products: Record<string, unknown>[] = productsData?.content ?? (Array.isArray(productsData) ? productsData : []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.customerId || !form.branchCode || !form.accountName) {
      addToast('error', 'Product, Customer ID, Branch Code and Account Name are required');
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        productId: form.productId,
        customerId: form.customerId,
        branchCode: form.branchCode,
        currencyCode: form.currencyCode,
        accountName: form.accountName,
        purposeCode: form.purposeCode || undefined,
        createdBy: form.createdBy,
      };
      if (form.entityId) payload.entityId = form.entityId;
      const res = await accountApi.post('/v1/accounts', payload);
      const id = (res.data.data ?? res.data)?.accountId ?? (res.data.data ?? res.data)?.id;
      addToast('success', 'Account opened successfully');
      if (id) navigate(`/accounts/${id}`);
      else navigate('/accounts');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to open account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/accounts')} className="btn-ghost mb-4"><ArrowLeft size={13} /> Back</button>
      <PageHeader title="Open Account" subtitle="Create a new customer account" />
      <div className="card max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Product *</label>
            <select value={form.productId} onChange={e => set('productId', e.target.value)} className="input-field">
              <option value="">— Select Product —</option>
              {products.map(p => (
                <option key={String(p.productId ?? p.id ?? '')} value={String(p.productId ?? p.id ?? '')}>
                  {String(p.productCode ?? '')} – {String(p.productName ?? '')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Customer ID *</label>
            <input value={form.customerId} onChange={e => set('customerId', e.target.value)} className="input-field" placeholder="Customer UUID" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Entity ID (optional)</label>
            <input value={form.entityId} onChange={e => set('entityId', e.target.value)} className="input-field" placeholder="Entity UUID (optional)" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Branch Code *</label>
            <input value={form.branchCode} onChange={e => set('branchCode', e.target.value)} className="input-field" placeholder="e.g. BR001" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Currency Code</label>
            <input value={form.currencyCode} onChange={e => set('currencyCode', e.target.value)} className="input-field" placeholder="USD" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Account Name *</label>
            <input value={form.accountName} onChange={e => set('accountName', e.target.value)} className="input-field" placeholder="Account name" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Purpose Code</label>
            <input value={form.purposeCode} onChange={e => set('purposeCode', e.target.value)} className="input-field" placeholder="e.g. SAVINGS" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Created By</label>
            <input value={form.createdBy} onChange={e => set('createdBy', e.target.value)} className="input-field" placeholder="SYSTEM" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Opening Account...' : 'Open Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
