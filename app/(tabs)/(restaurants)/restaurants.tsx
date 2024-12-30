import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../supabase/types';
import { RestaurantCard } from '../../../components/restaurants/RestaurantCard';
import { LoadingView } from '../../../components/common/LoadingView';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export default function RestaurantsHome() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleRestaurantPress = (restaurantId: string) => {
    router.push({
      pathname: '/(tabs)/(restaurants)/[id]/menu',
      params: { id: restaurantId },
    });
  };

  async function fetchRestaurants() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingView message="Loading restaurants..." />;

  return (
    <View className="flex-1 bg-white">
      <Text className="text-2xl font-bold px-4 py-6">Nearby Restaurants</Text>
      <FlatList
        data={restaurants}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => handleRestaurantPress(item.id)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}
