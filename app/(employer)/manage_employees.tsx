import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../supabase/types';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Input, Button } from '@rneui/themed';

type AppUser = Database['public']['Tables']['app_users']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];

type MealBalanceWithUser = {
  employee_id: string;
  app_users: AppUser;
};

export default function ManageEmployees() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<AppUser | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        // Get all active memberships for the company
        const { data: membershipsData, error: membershipError } = await supabase
          .from('memberships')
          .select('id')
          .eq('company_id', userData.company_id)
          .eq('status', 'active');

        if (membershipError) {
          console.error('Error fetching memberships:', membershipError);
          setEmployees([]);
          return;
        }

        if (!membershipsData || membershipsData.length === 0) {
          console.log('No active memberships found');
          setEmployees([]);
          return;
        }

        // Get membership IDs
        const membershipIds = membershipsData.map((m) => m.id);

        // Get all employee IDs from meal_balances for all active memberships
        const { data: mealBalances, error: mealBalancesError } = await supabase
          .from('meal_balances')
          .select('employee_id')
          .in('membership_id', membershipIds);

        if (mealBalancesError) {
          console.error('Error fetching meal balances:', mealBalancesError);
          throw mealBalancesError;
        }

        if (mealBalances && mealBalances.length > 0) {
          // Get unique employee IDs across all memberships
          const uniqueEmployeeIds = [
            ...new Set(mealBalances.map((mb) => mb.employee_id)),
          ];

          // Fetch employee details
          const { data: employeesData, error: employeesError } = await supabase
            .from('app_users')
            .select('*')
            .in('id', uniqueEmployeeIds);

          if (employeesError) throw employeesError;

          if (employeesData) {
            setEmployees(employeesData);
          }
        } else {
          setEmployees([]);
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
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

  const handleInviteEmployee = async () => {
    if (!inviteEmail || !userCompanyId) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setInviting(true);
    try {
      // First check if the user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('app_users')
        .select('*')
        .eq('company_email', inviteEmail)
        .single();

      if (existingUser) {
        Alert.alert('Error', 'This email is already registered');
        return;
      }

      // Create a new user with invited status
      const { error: createError } = await supabase.from('app_users').insert([
        {
          company_email: inviteEmail,
          type: 'employee',
          company_id: userCompanyId,
          status: 'invited',
          first_name: inviteEmail.split('@')[0], // Temporary name from email
        },
      ]);

      if (createError) throw createError;

      Alert.alert('Success', 'Invitation sent successfully');
      setInviteEmail('');
      setShowInviteModal(false);
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error('Error inviting employee:', error);
      Alert.alert('Error', 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      // Fetch user's company_id
      const fetchUserCompany = async () => {
        try {
          const { data, error } = await supabase
            .from('app_users')
            .select('company_id')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;
          if (data?.company_id) {
            setUserCompanyId(data.company_id);
          }
        } catch (error) {
          console.error('Error fetching user company:', error);
        }
      };

      fetchUserCompany();
      fetchEmployees();
      fetchCompanies();
    }
  }, [session]);

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    setDeleting(true);
    try {
      // Get all active memberships for the company
      const { data: userData } = await supabase
        .from('app_users')
        .select('company_id')
        .eq('id', session?.user?.id)
        .single();

      if (userData?.company_id) {
        const { data: membershipsData } = await supabase
          .from('memberships')
          .select('id')
          .eq('company_id', userData.company_id)
          .eq('status', 'active');

        if (membershipsData && membershipsData.length > 0) {
          const membershipIds = membershipsData.map((m) => m.id);

          // Delete meal balances for all active memberships
          const { error: mealBalanceError } = await supabase
            .from('meal_balances')
            .delete()
            .eq('employee_id', selectedEmployee.id)
            .in('membership_id', membershipIds);

          if (mealBalanceError) throw mealBalanceError;

          Alert.alert('Success', 'Employee removed from membership plans');
          setShowDeleteModal(false);
          setSelectedEmployee(null);
          fetchEmployees(); // Refresh the list
        }
      }
    } catch (error) {
      console.error('Error removing employee:', error);
      Alert.alert('Error', 'Failed to remove employee from membership plans');
    } finally {
      setDeleting(false);
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
            <View
              key={employee.id}
              className="flex-row items-center justify-between py-4 px-2 border-b border-gray-100"
            >
              <TouchableOpacity
                className="flex-row items-center flex-1"
                onPress={() => {
                  // Handle employee selection
                }}
              >
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
              </TouchableOpacity>
              <View className="flex-row items-center">
                {employee.status === 'invited' && (
                  <View className="bg-gray-100 px-3 py-1 rounded-full mr-2">
                    <Text className="text-sm text-gray-600">Invited</Text>
                  </View>
                )}
                <TouchableOpacity
                  className="p-2 ml-2"
                  onPress={() => {
                    setSelectedEmployee(employee);
                    setShowDeleteModal(true);
                  }}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={24}
                    color="#EF4444"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Add Button */}
      <TouchableOpacity
        className="absolute bottom-8 right-8 bg-[#6B4EFF] h-12 px-4 rounded-full flex-row items-center justify-center shadow-sm"
        onPress={() => setShowInviteModal(true)}
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

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-semibold text-gray-900">
                Invite Employee
              </Text>
              <TouchableOpacity
                onPress={() => setShowInviteModal(false)}
                className="p-2"
              >
                <MaterialIcons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <Text className="text-base text-gray-600 mb-4">
              Enter the email address of the employee you want to invite.
            </Text>

            <Input
              placeholder="employee@company.com"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={{
                type: 'font-awesome',
                name: 'envelope',
                color: '#6B7280',
                size: 18,
              }}
              inputStyle={{ color: '#1F2937', fontSize: 16 }}
              inputContainerStyle={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
              containerStyle={{ paddingHorizontal: 0 }}
            />

            <Button
              title="Send Invitation"
              loading={inviting}
              disabled={inviting || !inviteEmail}
              onPress={handleInviteEmployee}
              buttonStyle={{
                backgroundColor: '#6B4EFF',
                borderRadius: 10,
                paddingVertical: 14,
                marginTop: 8,
              }}
              titleStyle={{ fontSize: 16, fontWeight: '600' }}
            />
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setSelectedEmployee(null);
        }}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full p-6">
            <Text className="text-xl font-semibold text-gray-900 mb-4">
              Remove Employee
            </Text>

            <Text className="text-base text-gray-600 mb-6">
              Are you sure you want to remove {selectedEmployee?.first_name}{' '}
              {selectedEmployee?.last_name} from the membership plan?
            </Text>

            <View className="flex-row justify-end space-x-4">
              <TouchableOpacity
                className="px-4 py-2 rounded-lg"
                onPress={() => {
                  setShowDeleteModal(false);
                  setSelectedEmployee(null);
                }}
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-red-500 px-4 py-2 rounded-lg flex-row items-center"
                onPress={handleDeleteEmployee}
                disabled={deleting}
              >
                {deleting ? (
                  <Text className="text-white font-medium">Removing...</Text>
                ) : (
                  <Text className="text-white font-medium">Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
