import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit2, Save, X } from 'lucide-react';
import { cbsApi, DEFAULT_INSTITUTION_ID } from '../../lib/api';
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

const initForm = {
  institutionCode: '',
  institutionName: '',
  swiftBic: '',
  leiCode: '',
  regulatoryLicenceNo: '',
  regulatorName: '',
  countryCode: '',
  countryName: '',
  baseCurrency: 'USD',
  timezone: 'UTC',
  fiscalYearStart: '01-01',
  bankingSystemType: 'UNIVERSAL',
  multiCurrencyEnabled: true,
  multiBranchEnabled: true,
  logoUrl: '',
  supportEmail: '',
  supportPhone: '',
  websiteUrl: '',
  updatedBy: 'OPS-PORTAL',
};

type FormState = typeof initForm;

export default function InstitutionPage() {
  const { addToast } = useUIStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({ ...initForm });

  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['institution'],
    queryFn: () => cbsApi.get(`/v1/config/institution?institutionId=${DEFAULT_INSTITUTION_ID}`).then(r => r.data.data).catch(() => null),
  });

  useEffect(() => {
    if (data) {
      setForm({
        institutionCode: String(data.institutionCode ?? ''),
        institutionName: String(data.institutionName ?? ''),
        swiftBic: String(data.swiftBic ?? ''),
        leiCode: String(data.leiCode ?? ''),
        regulatoryLicenceNo: String(data.regulatoryLicenceNo ?? ''),
        regulatorName: String(data.regulatorName ?? ''),
        countryCode: String(data.countryCode ?? ''),
        countryName: String(data.countryName ?? ''),
        baseCurrency: String(data.baseCurrency ?? 'USD'),
        timezone: String(data.timezone ?? 'UTC'),
        fiscalYearStart: String(data.fiscalYearStart ?? '01-01'),
        bankingSystemType: String(data.bankingSystemType ?? 'UNIVERSAL'),
        multiCurrencyEnabled: Boolean(data.multiCurrencyEnabled ?? true),
        multiBranchEnabled: Boolean(data.multiBranchEnabled ?? true),
        logoUrl: String(data.logoUrl ?? ''),
        supportEmail: String(data.supportEmail ?? ''),
        supportPhone: String(data.supportPhone ?? ''),
        websiteUrl: String(data.websiteUrl ?? ''),
        updatedBy: 'OPS-PORTAL',
      });
    }
  }, [data]);

  const handleSave = async () => {
    if (!form.institutionCode || !form.institutionName || !form.countryCode || !form.baseCurrency) {
      addToast('error', 'Institution Code, Name, Country Code and Base Currency are required');
      return;
    }
    setSaving(true);
    try {
      await cbsApi.patch(`/v1/config/institution?institutionId=${DEFAULT_INSTITUTION_ID}`, {
        institutionCode: form.institutionCode,
        institutionName: form.institutionName,
        countryCode: form.countryCode.toUpperCase(),
        baseCurrency: form.baseCurrency.toUpperCase(),
        timezone: form.timezone,
        fiscalYearStart: form.fiscalYearStart,
        bankingSystemType: form.bankingSystemType,
        multiCurrencyEnabled: form.multiCurrencyEnabled,
        multiBranchEnabled: form.multiBranchEnabled,
        updatedBy: form.updatedBy,
        ...(form.swiftBic && { swiftBic: form.swiftBic.toUpperCase() }),
        ...(form.leiCode && { leiCode: form.leiCode }),
        ...(form.regulatoryLicenceNo && { regulatoryLicenceNo: form.regulatoryLicenceNo }),
        ...(form.regulatorName && { regulatorName: form.regulatorName }),
        ...(form.countryName && { countryName: form.countryName }),
        ...(form.logoUrl && { logoUrl: form.logoUrl }),
        ...(form.supportEmail && { supportEmail: form.supportEmail }),
        ...(form.supportPhone && { supportPhone: form.supportPhone }),
        ...(form.websiteUrl && { websiteUrl: form.websiteUrl }),
      });
      addToast('success', 'Institution settings updated');
      setEditing(false);
      refetch();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addToast('error', e.response?.data?.message ?? 'Failed to update institution settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (data) {
      setForm({
        institutionCode: String(data.institutionCode ?? ''),
        institutionName: String(data.institutionName ?? ''),
        swiftBic: String(data.swiftBic ?? ''),
        leiCode: String(data.leiCode ?? ''),
        regulatoryLicenceNo: String(data.regulatoryLicenceNo ?? ''),
        regulatorName: String(data.regulatorName ?? ''),
        countryCode: String(data.countryCode ?? ''),
        countryName: String(data.countryName ?? ''),
        baseCurrency: String(data.baseCurrency ?? 'USD'),
        timezone: String(data.timezone ?? 'UTC'),
        fiscalYearStart: String(data.fiscalYearStart ?? '01-01'),
        bankingSystemType: String(data.bankingSystemType ?? 'UNIVERSAL'),
        multiCurrencyEnabled: Boolean(data.multiCurrencyEnabled ?? true),
        multiBranchEnabled: Boolean(data.multiBranchEnabled ?? true),
        logoUrl: String(data.logoUrl ?? ''),
        supportEmail: String(data.supportEmail ?? ''),
        supportPhone: String(data.supportPhone ?? ''),
        websiteUrl: String(data.websiteUrl ?? ''),
        updatedBy: 'OPS-PORTAL',
      });
    }
    setEditing(false);
  };

  return (
    <div>
      <PageHeader
        title="Institution Settings"
        subtitle="Core institution configuration"
        actions={
          editing ? (
            <div className="flex gap-2">
              <button onClick={handleCancel} className="btn-secondary"><X size={13} /> Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary"><Save size={13} /> {saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-primary"><Edit2 size={13} /> Edit Settings</button>
          )
        }
      />

      {isLoading ? (
        <div className="card max-w-3xl animate-pulse h-96 bg-gray-100 rounded" />
      ) : (
        <div className="max-w-3xl space-y-4">

          {/* Core Identity */}
          <div className="card">
            <h4 className="text-[11px] font-bold text-[#1B3A5C] mb-3 uppercase tracking-wide">Core Identity</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="Institution Code" required>
                  <input value={form.institutionCode} onChange={e => set('institutionCode', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. INST-001" disabled={!editing} maxLength={20} />
                </F>
                <F label="Institution Name" required>
                  <input value={form.institutionName} onChange={e => set('institutionName', e.target.value)} className="input-field" placeholder="e.g. First National Bank" disabled={!editing} />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="SWIFT BIC" hint="8 or 11 character BIC code">
                  <input value={form.swiftBic} onChange={e => set('swiftBic', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. FNBKUS33" disabled={!editing} maxLength={11} />
                </F>
                <F label="LEI Code" hint="20-character Legal Entity Identifier">
                  <input value={form.leiCode} onChange={e => set('leiCode', e.target.value.toUpperCase())} className="input-field" placeholder="20-character LEI" disabled={!editing} maxLength={20} />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Banking System Type" required>
                  {editing ? (
                    <select value={form.bankingSystemType} onChange={e => set('bankingSystemType', e.target.value)} className="input-field">
                      <option value="RETAIL">Retail</option>
                      <option value="CORPORATE">Corporate</option>
                      <option value="UNIVERSAL">Universal</option>
                    </select>
                  ) : (
                    <input value={form.bankingSystemType} className="input-field" disabled />
                  )}
                </F>
                <F label="Fiscal Year Start" hint="MM-DD format e.g. 01-01 for January">
                  <input value={form.fiscalYearStart} onChange={e => set('fiscalYearStart', e.target.value)} className="input-field" placeholder="01-01" disabled={!editing} maxLength={5} />
                </F>
              </div>
            </div>
          </div>

          {/* Regulatory */}
          <div className="card">
            <h4 className="text-[11px] font-bold text-[#1B3A5C] mb-3 uppercase tracking-wide">Regulatory</h4>
            <div className="grid grid-cols-2 gap-4">
              <F label="Regulatory Licence No.">
                <input value={form.regulatoryLicenceNo} onChange={e => set('regulatoryLicenceNo', e.target.value)} className="input-field" placeholder="e.g. BL-2024-00123" disabled={!editing} />
              </F>
              <F label="Regulator Name">
                <input value={form.regulatorName} onChange={e => set('regulatorName', e.target.value)} className="input-field" placeholder="e.g. Financial Conduct Authority" disabled={!editing} />
              </F>
            </div>
          </div>

          {/* Geography & Currency */}
          <div className="card">
            <h4 className="text-[11px] font-bold text-[#1B3A5C] mb-3 uppercase tracking-wide">Geography & Currency</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="Country Code" required hint="ISO 3166-1 alpha-2 e.g. US, GB">
                  <input value={form.countryCode} onChange={e => set('countryCode', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. US" disabled={!editing} maxLength={2} />
                </F>
                <F label="Country Name">
                  <input value={form.countryName} onChange={e => set('countryName', e.target.value)} className="input-field" placeholder="e.g. United States" disabled={!editing} />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Base Currency" required hint="ISO 4217 3-letter currency code">
                  <input value={form.baseCurrency} onChange={e => set('baseCurrency', e.target.value.toUpperCase())} className="input-field" placeholder="e.g. USD" disabled={!editing} maxLength={3} />
                </F>
                <F label="Timezone" hint="IANA timezone e.g. America/New_York">
                  <input value={form.timezone} onChange={e => set('timezone', e.target.value)} className="input-field" placeholder="e.g. America/New_York" disabled={!editing} />
                </F>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.multiCurrencyEnabled} onChange={e => set('multiCurrencyEnabled', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" disabled={!editing} />
                  <span className="text-[11px] text-[#5A6A7A]">Multi-currency Enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.multiBranchEnabled} onChange={e => set('multiBranchEnabled', e.target.checked)} className="w-3.5 h-3.5 accent-[#1B3A5C]" disabled={!editing} />
                  <span className="text-[11px] text-[#5A6A7A]">Multi-branch Enabled</span>
                </label>
              </div>
            </div>
          </div>

          {/* Contact & Branding */}
          <div className="card">
            <h4 className="text-[11px] font-bold text-[#1B3A5C] mb-3 uppercase tracking-wide">Contact & Branding</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="Support Email">
                  <input type="email" value={form.supportEmail} onChange={e => set('supportEmail', e.target.value)} className="input-field" placeholder="support@bank.com" disabled={!editing} />
                </F>
                <F label="Support Phone">
                  <input value={form.supportPhone} onChange={e => set('supportPhone', e.target.value)} className="input-field" placeholder="e.g. +1-800-123-4567" disabled={!editing} />
                </F>
              </div>
              <F label="Website URL">
                <input type="url" value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} className="input-field" placeholder="https://www.bank.com" disabled={!editing} />
              </F>
              <F label="Logo URL" hint="URL to institution logo image">
                <input type="url" value={form.logoUrl} onChange={e => set('logoUrl', e.target.value)} className="input-field" placeholder="https://cdn.bank.com/logo.png" disabled={!editing} />
              </F>
            </div>
          </div>

          {!editing && !data && (
            <div className="card">
              <p className="text-xs text-[#8A9BAB]">Institution settings not loaded — check CBS Maintenance service (port 8080). Click <strong>Edit Settings</strong> to create initial configuration.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
