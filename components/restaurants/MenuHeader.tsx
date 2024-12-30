import React from 'react';
import { View, Text } from 'react-native';
import { getDayInGerman } from '../../utils/dateUtils';

export const MenuHeader = () => (
  <>
    <View className="px-4 pt-6 pb-4">
      <Text className="text-2xl text-center text-gray-700 font-medium">
        LUNCH SPECIAL
      </Text>
    </View>

    <View className="px-4 pb-4">
      <Text className="text-xl text-center text-gray-800">
        {getDayInGerman()}
      </Text>
      <View className="h-[1px] bg-gray-300 my-4" />
    </View>

    <View className="px-4 pb-4">
      <Text className="text-base text-gray-600 mb-4">
        Select to confirm order
      </Text>
    </View>
  </>
);
