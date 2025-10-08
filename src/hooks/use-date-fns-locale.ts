import type { Locale } from "date-fns/locale";
import * as locales from "date-fns/locale";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const localeCast = locales as Record<string, Locale | undefined>;

export function useDateFnsLocale(): Locale {
  const { i18n } = useTranslation();
  return useMemo(() => {
    const language = i18n.resolvedLanguage ?? i18n.language ?? "en-US";
    const langPart = language.substring(0, 2);

    return localeCast[language] ?? localeCast[langPart] ?? locales.enUS;
  }, [i18n.resolvedLanguage, i18n.language]);
}
