import React, { useState, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Button, Input } from '@rneui/themed';
import { Database } from '../supabase/types';
import { MaterialIcons } from '@expo/vector-icons';

type Company = Database['public']['Tables']['companies']['Row'];

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
  const [userType, setUserType] = useState<'employee' | 'company_admin'>(
    'employee'
  );
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const userTypes = [
    { label: 'Employee', value: 'employee' },
    { label: 'Employer', value: 'company_admin' },
  ];

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    setCompaniesLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      if (data) {
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setCompaniesLoading(false);
    }
  }

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) Alert.alert('Error', error.message);
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert('Please enter both email and password');
      return;
    }

    if (!selectedCompany) {
      Alert.alert('Please select a company');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        Alert.alert('Error', authError.message);
        return;
      }

      if (authData.user) {
        // Add user to app_users table
        const { error: dbError } = await supabase.from('app_users').insert([
          {
            id: authData.user.id,
            type: userType,
            email: email,
            first_name: email.split('@')[0],
            company_id: selectedCompany,
            status: 'active',
          },
        ]);

        if (dbError) {
          console.error('Error adding user to app_users:', dbError);
          Alert.alert('Error', 'Failed to create user profile');
        }
      }

      if (!authData.session) {
        Alert.alert(
          'Success',
          'Please check your inbox for email verification!'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  const renderDropdown = (
    visible: boolean,
    onClose: () => void,
    items: { label: string; value: string }[],
    onSelect: (value: string, label: string) => void
  ) => {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.dropdownModal}>
            <ScrollView>
              {items.length === 0 ? (
                <View style={styles.dropdownItem}>
                  <Text style={styles.dropdownItemText}>
                    No items available
                  </Text>
                </View>
              ) : (
                items.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => {
                      onSelect(item.value, item.label);
                      onClose();
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Urban Eats Club</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Create an account' : 'Sign in to your account'}
        </Text>
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          labelStyle={styles.inputLabel}
          inputStyle={styles.input}
          leftIcon={{ type: 'font-awesome', name: 'envelope', color: '#666' }}
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          placeholderTextColor="#666"
          autoCapitalize="none"
          containerStyle={styles.inputContainer}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Input
          label="Password"
          labelStyle={styles.inputLabel}
          inputStyle={styles.input}
          leftIcon={{ type: 'font-awesome', name: 'lock', color: '#666' }}
          onChangeText={setPassword}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          placeholderTextColor="#666"
          autoCapitalize="none"
          containerStyle={styles.inputContainer}
        />
      </View>

      {isSignUp && (
        <>
          <View style={[styles.verticallySpaced, styles.pickerContainer]}>
            <Text style={styles.inputLabel}>User Type</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowTypeDropdown(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {userTypes.find((t) => t.value === userType)?.label ||
                  'Select Type'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={[styles.verticallySpaced, styles.pickerContainer]}>
            <Text style={styles.inputLabel}>Company</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCompanyDropdown(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedCompanyName || 'Select a company'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {renderDropdown(
            showTypeDropdown,
            () => setShowTypeDropdown(false),
            userTypes,
            (value) => setUserType(value as 'employee' | 'company_admin')
          )}

          {renderDropdown(
            showCompanyDropdown,
            () => setShowCompanyDropdown(false),
            companies.map((c) => ({ label: c.name, value: c.id })),
            (value, label) => {
              setSelectedCompany(value);
              setSelectedCompanyName(label);
            }
          )}
        </>
      )}

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title={isSignUp ? 'Sign up' : 'Sign in'}
          disabled={loading}
          onPress={() => (isSignUp ? signUpWithEmail() : signInWithEmail())}
          buttonStyle={styles.primaryButton}
          titleStyle={styles.buttonText}
        />
      </View>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsSignUp(!isSignUp)}
      >
        <Text style={styles.switchButtonText}>
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  inputContainer: {
    paddingHorizontal: 0,
  },
  inputLabel: {
    color: '#333',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    color: '#333',
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#f4511e',
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#f4511e',
    fontSize: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    width: '80%',
    maxHeight: '50%',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
});
