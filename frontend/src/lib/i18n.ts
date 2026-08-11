import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Simple resources for EN/DE
const resources = {
  en: {
    translation: {
      "System Online": "SYSTEM ONLINE",
      "Live Feed": "LIVE FEED",
      "Global Search": "Global Search (Coordinates, Entities, Keywords)...",
      "Global Sentiment": "GLOBAL SENTIMENT",
      "Market Correlation": "MARKET CORRELATION",
      "Topography": "Topography",
      "Heatmap": "Heatmap",
      "Negative": "Negative",
      "Positive": "Positive"
    }
  },
  de: {
    translation: {
      "System Online": "SYSTEM ONLINE",
      "Live Feed": "LIVE FEED (EREIGNISSE)",
      "Global Search": "Globale Suche (Koordinaten, Entitäten, Suchbegriffe)...",
      "Global Sentiment": "GLOBALE STIMMUNG",
      "Market Correlation": "MARKTKORRELATION",
      "Topography": "Topographie",
      "Heatmap": "Heatmap",
      "Negative": "Negativ",
      "Positive": "Positiv"
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: typeof window !== 'undefined' ? localStorage.getItem('language') || 'en' : 'en',
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
