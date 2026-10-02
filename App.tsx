import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';

import AuthNavigator from './src/navigation/AuthNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />

      <AuthNavigator />
    </NavigationContainer>
  );
}