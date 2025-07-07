import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../config/supabase';

interface VoiceRecorderProps {
  onRecordingComplete?: (audioUri: string, transcript?: string) => void;
  maxDuration?: number; // in seconds
}

export default function VoiceRecorder({ onRecordingComplete, maxDuration = 300 }: VoiceRecorderProps) {
  const colors = useThemeColors();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [soundLevel, setSoundLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    // Request audio permissions
    requestPermissions();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      startAnimations();
      startTimer();
    } else {
      stopAnimations();
      stopTimer();
    }
  }, [isRecording]);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone access to record audio.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const startAnimations = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Wave animation
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: maxDuration * 1000,
      useNativeDriver: false,
    }).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    progressAnim.stopAnimation();
    
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(prev => {
        const newDuration = prev + 1;
        if (newDuration >= maxDuration) {
          stopRecording();
        }
        return newDuration;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording) {
            // Update sound level for visualization
            const level = status.metering ? Math.max(0, (status.metering + 60) / 60) : 0;
            setSoundLevel(level);
          }
        },
        100 // Update interval in milliseconds
      );

      setRecording(recording);
      setIsRecording(true);
      setDuration(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        // Process the audio file
        await processAudioFile(uri);
        
        if (onRecordingComplete) {
          onRecordingComplete(uri);
        }
      }
      
      setRecording(null);
      setDuration(0);
      setSoundLevel(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to process recording.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAudioFile = async (audioUri: string) => {
    try {
      // Upload to Supabase Storage
      const fileName = `recording_${Date.now()}.m4a`;
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      
      if (fileInfo.exists) {
        const fileData = await FileSystem.readAsStringAsync(audioUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const { data, error } = await supabase.storage
          .from('audio-files')
          .upload(fileName, decode(fileData), {
            contentType: 'audio/m4a',
          });
        
        if (error) {
          console.error('Upload error:', error);
          return;
        }
        
        // Save to database
        const { error: dbError } = await supabase
          .from('transcripts')
          .insert({
            filename: fileName,
            file_size: fileInfo.size,
            status: 'uploaded',
            created_at: new Date().toISOString(),
          });
        
        if (dbError) {
          console.error('Database error:', dbError);
        }
      }
    } catch (error) {
      console.error('Error processing audio file:', error);
    }
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenWidth - 48],
  });

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      margin: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    recordButton: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: isRecording ? '#ff4444' : colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 24,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    recordButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
      marginTop: 8,
    },
    statusText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 8,
    },
    durationText: {
      color: colors.textSecondary,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 16,
    },
    progressContainer: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      marginBottom: 16,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    waveformContainer: {
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    waveBar: {
      width: 3,
      backgroundColor: colors.primary,
      marginHorizontal: 1,
      borderRadius: 1.5,
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    controlButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    processingText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  // Generate wave bars based on sound level
  const generateWaveBars = () => {
    const bars = [];
    for (let i = 0; i < 20; i++) {
      const height = isRecording 
        ? Math.random() * soundLevel * 40 + 10
        : 10;
      
      bars.push(
        <Animated.View
          key={i}
          style={[
            dynamicStyles.waveBar,
            {
              height: height,
              opacity: waveAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            },
          ]}
        />
      );
    }
    return bars;
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Record Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={dynamicStyles.recordButton}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={48}
            color={colors.background}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Status */}
      <Text style={dynamicStyles.statusText}>
        {isProcessing ? 'Processing...' : isRecording ? 'Recording...' : 'Ready to Record'}
      </Text>

      {/* Duration */}
      {(isRecording || duration > 0) && (
        <Text style={dynamicStyles.durationText}>
          {formatDuration(duration)} / {formatDuration(maxDuration)}
        </Text>
      )}

      {/* Progress Bar */}
      {isRecording && (
        <View style={dynamicStyles.progressContainer}>
          <Animated.View
            style={[
              dynamicStyles.progressBar,
              { width: progressWidth },
            ]}
          />
        </View>
      )}

      {/* Waveform Visualization */}
      <View style={dynamicStyles.waveformContainer}>
        {generateWaveBars()}
      </View>

      {/* Processing Status */}
      {isProcessing && (
        <Text style={dynamicStyles.processingText}>
          🤖 AI is analyzing your recording...
        </Text>
      )}
    </View>
  );
} 