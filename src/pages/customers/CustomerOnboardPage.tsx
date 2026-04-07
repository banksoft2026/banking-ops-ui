import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { customerApi } from '../../lib/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { useUIStore } from '../../store/uiStore';

const F = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
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

export default function CustomerOnboardPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [secPersonal, setSecPersonal] = useState(true);
  const [secContact, setSecContact] = useState(false);
  const [secDoc, setSecDoc] = useState(false);

  const [form, setForm] = useState({
    // Core
    customerType: 'INDIVIDUAL',
    createdBy: 'OPS-PORTAL',
    // Personal
    title: '',
    firstName: '',
    lastName: '',
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    countryOfBirth: '',
    occupation: '',
    employerName: '',
    customerSegment: 'RETAIL',
    customerStatus: 'ACTIVE',
    kycStatus: 'PENDING',
    kycReviewDate: '',
    onboardingChannel: '',
    onboardingBranch: '',
    relationshipManagerId: '',
    relationshipSince: '',
    // Contact
    contactType: 'RESIDENTIAL',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    contactCountryCode: '',
    phonePrimary: '',
    phoneSecondary: '',
    mobile: '',
    emailPrimary: '',
    emailSecondary: '',
    contactIsPrimary: true,
    // Document
    docType: 'PASSPORT',
    docNumber: '',
    issuingCountry: '',
    issuingAuthority: '',
    issueDate: '',
    expiryDate: '',
    docStatus: 'ACTIVE',
    isMandatory: false,
  });

  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName && !form.fullName) {
      addToast('error', 'First Name (or Full Name for Corporate) is required');
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        customerType: form.customerType,
        createdBy: form.createdBy,
        customerSegment: form.customerSegment,
        customerStatus: form.customerStatus,
        kycStatus: form.kycStatus,
      };
      if (form.title) payload.title = form.title;
      if (form.firstName) payload.firstName = form.firstName;
      if (form.lastName) payload.lastName = form.lastName;
      if (form.fullName) payload.fullName = form.fullName;
      else if (form.firstName) payload.fullName = `${form.title ? form.title + ' ' : ''}${form.firstName} ${form.lastName}`.trim();
      if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
      if (form.nationality) payload.nationality = form.nationality;
      if (form.countryOfBirth) payload.countryOfBirth = form.countryOfBirth;
      if (form.occupation) payload.occupation = form.occupation;
      if (form.employerName) payload.employerName = form.employerName;
      if (form.kycReviewDate) payload.kycReviewDate = form.kycReviewDate;
      if (form.onboardingChannel) payload.onboardingChannel = form.onboardingChannel;
      if (form.onboardingBranch) payload.onboardingBranch = form.onboardingBranch;
      if (form.relationshipManagerId) payload.relationshipManagerId = form.relationshipManagerId;
      if (form.relationshipSince) payload.relationshipSince = form.relationshipSince;

      if (form.addressLine1) {
        payload.contact = {
          contactType: form.contactType,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2 || undefined,
          city: form.city || undefined,
          stateProvince: form.stateProvince || undefined,
          postalCode: form.postalCode || undefined,
          countryCode: form.contactCountryCode || undefined,
          phonePrimary: form.phonePrimary || undefined,
          phoneSecondary: form.phoneSecondary || undefined,
          mobile: form.mobile || undefined,
          emailPrimary: form.emailPrimary || undefined,
          emailSecondary: form.emailSecondary || undefined,
          isPrimary: form.contactIsPrimary,
          createdBy: form.createdBy,
        };
      }
      if (form.docNumber) {
        payload.document = {
          docType: form.docType,
          docNumber: form.docNumber,
          issuingCountry: form.issuingCountry || undefined,
          issuingAuthority: form.issuingAuthority || undefined,
          issueDate: form.issueDate || undefined,
          expiryDate: form.expiryDate || undefined,
          docStatus: form.docStatus,
          isMandatory: form.isMandatory,
          createdBy: form.createdBy,
        };
      }

      const res = await customerApi.post('/v1/customers', payload);
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
      <div className="max-w-3xl">
        <form onSubmit={onSubmit}>

          {/* ── PERSONAL DETAILS ── */}
          <Section title="Personal Details" open={secPersonal} onToggle={() => setSecPersonal(o => !o)}>
            <div className="grid grid-cols-2 gap-4">
              <F label="Customer Type" required>
                <select value={form.customerType} onChange={e => set('customerType', e.target.value)} className="input-field">
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="CORPORATE">Corporate</option>
                </select>
              </F>
              <F label="Customer Segment" required>
                <select value={form.customerSegment} onChange={e => set('customerSegment', e.target.value)} className="input-field">
                  <option value="RETAIL">Retail</option>
                  <option value="SME">SME</option>
                  <option value="CORPORATE">Corporate</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </F>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <F label="Title">
                <select value={form.title} onChange={e => set('title', e.target.value)} className="input-field">
                  <option value="">— None —</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                  <option value="Prof">Prof</option>
                </select>
              </F>
              <F label="First Name">
                <input value={form.firstName} onChange={e => set('firstName', e.target.value)} className="input-field" placeholder="First name" />
              </F>
              <F label="Last Name">
                <input value={form.lastName} onChange={e => set('lastName', e.target.value)} className="input-field" placeholder="Last name" />
              </F>
            </div>
            <F label="Full Name (Corporate / override)">
              <input value={form.fullName} onChange={e => set('fullName', e.target.value)} className="input-field" placeholder="Auto-composed if blank" />
            </F>
            <div className="grid grid-cols-2 gap-4">
              <F label="Date of Birth">
                <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className="input-field" />
              </F>
              <F label="Nationality (ISO 3-char)">
                <input value={form.nationality} onChange={e => set('nationality', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. GBR, USA" maxLength={3} />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Country of Birth (ISO 3-char)">
                <input value={form.countryOfBirth} onChange={e => set('countryOfBirth', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. GBR" maxLength={3} />
              </F>
              <F label="Occupation">
                <input value={form.occupation} onChange={e => set('occupation', e.target.value)} className="input-field" placeholder="e.g. Engineer" />
              </F>
            </div>
            <F label="Employer Name">
              <input value={form.employerName} onChange={e => set('employerName', e.target.value)} className="input-field" placeholder="Current employer" />
            </F>
            <div className="grid grid-cols-2 gap-4">
              <F label="Customer Status" required>
                <select value={form.customerStatus} onChange={e => set('customerStatus', e.target.value)} className="input-field">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </F>
              <F label="KYC Status" required>
                <select value={form.kycStatus} onChange={e => set('kycStatus', e.target.value)} className="input-field">
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="FAILED">Failed</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="KYC Review Date">
                <input type="date" value={form.kycReviewDate} onChange={e => set('kycReviewDate', e.target.value)} className="input-field" />
              </F>
              <F label="Relationship Since">
                <input type="date" value={form.relationshipSince} onChange={e => set('relationshipSince', e.target.value)} className="input-field" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Onboarding Channel">
                <select value={form.onboardingChannel} onChange={e => set('onboardingChannel', e.target.value)} className="input-field">
                  <option value="">— Select —</option>
                  <option value="BRANCH">Branch</option>
                  <option value="ONLINE">Online</option>
                  <option value="MOBILE">Mobile</option>
                  <option value="AGENT">Agent</option>
                  <option value="REFERRAL">Referral</option>
                </select>
              </F>
              <F label="Onboarding Branch">
                <input value={form.onboardingBranch} onChange={e => set('onboardingBranch', e.target.value)} className="input-field" placeholder="e.g. BR001" />
              </F>
            </div>
            <F label="Relationship Manager ID">
              <input value={form.relationshipManagerId} onChange={e => set('relationshipManagerId', e.target.value)} className="input-field" placeholder="RM user UUID" />
            </F>
          </Section>

          {/* ── CONTACT DETAILS ── */}
          <Section title="Contact Details (optional)" open={secContact} onToggle={() => setSecContact(o => !o)}>
            <div className="grid grid-cols-2 gap-4">
              <F label="Contact Type" required>
                <select value={form.contactType} onChange={e => set('contactType', e.target.value)} className="input-field">
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="MAILING">Mailing</option>
                  <option value="OFFICE">Office</option>
                  <option value="OTHER">Other</option>
                </select>
              </F>
              <F label="Country Code (ISO 3-char)" required>
                <input value={form.contactCountryCode} onChange={e => set('contactCountryCode', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. GBR" maxLength={3} />
              </F>
            </div>
            <F label="Address Line 1">
              <input value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)} className="input-field" placeholder="Street address" />
            </F>
            <F label="Address Line 2">
              <input value={form.addressLine2} onChange={e => set('addressLine2', e.target.value)} className="input-field" placeholder="Apt, Suite, Unit" />
            </F>
            <div className="grid grid-cols-3 gap-4">
              <F label="City">
                <input value={form.city} onChange={e => set('city', e.target.value)} className="input-field" placeholder="City" />
              </F>
              <F label="State / Province">
                <input value={form.stateProvince} onChange={e => set('stateProvince', e.target.value)} className="input-field" placeholder="State" />
              </F>
              <F label="Postal Code">
                <input value={form.postalCode} onChange={e => set('postalCode', e.target.value)} className="input-field" placeholder="Postcode" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Primary Phone">
                <input value={form.phonePrimary} onChange={e => set('phonePrimary', e.target.value)} className="input-field" placeholder="+44 20 1234 5678" />
              </F>
              <F label="Secondary Phone">
                <input value={form.phoneSecondary} onChange={e => set('phoneSecondary', e.target.value)} className="input-field" placeholder="+44 7700 000000" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Mobile">
                <input value={form.mobile} onChange={e => set('mobile', e.target.value)} className="input-field" placeholder="+44 7700 000000" />
              </F>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.contactIsPrimary} onChange={e => set('contactIsPrimary', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                  <span className="text-[11px] text-[#5A6A7A]">Primary contact</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Primary Email">
                <input type="email" value={form.emailPrimary} onChange={e => set('emailPrimary', e.target.value)} className="input-field" placeholder="name@example.com" />
              </F>
              <F label="Secondary Email">
                <input type="email" value={form.emailSecondary} onChange={e => set('emailSecondary', e.target.value)} className="input-field" placeholder="alt@example.com" />
              </F>
            </div>
          </Section>

          {/* ── IDENTITY DOCUMENT ── */}
          <Section title="Identity Document (optional)" open={secDoc} onToggle={() => setSecDoc(o => !o)}>
            <div className="grid grid-cols-2 gap-4">
              <F label="Document Type" required>
                <select value={form.docType} onChange={e => set('docType', e.target.value)} className="input-field">
                  <option value="PASSPORT">Passport</option>
                  <option value="NATIONAL_ID">National ID</option>
                  <option value="DRIVING_LICENCE">Driving Licence</option>
                  <option value="BIRTH_CERT">Birth Certificate</option>
                  <option value="UTILITY_BILL">Utility Bill</option>
                  <option value="RESIDENCE_PERMIT">Residence Permit</option>
                </select>
              </F>
              <F label="Document Number">
                <input value={form.docNumber} onChange={e => set('docNumber', e.target.value)} className="input-field" placeholder="Document reference number" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Issuing Country (ISO 3-char)">
                <input value={form.issuingCountry} onChange={e => set('issuingCountry', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. GBR" maxLength={3} />
              </F>
              <F label="Issuing Authority">
                <input value={form.issuingAuthority} onChange={e => set('issuingAuthority', e.target.value)} className="input-field" placeholder="e.g. DVLA, Passport Office" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Issue Date">
                <input type="date" value={form.issueDate} onChange={e => set('issueDate', e.target.value)} className="input-field" />
              </F>
              <F label="Expiry Date">
                <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} className="input-field" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Document Status">
                <select value={form.docStatus} onChange={e => set('docStatus', e.target.value)} className="input-field">
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </F>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isMandatory} onChange={e => set('isMandatory', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" />
                  <span className="text-[11px] text-[#5A6A7A]">Mandatory document</span>
                </label>
              </div>
            </div>
          </Section>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => navigate('/customers')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Onboarding...' : 'Onboard Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
