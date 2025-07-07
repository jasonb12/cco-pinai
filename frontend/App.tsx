import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/components/navigation/AppNavigator';
import { TamaguiProvider } from '@tamagui/core';
import config from './tamagui.config';

export default function App() {
  return (
    <TamaguiProvider config={config}>
      <AppNavigator />
      <StatusBar style="auto" />
    </TamaguiProvider>
  );
}
