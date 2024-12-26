import { View, Text } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Redirect } from 'expo-router';
import { Button } from '@rneui/themed';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { session, loading } = useAuth();

  if (loading) {
    return <View />;
  }

  // Protect this route - redirect to home if not authenticated
  if (!session) {
    return <Redirect href="/" />;
  }

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 16, marginBottom: 20 }}>
        Logged in as: {session.user.email}
      </Text>
      <Button title="Sign Out" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}
