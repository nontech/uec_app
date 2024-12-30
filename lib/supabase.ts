import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabaseUrl = Platform.select({
  ios: 'http://127.0.0.1:54321',
  android: 'http://10.0.2.2:54321',
  default: 'http://127.0.0.1:54321',
});

// Check if we're in a web environment with localStorage available
const isWebWithStorage = () => {
  try {
    return typeof window !== 'undefined' && window.localStorage !== undefined;
  } catch (e) {
    return false;
  }
};

// Cross-platform storage implementation
const storage = {
  setItem: async (key: string, value: string) => {
    try {
      if (isWebWithStorage()) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting storage:', error);
    }
  },
  getItem: async (key: string) => {
    try {
      if (isWebWithStorage()) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error reading storage:', error);
      return null;
    }
  },
  removeItem: async (key: string) => {
    try {
      if (isWebWithStorage()) {
        window.localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },
};

let supabaseInstance: SupabaseClient | null = null;

const initSupabase = async () => {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        client.auth.startAutoRefresh();
      } else {
        client.auth.stopAutoRefresh();
      }
    });
  }

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
