import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { txnApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { useUIStore } from '../../store/uiStore';

const schema = z.object({
  accountId: z.string().uuid('Must be a valid UUID'),
  txnCode: z.string().min(1, 'Transaction code required'),
  txnAmount: z.string().min(1, 'Amount required'),
  txnCurrency: z.string().min(3).max(3),
  narrative: z.string().optional(),
  valueDate: z.string().optional(),
  idempotencyKey: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export default function ManualTransactionPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      txnCurrency: 'USD',
      idempotencyKey: crypto.randomUUID(),
    }
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await txnApi.post('/v1/transactions', {
        ...data,
        txnAmount: parseFloat(data.txnAmount),
      }, { headers: { 'Idempotency-Key': data.idempotencyKey } });
      setResult(res.data.data);
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
            <button onClick={() => setResult(null)} className="btn-secondary">Post Another</button>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { name: 'accountId', label: 'Account ID', placeholder: 'UUID of the account' },
            { name: 'txnCode', label: 'Transaction Code', placeholder: 'e.g. CASH_DEP' },
            { name: 'txnAmount', label: 'Amount', placeholder: '0.00' },
            { name: 'txnCurrency', label: 'Currency', placeholder: 'USD' },
            { name: 'valueDate', label: 'Value Date', placeholder: 'YYYY-MM-DD', type: 'date' },
            { name: 'narrative', label: 'Narrative', placeholder: 'Optional narrative' },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">
                {field.label}
              </label>
              <input
                {...register(field.name as keyof FormData)}
                type={field.type ?? 'text'}
                placeholder={field.placeholder}
                className="input-field"
              />
              {errors[field.name as keyof FormData] && (
                <p className="mt-1 text-[10px] text-[#A32D2D]">{errors[field.name as keyof FormData]?.message}</p>
              )}
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
