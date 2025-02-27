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
  Menu,
} from 'react-native-paper';
import { Database } from '../../../supabase/types';
import { ScrollView } from 'react-native';
import {
  europeanCountries,
  type EuropeanCountry,
} from '../../../lib/constants/countries';
import { useRouter } from 'expo-router';

type Company = Database['public']['Tables']['companies']['Row'];
type CompanyInput = {
  name: string;
  description: string | null;
  logo_url: string | null;
  billing_email: string | null;
  vat_id: string | null;
  tax_id: string | null;
  address?: string;
};
type Address = Database['public']['Tables']['addresses']['Row'];
type AddressInput = {
  address: string | null;
  postal_code: number | null;
  city: string | null;
  state: string | null;
  country: EuropeanCountry;
};

type CompanyWithAddress = Company & {
  addresses: Address;
};

export default function CompaniesManagement() {
  const [companies, setCompanies] = useState<CompanyWithAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [companyToDelete, setCompanyToDelete] =
    useState<CompanyWithAddress | null>(null);
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyWithAddress | null>(null);
  const [formData, setFormData] = useState<{
    company: CompanyInput;
    address: AddressInput;
    showCountryMenu?: boolean;
  }>({
    company: {
      name: '',
      description: '',
      logo_url: '',
      billing_email: '',
      vat_id: '',
      tax_id: '',
    },
    address: {
      address: '',
      postal_code: null,
      city: '',
      state: '',
      country: 'Germany' as EuropeanCountry,
    },
  });
  const router = useRouter();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(
          `
          *,
          addresses (*)
        `
        )
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      // First create the address
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .insert([formData.address])
        .select()
        .single();

      if (addressError) throw addressError;

      // Then create the company with the new address
      const { error: companyError } = await supabase.from('companies').insert([
        {
          name: formData.company.name,
          description: formData.company.description,
          logo_url: formData.company.logo_url,
          billing_email: formData.company.billing_email,
          vat_id: formData.company.vat_id,
          tax_id: formData.company.tax_id,
          address: addressData.id,
        },
      ]);

      if (companyError) throw companyError;

      setVisible(false);
      resetForm();
      fetchCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCompany?.id) return;

    try {
      // Update address
      const { error: addressError } = await supabase
        .from('addresses')
        .update(formData.address)
        .eq('id', selectedCompany.address);

      if (addressError) throw addressError;

      // Update company
      const { error: companyError } = await supabase
        .from('companies')
        .update(formData.company)
        .eq('id', selectedCompany.id);

      if (companyError) throw companyError;

      setVisible(false);
      resetForm();
      fetchCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete company first (address will be handled by foreign key cascade)
      const { error } = await supabase.from('companies').delete().eq('id', id);

      if (error) throw error;
      fetchCompanies();
      setDeleteConfirmVisible(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  const resetForm = () => {
    setSelectedCompany(null);
    setFormData({
      company: {
        name: '',
        description: '',
        logo_url: '',
        billing_email: '',
        vat_id: '',
        tax_id: '',
      },
      address: {
        address: '',
        postal_code: null,
        city: '',
        state: '',
        country: 'Germany' as EuropeanCountry,
      },
    });
  };

  const openCreateModal = () => {
    resetForm();
    setVisible(true);
  };

  const openEditModal = (company: CompanyWithAddress) => {
    setSelectedCompany(company);
    setFormData({
      company: {
        name: company.name,
        description: company.description || '',
        logo_url: company.logo_url || '',
        billing_email: company.billing_email || '',
        vat_id: company.vat_id || '',
        tax_id: company.tax_id || '',
      },
      address: {
        address: company.addresses.address || '',
        postal_code: company.addresses.postal_code,
        city: company.addresses.city || '',
        state: company.addresses.state || '',
        country: company.addresses.country as EuropeanCountry,
      },
    });
    setVisible(true);
  };

  const openDeleteConfirm = (company: CompanyWithAddress) => {
    setCompanyToDelete(company);
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
          Companies Management
        </Text>
        <Button
          mode="contained"
          onPress={openCreateModal}
          className="bg-blue-500"
        >
          Add Company
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
            <Text className="text-sm font-medium text-gray-600">Address</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">City</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Country</Text>
          </DataTable.Title>
          <DataTable.Title>
            <Text className="text-sm font-medium text-gray-600">Actions</Text>
          </DataTable.Title>
        </DataTable.Header>

        {companies.map((company) => (
          <DataTable.Row key={company.id}>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">{company.name}</Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {company.billing_email || '-'}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {company.addresses.address || '-'}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {company.addresses.city || '-'}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <Text className="text-sm text-gray-800">
                {company.addresses.country || '-'}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <View className="flex-col gap-2">
                <View className="flex-row gap-2 mb-2">
                  <Button
                    mode="outlined"
                    onPress={() => openEditModal(company)}
                    className="border-blue-500"
                    textColor="#3b82f6"
                  >
                    Edit
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => openDeleteConfirm(company)}
                    className="border-red-500"
                    textColor="#ef4444"
                  >
                    Delete
                  </Button>
                </View>
                <Button
                  mode="outlined"
                  onPress={() =>
                    router.push(`/companies/${company.id}/allowedRestaurants`)
                  }
                  className="border-green-500 mt-1"
                  textColor="#22c55e"
                >
                  Manage Restaurants
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
                {selectedCompany ? 'Edit Company' : 'Add Company'}
              </Text>

              <Text className="text-sm font-medium text-gray-600 mb-2">
                Company Details
              </Text>
              <TextInput
                label="Company Name"
                value={formData.company.name}
                onChangeText={(text: string) =>
                  setFormData({
                    ...formData,
                    company: { ...formData.company, name: text },
                  })
                }
                className="mb-4"
                mode="flat"
              />

              <TextInput
                label="Description"
                value={formData.company.description || ''}
                onChangeText={(text: string) =>
                  setFormData({
                    ...formData,
                    company: { ...formData.company, description: text },
                  })
                }
                className="mb-4"
                mode="flat"
                multiline
                numberOfLines={2}
              />

              <TextInput
                label="Billing Email"
                value={formData.company.billing_email || ''}
                onChangeText={(text: string) =>
                  setFormData({
                    ...formData,
                    company: { ...formData.company, billing_email: text },
                  })
                }
                className="mb-4"
                mode="flat"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                label="VAT ID"
                value={formData.company.vat_id || ''}
                onChangeText={(text: string) =>
                  setFormData({
                    ...formData,
                    company: { ...formData.company, vat_id: text },
                  })
                }
                className="mb-4"
                mode="flat"
              />

              <TextInput
                label="Tax ID"
                value={formData.company.tax_id || ''}
                onChangeText={(text: string) =>
                  setFormData({
                    ...formData,
                    company: { ...formData.company, tax_id: text },
                  })
                }
                className="mb-6"
                mode="flat"
              />

              <Text className="text-sm font-medium text-gray-600 mb-2">
                Address
              </Text>
              <TextInput
                label="Street Address"
                value={formData.address.address || ''}
                onChangeText={(text: string) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, address: text },
                  })
                }
                className="mb-4"
                mode="flat"
              />

              <TextInput
                label="Postal Code"
                value={formData.address.postal_code?.toString() || ''}
                onChangeText={(text: string) =>
                  setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      postal_code: parseInt(text) || null,
                    },
                  })
                }
                className="mb-4"
                mode="flat"
                keyboardType="numeric"
              />

              <TextInput
                label="City"
                value={formData.address.city || ''}
                onChangeText={(text: string) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: text },
                  })
                }
                className="mb-4"
                mode="flat"
              />

              <TextInput
                label="State"
                value={formData.address.state || ''}
                onChangeText={(text: string) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: text },
                  })
                }
                className="mb-4"
                mode="flat"
              />

              <Text className="text-sm font-medium text-gray-600 mb-2">
                Country
              </Text>
              <Menu
                visible={!!formData.showCountryMenu}
                onDismiss={() =>
                  setFormData({ ...formData, showCountryMenu: false })
                }
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() =>
                      setFormData({ ...formData, showCountryMenu: true })
                    }
                    className="border-gray-300 w-full justify-start mb-4"
                    textColor="#4b5563"
                  >
                    {formData.address.country || 'Select a country'}
                  </Button>
                }
              >
                {europeanCountries.map((country) => (
                  <Menu.Item
                    key={country}
                    onPress={() => {
                      setFormData({
                        ...formData,
                        address: { ...formData.address, country },
                        showCountryMenu: false,
                      });
                    }}
                    title={country}
                  />
                ))}
              </Menu>
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
                onPress={selectedCompany ? handleUpdate : handleCreate}
                className="bg-blue-500"
              >
                {selectedCompany ? 'Save Changes' : 'Create Company'}
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
              Confirm Company Deletion
            </Text>
            <Text className="text-base text-gray-600 mb-2">
              Are you sure you want to delete the company "
              {companyToDelete?.name}"?
            </Text>
            <Text className="text-sm text-red-600 mb-6">
              This will also delete all memberships associated with this
              company. This action cannot be undone.
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
                  companyToDelete?.id && handleDelete(companyToDelete.id)
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
