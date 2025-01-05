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
} from 'react-native-paper';
import { Database } from '../../../supabase/types';

type AppUser = Database['public']['Tables']['app_users']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];
type Membership = Database['public']['Tables']['memberships']['Row'];

type AppUserWithDetails = AppUser & {
  companies?: Company;
  memberships?: Membership;
};

type InviteFormData = {
  email: string;
  first_name: string;
  last_name: string;
  type: 'company_admin' | 'employee';
  company_id: string | null;
  membership_id: string | null;
};

export default function UsersManagement() {
  const [users, setUsers] = useState<AppUserWithDetails[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    first_name: '',
    last_name: '',
    type: 'employee',
    company_id: null,
    membership_id: null,
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
          companies (*)
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
      // First create the user record in the database
      const { error: dbError } = await supabase.from('app_users').insert([
        {
          company_id: formData.company_id!,
          company_email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          type: formData.type,
          status: 'inactive',
        },
      ]);

      if (dbError) throw dbError;

      // Then send the magic link
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: 'exp://192.168.1.2:8081',
          data: {
            type: formData.type,
            company_id: formData.company_id,
            membership_id: formData.membership_id,
            first_name: formData.first_name,
            last_name: formData.last_name,
          },
        },
      });

      if (authError) throw authError;

      setVisible(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error inviting user:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      type: 'employee',
      company_id: null,
      membership_id: null,
    });
  };

  const openInviteModal = () => {
    resetForm();
    setVisible(true);
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
            <Text className="text-sm font-medium text-gray-600">Type</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Company</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Status</Text>
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
              <Text className="text-sm text-gray-800">{user.type}</Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {user.companies?.name || '-'}
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
          </DataTable.Row>
        ))}
      </DataTable>

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)}>
          <View className="mx-5 my-8 bg-white p-6 rounded-lg max-w-lg self-center w-full">
            <Text className="text-xl font-semibold text-gray-800 mb-6">
              Invite New User
            </Text>

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

            <Text className="text-sm font-medium text-gray-600 mb-2">Role</Text>
            <SegmentedButtons
              value={formData.type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  type: value as 'company_admin' | 'employee',
                })
              }
              buttons={[
                { value: 'company_admin', label: 'Company Admin' },
                { value: 'employee', label: 'Employee' },
              ]}
              style={{ marginBottom: 16 }}
            />

            <Text className="text-sm font-medium text-gray-600 mb-2">
              Company
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {companies.map((company) => (
                <Button
                  key={company.id}
                  mode={
                    formData.company_id === company.id
                      ? 'contained'
                      : 'outlined'
                  }
                  onPress={() =>
                    setFormData({ ...formData, company_id: company.id })
                  }
                  className={
                    formData.company_id === company.id
                      ? 'bg-blue-500'
                      : 'border-gray-300'
                  }
                  textColor={
                    formData.company_id === company.id ? 'white' : '#4b5563'
                  }
                >
                  {company.name}
                </Button>
              ))}
            </View>

            {formData.company_id && (
              <>
                <Text className="text-sm font-medium text-gray-600 mb-2">
                  Membership
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
                        {membership.plan_type} Plan
                      </Button>
                    ))}
                </View>
              </>
            )}

            <View className="flex-row justify-end items-center gap-3 mt-6">
              <Button
                mode="text"
                onPress={() => setVisible(false)}
                textColor="#6b7280"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleInviteUser}
                className="bg-blue-500"
                disabled={
                  !formData.email ||
                  !formData.first_name ||
                  !formData.company_id ||
                  !formData.membership_id
                }
              >
                Send Invitation
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}
