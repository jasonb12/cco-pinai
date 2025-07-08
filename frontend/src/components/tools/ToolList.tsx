/**
 * Tool List Component - List view of tools with filtering and search
 * Based on PRD-UI.md specifications for Tools tab
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { Tool, ToolCategory, ToolStatus, ToolSearchFilters, ToolSortOptions, ToolSortField, SortDirection } from '../../types/tools';
import ToolCard from './ToolCard';

interface ToolListProps {
  tools: Tool[];
  onToolPress: (tool: Tool) => void;
  onToolToggle?: (toolId: string) => void;
  onToolSettings?: (tool: Tool) => void;
  onToolDelete?: (toolId: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  compact?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showSort?: boolean;
}

export default function ToolList({
  tools,
  onToolPress,
  onToolToggle,
  onToolSettings,
  onToolDelete,
  onRefresh,
  loading = false,
  compact = false,
  showSearch = true,
  showFilters = true,
  showSort = true
}: ToolListProps) {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<ToolSearchFilters>({});
  const [sortOptions, setSortOptions] = useState<ToolSortOptions>({
    field: ToolSortField.LAST_USED,
    direction: SortDirection.DESC
  });

  const filteredAndSortedTools = useMemo(() => {
    let filtered = tools;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(tool => tool.category === filters.category);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(tool => tool.status === filters.status);
    }

    // Apply capabilities filter
    if (filters.capabilities && filters.capabilities.length > 0) {
      filtered = filtered.filter(tool =>
        filters.capabilities!.every(capability =>
          tool.capabilities.includes(capability)
        )
      );
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(tool =>
        filters.tags!.some(tag => tool.tags.includes(tag))
      );
    }

    // Apply rating filter
    if (filters.rating) {
      filtered = filtered.filter(tool => tool.rating >= filters.rating!);
    }

    // Apply price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(tool => {
        if (!tool.pricing) return filters.priceRange![0] === 0;
        return tool.pricing.cost >= filters.priceRange![0] && 
               tool.pricing.cost <= filters.priceRange![1];
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortOptions.field) {
        case ToolSortField.NAME:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case ToolSortField.LAST_USED:
          aValue = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          bValue = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          break;
        case ToolSortField.USAGE_COUNT:
          aValue = a.usageCount;
          bValue = b.usageCount;
          break;
        case ToolSortField.RATING:
          aValue = a.rating;
          bValue = b.rating;
          break;
        case ToolSortField.CREATED_AT:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case ToolSortField.STATUS:
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOptions.direction === SortDirection.ASC) {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [tools, searchQuery, filters, sortOptions]);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.status) count++;
    if (filters.capabilities && filters.capabilities.length > 0) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.rating) count++;
    if (filters.priceRange) count++;
    return count;
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const renderFilterPanel = () => {
    if (!showFilterPanel) return null;

    return (
      <View style={styles.filterPanel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {/* Category Filter */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  {Object.values(ToolCategory).map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterOption,
                        filters.category === category && styles.activeFilterOption
                      ]}
                      onPress={() => setFilters({
                        ...filters,
                        category: filters.category === category ? undefined : category
                      })}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.category === category && styles.activeFilterOptionText
                      ]}>
                        {category.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Status Filter */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  {Object.values(ToolStatus).map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.filterOption,
                        filters.status === status && styles.activeFilterOption
                      ]}
                      onPress={() => setFilters({
                        ...filters,
                        status: filters.status === status ? undefined : status
                      })}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.status === status && styles.activeFilterOptionText
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Rating Filter */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Min Rating</Text>
              <View style={styles.filterOptions}>
                {[1, 2, 3, 4, 5].map(rating => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.filterOption,
                      filters.rating === rating && styles.activeFilterOption
                    ]}
                    onPress={() => setFilters({
                      ...filters,
                      rating: filters.rating === rating ? undefined : rating
                    })}
                  >
                    <Ionicons name="star" size={14} color={filters.rating === rating ? '#ffffff' : '#f59e0b'} />
                    <Text style={[
                      styles.filterOptionText,
                      filters.rating === rating && styles.activeFilterOptionText
                    ]}>
                      {rating}+
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderSortOptions = () => {
    const sortFields = [
      { field: ToolSortField.NAME, label: 'Name' },
      { field: ToolSortField.LAST_USED, label: 'Last Used' },
      { field: ToolSortField.USAGE_COUNT, label: 'Usage Count' },
      { field: ToolSortField.RATING, label: 'Rating' },
      { field: ToolSortField.CREATED_AT, label: 'Created' },
      { field: ToolSortField.STATUS, label: 'Status' },
    ];

    return (
      <View style={styles.sortContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.sortOptions}>
            {sortFields.map(({ field, label }) => (
              <TouchableOpacity
                key={field}
                style={[
                  styles.sortOption,
                  sortOptions.field === field && styles.activeSortOption
                ]}
                onPress={() => setSortOptions({
                  field,
                  direction: sortOptions.field === field && sortOptions.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC
                })}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortOptions.field === field && styles.activeSortOptionText
                ]}>
                  {label}
                </Text>
                {sortOptions.field === field && (
                  <Ionicons
                    name={sortOptions.direction === SortDirection.ASC ? 'chevron-up-outline' : 'chevron-down-outline'}
                    size={14}
                    color="#ffffff"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderToolItem = ({ item }: { item: Tool }) => (
    <View style={styles.toolItem}>
      <ToolCard
        tool={item}
        onPress={() => onToolPress(item)}
        onToggleActive={() => onToolToggle?.(item.id)}
        onSettings={() => onToolSettings?.(item)}
        onDelete={() => onToolDelete?.(item.id)}
        compact={compact}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="apps-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        {searchQuery || getActiveFiltersCount() > 0 ? 'No tools found' : 'No tools available'}
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
        {searchQuery || getActiveFiltersCount() > 0 
          ? 'Try adjusting your search or filters'
          : 'Add your first tool to get started'
        }
      </Text>
      {(searchQuery || getActiveFiltersCount() > 0) && (
        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
          <Text style={[styles.clearFiltersButtonText, { color: colors.primary }]}>
            Clear Filters
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    searchInput: {
      flex: 1,
      height: 40,
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingLeft: 40,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      position: 'absolute',
      left: 12,
      zIndex: 1,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      gap: 4,
    },
    activeFilterButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    activeFilterButtonText: {
      color: '#ffffff',
    },
    filterBadge: {
      backgroundColor: '#ef4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
    },
    filterBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#ffffff',
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      gap: 4,
    },
    sortButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    filterPanel: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 12,
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 20,
    },
    filterGroup: {
      minWidth: 120,
    },
    filterLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    filterOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    filterOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    activeFilterOption: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterOptionText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text,
      textTransform: 'capitalize',
    },
    activeFilterOptionText: {
      color: '#ffffff',
    },
    sortContainer: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 8,
    },
    sortOptions: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 8,
    },
    sortOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    activeSortOption: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sortOptionText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text,
    },
    activeSortOptionText: {
      color: '#ffffff',
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: 16,
    },
    toolItem: {
      marginBottom: 16,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtitle: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 24,
    },
    clearFiltersButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    clearFiltersButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <View style={{ flex: 1, position: 'relative' }}>
              <Ionicons
                name="search-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tools..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            {showFilters && (
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  (showFilterPanel || getActiveFiltersCount() > 0) && styles.activeFilterButton
                ]}
                onPress={() => setShowFilterPanel(!showFilterPanel)}
              >
                <Ionicons
                  name="filter-outline"
                  size={16}
                  color={(showFilterPanel || getActiveFiltersCount() > 0) ? '#ffffff' : colors.text}
                />
                <Text style={[
                  styles.filterButtonText,
                  (showFilterPanel || getActiveFiltersCount() > 0) && styles.activeFilterButtonText
                ]}>
                  Filter
                </Text>
                {getActiveFiltersCount() > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {getActiveFiltersCount()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            
            {showSort && (
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => {/* Toggle sort panel */}}
              >
                <Ionicons name="swap-vertical-outline" size={16} color={colors.text} />
                <Text style={styles.sortButtonText}>Sort</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Filter Panel */}
      {showFilters && renderFilterPanel()}

      {/* Sort Options */}
      {showSort && renderSortOptions()}

      {/* Tool List */}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={filteredAndSortedTools}
        renderItem={renderToolItem}
        keyExtractor={(item) => item.id}
        onRefresh={onRefresh}
        refreshing={loading}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
} 