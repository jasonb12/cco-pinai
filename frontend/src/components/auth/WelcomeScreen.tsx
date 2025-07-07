/**
 * Welcome Screen - First screen in AuthStack
 * Based on PRD-UI.md specifications
 */
import React from 'react';
import { 
  View, 
  Text, 
  Button, 
  YStack, 
  XStack,
  Image,
} from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useThemeStore } from '../../stores/themeStore';
import { AuthStackParamList } from '../navigation/AuthStack';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { activeTheme } = useThemeStore();
  
  const backgroundColor = activeTheme === 'dark' ? '#000000' : '#ffffff';
  
  const handleGetStarted = () => {
    navigation.navigate('SignIn');
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
        {/* Logo placeholder */}
        <YStack alignItems="center" space="$4">
          <View
            width={120}
            height={120}
            backgroundColor="$blue10"
            borderRadius="$10"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="$8" fontWeight="600" color="white">
              CC
            </Text>
          </View>
          
          <YStack alignItems="center" space="$2">
            <Text fontSize="$8" fontWeight="700" color="$color" textAlign="center">
              CCOPINAI
            </Text>
            <Text fontSize="$5" color="$color11" textAlign="center" maxWidth={280}>
              Automate continuous audio capture into actionable insights
            </Text>
          </YStack>
        </YStack>

        {/* Get Started Button */}
        <YStack space="$4" width="100%" maxWidth={300}>
          <Button
            size="$5"
            theme="blue"
            onPress={handleGetStarted}
            fontWeight="600"
            borderRadius="$4"
          >
            Get Started
          </Button>
          
          <XStack alignItems="center" justifyContent="center" space="$2">
            <Text fontSize="$3" color="$color11">
              Already have an account?
            </Text>
            <Button
              size="$3"
              chromeless
              onPress={handleGetStarted}
              color="$blue10"
              fontWeight="600"
            >
              Sign In
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
} 