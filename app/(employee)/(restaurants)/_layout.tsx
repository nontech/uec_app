import { Stack } from 'expo-router';
import { DrawerToggleButton } from '@react-navigation/drawer';
import Colors from '../../../constants/Colors';

export default function RestaurantsLayout() {
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
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]/menu"
        options={{
          title: 'Menu',
          headerBackTitle: 'Restaurants',
        }}
      />
    </Stack>
  );
}
