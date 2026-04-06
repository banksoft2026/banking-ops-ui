import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (p: number) => void;
  };
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, isLoading, onRowClick, pagination, emptyMessage = 'No data found'
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="table-container">
        <table className="w-full">
          <thead className="table-header">
            <tr>{columns.map(c => <th key={c.key} className="table-cell text-left">{c.header}</th>)}</tr>
          </thead>
          <tbody>
            {[1,2,3,4,5].map(i => (
              <tr key={i} className="table-row">
                {columns.map(c => (
                  <td key={c.key} className="table-cell">
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="w-full">
        <thead className="table-header">
          <tr>
            {columns.map(c => (
              <th key={c.key} className={`table-cell text-left ${c.className ?? ''}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-[#8A9BAB] text-xs">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className={`table-row ${onRowClick ? 'cursor-pointer' : ''} ${i % 2 === 1 ? 'bg-[#F7F9FC]' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(c => (
                  <td key={c.key} className={`table-cell ${c.className ?? ''}`}>
                    {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#D8E2EC]">
          <span className="text-[10px] text-[#8A9BAB]">
            Showing {pagination.page * pagination.pageSize + 1}–{Math.min((pagination.page + 1) * pagination.pageSize, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={pagination.page === 0}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] text-[#5A6A7A] px-2">
              Page {pagination.page + 1} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              disabled={(pagination.page + 1) * pagination.pageSize >= pagination.total}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
