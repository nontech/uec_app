import React, { useState, useEffect } from 'react';
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Linking as RNLinking,
  Image,
  Dimensions,
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

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1'
      >
        <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
          <View className='flex-1 bg-white'>
            {/* Header Section with Illustration */}
            <View className='px-6 pt-8 pb-6 bg-black w-full'>
              <View className='max-w-[400px] mx-auto'>
                <View className='w-full'>
                  <View className='bg-white rounded-2xl py-4 px-6 shadow-lg'>
                    <Image
                      source={require('../assets/images/logo.png')}
                      style={{
                        width: '100%',
                        height: 160,
                        resizeMode: 'contain',
                      }}
                    />
                  </View>
                </View>

                {/* Illustration */}
                <View className='items-center justify-center mb-4'>
                  <Image
                    source={require('../assets/images/special-event.png')}
                    style={{
                      width: '100%',
                      height: 160,
                      resizeMode: 'contain',
                    }}
                  />
                </View>

                <Text className='text-lg text-gray-300 text-center mb-2 font-medium'>
                  {isInvitedUser
                    ? 'Complete Your Account Setup'
                    : 'Welcome to Urban Eats Club'}
                </Text>
                <Text className='text-sm text-gray-400 text-center max-w-[280px] mx-auto leading-5'>
                  Experience premium dining benefits with your team
                </Text>
              </View>
            </View>

            <View className='p-4 bg-white rounded-t-3xl -mt-4'>
              <View className='flex flex-col items-center'>
                {!isInvitedUser && (
                  <View className='flex items-center'>
                    <Input
                      inputStyle={{
                        color: '#1F2937',
                        fontSize: 14,
                        marginLeft: 4,
                      }}
                      leftIcon={{
                        type: 'font-awesome',
                        name: 'envelope',
                        color: '#9CA3AF',
                        size: 14,
                      }}
                      onChangeText={setEmail}
                      value={email}
                      placeholder='email@address.com'
                      placeholderTextColor='#9CA3AF'
                      autoCapitalize='none'
                      containerStyle={{
                        padding: 0,
                        marginBottom: 0,
                        width: 360,
                      }}
                      inputContainerStyle={{
                        borderWidth: 0,
                        borderBottomWidth: 1,
                        borderBottomColor: '#E5E7EB',
                        paddingHorizontal: 0,
                        paddingVertical: 2,
                        backgroundColor: 'transparent',
                        minHeight: 38,
                      }}
                    />
                  </View>
                )}

                <View className='mb-1 flex items-center'>
                  <Input
                    inputStyle={{
                      color: '#1F2937',
                      fontSize: 14,
                      marginLeft: 4,
                    }}
                    leftIcon={{
                      type: 'font-awesome',
                      name: 'lock',
                      color: '#9CA3AF',
                      size: 14,
                    }}
                    onChangeText={setPassword}
                    value={password}
                    secureTextEntry={true}
                    placeholder='Enter your password'
                    placeholderTextColor='#9CA3AF'
                    autoCapitalize='none'
                    containerStyle={{
                      padding: 0,
                      marginBottom: 0,
                      width: 360,
                    }}
                    inputContainerStyle={{
                      borderWidth: 0,
                      borderBottomWidth: 1,
                      borderBottomColor: '#E5E7EB',
                      paddingHorizontal: 0,
                      paddingVertical: 2,
                      backgroundColor: 'transparent',
                      minHeight: 38,
                    }}
                  />
                </View>

                {(isSignUp || isInvitedUser) && (
                  <View className='mb-1 flex items-center'>
                    <Input
                      label='Confirm Password'
                      labelStyle={{
                        color: '#374151',
                        fontWeight: '500',
                        marginBottom: 4,
                        fontSize: 13,
                      }}
                      inputStyle={{
                        color: '#1F2937',
                        fontSize: 14,
                        marginLeft: 4,
                      }}
                      leftIcon={{
                        type: 'font-awesome',
                        name: 'lock',
                        color: '#9CA3AF',
                        size: 14,
                      }}
                      onChangeText={setConfirmPassword}
                      value={confirmPassword}
                      secureTextEntry={true}
                      placeholder='Confirm your password'
                      placeholderTextColor='#9CA3AF'
                      autoCapitalize='none'
                      containerStyle={{
                        padding: 0,
                        marginBottom: 0,
                        width: 360,
                      }}
                      inputContainerStyle={{
                        borderWidth: 0,
                        borderBottomWidth: 1,
                        borderBottomColor: '#E5E7EB',
                        paddingHorizontal: 0,
                        paddingVertical: 6,
                        backgroundColor: 'transparent',
                        minHeight: 38,
                      }}
                    />
                  </View>
                )}

                {isSignUp && !isInvitedUser && (
                  <>
                    <View className='mb-3 flex items-center w-[360px]'>
                      <Text className='text-gray-700 font-medium mb-1 text-sm self-start'>
                        User Type
                      </Text>
                      <TouchableOpacity
                        className='flex-row items-center justify-between px-0 py-2 w-full border-b border-gray-200'
                        onPress={() => setShowTypeDropdown(true)}
                      >
                        <Text className='text-gray-800 text-[14px]'>
                          {userTypes.find((t) => t.value === userType)?.label ||
                            'Select Type'}
                        </Text>
                        <MaterialIcons
                          name='arrow-drop-down'
                          size={18}
                          color='#9CA3AF'
                        />
                      </TouchableOpacity>
                    </View>

                    <View className='mb-3 flex items-center w-[360px]'>
                      <Text className='text-gray-700 font-medium mb-1 text-sm self-start'>
                        Company
                      </Text>
                      <TouchableOpacity
                        className='flex-row items-center justify-between px-0 py-2 w-full border-b border-gray-200'
                        onPress={() => setShowCompanyDropdown(true)}
                      >
                        <Text className='text-gray-800 text-[14px]'>
                          {selectedCompanyName || 'Select a company'}
                        </Text>
                        <MaterialIcons
                          name='arrow-drop-down'
                          size={18}
                          color='#9CA3AF'
                        />
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                <View className='mt-4 flex items-center w-[360px]'>
                  <Button
                    title={isInvitedUser ? 'Complete Setup' : 'Sign In'}
                    disabled={loading}
                    onPress={async () => {
                      try {
                        if (isInvitedUser) {
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
                    loading={loading}
                    loadingProps={{ color: '#fff' }}
                    buttonStyle={{
                      backgroundColor: '#4F46E5',
                      paddingVertical: 11,
                      borderRadius: 8,
                      shadowColor: '#4F46E5',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.12,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                    titleStyle={{
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: '500',
                      letterSpacing: 0.3,
                    }}
                    containerStyle={{
                      width: 360,
                    }}
                  />
                </View>

                {/* Contact Us Section with updated styling */}
                <View className='mt-8 items-center w-[360px]'>
                  <Text className='text-gray-500 text-center mb-2 text-sm'>
                    Don't have an account?
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      RNLinking.openURL('mailto:info@urbaneatsclub.com')
                    }
                    className='mt-1 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors w-full'
                  >
                    <Text className='text-gray-700 font-medium text-sm text-center'>
                      Contact us at info@urbaneatsclub.com
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dropdowns */}
      <Modal visible={showTypeDropdown} transparent animationType='fade'>
        <TouchableOpacity
          className='flex-1 bg-black/50 justify-center items-center'
          activeOpacity={1}
          onPress={() => setShowTypeDropdown(false)}
        >
          <View className='bg-white rounded-2xl p-4 w-[85%] max-h-[50%]'>
            <ScrollView>
              {userTypes.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  className='py-4 px-4 border-b border-gray-200'
                  onPress={() => {
                    setUserType(item.value as 'employee' | 'company_admin');
                    setShowTypeDropdown(false);
                  }}
                >
                  <Text className='text-black text-base'>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showCompanyDropdown} transparent animationType='fade'>
        <TouchableOpacity
          className='flex-1 bg-black/50 justify-center items-center'
          activeOpacity={1}
          onPress={() => setShowCompanyDropdown(false)}
        >
          <View className='bg-white rounded-2xl p-4 w-[85%] max-h-[50%]'>
            <ScrollView>
              {companies.length === 0 ? (
                <View className='py-4 px-4'>
                  <Text className='text-black text-base'>
                    No companies available
                  </Text>
                </View>
              ) : (
                companies.map((company, index) => (
                  <TouchableOpacity
                    key={index}
                    className='py-4 px-4 border-b border-gray-200'
                    onPress={() => {
                      setSelectedCompany(company.id);
                      setSelectedCompanyName(company.name);
                      setShowCompanyDropdown(false);
                    }}
                  >
                    <Text className='text-black text-base'>{company.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
