/**
 * Auth Stack Navigation - React Navigation v7
 * Based on PRD-UI.md navigation specifications
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import auth screens
import WelcomeScreen from '../auth/WelcomeScreen';
import SignInScreen from '../auth/SignInScreen';
import SignUpScreen from '../auth/SignUpScreen';
import VerifyEmailScreen from '../auth/VerifyEmailScreen';
import ForgotPasswordScreen from '../auth/ForgotPasswordScreen';

// Import theme store
import { useThemeStore } from '../../stores/themeStore';

const Stack = createNativeStackNavigator();

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  VerifyEmail: { email: string };
  ForgotPassword: undefined;
};

export default function AuthStack() {
  const { activeTheme } = useThemeStore();
  
  const screenOptions = {
    headerShown: false,
    contentStyle: {
      backgroundColor: activeTheme === 'dark' ? '#000000' : '#ffffff',
    },
  };

  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={screenOptions}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
      />
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
      />
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
    </Stack.Navigator>
  );
} 