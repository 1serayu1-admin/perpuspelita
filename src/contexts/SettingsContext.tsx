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
  const [resolvedSchoolId, setResolvedSchoolId] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    let schoolId = user?.schoolId || null;

    // For global_super_admin without a school, fetch the first school
    if (!schoolId && user?.appRole === 'global_super_admin') {
      const { data: firstSchool } = await (supabase as any)
        .from('schools')
        .select('id')
        .limit(1)
        .single();
      if (firstSchool) {
        schoolId = firstSchool.id;
      }
    }

    setResolvedSchoolId(schoolId);

    if (!schoolId) {
      setLoading(false);
      return;
    }

    const { data, error } = await (supabase as any)
      .from('schools')
      .select('name, logo_url, motto, vision, ip_access_mode, allowed_ips')
      .eq('id', schoolId)
      .single();

    if (!error && data) {
      setSettings(prev => ({
        ...prev,
        schoolName: data.name || prev.schoolName,
        logoUrl: data.logo_url || '',
        motto: data.motto || '',
        visi: data.vision || '',
        ipAccessMode: (data.ip_access_mode as IpAccessMode) || 'open',
        allowedIps: data.allowed_ips || [],
      }));
    }
    setLoading(false);
  }, [user?.schoolId, user?.appRole]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (partial: Partial<SchoolSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);

    const targetSchoolId = resolvedSchoolId;
    if (targetSchoolId) {
      await (supabase as any)
        .from('schools')
        .update({
          name: next.schoolName,
          logo_url: next.logoUrl || null,
          motto: next.motto || null,
          vision: next.visi || null,
          ip_access_mode: next.ipAccessMode,
          allowed_ips: next.allowedIps,
        })
        .eq('id', targetSchoolId);
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
