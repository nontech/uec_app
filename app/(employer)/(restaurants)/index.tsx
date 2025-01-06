import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Database } from '../../../supabase/types';

type Restaurant = Database['public']['Tables']['restaurants']['Row'] & {
  hours_range_lunch?: {
    from: string;
    to: string;
  };
};

// Placeholder image URL
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';

// Mock distance data (to be implemented with actual distance calculation)
const getDistance = (id: string) => {
  const distances: { [key: string]: string } = {
    '1': '10min',
    '2': '12min',
    '3': '10min',
  };
  return distances[id] || '15min';
};

// Format lunch hours into a readable string
const formatLunchHours = (hours?: { from: string; to: string }) => {
  if (!hours) return 'Lunch: 12 pm - 2 pm'; // Default hours
  return `Lunch: ${hours.from} - ${hours.to}`;
};

export default function RestaurantsHome() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  async function fetchRestaurants() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(
          `
          *,
          hours_range_lunch:lunch_hours(from, to)
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setRestaurants(data);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  }

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      className="mb-10"
      onPress={() =>
        router.push({
          pathname: '/[id]/menu',
          params: { id: item.id },
        })
      }
    >
      <Image
        source={item.image_url || PLACEHOLDER_IMAGE}
        contentFit="cover"
        onError={(error) => console.log('Image error:', error)}
        style={{
          width: '100%',
          height: 192,
          borderRadius: 16,
          marginBottom: 10,
        }}
      />
      <View className="px-1">
        <Text className="text-xl font-bold mb-1">{item.name}</Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text className="text-gray-600 ml-1">
                {formatLunchHours(item.hours_range_lunch)}
              </Text>
            </View>
            <View className="flex-row items-center ml-6">
              <Ionicons name="walk-outline" size={16} color="#666" />
              <Text className="text-gray-600 ml-1">{getDistance(item.id)}</Text>
            </View>
          </View>
          <View className="bg-gray-100 px-3 py-1 rounded-full">
            <Text className="text-gray-600">{item.cuisine_type}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-600">Loading restaurants...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Text className="text-2xl font-bold px-4 py-6">Nearby Restaurants</Text>
      <FlatList
        data={restaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}
