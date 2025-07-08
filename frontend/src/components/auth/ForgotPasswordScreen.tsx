/**
 * Forgot Password Screen - Password Reset Flow
 * Clean interface for requesting password reset emails
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';

interface ForgotPasswordScreenProps {
  onSuccess?: () => void;
  onBackToSignIn?: () => void;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen({ onSuccess, onBackToSignIn }: ForgotPasswordScreenProps) {
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; general?: string}>({});
  const [touched, setTouched] = useState<{email?: boolean}>({});
  const [emailSent, setEmailSent] = useState(false);

  const validateForm = () => {
    const newErrors: {email?: string} = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
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

  const handleResetPassword = async () => {
    setTouched({ email: true });
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({}); // Clear any previous errors
    
    try {
      await authService.resetPassword(email.trim());
      setEmailSent(true);
      onSuccess?.();
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Enhanced error handling with user-friendly messages
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.message?.toLowerCase().includes('user not found')) {
        errorMessage = 'No account found with this email address.';
      } else if (error.message?.toLowerCase().includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.toLowerCase().includes('too many requests')) {
        errorMessage = 'Too many reset attempts. Please wait a moment and try again.';
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = () => {
    const hasError = errors.email;
    return [
      dynamicStyles.input,
      hasError && dynamicStyles.inputError,
      touched.email && !hasError && dynamicStyles.inputValid,
    ];
  };

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
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 20,
      alignSelf: 'flex-start',
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    backButtonText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
      fontWeight: '500',
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
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
      lineHeight: 22,
    },
    inputContainer: {
      marginBottom: 24,
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
    },
    inputError: {
      borderColor: '#ef4444',
      borderWidth: 2,
    },
    inputValid: {
      borderColor: '#10b981',
      borderWidth: 1,
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
    successContainer: {
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 20,
    },
    successIcon: {
      marginBottom: 12,
    },
    successTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    successText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    helpText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 16,
    },
    resendButton: {
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 16,
    },
    resendButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '500',
    },
  });

  if (emailSent) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <KeyboardAvoidingView 
          style={dynamicStyles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={dynamicStyles.content}>
            <TouchableOpacity
              style={dynamicStyles.backButton}
              onPress={onBackToSignIn}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
              <Text style={dynamicStyles.backButtonText}>Back to Sign In</Text>
            </TouchableOpacity>

            <View style={dynamicStyles.iconContainer}>
              <View style={dynamicStyles.iconCircle}>
                <Ionicons name="mail" size={32} color={colors.primary} />
              </View>
            </View>

            <Text style={dynamicStyles.title}>Check Your Email</Text>
            <Text style={dynamicStyles.subtitle}>
              We've sent a password reset link to{'\n'}{email}
            </Text>

            <View style={dynamicStyles.successContainer}>
              <Ionicons 
                name="checkmark-circle" 
                size={48} 
                color="#10b981" 
                style={dynamicStyles.successIcon}
              />
              <Text style={dynamicStyles.successTitle}>Email Sent Successfully!</Text>
              <Text style={dynamicStyles.successText}>
                Click the link in the email to reset your password. 
                The link will expire in 24 hours for security.
              </Text>
            </View>

            <Text style={dynamicStyles.helpText}>
              Didn't receive the email? Check your spam folder or try again.
            </Text>

            <TouchableOpacity
              style={dynamicStyles.resendButton}
              onPress={() => setEmailSent(false)}
              disabled={loading}
            >
              <Text style={dynamicStyles.resendButtonText}>
                Resend Email
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView 
        style={dynamicStyles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={dynamicStyles.content}>
          <TouchableOpacity
            style={dynamicStyles.backButton}
            onPress={onBackToSignIn}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={dynamicStyles.backButtonText}>Back to Sign In</Text>
          </TouchableOpacity>

          <View style={dynamicStyles.iconContainer}>
            <View style={dynamicStyles.iconCircle}>
              <Ionicons name="lock-closed" size={32} color={colors.primary} />
            </View>
          </View>

          <Text style={dynamicStyles.title}>Forgot Password?</Text>
          <Text style={dynamicStyles.subtitle}>
            No worries! Enter your email address and we'll send you a link to reset your password.
          </Text>

          {errors.general && (
            <View style={dynamicStyles.generalError}>
              <Text style={dynamicStyles.generalErrorText}>{errors.general}</Text>
            </View>
          )}

          <View style={dynamicStyles.inputContainer}>
            <View style={dynamicStyles.inputWrapper}>
              <TextInput
                style={getInputStyle()}
                placeholder="Enter your email address"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={handleEmailChange}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                returnKeyType="send"
                onSubmitEditing={handleResetPassword}
              />
            </View>
            {errors.email && <Text style={dynamicStyles.errorText}>{errors.email}</Text>}
          </View>

          <TouchableOpacity
            style={[
              dynamicStyles.button,
              loading && dynamicStyles.buttonDisabled,
            ]}
            onPress={handleResetPassword}
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Text>
          </TouchableOpacity>

          <Text style={dynamicStyles.helpText}>
            Remember your password?{' '}
            <Text 
              style={{ color: colors.primary, fontWeight: '500' }}
              onPress={onBackToSignIn}
            >
              Sign in instead
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 