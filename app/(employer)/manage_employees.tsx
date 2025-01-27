import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../supabase/types';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Input, Button } from '@rneui/themed';
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Loading...</Text>
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
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3 mb-8">
          <MaterialIcons name="search" size={24} color="#6B7280" />
          <TextInput
            placeholder="Search Employee"
            className="flex-1 ml-2 text-base text-gray-900"
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Header */}
        <View className="flex-row justify-between items-center mb-4 px-2">
          <Text className="text-sm font-medium text-gray-500">
            Employees ({employees.length})
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
              className="flex-row items-center justify-between py-3 px-2 border-b border-gray-200"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                  <MaterialIcons name="person" size={24} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-medium text-gray-900">
                      {employee.first_name} {employee.last_name}
                    </Text>
                    <View className="flex-row items-center">
                      <Text
                        className={`text-xs px-2 py-1 rounded-full ${
                          employee.status === 'active'
                            ? 'bg-green-100 text-green-600'
                            : employee.status === 'inactive'
                            ? 'bg-red-100 text-red-600'
                            : employee.status === 'invited'
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {employee.status}
                      </Text>
                      <TouchableOpacity
                        className="p-2 ml-2"
                        onPress={() => {
                          setSelectedEmployee(employee);
                          setShowDeleteModal(true);
                        }}
                      >
                        <MaterialIcons name="close" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text className="text-sm text-gray-500 mb-1">
                    {employee.email}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View className="flex-row items-center mr-4">
                      <MaterialIcons
                        name="card-membership"
                        size={16}
                        color="#6B7280"
                      />
                      <Text className="text-sm text-gray-500 ml-1">
                        {employee.membership_id
                          ? employee.memberships?.plan_type
                          : 'No Plan'}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <MaterialIcons
                        name="restaurant-menu"
                        size={16}
                        color="#6B7280"
                      />
                      <Text className="text-sm text-gray-500 ml-1">
                        {employee.meals_per_week
                          ? `${employee.meals_per_week} meals/week`
                          : 'No meals'}
                      </Text>
                    </View>
                  </View>
                </View>
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
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
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
        <View className="flex-1 bg-black/50 justify-end">
          <ScrollView>
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-semibold text-gray-900">
                  Invite Employee
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setFirstName('');
                    setLastName('');
                    setSelectedMembership(null);
                    setMealsPerWeek(3);
                  }}
                  className="p-2"
                >
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <Text className="text-base text-gray-500 mb-4">
                  Enter the details of the employee you want to invite.
                </Text>

                <Input
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  leftIcon={{
                    type: 'font-awesome',
                    name: 'user',
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
                    marginBottom: 8,
                    backgroundColor: '#F9FAFB',
                  }}
                  containerStyle={{ paddingHorizontal: 0 }}
                  placeholderTextColor="#6B7280"
                />

                <Input
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  leftIcon={{
                    type: 'font-awesome',
                    name: 'user',
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
                    marginBottom: 8,
                    backgroundColor: '#F9FAFB',
                  }}
                  containerStyle={{ paddingHorizontal: 0 }}
                  placeholderTextColor="#6B7280"
                />

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
                    backgroundColor: '#F9FAFB',
                  }}
                  containerStyle={{ paddingHorizontal: 0 }}
                  placeholderTextColor="#6B7280"
                />

                {/* Membership Plan Selection */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Membership Plan
                  </Text>
                  <TouchableOpacity
                    className="flex-row items-center justify-between border border-gray-200 rounded-lg p-3 bg-gray-50"
                    onPress={() => setShowMembershipDropdown(true)}
                  >
                    <Text className="text-base text-gray-900">
                      {selectedMembership
                        ? activeMemberships.find(
                            (m) => m.id === selectedMembership
                          )?.plan_type
                        : 'Select a plan'}
                    </Text>
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>

                {/* Membership Dropdown Modal */}
                <Modal
                  visible={showMembershipDropdown}
                  transparent
                  animationType={Platform.OS === 'ios' ? 'slide' : 'fade'}
                  onRequestClose={() => setShowMembershipDropdown(false)}
                >
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      justifyContent:
                        Platform.OS === 'ios' ? 'flex-end' : 'center',
                    }}
                    activeOpacity={1}
                    onPress={() => setShowMembershipDropdown(false)}
                  >
                    <View
                      style={{
                        backgroundColor: 'white',
                        borderRadius: Platform.OS === 'ios' ? 20 : 10,
                        marginHorizontal: Platform.OS === 'ios' ? 0 : 20,
                        borderTopLeftRadius: Platform.OS === 'ios' ? 20 : 10,
                        borderTopRightRadius: Platform.OS === 'ios' ? 20 : 10,
                      }}
                    >
                      <View
                        style={{
                          borderBottomWidth: 1,
                          borderBottomColor: '#E5E7EB',
                          padding: 16,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: '#1F2937',
                          }}
                        >
                          Select Plan
                        </Text>
                        <TouchableOpacity
                          onPress={() => setShowMembershipDropdown(false)}
                        >
                          <MaterialIcons
                            name="close"
                            size={24}
                            color="#6B7280"
                          />
                        </TouchableOpacity>
                      </View>
                      <ScrollView style={{ maxHeight: 300 }}>
                        {activeMemberships.length === 0 ? (
                          <View style={{ padding: 16 }}>
                            <Text style={{ color: '#6B7280' }}>
                              No plans available
                            </Text>
                          </View>
                        ) : (
                          activeMemberships.map((membership) => (
                            <TouchableOpacity
                              key={membership.id}
                              style={{
                                padding: 16,
                                borderBottomWidth: 1,
                                borderBottomColor: '#E5E7EB',
                              }}
                              onPress={() => {
                                setSelectedMembership(membership.id);
                                setShowMembershipDropdown(false);
                              }}
                            >
                              <Text style={{ fontSize: 16, color: '#1F2937' }}>
                                {membership.plan_type || 'Unknown Plan'}
                              </Text>
                            </TouchableOpacity>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  </TouchableOpacity>
                </Modal>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Meals per Week
                  </Text>
                  <View className="flex-row items-center justify-between border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <TouchableOpacity
                      onPress={() =>
                        setMealsPerWeek(Math.max(1, mealsPerWeek - 1))
                      }
                      className="p-2"
                    >
                      <MaterialIcons name="remove" size={24} color="#6B7280" />
                    </TouchableOpacity>
                    <Text className="text-base text-gray-900">
                      {mealsPerWeek}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setMealsPerWeek(Math.min(5, mealsPerWeek + 1))
                      }
                      className="p-2"
                    >
                      <MaterialIcons name="add" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Button
                  title="Send Invitation"
                  loading={inviting}
                  disabled={inviting || !inviteEmail || !selectedMembership}
                  onPress={handleInviteEmployee}
                  buttonStyle={{
                    backgroundColor: '#6B4EFF',
                    borderRadius: 10,
                    paddingVertical: 14,
                    marginTop: 8,
                  }}
                  titleStyle={{ fontSize: 16, fontWeight: '600' }}
                />
              </ScrollView>
            </View>
          </ScrollView>
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
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full p-6">
            <Text className="text-xl font-semibold text-gray-900 mb-4">
              Remove Employee
            </Text>

            <Text className="text-base text-gray-500 mb-6">
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
                <Text className="text-gray-500 font-medium">Cancel</Text>
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
