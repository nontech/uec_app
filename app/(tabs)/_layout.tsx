import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { DrawerToggleButton } from '@react-navigation/drawer';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerLeft: () => <DrawerToggleButton />,
        tabBarActiveTintColor: '#f4511e',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(restaurants)"
        options={{
          title: 'Restaurants',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="restaurant" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
