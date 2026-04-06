import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { userAdminApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { useUIStore } from '../../store/uiStore';

export default function PermissionMatrixPage() {
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => userAdminApi.get('/v1/roles').then(r => r.data.data),
  });

  const { data: screensData } = useQuery({
    queryKey: ['screens'],
    queryFn: () => userAdminApi.get('/v1/permissions/screens').then(r => r.data.data),
  });

  const { data: permsData } = useQuery({
    queryKey: ['screen-perms', selectedRoleId],
    queryFn: () => userAdminApi.get(`/v1/permissions/screen-perms?roleId=${selectedRoleId}`).then(r => r.data.data),
    enabled: !!selectedRoleId,
  });

  const saveMutation = useMutation({
    mutationFn: (perm: { roleId: string; screenId: string; canAccess: boolean; accessLevel: string }) =>
      userAdminApi.post('/v1/permissions/screen-perms', perm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-perms'] });
      addToast('success', 'Permission saved');
    },
    onError: () => addToast('error', 'Failed to save permission'),
  });

  const roles: Record<string, unknown>[] = Array.isArray(rolesData) ? rolesData : [];
  const screens: Record<string, unknown>[] = Array.isArray(screensData) ? screensData : [];
  const perms: Record<string, unknown>[] = Array.isArray(permsData) ? permsData : [];

  const getPermForScreen = (screenId: string) =>
    perms.find(p => p.screenId === screenId);

  return (
    <div>
      <PageHeader title="Permission Matrix" subtitle="Configure role-based screen access" />

      <div className="flex items-center gap-3 mb-5">
        <label className="text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide">Role:</label>
        <select
          value={selectedRoleId}
          onChange={e => setSelectedRoleId(e.target.value)}
          className="input-field w-56"
        >
          <option value="">Select a role...</option>
          {roles.map(r => (
            <option key={String(r.roleId)} value={String(r.roleId)}>
              {String(r.roleCode)} — {String(r.roleName)}
            </option>
          ))}
        </select>
      </div>

      {selectedRoleId && (
        <div className="table-container">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left">Screen Code</th>
                <th className="table-cell text-left">Screen Name</th>
                <th className="table-cell text-left">Module</th>
                <th className="table-cell text-left">Type</th>
                <th className="table-cell text-center">Can Access</th>
                <th className="table-cell text-center">Access Level</th>
                <th className="table-cell text-center">Save</th>
              </tr>
            </thead>
            <tbody>
              {screens.map(screen => {
                const perm = getPermForScreen(String(screen.screenId));
                const canAccess = perm ? Boolean(perm.canAccess) : false;
                const accessLevel = String(perm?.accessLevel ?? 'READ');

                return (
                  <tr key={String(screen.screenId)} className="border-b border-[#D8E2EC] hover:bg-gray-50">
                    <td className="table-cell font-mono text-[#185FA5]">{String(screen.screenCode)}</td>
                    <td className="table-cell font-medium">{String(screen.screenName)}</td>
                    <td className="table-cell text-[#5A6A7A]">{String(screen.moduleId ?? '—').slice(0, 8)}…</td>
                    <td className="table-cell text-[10px]">{String(screen.screenType)}</td>
                    <td className="table-cell text-center">
                      <input
                        type="checkbox"
                        defaultChecked={canAccess}
                        id={`access-${screen.screenId}`}
                        className="w-4 h-4 accent-[#1B3A5C]"
                      />
                    </td>
                    <td className="table-cell text-center">
                      <select
                        defaultValue={accessLevel}
                        id={`level-${screen.screenId}`}
                        className="input-field w-24 h-7 text-[10px]"
                      >
                        <option value="FULL">FULL</option>
                        <option value="MAKER">MAKER</option>
                        <option value="READ">READ</option>
                        <option value="NONE">NONE</option>
                      </select>
                    </td>
                    <td className="table-cell text-center">
                      <button
                        onClick={() => {
                          const cb = document.getElementById(`access-${screen.screenId}`) as HTMLInputElement;
                          const sel = document.getElementById(`level-${screen.screenId}`) as HTMLSelectElement;
                          saveMutation.mutate({
                            roleId: selectedRoleId,
                            screenId: String(screen.screenId),
                            canAccess: cb?.checked ?? false,
                            accessLevel: sel?.value ?? 'READ',
                          });
                        }}
                        className="btn-ghost px-2 h-7 text-[10px]"
                      >
                        <Save size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
