import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../config/supabase';

export const AuthDebug: React.FC = () => {
  const [authState, setAuthState] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      setSession(session);
      setAuthState({
        hasSession: !!session,
        user: session?.user || null,
        accessToken: session?.access_token ? 'Present' : 'Missing',
        error: error?.message || null
      });
    } catch (err: any) {
      setAuthState({ error: err.message });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Auth Debug Info</Text>
      
      <TouchableOpacity style={styles.refreshButton} onPress={checkAuthState}>
        <Text style={styles.refreshText}>Refresh Auth State</Text>
      </TouchableOpacity>

      {authState && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Session: {authState.hasSession ? '✅ Active' : '❌ None'}
          </Text>
          {authState.user && (
            <Text style={styles.debugText}>
              User: {authState.user.email || 'No email'}
            </Text>
          )}
          <Text style={styles.debugText}>
            Token: {authState.accessToken}
          </Text>
          {authState.error && (
            <Text style={styles.errorText}>
              Error: {authState.error}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    margin: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#6c757d',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshText: {
    color: 'white',
    fontSize: 12,
  },
  debugInfo: {
    backgroundColor: '#e9ecef',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 12,
    color: 'red',
    fontFamily: 'monospace',
  },
});