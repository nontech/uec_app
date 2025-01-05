import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Database } from '../../../../supabase/types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Colors from '../../../../constants/Colors';
import { useTranslation } from 'react-i18next';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type HoursRange = {
  from: string | null;
  to: string | null;
};
type Restaurant = Database['public']['Tables']['restaurants']['Row'] & {
  opening_hours: HoursRange | null;
  lunch_hours: HoursRange | null;
};

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

const isWeekend = () => {
  const day = new Date().getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

const isWithinLunchHours = (lunchHours: HoursRange | null | undefined) => {
  if (isWeekend()) return false;
  if (!lunchHours?.from || !lunchHours?.to) return false;

  try {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const [fromHours, fromMinutes] = lunchHours.from.split(':').map(Number);
    const [toHours, toMinutes] = lunchHours.to.split(':').map(Number);

    if (
      isNaN(fromHours) ||
      isNaN(fromMinutes) ||
      isNaN(toHours) ||
      isNaN(toMinutes)
    ) {
      return false;
    }

    const fromTime = fromHours * 100 + fromMinutes;
    const toTime = toHours * 100 + toMinutes;

    return currentTime >= fromTime && currentTime <= toTime;
  } catch (error) {
    console.error('Error parsing lunch hours:', error);
    return false;
  }
};

const formatTime = (time: string | null) => {
  if (!time) return '';

  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;

  return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export default function Menu() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams();
  const restaurantId = params.id as string;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantDetails();
      fetchMenuItems();
    }
  }, [restaurantId]);

  async function fetchRestaurantDetails() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(
          `
          *,
          lunch_hours:lunch_hours (
            from,
            to
          ),
          opening_hours:opening_hours (
            from,
            to
          )
        `
        )
        .eq('id', restaurantId)
        .single();

      if (error) throw error;
      if (data) {
        console.log('Raw restaurant data:', data);
        console.log('Lunch hours:', data.lunch_hours);

        const parsedData = {
          ...data,
          opening_hours: data.opening_hours,
          lunch_hours: data.lunch_hours,
        };
        console.log('Parsed restaurant data:', parsedData);
        setRestaurant(parsedData);
      }
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
    }
  }

  async function fetchMenuItems() {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .contains('days', [currentDay])
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
    if (isWeekend()) {
      Alert.alert('Not Available', 'Orders are not available on weekends');
      return;
    }

    if (!restaurant?.lunch_hours) {
      Alert.alert('Error', 'Lunch hours not available');
      return;
    }

    if (!isWithinLunchHours(restaurant.lunch_hours)) {
      Alert.alert(
        'Not Available',
        `Orders are only available between ${formatTime(
          restaurant.lunch_hours.from
        )} - ${formatTime(restaurant.lunch_hours.to)}`
      );
      return;
    }

    setSelectedItem(item);
    setShowCheckout(true);
  };

  const CheckoutModal = () => (
    <Modal
      animationType='slide'
      transparent={true}
      visible={showCheckout}
      onRequestClose={() => setShowCheckout(false)}
    >
      <View className='flex-1 bg-[#1C1C1E]'>
        {/* Header with close button */}
        <View className='flex-row justify-between items-center p-4 border-b border-[#3C3C3E]'>
          <TouchableOpacity
            onPress={() => setShowCheckout(false)}
            className='p-2'
          >
            <Ionicons name='close' size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text className='text-xl font-semibold text-white'>Checkout</Text>
          <View style={{ width: 40 }}>
            <Text> </Text>
          </View>
        </View>

        {/* Content */}
        <View className='p-6 flex-1'>
          <Text className='text-xl mb-2 text-white'>Confirm Payment for</Text>
          <View className='bg-[#2C2C2E] p-4 rounded-lg mb-8'>
            <Text className='text-lg font-medium text-white'>
              {selectedItem?.name || ''}
            </Text>
            <Text className='text-[#999999]'>
              {selectedItem?.description || ''}
            </Text>
          </View>

          {/* Virtual Card Payment Section */}
          <View className='flex-1 max-h-[500px] justify-center items-center'>
            <View className='w-full max-w-[300px] aspect-square relative'>
              <View className='absolute inset-0 bg-[#6B4EFF] rounded-full justify-center items-center'>
                <Text className='text-white text-xl mb-8'>
                  <Text>TAP NOW TO PAY</Text>
                </Text>
                <View className='border-2 border-white rounded-full p-6'>
                  <Ionicons name='wifi' size={48} color='white' />
                </View>
              </View>
            </View>

            {/* Payment Methods */}
            <View className='mt-8'>
              <Image
                source='https://res.cloudinary.com/dc0tfxkph/image/upload/v1703963191/uec_app/payment-methods.png'
                style={{ width: 200, height: 30 }}
                contentFit='contain'
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

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

  const currentDay = getCurrentDay();

  const getTranslatedDay = () => {
    return t(`days.${currentDay}`);
  };

  if (loading) {
    return (
      <View className='flex-1 items-center justify-center bg-white'>
        <Text className='text-gray-500'>Loading menu...</Text>
      </View>
    );
  }

  const isOpen = restaurant?.lunch_hours
    ? isWithinLunchHours(restaurant.lunch_hours)
    : false;

  return (
    <ScrollView className='flex-1 bg-white'>
      <View className='px-4 pt-6 pb-2'>
        <Text className='text-2xl text-center text-gray-900 font-semibold'>
          {restaurant?.name}
        </Text>
      </View>

      <View className='px-4 pb-2'>
        <View className='flex-row items-center justify-center'>
          <MaterialIcons
            name='access-time'
            size={16}
            color={isOpen ? '#22C55E' : '#EF4444'}
          />
          <Text
            className={`text-sm ml-1 ${
              isOpen ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isOpen ? 'Open Now' : isWeekend() ? 'Closed (Weekend)' : 'Closed'}
            {!isWeekend() &&
              restaurant?.lunch_hours &&
              ` (${formatTime(restaurant.lunch_hours.from)} - ${formatTime(
                restaurant.lunch_hours.to
              )})`}
          </Text>
        </View>
      </View>

      {!isWeekend() && (
        <View className='px-4 pb-4'>
          <Text className='text-xl text-center text-[#6B4EFF] font-medium mt-4'>
            LUNCH SPECIAL
          </Text>
          <Text className='text-lg text-center text-gray-900 mt-1'>
            {getDayInGerman()}
          </Text>
          <View className='h-[1px] bg-gray-200 my-4' />
        </View>
      )}

      <View className='px-4 pb-6'>
        <View
          className={`rounded-lg p-4 flex-row items-center justify-center ${
            isOpen
              ? 'bg-white border border-green-500'
              : isWeekend()
              ? 'bg-white border border-orange-500'
              : 'bg-white border border-[#6B4EFF]'
          }`}
        >
          <MaterialIcons
            name={
              isOpen ? 'check-circle' : isWeekend() ? 'event-busy' : 'schedule'
            }
            size={20}
            color={isOpen ? '#22C55E' : isWeekend() ? '#F97316' : '#6B4EFF'}
            style={{ marginRight: 8 }}
          />
          <Text
            className={`text-base font-medium ${
              isOpen
                ? 'text-green-600'
                : isWeekend()
                ? 'text-orange-500'
                : 'text-[#6B4EFF]'
            }`}
          >
            {isOpen
              ? 'Select a meal to order'
              : isWeekend()
              ? 'Orders unavailable on weekends'
              : restaurant?.lunch_hours
              ? `Orders available ${formatTime(
                  restaurant.lunch_hours.from
                )} - ${formatTime(restaurant.lunch_hours.to)}`
              : 'Lunch hours not available'}
          </Text>
        </View>
      </View>

      <View className='px-4'>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            className={`mb-6 rounded-lg p-4 ${
              isOpen ? 'bg-white border border-gray-200' : 'bg-gray-50'
            }`}
            onPress={() => handleItemPress(item)}
            disabled={!isOpen}
          >
            <View className='flex-row justify-between items-start'>
              <View className='flex-1 pr-4'>
                <Text
                  className={`text-lg font-medium mb-1 ${
                    !isOpen ? 'text-gray-400' : 'text-gray-900'
                  }`}
                >
                  {item.name}
                </Text>
                <Text
                  className={`text-sm ${
                    !isOpen ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {item.description}
                </Text>
              </View>
              <Ionicons
                name='chevron-forward'
                size={20}
                color={isOpen ? Colors.text.secondary : '#9CA3AF'}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {showCheckout && (
        <Modal
          animationType='slide'
          transparent={true}
          visible={showCheckout}
          onRequestClose={() => setShowCheckout(false)}
        >
          <View className='flex-1 bg-white'>
            {/* Header with close button */}
            <View className='flex-row justify-between items-center p-4 border-b border-gray-200'>
              <TouchableOpacity
                onPress={() => setShowCheckout(false)}
                className='p-2'
              >
                <Ionicons name='close' size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text className='text-xl font-semibold text-gray-900'>
                Checkout
              </Text>
              <View style={{ width: 40 }}>
                <Text> </Text>
              </View>
            </View>

            {/* Content */}
            <View className='p-6 flex-1'>
              <Text className='text-xl mb-2 text-gray-900'>
                Confirm Payment for
              </Text>
              <View className='bg-gray-50 p-4 rounded-lg mb-8'>
                <Text className='text-lg font-medium text-gray-900'>
                  {selectedItem?.name || ''}
                </Text>
                <Text className='text-gray-600'>
                  {selectedItem?.description || ''}
                </Text>
              </View>

              {/* Virtual Card Payment Section */}
              <View className='flex-1 max-h-[500px] justify-center items-center'>
                <View className='w-full max-w-[300px] aspect-square relative'>
                  <View className='absolute inset-0 bg-[#6B4EFF] rounded-full justify-center items-center'>
                    <Text className='text-white text-xl mb-8'>
                      <Text>TAP NOW TO PAY</Text>
                    </Text>
                    <View className='border-2 border-white rounded-full p-6'>
                      <Ionicons name='wifi' size={48} color='white' />
                    </View>
                  </View>
                </View>

                {/* Payment Methods */}
                <View className='mt-8'>
                  <Image
                    source='https://res.cloudinary.com/dc0tfxkph/image/upload/v1703963191/uec_app/payment-methods.png'
                    style={{ width: 200, height: 30 }}
                    contentFit='contain'
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}
