import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Tables } from '../../supabase/types';
import Colors from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

type Restaurant = Tables<'restaurants'> & {
  opening_hours_range: Tables<'hours_range'> | null;
  lunch_hours_range: Tables<'hours_range'> | null;
  address_details: Tables<'addresses'> | null;
};

export default function DashboardScreen() {
  const { session } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadRestaurantInfo();
    }
  }, [session]);

  const loadRestaurantInfo = async () => {
    const { data: userData } = await supabase
      .from('app_users')
      .select('restaurant_id')
      .eq('id', session?.user?.id)
      .single();

    if (!userData?.restaurant_id) {
      return;
    }

    const { data, error } = await supabase
      .from('restaurants')
      .select(
        `
        *,
        opening_hours_range: opening_hours (
          from,
          to
        ),
        lunch_hours_range: lunch_hours (
          from,
          to
        ),
        address_details: address (
          address,
          city,
          state,
          country,
          postal_code
        )
      `
      )
      .eq('id', userData.restaurant_id)
      .single();

    if (error) {
      console.error('Error loading restaurant info:', error);
      return;
    }

    setRestaurant(data);
  };

  const formatHours = (hours: Tables<'hours_range'> | null) => {
    if (!hours?.from || !hours?.to) return 'Not specified';

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'pm' : 'am';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    return `${formatTime(hours.from)} - ${formatTime(hours.to)}`;
  };

  const formatAddress = (address: Tables<'addresses'> | null) => {
    if (!address) return 'Address not specified';
    const parts = [
      address.address,
      address.city,
      address.state,
      address.postal_code,
      address.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <View className="flex-1 p-4 bg-gray-50">
      <View className="bg-[#6B4EFF] rounded-2xl p-6 mb-6 shadow-sm">
        <Text className="text-2xl font-bold mb-1 text-white">
          {restaurant?.name || 'Loading...'}
        </Text>
        <Text className="text-lg text-white/80">
          {restaurant?.cuisine_type}
        </Text>
      </View>

      <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
        <View className="flex-row items-center mb-3">
          <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-3">
            <FontAwesome name="info" size={20} color="#6B4EFF" />
          </View>
          <Text className="text-xl font-semibold text-gray-900">About</Text>
        </View>
        <Text className="text-base text-gray-600 leading-6">
          {restaurant?.description || 'No description available'}
        </Text>
      </View>

      <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
        <View className="flex-row items-center mb-3">
          <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-3">
            <FontAwesome name="clock-o" size={20} color="#6B4EFF" />
          </View>
          <Text className="text-xl font-semibold text-gray-900">Hours</Text>
        </View>
        <View className="space-y-3">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-green-400 mr-2" />
            <Text className="text-base text-gray-600">
              Opening Hours:{' '}
              {formatHours(restaurant?.opening_hours_range || null)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-blue-400 mr-2" />
            <Text className="text-base text-gray-600">
              Lunch Hours: {formatHours(restaurant?.lunch_hours_range || null)}
            </Text>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <View className="flex-row items-center mb-3">
          <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-3">
            <FontAwesome name="map-marker" size={20} color="#6B4EFF" />
          </View>
          <Text className="text-xl font-semibold text-gray-900">Location</Text>
        </View>
        <Text className="text-base text-gray-600">
          {formatAddress(restaurant?.address_details || null)}
        </Text>
      </View>
    </View>
  );
}
