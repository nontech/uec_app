import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: t('common.dashboard'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name='dashboard' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='(restaurants)'
        options={{
          title: t('common.restaurants'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name='restaurant' size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
