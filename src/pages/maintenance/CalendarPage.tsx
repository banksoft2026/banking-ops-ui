import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Trash2 } from 'lucide-react';
import { cbsApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { useUIStore } from '../../store/uiStore';

export default function CalendarPage() {
  const { addToast } = useUIStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ holidayDate: '', description: '', holidayType: 'PUBLIC' });

  const { data: calendarData } = useQuery({
    queryKey: ['calendar'],
    queryFn: () => cbsApi.get('/v1/config/calendar?institutionId=INST-001').then(r => r.data.data).catch(() => null),
  });

  const calendarId: string = calendarData?.calendarId ?? calendarData?.id ?? '';

  const { data: holidaysData, isLoading, refetch } = useQuery({
    queryKey: ['calendar-holidays', calendarId, selectedYear],
    queryFn: () => calendarId
      ? cbsApi.get(`/v1/config/calendar/${calendarId}/holidays?year=${selectedYear}`).then(r => r.data.data).catch(() => [])
      : Promise.resolve([]),
    enabled: !!calendarId,
  });

  const holidays: Record<string, unknown>[] = Array.isArray(holidaysData) ? holidaysData : (holidaysData?.content ?? []);

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'holidayDate', header: 'Date', render: row => <span className="font-mono text-[11px]">{String(row.holidayDate ?? '—')}</span> },
    { key: 'description', header: 'Description' },
    { key: 'holidayType', header: 'Type' },
    {
      key: 'actions', header: '', render: row => (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            const holidayId = String(row.holidayId ?? row.id ?? '');
            if (!holidayId) return;
            try {
              await cbsApi.delete(`/v1/config/calendar/holidays/${holidayId}`);
              addToast('success', 'Holiday deleted');
              refetch();
            } catch {
              addToast('error', 'Failed to delete holiday');
            }
          }}
          className="btn-danger text-[9px] px-2 py-1 h-6"
        >
          <Trash2 size={11} />
        </button>
      )
    },
  ];

  const handleAdd = async () => {
    if (!calendarId) { addToast('error', 'No calendar found'); return; }
    try {
      await cbsApi.post(`/v1/config/calendar/${calendarId}/holidays`, form);
      addToast('success', 'Holiday added');
      setShowModal(false);
      setForm({ holidayDate: '', description: '', holidayType: 'PUBLIC' });
      refetch();
    } catch {
      addToast('error', 'Failed to add holiday');
    }
  };

  return (
    <div>
      <PageHeader
        title="Business Calendar"
        subtitle="Working days and public holidays"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <PlusCircle size={13} /> Add Holiday
          </button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs text-[#5A6A7A]">Year:</label>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="input-field w-28"
        >
          {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {calendarData && (
          <span className="text-xs text-[#5A6A7A]">
            Calendar: <span className="font-mono text-[#185FA5]">{String(calendarData.calendarName ?? calendarId)}</span>
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={holidays}
        isLoading={isLoading}
        emptyMessage={calendarId ? `No holidays found for ${selectedYear}` : 'No calendar configured — check CBS Maintenance service (port 8080)'}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[500px] shadow-xl">
            <h2 className="text-[15px] font-bold mb-4">Add Holiday</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Date</label>
                <input type="date" value={form.holidayDate} onChange={e => setForm(f => ({ ...f, holidayDate: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field" placeholder="e.g. New Year's Day" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Holiday Type</label>
                <select value={form.holidayType} onChange={e => setForm(f => ({ ...f, holidayType: e.target.value }))} className="input-field">
                  <option value="PUBLIC">Public</option>
                  <option value="BANK">Bank</option>
                  <option value="REGIONAL">Regional</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAdd} className="btn-primary">Add Holiday</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
