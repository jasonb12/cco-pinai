/**
 * Sign In Screen - Email/Password + Social Login
 * Based on PRD-UI.md specifications
 */
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { 
  View, 
  Text, 
  Button, 
  YStack, 
  XStack,
  Input,
  Separator,
} from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useThemeStore } from '../../stores/themeStore';
import { AuthStackParamList } from '../navigation/AuthStack';
import { signInWithApple, signInWithGoogle } from '../../services/auth';
import { supabase } from '../../config/supabase';
import { useLoading } from '../../hooks/useLoading';
import { LoadingButton } from '../LoadingButton';

type SignInScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;

export default function SignInScreen() {
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const { activeTheme } = useThemeStore();
  const { isLoading, withLoading } = useLoading();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const backgroundColor = activeTheme === 'dark' ? '#000000' : '#ffffff';
  
  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    try {
      await withLoading('emailSignIn', async () => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          Alert.alert('Error', error.message);
        }
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign in');
    }
  };

  const handleSignInWithApple = async () => {
    try {
      await withLoading('signInApple', async () => {
        const { error } = await signInWithApple();
        if (error) Alert.alert('Error', error.message);
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign in with Apple');
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      await withLoading('signInGoogle', async () => {
        const { error } = await signInWithGoogle();
        if (error) Alert.alert('Error', error.message);
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign in with Google');
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <YStack 
        flex={1} 
        alignItems="center" 
        justifyContent="center" 
        padding="$6"
        space="$6"
      >
        {/* Header */}
        <YStack alignItems="center" space="$2">
          <Text fontSize="$8" fontWeight="700" color="$color" textAlign="center">
            Welcome Back
          </Text>
          <Text fontSize="$4" color="$color11" textAlign="center">
            Sign in to your account
          </Text>
        </YStack>

        {/* Email/Password Form */}
        <YStack space="$4" width="100%" maxWidth={300}>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            size="$5"
            borderRadius="$4"
          />
          
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            size="$5"
            borderRadius="$4"
          />
          
          <LoadingButton
            title="Sign In"
            onPress={handleEmailSignIn}
            isLoading={isLoading('emailSignIn')}
            style={{
              backgroundColor: activeTheme === 'dark' ? '#0A84FF' : '#007AFF',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
          />
          
          <Button
            size="$3"
            chromeless
            onPress={handleForgotPassword}
            color="$blue10"
            fontWeight="500"
            alignSelf="center"
          >
            Forgot Password?
          </Button>
        </YStack>

        {/* Divider */}
        <XStack alignItems="center" width="100%" maxWidth={300} space="$4">
          <Separator flex={1} />
          <Text fontSize="$3" color="$color11">
            or
          </Text>
          <Separator flex={1} />
        </XStack>

        {/* Social Login */}
        <YStack space="$3" width="100%" maxWidth={300}>
          <LoadingButton
            title="Sign in with Apple"
            onPress={handleSignInWithApple}
            isLoading={isLoading('signInApple')}
            style={{
              backgroundColor: activeTheme === 'dark' ? '#ffffff' : '#000000',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
            textStyle={{
              color: activeTheme === 'dark' ? '#000000' : '#ffffff',
            }}
          />
          
          <LoadingButton
            title="Sign in with Google"
            onPress={handleSignInWithGoogle}
            isLoading={isLoading('signInGoogle')}
            style={{
              backgroundColor: '#4285F4',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
          />
        </YStack>

        {/* Sign Up Link */}
        <XStack alignItems="center" justifyContent="center" space="$2">
          <Text fontSize="$3" color="$color11">
            Don't have an account?
          </Text>
          <Button
            size="$3"
            chromeless
            onPress={handleSignUp}
            color="$blue10"
            fontWeight="600"
          >
            Sign Up
          </Button>
        </XStack>
      </YStack>
    </SafeAreaView>
  );
} 