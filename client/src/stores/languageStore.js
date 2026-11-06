import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useLanguageStore = create(
  persist(
    (set, get) => ({
      language: 'en', // 'en' | 'hi'
      setLanguage: (lang) => {
        const target = lang === 'hi' ? 'hi' : 'en';
        set({ language: target });
        if (typeof document !== 'undefined') {
          document.documentElement.lang = target;
        }
      },
      toggleLanguage: () => {
        const nextLang = get().language === 'en' ? 'hi' : 'en';
        set({ language: nextLang });
        if (typeof document !== 'undefined') {
          document.documentElement.lang = nextLang;
        }
      },
    }),
    {
      name: 'civicax_lang',
    }
  )
);
