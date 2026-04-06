import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

export function Topbar() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800',
    CHECKER: 'bg-blue-100 text-blue-800',
    MAKER: 'bg-green-100 text-green-800',
    VIEWER: 'bg-gray-100 text-gray-700',
  };
  const primaryRole = user?.roles?.[0] ?? '';
  const roleBadgeClass = roleColors[primaryRole] || 'bg-gray-100 text-gray-700';

  return (
    <header className="h-[54px] bg-white border-b border-[#D8E2EC] flex items-center px-6 gap-4 fixed top-0 right-0 left-[200px] z-20">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BAB]" />
        <input
          type="text"
          placeholder="Search customers, accounts, transactions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 h-8 text-xs bg-[#F0F2F5] border border-[#D8E2EC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:bg-white transition-colors"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Env badge */}
        <span className="bg-amber-100 text-amber-800 text-[9px] font-semibold px-2 py-0.5 rounded">DEV</span>

        {/* Notifications */}
        <button className="relative p-1.5 rounded hover:bg-gray-100 transition-colors">
          <Bell size={15} className="text-[#5A6A7A]" />
        </button>

        {/* Role badge */}
        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${roleBadgeClass}`}>
          {primaryRole}
        </span>

        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-[#1B3A5C] flex items-center justify-center text-white text-[11px] font-semibold">
          {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  );
}
