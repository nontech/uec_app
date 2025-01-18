import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

let supabaseAnonKey = '';
let supabaseURL = '';

if (__DEV__) {
  supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV || '';
  supabaseURL = Platform.select({
    ios: 'http://127.0.0.1:44321',
    android: 'http://10.0.2.2:44321',
    default: 'http://127.0.0.1:44321',
  });
} else {
  supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  supabaseURL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
}

// Memory fallback storage for SSR
const memoryStorage: { [key: string]: string } = {};

// Storage implementation that works in all environments
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Return from memory if we're in SSR
      if (typeof window === 'undefined') {
        return memoryStorage[key] || null;
      }

      // Use localStorage for web
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }

      // Use AsyncStorage for React Native
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage error:', error);
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // Store in memory if we're in SSR
      if (typeof window === 'undefined') {
        memoryStorage[key] = value;
        return;
      }

      // Use localStorage for web
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }

      // Use AsyncStorage for React Native
      await AsyncStorage.setItem(key, value);
      // Also update memory storage as backup
      memoryStorage[key] = value;
    } catch (error) {
      console.error('Storage error:', error);
      // Fallback to memory storage
      memoryStorage[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      // Remove from memory if we're in SSR
      if (typeof window === 'undefined') {
        delete memoryStorage[key];
        return;
      }

      // Use localStorage for web
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }

      // Use AsyncStorage for React Native
      await AsyncStorage.removeItem(key);
      // Also remove from memory storage
      delete memoryStorage[key];
    } catch (error) {
      console.error('Storage error:', error);
      // Ensure it's removed from memory storage
      delete memoryStorage[key];
    }
  },
};

let supabaseInstance: SupabaseClient | null = null;

const initSupabase = async () => {
  const client = createClient(supabaseURL, supabaseAnonKey, {
    auth: {
      storage: customStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return client;
};

// Initialize Supabase
initSupabase().then((client) => {
  supabaseInstance = client;
});

export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop: keyof SupabaseClient) => {
    if (!supabaseInstance) {
      throw new Error('Supabase client not initialized');
    }
    return supabaseInstance[prop];
  },
});
