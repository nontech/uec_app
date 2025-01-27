import { Stack } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import { useEffect, useState } from 'react';
import { Platform, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

// Admin layout component that checks for web platform and super admin privileges
export default function SuperAdminLayout() {
  const { session, loading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    // Check for super admin privileges
    const checkSuperAdmin = async () => {
      if (!session?.user) {
        router.replace('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('type')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (data?.type !== 'super_admin') {
          router.replace('/');
          return;
        }

        setIsSuperAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.replace('/');
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (!loading) {
      checkSuperAdmin();
    }
  }, [session, loading]);

  // Show nothing while checking privileges
  if (loading || checkingAdmin || !isSuperAdmin) {
    return null;
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f4511e',
          },
          headerTintColor: '#fff',
        }}
      />
    </ScrollView>
  );
}
