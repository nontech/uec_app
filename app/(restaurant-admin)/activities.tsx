import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Tables } from '../../supabase/types';

type Transaction = Tables<'transactions'> & {
  menu_items: Tables<'menu_items'>;
  app_users: Tables<'app_users'>;
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
        app_users (*)
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Transaction History</Text>
      <View style={styles.transactionList}>
        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionHeader}>
              <Text style={styles.date}>
                {formatDate(transaction.transaction_date)}
              </Text>
              <Text style={styles.status}>
                Status: {transaction.payment_status}
              </Text>
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.menuItem}>
                Item: {transaction.menu_items?.name}
              </Text>
              <Text style={styles.employee}>
                Employee: {transaction.app_users?.first_name}{' '}
                {transaction.app_users?.last_name}
              </Text>
              <Text style={styles.amount}>
                Amount: ${transaction.amount?.toFixed(2)}
              </Text>
              <Text style={styles.paymentMethod}>
                Payment Method: {transaction.payment_method}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDetails: {
    gap: 4,
  },
  menuItem: {
    fontSize: 16,
    fontWeight: '500',
  },
  employee: {
    fontSize: 14,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
  },
});
