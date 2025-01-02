import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Database } from '../../../../supabase/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

const getDayInGerman = () => {
  const days = [
    'SONNTAG',
    'MONTAG',
    'DIENSTAG',
    'MITTWOCH',
    'DONNERSTAG',
    'FREITAG',
    'SAMSTAG',
  ];
  const today = new Date().getDay();
  return days[today];
};

const getCurrentDay = () => {
  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[new Date().getDay()];
};

export default function Menu() {
  const params = useLocalSearchParams();
  const restaurantId = params.id as string;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const currentDay = getCurrentDay();

  useEffect(() => {
    if (restaurantId) {
      fetchMenuItems();
    }
  }, [restaurantId]);

  async function fetchMenuItems() {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('day', currentDay)
        .order('category');

      if (error) throw error;
      if (data) {
        setMenuItems(data);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleItemPress = (item: MenuItem) => {
    setSelectedItem(item);
    setShowCheckout(true);
  };

  const CheckoutModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showCheckout}
      onRequestClose={() => setShowCheckout(false)}
    >
      <View className="flex-1 bg-white">
        {/* Header with close button */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => setShowCheckout(false)}
            className="p-2"
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold">Checkout</Text>
          <View style={{ width: 40 }}>
            <Text> </Text>
          </View>
        </View>

        {/* Content */}
        <View className="p-6 flex-1">
          <Text className="text-xl mb-2">Confirm Payment for</Text>
          <View className="bg-[#FDF7FF] p-4 rounded-lg mb-8">
            <Text className="text-lg font-medium">
              {selectedItem?.name || ''}
            </Text>
            <Text className="text-gray-600">
              {selectedItem?.description || ''}
            </Text>
          </View>

          {/* Virtual Card Payment Section */}
          <View className="flex-1 max-h-[500px] justify-center items-center">
            <View className="w-full max-w-[300px] aspect-square relative">
              <View className="absolute inset-0 bg-[#4CAF50] rounded-full justify-center items-center">
                <Text className="text-white text-xl mb-8">
                  <Text>TAP NOW TO PAY</Text>
                </Text>
                <View className="border-2 border-white rounded-full p-6">
                  <Ionicons name="wifi" size={48} color="white" />
                </View>
              </View>
            </View>

            {/* Payment Methods */}
            <View className="mt-8">
              <Image
                source="https://res.cloudinary.com/dc0tfxkph/image/upload/v1703963191/uec_app/payment-methods.png"
                style={{ width: 200, height: 30 }}
                contentFit="contain"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-600">Loading menu...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-4 pt-6 pb-4">
        <Text className="text-2xl text-center text-gray-700 font-medium">
          LUNCH SPECIAL
        </Text>
      </View>

      <View className="px-4 pb-4">
        <Text className="text-xl text-center text-gray-800">
          {getDayInGerman()}
        </Text>
        <View className="h-[1px] bg-gray-300 my-4" />
      </View>

      <View className="px-4 pb-4">
        <Text className="text-base text-gray-600 mb-4">
          Select to confirm order
        </Text>
      </View>

      <View className="px-4">
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            className="mb-6 bg-[#FDF7FF] rounded-lg p-4"
            onPress={() => handleItemPress(item)}
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-4">
                <Text className="text-lg font-medium mb-1">{item.name}</Text>
                <Text className="text-gray-600 text-sm">
                  {item.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <CheckoutModal />
    </ScrollView>
  );
}
