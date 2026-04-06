import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle } from 'lucide-react';
import { userAdminApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDateTime } from '../../lib/utils';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

export default function ApprovalQueuePage() {
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { addToast } = useUIStore();
  const { isChecker } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['approvals', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await userAdminApi.get(`/v1/approvals?${params}`);
      return res.data.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (queueId: string) => userAdminApi.post(`/v1/approvals/${queueId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      addToast('success', 'Approved successfully');
      setSelectedItem(null);
    },
    onError: () => addToast('error', 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ queueId, reason }: { queueId: string; reason: string }) =>
      userAdminApi.post(`/v1/approvals/${queueId}/reject`, { rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      addToast('success', 'Rejected');
      setSelectedItem(null);
      setRejectReason('');
    },
    onError: () => addToast('error', 'Failed to reject'),
  });

  const items: Record<string, unknown>[] = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'queueId', header: 'ID', render: row => <span className="font-mono text-[10px]">{String(row.queueId ?? '').slice(0, 8)}…</span> },
    { key: 'actionType', header: 'Action', render: row => <span className="font-semibold">{String(row.actionType ?? '—')}</span> },
    { key: 'entityType', header: 'Entity' },
    { key: 'entityId', header: 'Entity ID', render: row => <span className="font-mono text-[10px]">{String(row.entityId ?? '—').slice(0, 12)}</span> },
    { key: 'makerUserId', header: 'Maker', render: row => <span className="font-mono text-[10px]">{String(row.makerUserId ?? '—').slice(0, 8)}…</span> },
    { key: 'priority', header: 'Priority', render: row => (
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${row.priority === 'HIGH' || row.priority === 'URGENT' ? 'bg-[#A32D2D]/10 text-[#A32D2D]' : 'bg-gray-100 text-gray-600'}`}>
        {String(row.priority ?? 'NORMAL')}
      </span>
    )},
    { key: 'status', header: 'Status', render: row => <StatusBadge status={String(row.status ?? '')} /> },
    { key: 'submittedAt', header: 'Submitted', render: row => formatDateTime(String(row.submittedAt ?? '')) },
  ];

  return (
    <div>
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedItem(null)} />
          <div className="relative bg-white rounded-lg p-6 w-[560px] max-h-[80vh] overflow-y-auto shadow-xl">
            <h3 className="text-[14px] font-bold mb-3">{String(selectedItem.actionType)} — {String(selectedItem.entityType)}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-[10px] font-semibold text-[#5A6A7A] mb-1">BEFORE</div>
                <pre className="text-[9px] bg-gray-50 p-3 rounded border border-[#D8E2EC] overflow-auto max-h-40 whitespace-pre-wrap">
                  {JSON.stringify(JSON.parse(String(selectedItem.payloadBefore ?? '{}')), null, 2)}
                </pre>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-[#5A6A7A] mb-1">AFTER (PROPOSED)</div>
                <pre className="text-[9px] bg-[#0F6E56]/5 p-3 rounded border border-[#0F6E56]/20 overflow-auto max-h-40 whitespace-pre-wrap">
                  {JSON.stringify(JSON.parse(String(selectedItem.payloadAfter ?? '{}')), null, 2)}
                </pre>
              </div>
            </div>
            {selectedItem.status === 'PENDING' && isChecker() && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#5A6A7A] mb-1">REJECTION REASON (if rejecting)</label>
                  <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Enter reason..." className="input-field" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setSelectedItem(null)} className="btn-ghost">Cancel</button>
                  <button onClick={() => rejectMutation.mutate({ queueId: String(selectedItem.queueId), reason: rejectReason })} className="btn-danger">
                    <XCircle size={13} /> Reject
                  </button>
                  <button onClick={() => approveMutation.mutate(String(selectedItem.queueId))} className="btn-primary">
                    <CheckCircle size={13} /> Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <PageHeader title="Approval Queue" subtitle="Pending maker-checker approvals" />

      <div className="flex gap-1 mb-4">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s === 'ALL' ? '' : s); setPage(0); }}
            className={`px-3 py-1.5 text-[10px] font-semibold rounded-md transition-colors ${(statusFilter || 'ALL') === s ? 'bg-[#1B3A5C] text-white' : 'bg-white text-[#5A6A7A] border border-[#D8E2EC] hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        onRowClick={row => setSelectedItem(row)}
        pagination={{ page, pageSize: 20, total, onPageChange: setPage }}
        emptyMessage="No items in queue"
      />
    </div>
  );
}
