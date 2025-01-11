import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Tables } from '../../supabase/types';
import { Button, Input, Chip, Tab, TabView } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';

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
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddForm(!showAddForm)}
      >
        <View style={styles.addButtonContent}>
          <Ionicons
            name={showAddForm ? 'remove-circle' : 'add-circle'}
            size={24}
            color="#007AFF"
          />
          <Text style={styles.addButtonText}>
            {showAddForm ? 'Cancel Adding Item' : 'Add New Menu Item'}
          </Text>
        </View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.addItemContainer,
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
          leftIcon={<Ionicons name="fast-food" size={20} color="#86939e" />}
        />
        <Input
          placeholder="Description"
          value={newItem.description}
          onChangeText={(text) => setNewItem({ ...newItem, description: text })}
          multiline
          leftIcon={<Ionicons name="document-text" size={20} color="#86939e" />}
        />
        <Input
          placeholder="Price"
          value={newItem.price}
          onChangeText={(text) => setNewItem({ ...newItem, price: text })}
          keyboardType="numeric"
          leftIcon={<Ionicons name="pricetag" size={20} color="#86939e" />}
          label="Price (€)"
        />

        <Text style={styles.daysLabel}>Available Days</Text>
        <View style={styles.daysContainer}>
          {days.map((day) => (
            <Chip
              key={day}
              title={day}
              type={newItem.days.includes(day) ? 'solid' : 'outline'}
              onPress={() => toggleDay(day)}
              containerStyle={styles.dayChip}
              color="#007AFF"
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
          buttonStyle={styles.submitButton}
          disabledStyle={styles.submitButtonDisabled}
        />
      </Animated.View>

      <View style={styles.previewContainer}>
        <Tab
          value={tabIndex}
          onChange={setTabIndex}
          indicatorStyle={{ backgroundColor: '#007AFF' }}
          scrollable
        >
          {allDays.map((day, index) => (
            <Tab.Item
              key={day}
              title={day}
              titleStyle={(active) => ({
                color: active ? '#007AFF' : '#666',
                fontSize: 14,
              })}
            />
          ))}
        </Tab>

        <TabView value={tabIndex} onChange={setTabIndex} animationType="spring">
          {allDays.map((day, index) => (
            <TabView.Item key={day} style={styles.tabContent}>
              <View style={styles.menuList}>
                {getMenuItemsForDay(day).map((item) => (
                  <View key={item.id} style={styles.menuItem}>
                    {editingItem?.id === item.id ? (
                      <View style={styles.editItemForm}>
                        <Input
                          placeholder="Item Name"
                          value={editingItem.name || ''}
                          onChangeText={(text) =>
                            setEditingItem({ ...editingItem, name: text })
                          }
                          leftIcon={
                            <Ionicons
                              name="fast-food"
                              size={20}
                              color="#86939e"
                            />
                          }
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
                              color="#86939e"
                            />
                          }
                        />
                        <Input
                          placeholder="Price"
                          value={editingItem.price || ''}
                          onChangeText={(text) =>
                            setEditingItem({ ...editingItem, price: text })
                          }
                          keyboardType="numeric"
                          leftIcon={
                            <Ionicons
                              name="pricetag"
                              size={20}
                              color="#86939e"
                            />
                          }
                          label="Price (€)"
                        />

                        <Text style={styles.daysLabel}>Available Days</Text>
                        <View style={styles.daysContainer}>
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
                                const currentDays = editingItem.days || [];
                                const dayLower = dayOption.toLowerCase();
                                const newDays = currentDays
                                  .map((d) => d.toLowerCase())
                                  .includes(dayLower)
                                  ? currentDays.filter(
                                      (d) => d.toLowerCase() !== dayLower
                                    )
                                  : [...currentDays, dayLower];
                                setEditingItem({
                                  ...editingItem,
                                  days: newDays,
                                });
                              }}
                              containerStyle={styles.dayChip}
                              color="#007AFF"
                            />
                          ))}
                        </View>
                        <View style={styles.editButtons}>
                          <Button
                            title="Cancel"
                            onPress={() => setEditingItem(null)}
                            buttonStyle={styles.cancelButton}
                          />
                          <Button
                            title="Save Changes"
                            onPress={updateMenuItem}
                            disabled={
                              !editingItem?.name ||
                              !editingItem?.price ||
                              !editingItem?.days?.length
                            }
                            buttonStyle={styles.saveButton}
                            disabledStyle={styles.submitButtonDisabled}
                          />
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={styles.menuItemContent}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemDescription}>
                            {item.description}
                          </Text>
                          <Text style={styles.itemPrice}>€{item.price}</Text>
                          {day === 'All' && (
                            <View style={styles.itemDays}>
                              {item.days?.map((availableDay) => (
                                <Chip
                                  key={availableDay}
                                  title={availableDay}
                                  type="solid"
                                  containerStyle={[
                                    styles.dayChip,
                                    { marginTop: 8 },
                                  ]}
                                  color="#007AFF"
                                />
                              ))}
                            </View>
                          )}
                        </View>
                        <View style={styles.itemActions}>
                          {day === 'All' ? (
                            <>
                              <Button
                                icon={
                                  <Ionicons
                                    name="create-outline"
                                    size={20}
                                    color="#007AFF"
                                  />
                                }
                                onPress={() => setEditingItem(item)}
                                buttonStyle={styles.editButton}
                              />
                              <Button
                                icon={
                                  <Ionicons
                                    name="trash-outline"
                                    size={20}
                                    color="#ff4444"
                                  />
                                }
                                onPress={() =>
                                  item.id && deleteMenuItem(item.id)
                                }
                                buttonStyle={styles.deleteItemButton}
                              />
                            </>
                          ) : (
                            <Button
                              icon={
                                <Ionicons name="close" size={20} color="#666" />
                              }
                              onPress={() =>
                                item.id && removeDayFromMenuItem(item.id, day)
                              }
                              buttonStyle={styles.deleteButton}
                            />
                          )}
                        </View>
                      </>
                    )}
                  </View>
                ))}
                {getMenuItemsForDay(day).length === 0 && (
                  <Text style={styles.noItemsText}>
                    No menu items {day === 'All' ? 'available' : `for ${day}`}
                  </Text>
                )}
              </View>
            </TabView.Item>
          ))}
        </TabView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  dayChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  daysLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#86939e',
    paddingHorizontal: 10,
  },
  addItemContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1c1c1e',
  },
  tabContent: {
    width: '100%',
    paddingTop: 16,
  },
  menuList: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  menuItemContent: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: '#888',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    padding: 10,
    minWidth: 40,
    minHeight: 40,
  },
  noItemsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  editItemForm: {
    width: '100%',
    paddingVertical: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#666',
    paddingHorizontal: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
  },
  itemDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: 'transparent',
    padding: 10,
    minWidth: 40,
    minHeight: 40,
  },
  deleteItemButton: {
    backgroundColor: 'transparent',
    padding: 10,
    minWidth: 40,
    minHeight: 40,
  },
});
