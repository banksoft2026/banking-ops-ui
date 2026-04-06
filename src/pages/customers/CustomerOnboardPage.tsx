import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { customerApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { useUIStore } from '../../store/uiStore';

export default function CustomerOnboardPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customerType: 'INDIVIDUAL',
    title: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    occupation: '',
    employerName: '',
    customerSegment: 'RETAIL',
    kycStatus: 'PENDING',
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) {
      addToast('error', 'First Name and Last Name are required');
      return;
    }
    setLoading(true);
    try {
      const fullName = `${form.title ? form.title + ' ' : ''}${form.firstName} ${form.lastName}`.trim();
      const res = await customerApi.post('/v1/customers', { ...form, fullName });
      const id = (res.data.data ?? res.data)?.customerId ?? (res.data.data ?? res.data)?.id;
      addToast('success', 'Customer onboarded successfully');
      if (id) navigate(`/customers/${id}`);
      else navigate('/customers');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to onboard customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/customers')} className="btn-ghost mb-4"><ArrowLeft size={13} /> Back</button>
      <PageHeader title="Onboard Customer" subtitle="Create a new customer record" />
      <div className="card max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Customer Type</label>
            <select value={form.customerType} onChange={e => set('customerType', e.target.value)} className="input-field">
              <option value="INDIVIDUAL">Individual</option>
              <option value="CORPORATE">Corporate</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Title</label>
              <select value={form.title} onChange={e => set('title', e.target.value)} className="input-field">
                <option value="">— None —</option>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">First Name *</label>
              <input value={form.firstName} onChange={e => set('firstName', e.target.value)} className="input-field" placeholder="First name" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Last Name *</label>
            <input value={form.lastName} onChange={e => set('lastName', e.target.value)} className="input-field" placeholder="Last name" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Date of Birth</label>
            <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Nationality</label>
            <input value={form.nationality} onChange={e => set('nationality', e.target.value)} className="input-field" placeholder="e.g. US" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Occupation</label>
            <input value={form.occupation} onChange={e => set('occupation', e.target.value)} className="input-field" placeholder="Occupation" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Employer Name</label>
            <input value={form.employerName} onChange={e => set('employerName', e.target.value)} className="input-field" placeholder="Employer" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Customer Segment</label>
            <select value={form.customerSegment} onChange={e => set('customerSegment', e.target.value)} className="input-field">
              <option value="RETAIL">Retail</option>
              <option value="SME">SME</option>
              <option value="CORPORATE">Corporate</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">KYC Status</label>
            <select value={form.kycStatus} onChange={e => set('kycStatus', e.target.value)} className="input-field">
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Onboarding...' : 'Onboard Customer'}
          </button>
        </form>
      </div>
    </div>
  );
}
