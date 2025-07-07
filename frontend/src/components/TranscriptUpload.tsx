import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickAudioFile, uploadAudioFile, validateAudioFile } from '../services/fileUpload';
import { supabase } from '../config/supabase';
import { useThemeColors } from '../contexts/ThemeContext';
import { mcpService, type ProcessingUpdate } from '../services/mcp';

interface TranscriptUploadProps {
  onUploadComplete?: (transcriptId: string) => void;
}

export default function TranscriptUpload({ onUploadComplete }: TranscriptUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [transcriptText, setTranscriptText] = useState<string>('');
  const colors = useThemeColors();

  const handleFileSelect = async () => {
    try {
      const file = await pickAudioFile();
      if (file) {
        const validation = validateAudioFile(file);
        if (!validation.isValid) {
          Alert.alert('Invalid File', validation.error);
          return;
        }
        setSelectedFile(file);
        setTranscriptText(''); // Clear previous transcript
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select an audio file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload file to Supabase storage
      setUploadProgress(20);
      const uploadResult = await uploadAudioFile(
        selectedFile.uri,
        selectedFile.name,
        selectedFile.file
      );

      setUploadProgress(40);

      // Step 2: Create transcript record in database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: transcript, error: dbError } = await supabase
        .from('transcripts')
        .insert({
          user_id: user.id,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          file_url: uploadResult.url,
          storage_path: uploadResult.path,
          status: 'uploaded',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save transcript record');
      }

      setUploadProgress(60);

      // Step 3: Start AI processing with MCP service
      setIsProcessing(true);
      setProcessingStatus('Starting AI processing...');

      // Subscribe to processing updates
      const unsubscribe = mcpService.subscribeToTranscript(
        transcript.id,
        (update: ProcessingUpdate) => {
          console.log('Processing update:', update);
          
          switch (update.type) {
            case 'transcript_processing':
              setProcessingStatus('AI is analyzing your audio...');
              setUploadProgress(70);
              break;
            
            case 'transcript_completed':
              setProcessingStatus('Processing completed!');
              setUploadProgress(100);
              setTranscriptText(update.transcript_text || '');
              setIsProcessing(false);
              
              // Show success with transcript preview
              Alert.alert(
                'Processing Complete! 🎉',
                `"${selectedFile.name}" has been processed successfully!

Transcript preview:
${(update.transcript_text || '').substring(0, 100)}...`,
                [
                  {
                    text: 'View Full Transcript',
                    onPress: () => {
                      // You could navigate to a detailed view here
                      console.log('Full transcript:', update.transcript_text);
                    },
                  },
                  {
                    text: 'Upload Another',
                    onPress: () => {
                      setSelectedFile(null);
                      setUploadProgress(0);
                      setTranscriptText('');
                      if (onUploadComplete) {
                        onUploadComplete(transcript.id);
                      }
                    },
                    style: 'default',
                  },
                ]
              );
              
              // Clean up subscription
              unsubscribe();
              break;
            
            case 'transcript_error':
              setProcessingStatus('Processing failed');
              setIsProcessing(false);
              Alert.alert(
                'Processing Failed',
                update.error || 'Failed to process audio file'
              );
              unsubscribe();
              break;
          }
        }
      );

      // Start the processing
      await mcpService.startTranscriptProcessing(
        transcript.id,
        uploadResult.url
      );

      setUploadProgress(80);
      
    } catch (error: any) {
      console.error('Upload/Processing error:', error);
      setIsProcessing(false);
      Alert.alert('Error', error.message || 'Failed to upload and process file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setTranscriptText('');
    setIsProcessing(false);
    setProcessingStatus('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      margin: 16,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    selectButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginTop: 12,
      marginBottom: 4,
    },
    supportedFormats: {
      fontSize: 12,
      color: colors.textTertiary,
      textAlign: 'center',
    },
    fileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fileName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    fileSize: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.success,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    processingStatus: {
      fontSize: 14,
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 8,
      fontWeight: '500',
    },
    selectAnotherButton: {
      flex: 1,
      backgroundColor: colors.background,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    selectAnotherText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    uploadButton: {
      flex: 1,
      backgroundColor: colors.success,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    uploadButtonDisabled: {
      backgroundColor: colors.textTertiary,
    },
    uploadButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSecondary,
    },
    transcriptPreview: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    transcriptTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    transcriptText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.title}>AI Transcript Processing</Text>
      <Text style={dynamicStyles.subtitle}>Upload audio and get AI-powered transcription</Text>

      {!selectedFile ? (
        <TouchableOpacity style={styles.selectButton} onPress={handleFileSelect}>
          <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
          <Text style={dynamicStyles.selectButtonText}>Select Audio File</Text>
          <Text style={dynamicStyles.supportedFormats}>MP3, MP4, WAV, M4A (max 50MB)</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.fileContainer}>
          <View style={dynamicStyles.fileInfo}>
            <Ionicons name="musical-notes" size={24} color={colors.success} />
            <View style={styles.fileDetails}>
              <Text style={dynamicStyles.fileName} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text style={dynamicStyles.fileSize}>
                {formatFileSize(selectedFile.size)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleRemoveFile} style={styles.removeButton}>
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>

          {(isUploading || isProcessing) && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[dynamicStyles.progressFill, { width: `${uploadProgress}%` }]}
                />
              </View>
              <Text style={dynamicStyles.progressText}>{uploadProgress}%</Text>
              {isProcessing && (
                <Text style={dynamicStyles.processingStatus}>
                  🤖 {processingStatus}
                </Text>
              )}
            </View>
          )}

          {transcriptText && (
            <View style={dynamicStyles.transcriptPreview}>
              <Text style={dynamicStyles.transcriptTitle}>✨ AI Transcript Preview</Text>
              <Text style={dynamicStyles.transcriptText} numberOfLines={3}>
                {transcriptText}
              </Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={dynamicStyles.selectAnotherButton} 
              onPress={handleFileSelect}
              disabled={isUploading || isProcessing}
            >
              <Text style={dynamicStyles.selectAnotherText}>Select Another</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[dynamicStyles.uploadButton, (isUploading || isProcessing) && dynamicStyles.uploadButtonDisabled]} 
              onPress={handleUpload}
              disabled={isUploading || isProcessing}
            >
              {(isUploading || isProcessing) ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="sparkles" size={20} color="white" />
              )}
              <Text style={dynamicStyles.uploadButtonText}>
                {isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : 'Process with AI'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  selectButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  fileContainer: {
    width: '100%',
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  removeButton: {
    padding: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
}); 