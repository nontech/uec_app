import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../supabase/types';
import { MaterialIcons } from '@expo/vector-icons';

type AppUser = Database['public']['Tables']['app_users']['Row'];
type MealBalance = Database['public']['Tables']['meal_balances']['Row'];

export default function ManageEmployees() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<
    (AppUser & { meal_balance?: MealBalance })[]
  >([]);

  useEffect(() => {
    if (session?.user) {
      fetchEmployees();
    }
  }, [session]);

  const fetchEmployees = async () => {
    try {
      // First get the company_id of the employer
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('company_id')
        .eq('id', session?.user?.id)
        .single();

      if (userError) throw userError;

      if (userData?.company_id) {
        // Fetch all employees for this company
        const { data: employeesData, error: employeesError } = await supabase
          .from('app_users')
          .select('*, meal_balances(*)')
          .eq('company_id', userData.company_id)
          .eq('type', 'employee');

        if (employeesError) throw employeesError;

        setEmployees(
          employeesData.map((employee) => ({
            ...employee,
            meal_balance: employee.meal_balances?.[0],
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold">Manage Employees</Text>
          <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center">
            <MaterialIcons name="person-add" size={24} color="white" />
            <Text className="text-white ml-2">Add Employee</Text>
          </TouchableOpacity>
        </View>

        {/* Employee List */}
        <View className="space-y-4">
          {employees.map((employee) => (
            <View
              key={employee.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-lg font-semibold">
                    {employee.first_name} {employee.last_name}
                  </Text>
                  <Text className="text-gray-600">
                    {employee.company_email}
                  </Text>
                </View>
                <View className="flex-row items-center space-x-2">
                  <TouchableOpacity className="p-2">
                    <MaterialIcons name="edit" size={24} color="#4B5563" />
                  </TouchableOpacity>
                  <TouchableOpacity className="p-2">
                    <MaterialIcons name="delete" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Employee Stats */}
              <View className="flex-row mt-4 space-x-4">
                <View className="bg-blue-50 px-4 py-2 rounded-lg flex-1">
                  <Text className="text-blue-800 font-medium">Status</Text>
                  <Text
                    className={`text-lg ${
                      employee.status === 'active'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {employee.status || 'Inactive'}
                  </Text>
                </View>
                <View className="bg-purple-50 px-4 py-2 rounded-lg flex-1">
                  <Text className="text-purple-800 font-medium">
                    Remaining Meals
                  </Text>
                  <Text className="text-lg text-purple-600">
                    {employee.meal_balance?.remaining_meals || 0}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
