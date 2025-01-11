import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Tables } from '../../supabase/types';

type Restaurant = Tables<'restaurants'> & {
  opening_hours_range: Tables<'hours_range'> | null;
  lunch_hours_range: Tables<'hours_range'> | null;
  address_details: Tables<'addresses'> | null;
};

export default function DashboardScreen() {
  const { session } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadRestaurantInfo();
    }
  }, [session]);

  const loadRestaurantInfo = async () => {
    const { data: userData } = await supabase
      .from('app_users')
      .select('restaurant_id')
      .eq('id', session?.user?.id)
      .single();

    if (!userData?.restaurant_id) {
      console.error('No restaurant ID found for user');
      return;
    }

    const { data, error } = await supabase
      .from('restaurants')
      .select(
        `
        *,
        opening_hours_range: opening_hours (
          from,
          to
        ),
        lunch_hours_range: lunch_hours (
          from,
          to
        ),
        address_details: address (
          address,
          city,
          state,
          country,
          postal_code
        )
      `
      )
      .eq('id', userData.restaurant_id)
      .single();

    if (error) {
      console.error('Error loading restaurant info:', error);
      return;
    }

    setRestaurant(data);
  };

  const formatHours = (hours: Tables<'hours_range'> | null) => {
    if (!hours?.from || !hours?.to) return 'Not specified';

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'pm' : 'am';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    return `${formatTime(hours.from)} - ${formatTime(hours.to)}`;
  };

  const formatAddress = (address: Tables<'addresses'> | null) => {
    if (!address) return 'Address not specified';
    const parts = [
      address.address,
      address.city,
      address.state,
      address.postal_code,
      address.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.restaurantName}>
          {restaurant?.name || 'Loading...'}
        </Text>
        <Text style={styles.cuisine}>{restaurant?.cuisine_type}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>
          {restaurant?.description || 'No description available'}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Hours</Text>
        <Text style={styles.infoText}>
          Opening Hours: {formatHours(restaurant?.opening_hours_range || null)}
        </Text>
        <Text style={styles.infoText}>
          Lunch Hours: {formatHours(restaurant?.lunch_hours_range || null)}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.infoText}>
          {formatAddress(restaurant?.address_details || null)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 24,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 18,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  infoText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 4,
  },
});
