import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Download } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { txnApi } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

const MOCK_CHART_DATA = [
  { date: 'Mon', debit: 120000, credit: 95000 },
  { date: 'Tue', debit: 85000, credit: 110000 },
  { date: 'Wed', debit: 200000, credit: 175000 },
  { date: 'Thu', debit: 145000, credit: 160000 },
  { date: 'Fri', debit: 310000, credit: 290000 },
];

export default function ReportsPage() {
  const [balanceDate, setBalanceDate] = useState('');
  const [chartData] = useState(MOCK_CHART_DATA);
  const [balanceData, setBalanceData] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);

  const generateBalanceReport = async () => {
    setLoading(true);
    try {
      const res = await txnApi.get(`/v1/transactions?size=10${balanceDate ? `&date=${balanceDate}` : ''}`);
      setBalanceData(res.data?.data?.content ?? []);
    } catch {
      setBalanceData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Operational and regulatory reporting" />

      <div className="grid grid-cols-2 gap-5">
        {/* Balance Report */}
        <div className="card">
          <h3 className="text-[14px] font-bold mb-3 flex items-center gap-2">
            <FileText size={15} className="text-[#185FA5]" /> Balance Report
          </h3>
          <p className="text-xs text-[#5A6A7A] mb-4">Point-in-time snapshot of all account balances.</p>
          <div className="flex gap-2 mb-4">
            <input type="date" value={balanceDate} onChange={e => setBalanceDate(e.target.value)} className="input-field flex-1" />
            <button onClick={generateBalanceReport} disabled={loading} className="btn-primary">
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </div>
          {balanceData !== null && (
            balanceData.length === 0 ? (
              <p className="text-xs text-[#8A9BAB] text-center py-4">No data for the selected date</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#D8E2EC] text-[10px] text-[#5A6A7A]">
                    <th className="pb-1 text-left">Reference</th>
                    <th className="pb-1 text-right">Amount</th>
                    <th className="pb-1 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceData.slice(0, 8).map((row, i) => (
                    <tr key={i} className="border-b border-[#D8E2EC]">
                      <td className="py-1 font-mono text-[#185FA5]">{String(row.txnReference ?? '—')}</td>
                      <td className="py-1 text-right font-semibold">{formatCurrency(Number(row.txnAmount) || 0)}</td>
                      <td className="py-1 text-center text-[9px]">{String(row.txnStatus ?? '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Transaction Volume */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold flex items-center gap-2">
              <FileText size={15} className="text-[#0F6E56]" /> Transaction Volume
            </h3>
            <button className="btn-secondary text-[10px] px-2 h-6"><Download size={11} /> CSV</button>
          </div>
          <p className="text-xs text-[#5A6A7A] mb-4">Weekly debit/credit summary.</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D8E2EC" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#5A6A7A' }} />
              <YAxis tick={{ fontSize: 10, fill: '#5A6A7A' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
              <Bar dataKey="debit" fill="#A32D2D" radius={[2,2,0,0]} name="Debit" />
              <Bar dataKey="credit" fill="#0F6E56" radius={[2,2,0,0]} name="Credit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
