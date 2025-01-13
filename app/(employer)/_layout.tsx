import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  focused?: boolean;
}) {
  return (
    <MaterialIcons
      size={props.focused ? 32 : 28}
      style={{ marginBottom: -3 }}
      {...props}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background.primary,
          borderTopColor: Colors.border.primary,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarActiveTintColor: Colors.text.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="dashboard" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="manage_employees"
        options={{
          title: 'Employees',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="people" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="(restaurants)"
        options={{
          title: 'Restaurants',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="restaurant" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
