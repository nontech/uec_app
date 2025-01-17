import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Tables } from '../../supabase/types';
import Colors from '../../constants/Colors';

type Transaction = Tables<'transactions'> & {
  menu_items: Tables<'menu_items'>;
  app_users: Tables<'app_users'> & {
    companies: Tables<'companies'>;
  };
};

export default function ActivitiesScreen() {
  const { session } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (session?.user?.id) {
      loadTransactions();
    }
  }, [session]);

  const loadTransactions = async () => {
    const { data: userData } = await supabase
      .from('app_users')
      .select('restaurant_id')
      .eq('id', session?.user?.id)
      .single();

    if (!userData?.restaurant_id) {
      console.error('No restaurant ID found for user');
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(
        `
        *,
        menu_items (*),
        app_users (
          *,
          companies (*)
        )
      `
      )
      .eq('restaurant_id', userData.restaurant_id)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      return;
    }

    setTransactions(data || []);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-5 text-gray-900">
        Transaction History
      </Text>
      <View className="space-y-3">
        {transactions.map((transaction) => (
          <View
            key={transaction.id}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
          >
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-500">
                {formatDate(transaction.transaction_date)}
              </Text>
              <Text className="text-sm font-medium text-gray-900">
                Status: {transaction.payment_status}
              </Text>
            </View>
            <View className="space-y-1">
              <Text className="text-base font-medium text-gray-900">
                Item: {transaction.menu_items?.name}
              </Text>
              <Text className="text-sm text-gray-500">
                Employee: {transaction.app_users?.first_name}{' '}
                {transaction.app_users?.last_name}
                {transaction.app_users?.companies?.name &&
                  ` (${transaction.app_users.companies.name})`}
              </Text>
              <Text className="text-base font-bold text-[#6B4EFF]">
                Amount: €{transaction.amount?.toFixed(2)}
              </Text>
              <Text className="text-sm text-gray-500">
                Payment Method: {transaction.payment_method}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
