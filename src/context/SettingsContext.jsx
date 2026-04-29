import { createContext, useContext, useState, useEffect } from 'react';
import { fetchSettings } from '../lib/settings';

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

const SettingsContext = createContext(DEFAULTS);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    fetchSettings()
      .then(data => setSettings(s => ({ ...s, ...data })))
      .catch((err) => { console.error('[Settings] Failed to load site settings, using defaults.', err); });
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
