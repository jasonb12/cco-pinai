import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeColors, ThemeMode } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  style?: any;
}

export default function ThemeToggle({ showLabel = true, style }: ThemeToggleProps) {
  const { theme, themeMode, setThemeMode, toggleTheme } = useTheme();
  const colors = useThemeColors();
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [switchAnimation] = useState(new Animated.Value(theme.isDark ? 1 : 0));

  const handleQuickToggle = () => {
    toggleTheme();
    
    // Animate the switch
    Animated.timing(switchAnimation, {
      toValue: theme.isDark ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleModeSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
    setShowModeSelector(false);
    
    // Update animation based on new mode
    const newIsDark = mode === 'dark' || (mode === 'system' && theme.isDark);
    Animated.timing(switchAnimation, {
      toValue: newIsDark ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const getThemeModeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return 'sunny';
      case 'dark':
        return 'moon';
      case 'system':
        return 'phone-portrait';
      default:
        return 'sunny';
    }
  };

  const getThemeModeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Light';
    }
  };

  const switchTranslateX = switchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  });

  const switchBackgroundColor = switchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  const dynamicStyles = {
    container: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    text: {
      color: colors.text,
    },
    secondaryText: {
      color: colors.textSecondary,
    },
    modal: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    modeOption: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    selectedModeOption: {
      backgroundColor: colors.primaryContainer,
      borderColor: colors.primary,
    },
  };

  return (
    <>
      <View style={[styles.container, dynamicStyles.container, style]}>
        <TouchableOpacity
          style={styles.mainContent}
          onPress={() => setShowModeSelector(true)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={getThemeModeIcon(themeMode)}
              size={24}
              color={colors.primary}
            />
          </View>
          
          <View style={styles.textContainer}>
            {showLabel && (
              <>
                <Text style={[styles.label, dynamicStyles.text]}>Theme</Text>
                <Text style={[styles.sublabel, dynamicStyles.secondaryText]}>
                  {getThemeModeLabel(themeMode)} mode
                </Text>
              </>
            )}
          </View>
          
          <View style={styles.rightContainer}>
            <TouchableOpacity
              style={styles.quickToggle}
              onPress={handleQuickToggle}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.switchContainer,
                  { backgroundColor: switchBackgroundColor },
                ]}
              >
                <Animated.View
                  style={[
                    styles.switchThumb,
                    {
                      transform: [{ translateX: switchTranslateX }],
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={theme.isDark ? 'moon' : 'sunny'}
                    size={12}
                    color={theme.isDark ? colors.primary : colors.warning}
                  />
                </Animated.View>
              </Animated.View>
            </TouchableOpacity>
            
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showModeSelector}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModeSelector(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModeSelector(false)}
        >
          <View style={[styles.modalContent, dynamicStyles.modal]}>
            <Text style={[styles.modalTitle, dynamicStyles.text]}>Choose Theme</Text>
            
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeOption,
                  dynamicStyles.modeOption,
                  themeMode === mode && dynamicStyles.selectedModeOption,
                ]}
                onPress={() => handleModeSelect(mode)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={getThemeModeIcon(mode)}
                  size={24}
                  color={themeMode === mode ? colors.primary : colors.textSecondary}
                />
                <View style={styles.modeTextContainer}>
                  <Text
                    style={[
                      styles.modeLabel,
                      dynamicStyles.text,
                      themeMode === mode && { color: colors.primary },
                    ]}
                  >
                    {getThemeModeLabel(mode)}
                  </Text>
                  <Text style={[styles.modeDescription, dynamicStyles.secondaryText]}>
                    {mode === 'light' && 'Always use light theme'}
                    {mode === 'dark' && 'Always use dark theme'}
                    {mode === 'system' && 'Follow system setting'}
                  </Text>
                </View>
                {themeMode === mode && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sublabel: {
    fontSize: 13,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickToggle: {
    padding: 4,
  },
  switchContainer: {
    width: 52,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    position: 'relative',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  modeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 13,
  },
}); 