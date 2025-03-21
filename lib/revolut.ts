// app/lib/revolut.ts
import { supabase } from './supabase';

export const revolutClient = {
  async callApi(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ) {
    try {
      console.log(`Calling Edge Function for ${endpoint}`);

      // Use the revolut-api edge function to call the Revolut API
      const { data: responseData, error } = await supabase.functions.invoke(
        'revolut-api',
        {
          body: {
            endpoint,
            method,
            data,
          },
        }
      );

      if (error) {
        console.error('Error calling Revolut API:', error);
        throw new Error('Failed to call Revolut API');
      }

      return responseData;
    } catch (error: any) {
      console.error('Error calling Revolut API:', error);
      throw error;
    }
  },

  async getAccounts() {
    console.log('Getting Revolut accounts');
    return this.callApi('accounts');
  },

  async getAccount(accountId: string) {
    console.log('Getting Revolut account', accountId);
    return this.callApi(`accounts/${accountId}`);
  },

  async getCardDetails(cardId: string) {
    console.log('Getting Revolut card details', cardId);
    return this.callApi(`cards/${cardId}`);
  },

  async getTransactions(queryParams = {}) {
    console.log('Getting Revolut transactions with params:', queryParams);
    const queryString = new URLSearchParams(queryParams).toString();
    return this.callApi(`transactions${queryString ? '?' + queryString : ''}`);
  },
};
