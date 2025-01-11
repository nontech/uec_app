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
import { useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';

type Company = Database['public']['Tables']['companies']['Row'];

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isInvitedUser, setIsInvitedUser] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
  const [userType, setUserType] = useState<'employee' | 'company_admin'>(
    'employee'
  );
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const searchParams = useLocalSearchParams();

  const userTypes = [
    { label: 'Employee', value: 'employee' },
    { label: 'Employer', value: 'company_admin' },
  ];

  useEffect(() => {
    // Parse hash parameters and check for invite
    const checkInviteLink = async () => {
      try {
        const url = await Linking.getInitialURL();
        console.log('Initial URL:', url);

        if (url) {
          const hashIndex = url.indexOf('#');
          if (hashIndex !== -1) {
            const hash = url.slice(hashIndex);
            const params = new URLSearchParams(hash.replace('#', ''));

            // Get all parameters
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const type = params.get('type');
            const email = params.get('email');

            if (accessToken && refreshToken) {
              setIsInvitedUser(true);
              setIsSignUp(true);
              if (email) {
                setEmail(email);
              }

              // Store tokens for later use in signUpWithEmail
              setTokens({
                accessToken,
                refreshToken,
                type: type || 'invite',
              });

              console.log('Stored tokens for invited user');
            } else {
              console.log('Missing required tokens in URL');
            }
          } else {
            console.log('No hash parameters found in URL');
          }
        } else {
          console.log('No initial URL found');
        }
      } catch (error) {
        console.error('Error parsing invite link:', error);
      }
    };

    checkInviteLink();
    fetchCompanies();
  }, []);

  // Add state for storing tokens
  const [tokens, setTokens] = useState<{
    accessToken: string;
    refreshToken: string;
    type: string;
  } | null>(null);

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
    if (!isInvitedUser && !email) {
      Alert.alert('Please enter your email');
      return;
    }

    if (!password) {
      Alert.alert('Please enter a password');
      return;
    }

    if ((isSignUp || isInvitedUser) && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!isInvitedUser && !selectedCompany) {
      Alert.alert('Please select a company');
      return;
    }

    setLoading(true);
    try {
      let authResponse;

      if (isInvitedUser && tokens) {
        // First set the session with the tokens to log them in
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
          });

        // Then update the user's password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) {
          console.error('Password update error:', updateError);
          throw updateError;
        }

        // Update user status to active in app_users table
        if (sessionData.session?.user?.id) {
          const { error: statusError } = await supabase
            .from('app_users')
            .update({ status: 'active' })
            .eq('id', sessionData.session.user.id);

          if (statusError) {
            console.error('Error updating user status:', statusError);
            throw statusError;
          }
        }

        console.log('Password updated successfully and user activated');

        authResponse = { data: { session: sessionData.session }, error: null };
      } else {
        // Regular sign up flow
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password,
          }
        );

        if (authError) throw authError;
        authResponse = { data: authData, error: null };

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
      }

      // For invited users, we should have a session at this point
      if (isInvitedUser && !authResponse?.data?.session) {
        throw new Error('Failed to create session for invited user');
      }

      // For regular sign up, show verification message
      if (!isInvitedUser && !authResponse?.data?.session) {
        Alert.alert(
          'Success',
          'Please check your inbox for email verification!'
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
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
          {isInvitedUser
            ? 'Set your password to complete account setup'
            : isSignUp
            ? 'Create an account'
            : 'Sign in to your account'}
        </Text>
      </View>

      {!isInvitedUser && (
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
      )}

      <View
        style={[
          styles.verticallySpaced,
          isInvitedUser ? styles.mt20 : undefined,
        ]}
      >
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

      {(isSignUp || isInvitedUser) && (
        <View style={styles.verticallySpaced}>
          <Input
            label="Confirm Password"
            labelStyle={styles.inputLabel}
            inputStyle={styles.input}
            leftIcon={{ type: 'font-awesome', name: 'lock', color: '#666' }}
            onChangeText={setConfirmPassword}
            value={confirmPassword}
            secureTextEntry={true}
            placeholder="Confirm Password"
            placeholderTextColor="#666"
            autoCapitalize="none"
            containerStyle={styles.inputContainer}
          />
        </View>
      )}

      {isSignUp && !isInvitedUser && (
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
          title={
            isInvitedUser ? 'Complete Setup' : isSignUp ? 'Sign up' : 'Sign in'
          }
          disabled={loading}
          onPress={async () => {
            try {
              console.log('Button pressed', { isSignUp, isInvitedUser });
              if (isSignUp || isInvitedUser) {
                await signUpWithEmail();
              } else {
                await signInWithEmail();
              }
            } catch (error) {
              console.error('Error in button press handler:', error);
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'An unexpected error occurred'
              );
            }
          }}
          buttonStyle={styles.primaryButton}
          titleStyle={styles.buttonText}
        />
      </View>

      {!isInvitedUser && (
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
      )}
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
