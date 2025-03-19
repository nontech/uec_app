'use client';

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import { revolutClient } from '../../../lib/revolut';

interface RevolutCredentials {
  id: string;
  client_assertion: string;
  access_token: string;
  refresh_token: string;
  client_assertion_expires_at: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

interface RevolutAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  state: string;
  public: boolean;
  created_at: string;
  updated_at: string;
}

export default function RevolutCredentialsPage() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [credentials, setCredentials] = useState<RevolutCredentials | null>(
    null
  );

  const [formData, setFormData] = useState({
    client_assertion: '',
    access_token: '',
    refresh_token: '',
  });

  // state variables for accounts
  const [accounts, setAccounts] = useState<RevolutAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  // state variables for card details
  const [cardId, setCardId] = useState('');
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // state variables for transactions
  const [transactionParams, setTransactionParams] = useState({
    accountId: '',
    cardId: '',
    from: '',
    to: '',
    count: '100',
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        navigation.navigate('Login' as never);
      }
    };
    getUser();
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('revolut_credentials')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setCredentials(data);
      if (data) {
        setFormData({
          client_assertion: data.client_assertion || '',
          access_token: data.access_token || '',
          refresh_token: data.refresh_token || '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching credentials:', error);
      setError(error.message);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updates: any = {
        updated_by: user?.id,
        is_active: true,
      };

      // Only update client_assertion and its expiry if it changed
      if (formData.client_assertion !== credentials?.client_assertion) {
        updates.client_assertion = formData.client_assertion;
        updates.client_assertion_expires_at = formData.client_assertion
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          : null;
      }

      // Only update access_token and its expiry if it changed
      if (formData.access_token !== credentials?.access_token) {
        updates.access_token = formData.access_token;
        updates.access_token_expires_at = formData.access_token
          ? new Date(Date.now() + 40 * 60 * 1000).toISOString() // 40 minutes
          : null;
      }

      // Only update refresh_token and its expiry if it changed
      if (formData.refresh_token !== credentials?.refresh_token) {
        updates.refresh_token = formData.refresh_token;
        updates.refresh_token_expires_at = formData.refresh_token
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          : null;
      }

      console.log('Updates to be applied:', updates);

      if (credentials) {
        // Update existing record
        const { error } = await supabase
          .from('revolut_credentials')
          .update(updates)
          .eq('id', credentials.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase.from('revolut_credentials').insert({
          ...updates,
          created_by: user?.id,
        });

        if (error) throw error;
      }

      setSuccess('Revolut credentials updated successfully');
      await fetchCredentials();
    } catch (error: any) {
      console.error('Error updating credentials:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  // Fetch all accounts (do this only in Admin UI)
  const fetchAccounts = async () => {
    setIsLoadingAccounts(true);
    setAccountsError(null);

    try {
      console.log('Fetching accounts');
      const accountsData = await revolutClient.getAccounts();
      setAccounts(accountsData);
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      setAccountsError(error.message);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Fetch a card details
  const fetchCardDetails = async () => {
    if (!cardId.trim()) {
      setCardError('Please enter a card ID');
      return;
    }

    setIsLoadingCard(true);
    setCardError(null);
    setCardDetails(null);

    try {
      console.log('Fetching card details for:', cardId);
      const cardData = await revolutClient.getCardDetails(cardId);
      setCardDetails(cardData);
    } catch (error: any) {
      console.error('Error fetching card details:', error);
      setCardError(error.message);
    } finally {
      setIsLoadingCard(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    setTransactionsError(null);
    setTransactions([]);

    try {
      // Prepare query parameters
      const queryParams: any = {};

      if (transactionParams.accountId) {
        queryParams.account = transactionParams.accountId;
      }

      if (transactionParams.from) {
        queryParams.from = transactionParams.from;
      }

      if (transactionParams.to) {
        queryParams.to = transactionParams.to;
      }

      if (transactionParams.count) {
        queryParams.count = parseInt(transactionParams.count);
      }

      console.log('Fetching transactions with params:', queryParams);

      // Call the API to fetch transactions
      const transactionsData = await revolutClient.callApi(
        'transactions?' + new URLSearchParams(queryParams).toString()
      );

      // If card ID is specified, filter transactions client-side
      let filteredTransactions = transactionsData;

      if (transactionParams.cardId) {
        filteredTransactions = transactionsData.filter((transaction: any) => {
          // Check all legs of the transaction for matching card ID
          return transaction.legs.some(
            (leg: any) => leg.card && leg.card.id === transactionParams.cardId
          );
        });
      }

      setTransactions(filteredTransactions);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setTransactionsError(error.message);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Revolut API Credentials</Text>

      <View style={styles.card}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Client Assertion JWT</Text>
            {credentials && (
              <Text style={styles.expiryText}>
                Expires: {formatDate(credentials.client_assertion_expires_at)}
              </Text>
            )}
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.client_assertion}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, client_assertion: text }))
              }
              placeholder='Enter the client assertion JWT'
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Access Token</Text>
            {credentials && (
              <Text style={styles.expiryText}>
                Expires: {formatDate(credentials.access_token_expires_at)}
              </Text>
            )}
            <TextInput
              style={styles.input}
              value={formData.access_token}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, access_token: text }))
              }
              placeholder='Enter the access token'
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Refresh Token</Text>
            {credentials && (
              <Text style={styles.expiryText}>
                Expires: {formatDate(credentials.refresh_token_expires_at)}
              </Text>
            )}
            <TextInput
              style={styles.input}
              value={formData.refresh_token}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, refresh_token: text }))
              }
              placeholder='Enter the refresh token'
            />
          </View>

          {credentials && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Last Updated:{' '}
                {new Date(credentials.updated_at).toLocaleString()}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Saving...' : 'Save Credentials'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <div className='mt-10 border-t pt-10'>
        <h2 className='text-2xl font-bold mb-4'>Revolut API Operations</h2>

        <div className='flex flex-col gap-6'>
          <div>
            <button
              onClick={fetchAccounts}
              disabled={isLoadingAccounts}
              className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400'
            >
              {isLoadingAccounts ? 'Loading...' : 'Get Account Details'}
            </button>

            {accountsError && (
              <div className='mt-2 text-red-500'>Error: {accountsError}</div>
            )}

            {/* Card details section */}
            <div className='mt-4'>
              <div className='flex gap-2 items-end'>
                <div className='flex-grow'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Card ID
                  </label>
                  <input
                    type='text'
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    placeholder='Enter card ID'
                    className='px-3 py-2 border border-gray-300 rounded w-full'
                  />
                </div>
                <button
                  onClick={fetchCardDetails}
                  disabled={isLoadingCard}
                  className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400'
                >
                  {isLoadingCard ? 'Loading...' : 'Get Card Details'}
                </button>
              </div>

              {cardError && (
                <div className='mt-2 text-red-500'>Error: {cardError}</div>
              )}
            </div>

            {/* Add new section for transactions */}
            <div className='mt-6 pt-6 border-t border-gray-200'>
              <h3 className='text-xl font-semibold mb-4'>Transaction Search</h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Account ID (optional)
                  </label>
                  <input
                    type='text'
                    value={transactionParams.accountId}
                    onChange={(e) =>
                      setTransactionParams((prev) => ({
                        ...prev,
                        accountId: e.target.value,
                      }))
                    }
                    placeholder='Filter by account ID'
                    className='px-3 py-2 border border-gray-300 rounded w-full'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Card ID (optional)
                  </label>
                  <input
                    type='text'
                    value={transactionParams.cardId}
                    onChange={(e) =>
                      setTransactionParams((prev) => ({
                        ...prev,
                        cardId: e.target.value,
                      }))
                    }
                    placeholder='Filter by card ID'
                    className='px-3 py-2 border border-gray-300 rounded w-full'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    From Date (optional)
                  </label>
                  <input
                    type='datetime-local'
                    value={transactionParams.from}
                    onChange={(e) =>
                      setTransactionParams((prev) => ({
                        ...prev,
                        from: e.target.value,
                      }))
                    }
                    className='px-3 py-2 border border-gray-300 rounded w-full'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    To Date (optional)
                  </label>
                  <input
                    type='datetime-local'
                    value={transactionParams.to}
                    onChange={(e) =>
                      setTransactionParams((prev) => ({
                        ...prev,
                        to: e.target.value,
                      }))
                    }
                    className='px-3 py-2 border border-gray-300 rounded w-full'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Count (max 1000)
                  </label>
                  <input
                    type='number'
                    value={transactionParams.count}
                    onChange={(e) =>
                      setTransactionParams((prev) => ({
                        ...prev,
                        count: e.target.value,
                      }))
                    }
                    min='1'
                    max='1000'
                    className='px-3 py-2 border border-gray-300 rounded w-full'
                  />
                </div>
              </div>

              <button
                onClick={fetchTransactions}
                disabled={isLoadingTransactions}
                className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400'
              >
                {isLoadingTransactions ? 'Loading...' : 'Get Transactions'}
              </button>

              {transactionsError && (
                <div className='mt-2 text-red-500'>
                  Error: {transactionsError}
                </div>
              )}
            </div>

            {/* Display card details, account details, or transactions based on what was fetched */}
            {cardDetails && !transactions.length && (
              <div className='mt-4'>
                <h3 className='text-xl font-semibold mb-2'>Card Details</h3>
                <div className='bg-gray-50 rounded p-4 max-h-96 overflow-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-100'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Property
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {Object.entries(cardDetails).map(([key, value]) => (
                        <tr key={key}>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                            {key}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {transactions.length > 0 && (
              <div className='mt-4'>
                <h3 className='text-xl font-semibold mb-2'>
                  Transactions ({transactions.length})
                </h3>
                <div className='bg-gray-50 rounded p-4 max-h-96 overflow-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-100'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          ID
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Type
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Amount
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Currency
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          State
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Created At
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                            {transaction.id}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {transaction.type}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {transaction.legs?.[0]?.amount}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {transaction.legs?.[0]?.currency}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {transaction.state}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {new Date(transaction.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {accounts.length > 0 && !cardDetails && !transactions.length && (
              <div className='mt-4'>
                <h3 className='text-xl font-semibold mb-2'>Accounts</h3>
                <div className='bg-gray-50 rounded p-4 max-h-96 overflow-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-100'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Name
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Balance
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Currency
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {accounts.map((account) => (
                        <tr key={account.id}>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                            {account.name}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {account.balance}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {account.currency}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {account.state}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
  },
  successContainer: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#16a34a',
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  infoContainer: {
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  expiryText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
});
