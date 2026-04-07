import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { customerApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { useUIStore } from '../../store/uiStore';

const F = ({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[9px] text-[#8A9BAB] mt-0.5">{hint}</p>}
  </div>
);

const Section = ({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) => (
  <div className="border border-[#D8E2EC] rounded-lg overflow-hidden mb-4">
    <button type="button" onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 bg-[#F0F2F5] text-[11px] font-bold text-[#1B3A5C] uppercase tracking-wide hover:bg-[#e8ecf0] transition-colors">
      <span>{title}</span>
      {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
    </button>
    {open && <div className="p-4 space-y-4">{children}</div>}
  </div>
);

export default function EntityOnboardPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [secEntity, setSecEntity] = useState(true);
  const [secAddress, setSecAddress] = useState(false);
  const [secFinancials, setSecFinancials] = useState(false);
  const [secCompliance, setSecCompliance] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    // Required
    entityName: '',
    entityType: 'PRIVATE_LIMITED',
    legalForm: '',
    registrationCountry: '',
    createdBy: 'OPS-PORTAL',
    // Optional core
    shortName: '',
    registrationNumber: '',
    registrationDate: '',
    incorporationDate: '',
    industryCode: '',
    sicCode: '',
    entityStatus: 'ACTIVE',
    kybStatus: 'PENDING',
    kybReviewDate: '',
    onboardingBranch: '',
    onboardingChannel: '',
    relationshipManagerId: '',
    parentEntityId: '',
    ultimateParentId: '',
    // Address
    addressType: 'REGISTERED',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    addressCountryCode: '',
    addressIsPrimary: true,
    // Financials
    financialYear: new Date().getFullYear().toString(),
    annualTurnover: '',
    turnoverCurrency: 'USD',
    netWorth: '',
    totalAssets: '',
    totalLiabilities: '',
    employeeCount: '',
    auditorName: '',
    creditRating: '',
    creditRatingAgency: '',
    accountsFiledDate: '',
    // Compliance
    amlRiskRating: 'LOW',
    sanctionsHit: false,
    sanctionsListRef: '',
    fatcaClassification: '',
    crsClassification: '',
    taxIdentificationNumber: '',
    vatNumber: '',
    leiCode: '',
    pepLinked: false,
    nextReviewDate: '',
  });

  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.entityName || !form.entityType || !form.legalForm || !form.registrationCountry) {
      addToast('error', 'Entity Name, Type, Legal Form and Registration Country are required');
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        entityName: form.entityName,
        entityType: form.entityType,
        legalForm: form.legalForm,
        registrationCountry: form.registrationCountry,
        entityStatus: form.entityStatus,
        kybStatus: form.kybStatus,
        createdBy: form.createdBy,
      };
      if (form.shortName) payload.shortName = form.shortName;
      if (form.registrationNumber) payload.registrationNumber = form.registrationNumber;
      if (form.registrationDate) payload.registrationDate = form.registrationDate;
      if (form.incorporationDate) payload.incorporationDate = form.incorporationDate;
      if (form.industryCode) payload.industryCode = form.industryCode;
      if (form.sicCode) payload.sicCode = form.sicCode;
      if (form.kybReviewDate) payload.kybReviewDate = form.kybReviewDate;
      if (form.onboardingBranch) payload.onboardingBranch = form.onboardingBranch;
      if (form.onboardingChannel) payload.onboardingChannel = form.onboardingChannel;
      if (form.relationshipManagerId) payload.relationshipManagerId = form.relationshipManagerId;
      if (form.parentEntityId) payload.parentEntityId = form.parentEntityId;
      if (form.ultimateParentId) payload.ultimateParentId = form.ultimateParentId;

      if (form.addressLine1) {
        payload.address = {
          addressType: form.addressType,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2 || undefined,
          addressLine3: form.addressLine3 || undefined,
          city: form.city || undefined,
          stateProvince: form.stateProvince || undefined,
          postalCode: form.postalCode || undefined,
          countryCode: form.addressCountryCode || form.registrationCountry,
          isPrimary: form.addressIsPrimary,
          createdBy: form.createdBy,
        };
      }

      if (form.annualTurnover || form.totalAssets) {
        payload.financials = {
          financialYear: form.financialYear,
          turnoverCurrency: form.turnoverCurrency,
          createdBy: form.createdBy,
          ...(form.annualTurnover && { annualTurnover: parseFloat(form.annualTurnover) }),
          ...(form.netWorth && { netWorth: parseFloat(form.netWorth) }),
          ...(form.totalAssets && { totalAssets: parseFloat(form.totalAssets) }),
          ...(form.totalLiabilities && { totalLiabilities: parseFloat(form.totalLiabilities) }),
          ...(form.employeeCount && { employeeCount: parseInt(form.employeeCount) }),
          ...(form.auditorName && { auditorName: form.auditorName }),
          ...(form.creditRating && { creditRating: form.creditRating }),
          ...(form.creditRatingAgency && { creditRatingAgency: form.creditRatingAgency }),
          ...(form.accountsFiledDate && { accountsFiledDate: form.accountsFiledDate }),
        };
      }

      payload.compliance = {
        amlRiskRating: form.amlRiskRating,
        sanctionsHit: form.sanctionsHit,
        pepLinked: form.pepLinked,
        createdBy: form.createdBy,
        ...(form.sanctionsListRef && { sanctionsListRef: form.sanctionsListRef }),
        ...(form.fatcaClassification && { fatcaClassification: form.fatcaClassification }),
        ...(form.crsClassification && { crsClassification: form.crsClassification }),
        ...(form.taxIdentificationNumber && { taxIdentificationNumber: form.taxIdentificationNumber }),
        ...(form.vatNumber && { vatNumber: form.vatNumber }),
        ...(form.leiCode && { leiCode: form.leiCode }),
        ...(form.nextReviewDate && { nextReviewDate: form.nextReviewDate }),
      };

      const res = await customerApi.post('/v1/entities', payload);
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
      <PageHeader title="Onboard Entity" subtitle="Register a new corporate or legal entity" />
      <div className="max-w-3xl">
        <form onSubmit={onSubmit}>

          {/* ── ENTITY DETAILS ── */}
          <Section title="Entity Details" open={secEntity} onToggle={() => setSecEntity(o => !o)}>
            <F label="Entity Name" required>
              <input value={form.entityName} onChange={e => set('entityName', e.target.value)} className="input-field" placeholder="Full legal entity name" />
            </F>
            <div className="grid grid-cols-2 gap-4">
              <F label="Entity Type" required>
                <select value={form.entityType} onChange={e => set('entityType', e.target.value)} className="input-field">
                  <option value="SOLE_TRADER">Sole Trader</option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="PRIVATE_LIMITED">Private Limited</option>
                  <option value="PUBLIC_LIMITED">Public Limited</option>
                  <option value="TRUST">Trust</option>
                  <option value="CHARITY">Charity</option>
                  <option value="GOVERNMENT">Government</option>
                  <option value="COOPERATIVE">Cooperative</option>
                </select>
              </F>
              <F label="Legal Form" required hint="e.g. LLC, PLC, LLP, GmbH">
                <input value={form.legalForm} onChange={e => set('legalForm', e.target.value)} className="input-field" placeholder="e.g. LLC, PLC" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Short Name">
                <input value={form.shortName} onChange={e => set('shortName', e.target.value)} className="input-field" placeholder="Trading / short name" />
              </F>
              <F label="Registration Country (ISO 3-char)" required>
                <input value={form.registrationCountry} onChange={e => set('registrationCountry', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. GBR, USA" maxLength={3} />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Registration Number">
                <input value={form.registrationNumber} onChange={e => set('registrationNumber', e.target.value)} className="input-field" placeholder="Company reg. number" />
              </F>
              <F label="Registration Date">
                <input type="date" value={form.registrationDate} onChange={e => set('registrationDate', e.target.value)} className="input-field" max={today} />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Incorporation Date">
                <input type="date" value={form.incorporationDate} onChange={e => set('incorporationDate', e.target.value)} className="input-field" max={today} />
              </F>
              <F label="Industry Code (SIC/NACE)">
                <input value={form.industryCode} onChange={e => set('industryCode', e.target.value)} className="input-field" placeholder="e.g. 6022" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="SIC Code">
                <input value={form.sicCode} onChange={e => set('sicCode', e.target.value)} className="input-field" placeholder="4-digit SIC" maxLength={10} />
              </F>
              <F label="Entity Status" required>
                <select value={form.entityStatus} onChange={e => set('entityStatus', e.target.value)} className="input-field">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="DISSOLVED">Dissolved</option>
                </select>
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="KYB Status" required>
                <select value={form.kybStatus} onChange={e => set('kybStatus', e.target.value)} className="input-field">
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="FAILED">Failed</option>
                </select>
              </F>
              <F label="KYB Review Date">
                <input type="date" value={form.kybReviewDate} onChange={e => set('kybReviewDate', e.target.value)} className="input-field" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Onboarding Channel">
                <select value={form.onboardingChannel} onChange={e => set('onboardingChannel', e.target.value)} className="input-field">
                  <option value="">— Select —</option>
                  <option value="BRANCH">Branch</option>
                  <option value="ONLINE">Online</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="AGENT">Agent</option>
                </select>
              </F>
              <F label="Onboarding Branch">
                <input value={form.onboardingBranch} onChange={e => set('onboardingBranch', e.target.value)} className="input-field" placeholder="e.g. BR001" />
              </F>
            </div>
            <F label="Relationship Manager ID">
              <input value={form.relationshipManagerId} onChange={e => set('relationshipManagerId', e.target.value)} className="input-field" placeholder="RM user UUID" />
            </F>
            <div className="grid grid-cols-2 gap-4">
              <F label="Parent Entity ID">
                <input value={form.parentEntityId} onChange={e => set('parentEntityId', e.target.value)} className="input-field" placeholder="UUID of parent entity" />
              </F>
              <F label="Ultimate Parent Entity ID">
                <input value={form.ultimateParentId} onChange={e => set('ultimateParentId', e.target.value)} className="input-field" placeholder="UUID of ultimate parent" />
              </F>
            </div>
          </Section>

          {/* ── REGISTERED ADDRESS ── */}
          <Section title="Registered Address (optional)" open={secAddress} onToggle={() => setSecAddress(o => !o)}>
            <div className="grid grid-cols-2 gap-4">
              <F label="Address Type" required>
                <select value={form.addressType} onChange={e => set('addressType', e.target.value)} className="input-field">
                  <option value="REGISTERED">Registered</option>
                  <option value="TRADING">Trading</option>
                  <option value="MAILING">Mailing</option>
                  <option value="BILLING">Billing</option>
                </select>
              </F>
              <F label="Country Code (ISO 3-char)" required>
                <input value={form.addressCountryCode} onChange={e => set('addressCountryCode', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. GBR" maxLength={3} />
              </F>
            </div>
            <F label="Address Line 1" required>
              <input value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)} className="input-field" placeholder="Street address" />
            </F>
            <F label="Address Line 2">
              <input value={form.addressLine2} onChange={e => set('addressLine2', e.target.value)} className="input-field" placeholder="Apt, Suite, Floor" />
            </F>
            <F label="Address Line 3">
              <input value={form.addressLine3} onChange={e => set('addressLine3', e.target.value)} className="input-field" placeholder="District, Area" />
            </F>
            <div className="grid grid-cols-3 gap-4">
              <F label="City" required>
                <input value={form.city} onChange={e => set('city', e.target.value)} className="input-field" placeholder="City" />
              </F>
              <F label="State / Province">
                <input value={form.stateProvince} onChange={e => set('stateProvince', e.target.value)} className="input-field" placeholder="State" />
              </F>
              <F label="Postal Code">
                <input value={form.postalCode} onChange={e => set('postalCode', e.target.value)} className="input-field" placeholder="Postcode" />
              </F>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.addressIsPrimary} onChange={e => set('addressIsPrimary', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
              <span className="text-[11px] text-[#5A6A7A]">Primary address</span>
            </label>
          </Section>

          {/* ── FINANCIAL INFORMATION ── */}
          <Section title="Financial Information (optional)" open={secFinancials} onToggle={() => setSecFinancials(o => !o)}>
            <div className="grid grid-cols-2 gap-4">
              <F label="Financial Year" required hint="Format: YYYY">
                <input value={form.financialYear} onChange={e => set('financialYear', e.target.value)} className="input-field" placeholder="2026" maxLength={4} />
              </F>
              <F label="Turnover Currency">
                <input value={form.turnoverCurrency} onChange={e => set('turnoverCurrency', e.target.value.toUpperCase())} className="input-field" placeholder="USD" maxLength={3} />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Annual Turnover">
                <input type="number" value={form.annualTurnover} onChange={e => set('annualTurnover', e.target.value)} className="input-field" placeholder="0.00" min="0" />
              </F>
              <F label="Net Worth">
                <input type="number" value={form.netWorth} onChange={e => set('netWorth', e.target.value)} className="input-field" placeholder="0.00" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Total Assets">
                <input type="number" value={form.totalAssets} onChange={e => set('totalAssets', e.target.value)} className="input-field" placeholder="0.00" min="0" />
              </F>
              <F label="Total Liabilities">
                <input type="number" value={form.totalLiabilities} onChange={e => set('totalLiabilities', e.target.value)} className="input-field" placeholder="0.00" min="0" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Employee Count">
                <input type="number" value={form.employeeCount} onChange={e => set('employeeCount', e.target.value)} className="input-field" placeholder="0" min="0" />
              </F>
              <F label="Accounts Filed Date">
                <input type="date" value={form.accountsFiledDate} onChange={e => set('accountsFiledDate', e.target.value)} className="input-field" />
              </F>
            </div>
            <F label="Auditor Name">
              <input value={form.auditorName} onChange={e => set('auditorName', e.target.value)} className="input-field" placeholder="e.g. Deloitte LLP" />
            </F>
            <div className="grid grid-cols-2 gap-4">
              <F label="Credit Rating">
                <input value={form.creditRating} onChange={e => set('creditRating', e.target.value)} className="input-field" placeholder="e.g. BBB+, A1" />
              </F>
              <F label="Credit Rating Agency">
                <input value={form.creditRatingAgency} onChange={e => set('creditRatingAgency', e.target.value)} className="input-field" placeholder="e.g. Moody's, S&P" />
              </F>
            </div>
          </Section>

          {/* ── COMPLIANCE ── */}
          <Section title="Compliance & Regulatory" open={secCompliance} onToggle={() => setSecCompliance(o => !o)}>
            <div className="grid grid-cols-2 gap-4">
              <F label="AML Risk Rating">
                <select value={form.amlRiskRating} onChange={e => set('amlRiskRating', e.target.value)} className="input-field">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="PROHIBITED">Prohibited</option>
                </select>
              </F>
              <F label="Next Review Date">
                <input type="date" value={form.nextReviewDate} onChange={e => set('nextReviewDate', e.target.value)} className="input-field" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.sanctionsHit} onChange={e => set('sanctionsHit', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                <span className="text-[11px] text-[#5A6A7A]">Sanctions Hit</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.pepLinked} onChange={e => set('pepLinked', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                <span className="text-[11px] text-[#5A6A7A]">PEP Linked</span>
              </label>
            </div>
            {form.sanctionsHit && (
              <F label="Sanctions List Reference">
                <input value={form.sanctionsListRef} onChange={e => set('sanctionsListRef', e.target.value)} className="input-field" placeholder="e.g. OFAC-SDN, UN-LIST" />
              </F>
            )}
            <div className="grid grid-cols-2 gap-4">
              <F label="FATCA Classification">
                <input value={form.fatcaClassification} onChange={e => set('fatcaClassification', e.target.value)} className="input-field" placeholder="e.g. ACTIVE_NFFE" />
              </F>
              <F label="CRS Classification">
                <input value={form.crsClassification} onChange={e => set('crsClassification', e.target.value)} className="input-field" placeholder="e.g. PASSIVE_NFE" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Tax Identification Number">
                <input value={form.taxIdentificationNumber} onChange={e => set('taxIdentificationNumber', e.target.value)} className="input-field" placeholder="TIN / EIN / UTR" />
              </F>
              <F label="VAT Number">
                <input value={form.vatNumber} onChange={e => set('vatNumber', e.target.value)} className="input-field" placeholder="VAT registration number" />
              </F>
            </div>
            <F label="LEI Code (20 chars)">
              <input value={form.leiCode} onChange={e => set('leiCode', e.target.value)} className="input-field" placeholder="Legal Entity Identifier" maxLength={20} />
            </F>
          </Section>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => navigate('/entities')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Onboarding...' : 'Onboard Entity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
