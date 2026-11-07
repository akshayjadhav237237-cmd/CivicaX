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
 * Core translation function with fallback to English, string interpolation, and guaranteed zero-throw safety.
 * Missing key returns the key text (or fallback if provided). Never throws.
 */
export function getTranslation(key, params, lang = 'en', fallbackDefault) {
  try {
    if (key === null || key === undefined) return '';
    const keyStr = typeof key === 'string' ? key : String(key);

    const activeDict = (translations && translations[lang]) || (translations && translations.en) || {};
    let translated = resolvePath(activeDict, keyStr);

    // Fallback to English dictionary if missing in current language
    if (translated === undefined && lang !== 'en' && translations && translations.en) {
      translated = resolvePath(translations.en, keyStr);
    }

    // Fallback to provided default or original key
    if (translated === undefined || translated === null) {
      translated = fallbackDefault !== undefined && fallbackDefault !== null ? fallbackDefault : keyStr;
    }

    const result = interpolate(translated, params);
    return result !== undefined && result !== null ? result : keyStr;
  } catch (err) {
    console.warn(`[i18n] Error resolving key: ${key}`, err);
    return fallbackDefault !== undefined && fallbackDefault !== null 
      ? fallbackDefault 
      : (typeof key === 'string' ? key : (key ? String(key) : ''));
  }
}

/**
 * Standalone `t` function reading current state from Zustand store. Never throws.
 */
export function t(key, params, fallback) {
  try {
    const lang = (useLanguageStore && useLanguageStore.getState && useLanguageStore.getState().language) || 'en';
    return getTranslation(key, params, lang, fallback);
  } catch (err) {
    console.warn(`[i18n] Standalone t() error:`, err);
    return fallback !== undefined && fallback !== null ? fallback : (typeof key === 'string' ? key : (key ? String(key) : ''));
  }
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
