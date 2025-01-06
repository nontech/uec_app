import { View } from 'react-native';
import { Text } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  DataTable,
  Button,
  Modal,
  Portal,
  TextInput,
  Checkbox,
  IconButton,
} from 'react-native-paper';
import { Database } from '../../../../supabase/types';
import { ScrollView } from 'react-native';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type AllowedRestaurant =
  Database['public']['Tables']['allowed_restaurants']['Row'];
type Address = Database['public']['Tables']['addresses']['Row'];

type RestaurantWithAllowed = Restaurant & {
  allowed_restaurants?: AllowedRestaurant | null;
  addresses?: Address | null;
};

export default function AllowedRestaurants() {
  const router = useRouter();
  const { id: companyId } = useLocalSearchParams<{ id: string }>();
  const [restaurants, setRestaurants] = useState<RestaurantWithAllowed[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<RestaurantWithAllowed | null>(null);
  const [distance, setDistance] = useState<string>('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      // First get all allowed restaurants for this company
      const { data: allowedData, error: allowedError } = await supabase
        .from('allowed_restaurants')
        .select('*')
        .eq('company_id', companyId);

      if (allowedError) throw allowedError;

      // Then get all restaurants with their addresses
      const { data: allRestaurants, error: allRestaurantsError } =
        await supabase
          .from('restaurants')
          .select(
            `
          *,
          addresses (
            address,
            postal_code,
            city,
            country
          )
        `
          )
          .order('name');

      if (allRestaurantsError) throw allRestaurantsError;

      // Combine the data to show all restaurants with their allowed status
      const combinedData = allRestaurants.map((restaurant) => {
        const allowedRestaurant = allowedData?.find(
          (r) => r.restaurant_id === restaurant.id
        );
        return {
          ...restaurant,
          allowed_restaurants: allowedRestaurant || null,
        };
      });

      setRestaurants(combinedData);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAllowed = async (restaurant: RestaurantWithAllowed) => {
    try {
      if (restaurant.allowed_restaurants) {
        // Remove from allowed restaurants
        const { error } = await supabase
          .from('allowed_restaurants')
          .delete()
          .eq('company_id', companyId)
          .eq('restaurant_id', restaurant.id);

        if (error) throw error;
      } else {
        // Add to allowed restaurants with default distance
        const { error } = await supabase.from('allowed_restaurants').insert([
          {
            company_id: companyId,
            restaurant_id: restaurant.id,
            distance_km: 0.0,
          },
        ]);

        if (error) throw error;
      }

      fetchRestaurants();
    } catch (error) {
      console.error('Error toggling restaurant:', error);
    }
  };

  const openEditModal = (restaurant: RestaurantWithAllowed) => {
    setSelectedRestaurant(restaurant);
    setDistance(
      restaurant.allowed_restaurants?.distance_km?.toFixed(1) || '0.0'
    );
    setVisible(true);
  };

  const handleUpdateDistance = async () => {
    if (!selectedRestaurant) return;

    try {
      const { error } = await supabase
        .from('allowed_restaurants')
        .update({ distance_km: parseFloat(distance) || 0.0 })
        .eq('company_id', companyId)
        .eq('restaurant_id', selectedRestaurant.id);

      if (error) throw error;

      setVisible(false);
      fetchRestaurants();
    } catch (error) {
      console.error('Error updating distance:', error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 p-5 bg-white">
        <Text className="text-lg">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-5 bg-white">
      <Text className="text-2xl font-semibold text-gray-800 mb-5">
        Manage Allowed Restaurants
      </Text>

      <DataTable className="bg-white">
        <DataTable.Header>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Name</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Address</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">
              Distance (km)
            </Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Allowed</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Actions</Text>
          </DataTable.Title>
        </DataTable.Header>

        {restaurants.map((restaurant) => (
          <DataTable.Row key={restaurant.id}>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">{restaurant.name}</Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {restaurant.addresses
                  ? `${restaurant.addresses.address}, ${restaurant.addresses.postal_code} ${restaurant.addresses.city}`
                  : '-'}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {restaurant.allowed_restaurants &&
                restaurant.allowed_restaurants.distance_km !== null
                  ? restaurant.allowed_restaurants.distance_km.toFixed(1)
                  : '-'}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Checkbox
                status={
                  restaurant.allowed_restaurants ? 'checked' : 'unchecked'
                }
                onPress={() => handleToggleAllowed(restaurant)}
              />
            </DataTable.Cell>
            <DataTable.Cell>
              {restaurant.allowed_restaurants && (
                <Button
                  mode="outlined"
                  onPress={() => openEditModal(restaurant)}
                  className="border-blue-500"
                  textColor="#3b82f6"
                >
                  Edit Distance
                </Button>
              )}
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)}>
          <View className="mx-5 my-8 bg-white p-6 rounded-lg max-w-lg self-center w-full">
            <Text className="text-xl font-semibold text-gray-800 mb-6">
              Edit Distance
            </Text>

            <TextInput
              label="Distance (km)"
              value={distance}
              onChangeText={setDistance}
              className="mb-4"
              mode="flat"
              keyboardType="decimal-pad"
              placeholder="Enter distance in kilometers (e.g., 1.5)"
            />

            <View className="flex-row justify-end items-center gap-3">
              <Button
                mode="text"
                onPress={() => setVisible(false)}
                textColor="#6b7280"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleUpdateDistance}
                className="bg-blue-500"
              >
                Save Changes
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}
