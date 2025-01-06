import { Stack } from 'expo-router';

export default function CompanyLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="allowedRestaurants"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
