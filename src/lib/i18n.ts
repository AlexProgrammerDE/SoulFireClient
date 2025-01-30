import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import z from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

void i18n
  .use(
    resourcesToBackend((lng: string, ns: string) => {
      if (ns === 'zod') {
        return import(`zod-i18n-map/locales/${lng}/${ns}.json`);
      } else {
        return import(`../../locales/${lng}/${ns}.json`);
      }
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

z.setErrorMap(zodI18nMap);

export default i18n;
