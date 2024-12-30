import React, { FC } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Database } from '../../supabase/types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  selectedItem: MenuItem | null;
}

const ModalHeader = ({ onClose }: { onClose: () => void }) => (
  <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
    <TouchableOpacity onPress={onClose} className="p-2">
      <Ionicons name="close" size={24} color="black" />
    </TouchableOpacity>
    <Text className="text-xl font-semibold">Checkout</Text>
    <View style={{ width: 40 }} />
  </View>
);

const ItemPreview = ({ item }: { item: MenuItem }) => (
  <>
    <Text className="text-xl mb-2">Confirm Payment for</Text>
    <View className="bg-[#FDF7FF] p-4 rounded-lg mb-8">
      <Text className="text-lg font-medium">{item.name}</Text>
      {item.description && (
        <Text className="text-gray-600">{item.description}</Text>
      )}
    </View>
  </>
);

const PaymentSection = () => (
  <View className="flex-1 max-h-[500px] justify-center items-center">
    <View className="w-full max-w-[300px] aspect-square relative">
      <View className="absolute inset-0 bg-[#4CAF50] rounded-full justify-center items-center">
        <Text className="text-white text-xl mb-8">TAP NOW TO PAY</Text>
        <View className="border-2 border-white rounded-full p-6">
          <Ionicons name="wifi" size={48} color="white" />
        </View>
      </View>
    </View>

    <View className="mt-8">
      <Image
        source="https://res.cloudinary.com/dc0tfxkph/image/upload/v1703963191/uec_app/payment-methods.png"
        style={{ width: 200, height: 30 }}
        contentFit="contain"
      />
    </View>
  </View>
);

export const CheckoutModal = ({
  visible,
  onClose,
  selectedItem,
}: CheckoutModalProps) => {
  if (!selectedItem) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        <ModalHeader onClose={onClose} />
        <View className="p-6 flex-1">
          <ItemPreview item={selectedItem} />
          <PaymentSection />
        </View>
      </View>
    </Modal>
  );
};
