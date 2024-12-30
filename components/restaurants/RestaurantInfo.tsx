import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface RestaurantInfoProps {
  hours: string;
  distance: string;
  cuisineType: string;
}

export const RestaurantInfo = ({
  hours,
  distance,
  cuisineType,
}: RestaurantInfoProps) => (
  <View className="flex-row items-center justify-between">
    <View className="flex-row items-center">
      <View className="flex-row items-center">
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text className="text-gray-600 ml-1">{hours}</Text>
      </View>
      <View className="flex-row items-center ml-6">
        <Ionicons name="walk-outline" size={16} color="#666" />
        <Text className="text-gray-600 ml-1">{distance}</Text>
      </View>
    </View>
    <View className="bg-gray-100 px-3 py-1 rounded-full">
      <Text className="text-gray-600">{cuisineType}</Text>
    </View>
  </View>
);
