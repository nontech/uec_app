import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Database } from '../../supabase/types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface MenuItemProps {
  item: MenuItem;
  onPress: () => void;
}

export const MenuItem = ({ item, onPress }: MenuItemProps) => {
  const { name, description, category } = item;

  return (
    <TouchableOpacity
      className="mb-6 bg-[#FDF7FF] rounded-lg p-4 active:opacity-80"
      onPress={onPress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-4">
          {category && (
            <Text className="text-sm text-gray-500 mb-1">{category}</Text>
          )}
          <Text className="text-lg font-medium mb-1">{name}</Text>
          {description && (
            <Text className="text-gray-600 text-sm">{description}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );
};
