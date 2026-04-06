import { useQuery } from '@tanstack/react-query';
import { cbsApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';

export default function CalendarPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['calendar'],
    queryFn: () =>
      cbsApi.get('/v1/calendar').then(r => r.data.data).catch(() => ({ content: [] })),
  });

  const entries: Record<string, unknown>[] = data?.content ?? (Array.isArray(data) ? data : []);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'calendarDate',
      header: 'Date',
      render: row => (
        <span className="font-mono text-[11px]">{String(row.calendarDate ?? '—')}</span>
      ),
    },
    { key: 'description', header: 'Description' },
    {
      key: 'isHoliday',
      header: 'Holiday',
      render: row => (
        <StatusBadge status={row.isHoliday ? 'YES' : 'NO'} />
      ),
    },
    {
      key: 'isWorkingDay',
      header: 'Working Day',
      render: row => (
        <StatusBadge status={row.isWorkingDay ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    { key: 'dayType', header: 'Day Type' },
  ];

  return (
    <div>
      <PageHeader title="Business Calendar" subtitle="Working days, holidays and processing calendar" />
      <DataTable
        columns={columns}
        data={entries}
        isLoading={isLoading}
        emptyMessage="No calendar entries found — check CBS Maintenance service (port 8080)"
      />
    </div>
  );
}
