/**
 * Chat Tab - Transcript List and Chat Interface
 * Based on PRD-UI.md specifications
 */
import React, { useState, useEffect } from 'react';
import { Alert, FlatList } from 'react-native';
import {
  View,
  Text,
  YStack,
  XStack,
  Button,
  Card,
  ScrollView,
} from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../stores/themeStore';
import { useLoading } from '../../hooks/useLoading';
import { LoadingButton } from '../LoadingButton';
import { LoadingOverlay } from '../LoadingOverlay';
import { pickAudioFile, uploadAudioFile, validateAudioFile } from '../../services/fileUpload';
import { api } from '../../services/api';
import { TranscriptWebSocket } from '../../services/websocket';
import { supabase } from '../../config/supabase';
import { Transcript, MCPServer } from '../../types';

export default function ChatTab() {
  const { activeTheme } = useThemeStore();
  const { isLoading, withLoading } = useLoading();
  
  const [user, setUser] = useState<any>(null);
  const [mcps, setMcps] = useState<MCPServer[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [websocket, setWebsocket] = useState<TranscriptWebSocket | null>(null);
  
  const backgroundColor = activeTheme === 'dark' ? '#000000' : '#ffffff';
  const surfaceColor = activeTheme === 'dark' ? '#1c1c1e' : '#f8f9fa';

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

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

        const { url } = await uploadAudioFile(file.uri, file.name, file.file);
        
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
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <ScrollView flex={1} padding="$4">
        <YStack space="$4">
          {/* Header */}
          <YStack space="$2">
            <Text fontSize="$6" fontWeight="600" color="$color">
              Chat & Transcripts
        </Text>
            <Text fontSize="$4" color="$color11">
              Upload audio files and manage transcripts
        </Text>
      </YStack>

          {/* Upload Button */}
          <Card backgroundColor={surfaceColor} padding="$4">
            <LoadingButton
              title="Upload Audio File"
              onPress={handleUploadAudio}
              isLoading={isLoading('uploadAudio')}
              style={{
                backgroundColor: activeTheme === 'dark' ? '#34C759' : '#34C759',
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
            />
          </Card>

          {/* Transcripts */}
          <YStack space="$3">
            <Text fontSize="$5" fontWeight="600" color="$color">
              Transcripts
            </Text>
            {transcripts.length === 0 ? (
              <Card backgroundColor={surfaceColor} padding="$4">
                <Text fontSize="$4" color="$color11" textAlign="center">
                  No transcripts yet. Upload an audio file to get started.
                </Text>
              </Card>
            ) : (
              transcripts.map((item) => (
                <Card key={item.id} backgroundColor={surfaceColor} padding="$4">
                  <YStack space="$2">
                    <Text fontSize="$4" fontWeight="600" color="$color">
                      {item.title}
                    </Text>
                    <Text fontSize="$3" color="$color11">
                      Status: {item.status}
                    </Text>
                    {item.transcript_text && (
                      <Text fontSize="$3" color="$color" numberOfLines={3}>
                        {item.transcript_text}
                      </Text>
                    )}
                  </YStack>
                </Card>
              ))
            )}
          </YStack>

          {/* MCPs */}
          <YStack space="$3">
            <Text fontSize="$5" fontWeight="600" color="$color">
              Available MCPs
            </Text>
            {mcps.length === 0 ? (
              <Card backgroundColor={surfaceColor} padding="$4">
                <Text fontSize="$4" color="$color11" textAlign="center">
                  No MCPs available.
                </Text>
              </Card>
            ) : (
              mcps.map((item) => (
                <Card key={item.name} backgroundColor={surfaceColor} padding="$4">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="$4" fontWeight="600" color="$color">
                      {item.name}
                    </Text>
                    <LoadingButton
                      title="Install"
                      onPress={() => handleInstallMCP(item.name)}
                      isLoading={isLoading(`installMCP-${item.name}`)}
                      style={{
                        backgroundColor: activeTheme === 'dark' ? '#0A84FF' : '#007AFF',
                        padding: 8,
                        borderRadius: 5,
                      }}
                      textStyle={{
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    />
                  </XStack>
                </Card>
              ))
            )}
          </YStack>
        </YStack>
      </ScrollView>

      <LoadingOverlay 
        visible={isLoading('loadMCPs') || isLoading('uploadAudio')} 
        message={isLoading('loadMCPs') ? 'Loading MCPs...' : 'Uploading audio...'} 
      />
    </SafeAreaView>
  );
}