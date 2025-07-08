/**
 * Sign In Screen - Email/Password + Social Login
 * Based on PRD-UI.md specifications
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@tamagui/button';
import { Stack } from '@tamagui/core';
import { Input } from '@tamagui/input';
import { Separator } from '@tamagui/separator';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';
import ForgotPasswordScreen from './ForgotPasswordScreen';

interface SignInScreenProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

const REMEMBER_ME_KEY = 'remember_me_preference';
const SAVED_CREDENTIALS_KEY = 'saved_credentials';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen({ onSuccess, onSwitchToSignUp }: SignInScreenProps) {
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string; general?: string}>({});
  const [touched, setTouched] = useState<{email?: boolean; password?: boolean}>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Load saved preferences and credentials on mount
  useEffect(() => {
    loadSavedPreferences();
  }, []);

  const loadSavedPreferences = async () => {
    try {
      // Load remember me preference
      const savedRememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      if (savedRememberMe === 'true') {
        setRememberMe(true);
        
        // Load saved credentials if remember me is enabled
        const savedCredentials = await AsyncStorage.getItem(SAVED_CREDENTIALS_KEY);
        if (savedCredentials) {
          const { email: savedEmail } = JSON.parse(savedCredentials);
          setEmail(savedEmail);
        }
      }
    } catch (error) {
      console.error('Error loading saved preferences:', error);
    }
  };

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (touched.email && errors.email) {
      // Clear email error on change if field was touched
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (touched.password && errors.password) {
      // Clear password error on change if field was touched
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleEmailSignIn = async () => {
    setTouched({ email: true, password: true });
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({}); // Clear any previous errors
    
    try {
      await authService.signIn({ email: email.trim(), password });
      
      // Handle remember me functionality
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
        await AsyncStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify({
          email: email.trim(),
          // Note: We don't save the password for security reasons
        }));
      } else {
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
        await AsyncStorage.removeItem(SAVED_CREDENTIALS_KEY);
      }
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Enhanced error handling with user-friendly messages
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error.message?.toLowerCase().includes('invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.toLowerCase().includes('email not confirmed')) {
        errorMessage = 'Please check your email and click the verification link before signing in.';
      } else if (error.message?.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.toLowerCase().includes('too many requests')) {
        errorMessage = 'Too many sign-in attempts. Please wait a moment and try again.';
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setErrors({}); // Clear any previous errors
    
    try {
      let result;
      if (provider === 'google') {
        result = await authService.signInWithGoogle();
      } else {
        result = await authService.signInWithApple();
      }
      
      if (result.url) {
        // Handle remember me for social login
        if (rememberMe) {
          await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
        }
        
        // Handle redirect flow
        onSuccess?.();
      }
    } catch (error: any) {
      console.error(`${provider} sign in error:`, error);
      
      let errorMessage = `Failed to sign in with ${provider}. Please try again.`;
      
      if (error.message?.toLowerCase().includes('cancelled')) {
        errorMessage = `${provider} sign-in was cancelled.`;
      } else if (error.message?.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const toggleRememberMe = async () => {
    const newValue = !rememberMe;
    setRememberMe(newValue);
    
    if (!newValue) {
      // If turning off remember me, clear saved data
      await AsyncStorage.removeItem(REMEMBER_ME_KEY);
      await AsyncStorage.removeItem(SAVED_CREDENTIALS_KEY);
    }
  };

  const getInputStyle = (fieldName: 'email' | 'password') => {
    const hasError = errors[fieldName];
    return [
      dynamicStyles.input,
      hasError && dynamicStyles.inputError,
      touched[fieldName] && !hasError && dynamicStyles.inputValid,
    ];
  };

  // Show Forgot Password screen if selected
  if (showForgotPassword) {
    return (
      <ForgotPasswordScreen
        onSuccess={() => {
          setShowForgotPassword(false);
        }}
        onBackToSignIn={() => setShowForgotPassword(false)}
      />
    );
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      paddingRight: 50, // Space for password toggle
    },
    inputError: {
      borderColor: '#ef4444',
      borderWidth: 2,
    },
    inputValid: {
      borderColor: '#10b981',
      borderWidth: 1,
    },
    passwordToggle: {
      position: 'absolute',
      right: 12,
      top: 12,
      padding: 4,
    },
    errorText: {
      color: '#ef4444',
      fontSize: 14,
      marginTop: 4,
      marginLeft: 4,
    },
    generalError: {
      backgroundColor: '#fef2f2',
      borderColor: '#ef4444',
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    generalErrorText: {
      color: '#dc2626',
      fontSize: 14,
      textAlign: 'center',
    },
    forgotPasswordContainer: {
      alignItems: 'flex-end',
      marginBottom: 20,
    },
    forgotPasswordButton: {
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    forgotPasswordText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    rememberMeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    rememberMeText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    rememberMeSwitch: {
      marginLeft: 12,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    buttonDisabled: {
      backgroundColor: colors.border,
      opacity: 0.6,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    buttonTextDisabled: {
      color: colors.textTertiary,
    },
    loadingIndicator: {
      marginRight: 8,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 12,
    },
    socialButtonDisabled: {
      opacity: 0.6,
    },
    socialButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 8,
    },
    switchButton: {
      alignItems: 'center',
      marginTop: 16,
    },
    switchButtonText: {
      color: colors.primary,
      fontSize: 16,
    },
    securityNote: {
      marginTop: 8,
      paddingHorizontal: 4,
    },
    securityNoteText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView 
        style={dynamicStyles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={dynamicStyles.content}>
          <Text style={dynamicStyles.title}>Welcome Back</Text>
          <Text style={dynamicStyles.subtitle}>Sign in to your account</Text>

          {errors.general && (
            <View style={dynamicStyles.generalError}>
              <Text style={dynamicStyles.generalErrorText}>{errors.general}</Text>
            </View>
          )}

          <View style={dynamicStyles.inputContainer}>
            <View style={dynamicStyles.inputWrapper}>
              <TextInput
                style={getInputStyle('email')}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={handleEmailChange}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>
            {errors.email && <Text style={dynamicStyles.errorText}>{errors.email}</Text>}
          </View>

          <View style={dynamicStyles.inputContainer}>
            <View style={dynamicStyles.inputWrapper}>
              <TextInput
                style={getInputStyle('password')}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={handlePasswordChange}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                editable={!loading}
              />
              <TouchableOpacity
                style={dynamicStyles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={dynamicStyles.errorText}>{errors.password}</Text>}
          </View>

          {/* Forgot Password Link */}
          <View style={dynamicStyles.forgotPasswordContainer}>
            <TouchableOpacity
              style={dynamicStyles.forgotPasswordButton}
              onPress={() => setShowForgotPassword(true)}
              disabled={loading}
            >
              <Text style={dynamicStyles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Keep me logged in section */}
          <View style={dynamicStyles.rememberMeContainer}>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              onPress={toggleRememberMe}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Ionicons 
                name={rememberMe ? 'checkmark-circle' : 'ellipse-outline'} 
                size={20} 
                color={rememberMe ? colors.primary : colors.textSecondary}
                style={{ marginRight: 8 }}
              />
              <Text style={dynamicStyles.rememberMeText}>Keep me logged in</Text>
            </TouchableOpacity>
            
            <Switch
              style={dynamicStyles.rememberMeSwitch}
              value={rememberMe}
              onValueChange={toggleRememberMe}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={rememberMe ? colors.onPrimary : colors.textSecondary}
              disabled={loading}
            />
          </View>

          {rememberMe && (
            <View style={dynamicStyles.securityNote}>
              <Text style={dynamicStyles.securityNoteText}>
                🔒 Only your email will be saved. For security, you'll still need to enter your password.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              dynamicStyles.button,
              loading && dynamicStyles.buttonDisabled,
            ]}
            onPress={handleEmailSignIn}
            disabled={loading}
          >
            {loading && (
              <ActivityIndicator 
                size="small" 
                color={colors.onPrimary} 
                style={dynamicStyles.loadingIndicator} 
              />
            )}
            <Text style={[
              dynamicStyles.buttonText,
              loading && dynamicStyles.buttonTextDisabled,
            ]}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={{ color: colors.textSecondary, marginHorizontal: 16 }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          <TouchableOpacity
            style={[
              dynamicStyles.socialButton,
              loading && dynamicStyles.socialButtonDisabled,
            ]}
            onPress={() => handleSocialSignIn('google')}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={20} color={colors.text} />
            <Text style={dynamicStyles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              dynamicStyles.socialButton,
              loading && dynamicStyles.socialButtonDisabled,
            ]}
            onPress={() => handleSocialSignIn('apple')}
            disabled={loading}
          >
            <Ionicons name="logo-apple" size={20} color={colors.text} />
            <Text style={dynamicStyles.socialButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          {onSwitchToSignUp && (
            <TouchableOpacity
              style={dynamicStyles.switchButton}
              onPress={onSwitchToSignUp}
              disabled={loading}
            >
              <Text style={dynamicStyles.switchButtonText}>
                Don't have an account? Sign Up
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 