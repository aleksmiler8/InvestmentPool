import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ru from "./locales/ru.json";
import de from "./locales/de.json";
import uk from "./locales/uk.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import pl from "./locales/pl.json";
import tr from "./locales/tr.json";
import hu from "./locales/hu.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",

    resources: {
      en: { translation: en },
      ru: { translation: ru },
      de: { translation: de },
      uk: { translation: uk },
      es: { translation: es },
      fr: { translation: fr },
      it: { translation: it },
      pl: { translation: pl },
      tr: { translation: tr },
      hu: { translation: hu }
    },

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;