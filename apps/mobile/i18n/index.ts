import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en';
import de from './locales/de';
import fr from './locales/fr';
import es from './locales/es';
import it from './locales/it';
import pt from './locales/pt';
import nl from './locales/nl';
import pl from './locales/pl';
import ru from './locales/ru';
import fi from './locales/fi';
import sv from './locales/sv';
import no from './locales/no';
import da from './locales/da';
import cs from './locales/cs';
import hu from './locales/hu';

const resources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  it: { translation: it },
  pt: { translation: pt },
  nl: { translation: nl },
  pl: { translation: pl },
  ru: { translation: ru },
  fi: { translation: fi },
  sv: { translation: sv },
  no: { translation: no },
  da: { translation: da },
  cs: { translation: cs },
  hu: { translation: hu },
};

// Initialize i18n synchronously before any components use it
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: Localization.getLocales()[0]?.languageCode || 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4', // Use v3 format for better compatibility
    });
}

export default i18n;
