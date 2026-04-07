import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { accountApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
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

const TABS = ['Parameters', 'Interest Tiers', 'Charges'] as const;
type Tab = typeof TABS[number];
const today = new Date().toISOString().split('T')[0];

const initParam = { paramKey: '', paramLabel: '', valueType: 'DECIMAL', defaultValue: '', minValue: '', maxValue: '', overridableAtAccount: true, mandatory: false, effectiveFrom: today, effectiveTo: '' };
const initTier = { tierName: '', tierSequence: '1', balanceFrom: '0', balanceTo: '', creditRate: '0', debitRate: '0', rateType: 'FIXED', calculationBasis: 'DAILY_BALANCE', effectiveFrom: today, effectiveTo: '' };
const initCharge = { chargeCode: '', chargeName: '', chargeType: 'ACCOUNT_MAINTENANCE', chargeAmount: '0', chargeCurrency: 'USD', percentageRate: '', frequency: 'MONTHLY', triggerEvent: '', waivable: false, minBalanceForWaiver: '', isActive: true, effectiveFrom: today, effectiveTo: '' };

export default function AccountProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<Tab>('Parameters');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [paramForm, setParamForm] = useState({ ...initParam });
  const [tierForm, setTierForm] = useState({ ...initTier });
  const [chargeForm, setChargeForm] = useState({ ...initCharge });

  const setP = (field: string, value: string | boolean) => setParamForm(f => ({ ...f, [field]: value }));
  const setT = (field: string, value: string | boolean) => setTierForm(f => ({ ...f, [field]: value }));
  const setC = (field: string, value: string | boolean) => setChargeForm(f => ({ ...f, [field]: value }));

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => accountApi.get(`/v1/products/${productId}`).then(r => r.data.data).catch(() => null),
    enabled: !!productId,
  });

  const { data: parameters, isLoading: paramsLoading, refetch: refetchParams } = useQuery({
    queryKey: ['product-parameters', productId],
    queryFn: () => accountApi.get(`/v1/products/${productId}/parameters`).then(r => r.data.data).catch(() => []),
    enabled: !!productId && activeTab === 'Parameters',
  });

  const { data: tiers, isLoading: tiersLoading, refetch: refetchTiers } = useQuery({
    queryKey: ['product-tiers', productId],
    queryFn: () => accountApi.get(`/v1/products/${productId}/interest-tiers`).then(r => r.data.data).catch(() => []),
    enabled: !!productId && activeTab === 'Interest Tiers',
  });

  const { data: charges, isLoading: chargesLoading, refetch: refetchCharges } = useQuery({
    queryKey: ['product-charges', productId],
    queryFn: () => accountApi.get(`/v1/products/${productId}/charges`).then(r => r.data.data).catch(() => []),
    enabled: !!productId && activeTab === 'Charges',
  });

  const paramColumns: Column<Record<string, unknown>>[] = [
    { key: 'paramKey', header: 'Key', render: row => <span className="font-mono text-[#185FA5]">{String(row.paramKey ?? '—')}</span> },
    { key: 'paramLabel', header: 'Label' },
    { key: 'valueType', header: 'Type' },
    { key: 'defaultValue', header: 'Default' },
    { key: 'minValue', header: 'Min' },
    { key: 'maxValue', header: 'Max' },
    { key: 'overridableAtAccount', header: 'Override', render: row => row.overridableAtAccount ? '✓' : '—' },
    { key: 'mandatory', header: 'Mandatory', render: row => row.mandatory ? <span className="text-[#A32D2D] font-semibold text-[10px]">✓</span> : '—' },
  ];

  const tierColumns: Column<Record<string, unknown>>[] = [
    { key: 'tierSequence', header: 'Seq' },
    { key: 'tierName', header: 'Tier Name' },
    { key: 'balanceFrom', header: 'Balance From', render: row => Number(row.balanceFrom || 0).toLocaleString(), className: 'text-right' },
    { key: 'balanceTo', header: 'Balance To', render: row => row.balanceTo != null ? Number(row.balanceTo).toLocaleString() : 'Unlimited', className: 'text-right' },
    { key: 'creditRate', header: 'Credit Rate (%)', render: row => `${Number(row.creditRate || 0).toFixed(4)}%` },
    { key: 'debitRate', header: 'Debit Rate (%)', render: row => `${Number(row.debitRate || 0).toFixed(4)}%` },
    { key: 'rateType', header: 'Rate Type' },
    { key: 'calculationBasis', header: 'Basis' },
  ];

  const chargeColumns: Column<Record<string, unknown>>[] = [
    { key: 'chargeCode', header: 'Code', render: row => <span className="font-mono text-[#185FA5]">{String(row.chargeCode ?? '—')}</span> },
    { key: 'chargeName', header: 'Name' },
    { key: 'chargeType', header: 'Type' },
    { key: 'chargeAmount', header: 'Amount', render: row => row.chargeAmount != null ? Number(row.chargeAmount).toLocaleString() : '—', className: 'text-right' },
    { key: 'percentageRate', header: 'Rate (%)', render: row => row.percentageRate ? `${Number(row.percentageRate).toFixed(4)}%` : '—' },
    { key: 'chargeCurrency', header: 'CCY' },
    { key: 'frequency', header: 'Frequency' },
    { key: 'waivable', header: 'Waivable', render: row => row.waivable ? '✓' : '—' },
    { key: 'isActive', header: 'Status', render: row => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
  ];

  const handleAdd = async () => {
    setSaving(true);
    try {
      if (activeTab === 'Parameters') {
        if (!paramForm.paramKey || !paramForm.paramLabel || !paramForm.defaultValue) {
          addToast('error', 'Key, Label and Default Value are required'); setSaving(false); return;
        }
        await accountApi.post(`/v1/products/${productId}/parameters`, {
          paramKey: paramForm.paramKey.toUpperCase(),
          paramLabel: paramForm.paramLabel,
          valueType: paramForm.valueType,
          defaultValue: paramForm.defaultValue,
          overridableAtAccount: paramForm.overridableAtAccount,
          mandatory: paramForm.mandatory,
          effectiveFrom: paramForm.effectiveFrom,
          ...(paramForm.minValue && { minValue: paramForm.minValue }),
          ...(paramForm.maxValue && { maxValue: paramForm.maxValue }),
          ...(paramForm.effectiveTo && { effectiveTo: paramForm.effectiveTo }),
        });
        setParamForm({ ...initParam });
        refetchParams();
      } else if (activeTab === 'Interest Tiers') {
        if (!tierForm.tierName || !tierForm.tierSequence) {
          addToast('error', 'Tier Name and Sequence are required'); setSaving(false); return;
        }
        await accountApi.post(`/v1/products/${productId}/interest-tiers`, {
          tierName: tierForm.tierName,
          tierSequence: parseInt(tierForm.tierSequence),
          balanceFrom: parseFloat(tierForm.balanceFrom) || 0,
          creditRate: parseFloat(tierForm.creditRate) || 0,
          debitRate: parseFloat(tierForm.debitRate) || 0,
          rateType: tierForm.rateType,
          calculationBasis: tierForm.calculationBasis,
          effectiveFrom: tierForm.effectiveFrom,
          ...(tierForm.balanceTo && { balanceTo: parseFloat(tierForm.balanceTo) }),
          ...(tierForm.effectiveTo && { effectiveTo: tierForm.effectiveTo }),
        });
        setTierForm({ ...initTier });
        refetchTiers();
      } else {
        if (!chargeForm.chargeCode || !chargeForm.chargeName || !chargeForm.chargeCurrency) {
          addToast('error', 'Charge Code, Name and Currency are required'); setSaving(false); return;
        }
        await accountApi.post(`/v1/products/${productId}/charges`, {
          chargeCode: chargeForm.chargeCode.toUpperCase(),
          chargeName: chargeForm.chargeName,
          chargeType: chargeForm.chargeType,
          chargeCurrency: chargeForm.chargeCurrency.toUpperCase(),
          frequency: chargeForm.frequency,
          waivable: chargeForm.waivable,
          isActive: chargeForm.isActive,
          effectiveFrom: chargeForm.effectiveFrom,
          chargeAmount: parseFloat(chargeForm.chargeAmount) || 0,
          ...(chargeForm.percentageRate && { percentageRate: parseFloat(chargeForm.percentageRate) }),
          ...(chargeForm.triggerEvent && { triggerEvent: chargeForm.triggerEvent }),
          ...(chargeForm.minBalanceForWaiver && { minBalanceForWaiver: parseFloat(chargeForm.minBalanceForWaiver) }),
          ...(chargeForm.effectiveTo && { effectiveTo: chargeForm.effectiveTo }),
        });
        setChargeForm({ ...initCharge });
        refetchCharges();
      }
      addToast('success', `${activeTab.replace(/s$/, '')} added`);
      setShowModal(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  if (productLoading) return <div className="flex items-center justify-center h-64"><div className="text-[#5A6A7A] text-sm">Loading product...</div></div>;
  if (!product) return (
    <div className="text-center py-16">
      <p className="text-[#A32D2D]">Product not found</p>
      <button onClick={() => navigate('/maintenance/products')} className="btn-secondary mt-4">Back to Products</button>
    </div>
  );

  const p = product as Record<string, unknown>;

  return (
    <div>
      <button onClick={() => navigate('/maintenance/products')} className="btn-ghost mb-4"><ArrowLeft size={13} /> Back</button>
      <PageHeader
        title={String(p.productName ?? 'Product Detail')}
        subtitle={`${String(p.productCode ?? '')} · ${String(p.accountType ?? '')} · ${String(p.targetSegment ?? p.segment ?? '')}`}
        actions={<StatusBadge status={String(p.status ?? 'ACTIVE')} size="md" />}
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card col-span-2">
          <h3 className="text-[12px] font-bold mb-3">Product Information</h3>
          <div className="grid grid-cols-3 gap-x-6 gap-y-2">
            {[
              ['Code', String(p.productCode ?? '—')],
              ['Account Type', String(p.accountType ?? '—')],
              ['Currency', String(p.currencyCode ?? p.currency ?? '—')],
              ['Segment', String(p.targetSegment ?? p.segment ?? '—')],
              ['Min Opening Bal', p.minOpeningBalance != null ? Number(p.minOpeningBalance).toLocaleString() : '—'],
              ['Max Bal', p.maxBalance != null ? Number(p.maxBalance).toLocaleString() : 'No limit'],
              ['Max Accts/Customer', p.maxAccountPerCustomer != null ? String(p.maxAccountPerCustomer) : 'No limit'],
              ['Effective From', String(p.effectiveFrom ?? '—')],
              ['Effective To', String(p.effectiveTo ?? 'Open-ended')],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col">
                <dt className="text-[9px] text-[#5A6A7A] uppercase tracking-wide">{label}</dt>
                <dd className="text-[11px] font-medium">{value}</dd>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="text-[12px] font-bold mb-3">Eligibility</h3>
          <div className="space-y-2">
            {[['allowIndividual', 'Individual'], ['allowCorporate', 'Corporate'], ['allowJoint', 'Joint Account']].map(([field, label]) => (
              <div key={field} className="flex justify-between">
                <dt className="text-[10px] text-[#5A6A7A]">{label}</dt>
                <dd className={`text-[10px] font-semibold ${p[field] ? 'text-[#0F6E56]' : 'text-[#A32D2D]'}`}>{p[field] ? 'Allowed' : 'Not allowed'}</dd>
              </div>
            ))}
          </div>
          {!!p.description && <p className="mt-3 text-[10px] text-[#5A6A7A] border-t border-[#D8E2EC] pt-2">{String(p.description)}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-[#D8E2EC]">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-[11px] font-semibold transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-[#185FA5] text-[#185FA5]' : 'border-transparent text-[#5A6A7A] hover:text-[#1B3A5C]'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="flex justify-end mb-3">
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <PlusCircle size={13} /> Add {activeTab.replace(/s$/, '')}
        </button>
      </div>

      {activeTab === 'Parameters' && <DataTable columns={paramColumns} data={Array.isArray(parameters) ? parameters : []} isLoading={paramsLoading} emptyMessage="No parameters defined" />}
      {activeTab === 'Interest Tiers' && <DataTable columns={tierColumns} data={Array.isArray(tiers) ? tiers : []} isLoading={tiersLoading} emptyMessage="No interest tiers defined" />}
      {activeTab === 'Charges' && <DataTable columns={chargeColumns} data={Array.isArray(charges) ? charges : []} isLoading={chargesLoading} emptyMessage="No charges defined" />}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[560px] max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Add {activeTab.replace(/s$/, '')}</h2>

            {activeTab === 'Parameters' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <F label="Parameter Key" required hint="e.g. MIN_BALANCE">
                    <input value={paramForm.paramKey} onChange={e => setP('paramKey', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. MIN_BALANCE" />
                  </F>
                  <F label="Value Type" required>
                    <select value={paramForm.valueType} onChange={e => setP('valueType', e.target.value)} className="input-field">
                      <option value="STRING">String</option>
                      <option value="INTEGER">Integer</option>
                      <option value="DECIMAL">Decimal</option>
                      <option value="BOOLEAN">Boolean</option>
                      <option value="DATE">Date</option>
                    </select>
                  </F>
                </div>
                <F label="Parameter Label" required hint="Human-readable name">
                  <input value={paramForm.paramLabel} onChange={e => setP('paramLabel', e.target.value)} className="input-field" placeholder="e.g. Minimum Balance" />
                </F>
                <F label="Default Value" required>
                  <input value={paramForm.defaultValue} onChange={e => setP('defaultValue', e.target.value)} className="input-field" placeholder="Default value" />
                </F>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Min Value">
                    <input value={paramForm.minValue} onChange={e => setP('minValue', e.target.value)} className="input-field" placeholder="Minimum allowed" />
                  </F>
                  <F label="Max Value">
                    <input value={paramForm.maxValue} onChange={e => setP('maxValue', e.target.value)} className="input-field" placeholder="Maximum allowed" />
                  </F>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Effective From" required>
                    <input type="date" value={paramForm.effectiveFrom} onChange={e => setP('effectiveFrom', e.target.value)} className="input-field" />
                  </F>
                  <F label="Effective To">
                    <input type="date" value={paramForm.effectiveTo} onChange={e => setP('effectiveTo', e.target.value)} className="input-field" />
                  </F>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={paramForm.overridableAtAccount} onChange={e => setP('overridableAtAccount', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                    <span className="text-[11px] text-[#5A6A7A]">Overridable at account level</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={paramForm.mandatory} onChange={e => setP('mandatory', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                    <span className="text-[11px] text-[#5A6A7A]">Mandatory</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'Interest Tiers' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <F label="Tier Name" required>
                    <input value={tierForm.tierName} onChange={e => setT('tierName', e.target.value)} className="input-field" placeholder="e.g. Standard Rate" />
                  </F>
                  <F label="Tier Sequence" required hint="Order of evaluation">
                    <input type="number" value={tierForm.tierSequence} onChange={e => setT('tierSequence', e.target.value)} className="input-field" min="1" />
                  </F>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Balance From" required>
                    <input type="number" value={tierForm.balanceFrom} onChange={e => setT('balanceFrom', e.target.value)} className="input-field" min="0" step="0.01" />
                  </F>
                  <F label="Balance To" hint="Leave blank for unlimited">
                    <input type="number" value={tierForm.balanceTo} onChange={e => setT('balanceTo', e.target.value)} className="input-field" min="0" />
                  </F>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Credit Rate (% p.a.)">
                    <input type="number" value={tierForm.creditRate} onChange={e => setT('creditRate', e.target.value)} className="input-field" min="0" step="0.0001" />
                  </F>
                  <F label="Debit Rate (% p.a.)">
                    <input type="number" value={tierForm.debitRate} onChange={e => setT('debitRate', e.target.value)} className="input-field" min="0" step="0.0001" />
                  </F>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Rate Type">
                    <select value={tierForm.rateType} onChange={e => setT('rateType', e.target.value)} className="input-field">
                      <option value="FIXED">Fixed</option>
                      <option value="VARIABLE">Variable</option>
                      <option value="TIERED">Tiered</option>
                    </select>
                  </F>
                  <F label="Calculation Basis">
                    <select value={tierForm.calculationBasis} onChange={e => setT('calculationBasis', e.target.value)} className="input-field">
                      <option value="DAILY_BALANCE">Daily Balance</option>
                      <option value="MONTHLY_AVERAGE">Monthly Average</option>
                      <option value="MIN_BALANCE">Minimum Balance</option>
                    </select>
                  </F>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Effective From" required>
                    <input type="date" value={tierForm.effectiveFrom} onChange={e => setT('effectiveFrom', e.target.value)} className="input-field" />
                  </F>
                  <F label="Effective To">
                    <input type="date" value={tierForm.effectiveTo} onChange={e => setT('effectiveTo', e.target.value)} className="input-field" />
                  </F>
                </div>
              </div>
            )}

            {activeTab === 'Charges' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <F label="Charge Code" required>
                    <input value={chargeForm.chargeCode} onChange={e => setC('chargeCode', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. MONTHLY_FEE" />
                  </F>
                  <F label="Charge Name" required>
                    <input value={chargeForm.chargeName} onChange={e => setC('chargeName', e.target.value)} className="input-field" placeholder="e.g. Monthly Maintenance Fee" />
                  </F>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Charge Type" required>
                    <select value={chargeForm.chargeType} onChange={e => setC('chargeType', e.target.value)} className="input-field">
                      <option value="ACCOUNT_MAINTENANCE">Account Maintenance</option>
                      <option value="TRANSACTION">Transaction</option>
                      <option value="PENALTY">Penalty</option>
                      <option value="SERVICE">Service</option>
                      <option value="INTEREST">Interest</option>
                    </select>
                  </F>
                  <F label="Frequency" required>
                    <select value={chargeForm.frequency} onChange={e => setC('frequency', e.target.value)} className="input-field">
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="ANNUALLY">Annually</option>
                      <option value="PER_TRANSACTION">Per Transaction</option>
                      <option value="ON_EVENT">On Event</option>
                    </select>
                  </F>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <F label="Charge Amount">
                    <input type="number" value={chargeForm.chargeAmount} onChange={e => setC('chargeAmount', e.target.value)} className="input-field" min="0" step="0.01" />
                  </F>
                  <F label="Percentage Rate (%)">
                    <input type="number" value={chargeForm.percentageRate} onChange={e => setC('percentageRate', e.target.value)} className="input-field" min="0" step="0.0001" placeholder="e.g. 0.5" />
                  </F>
                  <F label="Currency" required>
                    <input value={chargeForm.chargeCurrency} onChange={e => setC('chargeCurrency', e.target.value.toUpperCase())} className="input-field" placeholder="USD" maxLength={3} />
                  </F>
                </div>
                <F label="Trigger Event" hint="Only for ON_EVENT frequency">
                  <input value={chargeForm.triggerEvent} onChange={e => setC('triggerEvent', e.target.value)} className="input-field" placeholder="e.g. ACCOUNT_OPEN, EARLY_CLOSURE" />
                </F>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Effective From" required>
                    <input type="date" value={chargeForm.effectiveFrom} onChange={e => setC('effectiveFrom', e.target.value)} className="input-field" />
                  </F>
                  <F label="Effective To">
                    <input type="date" value={chargeForm.effectiveTo} onChange={e => setC('effectiveTo', e.target.value)} className="input-field" />
                  </F>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={chargeForm.waivable} onChange={e => setC('waivable', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                    <span className="text-[11px] text-[#5A6A7A]">Waivable</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={chargeForm.isActive} onChange={e => setC('isActive', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                    <span className="text-[11px] text-[#5A6A7A]">Active</span>
                  </label>
                </div>
                {chargeForm.waivable && (
                  <F label="Min Balance for Waiver">
                    <input type="number" value={chargeForm.minBalanceForWaiver} onChange={e => setC('minBalanceForWaiver', e.target.value)} className="input-field" placeholder="Balance threshold to waive charge" min="0" />
                  </F>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
