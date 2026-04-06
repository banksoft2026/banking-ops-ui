import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldPlus } from 'lucide-react';
import { userAdminApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useUIStore } from '../../store/uiStore';

export default function RoleManagementPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ roleCode: '', roleName: '', roleLevel: 'MAKER', description: '' });
  const [saving, setSaving] = useState(false);
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => userAdminApi.get('/v1/roles').then(r => r.data.data),
  });

  const roles: Record<string, unknown>[] = Array.isArray(data) ? data : [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userAdminApi.post('/v1/roles', form);
      addToast('success', 'Role created');
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to create role');
    } finally { setSaving(false); }
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'roleCode', header: 'Role Code', render: row => <span className="font-mono font-bold">{String(row.roleCode ?? '—')}</span> },
    { key: 'roleName', header: 'Name' },
    { key: 'roleLevel', header: 'Level', render: row => <StatusBadge status={String(row.roleLevel ?? '')} /> },
    { key: 'isSystem', header: 'System', render: row => row.isSystem ? <span className="text-[9px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">SYSTEM</span> : '—' },
    { key: 'requiresMfa', header: 'MFA', render: row => row.requiresMfa ? '✓' : '—' },
    { key: 'sessionTimeoutMin', header: 'Session (min)', render: row => String(row.sessionTimeoutMin ?? '—') },
    { key: 'userCount', header: 'Users', render: row => <span className="font-semibold">{String(row.userCount ?? 0)}</span> },
    { key: 'isActive', header: 'Status', render: row => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Role Management"
        subtitle="Define roles and their access levels"
        actions={<button onClick={() => setShowCreate(true)} className="btn-primary"><ShieldPlus size={13} /> Create Role</button>}
      />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-lg p-6 w-[420px] shadow-xl">
            <h3 className="text-[14px] font-bold mb-4">Create Custom Role</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              {[{ key: 'roleCode', label: 'Role Code' }, { key: 'roleName', label: 'Role Name' }, { key: 'description', label: 'Description' }].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1">{f.label}</label>
                  <input value={form[f.key as keyof typeof form]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="input-field" />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1">Role Level</label>
                <select value={form.roleLevel} onChange={e => setForm(prev => ({ ...prev, roleLevel: e.target.value }))} className="input-field">
                  <option value="ADMIN">Admin</option>
                  <option value="CHECKER">Checker</option>
                  <option value="MAKER">Maker</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DataTable columns={columns} data={roles} isLoading={isLoading} emptyMessage="No roles found" />
    </div>
  );
}
