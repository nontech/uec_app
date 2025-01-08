import { View } from 'react-native';
import { Text } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  DataTable,
  Button,
  Modal,
  Portal,
  TextInput,
  SegmentedButtons,
  Menu,
} from 'react-native-paper';
import { Database } from '../../../supabase/types';
import { ScrollView } from 'react-native';
import { Alert } from 'react-native';

type AppUser = Database['public']['Tables']['app_users']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];
type Membership = Database['public']['Tables']['memberships']['Row'];

type AppUserWithDetails = AppUser & {
  companies?: Company;
  memberships?: Membership;
  personal_email: string;
  meals_per_week: number;
};

type UserFormData = {
  first_name: string;
  last_name: string;
  type: 'super_admin' | 'company_admin' | 'employee';
  company_id: string | null;
  membership_id: string | null;
  status: 'active' | 'inactive';
  personal_email: string;
  meals_per_week: number;
  showCompanyMenu?: boolean;
  email: string;
};

export default function UsersManagement() {
  const [users, setUsers] = useState<AppUserWithDetails[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUserWithDetails | null>(
    null
  );
  const [isInviteMode, setIsInviteMode] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AppUserWithDetails | null>(
    null
  );
  const [formData, setFormData] = useState<UserFormData>({
    first_name: '',
    last_name: '',
    type: 'employee',
    company_id: null,
    membership_id: null,
    status: 'active',
    personal_email: '',
    meals_per_week: 0,
    email: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
    fetchMemberships();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select(
          `
          *,
          companies (*),
          memberships (*)
        `
        )
        .order('created_at', { ascending: false })
        .returns<AppUserWithDetails[]>();

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemberships(data || []);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    }
  };

  const handleInviteUser = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          type: formData.type,
          company_id: formData.company_id,
          membership_id: formData.membership_id,
        },
      });

      if (error) throw error;

      setVisible(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error inviting user:', error);
      Alert.alert('Error', 'Failed to invite user. Please try again.');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('app_users')
        .update({
          email: selectedUser.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          type: formData.type,
          company_id: formData.company_id,
          membership_id: formData.membership_id,
          status: formData.status,
          personal_email: formData.personal_email,
          meals_per_week: formData.meals_per_week,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      setVisible(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setIsInviteMode(true);
    setFormData({
      first_name: '',
      last_name: '',
      type: 'employee',
      company_id: null,
      membership_id: null,
      status: 'active',
      personal_email: '',
      meals_per_week: 0,
      email: '',
    });
  };

  const openInviteModal = () => {
    resetForm();
    setIsInviteMode(true);
    setVisible(true);
  };

  const openEditModal = (user: AppUserWithDetails) => {
    setSelectedUser(user);
    setIsInviteMode(false);
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      type: user.type as 'super_admin' | 'company_admin' | 'employee',
      company_id: user.company_id,
      membership_id: user.membership_id,
      status: user.status as 'active' | 'inactive',
      personal_email: user.personal_email || '',
      meals_per_week: user.meals_per_week || 0,
      email: user.email || '',
    });
    setVisible(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      setDeleteConfirmVisible(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const openDeleteConfirm = (user: AppUserWithDetails) => {
    setUserToDelete(user);
    setDeleteConfirmVisible(true);
  };

  if (loading) {
    return (
      <View className="flex-1 p-5 bg-white">
        <Text className="text-lg">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-5 bg-white">
      <View className="flex-row justify-between items-center mb-5">
        <Text className="text-2xl font-semibold text-gray-800">
          Users Management
        </Text>
        <Button
          mode="contained"
          onPress={openInviteModal}
          className="bg-blue-500"
        >
          Invite User
        </Button>
      </View>

      <DataTable className="bg-white">
        <DataTable.Header>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Name</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Email</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">
              Personal Email
            </Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Type</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Company</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">
              Membership
            </Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">
              Meals/Week
            </Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Status</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Actions</Text>
          </DataTable.Title>
        </DataTable.Header>

        {users.map((user) => (
          <DataTable.Row key={user.id}>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {`${user.first_name} ${user.last_name || ''}`}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">{user.email}</Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {user.personal_email || '-'}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">{user.type}</Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {user.companies?.name || '-'}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {user.memberships?.plan_type
                  ? `${user.memberships.plan_type} Plan`
                  : '-'}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {user.meals_per_week || '-'}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text
                className={`text-sm ${
                  user.status === 'active'
                    ? 'text-green-600'
                    : user.status === 'inactive'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {user.status}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <View className="flex-row gap-2">
                <Button
                  mode="outlined"
                  onPress={() => openEditModal(user)}
                  className="border-blue-500"
                  textColor="#3b82f6"
                >
                  Edit
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => openDeleteConfirm(user)}
                  className="border-red-500"
                  textColor="#ef4444"
                >
                  Delete
                </Button>
              </View>
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)}>
          <View className="mx-5 my-8 bg-white rounded-lg max-w-lg self-center w-full max-h-[80%]">
            <ScrollView className="p-6">
              <Text className="text-xl font-semibold text-gray-800 mb-6">
                {isInviteMode ? 'Invite New User' : 'Edit User'}
              </Text>

              {isInviteMode && (
                <TextInput
                  label="Email"
                  value={formData.email}
                  onChangeText={(text: string) =>
                    setFormData({ ...formData, email: text })
                  }
                  className="mb-4"
                  mode="flat"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}

              {!isInviteMode && (
                <TextInput
                  label="Email"
                  value={selectedUser?.email || ''}
                  onChangeText={(text: string) =>
                    setSelectedUser((prev) =>
                      prev ? { ...prev, email: text } : null
                    )
                  }
                  className="mb-4"
                  mode="flat"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}

              <TextInput
                label="First Name"
                value={formData.first_name}
                onChangeText={(text: string) =>
                  setFormData({ ...formData, first_name: text })
                }
                className="mb-4"
                mode="flat"
              />

              <TextInput
                label="Last Name"
                value={formData.last_name}
                onChangeText={(text: string) =>
                  setFormData({ ...formData, last_name: text })
                }
                className="mb-4"
                mode="flat"
              />

              <TextInput
                label="Personal Email"
                value={formData.personal_email}
                onChangeText={(text: string) =>
                  setFormData({ ...formData, personal_email: text })
                }
                className="mb-4"
                mode="flat"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                label="Meals per Week"
                value={formData.meals_per_week.toString()}
                onChangeText={(text: string) =>
                  setFormData({
                    ...formData,
                    meals_per_week: parseInt(text) || 0,
                  })
                }
                className="mb-4"
                mode="flat"
                keyboardType="numeric"
              />

              <Text className="text-sm font-medium text-gray-600 mb-2">
                Role
              </Text>
              <SegmentedButtons
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    type: value as 'super_admin' | 'company_admin' | 'employee',
                  })
                }
                buttons={[
                  { value: 'super_admin', label: 'Super Admin' },
                  { value: 'company_admin', label: 'Company Admin' },
                  { value: 'employee', label: 'Employee' },
                ]}
                style={{ marginBottom: 16 }}
              />

              <Text className="text-sm font-medium text-gray-600 mb-2">
                Company
              </Text>
              <Menu
                visible={!!formData.showCompanyMenu}
                onDismiss={() =>
                  setFormData({ ...formData, showCompanyMenu: false })
                }
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() =>
                      setFormData({ ...formData, showCompanyMenu: true })
                    }
                    className="border-gray-300 w-full justify-start mb-4"
                    textColor="#4b5563"
                  >
                    {formData.company_id === null
                      ? 'No Company'
                      : companies.find((c) => c.id === formData.company_id)
                          ?.name || 'Select a company'}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() =>
                    setFormData({
                      ...formData,
                      company_id: null,
                      membership_id: null,
                      showCompanyMenu: false,
                    })
                  }
                  title="No Company"
                />
                {companies.map((company) => (
                  <Menu.Item
                    key={company.id}
                    onPress={() => {
                      setFormData({
                        ...formData,
                        company_id: company.id,
                        showCompanyMenu: false,
                      });
                    }}
                    title={company.name}
                  />
                ))}
              </Menu>

              {(isInviteMode || (!isInviteMode && formData.company_id)) && (
                <>
                  <Text className="text-sm font-medium text-gray-600 mb-2">
                    Membership Plan
                  </Text>
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {memberships
                      .filter((m) => m.company_id === formData.company_id)
                      .map((membership) => (
                        <Button
                          key={membership.id}
                          mode={
                            formData.membership_id === membership.id
                              ? 'contained'
                              : 'outlined'
                          }
                          onPress={() =>
                            setFormData({
                              ...formData,
                              membership_id: membership.id,
                            })
                          }
                          className={
                            formData.membership_id === membership.id
                              ? 'bg-blue-500'
                              : 'border-gray-300'
                          }
                          textColor={
                            formData.membership_id === membership.id
                              ? 'white'
                              : '#4b5563'
                          }
                        >
                          {`${membership.plan_type} Plan`}
                        </Button>
                      ))}
                    {memberships.filter(
                      (m) => m.company_id === formData.company_id
                    ).length === 0 && (
                      <Text className="text-sm text-gray-500 italic">
                        No memberships available for this company
                      </Text>
                    )}
                  </View>
                </>
              )}

              {!isInviteMode && (
                <>
                  <Text className="text-sm font-medium text-gray-600 mb-2">
                    Status
                  </Text>
                  <SegmentedButtons
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        status: value as 'active' | 'inactive',
                      })
                    }
                    buttons={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ]}
                    style={{ marginBottom: 16 }}
                  />
                </>
              )}
            </ScrollView>

            <View className="flex-row justify-end items-center gap-3 p-4 border-t border-gray-200">
              <Button
                mode="text"
                onPress={() => setVisible(false)}
                textColor="#6b7280"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={isInviteMode ? handleInviteUser : handleUpdateUser}
                className="bg-blue-500"
                disabled={
                  isInviteMode
                    ? !formData.email || !formData.first_name
                    : !selectedUser?.email || !formData.first_name
                }
              >
                {isInviteMode ? 'Send Invitation' : 'Save Changes'}
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
        >
          <View className="mx-5 my-8 bg-white p-6 rounded-lg max-w-lg self-center w-full">
            <Text className="text-xl font-semibold text-gray-800 mb-4">
              Confirm Delete
            </Text>
            <Text className="text-gray-600 mb-6">
              Are you sure you want to delete {userToDelete?.first_name}{' '}
              {userToDelete?.last_name}? This action cannot be undone.
            </Text>
            <View className="flex-row justify-end items-center gap-3">
              <Button
                mode="text"
                onPress={() => setDeleteConfirmVisible(false)}
                textColor="#6b7280"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleDeleteUser}
                className="bg-red-500"
              >
                Delete User
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}
