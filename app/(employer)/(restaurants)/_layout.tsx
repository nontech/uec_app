import { Stack } from 'expo-router';
import Colors from '../../../constants/Colors';

export default function RestaurantsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: Colors.background.secondary,
        },
        headerTintColor: Colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
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
