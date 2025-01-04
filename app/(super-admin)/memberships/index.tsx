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

type Membership = Database['public']['Tables']['memberships']['Row'] & {
  companies?: {
    name: string;
    billing_email: string | null;
  };
};

type MembershipInput = {
  company_id: string | null;
  plan_type: 'S' | 'M' | 'L' | 'XL';
  monthly_price_per_employee: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'inactive';
  meals_per_week: number | null;
};

type CompanyBasic = {
  id: string;
  name: string;
};

export default function MembershipsManagement() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [companies, setCompanies] = useState<CompanyBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [membershipToDelete, setMembershipToDelete] = useState<string | null>(
    null
  );
  const [selectedMembership, setSelectedMembership] =
    useState<Membership | null>(null);
  const [formData, setFormData] = useState<MembershipInput>({
    company_id: null,
    plan_type: 'S',
    monthly_price_per_employee: null,
    start_date: null,
    end_date: null,
    status: 'active',
    meals_per_week: null,
  });

  useEffect(() => {
    fetchMemberships();
    fetchCompanies();
  }, []);

  const fetchMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select(
          `
          *,
          companies (
            name,
            billing_email
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemberships(data || []);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase.from('memberships').insert([formData]);

      if (error) throw error;

      setVisible(false);
      resetForm();
      fetchMemberships();
    } catch (error) {
      console.error('Error creating membership:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedMembership?.id) return;

    try {
      const { error } = await supabase
        .from('memberships')
        .update(formData)
        .eq('id', selectedMembership.id);

      if (error) throw error;

      setVisible(false);
      resetForm();
      fetchMemberships();
    } catch (error) {
      console.error('Error updating membership:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMemberships();
      setDeleteConfirmVisible(false);
      setMembershipToDelete(null);
    } catch (error) {
      console.error('Error deleting membership:', error);
    }
  };

  const resetForm = () => {
    setSelectedMembership(null);
    setFormData({
      company_id: null,
      plan_type: 'S',
      monthly_price_per_employee: null,
      start_date: null,
      end_date: null,
      status: 'active',
      meals_per_week: null,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setVisible(true);
  };

  const openEditModal = (membership: Membership) => {
    setSelectedMembership(membership);
    setFormData({
      company_id: membership.company_id,
      plan_type: (membership.plan_type || 'S') as 'S' | 'M' | 'L' | 'XL',
      monthly_price_per_employee: membership.monthly_price_per_employee,
      start_date: membership.start_date,
      end_date: membership.end_date,
      status: (membership.status || 'active') as 'active' | 'inactive',
      meals_per_week: membership.meals_per_week,
    });
    setVisible(true);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  const openDeleteConfirm = (id: string) => {
    setMembershipToDelete(id);
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
          Company Memberships
        </Text>
        <Button
          mode="contained"
          onPress={openCreateModal}
          className="bg-blue-500"
        >
          Add Membership
        </Button>
      </View>

      <DataTable className="bg-white">
        <DataTable.Header>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Company</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Plan Type</Text>
          </DataTable.Title>
          <DataTable.Title numeric>
            <Text className="text-sm font-medium text-gray-600">
              Price/Employee
            </Text>
          </DataTable.Title>
          <View className="w-4" />
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">
              Start Date
            </Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">End Date</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Status</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Actions</Text>
          </DataTable.Title>
        </DataTable.Header>

        {memberships.map((membership) => (
          <DataTable.Row key={membership.id}>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {(membership.companies as any)?.name}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {membership.plan_type}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell numeric>
              <Text className="text-sm text-gray-800">
                €{membership.monthly_price_per_employee}
              </Text>
            </DataTable.Cell>
            <View className="w-4" />
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {formatDate(membership.start_date)}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {formatDate(membership.end_date)}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text
                className={`text-sm ${
                  membership.status === 'active'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {membership.status}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <View className="flex-row gap-2">
                <Button
                  mode="outlined"
                  onPress={() => openEditModal(membership)}
                  className="border-blue-500"
                  textColor="#3b82f6"
                >
                  Edit
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => openDeleteConfirm(membership.id)}
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
          <View className="mx-5 my-8 bg-white p-6 rounded-lg max-w-lg self-center w-full">
            <Text className="text-xl font-semibold text-gray-800 mb-6">
              {selectedMembership ? 'Edit Membership' : 'Add Membership'}
            </Text>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-600 mb-2">
                Company
              </Text>
              <View className="flex-row flex-wrap gap-2">
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
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-600 mb-2">
                Plan Type
              </Text>
              <SegmentedButtons
                value={formData.plan_type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    plan_type: value as 'S' | 'M' | 'L' | 'XL',
                  })
                }
                buttons={[
                  { value: 'S', label: 'Small' },
                  { value: 'M', label: 'Medium' },
                  { value: 'L', label: 'Large' },
                  { value: 'XL', label: 'X-Large' },
                ]}
                style={{ marginBottom: 16 }}
              />
            </View>

            <TextInput
              label="Monthly Price per Employee (€)"
              value={formData.monthly_price_per_employee?.toString() || ''}
              onChangeText={(text: string) =>
                setFormData({
                  ...formData,
                  monthly_price_per_employee: text ? parseFloat(text) : null,
                })
              }
              keyboardType="decimal-pad"
              className="mb-6"
              mode="flat"
            />

            <TextInput
              label="Start Date"
              value={formData.start_date || ''}
              onChangeText={(text: string) =>
                setFormData({ ...formData, start_date: text || null })
              }
              placeholder="YYYY-MM-DD"
              className="mb-6"
              mode="flat"
            />

            <TextInput
              label="End Date"
              value={formData.end_date || ''}
              onChangeText={(text: string) =>
                setFormData({ ...formData, end_date: text || null })
              }
              placeholder="YYYY-MM-DD"
              className="mb-6"
              mode="flat"
            />

            <View className="mb-6">
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
            </View>

            <TextInput
              label="Meals per Week"
              value={formData.meals_per_week?.toString() || ''}
              onChangeText={(text: string) =>
                setFormData({
                  ...formData,
                  meals_per_week: text ? parseInt(text, 10) : null,
                })
              }
              keyboardType="numeric"
              className="mb-6"
              mode="flat"
            />

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
                onPress={selectedMembership ? handleUpdate : handleCreate}
                className="bg-blue-500"
              >
                {selectedMembership ? 'Save Changes' : 'Create Membership'}
              </Button>
            </View>
          </View>
        </Modal>

        <Modal
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
        >
          <View className="mx-5 my-8 bg-white p-6 rounded-lg max-w-lg self-center w-full">
            <Text className="text-xl font-semibold text-gray-800 mb-6">
              Confirm Deletion
            </Text>
            <Text className="text-base text-gray-600 mb-6">
              Are you sure you want to delete this membership? This action
              cannot be undone.
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
                onPress={() =>
                  membershipToDelete && handleDelete(membershipToDelete)
                }
                className="bg-red-500"
              >
                Delete
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}
