import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { accountApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
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

export default function OpenAccountPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    productId: '',
    accountName: '',
    shortName: '',
    customerId: '',
    entityId: '',
    branchCode: '',
    purposeCode: '',
    riskCategory: 'LOW',
    ownershipType: 'SOLE',
    relationshipManagerId: '',
    createdBy: 'OPS-PORTAL',
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => accountApi.get('/v1/products').then(r => r.data.data).catch(() => []),
  });

  const products: Record<string, unknown>[] = productsData?.content ?? (Array.isArray(productsData) ? productsData : []);

  const selectedProduct = products.find(p => String(p.productId ?? p.id ?? '') === form.productId) as Record<string, unknown> | undefined;

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
        master: {
          accountName: form.accountName,
          customerId: form.customerId,
          branchCode: form.branchCode,
          riskCategory: form.riskCategory,
          ownershipType: form.ownershipType,
          createdBy: form.createdBy,
          ...(form.shortName && { shortName: form.shortName }),
          ...(form.entityId && { entityId: form.entityId }),
          ...(form.purposeCode && { purposeCode: form.purposeCode }),
          ...(form.relationshipManagerId && { relationshipManagerId: form.relationshipManagerId }),
        },
      };
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
      <div className="max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-0">

          {/* Product Selection */}
          <div className="card mb-4">
            <h4 className="text-[11px] font-bold text-[#1B3A5C] mb-3 uppercase tracking-wide">Product</h4>
            <F label="Account Product" required hint="Select the product that defines account rules and parameters">
              <select value={form.productId} onChange={e => set('productId', e.target.value)} className="input-field">
                <option value="">— Select Product —</option>
                {products.map(p => (
                  <option key={String(p.productId ?? p.id ?? '')} value={String(p.productId ?? p.id ?? '')}>
                    {String(p.productCode ?? '')} – {String(p.productName ?? '')} ({String(p.accountType ?? '')})
                  </option>
                ))}
              </select>
            </F>
            {selectedProduct && (
              <div className="mt-3 p-3 bg-[#F0F2F5] rounded text-[10px] text-[#5A6A7A] grid grid-cols-3 gap-2">
                <span>Type: <strong>{String(selectedProduct.accountType ?? '—')}</strong></span>
                <span>Segment: <strong>{String(selectedProduct.targetSegment ?? selectedProduct.segment ?? '—')}</strong></span>
                <span>Currency: <strong>{String(selectedProduct.currencyCode ?? selectedProduct.currency ?? '—')}</strong></span>
              </div>
            )}
          </div>

          {/* Account Master */}
          <div className="card mb-4">
            <h4 className="text-[11px] font-bold text-[#1B3A5C] mb-3 uppercase tracking-wide">Account Details</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="Account Name" required>
                  <input value={form.accountName} onChange={e => set('accountName', e.target.value)} className="input-field" placeholder="e.g. John Smith Current Account" />
                </F>
                <F label="Short Name">
                  <input value={form.shortName} onChange={e => set('shortName', e.target.value)} className="input-field" placeholder="Abbreviated name" maxLength={50} />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Customer ID" required hint="UUID of the customer record">
                  <input value={form.customerId} onChange={e => set('customerId', e.target.value)} className="input-field" placeholder="Customer UUID" />
                </F>
                <F label="Entity ID" hint="UUID of linked corporate entity (optional)">
                  <input value={form.entityId} onChange={e => set('entityId', e.target.value)} className="input-field" placeholder="Entity UUID (optional)" />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Branch Code" required>
                  <input value={form.branchCode} onChange={e => set('branchCode', e.target.value)} className="input-field" placeholder="e.g. BR001" />
                </F>
                <F label="Purpose Code" hint="e.g. SAVINGS, PAYROLL, ESCROW">
                  <input value={form.purposeCode} onChange={e => set('purposeCode', e.target.value)} className="input-field" placeholder="e.g. SAVINGS" />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Risk Category">
                  <select value={form.riskCategory} onChange={e => set('riskCategory', e.target.value)} className="input-field">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </F>
                <F label="Ownership Type">
                  <select value={form.ownershipType} onChange={e => set('ownershipType', e.target.value)} className="input-field">
                    <option value="SOLE">Sole</option>
                    <option value="JOINT">Joint</option>
                    <option value="CORPORATE">Corporate</option>
                    <option value="TRUST">Trust</option>
                  </select>
                </F>
              </div>
              <F label="Relationship Manager ID">
                <input value={form.relationshipManagerId} onChange={e => set('relationshipManagerId', e.target.value)} className="input-field" placeholder="RM user UUID (optional)" />
              </F>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/accounts')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Opening Account...' : 'Open Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
