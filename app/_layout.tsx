import { Drawer } from 'expo-router/drawer';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import Auth from '../components/Auth';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { PaperProvider } from 'react-native-paper';
import Colors from '../constants/Colors';
import '../global.css';

const AuthCheck = () => {
  const { session, loading } = useAuth();
  const [userType, setUserType] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    if (!loading && session?.user) {
      fetchUserType();
    } else if (!loading && !session) {
      setUserLoading(false);
    }
  }, [session, loading]);

  const fetchUserType = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('type, first_name')
        .eq('id', session?.user?.id)
        .single();

      if (error) throw error;
      setUserType(data?.type || null);
      setUserName(data?.first_name || null);
    } catch (error) {
      console.error('Error fetching user type:', error);
    } finally {
      setUserLoading(false);
    }
  };

  // Handle navigation after layout is mounted and user type is known
  useEffect(() => {
    if (!loading && !userLoading && session?.user && userType) {
      let route;
      if (userType === 'super_admin') {
        route = '/(super-admin)';
      } else if (userType === 'company_admin') {
        route = '/(employer)';
      } else if (userType === 'restaurant_admin') {
        route = '/(restaurant-admin)';
      } else {
        route = '/(employee)';
      }
      router.replace(route as any);
    }
  }, [loading, userLoading, userType, session?.user]);

  if (loading || userLoading) {
    return <View className="flex-1 items-center justify-center bg-[#1C1C1E]" />;
  }

  if (!session) {
    return <Auth />;
  }

  return <DrawerLayout userType={userType} userName={userName} />;
};

const CustomDrawerContent = ({
  userType,
  ...props
}: { userType: string | null } & any) => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      props.navigation.closeDrawer();
      await signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <DrawerContentScrollView {...props} className="bg-[#1C1C1E]">
      {userType === 'super_admin' && (
        <>
          <DrawerItem
            label="Restaurants"
            labelStyle={{ color: 'white' }}
            icon={({ size }) => (
              <MaterialIcons name="restaurant" size={size} color="white" />
            )}
            onPress={() => router.push('/(super-admin)/restaurants' as any)}
            style={{ backgroundColor: '#1C1C1E' }}
          />
          <DrawerItem
            label="Companies"
            labelStyle={{ color: 'white' }}
            icon={({ size }) => (
              <MaterialIcons name="business" size={size} color="white" />
            )}
            onPress={() => router.push('/(super-admin)/companies' as any)}
            style={{ backgroundColor: '#1C1C1E' }}
          />
          <DrawerItem
            label="Memberships"
            labelStyle={{ color: 'white' }}
            icon={({ size }) => (
              <MaterialIcons name="card-membership" size={size} color="white" />
            )}
            onPress={() => router.push('/(super-admin)/memberships' as any)}
            style={{ backgroundColor: '#1C1C1E' }}
          />
        </>
      )}
      <DrawerItem
        label="Sign Out"
        labelStyle={{ color: 'white' }}
        icon={({ size }) => (
          <MaterialIcons name="logout" size={size} color="white" />
        )}
        onPress={handleSignOut}
        style={{ backgroundColor: '#1C1C1E' }}
      />
    </DrawerContentScrollView>
  );
};

const DrawerLayout = ({
  userType,
  userName,
}: {
  userType: string | null;
  userName: string | null;
}) => {
  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        drawerType: 'front',
        drawerActiveTintColor: '#6B4EFF',
        headerStyle: {
          backgroundColor: '#1C1C1E',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          color: 'white',
        },
        drawerStyle: {
          backgroundColor: '#1C1C1E',
        },
      }}
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
          userType={userType}
          userName={userName}
        />
      )}
    >
      {userType === 'super_admin' ? (
        <Drawer.Screen
          name="(super-admin)"
          options={{
            headerTitle: 'Admin Panel',
            headerShown: true,
          }}
        />
      ) : userType === 'company_admin' ? (
        <Drawer.Screen
          name="(employer)"
          options={{
            headerTitle: `Bon Appetit! ${userName}` || 'Employer',
            headerShown: true,
          }}
        />
      ) : userType === 'restaurant_admin' ? (
        <Drawer.Screen
          name="(restaurant-admin)"
          options={{
            headerTitle: `Restaurant Admin`,
            headerShown: true,
          }}
        />
      ) : (
        <Drawer.Screen
          name="(employee)"
          options={{
            headerTitle: `Bon Appetit! ${userName}` || 'Employee',
            headerShown: true,
          }}
        />
      )}
    </Drawer>
  );
};

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <AuthCheck />
      </AuthProvider>
    </PaperProvider>
  );
}
