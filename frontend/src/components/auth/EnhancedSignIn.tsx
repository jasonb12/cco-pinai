import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';
import { LinearGradient } from 'expo-linear-gradient';

interface EnhancedSignInProps {
  navigation: any;
}

export default function EnhancedSignIn({ navigation }: EnhancedSignInProps) {
  const colors = useThemeColors();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (isSignUp && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const result = await authService.signUp({
          email,
          password,
          name: name.trim() || undefined,
        });

        if (result.needsVerification) {
          Alert.alert(
            'Check Your Email',
            'We sent you a verification link. Please check your email and click the link to verify your account.',
            [{ text: 'OK', onPress: () => setIsSignUp(false) }]
          );
        } else {
          Alert.alert('Success', 'Account created successfully!');
        }
      } else {
        await authService.signIn({ email, password });
        // Navigation will be handled by auth state change
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'github') => {
    setIsLoading(true);

    try {
      switch (provider) {
        case 'google':
          await authService.signInWithGoogle();
          break;
        case 'apple':
          await authService.signInWithApple();
          break;
        case 'github':
          await authService.signInWithGitHub();
          break;
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(email);
      Alert.alert(
        'Reset Link Sent',
        'Check your email for a password reset link.',
        [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    logoText: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.onPrimary,
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
    },
    formContainer: {
      marginBottom: 32,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      paddingVertical: 16,
      fontSize: 16,
      color: colors.text,
    },
    eyeButton: {
      padding: 4,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    primaryButtonDisabled: {
      backgroundColor: colors.border,
    },
    primaryButtonText: {
      color: colors.onPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    primaryButtonTextDisabled: {
      color: colors.textTertiary,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      paddingHorizontal: 16,
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    oauthContainer: {
      gap: 12,
      marginBottom: 24,
    },
    oauthButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    oauthButtonGoogle: {
      backgroundColor: '#ffffff',
      borderColor: '#dadce0',
    },
    oauthButtonApple: {
      backgroundColor: '#000000',
    },
    oauthButtonGitHub: {
      backgroundColor: '#24292e',
    },
    oauthIcon: {
      marginRight: 12,
    },
    oauthText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    oauthTextGoogle: {
      color: '#3c4043',
    },
    oauthTextApple: {
      color: '#ffffff',
    },
    oauthTextGitHub: {
      color: '#ffffff',
    },
    linkButton: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    linkText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    forgotPasswordButton: {
      alignItems: 'center',
      paddingVertical: 8,
      marginBottom: 16,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginTop: 20,
      alignSelf: 'center',
    },
    backButtonText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background + '80',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
  });

  if (showForgotPassword) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <KeyboardAvoidingView
          style={dynamicStyles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={dynamicStyles.scrollView} contentContainerStyle={dynamicStyles.content}>
            <View style={dynamicStyles.header}>
              <View style={dynamicStyles.logo}>
                <Text style={dynamicStyles.logoText}>CC</Text>
              </View>
              <Text style={dynamicStyles.title}>Reset Password</Text>
              <Text style={dynamicStyles.subtitle}>
                Enter your email to receive a reset link
              </Text>
            </View>

            <View style={dynamicStyles.formContainer}>
              <View style={dynamicStyles.inputContainer}>
                <Text style={dynamicStyles.inputLabel}>Email</Text>
                <View style={dynamicStyles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={dynamicStyles.inputIcon} />
                  <TextInput
                    style={dynamicStyles.input}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  dynamicStyles.primaryButton,
                  isLoading && dynamicStyles.primaryButtonDisabled,
                ]}
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                <Text
                  style={[
                    dynamicStyles.primaryButtonText,
                    isLoading && dynamicStyles.primaryButtonTextDisabled,
                  ]}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={dynamicStyles.backButton}
              onPress={() => setShowForgotPassword(false)}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.backButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView
        style={dynamicStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={dynamicStyles.scrollView} contentContainerStyle={dynamicStyles.content}>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <View style={dynamicStyles.logo}>
              <Text style={dynamicStyles.logoText}>CC</Text>
            </View>
            <Text style={dynamicStyles.title}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
            <Text style={dynamicStyles.subtitle}>
              {isSignUp
                ? 'Join CCOPINAI to start capturing insights'
                : 'Access your account to continue'}
            </Text>
          </View>

          {/* OAuth Buttons */}
          <View style={dynamicStyles.oauthContainer}>
            <TouchableOpacity
              style={[dynamicStyles.oauthButton, dynamicStyles.oauthButtonGoogle]}
              onPress={() => handleOAuthSignIn('google')}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={20} color="#4285f4" style={dynamicStyles.oauthIcon} />
              <Text style={[dynamicStyles.oauthText, dynamicStyles.oauthTextGoogle]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[dynamicStyles.oauthButton, dynamicStyles.oauthButtonApple]}
                onPress={() => handleOAuthSignIn('apple')}
                disabled={isLoading}
              >
                <Ionicons name="logo-apple" size={20} color="#ffffff" style={dynamicStyles.oauthIcon} />
                <Text style={[dynamicStyles.oauthText, dynamicStyles.oauthTextApple]}>
                  Continue with Apple
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[dynamicStyles.oauthButton, dynamicStyles.oauthButtonGitHub]}
              onPress={() => handleOAuthSignIn('github')}
              disabled={isLoading}
            >
              <Ionicons name="logo-github" size={20} color="#ffffff" style={dynamicStyles.oauthIcon} />
              <Text style={[dynamicStyles.oauthText, dynamicStyles.oauthTextGitHub]}>
                Continue with GitHub
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={dynamicStyles.divider}>
            <View style={dynamicStyles.dividerLine} />
            <Text style={dynamicStyles.dividerText}>or</Text>
            <View style={dynamicStyles.dividerLine} />
          </View>

          {/* Email/Password Form */}
          <View style={dynamicStyles.formContainer}>
            {isSignUp && (
              <View style={dynamicStyles.inputContainer}>
                <Text style={dynamicStyles.inputLabel}>Full Name</Text>
                <View style={dynamicStyles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={dynamicStyles.inputIcon} />
                  <TextInput
                    style={dynamicStyles.input}
                    placeholder="Enter your full name"
                    value={name}
                    onChangeText={setName}
                    autoComplete="name"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
            )}

            <View style={dynamicStyles.inputContainer}>
              <Text style={dynamicStyles.inputLabel}>Email</Text>
              <View style={dynamicStyles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={dynamicStyles.inputIcon} />
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={dynamicStyles.inputContainer}>
              <Text style={dynamicStyles.inputLabel}>Password</Text>
              <View style={dynamicStyles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={dynamicStyles.inputIcon} />
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  placeholderTextColor={colors.textTertiary}
                />
                <TouchableOpacity
                  style={dynamicStyles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {isSignUp && (
              <View style={dynamicStyles.inputContainer}>
                <Text style={dynamicStyles.inputLabel}>Confirm Password</Text>
                <View style={dynamicStyles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={dynamicStyles.inputIcon} />
                  <TextInput
                    style={dynamicStyles.input}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
            )}

            {!isSignUp && (
              <TouchableOpacity
                style={dynamicStyles.forgotPasswordButton}
                onPress={() => setShowForgotPassword(true)}
              >
                <Text style={dynamicStyles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                dynamicStyles.primaryButton,
                isLoading && dynamicStyles.primaryButtonDisabled,
              ]}
              onPress={handleEmailAuth}
              disabled={isLoading}
            >
              <Text
                style={[
                  dynamicStyles.primaryButtonText,
                  isLoading && dynamicStyles.primaryButtonTextDisabled,
                ]}
              >
                {isLoading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Switch between Sign In/Up */}
          <TouchableOpacity
            style={dynamicStyles.linkButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={dynamicStyles.linkText}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : 'Need an account? Sign Up'}
            </Text>
          </TouchableOpacity>

          {/* Back to Welcome */}
          <TouchableOpacity
            style={dynamicStyles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={dynamicStyles.backButtonText}>Back to Welcome</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Loading Overlay */}
        {isLoading && (
          <View style={dynamicStyles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 