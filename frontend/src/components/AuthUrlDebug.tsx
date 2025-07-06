import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export const AuthUrlDebug: React.FC = () => {
  const [urlInfo, setUrlInfo] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  useEffect(() => {
    checkUrlAndStorage();
  }, []);

  const checkUrlAndStorage = () => {
    if (typeof window !== 'undefined') {
      // URL info
      const url = window.location;
      const urlParams = new URLSearchParams(url.search);
      const hashParams = new URLSearchParams(url.hash.substring(1));
      
      setUrlInfo({
        href: url.href,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        searchParams: Object.fromEntries(urlParams),
        hashParams: Object.fromEntries(hashParams),
      });

      // Storage info
      try {
        const authKey = 'sb-mhrfjtbnpxzmrppljztw-auth-token';
        const authToken = localStorage.getItem(authKey);
        const allKeys = Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('auth'));
        
        setStorageInfo({
          authToken: authToken ? 'Present' : 'Missing',
          authTokenLength: authToken ? authToken.length : 0,
          allAuthKeys: allKeys,
          localStorageSize: localStorage.length,
        });
      } catch (err) {
        setStorageInfo({ error: 'Cannot access localStorage' });
      }
    } else {
      setUrlInfo({ platform: 'React Native - no window object' });
      setStorageInfo({ platform: 'React Native - no localStorage' });
    }
  };

  const clearAuth = () => {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      checkUrlAndStorage();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔗 URL & Storage Debug</Text>
      
      <TouchableOpacity style={styles.refreshButton} onPress={checkUrlAndStorage}>
        <Text style={styles.refreshText}>Refresh Info</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearButton} onPress={clearAuth}>
        <Text style={styles.clearText}>Clear Auth Storage</Text>
      </TouchableOpacity>

      {urlInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Current URL:</Text>
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>Href: {urlInfo.href}</Text>
            <Text style={styles.debugText}>Path: {urlInfo.pathname}</Text>
            <Text style={styles.debugText}>Search: {urlInfo.search || 'None'}</Text>
            <Text style={styles.debugText}>Hash: {urlInfo.hash || 'None'}</Text>
            {Object.keys(urlInfo.searchParams).length > 0 && (
              <Text style={styles.debugText}>
                Search Params: {JSON.stringify(urlInfo.searchParams, null, 2)}
              </Text>
            )}
            {Object.keys(urlInfo.hashParams).length > 0 && (
              <Text style={styles.debugText}>
                Hash Params: {JSON.stringify(urlInfo.hashParams, null, 2)}
              </Text>
            )}
          </View>
        </View>
      )}

      {storageInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Local Storage:</Text>
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>Auth Token: {storageInfo.authToken}</Text>
            <Text style={styles.debugText}>Token Length: {storageInfo.authTokenLength}</Text>
            <Text style={styles.debugText}>Total Keys: {storageInfo.localStorageSize}</Text>
            {storageInfo.allAuthKeys && storageInfo.allAuthKeys.length > 0 && (
              <Text style={styles.debugText}>
                Auth Keys: {storageInfo.allAuthKeys.join(', ')}
              </Text>
            )}
            {storageInfo.error && (
              <Text style={styles.errorText}>Error: {storageInfo.error}</Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
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
    marginBottom: 5,
  },
  clearButton: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshText: {
    color: 'white',
    fontSize: 12,
  },
  clearText: {
    color: 'white',
    fontSize: 12,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugInfo: {
    backgroundColor: '#e9ecef',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    fontSize: 11,
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 11,
    color: 'red',
    fontFamily: 'monospace',
  },
});