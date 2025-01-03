import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  DataTable,
  Button,
  Modal,
  Portal,
  TextInput,
} from 'react-native-paper';
import { Database } from '../../../supabase/types';
import { useRouter } from 'expo-router';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type RestaurantInput = Database['public']['Tables']['restaurants']['Insert'];

export default function RestaurantsManagement() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] =
    useState<Restaurant | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [formData, setFormData] = useState<RestaurantInput>({
    name: '',
    description: '',
    cuisine_type: '',
    opening_hours: '',
    tier: '',
    image_url: '',
  });
  const router = useRouter();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase.from('restaurants').insert([formData]);

      if (error) throw error;

      setVisible(false);
      setFormData({
        name: '',
        description: '',
        cuisine_type: '',
        opening_hours: '',
        tier: '',
        image_url: '',
      });
      fetchRestaurants();
    } catch (error) {
      console.error('Error creating restaurant:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRestaurant?.id) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .update(formData)
        .eq('id', selectedRestaurant.id);

      if (error) throw error;

      setVisible(false);
      setSelectedRestaurant(null);
      setFormData({
        name: '',
        description: '',
        cuisine_type: '',
        opening_hours: '',
        tier: '',
        image_url: '',
      });
      fetchRestaurants();
    } catch (error) {
      console.error('Error updating restaurant:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchRestaurants();
      setDeleteConfirmVisible(false);
      setRestaurantToDelete(null);
    } catch (error) {
      console.error('Error deleting restaurant:', error);
    }
  };

  const openCreateModal = () => {
    setSelectedRestaurant(null);
    setFormData({
      name: '',
      description: '',
      cuisine_type: '',
      opening_hours: '',
      tier: '',
      image_url: '',
    });
    setVisible(true);
  };

  const openEditModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setFormData({
      name: restaurant.name || '',
      description: restaurant.description || '',
      cuisine_type: restaurant.cuisine_type || '',
      opening_hours: restaurant.opening_hours || '',
      tier: restaurant.tier || '',
      image_url: restaurant.image_url || '',
    });
    setVisible(true);
  };

  const openDeleteConfirm = (restaurant: Restaurant) => {
    setRestaurantToDelete(restaurant);
    setDeleteConfirmVisible(true);
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
      <View className="flex-row justify-between items-center mb-5">
        <Text className="text-2xl font-semibold text-gray-800">
          Restaurants Management
        </Text>
        <Button
          mode="contained"
          onPress={openCreateModal}
          className="bg-blue-500"
        >
          Add Restaurant
        </Button>
      </View>

      <DataTable className="bg-white">
        <DataTable.Header>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Name</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">
              Cuisine Type
            </Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Tier</Text>
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
                {restaurant.cuisine_type}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">{restaurant.tier}</Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <View className="flex-row gap-2">
                <Button
                  mode="outlined"
                  onPress={() => openEditModal(restaurant)}
                  className="border-blue-500"
                  textColor="#3b82f6"
                >
                  Edit
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => openDeleteConfirm(restaurant)}
                  className="border-red-500"
                  textColor="#ef4444"
                >
                  Delete
                </Button>
                <Button
                  mode="outlined"
                  onPress={() =>
                    router.push(
                      `/(super-admin)/restaurants/${restaurant.id}/menu`
                    )
                  }
                  className="border-gray-500"
                  textColor="#6b7280"
                >
                  Menu
                </Button>
              </View>
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)}>
          <View className="mx-5 my-8 bg-white p-6 rounded-lg max-w-lg self-center w-full">
            <Text className="text-xl font-semibold text-gray-800 mb-6">
              {selectedRestaurant ? 'Edit Restaurant' : 'Add Restaurant'}
            </Text>

            <TextInput
              label="Name"
              value={formData.name || ''}
              onChangeText={(text: string) =>
                setFormData({ ...formData, name: text })
              }
              className="mb-4"
              mode="flat"
            />

            <TextInput
              label="Description"
              value={formData.description || ''}
              onChangeText={(text: string) =>
                setFormData({ ...formData, description: text })
              }
              className="mb-4"
              mode="flat"
              multiline
              numberOfLines={3}
            />

            <TextInput
              label="Cuisine Type"
              value={formData.cuisine_type || ''}
              onChangeText={(text: string) =>
                setFormData({ ...formData, cuisine_type: text })
              }
              className="mb-4"
              mode="flat"
            />

            <TextInput
              label="Opening Hours"
              value={formData.opening_hours || ''}
              onChangeText={(text: string) =>
                setFormData({ ...formData, opening_hours: text })
              }
              className="mb-4"
              mode="flat"
            />

            <TextInput
              label="Tier"
              value={formData.tier || ''}
              onChangeText={(text: string) =>
                setFormData({ ...formData, tier: text })
              }
              className="mb-4"
              mode="flat"
            />

            <TextInput
              label="Image URL"
              value={formData.image_url || ''}
              onChangeText={(text: string) =>
                setFormData({ ...formData, image_url: text })
              }
              className="mb-4"
              mode="flat"
            />

            <View className="flex-row justify-end items-center gap-3 mt-6">
              <Button
                mode="text"
                onPress={() => setVisible(false)}
                textColor="#6b7280"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={selectedRestaurant ? handleUpdate : handleCreate}
                className="bg-blue-500"
              >
                {selectedRestaurant ? 'Save Changes' : 'Create Restaurant'}
              </Button>
            </View>
          </View>
        </Modal>

        <Modal
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
        >
          <View className="mx-5 my-8 bg-white p-6 rounded-lg max-w-lg self-center w-full">
            <Text className="text-xl font-semibold text-gray-800 mb-6">
              Confirm Restaurant Deletion
            </Text>
            <Text className="text-base text-gray-600 mb-2">
              Are you sure you want to delete the restaurant "
              {restaurantToDelete?.name}"?
            </Text>
            <Text className="text-sm text-red-600 mb-6">
              This will also delete all menu items associated with this
              restaurant. This action cannot be undone.
            </Text>

            <View className="flex-row justify-end items-center gap-3">
              <Button
                mode="text"
                onPress={() => setDeleteConfirmVisible(false)}
                textColor="#6b7280"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={() =>
                  restaurantToDelete?.id && handleDelete(restaurantToDelete.id)
                }
                className="bg-red-500"
              >
                Delete
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}
