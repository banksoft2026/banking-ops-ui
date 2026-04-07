import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus } from 'lucide-react';
import { cbsApi, DEFAULT_INSTITUTION_ID } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDate } from '../../lib/utils';
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

export default function GlPeriodsPage() {
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [fiscalYear, setFiscalYear] = useState(String(new Date().getFullYear()));

  const { data, isLoading } = useQuery({
    queryKey: ['gl-periods'],
    queryFn: () => cbsApi.get(`/v1/gl/periods?institutionId=${DEFAULT_INSTITUTION_ID}`).then(r => r.data.data).catch(() => []),
    retry: false,
  });

  const periods: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.content ?? []);

  const handleGenerate = async () => {
    if (!fiscalYear || isNaN(parseInt(fiscalYear))) {
      addToast('error', 'A valid fiscal year is required');
      return;
    }
    setGenerating(true);
    try {
      await cbsApi.post(`/v1/config/accounting/periods/generate?institutionId=${DEFAULT_INSTITUTION_ID}&fiscalYear=${fiscalYear}`);
      addToast('success', `GL periods generated for fiscal year ${fiscalYear}`);
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['gl-periods'] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to generate GL periods');
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = async (periodId: string) => {
    setActionLoadingId(periodId + '-close');
    try {
      await cbsApi.put(`/v1/gl/periods/${periodId}/close`);
      addToast('success', 'Period closed successfully');
      queryClient.invalidateQueries({ queryKey: ['gl-periods'] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to close period');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLock = async (periodId: string) => {
    setActionLoadingId(periodId + '-lock');
    try {
      await cbsApi.put(`/v1/gl/periods/${periodId}/lock`);
      addToast('success', 'Period locked successfully');
      queryClient.invalidateQueries({ queryKey: ['gl-periods'] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to lock period');
    } finally {
      setActionLoadingId(null);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'periodCode', header: 'Period Code', render: row => <span className="font-mono font-semibold text-[#185FA5]">{String(row.periodCode ?? '—')}</span> },
    { key: 'periodName', header: 'Name', render: row => <span className="font-medium">{String(row.periodName ?? '—')}</span> },
    { key: 'fiscalYear', header: 'Fiscal Year', render: row => <span className="font-mono">{String(row.fiscalYear ?? '—')}</span> },
    { key: 'startDate', header: 'Start Date', render: row => formatDate(String(row.startDate ?? '')) },
    { key: 'endDate', header: 'End Date', render: row => formatDate(String(row.endDate ?? '')) },
    { key: 'periodStatus', header: 'Status', render: row => <StatusBadge status={String(row.periodStatus ?? row.status ?? 'OPEN')} /> },
    { key: 'actions', header: 'Actions', render: row => {
      const id = String(row.periodId ?? row.id ?? '');
      const status = String(row.periodStatus ?? row.status ?? 'OPEN');
      return (
        <div className="flex gap-1">
          {status === 'OPEN' && (
            <button
              onClick={() => handleClose(id)}
              disabled={actionLoadingId === id + '-close'}
              className="btn-secondary text-[9px] px-2 py-1 h-6"
            >
              {actionLoadingId === id + '-close' ? '...' : 'Close'}
            </button>
          )}
          {status === 'CLOSED' && (
            <button
              onClick={() => handleLock(id)}
              disabled={actionLoadingId === id + '-lock'}
              className="btn-secondary text-[9px] px-2 py-1 h-6 text-[#A32D2D]"
            >
              {actionLoadingId === id + '-lock' ? '...' : 'Lock'}
            </button>
          )}
          {status === 'LOCKED' && (
            <span className="text-[9px] text-[#8A9BAB] italic">Locked</span>
          )}
        </div>
      );
    }},
  ];

  return (
    <div>
      <PageHeader
        title="GL Periods"
        subtitle="Accounting period management"
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><CalendarPlus size={13} /> Generate Periods</button>}
      />
      <DataTable columns={columns} data={periods} isLoading={isLoading} emptyMessage="No GL periods found — use Generate Periods to create periods for a fiscal year" />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[400px] shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Generate GL Periods</h2>
            <div className="space-y-4">
              <F label="Fiscal Year" required hint="Generates 12 monthly periods for the specified year">
                <input
                  type="number"
                  value={fiscalYear}
                  onChange={e => setFiscalYear(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 2025"
                  min="2000"
                  max="2100"
                />
              </F>
              <div className="p-3 bg-[#FFF8E1] border border-[#F6C23E] rounded text-[10px] text-[#856404]">
                This will generate 12 monthly accounting periods (Jan–Dec) for fiscal year {fiscalYear || '—'}. Existing periods for this year will not be duplicated.
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleGenerate} disabled={generating} className="btn-primary">
                {generating ? 'Generating...' : 'Generate Periods'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
