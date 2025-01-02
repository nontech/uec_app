import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabaseUrl = Platform.select({
  ios: 'http://127.0.0.1:54321',
  android: 'http://10.0.2.2:54321',
  default: 'http://127.0.0.1:54321',
});

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
  const client = createClient(supabaseUrl, supabaseAnonKey, {
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
