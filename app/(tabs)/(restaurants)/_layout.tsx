import { Stack } from 'expo-router';

export default function RestaurantsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="restaurants"
        options={{
          title: 'All Restaurants',
        }}
      />
      <Stack.Screen
        name="[id]/menu"
        options={{
          title: 'Menu',
        }}
      />
    </Stack>
  );
}
