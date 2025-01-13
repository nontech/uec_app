import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Tables } from '../../supabase/types';
import { Button, Input, Chip, Tab, TabView } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

type MenuItem = Tables<'menu_items'>;
type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export default function ManageMenuScreen() {
  const { session } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    days: [] as DayOfWeek[],
  });
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Animation value for form slide
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showAddForm) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 20,
        friction: 7,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 20,
        friction: 7,
      }).start();
    }
  }, [showAddForm]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchRestaurantId();
    }
  }, [session]);

  useEffect(() => {
    if (restaurantId) {
      loadMenuItems();
    }
  }, [restaurantId]);

  const fetchRestaurantId = async () => {
    const { data: userData } = await supabase
      .from('app_users')
      .select('restaurant_id')
      .eq('id', session?.user?.id)
      .single();

    if (userData?.restaurant_id) {
      setRestaurantId(userData.restaurant_id);
    }
  };

  const loadMenuItems = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (error) {
      console.error('Error loading menu items:', error);
      return;
    }

    setMenuItems(data || []);
  };

  const addMenuItem = async () => {
    if (!restaurantId) return;

    const { error } = await supabase.from('menu_items').insert({
      name: newItem.name,
      description: newItem.description,
      price: newItem.price,
      days: newItem.days.map((day) => day.toLowerCase()),
      restaurant_id: restaurantId,
      is_available: true,
    });

    if (error) {
      console.error('Error adding menu item:', error);
      return;
    }

    setNewItem({
      name: '',
      description: '',
      price: '',
      days: [],
    });
    setShowAddForm(false);
    loadMenuItems();
  };

  const deleteMenuItem = async (id: string) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: false })
      .eq('id', id);

    if (error) {
      console.error('Error updating menu item:', error);
      return;
    }

    loadMenuItems();
  };

  const removeDayFromMenuItem = async (itemId: string, dayToRemove: string) => {
    const item = menuItems.find((item) => item.id === itemId);
    if (!item || !item.days) return;

    const updatedDays = item.days.filter(
      (day) => day.toLowerCase() !== dayToRemove.toLowerCase()
    );

    const { error } = await supabase
      .from('menu_items')
      .update({ days: updatedDays })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating menu item:', error);
      return;
    }

    loadMenuItems();
  };

  const toggleDay = (day: DayOfWeek) => {
    setNewItem((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const days: DayOfWeek[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  const dayShortForms = {
    All: 'All',
    Monday: 'M',
    Tuesday: 'T',
    Wednesday: 'W',
    Thursday: 'TH',
    Friday: 'F',
  };

  const allDays = ['All', ...days] as const;

  const getMenuItemsForDay = (day: string) => {
    if (day === 'All') return menuItems.filter((item) => item.is_available);
    return menuItems.filter(
      (item) =>
        item.is_available &&
        item.days?.map((d) => d.toLowerCase()).includes(day.toLowerCase())
    );
  };

  const updateMenuItem = async () => {
    if (!editingItem?.id) return;

    const { error } = await supabase
      .from('menu_items')
      .update({
        name: editingItem.name,
        description: editingItem.description,
        price: editingItem.price,
        days: editingItem.days,
        is_available: editingItem.is_available,
      })
      .eq('id', editingItem.id);

    if (error) {
      console.error('Error updating menu item:', error);
      return;
    }

    setEditingItem(null);
    loadMenuItems();
  };

  return (
    <View className="flex-1 bg-[#1C1C1E]">
      <View className="flex-1 p-4">
        <TouchableOpacity
          className="bg-[#2C2C2E] p-4 rounded-lg mb-4 shadow-sm"
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons
              name={showAddForm ? 'remove-circle' : 'add-circle'}
              size={24}
              color="#6B4EFF"
            />
            <Text className="ml-2 text-base font-medium text-[#6B4EFF]">
              {showAddForm ? 'Cancel Adding Item' : 'Add New Menu Item'}
            </Text>
          </View>
        </TouchableOpacity>

        <Animated.View
          className="mb-5 bg-[#2C2C2E] p-4 rounded-lg shadow-sm"
          style={[
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
              opacity: slideAnim,
              display: showAddForm ? 'flex' : 'none',
            },
          ]}
        >
          <Input
            placeholder="Item Name"
            value={newItem.name}
            onChangeText={(text) => setNewItem({ ...newItem, name: text })}
            leftIcon={
              <Ionicons
                name="fast-food"
                size={20}
                color={Colors.text.secondary}
              />
            }
            inputStyle={{ color: Colors.text.primary }}
            placeholderTextColor={Colors.text.secondary}
            labelStyle={{ color: Colors.text.primary }}
          />
          <Input
            placeholder="Description"
            value={newItem.description}
            onChangeText={(text) =>
              setNewItem({ ...newItem, description: text })
            }
            multiline
            leftIcon={
              <Ionicons
                name="document-text"
                size={20}
                color={Colors.text.secondary}
              />
            }
            inputStyle={{ color: Colors.text.primary }}
            placeholderTextColor={Colors.text.secondary}
            labelStyle={{ color: Colors.text.primary }}
          />
          <Input
            placeholder="Price"
            value={newItem.price}
            onChangeText={(text) => setNewItem({ ...newItem, price: text })}
            keyboardType="numeric"
            leftIcon={
              <Ionicons
                name="pricetag"
                size={20}
                color={Colors.text.secondary}
              />
            }
            label="Price (€)"
            inputStyle={{ color: Colors.text.primary }}
            placeholderTextColor={Colors.text.secondary}
            labelStyle={{ color: Colors.text.primary }}
          />

          <Text className="text-base font-medium text-[#999999] mb-2 px-2.5">
            Available Days
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {days.map((day) => (
              <Chip
                key={day}
                title={day}
                type={newItem.days.includes(day) ? 'solid' : 'outline'}
                onPress={() => toggleDay(day)}
                containerStyle={{ marginRight: 4, marginBottom: 4 }}
                color="#6B4EFF"
              />
            ))}
          </View>

          <Button
            title="Add Menu Item"
            onPress={addMenuItem}
            disabled={!newItem.name || !newItem.price || !newItem.days.length}
            icon={
              <Ionicons
                name="add-circle"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
            }
            buttonStyle={{
              backgroundColor: '#6B4EFF',
              borderRadius: 8,
              paddingVertical: 12,
            }}
            disabledStyle={{ backgroundColor: '#3C3C3E' }}
          />
        </Animated.View>

        <View className="flex-1 bg-[#2C2C2E] rounded-lg shadow-sm">
          <Tab
            value={tabIndex}
            onChange={setTabIndex}
            indicatorStyle={{ backgroundColor: '#6B4EFF' }}
            containerStyle={{ height: 48 }}
          >
            {allDays.map((day) => (
              <Tab.Item
                key={day}
                title={dayShortForms[day]}
                titleStyle={(active) => ({
                  color: active ? '#6B4EFF' : Colors.text.secondary,
                  fontSize: 14,
                  paddingHorizontal: 2,
                })}
              />
            ))}
          </Tab>

          <View className="flex-1">
            <TabView
              value={tabIndex}
              onChange={setTabIndex}
              animationType="spring"
            >
              {allDays.map((day) => (
                <TabView.Item key={day} className="w-full h-full">
                  <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={true}
                  >
                    <View className="px-4 pt-4">
                      <View className="gap-3">
                        {getMenuItemsForDay(day).map((item) => (
                          <View
                            key={item.id}
                            className="flex-row justify-between items-center p-4 bg-[#3C3C3E] rounded-lg border border-[#4C4C4E]"
                          >
                            {editingItem?.id === item.id ? (
                              <View className="w-full py-2">
                                <Input
                                  placeholder="Item Name"
                                  value={editingItem.name || ''}
                                  onChangeText={(text) =>
                                    setEditingItem({
                                      ...editingItem,
                                      name: text,
                                    })
                                  }
                                  leftIcon={
                                    <Ionicons
                                      name="fast-food"
                                      size={20}
                                      color={Colors.text.secondary}
                                    />
                                  }
                                  inputStyle={{ color: Colors.text.primary }}
                                  placeholderTextColor={Colors.text.secondary}
                                  labelStyle={{ color: Colors.text.primary }}
                                />
                                <Input
                                  placeholder="Description"
                                  value={editingItem.description || ''}
                                  onChangeText={(text) =>
                                    setEditingItem({
                                      ...editingItem,
                                      description: text,
                                    })
                                  }
                                  multiline
                                  leftIcon={
                                    <Ionicons
                                      name="document-text"
                                      size={20}
                                      color={Colors.text.secondary}
                                    />
                                  }
                                  inputStyle={{ color: Colors.text.primary }}
                                  placeholderTextColor={Colors.text.secondary}
                                  labelStyle={{ color: Colors.text.primary }}
                                />
                                <Input
                                  placeholder="Price"
                                  value={editingItem.price || ''}
                                  onChangeText={(text) =>
                                    setEditingItem({
                                      ...editingItem,
                                      price: text,
                                    })
                                  }
                                  keyboardType="numeric"
                                  leftIcon={
                                    <Ionicons
                                      name="pricetag"
                                      size={20}
                                      color={Colors.text.secondary}
                                    />
                                  }
                                  label="Price (€)"
                                  inputStyle={{ color: Colors.text.primary }}
                                  placeholderTextColor={Colors.text.secondary}
                                  labelStyle={{ color: Colors.text.primary }}
                                />

                                <Text className="text-base font-medium text-[#999999] mb-2 px-2.5">
                                  Available Days
                                </Text>
                                <View className="flex-row flex-wrap gap-2 mb-5">
                                  {days.map((dayOption) => (
                                    <Chip
                                      key={dayOption}
                                      title={dayOption}
                                      type={
                                        editingItem.days
                                          ?.map((d) => d.toLowerCase())
                                          .includes(dayOption.toLowerCase())
                                          ? 'solid'
                                          : 'outline'
                                      }
                                      onPress={() => {
                                        const currentDays =
                                          editingItem.days || [];
                                        const dayLower =
                                          dayOption.toLowerCase();
                                        const newDays = currentDays
                                          .map((d) => d.toLowerCase())
                                          .includes(dayLower)
                                          ? currentDays.filter(
                                              (d) =>
                                                d.toLowerCase() !== dayLower
                                            )
                                          : [...currentDays, dayLower];
                                        setEditingItem({
                                          ...editingItem,
                                          days: newDays,
                                        });
                                      }}
                                      containerStyle={{
                                        marginRight: 4,
                                        marginBottom: 4,
                                      }}
                                      color="#6B4EFF"
                                    />
                                  ))}
                                </View>
                                <View className="flex-row justify-end gap-2 mt-4">
                                  <Button
                                    title="Cancel"
                                    onPress={() => setEditingItem(null)}
                                    buttonStyle={{
                                      backgroundColor: '#3C3C3E',
                                      paddingHorizontal: 16,
                                    }}
                                  />
                                  <Button
                                    title="Save Changes"
                                    onPress={updateMenuItem}
                                    disabled={
                                      !editingItem?.name ||
                                      !editingItem?.price ||
                                      !editingItem?.days?.length
                                    }
                                    buttonStyle={{
                                      backgroundColor: '#6B4EFF',
                                      paddingHorizontal: 16,
                                    }}
                                    disabledStyle={{
                                      backgroundColor: '#3C3C3E',
                                    }}
                                  />
                                </View>
                              </View>
                            ) : (
                              <>
                                <View className="flex-1 mr-4">
                                  <Text className="text-base font-bold text-white mb-1">
                                    {item.name}
                                  </Text>
                                  <Text className="text-sm text-[#999999] mb-1">
                                    {item.description}
                                  </Text>
                                  <Text className="text-sm font-medium text-[#6B4EFF] mb-0.5">
                                    €{item.price}
                                  </Text>
                                  {day === 'All' && (
                                    <View className="flex-row flex-wrap gap-1 mt-2">
                                      {item.days?.map((availableDay) => (
                                        <Chip
                                          key={availableDay}
                                          title={availableDay}
                                          type="solid"
                                          containerStyle={{
                                            marginRight: 4,
                                            marginBottom: 4,
                                          }}
                                          color="#6B4EFF"
                                        />
                                      ))}
                                    </View>
                                  )}
                                </View>
                                <View className="flex-row gap-2">
                                  {day === 'All' ? (
                                    <>
                                      <Button
                                        icon={
                                          <Ionicons
                                            name="create-outline"
                                            size={20}
                                            color="#6B4EFF"
                                          />
                                        }
                                        onPress={() => setEditingItem(item)}
                                        buttonStyle={{
                                          backgroundColor: 'transparent',
                                          padding: 10,
                                          minWidth: 40,
                                          minHeight: 40,
                                        }}
                                      />
                                      <Button
                                        icon={
                                          <Ionicons
                                            name="trash-outline"
                                            size={20}
                                            color="#EF4444"
                                          />
                                        }
                                        onPress={() =>
                                          item.id && deleteMenuItem(item.id)
                                        }
                                        buttonStyle={{
                                          backgroundColor: 'transparent',
                                          padding: 10,
                                          minWidth: 40,
                                          minHeight: 40,
                                        }}
                                      />
                                    </>
                                  ) : (
                                    <Button
                                      icon={
                                        <Ionicons
                                          name="close"
                                          size={20}
                                          color={Colors.text.secondary}
                                        />
                                      }
                                      onPress={() =>
                                        item.id &&
                                        removeDayFromMenuItem(item.id, day)
                                      }
                                      buttonStyle={{
                                        backgroundColor: 'transparent',
                                        padding: 10,
                                        minWidth: 40,
                                        minHeight: 40,
                                      }}
                                    />
                                  )}
                                </View>
                              </>
                            )}
                          </View>
                        ))}
                        {getMenuItemsForDay(day).length === 0 && (
                          <Text className="text-center text-[#999999] text-base mt-5">
                            No menu items{' '}
                            {day === 'All' ? 'available' : `for ${day}`}
                          </Text>
                        )}
                      </View>
                    </View>
                  </ScrollView>
                </TabView.Item>
              ))}
            </TabView>
          </View>
        </View>
      </View>
    </View>
  );
}
