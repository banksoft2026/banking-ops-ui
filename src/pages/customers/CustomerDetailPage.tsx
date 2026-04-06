import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div>
      <button onClick={() => navigate('/customers')} className="btn-ghost mb-4"><ArrowLeft size={13} /> Back</button>
      <PageHeader title={`Customer ${id}`} actions={<StatusBadge status="ACTIVE" size="md" />} />
      <div className="card">
        <p className="text-xs text-[#5A6A7A]">Customer details will load from customer-entity service (port 8081).</p>
      </div>
    </div>
  );
}
