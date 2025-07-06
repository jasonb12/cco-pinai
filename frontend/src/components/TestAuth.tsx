import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../config/supabase';

export const TestAuth: React.FC = () => {
  const handleTestSignIn = async () => {
    try {
      // Create a test user with email/password
      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123',
      });
      
      if (error) {
        // If user already exists, try to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'testpassword123',
        });
        
        if (signInError) {
          Alert.alert('Error', signInError.message);
        } else {
          Alert.alert('Success', 'Signed in successfully!');
        }
      } else {
        Alert.alert('Success', 'Account created and signed in!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Authentication</Text>
      <TouchableOpacity style={styles.button} onPress={handleTestSignIn}>
        <Text style={styles.buttonText}>Sign In with Test Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 200,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});