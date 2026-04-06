import { useQuery } from '@tanstack/react-query';
import { cbsApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';

export default function InstitutionPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['institution'],
    queryFn: () => cbsApi.get('/v1/config/institution').then(r => r.data.data).catch(() => null),
  });
  return (
    <div>
      <PageHeader title="Institution Settings" subtitle="Core institution configuration" />
      <div className="card max-w-lg">
        {isLoading ? <div className="animate-pulse h-32 bg-gray-100 rounded" /> : data ? (
          <dl className="space-y-3">
            {Object.entries(data as Record<string, unknown>).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-[#D8E2EC] pb-2 last:border-0">
                <dt className="text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</dt>
                <dd className="text-[11px] font-medium">{String(v ?? '—')}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-xs text-[#8A9BAB]">Institution settings will load from CBS Maintenance service (port 8080).</p>
        )}
      </div>
    </div>
  );
}
