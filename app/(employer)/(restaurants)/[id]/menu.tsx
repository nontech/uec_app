import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Database } from '../../../../supabase/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

const getDayInGerman = () => {
  const days = [
    'SONNTAG',
    'MONTAG',
    'DIENSTAG',
    'MITTWOCH',
    'DONNERSTAG',
    'FREITAG',
    'SAMSTAG',
  ];
  const today = new Date().getDay();
  return days[today];
};

const getCurrentDay = () => {
  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[new Date().getDay()];
};

export default function Menu() {
  const params = useLocalSearchParams();
  const restaurantId = params.id as string;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const currentDay = getCurrentDay();

  useEffect(() => {
    if (restaurantId) {
      fetchMenuItems();
    }
  }, [restaurantId]);

  async function fetchMenuItems() {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('day', currentDay)
        .order('category');

      if (error) throw error;
      if (data) {
        setMenuItems(data);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-600">Loading menu...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-4 pt-6 pb-4">
        <Text className="text-2xl text-center text-gray-700 font-medium">
          LUNCH SPECIAL
        </Text>
      </View>

      <View className="px-4 pb-4">
        <Text className="text-xl text-center text-gray-800">
          {getDayInGerman()}
        </Text>
        <View className="h-[1px] bg-gray-300 my-4" />
      </View>

      <View className="px-4">
        {menuItems.map((item) => (
          <View
            key={item.id}
            className="flex-row justify-between items-start mb-6 bg-[#FDF7FF] rounded-lg p-4"
          >
            <View className="flex-1 pr-4">
              <Text className="text-lg font-medium mb-1">{item.name}</Text>
              <Text className="text-gray-600 text-sm">{item.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
