import { Platform } from 'react-native';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
  PermissionStatus,
  isAvailable,
} from 'expo-tracking-transparency';

// Define the tracking permission status types
type TrackingStatus =
  | 'unavailable'
  | 'denied'
  | 'authorized'
  | 'not-determined';

/**
 * Checks the current tracking permission status
 * @returns The permission response with status
 */
export const getTrackingStatus = async () => {
  if (Platform.OS !== 'ios' || !isAvailable()) {
    return {
      status: 'granted' as PermissionStatus,
      granted: true,
      canAskAgain: false,
    };
  }

  try {
    const permissionResponse = await getTrackingPermissionsAsync();
    return permissionResponse;
  } catch (error) {
    console.error('Error getting tracking permissions:', error);
    return {
      status: 'unavailable' as PermissionStatus,
      granted: false,
      canAskAgain: false,
    };
  }
};

/**
 * Requests tracking permission from the user
 * @returns The permission response after the request
 */
export const requestTrackingPermission = async () => {
  if (Platform.OS !== 'ios' || !isAvailable()) {
    return {
      status: 'granted' as PermissionStatus,
      granted: true,
      canAskAgain: false,
    };
  }

  try {
    const permissionResponse = await requestTrackingPermissionsAsync();
    return permissionResponse;
  } catch (error) {
    console.error('Error requesting tracking permissions:', error);
    return {
      status: 'unavailable' as PermissionStatus,
      granted: false,
      canAskAgain: false,
    };
  }
};

/**
 * Checks if tracking is allowed
 * @returns True if tracking is allowed, false otherwise
 */
export const isTrackingAllowed = async (): Promise<boolean> => {
  const { granted } = await getTrackingStatus();
  return granted;
};
