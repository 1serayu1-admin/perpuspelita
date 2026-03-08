import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  updateSettings: (s: Partial<SchoolSettings>) => Promise<void>;
  loading: boolean;
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
  const { user } = useAuth();
  const [settings, setSettings] = useState<SchoolSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    const { data, error } = await (supabase as any)
      .from('schools')
      .select('name, logo_url, motto, vision, ip_access_mode, allowed_ips')
      .eq('id', user.schoolId)
      .single();

    if (!error && data) {
      setSettings(prev => ({
        ...prev,
        schoolName: data.name || prev.schoolName,
        logoUrl: data.logo_url || '',
        motto: data.motto || '',
        visi: data.vision || '',
      }));
    }
    setLoading(false);
  }, [user?.schoolId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (partial: Partial<SchoolSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);

    if (user?.schoolId) {
      await (supabase as any)
        .from('schools')
        .update({
          name: next.schoolName,
          logo_url: next.logoUrl || null,
          motto: next.motto || null,
          vision: next.visi || null,
        })
        .eq('id', user.schoolId);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
