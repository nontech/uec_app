import { Drawer } from 'expo-router/drawer';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import Auth from '../components/Auth';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import React from 'react';
import signOut from './sign-out';

const AuthCheck = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      />
    );
  }

  if (!session) {
    return <Auth />;
  }

  return <DrawerLayout />;
};

const CustomDrawerContent = (props: any) => {
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
    <DrawerContentScrollView {...props}>
      <DrawerItem
        label="Sign Out"
        icon={({ size, color }) => (
          <MaterialIcons name="logout" size={size} color={color} />
        )}
        onPress={handleSignOut}
      />
    </DrawerContentScrollView>
  );
};

const DrawerLayout = () => {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerActiveTintColor: '#f4511e',
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    ></Drawer>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthCheck />
    </AuthProvider>
  );
}
