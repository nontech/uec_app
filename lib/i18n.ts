import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../translations/en.json';
import de from '../translations/de.json';

const LANGUAGE_KEY = '@app_language';

const initI18n = async () => {
  // Try to load saved language
  let savedLanguage = 'en';
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored) savedLanguage = stored;
  } catch (error) {
    console.error('Error loading language:', error);
  }

  await i18n
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
      resources: {
        en: {
          translation: en,
        },
        de: {
          translation: de,
        },
      },
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
    });

  i18n.on('languageChanged', (lng) => {
    AsyncStorage.setItem(LANGUAGE_KEY, lng).catch((error) => {
      console.error('Error saving language:', error);
    });
  });

  return i18n;
};

export { initI18n };
export default i18n;
