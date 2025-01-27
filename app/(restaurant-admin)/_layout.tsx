import { Tabs } from 'expo-router/tabs';
import { FontAwesome } from '@expo/vector-icons';
import { View } from 'react-native';
import Colors from '../../constants/Colors';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused?: boolean;
}) {
  return (
    <FontAwesome
      size={props.focused ? 32 : 28}
      style={{ marginBottom: -3 }}
      {...props}
    />
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1, paddingBottom: 65 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1C1C1E',
            borderTopColor: '#2C2C2E',
            height: 65,
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
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
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="home" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Manage Menu',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="cutlery" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="activities"
          options={{
            title: 'Activities',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="list" color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
