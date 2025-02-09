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
import { useTranslation } from 'react-i18next';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export default function Menu() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const restaurantId = params.id as string;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const currentDay = getCurrentDay();

  const getTranslatedDay = () => {
    return t(`days.${currentDay}`);
  };

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
      <View className='flex-1 items-center justify-center bg-white'>
        <Text className='text-gray-500 text-base'>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView className='flex-1 bg-white'>
      <View className='px-4 pt-6 pb-4'>
        <Text className='text-2xl text-center text-gray-900 font-semibold'>
          {t('menu.lunchSpecial')}
        </Text>
      </View>

      <View className='px-4 pb-4'>
        <Text className='text-xl text-center text-gray-900 mb-4'>
          {getTranslatedDay()}
        </Text>
        <View className='h-[1px] bg-gray-200' />
      </View>

      <View className='px-4'>
        {menuItems.map((item) => (
          <View
            key={item.id}
            className='mb-4 bg-white rounded-xl p-4 shadow-sm border border-gray-200'
          >
            <View className='flex-1 pr-4'>
              <Text className='text-lg font-medium text-gray-900 mb-1'>
                {item.name}
              </Text>
              <Text className='text-sm text-gray-600'>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
