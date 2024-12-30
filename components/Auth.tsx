import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text } from 'react-native';
import { supabase } from '../lib/supabase';
import { Button, Input } from '@rneui/themed';

interface AuthFormData {
  email: string;
  password: string;
}

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  iconName: string;
}

const AuthInput: React.FC<AuthInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  iconName,
}) => (
  <View style={styles.verticallySpaced}>
    <Input
      label={label}
      labelStyle={styles.inputLabel}
      inputStyle={styles.input}
      leftIcon={{ type: 'font-awesome', name: iconName, color: '#666' }}
      onChangeText={onChangeText}
      value={value}
      placeholder={placeholder}
      placeholderTextColor="#666"
      autoCapitalize="none"
      secureTextEntry={secureTextEntry}
      containerStyle={styles.inputContainer}
    />
  </View>
);

const AuthHeader: React.FC = () => (
  <View style={styles.header}>
    <Text style={styles.title}>Welcome to Urban Eats Club</Text>
    <Text style={styles.subtitle}>Sign in or create an account</Text>
  </View>
);

export default function Auth() {
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof AuthFormData) => (text: string) => {
    setFormData((prev) => ({ ...prev, [field]: text }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      Alert.alert('Please enter both email and password');
      return false;
    }
    return true;
  };

  const handleAuthError = (error: any, customMessage?: string) => {
    Alert.alert(
      'Error',
      error?.message || customMessage || 'An unexpected error occurred'
    );
  };

  async function signInWithEmail() {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) handleAuthError(error);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  }

  async function signUpWithEmail() {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        handleAuthError(authError);
        return;
      }

      if (authData.user) {
        await createUserProfile(authData.user.id);
      }

      if (!authData.session) {
        Alert.alert(
          'Success',
          'Please check your inbox for email verification!'
        );
      }
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  }

  async function createUserProfile(userId: string) {
    const { error: dbError } = await supabase.from('app_users').insert([
      {
        id: userId,
        type: 'employee',
        company_email: formData.email,
        first_name: formData.email.split('@')[0],
        company_id: '56b8d075-4dcb-46a4-b1f1-95c372db3601',
      },
    ]);

    if (dbError) {
      console.error('Error adding user to app_users:', dbError);
    }
  }

  return (
    <View style={styles.container}>
      <AuthHeader />

      <AuthInput
        label="Email"
        value={formData.email}
        onChangeText={handleInputChange('email')}
        placeholder="email@address.com"
        iconName="envelope"
      />

      <AuthInput
        label="Password"
        value={formData.password}
        onChangeText={handleInputChange('password')}
        placeholder="Password"
        secureTextEntry
        iconName="lock"
      />

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title="Sign in"
          disabled={loading}
          onPress={signInWithEmail}
          buttonStyle={styles.primaryButton}
          titleStyle={styles.buttonText}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Button
          title="Sign up"
          disabled={loading}
          onPress={signUpWithEmail}
          buttonStyle={styles.secondaryButton}
          titleStyle={styles.secondaryButtonText}
        />
      </View>
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
  },
  input: {
    color: '#333',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#f4511e',
    borderRadius: 8,
    paddingVertical: 12,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#f4511e',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f4511e',
  },
});
