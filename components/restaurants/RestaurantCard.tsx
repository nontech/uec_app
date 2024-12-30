import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Database } from '../../supabase/types';
import { RestaurantInfo } from './RestaurantInfo';
import { formatOpeningHours, getDistance } from '../../utils/restaurantUtils';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';

export interface RestaurantCardProps {
  restaurant: Database['public']['Tables']['restaurants']['Row'];
  onPress: () => void;
}

export const RestaurantCard = ({
  restaurant,
  onPress,
}: RestaurantCardProps) => (
  <TouchableOpacity className="mb-10" onPress={onPress}>
    <Image
      source={restaurant.image_url || PLACEHOLDER_IMAGE}
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
      <Text className="text-xl font-bold mb-1">{restaurant.name}</Text>
      <RestaurantInfo
        hours={formatOpeningHours(restaurant.opening_hours)}
        distance={getDistance(restaurant.id)}
        cuisineType={restaurant.cuisine_type || 'General'}
      />
    </View>
  </TouchableOpacity>
);
