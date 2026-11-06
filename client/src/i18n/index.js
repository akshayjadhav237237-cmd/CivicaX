import { useCallback } from 'react';
import en from './en.json';
import hi from './hi.json';
import { useLanguageStore } from '../stores/languageStore';

export const translations = { en, hi };

/**
 * Resolves a dot-notated or direct path in a nested object.
 */
function resolvePath(obj, path) {
  if (!obj || !path) return undefined;
  
  // 1. Direct key match (e.g., 'CRITICAL // EVACUATE' or 'Rainfall')
  if (obj[path] !== undefined) {
    return obj[path];
  }

  // 2. Direct check in 'strings' bucket if present
  if (obj.strings && obj.strings[path] !== undefined) {
    return obj.strings[path];
  }

  // 3. Dot-separated path navigation (e.g. 'nav.dashboard', 'alerts.levels.critical')
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Interpolates variables in format {name} or {{name}} with params object.
 */
function interpolate(template, params) {
  if (typeof template !== 'string' || !params || typeof params !== 'object') {
    return template;
  }
  return template.replace(/\{\{?([a-zA-Z0-9_]+)\}?\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

/**
 * Core translation function with fallback to English and string interpolation.
 */
export function getTranslation(key, params, lang = 'en', fallbackDefault) {
  if (!key) return '';

  const activeDict = translations[lang] || translations.en;
  let translated = resolvePath(activeDict, key);

  // Fallback to English dictionary if missing in current language
  if (translated === undefined && lang !== 'en') {
    translated = resolvePath(translations.en, key);
  }

  // Fallback to provided default or original key
  if (translated === undefined) {
    translated = fallbackDefault !== undefined ? fallbackDefault : key;
  }

  return interpolate(translated, params);
}

/**
 * Standalone `t` function reading current state from Zustand store.
 */
export function t(key, params, fallback) {
  const lang = useLanguageStore.getState().language || 'en';
  return getTranslation(key, params, lang, fallback);
}

/**
 * React Hook for component translation with automatic reactivity.
 */
export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const toggleLanguage = useLanguageStore((state) => state.toggleLanguage);

  const t = useCallback(
    (key, params, fallback) => {
      return getTranslation(key, params, language, fallback);
    },
    [language]
  );

  return {
    t,
    language,
    setLanguage,
    toggleLanguage,
    isHindi: language === 'hi',
  };
}

export default useTranslation;
