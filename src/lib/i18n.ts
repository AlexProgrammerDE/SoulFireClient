import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(
    resourcesToBackend(
      (lng: string, ns: string) => import(`../../locales/${lng}/${ns}.json`),
    ),
  )
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: true,

    supportedLngs: APP_LOCALES.split(','),
    nonExplicitSupportedLngs: true,
    returnEmptyString: false,
    returnNull: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export default i18n;
