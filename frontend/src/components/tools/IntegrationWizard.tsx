/**
 * Integration Wizard Component - Step-by-step integration setup
 * Based on PRD-UI.md specifications for Tools tab
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { IntegrationWizardStep, WizardStepType, FieldType, AuthType, IntegrationType } from '../../types/tools';

interface IntegrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (integrationData: any) => void;
  integrationId?: string;
  initialData?: any;
}

export default function IntegrationWizard({
  isOpen,
  onClose,
  onComplete,
  integrationId,
  initialData
}: IntegrationWizardProps) {
  const colors = useThemeColors();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  // Mock wizard steps - in real app, these would come from the integration definition
  const wizardSteps: IntegrationWizardStep[] = [
    {
      id: 'provider',
      title: 'Select Provider',
      description: 'Choose your integration provider',
      type: WizardStepType.PROVIDER_SELECTION,
      isRequired: true,
      isCompleted: false,
      fields: [
        {
          id: 'provider',
          name: 'provider',
          label: 'Provider',
          type: FieldType.SELECT,
          isRequired: true,
          options: [
            { value: 'slack', label: 'Slack', description: 'Team communication', icon: 'chatbubble-outline' },
            { value: 'google', label: 'Google Workspace', description: 'Productivity suite', icon: 'logo-google' },
            { value: 'notion', label: 'Notion', description: 'All-in-one workspace', icon: 'document-outline' },
            { value: 'github', label: 'GitHub', description: 'Code repository', icon: 'logo-github' },
          ],
        },
      ],
    },
    {
      id: 'auth',
      title: 'Authentication',
      description: 'Set up authentication credentials',
      type: WizardStepType.AUTHENTICATION,
      isRequired: true,
      isCompleted: false,
      fields: [
        {
          id: 'authType',
          name: 'authType',
          label: 'Authentication Type',
          type: FieldType.SELECT,
          isRequired: true,
          options: [
            { value: 'oauth2', label: 'OAuth 2.0', description: 'Secure token-based authentication' },
            { value: 'api_key', label: 'API Key', description: 'Simple key-based authentication' },
            { value: 'bearer_token', label: 'Bearer Token', description: 'Token-based authentication' },
          ],
        },
        {
          id: 'apiKey',
          name: 'apiKey',
          label: 'API Key',
          type: FieldType.PASSWORD,
          isRequired: true,
          placeholder: 'Enter your API key',
          helpText: 'You can find this in your provider\'s settings',
          isSecure: true,
        },
        {
          id: 'endpoint',
          name: 'endpoint',
          label: 'API Endpoint',
          type: FieldType.URL,
          isRequired: false,
          placeholder: 'https://api.example.com',
          helpText: 'Leave blank to use default endpoint',
        },
      ],
    },
    {
      id: 'config',
      title: 'Configuration',
      description: 'Configure integration settings',
      type: WizardStepType.CONFIGURATION,
      isRequired: true,
      isCompleted: false,
      fields: [
        {
          id: 'name',
          name: 'name',
          label: 'Integration Name',
          type: FieldType.TEXT,
          isRequired: true,
          placeholder: 'My Integration',
          helpText: 'A friendly name for this integration',
        },
        {
          id: 'description',
          name: 'description',
          label: 'Description',
          type: FieldType.TEXTAREA,
          isRequired: false,
          placeholder: 'Describe what this integration does',
        },
        {
          id: 'syncFrequency',
          name: 'syncFrequency',
          label: 'Sync Frequency',
          type: FieldType.SELECT,
          isRequired: true,
          options: [
            { value: 'real_time', label: 'Real-time', description: 'Instant synchronization' },
            { value: 'every_5_minutes', label: 'Every 5 minutes' },
            { value: 'hourly', label: 'Hourly' },
            { value: 'daily', label: 'Daily' },
            { value: 'manual', label: 'Manual only' },
          ],
        },
        {
          id: 'enableNotifications',
          name: 'enableNotifications',
          label: 'Enable Notifications',
          type: FieldType.CHECKBOX,
          isRequired: false,
          helpText: 'Receive notifications for sync events',
        },
      ],
    },
    {
      id: 'permissions',
      title: 'Permissions',
      description: 'Grant necessary permissions',
      type: WizardStepType.PERMISSIONS,
      isRequired: true,
      isCompleted: false,
      fields: [
        {
          id: 'readData',
          name: 'readData',
          label: 'Read Data',
          type: FieldType.CHECKBOX,
          isRequired: true,
          helpText: 'Allow reading data from the provider',
        },
        {
          id: 'writeData',
          name: 'writeData',
          label: 'Write Data',
          type: FieldType.CHECKBOX,
          isRequired: false,
          helpText: 'Allow writing data to the provider',
        },
        {
          id: 'manageWebhooks',
          name: 'manageWebhooks',
          label: 'Manage Webhooks',
          type: FieldType.CHECKBOX,
          isRequired: false,
          helpText: 'Allow creating and managing webhooks',
        },
      ],
    },
    {
      id: 'testing',
      title: 'Test Connection',
      description: 'Verify your integration setup',
      type: WizardStepType.TESTING,
      isRequired: true,
      isCompleted: false,
      fields: [],
    },
    {
      id: 'completion',
      title: 'Complete',
      description: 'Integration setup complete',
      type: WizardStepType.COMPLETION,
      isRequired: false,
      isCompleted: false,
      fields: [],
    },
  ];

  const updateFormData = (fieldId: string, value: any) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const validateStep = (step: IntegrationWizardStep): boolean => {
    const requiredFields = step.fields.filter(field => field.isRequired);
    
    for (const field of requiredFields) {
      const value = formData[field.id];
      if (!value || (typeof value === 'string' && !value.trim())) {
        Alert.alert('Validation Error', `${field.label} is required`);
        return false;
      }
    }
    
    return true;
  };

  const handleNext = async () => {
    const step = wizardSteps[currentStep];
    
    if (!validateStep(step)) {
      return;
    }

    if (step.type === WizardStepType.TESTING) {
      await handleTestConnection();
      return;
    }

    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call to test connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock test results
      const mockResults = {
        success: Math.random() > 0.3, // 70% success rate
        message: Math.random() > 0.3 
          ? 'Connection successful! All systems are working properly.'
          : 'Connection failed. Please check your credentials and try again.',
        details: {
          responseTime: Math.floor(Math.random() * 500) + 100,
          endpoint: formData.endpoint || 'https://api.example.com',
          authMethod: formData.authType,
        },
      };
      
      setTestResults(mockResults);
      
      if (mockResults.success) {
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
        }, 1500);
      }
    } catch (error) {
      setTestResults({
        success: false,
        message: 'An error occurred while testing the connection.',
        details: { error: 'Network error' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    const integrationData = {
      ...formData,
      type: IntegrationType.API_KEY, // Based on auth type
      status: 'connected',
      createdAt: new Date().toISOString(),
    };
    
    onComplete(integrationData);
    onClose();
  };

  const renderField = (field: any) => {
    const value = formData[field.id];

    switch (field.type) {
      case FieldType.TEXT:
      case FieldType.PASSWORD:
      case FieldType.EMAIL:
      case FieldType.URL:
        return (
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={value || ''}
            onChangeText={(text) => updateFormData(field.id, text)}
            placeholder={field.placeholder}
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={field.type === FieldType.PASSWORD}
            keyboardType={
              field.type === FieldType.EMAIL ? 'email-address' :
              field.type === FieldType.URL ? 'url' : 'default'
            }
          />
        );

      case FieldType.TEXTAREA:
        return (
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
            value={value || ''}
            onChangeText={(text) => updateFormData(field.id, text)}
            placeholder={field.placeholder}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        );

      case FieldType.SELECT:
        return (
          <View style={styles.selectContainer}>
            {field.options?.map((option: any) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.selectOption,
                  value === option.value && styles.selectedOption
                ]}
                onPress={() => updateFormData(field.id, option.value)}
                activeOpacity={0.8}
              >
                {option.icon && (
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={value === option.value ? '#ffffff' : colors.text}
                  />
                )}
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    { color: value === option.value ? '#ffffff' : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text style={[
                      styles.optionDescription,
                      { color: value === option.value ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                    ]}>
                      {option.description}
                    </Text>
                  )}
                </View>
                {value === option.value && (
                  <Ionicons name="checkmark-outline" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case FieldType.CHECKBOX:
        return (
          <View style={styles.checkboxContainer}>
            <Switch
              value={value || false}
              onValueChange={(checked) => updateFormData(field.id, checked)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={value ? '#ffffff' : colors.textSecondary}
            />
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              {field.label}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const renderStepContent = () => {
    const step = wizardSteps[currentStep];

    if (step.type === WizardStepType.TESTING) {
      return (
        <View style={styles.testingContainer}>
          <View style={styles.testingHeader}>
            <Ionicons
              name={isLoading ? 'hourglass-outline' : testResults?.success ? 'checkmark-circle-outline' : 'alert-circle-outline'}
              size={48}
              color={isLoading ? colors.primary : testResults?.success ? '#10b981' : '#ef4444'}
            />
            <Text style={[styles.testingTitle, { color: colors.text }]}>
              {isLoading ? 'Testing Connection...' : 
               testResults?.success ? 'Connection Successful!' :
               testResults ? 'Connection Failed' : 'Ready to Test'}
            </Text>
            <Text style={[styles.testingDescription, { color: colors.textSecondary }]}>
              {isLoading ? 'Please wait while we verify your settings' :
               testResults?.message || 'Click the test button to verify your integration setup'}
            </Text>
          </View>

          {testResults && (
            <View style={styles.testResults}>
              <Text style={[styles.testResultsTitle, { color: colors.text }]}>
                Test Results
              </Text>
              
              <View style={styles.testDetail}>
                <Text style={[styles.testDetailLabel, { color: colors.textSecondary }]}>
                  Response Time:
                </Text>
                <Text style={[styles.testDetailValue, { color: colors.text }]}>
                  {testResults.details?.responseTime}ms
                </Text>
              </View>
              
              <View style={styles.testDetail}>
                <Text style={[styles.testDetailLabel, { color: colors.textSecondary }]}>
                  Endpoint:
                </Text>
                <Text style={[styles.testDetailValue, { color: colors.text }]}>
                  {testResults.details?.endpoint}
                </Text>
              </View>
              
              <View style={styles.testDetail}>
                <Text style={[styles.testDetailLabel, { color: colors.textSecondary }]}>
                  Auth Method:
                </Text>
                <Text style={[styles.testDetailValue, { color: colors.text }]}>
                  {testResults.details?.authMethod}
                </Text>
              </View>
            </View>
          )}

          {!testResults && !isLoading && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestConnection}
              activeOpacity={0.8}
            >
              <Ionicons name="flash-outline" size={20} color="#ffffff" />
              <Text style={styles.testButtonText}>Test Connection</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (step.type === WizardStepType.COMPLETION) {
      return (
        <View style={styles.completionContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#10b981" />
          <Text style={[styles.completionTitle, { color: colors.text }]}>
            Integration Complete!
          </Text>
          <Text style={[styles.completionDescription, { color: colors.textSecondary }]}>
            Your {formData.provider} integration has been set up successfully. 
            You can now start using it in your workflows.
          </Text>
          
          <View style={styles.completionSummary}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              Summary
            </Text>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Provider:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formData.provider}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Name:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formData.name}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Sync:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formData.syncFrequency}</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.stepContent}>
        {step.fields.map((field) => (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              {field.label}
              {field.isRequired && <Text style={{ color: '#ef4444' }}> *</Text>}
            </Text>
            
            {field.helpText && (
              <Text style={[styles.fieldHelp, { color: colors.textSecondary }]}>
                {field.helpText}
              </Text>
            )}
            
            {renderField(field)}
          </View>
        ))}
      </View>
    );
  };

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
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
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
    progressContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      marginBottom: 12,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    progressText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    stepHeader: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    stepTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    stepDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    stepContent: {
      paddingVertical: 16,
    },
    fieldContainer: {
      marginBottom: 20,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    fieldHelp: {
      fontSize: 12,
      marginBottom: 8,
      lineHeight: 16,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: colors.surface,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    selectContainer: {
      gap: 8,
    },
    selectOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      gap: 12,
    },
    selectedOption: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionContent: {
      flex: 1,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    optionDescription: {
      fontSize: 12,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    checkboxLabel: {
      fontSize: 16,
      fontWeight: '500',
    },
    testingContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    testingHeader: {
      alignItems: 'center',
      marginBottom: 32,
    },
    testingTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginTop: 16,
      marginBottom: 8,
    },
    testingDescription: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.primary,
      gap: 8,
    },
    testButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
    testResults: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 24,
    },
    testResultsTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    testDetail: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    testDetailLabel: {
      fontSize: 14,
    },
    testDetailValue: {
      fontSize: 14,
      fontWeight: '500',
    },
    completionContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    completionTitle: {
      fontSize: 24,
      fontWeight: '700',
      marginTop: 16,
      marginBottom: 8,
    },
    completionDescription: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 32,
    },
    completionSummary: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    summaryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    summaryLabel: {
      fontSize: 14,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '500',
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
    backButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    nextButton: {
      backgroundColor: colors.primary,
    },
    disabledButton: {
      opacity: 0.5,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    backButtonText: {
      color: colors.text,
    },
    nextButtonText: {
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
            <Text style={styles.headerTitle}>Integration Wizard</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentStep + 1) / wizardSteps.length) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Step {currentStep + 1} of {wizardSteps.length}
            </Text>
          </View>

          {/* Step Header */}
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>{wizardSteps[currentStep].title}</Text>
            <Text style={styles.stepDescription}>{wizardSteps[currentStep].description}</Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderStepContent()}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.backButton,
                currentStep === 0 && styles.disabledButton
              ]}
              onPress={handlePrevious}
              disabled={currentStep === 0}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, styles.backButtonText]}>
                Back
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.nextButton,
                isLoading && styles.disabledButton
              ]}
              onPress={handleNext}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, styles.nextButtonText]}>
                {currentStep === wizardSteps.length - 1 ? 'Complete' :
                 wizardSteps[currentStep].type === WizardStepType.TESTING ? 'Test Connection' :
                 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
} 