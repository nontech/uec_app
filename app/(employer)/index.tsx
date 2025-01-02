import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../supabase/types';
import { MaterialIcons } from '@expo/vector-icons';

type Company = Database['public']['Tables']['companies']['Row'];
type AppUser = Database['public']['Tables']['app_users']['Row'];
type MealBalance = Database['public']['Tables']['meal_balances']['Row'];

export default function EmployerDashboard() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [totalMealsConsumed, setTotalMealsConsumed] = useState(0);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      // Fetch employer's company data
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('company_id')
        .eq('id', session?.user?.id)
        .single();

      if (userError) throw userError;

      if (userData?.company_id) {
        // Fetch company details
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userData.company_id)
          .single();

        if (companyError) throw companyError;
        setCompany(companyData);

        // Fetch employee counts
        const { count: totalCount } = await supabase
          .from('app_users')
          .select('*', { count: 'exact' })
          .eq('company_id', userData.company_id)
          .eq('type', 'employee');

        const { count: activeCount } = await supabase
          .from('app_users')
          .select('*', { count: 'exact' })
          .eq('company_id', userData.company_id)
          .eq('type', 'employee')
          .eq('status', 'active');

        setEmployeeCount(totalCount || 0);
        setActiveEmployees(activeCount || 0);

        // Calculate total meals consumed
        const { data: mealBalances } = await supabase
          .from('meal_balances')
          .select('remaining_meals')
          .eq('company_id', userData.company_id);

        const totalMeals = mealBalances?.reduce((acc, curr) => {
          return acc + (curr.remaining_meals || 0);
        }, 0);

        setTotalMealsConsumed(totalMeals || 0);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      {/* Header */}
      <View className="bg-blue-600 p-6 pb-12">
        <Text className="text-2xl font-bold text-white mb-2">
          Welcome back,
        </Text>
        <Text className="text-lg text-white opacity-90">{company?.name}</Text>
      </View>

      {/* Stats Cards */}
      <View className="px-6 -mt-6">
        <View className="bg-white rounded-xl shadow-md p-4 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold">Quick Stats</Text>
          </View>

          <View className="flex-row flex-wrap">
            {/* Total Employees */}
            <View className="w-1/2 p-2">
              <View className="bg-blue-50 p-4 rounded-lg">
                <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center mb-2">
                  <MaterialIcons name="people" size={24} color="#1d4ed8" />
                </View>
                <Text className="text-2xl font-bold text-blue-900">
                  {employeeCount}
                </Text>
                <Text className="text-blue-700">Total Employees</Text>
              </View>
            </View>

            {/* Active Employees */}
            <View className="w-1/2 p-2">
              <View className="bg-green-50 p-4 rounded-lg">
                <View className="bg-green-100 w-10 h-10 rounded-full items-center justify-center mb-2">
                  <MaterialIcons
                    name="check-circle"
                    size={24}
                    color="#15803d"
                  />
                </View>
                <Text className="text-2xl font-bold text-green-900">
                  {activeEmployees}
                </Text>
                <Text className="text-green-700">Active Employees</Text>
              </View>
            </View>

            {/* Total Meals */}
            <View className="w-1/2 p-2">
              <View className="bg-purple-50 p-4 rounded-lg">
                <View className="bg-purple-100 w-10 h-10 rounded-full items-center justify-center mb-2">
                  <MaterialIcons name="restaurant" size={24} color="#6b21a8" />
                </View>
                <Text className="text-2xl font-bold text-purple-900">
                  {totalMealsConsumed}
                </Text>
                <Text className="text-purple-700">Total Meals</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
