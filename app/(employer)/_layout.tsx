import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { View } from 'react-native';
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
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1C1C1E',
            borderTopColor: '#2C2C2E',
            height: 65,
            paddingVertical: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginBottom: 4,
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#999999',
        }}
      >
        <Tabs.Screen
          name='index'
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name='dashboard' color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name='manage_employees'
          options={{
            title: 'Employees',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name='people' color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name='(restaurants)'
          options={{
            title: 'Restaurants',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name='restaurant' color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
