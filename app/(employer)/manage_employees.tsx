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
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../supabase/types';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';

type AppUser = Database['public']['Tables']['app_users']['Row'] & {
  memberships?: Database['public']['Tables']['memberships']['Row'];
};
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<AppUser | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<string | null>(
    null
  );
  const [mealsPerWeek, setMealsPerWeek] = useState(3);
  const [showMembershipDropdown, setShowMembershipDropdown] = useState(false);
  const [activeMemberships, setActiveMemberships] = useState<
    Database['public']['Tables']['memberships']['Row'][]
  >([]);

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

        //check which employee has one of the membership ids
        const { data: employeesData, error: employeeError } = await supabase
          .from('app_users')
          .select(
            `
            *,
            memberships (*)
          `
          )
          .eq('type', 'employee')
          .in('membership_id', membershipIds);

        if (employeesData) {
          setEmployees(employeesData);
        } else {
          setEmployees([]);
        }
      } else {
        setEmployees([]);
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

  const fetchActiveMemberships = async () => {
    if (!userCompanyId) return;

    try {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('company_id', userCompanyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveMemberships(data || []);
    } catch (error) {
      console.error('Error fetching active memberships:', error);
    }
  };

  useEffect(() => {
    if (showInviteModal) {
      fetchActiveMemberships();
    }
  }, [showInviteModal, userCompanyId]);

  const handleInviteEmployee = async () => {
    if (!inviteEmail || !userCompanyId || !selectedMembership || !firstName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setInviting(true);
    try {
      // First check if the user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', inviteEmail)
        .single();

      if (existingUser) {
        Alert.alert('Error', 'This email is already registered');
        return;
      }

      // Use the invite-user function to send invitation
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: inviteEmail,
          first_name: firstName,
          last_name: lastName || null,
          type: 'employee',
          company_id: userCompanyId,
          membership_id: selectedMembership,
          meals_per_week: mealsPerWeek,
        },
      });

      if (error) throw error;

      Alert.alert('Success', 'Invitation sent successfully');
      setInviteEmail('');
      setFirstName('');
      setLastName('');
      setSelectedMembership(null);
      setMealsPerWeek(3);
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

  const renderDropdown = (
    visible: boolean,
    onClose: () => void,
    items: { label: string; value: string }[],
    onSelect: (value: string) => void
  ) => {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/70 justify-center items-center"
          activeOpacity={1}
          onPress={onClose}
        >
          <View className="bg-[#2C2C2E] rounded-2xl p-2 w-[85%] max-h-[50%] shadow-lg shadow-black/25">
            <ScrollView>
              {items.length === 0 ? (
                <View className="p-4 border-b border-[#3C3C3E]">
                  <Text className="text-base text-white">
                    No items available
                  </Text>
                </View>
              ) : (
                items.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    className="p-4 border-b border-[#3C3C3E]"
                    onPress={() => {
                      onSelect(item.value);
                      onClose();
                    }}
                  >
                    <Text className="text-base text-white">{item.label}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#1C1C1E]">
        <Text className="text-white text-base">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#1C1C1E]">
      {/* Search and Add Section */}
      <View className="flex-row items-center p-4 bg-[#2C2C2E]">
        <View className="flex-1 flex-row items-center bg-[#3C3C3E] rounded-xl px-3 mr-3">
          <MaterialIcons
            name="search"
            size={24}
            color="rgba(255, 255, 255, 0.9)"
          />
          <TextInput
            className="flex-1 text-white text-base py-3 pl-2"
            placeholder="Search employees..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          className="bg-[#3C3C3E] rounded-xl p-3"
          onPress={() => {
            setShowInviteModal(true);
          }}
        >
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Employees List */}
      <ScrollView className="flex-1 p-4">
        {filteredEmployees.map((employee) => (
          <View
            key={employee.id}
            className="flex-row items-start bg-[#2C2C2E] rounded-xl p-4 mb-3"
          >
            <View className="flex-1">
              <View className="flex-row items-start justify-between mb-1">
                <View className="flex-1 mr-3">
                  <Text className="text-lg font-semibold text-white mb-1.5">
                    {employee.first_name} {employee.last_name}
                  </Text>
                  <View
                    className={`self-start px-2.5 py-1 rounded-xl ${
                      employee.status === 'active'
                        ? 'bg-[#4CAF50]/20'
                        : employee.status === 'inactive'
                        ? 'bg-[#FF453A]/20'
                        : employee.status === 'invited'
                        ? 'bg-[#FF9F0A]/20'
                        : 'bg-[#3C3C3E]'
                    }`}
                  >
                    <Text className="text-xs font-medium text-white">
                      {(employee.status || 'unknown')?.charAt(0).toUpperCase() +
                        (employee.status || 'unknown')?.slice(1)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  className="p-1 rounded-xl bg-[#3C3C3E]"
                  onPress={() => {
                    setSelectedEmployee(employee);
                    setShowDeleteModal(true);
                  }}
                >
                  <MaterialIcons
                    name="close"
                    size={20}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-white/90 mb-2">
                {employee.email}
              </Text>
              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="card-membership"
                    size={16}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                  <Text className="text-sm text-white/90 ml-1.5">
                    {employee.membership_id
                      ? employee.memberships?.plan_type
                      : 'No Plan'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="restaurant-menu"
                    size={16}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                  <Text className="text-sm text-white/90 ml-1.5">
                    {employee.meals_per_week
                      ? `${employee.meals_per_week} meals/week`
                      : 'No meals'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={showInviteModal} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-center items-center">
          <View className="bg-[#2C2C2E] rounded-2xl p-6 w-[90%] max-w-[400px]">
            <Text className="text-2xl font-semibold text-white mb-6">
              Invite Employee
            </Text>

            <View className="mb-4">
              <Text className="text-base font-semibold text-white mb-2">
                First Name
              </Text>
              <TextInput
                className="h-[50px] bg-[#3C3C3E] rounded-xl px-3 text-white text-base border border-[#2C2C2E]"
                placeholder="Enter first name"
                placeholderTextColor="#999999"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View className="mb-4">
              <Text className="text-base font-semibold text-white mb-2">
                Last Name
              </Text>
              <TextInput
                className="h-[50px] bg-[#3C3C3E] rounded-xl px-3 text-white text-base border border-[#2C2C2E]"
                placeholder="Enter last name"
                placeholderTextColor="#999999"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            <View className="mb-4">
              <Text className="text-base font-semibold text-white mb-2">
                Email
              </Text>
              <TextInput
                className="h-[50px] bg-[#3C3C3E] rounded-xl px-3 text-white text-base border border-[#2C2C2E]"
                placeholder="Enter email address"
                placeholderTextColor="#999999"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="flex-row justify-end mt-6">
              <TouchableOpacity
                className="min-w-[100px] rounded-xl py-3 ml-3 bg-[#3C3C3E]"
                onPress={() => setShowInviteModal(false)}
              >
                <Text className="text-base font-semibold text-white text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="min-w-[100px] rounded-xl py-3 ml-3 bg-[#4CAF50]"
                onPress={handleInviteEmployee}
                disabled={inviting}
              >
                <Text className="text-base font-semibold text-white text-center">
                  {inviting ? 'Sending...' : 'Send Invite'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center items-center">
          <View className="bg-[#2C2C2E] rounded-2xl p-6 w-[90%] max-w-[400px]">
            <Text className="text-2xl font-semibold text-white mb-6">
              Remove Employee
            </Text>
            <Text className="text-base text-white/90 mb-6">
              Are you sure you want to remove this employee from membership?
            </Text>
            <View className="flex-row justify-end mt-6">
              <TouchableOpacity
                className="min-w-[100px] rounded-xl py-3 ml-3 bg-[#3C3C3E]"
                onPress={() => setShowDeleteModal(false)}
              >
                <Text className="text-base font-semibold text-white text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="min-w-[100px] rounded-xl py-3 ml-3 bg-[#FF453A]"
                onPress={handleDeleteEmployee}
                disabled={deleting}
              >
                <Text className="text-base font-semibold text-white text-center">
                  {deleting ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dropdown Modal */}
      {renderDropdown(
        showMembershipDropdown,
        () => setShowMembershipDropdown(false),
        activeMemberships.map((m) => ({
          label: `Tier ${m.plan_type}`,
          value: m.id,
        })),
        (value) => setSelectedMembership(value)
      )}
    </View>
  );
}
