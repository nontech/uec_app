import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  getTrackingStatus,
  requestTrackingPermission,
  isTrackingAllowed,
} from '../tracking';

export const useTracking = () => {
  const [isAvailable, setIsAvailable] = useState(Platform.OS === 'ios');
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkTrackingPermission();
  }, []);

  const checkTrackingPermission = async () => {
    setIsLoading(true);
    try {
      const allowed = await isTrackingAllowed();
      setIsPermissionGranted(allowed);
    } catch (error) {
      console.error('Error checking tracking permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const { granted } = await requestTrackingPermission();
      setIsPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting tracking permission:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAvailable,
    isPermissionGranted,
    isLoading,
    requestPermission,
    checkTrackingPermission,
  };
};
