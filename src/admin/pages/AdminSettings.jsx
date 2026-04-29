import { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { fetchSettings, saveSettings } from '../../lib/settings';

const DEFAULTS = {
  announcement: 'Free delivery on orders above 1000 BDT | 100% Authentic Products',
  announcement_on: 'true',
  threshold: '1000',
  discount_amount: '0',
  phone: '09642922922',
  whatsapp: '8809642922922',
  email: 'support@ghorerbazar.com',
  address: 'Dhaka, Bangladesh',
  bkash_number: '01XXXXXXXXX',
  nagad_number: '01XXXXXXXXX',
};

function Section({ title, children }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings()
      .then(data => setSettings(s => ({ ...s, ...data })))
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setSettings(s => ({ ...s, [key]: value }));

  const save = async (section, keys) => {
    setSaving(section);
    setError('');
    try {
      await saveSettings(keys.map(k => ({ key: k, value: settings[k] })));
      setSaved(section);
      setTimeout(() => setSaved(''), 2500);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving('');
    }
  };

  const SaveBtn = ({ section, keys }) => (
    <div className="flex justify-end pt-2">
      <button
        onClick={() => save(section, keys)}
        disabled={saving === section}
        className="rounded-full bg-brand-orange px-5 py-2 text-xs font-semibold text-white hover:bg-orange-500 inline-flex items-center gap-1.5 disabled:opacity-60"
      >
        {saved === section
          ? <><CheckIcon className="h-3.5 w-3.5" /> Saved</>
          : saving === section ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Section title="Announcement Bar">
        <Field label="Announcement Text" hint="Displayed in the top bar on all pages">
          <input
            value={settings.announcement}
            onChange={e => set('announcement', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </Field>
        <div className="flex items-center gap-3">
          <button
            onClick={() => set('announcement_on', settings.announcement_on === 'true' ? 'false' : 'true')}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.announcement_on === 'true' ? 'bg-brand-orange' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.announcement_on === 'true' ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-xs text-gray-600">{settings.announcement_on === 'true' ? 'Visible' : 'Hidden'}</span>
        </div>
        <SaveBtn section="announcement" keys={['announcement', 'announcement_on']} />
      </Section>

      <Section title="Promotions">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Minimum Order for Discount (৳)" hint="Cart must reach this amount to apply discount">
            <input
              type="number"
              value={settings.threshold}
              onChange={e => set('threshold', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </Field>
          <Field label="Discount Amount (৳)" hint="Amount deducted when threshold is met (0 = disabled)">
            <input
              type="number"
              value={settings.discount_amount}
              onChange={e => set('discount_amount', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </Field>
        </div>
        <SaveBtn section="promotions" keys={['threshold', 'discount_amount']} />
      </Section>

      <Section title="Payment Numbers">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="bKash Merchant Number" hint="Number customers send payment to">
            <input
              value={settings.bkash_number}
              onChange={e => set('bkash_number', e.target.value)}
              placeholder="Phone number"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange font-mono"
            />
          </Field>
          <Field label="Nagad Merchant Number" hint="Number customers send payment to">
            <input
              value={settings.nagad_number}
              onChange={e => set('nagad_number', e.target.value)}
              placeholder="Phone number"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange font-mono"
            />
          </Field>
        </div>
        <SaveBtn section="payment" keys={['bkash_number', 'nagad_number']} />
      </Section>

      <Section title="Contact Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <input
              value={settings.phone}
              onChange={e => set('phone', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </Field>
          <Field label="WhatsApp Number" hint="Include country code (e.g. 8801XXXXXXXXX)">
            <input
              value={settings.whatsapp}
              onChange={e => set('whatsapp', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={settings.email}
              onChange={e => set('email', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </Field>
          <Field label="Address">
            <input
              value={settings.address}
              onChange={e => set('address', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </Field>
        </div>
        <SaveBtn section="contact" keys={['phone', 'whatsapp', 'email', 'address']} />
      </Section>

      <Section title="Admin Account">
        <p className="text-xs text-gray-500">
          To change admin credentials, go to{' '}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-orange hover:underline"
          >
            Supabase Dashboard → Authentication → Users
          </a>.
        </p>
      </Section>
    </div>
  );
}
