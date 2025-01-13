import { View } from 'react-native';
import { Text } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import {
  DataTable,
  Button,
  Modal,
  Portal,
  TextInput,
  SegmentedButtons,
  Chip,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Database } from '../../../../supabase/types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type MenuItemInput = Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>;
type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export default function MenuManagement() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null
  );
  const [formData, setFormData] = useState<MenuItemInput>({
    restaurant_id: id,
    name: '',
    description: '',
    price: null,
    category: '',
    days: [],
    is_available: true,
  });

  useEffect(() => {
    fetchRestaurantDetails();
    fetchMenuItems();
  }, [id]);

  const fetchRestaurantDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id)
        .order('category')
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .insert([{ ...formData, restaurant_id: id }]);

      if (error) throw error;

      setVisible(false);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      console.error('Error creating menu item:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedMenuItem?.id) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .update(formData)
        .eq('id', selectedMenuItem.id);

      if (error) throw error;

      setVisible(false);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      fetchMenuItems();
      setDeleteConfirmVisible(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const resetForm = () => {
    setSelectedMenuItem(null);
    setFormData({
      restaurant_id: id,
      name: '',
      description: '',
      price: null,
      category: '',
      days: [],
      is_available: true,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setVisible(true);
  };

  const openEditModal = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setFormData({
      restaurant_id: id,
      name: menuItem.name || '',
      description: menuItem.description || '',
      price: menuItem.price,
      category: menuItem.category || '',
      days: menuItem.days || [],
      is_available: menuItem.is_available ?? true,
    });
    setVisible(true);
  };

  const openDeleteConfirm = (id: string) => {
    setItemToDelete(id);
    setDeleteConfirmVisible(true);
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => {
      const currentDays = prev.days || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day];
      return { ...prev, days: newDays };
    });
  };

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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
        <View>
          <Text className="text-2xl font-semibold text-gray-800">
            Menu Management
          </Text>
          <Text className="text-base text-gray-600 mt-1">
            {restaurant?.name}
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={openCreateModal}
          className="bg-blue-500"
        >
          Add Menu Item
        </Button>
      </View>

      <DataTable className="bg-white">
        <DataTable.Header>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Name</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Category</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Days</Text>
          </DataTable.Title>
          <DataTable.Title numeric>
            <Text className="text-sm font-medium text-gray-600">Price</Text>
          </DataTable.Title>
          <View className="w-4" />
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Status</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Actions</Text>
          </DataTable.Title>
        </DataTable.Header>

        {menuItems.map((item) => (
          <DataTable.Row key={item.id}>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">{item.name}</Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">{item.category}</Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {item.days?.join(', ') || '-'}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell numeric>
              <Text className="text-sm text-gray-800">€{item.price}</Text>
            </DataTable.Cell>
            <View className="w-4" />
            <DataTable.Cell>
              <Text
                className={`text-sm ${
                  item.is_available ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {item.is_available ? 'Available' : 'Unavailable'}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <View className="flex-row gap-2">
                <Button
                  mode="outlined"
                  onPress={() => openEditModal(item)}
                  className="border-blue-500"
                  textColor="#3b82f6"
                >
                  Edit
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => openDeleteConfirm(item.id)}
                  className="border-red-500"
                  textColor="#ef4444"
                >
                  Delete
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
              {selectedMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </Text>

            <TextInput
              label="Name"
              value={formData.name ?? ''}
              onChangeText={(text: string) =>
                setFormData({ ...formData, name: text || null })
              }
              className="mb-4"
              mode="flat"
            />

            <TextInput
              label="Description"
              value={formData.description ?? ''}
              onChangeText={(text: string) =>
                setFormData({ ...formData, description: text || null })
              }
              className="mb-4"
              mode="flat"
              multiline
              numberOfLines={3}
            />

            <TextInput
              label="Category"
              value={formData.category ?? ''}
              onChangeText={(text: string) =>
                setFormData({ ...formData, category: text || null })
              }
              className="mb-4"
              mode="flat"
            />

            <Text className="text-sm font-medium text-gray-600 mb-2">
              Available Days
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {DAYS_OF_WEEK.map((day) => (
                <Chip
                  key={day}
                  selected={formData.days?.includes(day)}
                  onPress={() => handleDayToggle(day)}
                  className={formData.days?.includes(day) ? 'bg-blue-100' : ''}
                >
                  {day}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Price"
              value={formData.price?.toString() || ''}
              onChangeText={(text: string) =>
                setFormData({
                  ...formData,
                  price: text || null,
                })
              }
              keyboardType="numeric"
              className="mb-4"
              mode="flat"
            />

            <SegmentedButtons
              value={formData.is_available ? 'available' : 'unavailable'}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  is_available: value === 'available',
                })
              }
              buttons={[
                { value: 'available', label: 'Available' },
                { value: 'unavailable', label: 'Unavailable' },
              ]}
              style={{ marginBottom: 16 }}
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
                onPress={selectedMenuItem ? handleUpdate : handleCreate}
                className="bg-blue-500"
              >
                {selectedMenuItem ? 'Save Changes' : 'Create Item'}
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
              Confirm Deletion
            </Text>
            <Text className="text-base text-gray-600 mb-6">
              Are you sure you want to delete this menu item? This action cannot
              be undone.
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
                onPress={() => itemToDelete && handleDelete(itemToDelete)}
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
