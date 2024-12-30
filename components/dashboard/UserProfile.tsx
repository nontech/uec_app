import React from 'react';
import { View, Text } from 'react-native';
import { Database } from '../../supabase/types';

interface UserProfileProps {
  userDetails: Database['public']['Tables']['app_users']['Row'] | null;
  company: Database['public']['Tables']['companies']['Row'] | null;
  membership: Database['public']['Tables']['memberships']['Row'] | null;
}

export const UserProfile = ({
  userDetails,
  company,
  membership,
}: UserProfileProps) => (
  <>
    {/* User Info Section */}
    <View className="flex-row items-center mb-6">
      <View className="w-16 h-16 bg-gray-200 rounded-full mr-4" />
      <View>
        <Text className="text-xl font-semibold">
          {userDetails?.first_name} {userDetails?.last_name}
        </Text>
        <Text className="text-gray-600">{userDetails?.company_email}</Text>
      </View>
    </View>

    {/* Company Info */}
    <View className="flex-row justify-between items-center mb-8">
      <Text className="text-gray-600">Company</Text>
      <Text className="text-lg">{company?.name}</Text>
    </View>

    {/* Membership Info */}
    {membership && (
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-gray-600">Membership</Text>
        <Text className="text-lg">Plan {membership.plan_type}</Text>
      </View>
    )}
  </>
);
