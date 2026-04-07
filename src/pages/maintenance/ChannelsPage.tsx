import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { cbsApi, DEFAULT_INSTITUTION_ID } from '../../lib/api';
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

const initForm = {
  channelCode: '',
  channelName: '',
  channelCategory: 'DIGITAL',
  authType: 'API_KEY',
  maxTxnAmount: '',
  dailyLimit: '',
  maxRetries: '3',
  sessionTimeoutMins: '30',
  requiresTls: true,
  allowedTxnCodes: '',
  allowedCurrencies: '',
  ipWhitelist: '',
  cutoffTime: '',
  priority: '2',
};

export default function ChannelsPage() {
  const { addToast } = useUIStore();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...initForm });

  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['channels'],
    queryFn: () => cbsApi.get(`/v1/config/channels?institutionId=${DEFAULT_INSTITUTION_ID}`).then(r => r.data.data).catch(() => []),
  });

  const channels: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.content ?? []);

  const handleToggle = async (row: Record<string, unknown>) => {
    const code = String(row.channelCode ?? row.code ?? '');
    const isActive = Boolean(row.isActive ?? row.active);
    try {
      await cbsApi.put(`/v1/config/channels/${code}/status?active=${!isActive}`);
      addToast('success', `Channel ${!isActive ? 'activated' : 'deactivated'}`);
      refetch();
    } catch {
      addToast('error', 'Failed to update channel status');
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'channelCode', header: 'Code', render: row => <span className="font-mono font-semibold text-[#185FA5]">{String(row.channelCode ?? row.code ?? '—')}</span> },
    { key: 'channelName', header: 'Channel Name' },
    { key: 'channelCategory', header: 'Category' },
    { key: 'authType', header: 'Auth Type' },
    { key: 'maxTxnAmount', header: 'Max Txn Amt', render: row => row.maxTxnAmount != null ? `${Number(row.maxTxnAmount).toLocaleString()}` : '—', className: 'text-right' },
    { key: 'priority', header: 'Priority' },
    { key: 'requiresTls', header: 'TLS', render: row => row.requiresTls ? <span className="text-[#0F6E56] font-semibold text-[10px]">✓</span> : <span className="text-[#8A9BAB] text-[10px]">—</span> },
    { key: 'isActive', header: 'Status', render: row => <StatusBadge status={(row.isActive ?? row.active) ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      key: 'actions', header: '', render: row => (
        <button
          onClick={e => { e.stopPropagation(); handleToggle(row); }}
          className={`text-[9px] px-2 py-1 h-6 rounded border font-semibold transition-colors ${(row.isActive ?? row.active) ? 'border-[#A32D2D] text-[#A32D2D] hover:bg-red-50' : 'border-[#0F6E56] text-[#0F6E56] hover:bg-green-50'}`}
        >
          {(row.isActive ?? row.active) ? 'Deactivate' : 'Activate'}
        </button>
      )
    },
  ];

  const handleCreate = async () => {
    if (!form.channelCode || !form.channelName || !form.maxTxnAmount) {
      addToast('error', 'Channel Code, Name and Max Transaction Amount are required');
      return;
    }
    setSaving(true);
    try {
      await cbsApi.post('/v1/config/channels', {
        institutionId: DEFAULT_INSTITUTION_ID,
        channelCode: form.channelCode.toUpperCase(),
        channelName: form.channelName,
        channelCategory: form.channelCategory,
        authType: form.authType,
        maxTxnAmount: parseFloat(form.maxTxnAmount),
        requiresTls: form.requiresTls,
        maxRetries: parseInt(form.maxRetries),
        sessionTimeoutMins: parseInt(form.sessionTimeoutMins),
        priority: parseInt(form.priority),
        ...(form.dailyLimit && { dailyLimit: parseFloat(form.dailyLimit) }),
        ...(form.allowedTxnCodes && { allowedTxnCodes: form.allowedTxnCodes }),
        ...(form.allowedCurrencies && { allowedCurrencies: form.allowedCurrencies }),
        ...(form.ipWhitelist && { ipWhitelist: form.ipWhitelist }),
        ...(form.cutoffTime && { cutoffTime: form.cutoffTime }),
      });
      addToast('success', 'Channel created');
      setShowModal(false);
      setForm({ ...initForm });
      refetch();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to create channel');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Channels"
        subtitle="Transaction channel configuration"
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><PlusCircle size={13} /> Create Channel</button>}
      />
      <DataTable columns={columns} data={channels} isLoading={isLoading} emptyMessage="No channels found — check CBS Maintenance service (port 8080)" />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Create Channel</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <F label="Channel Code" required>
                  <input value={form.channelCode} onChange={e => set('channelCode', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. INTERNET_BANKING" maxLength={20} />
                </F>
                <F label="Channel Name" required>
                  <input value={form.channelName} onChange={e => set('channelName', e.target.value)} className="input-field" placeholder="e.g. Internet Banking" maxLength={100} />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Channel Category" required>
                  <select value={form.channelCategory} onChange={e => set('channelCategory', e.target.value)} className="input-field">
                    <option value="INTERNAL">Internal</option>
                    <option value="INTERBANK">Interbank</option>
                    <option value="DIGITAL">Digital</option>
                    <option value="SCHEME">Payment Scheme</option>
                  </select>
                </F>
                <F label="Auth Type" required>
                  <select value={form.authType} onChange={e => set('authType', e.target.value)} className="input-field">
                    <option value="API_KEY">API Key</option>
                    <option value="OAUTH2">OAuth 2.0</option>
                    <option value="CERT">Client Certificate</option>
                    <option value="BASIC">Basic Auth</option>
                    <option value="NONE">None</option>
                  </select>
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Max Transaction Amount" required>
                  <input type="number" value={form.maxTxnAmount} onChange={e => set('maxTxnAmount', e.target.value)} className="input-field" placeholder="e.g. 1000000" min="0.01" step="0.01" />
                </F>
                <F label="Daily Limit">
                  <input type="number" value={form.dailyLimit} onChange={e => set('dailyLimit', e.target.value)} className="input-field" placeholder="e.g. 5000000" min="0" />
                </F>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <F label="Max Retries (0–10)">
                  <input type="number" value={form.maxRetries} onChange={e => set('maxRetries', e.target.value)} className="input-field" min="0" max="10" />
                </F>
                <F label="Session Timeout (min)">
                  <input type="number" value={form.sessionTimeoutMins} onChange={e => set('sessionTimeoutMins', e.target.value)} className="input-field" min="1" />
                </F>
                <F label="Priority">
                  <input type="number" value={form.priority} onChange={e => set('priority', e.target.value)} className="input-field" min="1" max="99" />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Cutoff Time (HH:mm)">
                  <input type="time" value={form.cutoffTime} onChange={e => set('cutoffTime', e.target.value)} className="input-field" />
                </F>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.requiresTls} onChange={e => set('requiresTls', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                    <span className="text-[11px] text-[#5A6A7A]">Requires TLS</span>
                  </label>
                </div>
              </div>
              <F label="Allowed Transaction Codes" hint="Comma-separated txn codes, blank = all">
                <input value={form.allowedTxnCodes} onChange={e => set('allowedTxnCodes', e.target.value)} className="input-field" placeholder="e.g. CASH_DEP,WIRE_OUT,SEPA_CT" />
              </F>
              <F label="Allowed Currencies" hint="Comma-separated ISO codes, blank = all">
                <input value={form.allowedCurrencies} onChange={e => set('allowedCurrencies', e.target.value)} className="input-field" placeholder="e.g. USD,EUR,GBP" />
              </F>
              <F label="IP Whitelist" hint="Comma-separated CIDR ranges">
                <input value={form.ipWhitelist} onChange={e => set('ipWhitelist', e.target.value)} className="input-field" placeholder="e.g. 10.0.0.0/8,192.168.1.0/24" />
              </F>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Channel'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
