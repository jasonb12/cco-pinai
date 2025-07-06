import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, FlatList, TextInput } from 'react-native';
import { supabase } from './src/config/supabase';
import { signInWithApple, signInWithGoogle, signOut } from './src/services/auth';
import { pickAudioFile, uploadAudioFile, validateAudioFile } from './src/services/fileUpload';
import { api } from './src/services/api';
import { TranscriptWebSocket } from './src/services/websocket';
import { LoadingButton } from './src/components/LoadingButton';
import { LoadingOverlay } from './src/components/LoadingOverlay';
import { TestAuth } from './src/components/TestAuth';
import { AuthDebug } from './src/components/AuthDebug';
import { AuthUrlDebug } from './src/components/AuthUrlDebug';
import { useLoading } from './src/hooks/useLoading';
import { User, Transcript, MCPServer } from './src/types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [mcps, setMcps] = useState<MCPServer[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [websocket, setWebsocket] = useState<TranscriptWebSocket | null>(null);
  const { isLoading, withLoading } = useLoading();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setUser(session?.user ?? null);
    });

    // Listen for auth changes with more detailed logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change event:', event);
      console.log('Session data:', session);
      console.log('User from session:', session?.user);
      setUser(session?.user ?? null);
    });

    // Also check for hash/query params in URL (for web OAuth redirect)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      console.log('URL search params:', Object.fromEntries(urlParams));
      console.log('URL hash params:', Object.fromEntries(hashParams));
      
      // Check if we have auth tokens in URL
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        console.log('Found auth tokens in URL, setting session...');
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ data, error }) => {
          console.log('Set session result:', { data, error });
        });
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadMCPs();
      setupWebSocket();
    }
    return () => {
      if (websocket) {
        websocket.disconnect();
      }
    };
  }, [user]);

  const setupWebSocket = () => {
    const ws = new TranscriptWebSocket(
      'ws://localhost:8000/ws',
      (data) => {
        console.log('WebSocket message:', data);
        if (data.type === 'transcript_completed') {
          setTranscripts(prev => 
            prev.map(t => 
              t.id === data.transcript_id 
                ? { ...t, status: 'completed', transcript_text: data.transcript_text }
                : t
            )
          );
        }
      },
      (error) => {
        console.error('WebSocket error:', error);
      },
      () => {
        console.log('WebSocket closed');
      }
    );
    ws.connect();
    setWebsocket(ws);
  };

  const loadMCPs = async () => {
    try {
      await withLoading('loadMCPs', async () => {
        const response = await api.listMCPs();
        setMcps(response.mcps || []);
      });
    } catch (error: any) {
      console.error('Error loading MCPs:', error);
      Alert.alert('Error', 'Failed to load MCPs. Please try again.');
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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleUploadAudio = async () => {
    try {
      await withLoading('uploadAudio', async () => {
        const file = await pickAudioFile();
        if (!file) return;

        const validation = validateAudioFile(file);
        if (!validation.isValid) {
          Alert.alert('Invalid File', validation.error || 'Please select a valid audio file');
          return;
        }

        const { url } = await uploadAudioFile(file.uri, file.name);
        
        const newTranscript: Transcript = {
          id: Date.now().toString(),
          title: file.name,
          audio_url: url,
          status: 'processing',
          user_id: user!.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setTranscripts(prev => [...prev, newTranscript]);
        
        await api.processTranscript(url, newTranscript.id);
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload audio file');
    }
  };

  const handleInstallMCP = async (mcpName: string) => {
    try {
      await withLoading(`installMCP-${mcpName}`, async () => {
        await api.installMCP(mcpName);
        Alert.alert('Success', `MCP ${mcpName} installed successfully`);
        loadMCPs();
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to install MCP');
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Audio Transcript MCP</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
        
        <LoadingButton
          title="Sign in with Apple"
          onPress={handleSignInWithApple}
          isLoading={isLoading('signInApple')}
          style={styles.button}
        />
        
        <LoadingButton
          title="Sign in with Google"
          onPress={handleSignInWithGoogle}
          isLoading={isLoading('signInGoogle')}
          style={styles.button}
        />

        <TestAuth />
        
        <AuthDebug />
        
        <AuthUrlDebug />
        
        <Text style={styles.oauthNote}>
          Configure OAuth providers in Supabase dashboard if needed
        </Text>
        
        <LoadingOverlay visible={isLoading('signInApple') || isLoading('signInGoogle')} message="Signing in..." />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Audio Transcript MCP</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <LoadingButton
        title="Upload Audio File"
        onPress={handleUploadAudio}
        isLoading={isLoading('uploadAudio')}
        style={styles.uploadButton}
      />

      <Text style={styles.sectionTitle}>Transcripts</Text>
      <FlatList
        data={transcripts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.transcriptItem}>
            <Text style={styles.transcriptTitle}>{item.title}</Text>
            <Text style={styles.transcriptStatus}>Status: {item.status}</Text>
            {item.transcript_text && (
              <Text style={styles.transcriptText}>{item.transcript_text}</Text>
            )}
          </View>
        )}
        style={styles.list}
      />

      <Text style={styles.sectionTitle}>Available MCPs</Text>
      <FlatList
        data={mcps}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={styles.mcpItem}>
            <Text style={styles.mcpName}>{item.name}</Text>
            <LoadingButton
              title="Install"
              onPress={() => handleInstallMCP(item.name)}
              isLoading={isLoading(`installMCP-${item.name}`)}
              style={styles.installButton}
              textStyle={styles.installButtonText}
            />
          </View>
        )}
        style={styles.list}
      />

      <LoadingOverlay 
        visible={isLoading('loadMCPs') || isLoading('uploadAudio')} 
        message={isLoading('loadMCPs') ? 'Loading MCPs...' : 'Uploading audio...'} 
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    padding: 10,
  },
  signOutText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  list: {
    flex: 1,
    marginBottom: 20,
  },
  transcriptItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  transcriptStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  transcriptText: {
    fontSize: 14,
    color: '#333',
  },
  mcpItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mcpName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  installButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 5,
  },
  installButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  oauthNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
