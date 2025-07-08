/**
 * KPI Card Component - Dashboard metrics display
 * Based on PRD-UI.md specifications for Dashboard KPI Cards
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';

export interface KPIData {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  color: string;
  onPress?: () => void;
}

interface KPICardProps {
  data: KPIData;
  size?: 'small' | 'medium' | 'large';
}

export default function KPICard({ data, size = 'medium' }: KPICardProps) {
  const colors = useThemeColors();

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return 'trending-up-outline';
      case 'down': return 'trending-down-outline';
      case 'stable': return 'remove-outline';
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      case 'stable': return '#6b7280';
    }
  };

  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const getCardSize = () => {
    switch (size) {
      case 'small':
        return {
          minHeight: 80,
          padding: 12,
          iconSize: 20,
          titleSize: 12,
          valueSize: 18,
          subtitleSize: 10,
        };
      case 'large':
        return {
          minHeight: 140,
          padding: 20,
          iconSize: 32,
          titleSize: 16,
          valueSize: 32,
          subtitleSize: 14,
        };
      default: // medium
        return {
          minHeight: 110,
          padding: 16,
          iconSize: 24,
          titleSize: 14,
          valueSize: 24,
          subtitleSize: 12,
        };
    }
  };

  const cardSize = getCardSize();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: cardSize.padding,
      minHeight: cardSize.minHeight,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    pressable: {
      opacity: 0.8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    titleContainer: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontSize: cardSize.titleSize,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    iconContainer: {
      width: cardSize.iconSize + 8,
      height: cardSize.iconSize + 8,
      borderRadius: (cardSize.iconSize + 8) / 2,
      backgroundColor: `${data.color}20`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    valueContainer: {
      marginBottom: 8,
    },
    value: {
      fontSize: cardSize.valueSize,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: cardSize.subtitleSize,
      color: colors.textSecondary,
      lineHeight: cardSize.subtitleSize * 1.2,
    },
    trendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 'auto',
    },
    trend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    trendText: {
      fontSize: cardSize.subtitleSize,
      fontWeight: '600',
    },
    trendPeriod: {
      fontSize: cardSize.subtitleSize - 1,
      color: colors.textSecondary,
      marginLeft: 4,
    },
  });

  const CardContent = () => (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{data.title}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons
            name={data.icon as any}
            size={cardSize.iconSize}
            color={data.color}
          />
        </View>
      </View>

      {/* Value */}
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{formatValue(data.value)}</Text>
        {data.subtitle && (
          <Text style={styles.subtitle}>{data.subtitle}</Text>
        )}
      </View>

      {/* Trend */}
      {data.trend && (
        <View style={styles.trendContainer}>
          <View style={styles.trend}>
            <Ionicons
              name={getTrendIcon(data.trend.direction)}
              size={cardSize.subtitleSize + 2}
              color={getTrendColor(data.trend.direction)}
            />
            <Text
              style={[
                styles.trendText,
                { color: getTrendColor(data.trend.direction) }
              ]}
            >
              {data.trend.percentage}%
            </Text>
            <Text style={styles.trendPeriod}>
              {data.trend.period}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  if (data.onPress) {
    return (
      <TouchableOpacity
        onPress={data.onPress}
        activeOpacity={0.8}
        style={styles.pressable}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
} 