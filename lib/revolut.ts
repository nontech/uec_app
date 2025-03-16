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

      // Use the invite-user function to send invitation
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
};
