import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('common.language')}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: i18n.language === 'en' ? '#f4511e' : '#ddd' },
          ]}
          onPress={() => handleLanguageChange('en')}
        >
          <Text
            style={{
              color: i18n.language === 'en' ? 'white' : 'black',
            }}
          >
            {t('common.english')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: i18n.language === 'de' ? '#f4511e' : '#ddd' },
          ]}
          onPress={() => handleLanguageChange('de')}
        >
          <Text
            style={{
              color: i18n.language === 'de' ? 'white' : 'black',
            }}
          >
            {t('common.german')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  label: {
    marginLeft: 10,
    marginBottom: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    padding: 8,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
});
