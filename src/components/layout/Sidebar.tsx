import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Wallet, ArrowLeftRight, BookOpen,
  Calendar, BarChart2, Hash, Building2, DollarSign, MapPin,
  BarChart3, FileSearch, UserCog, ShieldCheck, Lock, CheckSquare,
  LogOut, Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: 'BANKING',
    items: [
      { to: '/customers', icon: Users, label: 'Customers' },
      { to: '/accounts', icon: Wallet, label: 'Accounts' },
      { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
    ]
  },
  {
    label: 'GL & MAINTENANCE',
    items: [
      { to: '/gl/accounts', icon: BookOpen, label: 'Chart of Accounts' },
      { to: '/gl/periods', icon: Calendar, label: 'GL Periods' },
      { to: '/gl/trial-balance', icon: BarChart2, label: 'Trial Balance' },
      { to: '/gl/transaction-codes', icon: Hash, label: 'Txn Codes' },
      { to: '/maintenance/institution', icon: Building2, label: 'Institution' },
      { to: '/maintenance/currencies', icon: DollarSign, label: 'Currencies' },
      { to: '/maintenance/branches', icon: MapPin, label: 'Branches' },
    ]
  },
  {
    label: 'REPORTING',
    items: [
      { to: '/reports', icon: BarChart3, label: 'Reports' },
      { to: '/audit', icon: FileSearch, label: 'Audit Log' },
    ]
  },
  {
    label: 'ADMINISTRATION',
    items: [
      { to: '/admin/users', icon: UserCog, label: 'Users' },
      { to: '/admin/roles', icon: ShieldCheck, label: 'Roles' },
      { to: '/admin/permissions', icon: Lock, label: 'Permissions' },
      { to: '/admin/approvals', icon: CheckSquare, label: 'Approval Queue' },
    ]
  },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-[200px] min-w-[200px] bg-[#1B3A5C] text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-30">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#0F6E56] rounded flex items-center justify-center">
            <Settings size={14} className="text-white" />
          </div>
          <div>
            <div className="text-[13px] font-bold leading-none">BankSoft</div>
            <div className="text-[9px] text-white/50 mt-0.5">CBS Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label} className="mb-1">
            <div className="px-4 py-1.5 text-[9px] font-semibold text-white/40 tracking-widest">
              {group.label}
            </div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-2 text-[11px] transition-colors relative
                  ${isActive
                    ? 'bg-white/10 text-white font-medium before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-blue-400 before:rounded-r'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <item.icon size={13} className="shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-[#0F6E56] flex items-center justify-center text-[11px] font-semibold shrink-0">
            {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium truncate">{user?.fullName}</div>
            <div className="text-[9px] text-white/50">{user?.roles?.[0]}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-[10px] text-white/60 hover:text-white px-1 py-1 rounded hover:bg-white/5 transition-colors"
        >
          <LogOut size={11} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
