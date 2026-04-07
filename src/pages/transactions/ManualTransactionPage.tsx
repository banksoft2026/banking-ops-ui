import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { txnApi } from '../../lib/api';
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

export default function ManualTransactionPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    // Required
    accountId: '',
    txnCode: '',
    txnAmount: '',
    txnCurrency: 'USD',
    channel: 'BRANCH',
    createdBy: 'OPS-PORTAL',
    idempotencyKey: '',
    // Settlement
    valueDate: '',
    exchangeRate: '',
    // Counterparty
    counterpartyAccountNo: '',
    counterpartyName: '',
    counterpartyBankBic: '',
    counterpartySortCode: '',
    counterpartyAccountId: '',
    // References
    narrative: '',
    endToEndRef: '',
    paymentSchemeRef: '',
    sourceSystem: '',
    batchId: '',
  });

  useEffect(() => {
    setForm(f => ({ ...f, idempotencyKey: crypto.randomUUID() }));
  }, []);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountId || !form.txnCode || !form.txnAmount) {
      addToast('error', 'Account ID, Transaction Code and Amount are required');
      return;
    }
    if (parseFloat(form.txnAmount) <= 0) {
      addToast('error', 'Amount must be greater than zero');
      return;
    }
    setLoading(true);
    try {
      const res = await txnApi.post('/v1/transactions', {
        idempotencyKey: form.idempotencyKey,
        txnCode: form.txnCode,
        accountId: form.accountId,
        channel: form.channel,
        txnAmount: parseFloat(form.txnAmount),
        txnCurrency: form.txnCurrency,
        createdBy: form.createdBy,
        ...(form.valueDate && { valueDate: form.valueDate }),
        ...(form.exchangeRate && { exchangeRate: parseFloat(form.exchangeRate) }),
        ...(form.counterpartyAccountNo && { counterpartyAccountNo: form.counterpartyAccountNo }),
        ...(form.counterpartyName && { counterpartyName: form.counterpartyName }),
        ...(form.counterpartyBankBic && { counterpartyBankBic: form.counterpartyBankBic }),
        ...(form.counterpartySortCode && { counterpartySortCode: form.counterpartySortCode }),
        ...(form.counterpartyAccountId && { counterpartyAccountId: form.counterpartyAccountId }),
        ...(form.narrative && { narrative: form.narrative }),
        ...(form.endToEndRef && { endToEndRef: form.endToEndRef }),
        ...(form.paymentSchemeRef && { paymentSchemeRef: form.paymentSchemeRef }),
        ...(form.sourceSystem && { sourceSystem: form.sourceSystem }),
        ...(form.batchId && { batchId: form.batchId }),
      });
      setResult(res.data.data ?? res.data);
      addToast('success', 'Transaction posted successfully');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to post transaction');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const txnId = String(result.txnId ?? result.id ?? '');
    return (
      <div>
        <PageHeader title="Transaction Posted" />
        <div className="card max-w-xl">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={20} className="text-[#0F6E56]" />
            <h3 className="text-[14px] font-bold text-[#0F6E56]">Transaction Posted Successfully</h3>
          </div>
          <dl className="space-y-2 mb-4">
            {Object.entries(result).filter(([k]) => !['entries', 'journals'].includes(k)).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-[10px] text-[#5A6A7A] capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</dt>
                <dd className="text-[11px] font-mono">{String(v ?? '—')}</dd>
              </div>
            ))}
          </dl>
          <div className="flex gap-2">
            <button onClick={() => { setResult(null); setForm(f => ({ ...f, idempotencyKey: crypto.randomUUID(), txnAmount: '' })); }} className="btn-secondary">Post Another</button>
            {txnId && <button onClick={() => navigate(`/transactions/${txnId}`)} className="btn-primary">View Transaction</button>}
            <button onClick={() => navigate('/transactions')} className="btn-ghost">All Transactions</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate('/transactions')} className="btn-ghost mb-4"><ArrowLeft size={13} /> Back</button>
      <PageHeader title="Manual Transaction" subtitle="Post a manual debit or credit entry" />
      <div className="max-w-2xl">
        <form onSubmit={onSubmit}>

          {/* Transaction Details */}
          <div className="card mb-4">
            <h4 className="text-[11px] font-bold text-[#1B3A5C] mb-3 uppercase tracking-wide">Transaction Details</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="Account ID" required hint="UUID of the account to debit/credit">
                  <input value={form.accountId} onChange={e => set('accountId', e.target.value)} className="input-field" placeholder="Account UUID" />
                </F>
                <F label="Transaction Code" required hint="e.g. CASH_DEP, WIRE_OUT, INT_TRF">
                  <input value={form.txnCode} onChange={e => set('txnCode', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. CASH_DEP" />
                </F>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <F label="Amount" required>
                  <input type="number" value={form.txnAmount} onChange={e => set('txnAmount', e.target.value)} className="input-field" placeholder="0.00" min="0.01" step="0.01" />
                </F>
                <F label="Currency" required>
                  <input value={form.txnCurrency} onChange={e => set('txnCurrency', e.target.value.toUpperCase())} className="input-field" placeholder="USD" maxLength={3} />
                </F>
                <F label="Channel" required>
                  <select value={form.channel} onChange={e => set('channel', e.target.value)} className="input-field">
                    <option value="BRANCH">Branch</option>
                    <option value="SWIFT">SWIFT</option>
                    <option value="SEPA">SEPA</option>
                    <option value="CHAPS">CHAPS</option>
                    <option value="API">API</option>
                    <option value="INTERNAL">Internal</option>
                    <option value="BATCH">Batch</option>
                  </select>
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Value Date" hint="Leave blank to use today">
                  <input type="date" value={form.valueDate} onChange={e => set('valueDate', e.target.value)} className="input-field" />
                </F>
                <F label="Exchange Rate" hint="Only for cross-currency transactions">
                  <input type="number" value={form.exchangeRate} onChange={e => set('exchangeRate', e.target.value)} className="input-field" placeholder="1.0000" step="0.0001" min="0" />
                </F>
              </div>
              <F label="Narrative">
                <input value={form.narrative} onChange={e => set('narrative', e.target.value)} className="input-field" placeholder="Transaction description / memo" maxLength={200} />
              </F>
              <div className="p-2 bg-[#F0F2F5] rounded text-[9px] text-[#5A6A7A]">
                Idempotency Key: <span className="font-mono text-[#185FA5]">{form.idempotencyKey}</span>
              </div>
            </div>
          </div>

          {/* Counterparty Details */}
          <div className="card mb-4">
            <h4 className="text-[11px] font-bold text-[#1B3A5C] mb-3 uppercase tracking-wide">Counterparty Details <span className="text-[#8A9BAB] font-normal normal-case">(optional)</span></h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <F label="Counterparty Account Number">
                  <input value={form.counterpartyAccountNo} onChange={e => set('counterpartyAccountNo', e.target.value)} className="input-field" placeholder="IBAN / account number" />
                </F>
                <F label="Counterparty Name">
                  <input value={form.counterpartyName} onChange={e => set('counterpartyName', e.target.value)} className="input-field" placeholder="Beneficiary / remitter name" />
                </F>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <F label="Bank BIC / SWIFT">
                  <input value={form.counterpartyBankBic} onChange={e => set('counterpartyBankBic', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. BARCGB22" maxLength={11} />
                </F>
                <F label="Sort Code">
                  <input value={form.counterpartySortCode} onChange={e => set('counterpartySortCode', e.target.value)} className="input-field" placeholder="e.g. 20-45-67" />
                </F>
                <F label="Counterparty Account ID" hint="Internal UUID if known">
                  <input value={form.counterpartyAccountId} onChange={e => set('counterpartyAccountId', e.target.value)} className="input-field" placeholder="Internal UUID" />
                </F>
              </div>
            </div>
          </div>

          {/* References */}
          <div className="card mb-4">
            <h4 className="text-[11px] font-bold text-[#1B3A5C] mb-3 uppercase tracking-wide">References & Routing <span className="text-[#8A9BAB] font-normal normal-case">(optional)</span></h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <F label="End-to-End Reference">
                  <input value={form.endToEndRef} onChange={e => set('endToEndRef', e.target.value)} className="input-field" placeholder="E2E reference" maxLength={35} />
                </F>
                <F label="Payment Scheme Reference">
                  <input value={form.paymentSchemeRef} onChange={e => set('paymentSchemeRef', e.target.value)} className="input-field" placeholder="SEPA/SWIFT ref" maxLength={35} />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Source System">
                  <input value={form.sourceSystem} onChange={e => set('sourceSystem', e.target.value)} className="input-field" placeholder="e.g. CORE_BANKING, SWIFT_GPI" />
                </F>
                <F label="Batch ID">
                  <input value={form.batchId} onChange={e => set('batchId', e.target.value)} className="input-field" placeholder="Batch processing ID" />
                </F>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/transactions')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Posting...' : 'Post Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
