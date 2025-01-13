import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Tables } from '../../supabase/types';
import Colors from '../../constants/Colors';

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
    <View className="flex-1 p-4 bg-[#1C1C1E]">
      <View className="mb-6">
        <Text className="text-2xl font-bold mb-1 text-white">
          {restaurant?.name || 'Loading...'}
        </Text>
        <Text className="text-lg text-[#999999]">
          {restaurant?.cuisine_type}
        </Text>
      </View>

      <View className="bg-[#2C2C2E] rounded-xl p-4 mb-4">
        <Text className="text-xl font-semibold mb-2 text-white">About</Text>
        <Text className="text-base text-[#999999] leading-6">
          {restaurant?.description || 'No description available'}
        </Text>
      </View>

      <View className="bg-[#2C2C2E] rounded-xl p-4 mb-4">
        <Text className="text-xl font-semibold mb-2 text-white">Hours</Text>
        <Text className="text-base text-[#999999] mb-1">
          Opening Hours: {formatHours(restaurant?.opening_hours_range || null)}
        </Text>
        <Text className="text-base text-[#999999] mb-1">
          Lunch Hours: {formatHours(restaurant?.lunch_hours_range || null)}
        </Text>
      </View>

      <View className="bg-[#2C2C2E] rounded-xl p-4 mb-4">
        <Text className="text-xl font-semibold mb-2 text-white">Location</Text>
        <Text className="text-base text-[#999999]">
          {formatAddress(restaurant?.address_details || null)}
        </Text>
      </View>
    </View>
  );
}
