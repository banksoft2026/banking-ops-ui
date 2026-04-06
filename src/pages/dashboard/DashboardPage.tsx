import { useQuery } from '@tanstack/react-query';
import { Wallet, ArrowLeftRight, Clock, CheckSquare, PlusCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { accountApi, txnApi, userAdminApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDateTime, formatCurrency } from '../../lib/utils';

function KpiCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <div className="text-[22px] font-bold text-[#1A1A2E]">{value}</div>
        <div className="text-[10px] text-[#5A6A7A]">{title}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: accountsData } = useQuery({
    queryKey: ['dashboard-accounts'],
    queryFn: () => accountApi.get('/v1/accounts?status=ACTIVE&size=1').then(r => r.data),
    retry: false,
  });

  const { data: txnData } = useQuery({
    queryKey: ['dashboard-txns'],
    queryFn: () => txnApi.get('/v1/transactions?size=10').then(r => r.data),
    retry: false,
  });

  const { data: pendingData } = useQuery({
    queryKey: ['dashboard-pending'],
    queryFn: () => userAdminApi.get('/v1/approvals/pending-count').then(r => r.data),
    retry: false,
  });

  const activeAccounts = accountsData?.data?.totalElements ?? '—';
  const txnCount = txnData?.data?.totalElements ?? '—';
  const pendingCount = pendingData?.data?.count ?? 0;
  const recentTxns: Record<string, unknown>[] = txnData?.data?.content ?? [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Operational overview for today"
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate('/accounts/new')} className="btn-secondary">
              <PlusCircle size={13} /> New Account
            </button>
            <button onClick={() => navigate('/transactions/manual')} className="btn-primary">
              <FileText size={13} /> Manual Entry
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <KpiCard title="Active Accounts" value={activeAccounts} icon={Wallet} color="bg-[#1B3A5C]" />
        <KpiCard title="Today's Transactions" value={txnCount} icon={ArrowLeftRight} color="bg-[#0F6E56]" />
        <KpiCard title="Pending Approvals" value={pendingCount} icon={Clock} color="bg-[#854F0B]" />
        <KpiCard title="GL Periods Open" value={1} icon={CheckSquare} color="bg-[#185FA5]" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Open New Account', to: '/accounts/new', color: 'bg-[#1B3A5C]' },
          { label: 'Post Transaction', to: '/transactions/manual', color: 'bg-[#0F6E56]' },
          { label: 'Review Approvals', to: '/admin/approvals', color: 'bg-[#854F0B]' },
        ].map(a => (
          <button
            key={a.to}
            onClick={() => navigate(a.to)}
            className={`${a.color} text-white rounded-lg p-4 text-left hover:opacity-90 transition-opacity`}
          >
            <div className="text-xs font-semibold">{a.label}</div>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-[14px] font-bold text-[#1A1A2E] mb-3">Recent Transactions</h3>
        {recentTxns.length === 0 ? (
          <p className="text-xs text-[#8A9BAB] text-center py-6">No recent transactions</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-[#5A6A7A] border-b border-[#D8E2EC]">
                <th className="text-left pb-2 font-semibold">Reference</th>
                <th className="text-left pb-2 font-semibold">Account</th>
                <th className="text-right pb-2 font-semibold">Amount</th>
                <th className="text-center pb-2 font-semibold">Status</th>
                <th className="text-right pb-2 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTxns.map((txn, i) => (
                <tr key={i} className="border-b border-[#D8E2EC] last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/transactions`)}>
                  <td className="py-2.5 text-[11px] font-mono text-[#185FA5]">{String(txn.txnReference ?? '—')}</td>
                  <td className="py-2.5 text-[11px]">{String(txn.accountId ?? '—').slice(0, 8)}…</td>
                  <td className="py-2.5 text-[11px] text-right font-semibold">{formatCurrency(Number(txn.txnAmount) || 0)}</td>
                  <td className="py-2.5 text-center"><StatusBadge status={String(txn.txnStatus ?? 'PENDING')} /></td>
                  <td className="py-2.5 text-[10px] text-[#8A9BAB] text-right">{formatDateTime(String(txn.createdAt ?? ''))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
