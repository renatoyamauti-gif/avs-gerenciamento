import React, { createContext, useContext, useState, ReactNode } from 'react';
import { pt } from '../locales/pt';
import { en } from '../locales/en';
import { es } from '../locales/es';

type LanguageType = 'pt' | 'en' | 'es';

const translations: Record<LanguageType, any> = { pt, en, es };

interface LanguageContextProps {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageType>(() => {
    const saved = localStorage.getItem('avs_language') as LanguageType;
    if (saved === 'pt' || saved === 'en' || saved === 'es') {
      return saved;
    }
    return 'pt';
  });

  const setLanguage = (lang: LanguageType) => {
    setLanguageState(lang);
    localStorage.setItem('avs_language', lang);
  };

  // Resolve dot notation keys, e.g., t('menu.dashboard')
  const t = (key: string): string => {
    const keys = key.split('.');
    let result = translations[language];

    for (const k of keys) {
      if (result && k in result) {
        result = result[k];
      } else {
        // Fallback to Portuguese translation if not found
        let fallback = translations['pt'];
        for (const fk of keys) {
          if (fallback && fk in fallback) {
            fallback = fallback[fk];
          } else {
            return key; // return the raw key as fallback
          }
        }
        return typeof fallback === 'string' ? fallback : key;
      }
    }

    return typeof result === 'string' ? result : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
