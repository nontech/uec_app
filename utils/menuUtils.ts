import { Database } from '../supabase/types';
import { supabase } from '../lib/supabase';
import { getCurrentDay } from './dateUtils';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export const fetchMenuItems = async (
  restaurantId: string
): Promise<MenuItem[]> => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('day', getCurrentDay())
      .order('category');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
};

export const groupMenuItemsByCategory = (menuItems: MenuItem[]) => {
  return menuItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);
};
