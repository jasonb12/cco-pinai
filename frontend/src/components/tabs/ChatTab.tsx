/**
 * Chat Tab - Complete chat interface with transcripts and AI chat
 * Based on PRD-UI.md specifications
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { ActionType } from '../../types/actions';

// Import new components
import TranscriptList, { Transcript } from '../chat/TranscriptList';
import TranscriptCard from '../chat/TranscriptCard';
import ChatInput, { ChatMessage } from '../chat/ChatInput';
import ActionChips, { ActionChip } from '../chat/ActionChips';
import TextProcessor from '../TextProcessor';

// Mock data
const mockTranscripts: Transcript[] = [
  {
    id: '1',
    title: 'Team Meeting Discussion',
    content: 'We need to schedule a team meeting with Sarah to discuss the quarterly goals and project timeline. The meeting should be next week, preferably on Tuesday at 2 PM in the main conference room. Also, I should send a follow-up email to the client about the proposal status.',
    timestamp: new Date().toISOString(),
    duration: '3:45',
    actionCount: 2,
    status: 'completed',
    source: 'audio',
    tags: ['meeting', 'planning', 'email'],
  },
  {
    id: '2',
    title: 'Client Call Notes',
    content: 'The client wants to review the marketing budget for next quarter. They mentioned some concerns about the current spending allocation. I need to prepare a detailed breakdown and schedule a review meeting.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    duration: '12:30',
    actionCount: 3,
    status: 'completed',
    source: 'audio',
    tags: ['client', 'budget', 'review'],
  },
  {
    id: '3',
    title: 'Processing Audio File',
    content: '',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    duration: '5:20',
    actionCount: 0,
    status: 'processing',
    source: 'upload',
  },
];

const mockActionChips: ActionChip[] = [
  {
    id: 'schedule',
    title: 'Schedule Events',
    icon: 'calendar-outline',
    type: ActionType.SCHEDULED_EVENT,
    count: 3,
    color: '#3b82f6',
    onPress: () => console.log('Schedule events'),
  },
  {
    id: 'send_emails',
    title: 'Send Emails',
    icon: 'mail-outline',
    type: ActionType.EMAIL,
    count: 2,
    color: '#10b981',
    onPress: () => console.log('Send emails'),
  },
  {
    id: 'create_tasks',
    title: 'Create Tasks',
    icon: 'checkmark-circle-outline',
    type: ActionType.TASK,
    count: 4,
    color: '#f59e0b',
    onPress: () => console.log('Create tasks'),
  },
  {
    id: 'set_reminders',
    title: 'Set Reminders',
    icon: 'alarm-outline',
    type: ActionType.REMINDER,
    count: 1,
    color: '#ef4444',
    onPress: () => console.log('Set reminders'),
  },
];

export default function ChatTab() {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<'processor' | 'transcripts' | 'chat'>('processor');
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [transcripts, setTranscripts] = useState<Transcript[]>(mockTranscripts);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleTranscriptPress = (transcript: Transcript) => {
    setSelectedTranscript(transcript);
    setShowDetailModal(true);
  };

  const handleSendMessage = async (message: string, context?: any) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date().toISOString(),
      context,
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `I understand you're asking about "${message}". Based on your transcripts, I can help you with that. Would you like me to create specific actions or provide more details?`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
      setChatLoading(false);
    }, 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'processor':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.processorContainer}>
              <TextProcessor />
            </View>
          </ScrollView>
        );

      case 'transcripts':
        return (
          <View style={styles.tabContent}>
            <ActionChips
              chips={mockActionChips}
              title="Pending Actions"
              horizontal={true}
              showCount={true}
            />
            <TranscriptList
              transcripts={transcripts}
              onTranscriptPress={handleTranscriptPress}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              emptyMessage="No transcripts processed yet. Upload audio or enter text to get started."
            />
          </View>
        );

      case 'chat':
        return (
          <KeyboardAvoidingView 
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView 
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
              showsVerticalScrollIndicator={false}
            >
              {chatMessages.length === 0 ? (
                <View style={styles.chatEmptyState}>
                  <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
                  <Text style={[styles.chatEmptyTitle, { color: colors.text }]}>
                    Start a Conversation
                  </Text>
                  <Text style={[styles.chatEmptyDescription, { color: colors.textSecondary }]}>
                    Ask questions about your transcripts or get help with actions
                  </Text>
                </View>
              ) : (
                chatMessages.map(message => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageContainer,
                      message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        {
                          backgroundColor: message.role === 'user' ? colors.primary : colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          {
                            color: message.role === 'user' ? '#ffffff' : colors.text,
                          },
                        ]}
                      >
                        {message.content}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          {
                            color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
                          },
                        ]}
                      >
                        {new Date(message.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            
            <ChatInput
              onSendMessage={handleSendMessage}
              loading={chatLoading}
              placeholder="Ask about your transcripts or actions..."
              contextInfo={
                selectedTranscript ? {
                  transcriptTitle: selectedTranscript.title,
                  actionCount: selectedTranscript.actionCount,
                } : undefined
              }
            />
          </KeyboardAvoidingView>
        );

      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    headerButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
    },
    activeTabText: {
      color: colors.primary,
    },
    inactiveTabText: {
      color: colors.textSecondary,
    },
    tabContent: {
      flex: 1,
    },
    processorContainer: {
      padding: 16,
    },
    chatContainer: {
      flex: 1,
    },
    chatMessages: {
      flex: 1,
      paddingHorizontal: 16,
    },
    chatMessagesContent: {
      paddingVertical: 16,
      flexGrow: 1,
    },
    chatEmptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    chatEmptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    chatEmptyDescription: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    messageContainer: {
      marginBottom: 12,
    },
    userMessage: {
      alignItems: 'flex-end',
    },
    assistantMessage: {
      alignItems: 'flex-start',
    },
    messageBubble: {
      maxWidth: '80%',
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
    },
    messageText: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 4,
    },
    messageTime: {
      fontSize: 10,
      alignSelf: 'flex-end',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      margin: 20,
      maxHeight: '80%',
      width: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    modalCloseButton: {
      padding: 8,
    },
    modalBody: {
      flex: 1,
      padding: 16,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => console.log('Search')}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => console.log('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'processor' && styles.activeTab]}
          onPress={() => setActiveTab('processor')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'processor' ? styles.activeTabText : styles.inactiveTabText,
            ]}
          >
            Text Processor
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transcripts' && styles.activeTab]}
          onPress={() => setActiveTab('transcripts')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'transcripts' ? styles.activeTabText : styles.inactiveTabText,
            ]}
          >
            Transcripts
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'chat' ? styles.activeTabText : styles.inactiveTabText,
            ]}
          >
            AI Chat
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transcript Details</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDetailModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {selectedTranscript && (
                <TranscriptCard
                  transcript={selectedTranscript}
                  expanded={true}
                  showActions={true}
                  onActionPress={(actionId) => {
                    console.log('Action pressed:', actionId);
                    setShowDetailModal(false);
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}