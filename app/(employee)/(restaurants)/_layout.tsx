import { Stack } from 'expo-router';
import { DrawerToggleButton } from '@react-navigation/drawer';
import Colors from '../../../constants/Colors';
import { useTranslation } from 'react-i18next';

export default function RestaurantsLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: Colors.background.primary,
        },
        headerTintColor: Colors.text.primary,
        headerTitleStyle: {
          color: Colors.text.primary,
        },
        contentStyle: {
          backgroundColor: Colors.background.primary,
        },
      }}
    >
      <Stack.Screen
        name='index'
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='[id]/menu'
        options={{
          title: `${t('common.menu')}`,
          headerBackTitle: 'Restaurants',
        }}
      />
    </Stack>
  );
}
