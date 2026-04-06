interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { bg: string; text: string; label?: string }> = {
  ACTIVE: { bg: 'bg-[#0F6E56]/10', text: 'text-[#0F6E56]' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-600' },
  LOCKED: { bg: 'bg-[#A32D2D]/10', text: 'text-[#A32D2D]' },
  SUSPENDED: { bg: 'bg-orange-100', text: 'text-orange-700' },
  FROZEN: { bg: 'bg-[#A32D2D]/10', text: 'text-[#A32D2D]' },
  CLOSED: { bg: 'bg-gray-100', text: 'text-gray-500' },
  DORMANT: { bg: 'bg-amber-100', text: 'text-amber-700' },
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-700' },
  APPROVED: { bg: 'bg-[#0F6E56]/10', text: 'text-[#0F6E56]' },
  REJECTED: { bg: 'bg-[#A32D2D]/10', text: 'text-[#A32D2D]' },
  POSTED: { bg: 'bg-[#0F6E56]/10', text: 'text-[#0F6E56]' },
  FAILED: { bg: 'bg-[#A32D2D]/10', text: 'text-[#A32D2D]' },
  REVERSED: { bg: 'bg-gray-100', text: 'text-gray-600' },
  OPEN: { bg: 'bg-[#185FA5]/10', text: 'text-[#185FA5]' },
  EXECUTED: { bg: 'bg-[#0F6E56]/10', text: 'text-[#0F6E56]' },
  RECALLED: { bg: 'bg-gray-100', text: 'text-gray-600' },
  ADMIN: { bg: 'bg-purple-100', text: 'text-purple-800' },
  CHECKER: { bg: 'bg-[#185FA5]/10', text: 'text-[#185FA5]' },
  MAKER: { bg: 'bg-[#0F6E56]/10', text: 'text-[#0F6E56]' },
  VIEWER: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status?.toUpperCase()] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
  const sizeClass = size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${config.bg} ${config.text} ${sizeClass}`}>
      {status}
    </span>
  );
}
