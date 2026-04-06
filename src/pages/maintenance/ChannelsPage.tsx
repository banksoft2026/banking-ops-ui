import { useQuery } from '@tanstack/react-query';
import { cbsApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useUIStore } from '../../store/uiStore';

export default function ChannelsPage() {
  const { addToast } = useUIStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['channels'],
    queryFn: () => cbsApi.get('/v1/config/channels?institutionId=INST-001').then(r => r.data.data).catch(() => []),
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
    { key: 'channelType', header: 'Type' },
    { key: 'isActive', header: 'Status', render: row => <StatusBadge status={(row.isActive ?? row.active) ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      key: 'actions', header: 'Actions', render: row => (
        <button
          onClick={e => { e.stopPropagation(); handleToggle(row); }}
          className={`text-[9px] px-2 py-1 h-6 rounded border font-semibold transition-colors ${(row.isActive ?? row.active) ? 'border-[#A32D2D] text-[#A32D2D] hover:bg-red-50' : 'border-[#0F6E56] text-[#0F6E56] hover:bg-green-50'}`}
        >
          {(row.isActive ?? row.active) ? 'Deactivate' : 'Activate'}
        </button>
      )
    },
  ];

  return (
    <div>
      <PageHeader title="Channels" subtitle="Transaction channel configuration" />
      <DataTable
        columns={columns}
        data={channels}
        isLoading={isLoading}
        emptyMessage="No channels found — check CBS Maintenance service (port 8080)"
      />
    </div>
  );
}
