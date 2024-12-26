import { useRouter, Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import Auth from '../components/Auth';

export default function Index() {
  const { session, loading } = useAuth();

  // Show loading indicator while checking auth state
  if (loading) {
    return <View />;
  }

  // If user is authenticated, redirect to dashboard
  if (session) {
    return <Redirect href="/dashboard" />;
  }

  // Show auth screen if not authenticated
  return <Auth />;
}
