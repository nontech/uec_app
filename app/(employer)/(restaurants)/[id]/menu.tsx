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
import Colors from '../../../../constants/Colors';

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
        .contains('days', [currentDay])
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
      <View className="flex-1 items-center justify-center bg-[#1C1C1E]">
        <Text className="text-[#999999] text-base">Loading menu...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#1C1C1E]">
      <View className="px-4 pt-6 pb-4">
        <Text className="text-2xl text-center text-white font-semibold">
          LUNCH SPECIAL
        </Text>
      </View>

      <View className="px-4 pb-4">
        <Text className="text-xl text-center text-white mb-4">
          {getDayInGerman()}
        </Text>
        <View className="h-[1px] bg-[#2C2C2E]" />
      </View>

      <View className="px-4">
        {menuItems.map((item) => (
          <View
            key={item.id}
            className="mb-4 bg-[#2C2C2E] rounded-xl p-4 shadow-sm"
          >
            <View className="flex-1 pr-4">
              <Text className="text-lg font-medium text-white mb-1">
                {item.name}
              </Text>
              <Text className="text-sm text-[#999999]">{item.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
