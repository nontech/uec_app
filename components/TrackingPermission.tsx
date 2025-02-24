import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import { useTracking } from '../lib/hooks/useTracking';

interface TrackingPermissionProps {
  onPermissionResult?: (granted: boolean) => void;
}

export const TrackingPermission: React.FC<TrackingPermissionProps> = ({
  onPermissionResult,
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const {
    isAvailable,
    isPermissionGranted,
    requestPermission,
    checkTrackingPermission,
  } = useTracking();

  useEffect(() => {
    if (isAvailable) {
      checkPermission();
    } else {
      // If tracking is not available (non-iOS devices), consider it granted
      onPermissionResult?.(true);
    }
  }, [isAvailable]);

  useEffect(() => {
    // Notify parent component when permission status changes
    onPermissionResult?.(isPermissionGranted);
  }, [isPermissionGranted, onPermissionResult]);

  const checkPermission = async () => {
    // Check if permission is already granted
    await checkTrackingPermission();

    // If we're on iOS and permission is not granted, show the prompt
    if (Platform.OS === 'ios' && !isPermissionGranted) {
      setShowPrompt(true);
    }
  };

  const handleRequestPermission = async () => {
    await requestPermission();
    setShowPrompt(false);
  };

  if (!showPrompt || !isAvailable) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.promptContainer}>
        <Text style={styles.title}>Allow Tracking?</Text>
        <Text style={styles.description}>
          We collect your name and email address to identify you in our system.
          This information is not used for advertising purposes.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              setShowPrompt(false);
              onPermissionResult?.(false);
            }}
          >
            <Text style={styles.secondaryButtonText}>Not Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleRequestPermission}
          >
            <Text style={styles.primaryButtonText}>Allow</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  promptContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  primaryButton: {
    backgroundColor: '#6B4EFF',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
  },
  secondaryButtonText: {
    color: '#333',
    fontWeight: '600',
  },
});
