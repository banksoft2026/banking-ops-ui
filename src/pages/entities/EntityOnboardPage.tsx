import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { customerApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { useUIStore } from '../../store/uiStore';

export default function EntityOnboardPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    entityName: '',
    entityType: 'PRIVATE_LIMITED',
    registrationNumber: '',
    registrationCountry: '',
    incorporationDate: '',
    legalForm: '',
    primaryCurrency: 'USD',
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.entityName || !form.registrationNumber) {
      addToast('error', 'Entity Name and Registration Number are required');
      return;
    }
    setLoading(true);
    try {
      const res = await customerApi.post('/v1/entities', form);
      const id = (res.data.data ?? res.data)?.entityId ?? (res.data.data ?? res.data)?.id;
      addToast('success', 'Entity onboarded successfully');
      if (id) navigate(`/entities/${id}`);
      else navigate('/entities');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to onboard entity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/entities')} className="btn-ghost mb-4"><ArrowLeft size={13} /> Back</button>
      <PageHeader title="Onboard Entity" subtitle="Register a new corporate entity" />
      <div className="card max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Entity Name *</label>
            <input value={form.entityName} onChange={e => set('entityName', e.target.value)} className="input-field" placeholder="Legal entity name" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Entity Type</label>
            <select value={form.entityType} onChange={e => set('entityType', e.target.value)} className="input-field">
              <option value="SOLE_TRADER">Sole Trader</option>
              <option value="PARTNERSHIP">Partnership</option>
              <option value="PRIVATE_LIMITED">Private Limited</option>
              <option value="PUBLIC_LIMITED">Public Limited</option>
              <option value="TRUST">Trust</option>
              <option value="CHARITY">Charity</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Registration Number *</label>
            <input value={form.registrationNumber} onChange={e => set('registrationNumber', e.target.value)} className="input-field" placeholder="Company registration number" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Registration Country</label>
            <input value={form.registrationCountry} onChange={e => set('registrationCountry', e.target.value)} className="input-field" placeholder="e.g. US, GB, SG" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Incorporation Date</label>
            <input type="date" value={form.incorporationDate} onChange={e => set('incorporationDate', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Legal Form</label>
            <input value={form.legalForm} onChange={e => set('legalForm', e.target.value)} className="input-field" placeholder="e.g. LLC, PLC" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">Primary Currency</label>
            <input value={form.primaryCurrency} onChange={e => set('primaryCurrency', e.target.value)} className="input-field" placeholder="USD" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Onboarding...' : 'Onboard Entity'}
          </button>
        </form>
      </div>
    </div>
  );
}
