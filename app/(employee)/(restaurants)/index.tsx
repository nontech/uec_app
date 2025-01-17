import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Database } from '../../../supabase/types';
import { useAuth } from '../../../lib/AuthContext';
import Colors from '../../../constants/Colors';

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

type UserWithCompany = Database['public']['Tables']['app_users']['Row'] & {
  companies?: {
    memberships: {
      plan_type: 'S' | 'M' | 'L';
    }[];
  };
};

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';

// Format lunch hours into a readable string
const formatLunchHours = (hours?: { from: string; to: string }) => {
  if (!hours) return '12 pm - 2 pm'; // Default hours

  // Format time from HH:MM to 12-hour format
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}${minutes ? `:${minutes}` : ''} ${ampm}`;
  };

  return `${formatTime(hours.from)} - ${formatTime(hours.to)}`;
};

export default function RestaurantsHome() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { session } = useAuth();
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [userMembershipTier, setUserMembershipTier] = useState<
    'S' | 'M' | 'L' | null
  >(null);

  useEffect(() => {
    if (session?.user) {
      fetchUserDetails();
    }
  }, [session]);

  useEffect(() => {
    if (userCompanyId && userMembershipTier) {
      fetchRestaurants();
    }
  }, [userCompanyId, userMembershipTier]);

  async function fetchUserDetails() {
    try {
      // Get user details including membership_id
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select(
          `
          company_id,
          membership_id
        `
        )
        .eq('id', session?.user?.id)
        .single();

      if (userError) throw userError;
      if (!userData?.company_id || !userData?.membership_id) return;

      setUserCompanyId(userData.company_id);

      // Get user's membership details
      const { data: membershipData, error: membershipError } = await supabase
        .from('memberships')
        .select('plan_type')
        .eq('id', userData.membership_id)
        .single();

      if (membershipError) throw membershipError;
      if (membershipData) {
        setUserMembershipTier(membershipData.plan_type as 'S' | 'M' | 'L');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  }

  async function fetchRestaurants() {
    if (!userCompanyId || !userMembershipTier) return;

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
          // Combine the data and filter by tier
          const combinedData = restaurantData
            .filter((restaurant) => {
              const tier = restaurant.tier as 'S' | 'M' | 'L';
              switch (userMembershipTier) {
                case 'S':
                  return tier === 'S';
                case 'M':
                  return tier === 'S' || tier === 'M';
                case 'L':
                  return tier === 'S' || tier === 'M' || tier === 'L';
                default:
                  return false;
              }
            })
            .map((restaurant) => {
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
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-xl font-bold text-gray-900">{item.name}</Text>
          <View className="bg-gray-100 px-3 py-1 rounded-full">
            <Text className="text-gray-700 text-sm" numberOfLines={1}>
              {item.cuisine_type}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-6">
          <View className="flex-row items-center">
            <Ionicons
              name="time-outline"
              size={16}
              color={Colors.text.secondary}
            />
            <Text className="text-gray-600 ml-1">
              {formatLunchHours(item.hours_range_lunch)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons
              name="walk-outline"
              size={16}
              color={Colors.text.secondary}
            />
            <Text className="text-gray-600 ml-1">
              {item.allowed_restaurants?.[0]?.distance_km != null
                ? `${item.allowed_restaurants[0].distance_km.toFixed(1)} km`
                : '-'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Loading restaurants...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={restaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
