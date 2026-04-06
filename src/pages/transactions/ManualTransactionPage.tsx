import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { txnApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { useUIStore } from '../../store/uiStore';

export default function ManualTransactionPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    accountId: '',
    txnCode: '',
    txnAmount: '',
    txnCurrency: 'USD',
    valueDate: '',
    narrative: '',
    channel: 'MANUAL',
    createdBy: 'SYSTEM',
    idempotencyKey: crypto.randomUUID(),
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountId || !form.txnCode || !form.txnAmount) {
      addToast('error', 'Account ID, Transaction Code and Amount are required');
      return;
    }
    setLoading(true);
    try {
      const res = await txnApi.post('/v1/transactions', {
        txnCode: form.txnCode,
        accountId: form.accountId,
        txnAmount: parseFloat(form.txnAmount),
        txnCurrency: form.txnCurrency,
        valueDate: form.valueDate || undefined,
        narrative: form.narrative || undefined,
        channel: form.channel,
        createdBy: form.createdBy,
        idempotencyKey: form.idempotencyKey,
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
    return (
      <div>
        <PageHeader title="Transaction Posted" />
        <div className="card max-w-lg">
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
            <button onClick={() => { setResult(null); set('idempotencyKey', crypto.randomUUID()); }} className="btn-secondary">Post Another</button>
            <button onClick={() => navigate('/transactions')} className="btn-primary">View Transactions</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate('/transactions')} className="btn-ghost mb-4"><ArrowLeft size={13} /> Back</button>
      <PageHeader title="Manual Transaction" subtitle="Post a manual debit or credit entry" />
      <div className="card max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          {[
            { field: 'accountId', label: 'Account ID', placeholder: 'UUID of the account' },
            { field: 'txnCode', label: 'Transaction Code', placeholder: 'e.g. CASH_DEP' },
            { field: 'txnAmount', label: 'Amount', placeholder: '0.00' },
            { field: 'txnCurrency', label: 'Currency', placeholder: 'USD' },
            { field: 'valueDate', label: 'Value Date', placeholder: 'YYYY-MM-DD', type: 'date' },
            { field: 'narrative', label: 'Narrative', placeholder: 'Optional narrative' },
            { field: 'channel', label: 'Channel', placeholder: 'MANUAL' },
            { field: 'createdBy', label: 'Created By', placeholder: 'SYSTEM' },
          ].map(({ field, label, placeholder, type }) => (
            <div key={field}>
              <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">{label}</label>
              <input
                type={type ?? 'text'}
                value={form[field as keyof typeof form]}
                onChange={e => set(field, e.target.value)}
                placeholder={placeholder}
                className="input-field"
              />
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Posting...' : 'Post Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
