import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Database } from '../../../../supabase/types';
import { MenuItem } from '../../../../components/restaurants/MenuItem';
import { CheckoutModal } from '../../../../components/restaurants/CheckoutModal';
import { LoadingView } from '../../../../components/common/LoadingView';
import { MenuHeader } from '../../../../components/restaurants/MenuHeader';
import { fetchMenuItems } from '../../../../utils/menuUtils';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export default function Menu() {
  const params = useLocalSearchParams();
  const restaurantId = params.id as string;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      loadMenuItems();
    }
  }, [restaurantId]);

  const loadMenuItems = async () => {
    try {
      const items = await fetchMenuItems(restaurantId);
      setMenuItems(items);
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item: MenuItem) => {
    setSelectedItem(item);
    setShowCheckout(true);
  };

  if (loading) return <LoadingView message="Loading menu..." />;

  return (
    <ScrollView className="flex-1 bg-white">
      <MenuHeader />

      <View className="px-4">
        {menuItems.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            onPress={() => handleItemPress(item)}
          />
        ))}
      </View>

      <CheckoutModal
        visible={showCheckout}
        onClose={() => setShowCheckout(false)}
        selectedItem={selectedItem}
      />
    </ScrollView>
  );
}
