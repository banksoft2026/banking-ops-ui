import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Wallet, ArrowLeftRight, BookOpen,
  Calendar, BarChart2, Hash, Building2, DollarSign, MapPin,
  UserCog, ShieldCheck, Lock, CheckSquare,
  LogOut, Settings, ChevronDown, ChevronRight as ChevronRightIcon,
  FileSearch, Globe, Network, Shield, SortAsc, Package,
  ClipboardList
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const operationsItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/entities', icon: Globe, label: 'Entities' },
  { to: '/accounts', icon: Wallet, label: 'Accounts' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
];

const glItems = [
  { to: '/gl/chart-of-accounts', icon: BookOpen, label: 'Chart of Accounts' },
  { to: '/gl/transaction-codes', icon: Hash, label: 'Transaction Codes' },
  { to: '/gl/periods', icon: Calendar, label: 'GL Periods' },
  { to: '/gl/trial-balance', icon: BarChart2, label: 'Trial Balance' },
];

const maintenanceItems = [
  { to: '/maintenance/institution', icon: Building2, label: 'Institution' },
  { to: '/maintenance/branches', icon: MapPin, label: 'Branches' },
  { to: '/maintenance/currencies', icon: DollarSign, label: 'Currencies' },
  { to: '/maintenance/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/maintenance/products', icon: Package, label: 'Account Products' },
  { to: '/maintenance/channels', icon: Network, label: 'Channels' },
  { to: '/maintenance/auth-matrix', icon: Shield, label: 'Auth Matrix' },
  { to: '/maintenance/numbering', icon: SortAsc, label: 'Numbering Schemes' },
];

const adminItems = [
  { to: '/admin/users', icon: UserCog, label: 'Users' },
  { to: '/admin/roles', icon: ShieldCheck, label: 'Roles' },
  { to: '/admin/permissions', icon: Lock, label: 'Permissions' },
  { to: '/admin/approvals', icon: CheckSquare, label: 'Approval Queue' },
  { to: '/audit', icon: FileSearch, label: 'Audit Log' },
];

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-4 py-2 text-[11px] transition-colors relative
        ${isActive
          ? 'bg-white/10 text-white font-medium before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-blue-400 before:rounded-r'
          : 'text-white/70 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <Icon size={13} className="shrink-0" />
      {label}
    </NavLink>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-4 py-1.5 text-[9px] font-semibold text-white/40 tracking-widest">
      {label}
    </div>
  );
}

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);

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
        {/* OPERATIONS */}
        <div className="mb-1">
          <SectionLabel label="OPERATIONS" />
          {operationsItems.map(item => <NavItem key={item.to} {...item} />)}
        </div>

        {/* GENERAL LEDGER */}
        <div className="mb-1">
          <SectionLabel label="GENERAL LEDGER" />
          {glItems.map(item => <NavItem key={item.to} {...item} />)}
        </div>

        {/* MAINTENANCE — collapsible */}
        <div className="mb-1">
          <button
            onClick={() => setMaintenanceOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-1.5 text-[9px] font-semibold text-white/40 tracking-widest hover:text-white/60 transition-colors"
          >
            <span>MAINTENANCE</span>
            {maintenanceOpen ? <ChevronDown size={10} /> : <ChevronRightIcon size={10} />}
          </button>
          {maintenanceOpen && maintenanceItems.map(item => <NavItem key={item.to} {...item} />)}
        </div>

        {/* ADMINISTRATION */}
        <div className="mb-1">
          <SectionLabel label="ADMINISTRATION" />
          {adminItems.map(item => <NavItem key={item.to} {...item} />)}
        </div>

        {/* REPORTS */}
        <div className="mb-1">
          <SectionLabel label="REPORTS" />
          <NavItem to="/reports" icon={ClipboardList} label="Reports" />
        </div>
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
