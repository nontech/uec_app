import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../supabase/types';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

type AppUser = Database['public']['Tables']['app_users']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];

export default function ManageEmployees() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    if (session?.user) {
      fetchEmployees();
      fetchCompanies();
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
          .select('*')
          .eq('company_id', userData.company_id)
          .eq('type', 'employee');

        if (employeesError) throw employeesError;
        setEmployees(employeesData);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) {
        setCompanies(data);
        console.log('Companies:', data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const fullName =
      `${employee.first_name} ${employee.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="p-6 flex-1">
        <Text className="text-2xl font-semibold mb-6 text-gray-900">
          Employees
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#F3F0FF] rounded-full px-4 py-3 mb-8">
          <MaterialIcons name="search" size={24} color="#666" />
          <TextInput
            placeholder="Search Employee"
            className="flex-1 ml-2 text-base text-gray-900"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Header */}
        <View className="flex-row justify-between items-center mb-4 px-2">
          <Text className="text-sm font-medium text-gray-600">Name</Text>
          <Text className="text-sm font-medium text-gray-600">
            Total: {employees.length}
          </Text>
        </View>

        {/* Employee List */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredEmployees.map((employee) => (
            <TouchableOpacity
              key={employee.id}
              className="flex-row items-center justify-between py-4 px-2 border-b border-gray-100"
              onPress={() => {
                // Handle employee selection
              }}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                  <MaterialIcons name="person" size={24} color="#666" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">
                    {employee.first_name} {employee.last_name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {employee.company_email}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                {employee.status === 'invited' && (
                  <View className="bg-gray-100 px-3 py-1 rounded-full mr-2">
                    <Text className="text-sm text-gray-600">Invited</Text>
                  </View>
                )}
                <MaterialIcons name="chevron-right" size={24} color="#666" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Add Button */}
      <TouchableOpacity
        className="absolute bottom-8 right-8 bg-[#6B4EFF] h-12 px-4 rounded-full flex-row items-center justify-center shadow-sm"
        onPress={() => {
          //router.push('/add_employee' as any);
        }}
        style={{
          shadowColor: '#6B4EFF',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <MaterialIcons name="add" size={24} color="white" />
        <Text className="text-white ml-1 font-medium">Add</Text>
      </TouchableOpacity>
    </View>
  );
}
