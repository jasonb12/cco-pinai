/**
 * New Event Form Component - Form for creating and editing calendar events
 * Based on PRD-UI.md specifications for Calendar tab
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { CalendarEvent } from './AgendaView';

interface NewEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => void;
  editingEvent?: CalendarEvent | null;
  initialDate?: string;
}

export default function NewEventForm({
  isOpen,
  onClose,
  onSave,
  editingEvent,
  initialDate
}: NewEventFormProps) {
  const colors = useThemeColors();
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    type: 'event',
    priority: 'medium',
    all_day: false,
    recurring: false,
    location: '',
    attendees: [],
  });

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [attendeeInput, setAttendeeInput] = useState('');

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        ...editingEvent,
      });
      
      const start = new Date(editingEvent.start_time);
      const end = new Date(editingEvent.end_time);
      
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0, 5));
    } else if (initialDate) {
      const date = new Date(initialDate);
      const dateStr = date.toISOString().split('T')[0];
      const currentTime = new Date();
      const startTimeStr = currentTime.toTimeString().slice(0, 5);
      const endTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
      const endTimeStr = endTime.toTimeString().slice(0, 5);
      
      setStartDate(dateStr);
      setStartTime(startTimeStr);
      setEndDate(dateStr);
      setEndTime(endTimeStr);
    }
  }, [editingEvent, initialDate]);

  const handleSave = () => {
    if (!formData.title?.trim()) {
      Alert.alert('Error', 'Please enter a title for the event');
      return;
    }

    if (!startDate || (!formData.all_day && !startTime)) {
      Alert.alert('Error', 'Please set a start date and time');
      return;
    }

    if (!endDate || (!formData.all_day && !endTime)) {
      Alert.alert('Error', 'Please set an end date and time');
      return;
    }

    const startDateTime = formData.all_day 
      ? `${startDate}T00:00:00Z`
      : `${startDate}T${startTime}:00Z`;
    
    const endDateTime = formData.all_day
      ? `${endDate}T23:59:59Z`
      : `${endDate}T${endTime}:00Z`;

    const eventData: Partial<CalendarEvent> = {
      ...formData,
      start_time: startDateTime,
      end_time: endDateTime,
      status: 'scheduled',
      source: editingEvent ? editingEvent.source : 'manual',
    };

    onSave(eventData);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'event',
      priority: 'medium',
      all_day: false,
      recurring: false,
      location: '',
      attendees: [],
    });
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setAttendeeInput('');
  };

  const addAttendee = () => {
    if (attendeeInput.trim() && attendeeInput.includes('@')) {
      const newAttendees = [...(formData.attendees || []), attendeeInput.trim()];
      setFormData({ ...formData, attendees: newAttendees });
      setAttendeeInput('');
    } else {
      Alert.alert('Error', 'Please enter a valid email address');
    }
  };

  const removeAttendee = (index: number) => {
    const newAttendees = formData.attendees?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, attendees: newAttendees });
  };

  const eventTypes: Array<{ value: CalendarEvent['type']; label: string; icon: string }> = [
    { value: 'event', label: 'Event', icon: 'calendar-outline' },
    { value: 'meeting', label: 'Meeting', icon: 'people-outline' },
    { value: 'task', label: 'Task', icon: 'checkmark-circle-outline' },
    { value: 'call', label: 'Call', icon: 'call-outline' },
    { value: 'reminder', label: 'Reminder', icon: 'alarm-outline' },
  ];

  const priorities: Array<{ value: CalendarEvent['priority']; label: string; color: string }> = [
    { value: 'low', label: 'Low', color: '#65a30d' },
    { value: 'medium', label: 'Medium', color: '#d97706' },
    { value: 'high', label: 'High', color: '#ea580c' },
    { value: 'urgent', label: 'Urgent', color: '#dc2626' },
  ];

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: colors.background,
      borderRadius: 12,
      margin: 20,
      maxHeight: '90%',
      width: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    typeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      gap: 6,
    },
    selectedType: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    unselectedType: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    typeText: {
      fontSize: 14,
      fontWeight: '500',
    },
    selectedTypeText: {
      color: '#ffffff',
    },
    unselectedTypeText: {
      color: colors.text,
    },
    prioritySelector: {
      flexDirection: 'row',
      gap: 8,
    },
    priorityOption: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 2,
    },
    selectedPriority: {
      borderWidth: 2,
    },
    unselectedPriority: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    priorityText: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },
    dateTimeRow: {
      flexDirection: 'row',
      gap: 12,
    },
    dateTimeInput: {
      flex: 1,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    switchLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    attendeesContainer: {
      gap: 8,
    },
    attendeeInputRow: {
      flexDirection: 'row',
      gap: 8,
    },
    attendeeInput: {
      flex: 1,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButtonText: {
      color: '#ffffff',
      fontWeight: '600',
    },
    attendeesList: {
      gap: 8,
      marginTop: 8,
    },
    attendeeItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    attendeeEmail: {
      fontSize: 14,
      color: colors.text,
    },
    removeButton: {
      padding: 4,
    },
    actions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    saveButtonText: {
      color: '#ffffff',
    },
  });

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {editingEvent ? 'Edit Event' : 'New Event'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Event Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter event title"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Event Type</Text>
              <View style={styles.typeSelector}>
                {eventTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      formData.type === type.value ? styles.selectedType : styles.unselectedType,
                    ]}
                    onPress={() => setFormData({ ...formData, type: type.value })}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={16}
                      color={formData.type === type.value ? '#ffffff' : colors.text}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        formData.type === type.value ? styles.selectedTypeText : styles.unselectedTypeText,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Priority</Text>
              <View style={styles.prioritySelector}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityOption,
                      formData.priority === priority.value
                        ? { ...styles.selectedPriority, borderColor: priority.color, backgroundColor: `${priority.color}20` }
                        : styles.unselectedPriority,
                    ]}
                    onPress={() => setFormData({ ...formData, priority: priority.value })}
                  >
                    <Ionicons
                      name="flag-outline"
                      size={16}
                      color={priority.color}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        { color: priority.color },
                      ]}
                    >
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* All Day Toggle */}
            <View style={styles.section}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>All Day Event</Text>
                <Switch
                  value={formData.all_day}
                  onValueChange={(value) => setFormData({ ...formData, all_day: value })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={formData.all_day ? '#ffffff' : colors.textSecondary}
                />
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Start Date {!formData.all_day && '& Time'} *</Text>
              <View style={styles.dateTimeRow}>
                <TextInput
                  style={[styles.input, styles.dateTimeInput]}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                />
                {!formData.all_day && (
                  <TextInput
                    style={[styles.input, styles.dateTimeInput]}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.textSecondary}
                  />
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>End Date {!formData.all_day && '& Time'} *</Text>
              <View style={styles.dateTimeRow}>
                <TextInput
                  style={[styles.input, styles.dateTimeInput]}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                />
                {!formData.all_day && (
                  <TextInput
                    style={[styles.input, styles.dateTimeInput]}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.textSecondary}
                  />
                )}
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="Enter location"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter event description"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Attendees */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attendees</Text>
              <View style={styles.attendeesContainer}>
                <View style={styles.attendeeInputRow}>
                  <TextInput
                    style={[styles.input, styles.attendeeInput]}
                    value={attendeeInput}
                    onChangeText={setAttendeeInput}
                    placeholder="Enter email address"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.addButton} onPress={addAttendee}>
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {formData.attendees && formData.attendees.length > 0 && (
                  <View style={styles.attendeesList}>
                    {formData.attendees.map((attendee, index) => (
                      <View key={index} style={styles.attendeeItem}>
                        <Text style={styles.attendeeEmail}>{attendee}</Text>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeAttendee(index)}
                        >
                          <Ionicons name="close-outline" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Recurring Toggle */}
            <View style={styles.section}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Recurring Event</Text>
                <Switch
                  value={formData.recurring}
                  onValueChange={(value) => setFormData({ ...formData, recurring: value })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={formData.recurring ? '#ffffff' : colors.textSecondary}
                />
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={[styles.actionButtonText, styles.saveButtonText]}>
                {editingEvent ? 'Update' : 'Create'} Event
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
} 