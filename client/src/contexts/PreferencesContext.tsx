import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  dashboardLayout?: 'grid' | 'list';
  compactView?: boolean;
  enableSounds?: boolean;
  enableNotifications?: boolean;
  timezone?: string;
  language?: 'en' | 'ar';
  currency?: string;
  dateFormat?: string;
  itemsPerPage?: number;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ['/api/user/preferences'],
  });

  // Apply theme to document
  useEffect(() => {
    const theme = preferences?.theme || 'light';
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else if (theme === 'system') {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [preferences?.theme]);

  const value = {
    preferences: preferences || {},
    isLoading,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
