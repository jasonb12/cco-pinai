import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../config/supabase';

export default function AuthPage() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback page loaded');
        console.log('Current URL:', window.location.href);
        
        // Check if we have auth tokens in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const error = urlParams.get('error') || hashParams.get('error');
        
        console.log('Auth tokens found:', { accessToken: !!accessToken, refreshToken: !!refreshToken, error });
        
        if (error) {
          console.error('OAuth error:', error);
          return;
        }
        
        if (accessToken && refreshToken) {
          console.log('Setting session with tokens...');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          console.log('Set session result:', { data, error: sessionError });
          
          if (!sessionError) {
            // Redirect back to main app
            window.location.href = '/';
          }
        } else {
          console.log('No auth tokens found in URL');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
      }
    };

    if (typeof window !== 'undefined') {
      handleAuthCallback();
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔄 Processing Authentication...</Text>
      <Text style={styles.subtitle}>Please wait while we complete your sign-in</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});