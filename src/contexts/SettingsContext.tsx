import { createContext, useContext, useState, ReactNode } from 'react';

export type IpAccessMode = 'open' | 'restricted';

export interface SchoolSettings {
  schoolName: string;
  appName: string;
  logoUrl: string;
  motto: string;
  visi: string;
  ipAccessMode: IpAccessMode;
  allowedIps: string[];
}

interface SettingsContextType {
  settings: SchoolSettings;
  updateSettings: (s: Partial<SchoolSettings>) => void;
}

const defaultSettings: SchoolSettings = {
  schoolName: 'SMA Negeri 1',
  appName: 'Perpustakaan',
  logoUrl: '',
  motto: 'Cerdas, Berkarakter, dan Berprestasi',
  visi: 'Mewujudkan generasi unggul yang berilmu, beriman, dan berdaya saing global melalui pendidikan berkualitas.',
  ipAccessMode: 'open',
  allowedIps: [],
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    const saved = localStorage.getItem('school_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  });

  const updateSettings = (partial: Partial<SchoolSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem('school_settings', JSON.stringify(next));
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
