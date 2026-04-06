import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { txnApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { useUIStore } from '../../store/uiStore';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function TransactionDetailPage() {
  const { txnId } = useParams<{ txnId: string }>();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reverseReason, setReverseReason] = useState('');
  const [reversing, setReversing] = useState(false);

  const { data: txn, isLoading } = useQuery({
    queryKey: ['transaction', txnId],
    queryFn: () => txnApi.get(`/v1/transactions/${txnId}`).then(r => r.data.data).catch(() => null),
    enabled: !!txnId,
  });

  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ['transaction-entries', txnId],
    queryFn: () => txnApi.get(`/v1/transactions/${txnId}/entries`).then(r => r.data.data).catch(() => []),
    enabled: !!txnId,
  });

  const entryColumns: Column<Record<string, unknown>>[] = [
    { key: 'glAccountCode', header: 'GL Account', render: row => <span className="font-mono text-[#185FA5]">{String(row.glAccountCode ?? '—')}</span> },
    { key: 'glAccountName', header: 'Account Name' },
    { key: 'drCrIndicator', header: 'D/C', render: row => (
      <span className={`font-bold text-xs ${row.drCrIndicator === 'CR' ? 'text-[#0F6E56]' : 'text-[#A32D2D]'}`}>
        {String(row.drCrIndicator ?? '—')}
      </span>
    )},
    { key: 'amount', header: 'Amount', render: row => formatCurrency(Number(row.amount) || 0), className: 'text-right' },
    { key: 'currencyCode', header: 'Currency' },
  ];

  const handleReverse = async () => {
    if (!reverseReason.trim()) {
      addToast('error', 'Reversal reason is required');
      return;
    }
    setReversing(true);
    try {
      await txnApi.post(`/v1/transactions/${txnId}/reverse`, { reason: reverseReason });
      addToast('success', 'Transaction reversed');
      setShowReverseModal(false);
      setReverseReason('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to reverse transaction');
    } finally {
      setReversing(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-[#5A6A7A] text-sm">Loading transaction...</div></div>;
  }

  if (!txn) {
    return (
      <div className="text-center py-16">
        <p className="text-[#A32D2D]">Transaction not found</p>
        <button onClick={() => navigate('/transactions')} className="btn-secondary mt-4">Back to Transactions</button>
      </div>
    );
  }

  const t = txn as Record<string, unknown>;

  return (
    <div>
      <button onClick={() => navigate('/transactions')} className="btn-ghost mb-4"><ArrowLeft size={13} /> Back</button>
      <PageHeader
        title={String(t.txnReference ?? 'Transaction Detail')}
        subtitle={String(t.txnCode ?? '')}
        actions={
          <div className="flex gap-2">
            <StatusBadge status={String(t.txnStatus ?? t.status ?? '')} size="md" />
            <button
              onClick={() => setShowReverseModal(true)}
              className="btn-danger"
              disabled={String(t.txnStatus ?? '') === 'REVERSED'}
            >
              <RotateCcw size={13} /> Reverse
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card">
          <h3 className="text-[14px] font-bold mb-3">Transaction Details</h3>
          <dl className="space-y-2">
            {[
              ['Reference', String(t.txnReference ?? '—')],
              ['Txn Code', String(t.txnCode ?? '—')],
              ['Account ID', String(t.accountId ?? '—')],
              ['Channel', String(t.channel ?? '—')],
              ['Narrative', String(t.narrative ?? '—')],
              ['Created By', String(t.createdBy ?? '—')],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-[10px] text-[#5A6A7A]">{label}</dt>
                <dd className="text-[11px] font-medium font-mono">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="card">
          <h3 className="text-[14px] font-bold mb-3">Amounts & Dates</h3>
          <dl className="space-y-2">
            {[
              ['Amount', formatCurrency(Number(t.txnAmount) || 0)],
              ['Currency', String(t.txnCurrency ?? '—')],
              ['Value Date', formatDate(String(t.valueDate ?? ''))],
              ['Booking Date', formatDate(String(t.bookingDate ?? t.createdAt ?? ''))],
              ['D/C Indicator', String(t.drCrIndicator ?? '—')],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-[10px] text-[#5A6A7A]">{label}</dt>
                <dd className="text-[11px] font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="card">
        <h3 className="text-[14px] font-bold mb-3">Double-Entry Legs</h3>
        <DataTable
          columns={entryColumns}
          data={Array.isArray(entries) ? entries : []}
          isLoading={entriesLoading}
          emptyMessage="No journal entries found"
        />
      </div>

      {showReverseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowReverseModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[500px] shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Reverse Transaction</h2>
            <p className="text-xs text-[#5A6A7A] mb-3">
              You are about to reverse transaction <span className="font-mono text-[#185FA5]">{String(t.txnReference ?? txnId)}</span>.
              This action cannot be undone.
            </p>
            <div>
              <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Reason *</label>
              <input
                value={reverseReason}
                onChange={e => setReverseReason(e.target.value)}
                className="input-field"
                placeholder="Reason for reversal"
              />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowReverseModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleReverse} disabled={reversing} className="btn-danger">
                {reversing ? 'Reversing...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
