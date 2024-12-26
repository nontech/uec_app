import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import Auth from '../components/Auth';
import { View } from 'react-native';

function RootLayoutNav() {
  const { session } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      {session ? <Stack screenOptions={{ headerShown: false }} /> : <Auth />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
