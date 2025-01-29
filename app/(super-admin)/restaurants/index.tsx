import { View, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  DataTable,
  Button,
  Modal,
  Portal,
  TextInput,
  SegmentedButtons,
  IconButton,
} from 'react-native-paper';
import { Database } from '../../../supabase/types';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

type HoursRange = {
  id: string;
  from: string; // timez type
  to: string; // timez type
  created_at?: string;
  updated_at?: string;
};

type Address = {
  id: string;
  address: string | null;
  postal_code: number | null;
  city: string | null;
  state: string | null;
  country: string;
  created_at?: string;
  updated_at?: string;
};

type Restaurant = Database['public']['Tables']['restaurants']['Row'] & {
  hours_range_opening?: HoursRange;
  hours_range_lunch?: HoursRange;
  addresses?: Address;
};

type RestaurantInput = {
  name: string;
  description: string | null;
  cuisine_type: string | null;
  tier: string | null;
  image_url: string | null;
  image_local_uri?: string | null;
};

type AddressInput = {
  address: string | null;
  postal_code: number | null;
  city: string | null;
  state: string | null;
  country: string;
};

export default function RestaurantsManagement() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] =
    useState<Restaurant | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [formData, setFormData] = useState<{
    restaurant: RestaurantInput;
    address: AddressInput;
    opening_hours: { from: string; to: string };
    lunch_hours: { from: string; to: string };
  }>({
    restaurant: {
      name: '',
      description: '',
      cuisine_type: '',
      tier: '',
      image_url: '',
    },
    address: {
      address: '',
      postal_code: null,
      city: '',
      state: '',
      country: 'Germany',
    },
    opening_hours: { from: '09:00', to: '17:00' },
    lunch_hours: { from: '12:00', to: '14:00' },
  });
  const router = useRouter();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(
          `
          *,
          hours_range_opening:opening_hours(from, to),
          hours_range_lunch:lunch_hours(from, to),
          addresses(*)
        `
        )
        .order('name');

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
      // First create address
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .insert(formData.address)
        .select()
        .single();

      if (addressError) throw addressError;

      // Create opening hours range
      const { data: openingHoursData, error: openingHoursError } =
        await supabase
          .from('hours_range')
          .insert({
            from: formData.opening_hours.from,
            to: formData.opening_hours.to,
          })
          .select()
          .single();

      if (openingHoursError) throw openingHoursError;

      // Create lunch hours range
      const { data: lunchHoursData, error: lunchHoursError } = await supabase
        .from('hours_range')
        .insert({
          from: formData.lunch_hours.from,
          to: formData.lunch_hours.to,
        })
        .select()
        .single();

      if (lunchHoursError) throw lunchHoursError;

      // Finally create the restaurant with all the IDs
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .insert([
          {
            name: formData.restaurant.name,
            description: formData.restaurant.description,
            cuisine_type: formData.restaurant.cuisine_type,
            tier: formData.restaurant.tier,
            image_url: formData.restaurant.image_url,
            address: addressData.id,
            opening_hours: openingHoursData.id,
            lunch_hours: lunchHoursData.id,
          },
        ]);

      if (restaurantError) throw restaurantError;

      setVisible(false);
      resetForm();
      fetchRestaurants();
    } catch (error) {
      console.error('Error creating restaurant:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRestaurant?.id) return;

    try {
      // Update address
      const { error: addressError } = await supabase
        .from('addresses')
        .update(formData.address)
        .eq('id', selectedRestaurant.address);

      if (addressError) throw addressError;

      // Update opening hours range
      const { error: openingHoursError } = await supabase
        .from('hours_range')
        .update({
          from: formData.opening_hours.from,
          to: formData.opening_hours.to,
        })
        .eq('id', selectedRestaurant.opening_hours);

      if (openingHoursError) throw openingHoursError;

      // Update lunch hours range
      const { error: lunchHoursError } = await supabase
        .from('hours_range')
        .update({
          from: formData.lunch_hours.from,
          to: formData.lunch_hours.to,
        })
        .eq('id', selectedRestaurant.lunch_hours);

      if (lunchHoursError) throw lunchHoursError;

      // Update restaurant
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .update({
          name: formData.restaurant.name,
          description: formData.restaurant.description,
          cuisine_type: formData.restaurant.cuisine_type,
          tier: formData.restaurant.tier,
          image_url: formData.restaurant.image_url,
        })
        .eq('id', selectedRestaurant.id);

      if (restaurantError) throw restaurantError;

      setVisible(false);
      resetForm();
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

  const resetForm = () => {
    setSelectedRestaurant(null);
    setFormData({
      restaurant: {
        name: '',
        description: '',
        cuisine_type: '',
        tier: '',
        image_url: '',
      },
      address: {
        address: '',
        postal_code: null,
        city: '',
        state: '',
        country: 'Germany',
      },
      opening_hours: { from: '09:00', to: '17:00' },
      lunch_hours: { from: '12:00', to: '14:00' },
    });
  };

  const openEditModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setFormData({
      restaurant: {
        name: restaurant.name || '',
        description: restaurant.description || '',
        cuisine_type: restaurant.cuisine_type || '',
        tier: restaurant.tier || '',
        image_url: restaurant.image_url || '',
      },
      address: {
        address: restaurant.addresses?.address || '',
        postal_code: restaurant.addresses?.postal_code || null,
        city: restaurant.addresses?.city || '',
        state: restaurant.addresses?.state || '',
        country: restaurant.addresses?.country || 'Germany',
      },
      opening_hours: {
        from: restaurant.hours_range_opening?.from || '09:00',
        to: restaurant.hours_range_opening?.to || '17:00',
      },
      lunch_hours: {
        from: restaurant.hours_range_lunch?.from || '12:00',
        to: restaurant.hours_range_lunch?.to || '14:00',
      },
    });
    setVisible(true);
  };

  const openDeleteConfirm = (restaurant: Restaurant) => {
    setRestaurantToDelete(restaurant);
    setDeleteConfirmVisible(true);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        const base64FileData = result.assets[0].base64;
        if (!base64FileData) {
          throw new Error('No base64 data found in image');
        }

        // Update local preview immediately for better UX
        setFormData({
          ...formData,
          restaurant: {
            ...formData.restaurant,
            image_local_uri: result.assets[0].uri,
          },
        });

        // Delete old image if exists
        if (formData.restaurant.image_url) {
          const oldImagePath = formData.restaurant.image_url.split('/').pop();
          if (oldImagePath) {
            const { error: deleteError } = await supabase.storage
              .from('restaurants')
              .remove([oldImagePath]);
            if (deleteError) {
              console.error('Error deleting old image:', deleteError);
            }
          }
        }

        // Upload new image
        const fileName = `restaurant-${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
          .from('restaurants')
          .upload(fileName, decode(base64FileData), {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (error) throw error;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('restaurants').getPublicUrl(fileName);

        // Update form data with the public URL
        setFormData({
          ...formData,
          restaurant: {
            ...formData.restaurant,
            image_url: publicUrl,
            image_local_uri: result.assets[0].uri,
          },
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    }
  };

  const removeImage = async () => {
    try {
      if (formData.restaurant.image_url) {
        const imagePath = formData.restaurant.image_url.split('/').pop();
        if (imagePath) {
          const { error: deleteError } = await supabase.storage
            .from('restaurants')
            .remove([imagePath]);
          if (deleteError) {
            console.error('Error deleting image:', deleteError);
          }
        }
      }

      setFormData({
        ...formData,
        restaurant: {
          ...formData.restaurant,
          image_url: null,
          image_local_uri: null,
        },
      });
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Error removing image. Please try again.');
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
      <View className="flex-row justify-between items-center mb-5">
        <Text className="text-2xl font-semibold text-gray-800">
          Restaurants Management
        </Text>
        <Button
          mode="contained"
          onPress={() => setVisible(true)}
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
          <View className="mx-5 my-8 bg-white rounded-lg max-w-lg self-center w-full max-h-[80%]">
            <ScrollView className="p-6">
              <Text className="text-xl font-semibold text-gray-800 mb-6">
                {selectedRestaurant ? 'Edit Restaurant' : 'Add Restaurant'}
              </Text>

              {/* Image Upload Section */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-600 mb-2">
                  Restaurant Image
                </Text>
                {formData.restaurant.image_url ||
                formData.restaurant.image_local_uri ? (
                  <View className="relative">
                    <Image
                      source={{
                        uri:
                          formData.restaurant.image_local_uri ||
                          formData.restaurant.image_url ||
                          '',
                      }}
                      className="w-full h-48 rounded-lg"
                      resizeMode="cover"
                    />
                    <IconButton
                      icon="close"
                      size={20}
                      className="absolute top-2 right-2 bg-white rounded-full"
                      onPress={removeImage}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={pickImage}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 items-center justify-center h-48"
                  >
                    <IconButton icon="camera" size={32} />
                    <Text className="text-gray-600 mt-2">
                      Tap to upload image
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                label="Name"
                value={formData.restaurant.name}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    restaurant: { ...formData.restaurant, name: text },
                  })
                }
                className="mb-4"
                mode="flat"
              />

              <TextInput
                label="Description"
                value={formData.restaurant.description || ''}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    restaurant: { ...formData.restaurant, description: text },
                  })
                }
                className="mb-4"
                mode="flat"
              />

              <TextInput
                label="Cuisine Type"
                value={formData.restaurant.cuisine_type || ''}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    restaurant: { ...formData.restaurant, cuisine_type: text },
                  })
                }
                className="mb-4"
                mode="flat"
              />

              <TextInput
                label="Tier"
                value={formData.restaurant.tier || ''}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    restaurant: { ...formData.restaurant, tier: text },
                  })
                }
                className="mb-4"
                mode="flat"
              />

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-600 mb-2">
                  Address Details
                </Text>
                <TextInput
                  label="Street Address"
                  value={formData.address.address || ''}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, address: text },
                    })
                  }
                  className="mb-2"
                  mode="flat"
                />
                <View className="flex-row gap-4 mb-2">
                  <TextInput
                    label="Postal Code"
                    value={formData.address.postal_code?.toString() || ''}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          postal_code: text ? parseInt(text) : null,
                        },
                      })
                    }
                    keyboardType="numeric"
                    className="flex-1"
                    mode="flat"
                  />
                  <TextInput
                    label="City"
                    value={formData.address.city || ''}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: text },
                      })
                    }
                    className="flex-1"
                    mode="flat"
                  />
                </View>
                <View className="flex-row gap-4">
                  <TextInput
                    label="State"
                    value={formData.address.state || ''}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: text },
                      })
                    }
                    className="flex-1"
                    mode="flat"
                  />
                  <TextInput
                    label="Country"
                    value={formData.address.country}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, country: text },
                      })
                    }
                    className="flex-1"
                    mode="flat"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-600 mb-2">
                  Opening Hours
                </Text>
                <View className="flex-row gap-4">
                  <TextInput
                    label="From"
                    value={formData.opening_hours.from}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        opening_hours: {
                          ...formData.opening_hours,
                          from: text,
                        },
                      })
                    }
                    placeholder="HH:MM"
                    className="flex-1"
                    mode="flat"
                  />
                  <TextInput
                    label="To"
                    value={formData.opening_hours.to}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        opening_hours: { ...formData.opening_hours, to: text },
                      })
                    }
                    placeholder="HH:MM"
                    className="flex-1"
                    mode="flat"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-600 mb-2">
                  Lunch Hours
                </Text>
                <View className="flex-row gap-4">
                  <TextInput
                    label="From"
                    value={formData.lunch_hours.from}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        lunch_hours: { ...formData.lunch_hours, from: text },
                      })
                    }
                    placeholder="HH:MM"
                    className="flex-1"
                    mode="flat"
                  />
                  <TextInput
                    label="To"
                    value={formData.lunch_hours.to}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        lunch_hours: { ...formData.lunch_hours, to: text },
                      })
                    }
                    placeholder="HH:MM"
                    className="flex-1"
                    mode="flat"
                  />
                </View>
              </View>
            </ScrollView>

            <View className="flex-row justify-end items-center gap-3 p-4 border-t border-gray-200">
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
