import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { z } from 'zod';

import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { en } from 'zod/v4/locales';
import { $ZodErrorMap } from 'zod/v4/core';

async function loadZodLocale(locale: string) {
  const moduleExport = (await import(
    `../../node_modules/zod/v4/locales/${locale}.js`
  )) as {
    default: () => {
      localeError: $ZodErrorMap;
    };
  };

  return moduleExport.default;
}

async function tryApplyZodLocale(locale: string) {
  const splitLocale = locale.split('-');
  const langCode = splitLocale[0];

  try {
    z.config((await loadZodLocale(locale))());
    console.log(`Zod locale set to: ${locale}`);
    return;
  } catch {
    // If the specific locale is not found, try the language code only
  }

  try {
    z.config((await loadZodLocale(langCode))());
    console.log(`Zod locale set to: ${langCode}`);
    return;
  } catch {
    // If the language code is also not found, fall back to English
  }

  z.config(en());
}

void i18n
  .use(
    resourcesToBackend((lng: string, ns: string) => {
      return import(`../../locales/${lng}/${ns}.json`);
    }),
  )
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    defaultNS: 'common',
    fallbackLng: 'en-US',
    debug: true,

    load: 'currentOnly',
    supportedLngs: APP_LOCALES.split(','),
    ns: APP_NAMESPACES.split(','),
    lowerCaseLng: false,
    nonExplicitSupportedLngs: false,
    returnEmptyString: false,
    returnNull: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  void tryApplyZodLocale(lng);
});

export default i18n;
