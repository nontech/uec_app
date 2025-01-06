import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Database } from '../../../supabase/types';
import { useAuth } from '../../../lib/AuthContext';

type Restaurant = Database['public']['Tables']['restaurants']['Row'] & {
  hours_range_lunch?: {
    from: string;
    to: string;
  };
  allowed_restaurants: {
    distance_km: number;
    company_id: string;
  }[];
};

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';

// Format lunch hours into a readable string
const formatLunchHours = (hours?: { from: string; to: string }) => {
  if (!hours) return 'Lunch: 12 pm - 2 pm'; // Default hours

  // Format time from HH:MM to 12-hour format
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}${minutes ? `:${minutes}` : ''} ${ampm}`;
  };

  return `Lunch: ${formatTime(hours.from)} - ${formatTime(hours.to)}`;
};

export default function RestaurantsHome() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { session } = useAuth();
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchUserCompany();
    }
  }, [session]);

  useEffect(() => {
    if (userCompanyId) {
      fetchRestaurants();
    }
  }, [userCompanyId]);

  async function fetchUserCompany() {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('company_id')
        .eq('id', session?.user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setUserCompanyId(data.company_id);
      }
    } catch (error) {
      console.error('Error fetching user company:', error);
    }
  }

  async function fetchRestaurants() {
    if (!userCompanyId) return;

    try {
      // First get all allowed restaurant IDs and distances
      const { data: allowedData, error: allowedError } = await supabase
        .from('allowed_restaurants')
        .select('*')
        .eq('company_id', userCompanyId);

      if (allowedError) throw allowedError;

      if (allowedData && allowedData.length > 0) {
        // Then get the restaurant details for those IDs
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select(
            `
            *,
            hours_range_lunch:lunch_hours(from, to)
          `
          )
          .in(
            'id',
            allowedData.map((r) => r.restaurant_id)
          );

        if (restaurantError) throw restaurantError;

        if (restaurantData) {
          // Combine the data
          const combinedData = restaurantData.map((restaurant) => {
            const allowedRestaurant = allowedData.find(
              (ar) => ar.restaurant_id === restaurant.id
            );
            return {
              ...restaurant,
              allowed_restaurants: [
                {
                  distance_km: allowedRestaurant?.distance_km || 0,
                  company_id: userCompanyId,
                },
              ],
            };
          });

          // Sort by distance
          const sortedData = combinedData.sort((a, b) => {
            const distanceA = a.allowed_restaurants[0]?.distance_km || 0;
            const distanceB = b.allowed_restaurants[0]?.distance_km || 0;
            return distanceA - distanceB;
          });

          setRestaurants(sortedData);
        }
      } else {
        setRestaurants([]);
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
              <Text className="text-gray-600 ml-1">
                {item.allowed_restaurants?.[0]?.distance_km != null
                  ? `${item.allowed_restaurants[0].distance_km.toFixed(1)} km`
                  : '-'}
              </Text>
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
