import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import DeviceInfo from 'react-native-device-info';

const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const customStorage = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error reading storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting storage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },
};

let supabaseInstance: SupabaseClient | null = null;

const extractIPv4FromIPv6 = (ipv6: string): string | null => {
  // Common IPv6 formats that contain IPv4:
  // ::ffff:192.168.1.1
  // ::ffff:c0a8:101 (hex format)

  // Check for ::ffff: prefix with decimal format
  const match = ipv6.match(/:(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/i);
  if (match) {
    return match[1];
  }

  // Check for hex format
  const hexMatch = ipv6.match(/:(?:ffff:)?([0-9a-f]{4}):([0-9a-f]{4})$/i);
  if (hexMatch) {
    // Convert from hex to decimal
    const hex1 = parseInt(hexMatch[1], 16);
    const hex2 = parseInt(hexMatch[2], 16);
    const part1 = (hex1 >> 8) & 0xff;
    const part2 = hex1 & 0xff;
    const part3 = (hex2 >> 8) & 0xff;
    const part4 = hex2 & 0xff;
    return `${part1}.${part2}.${part3}.${part4}`;
  }

  return null;
};

const initSupabase = async () => {
  const deviceInfo = extractIPv4FromIPv6(await DeviceInfo.getIpAddress());
  const url =
    Platform.OS === 'web'
      ? 'http://localhost:54321'
      : `http://${deviceInfo}:54321`;

  const client = createClient(url, supabaseAnonKey, {
    auth: {
      storage: customStorage,
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
