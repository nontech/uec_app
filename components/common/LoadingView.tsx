import React from 'react';
import { View, Text } from 'react-native';

interface LoadingViewProps {
  message?: string;
}

export const LoadingView = ({ message = 'Loading...' }: LoadingViewProps) => (
  <View className="flex-1 items-center justify-center bg-white">
    <Text className="text-gray-600">{message}</Text>
  </View>
);
