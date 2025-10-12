import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
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

  // Store media query and handler in refs to prevent duplicate listeners
  const mediaQueryRef = useRef<MediaQueryList | null>(null);
  const handlerRef = useRef<((e: MediaQueryListEvent) => void) | null>(null);

  // Apply theme to document
  useEffect(() => {
    const theme = preferences?.theme || 'light';
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    // Clean up any existing system theme listener before applying new theme
    if (mediaQueryRef.current && handlerRef.current) {
      mediaQueryRef.current.removeEventListener('change', handlerRef.current);
      mediaQueryRef.current = null;
      handlerRef.current = null;
    }

    if (theme === 'dark') {
      applyTheme(true);
    } else if (theme === 'light') {
      applyTheme(false);
    } else if (theme === 'system') {
      // Check system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      // Listen for system theme changes
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches);
      };
      
      mediaQueryRef.current = mediaQuery;
      handlerRef.current = handleChange;
      mediaQuery.addEventListener('change', handleChange);
    }

    // Cleanup on unmount or theme change
    return () => {
      if (mediaQueryRef.current && handlerRef.current) {
        mediaQueryRef.current.removeEventListener('change', handlerRef.current);
        mediaQueryRef.current = null;
        handlerRef.current = null;
      }
    };
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
