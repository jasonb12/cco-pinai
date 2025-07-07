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
          // Show error message and redirect back
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
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
          } else {
            console.error('Session error:', sessionError);
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          }
        } else {
          console.log('No auth tokens found in URL, checking URL hash...');
          // Sometimes tokens are in the hash fragment after authentication
          const hash = window.location.hash;
          if (hash) {
            // Let Supabase handle the session detection
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          } else {
            console.log('No authentication data found');
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    if (typeof window !== 'undefined') {
      handleAuthCallback();
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Completing Authentication...</Text>
      <Text style={styles.subtitle}>Please wait while we sign you in</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});