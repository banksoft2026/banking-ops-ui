import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Lock, Unlock, Ban, CheckCircle } from 'lucide-react';
import { userAdminApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDateTime } from '../../lib/utils';
import { useUIStore } from '../../store/uiStore';

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { addToast } = useUIStore();
  const [form, setForm] = useState({ username: '', email: '', fullName: '', employeeId: '', department: '', branchCode: '', password: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userAdminApi.post('/v1/users', form);
      addToast('success', 'User created successfully');
      onCreated();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 w-[480px] shadow-xl">
        <h3 className="text-[14px] font-bold mb-4">Create New User</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: 'username', label: 'Username' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'fullName', label: 'Full Name' },
            { key: 'employeeId', label: 'Employee ID' },
            { key: 'department', label: 'Department' },
            { key: 'branchCode', label: 'Branch Code' },
            { key: 'password', label: 'Password', type: 'password' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1">{f.label}</label>
              <input
                type={f.type ?? 'text'}
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="input-field"
                required={['username', 'email', 'fullName', 'password'].includes(f.key)}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await userAdminApi.get(`/v1/users?${params}`);
      return res.data.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: string }) =>
      userAdminApi.post(`/v1/users/${userId}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast('success', 'User status updated');
    },
    onError: () => addToast('error', 'Failed to update user status'),
  });

  const users: Record<string, unknown>[] = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'username', header: 'Username', render: row => <span className="font-semibold text-[#1A1A2E]">{String(row.username ?? '—')}</span> },
    { key: 'fullName', header: 'Full Name' },
    { key: 'email', header: 'Email', render: row => <span className="text-[#185FA5]">{String(row.email ?? '—')}</span> },
    { key: 'department', header: 'Department' },
    { key: 'branchCode', header: 'Branch' },
    { key: 'status', header: 'Status', render: row => <StatusBadge status={String(row.status ?? '')} /> },
    { key: 'lastLoginAt', header: 'Last Login', render: row => formatDateTime(String(row.lastLoginAt ?? '')) },
    { key: 'roles', header: 'Roles', render: row => {
      const roles = row.roles as { roleCode: string }[] | undefined;
      return <div className="flex gap-1 flex-wrap">{(roles ?? []).map(r => <StatusBadge key={r.roleCode} status={r.roleCode} />)}</div>;
    }},
    { key: 'actions', header: '', render: row => (
      <div className="flex items-center gap-1">
        {row.status === 'ACTIVE' && (
          <button onClick={e => { e.stopPropagation(); statusMutation.mutate({ userId: String(row.userId), action: 'lock' }); }}
            className="p-1.5 text-[#5A6A7A] hover:text-[#A32D2D] hover:bg-[#A32D2D]/10 rounded" title="Lock">
            <Lock size={12} />
          </button>
        )}
        {row.status === 'LOCKED' && (
          <button onClick={e => { e.stopPropagation(); statusMutation.mutate({ userId: String(row.userId), action: 'unlock' }); }}
            className="p-1.5 text-[#5A6A7A] hover:text-[#0F6E56] hover:bg-[#0F6E56]/10 rounded" title="Unlock">
            <Unlock size={12} />
          </button>
        )}
        {row.status === 'ACTIVE' && (
          <button onClick={e => { e.stopPropagation(); statusMutation.mutate({ userId: String(row.userId), action: 'suspend' }); }}
            className="p-1.5 text-[#5A6A7A] hover:text-orange-600 hover:bg-orange-100 rounded" title="Suspend">
            <Ban size={12} />
          </button>
        )}
        {row.status === 'SUSPENDED' && (
          <button onClick={e => { e.stopPropagation(); statusMutation.mutate({ userId: String(row.userId), action: 'activate' }); }}
            className="p-1.5 text-[#5A6A7A] hover:text-[#0F6E56] hover:bg-[#0F6E56]/10 rounded" title="Activate">
            <CheckCircle size={12} />
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={() => queryClient.invalidateQueries({ queryKey: ['users'] })} />}
      <PageHeader
        title="User Management"
        subtitle="Manage bank operator accounts and access"
        actions={<button onClick={() => setShowCreate(true)} className="btn-primary"><UserPlus size={13} /> Create User</button>}
      />
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BAB]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search users..." className="input-field pl-8" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); }} className="input-field w-32">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="LOCKED">Locked</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
      <DataTable columns={columns} data={users} isLoading={isLoading} pagination={{ page, pageSize: 20, total, onPageChange: setPage }} emptyMessage="No users found" />
    </div>
  );
}
