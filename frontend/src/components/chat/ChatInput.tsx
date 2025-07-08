/**
 * Chat Input Component - AI chat interface with context awareness
 * Based on PRD-UI.md specifications for Chat tab
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  context?: {
    transcriptId?: string;
    actionIds?: string[];
  };
}

interface ChatInputProps {
  onSendMessage: (message: string, context?: any) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  contextInfo?: {
    transcriptTitle?: string;
    actionCount?: number;
  };
}

export default function ChatInput({
  onSendMessage,
  placeholder = 'Ask about your transcripts...',
  disabled = false,
  loading = false,
  contextInfo
}: ChatInputProps) {
  const colors = useThemeColors();
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handleSend = () => {
    if (message.trim() && !loading && !disabled) {
      onSendMessage(message.trim(), contextInfo);
      setMessage('');
      inputRef.current?.blur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Pulse animation for loading state
  React.useEffect(() => {
    if (loading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [loading, pulseAnim]);

  const canSend = message.trim().length > 0 && !loading && !disabled;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    contextBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 8,
    },
    contextIcon: {
      padding: 4,
    },
    contextText: {
      fontSize: 12,
      color: colors.textSecondary,
      flex: 1,
    },
    contextClose: {
      padding: 4,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 12,
    },
    inputWrapper: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isFocused ? colors.primary : colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      maxHeight: 120,
    },
    input: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 20,
      minHeight: 20,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: canSend ? colors.primary : colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    suggestions: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 12,
      gap: 8,
    },
    suggestionChip: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    suggestionText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      gap: 8,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    loadingDots: {
      flexDirection: 'row',
      gap: 4,
    },
    loadingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
  });

  const suggestions = [
    'Summarize this transcript',
    'What actions were found?',
    'Schedule the meeting',
    'Send the email',
  ];

  const renderSuggestions = () => {
    if (isFocused || message.length > 0 || loading) return null;

    return (
      <View style={styles.suggestions}>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionChip}
            onPress={() => setMessage(suggestion)}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderLoading = () => {
    if (!loading) return null;

    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>AI is thinking</Text>
        <View style={styles.loadingDots}>
          {[0, 1, 2].map(index => (
            <Animated.View
              key={index}
              style={[
                styles.loadingDot,
                {
                  opacity: pulseAnim,
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0.7, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        {/* Context Bar */}
        {contextInfo && (
          <View style={styles.contextBar}>
            <View style={styles.contextIcon}>
              <Ionicons name="link-outline" size={14} color={colors.primary} />
            </View>
            <Text style={styles.contextText}>
              {contextInfo.transcriptTitle && `"${contextInfo.transcriptTitle}"`}
              {contextInfo.actionCount && ` • ${contextInfo.actionCount} actions`}
            </Text>
            <TouchableOpacity style={styles.contextClose}>
              <Ionicons name="close-outline" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Indicator */}
        {renderLoading()}

        {/* Suggestions */}
        {renderSuggestions()}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={1000}
              editable={!disabled && !loading}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              !canSend && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.8}
          >
            {loading ? (
              <Animated.View style={{ opacity: pulseAnim }}>
                <Ionicons name="hourglass-outline" size={20} color="#ffffff" />
              </Animated.View>
            ) : (
              <Ionicons
                name="send-outline"
                size={20}
                color={canSend ? '#ffffff' : colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
} 