import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, PlusCircle } from 'lucide-react';
import { cbsApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';

interface GlAccount {
  glAccountId: string;
  glAccountCode: string;
  glAccountName: string;
  glAccountType: string;
  glAccountCategory: string;
  normalBalanceSide: string;
  isLeafAccount: boolean;
  isControlAccount: boolean;
  children?: GlAccount[];
}

function GlAccountRow({ account, depth = 0 }: { account: GlAccount; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = account.children && account.children.length > 0;
  return (
    <>
      <tr className="border-b border-[#D8E2EC] hover:bg-gray-50">
        <td className="table-cell" style={{ paddingLeft: `${16 + depth * 20}px` }}>
          <div className="flex items-center gap-1">
            {hasChildren ? (
              <button onClick={() => setExpanded(!expanded)} className="text-[#5A6A7A]">
                {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
            ) : <span className="w-[11px]" />}
            <span className="font-mono text-[#185FA5] text-[10px]">{account.glAccountCode}</span>
          </div>
        </td>
        <td className="table-cell font-medium">{account.glAccountName}</td>
        <td className="table-cell text-[10px] text-[#5A6A7A]">{account.glAccountType}</td>
        <td className="table-cell text-[10px] text-[#5A6A7A]">{account.glAccountCategory}</td>
        <td className="table-cell text-center">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${account.normalBalanceSide === 'DR' ? 'bg-[#A32D2D]/10 text-[#A32D2D]' : 'bg-[#0F6E56]/10 text-[#0F6E56]'}`}>
            {account.normalBalanceSide}
          </span>
        </td>
        <td className="table-cell text-center">
          {account.isLeafAccount && <span className="text-[9px] bg-[#185FA5]/10 text-[#185FA5] px-1.5 py-0.5 rounded">LEAF</span>}
        </td>
      </tr>
      {expanded && hasChildren && account.children!.map(child => (
        <GlAccountRow key={child.glAccountId} account={child} depth={depth + 1} />
      ))}
    </>
  );
}

export default function ChartOfAccountsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: () => cbsApi.get('/v1/gl/chart-of-accounts').then(r => r.data.data),
    retry: false,
  });

  const accounts: GlAccount[] = Array.isArray(data) ? data : (data?.content ?? []);

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        subtitle="GL account hierarchy"
        actions={<button className="btn-primary"><PlusCircle size={13} /> Add Account</button>}
      />
      <div className="table-container">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left">Account Code</th>
              <th className="table-cell text-left">Account Name</th>
              <th className="table-cell text-left">Type</th>
              <th className="table-cell text-left">Category</th>
              <th className="table-cell text-center">Normal Side</th>
              <th className="table-cell text-center">Flags</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1,2,3,4,5].map(i => (
                <tr key={i} className="border-b border-[#D8E2EC]">
                  {[1,2,3,4,5,6].map(j => <td key={j} className="table-cell"><div className="h-3 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : accounts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-[#8A9BAB] text-xs">No GL accounts found</td></tr>
            ) : (
              accounts.map(acct => <GlAccountRow key={acct.glAccountId} account={acct} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
