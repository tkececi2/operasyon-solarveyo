import React, { useState } from 'react';
import { Search, Filter, X, Plus, ChevronDown, Calendar, Hash, Type, ToggleLeft } from 'lucide-react';
import { Button, Input, Modal } from './';
import { FilterConfig, FilterValue } from '../../hooks/useAdvancedFilter';

interface AdvancedFilterProps<T> {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterConfigs: FilterConfig<T>[];
  activeFilters: FilterValue[];
  onAddFilter: (filter: FilterValue) => void;
  onRemoveFilter: (key: string) => void;
  onClearFilters: () => void;
  placeholder?: string;
  className?: string;
}

export function AdvancedFilter<T>({
  searchTerm,
  onSearchChange,
  filterConfigs,
  activeFilters,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
  placeholder = "Ara...",
  className = ""
}: AdvancedFilterProps<T>) {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<FilterValue>>({});

  const getFilterIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'number': return <Hash className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'boolean': return <ToggleLeft className="w-4 h-4" />;
      default: return <Filter className="w-4 h-4" />;
    }
  };

  const getOperatorOptions = (type: string) => {
    switch (type) {
      case 'text':
        return [
          { value: 'contains', label: 'İçerir' },
          { value: 'equals', label: 'Eşittir' },
          { value: 'startsWith', label: 'Şununla başlar' },
          { value: 'endsWith', label: 'Şununla biter' }
        ];
      case 'number':
        return [
          { value: 'equals', label: 'Eşittir' },
          { value: 'gt', label: 'Büyüktür' },
          { value: 'gte', label: 'Büyük eşittir' },
          { value: 'lt', label: 'Küçüktür' },
          { value: 'lte', label: 'Küçük eşittir' },
          { value: 'between', label: 'Arasında' }
        ];
      case 'date':
        return [
          { value: 'equals', label: 'Eşittir' },
          { value: 'gt', label: 'Sonra' },
          { value: 'gte', label: 'Sonra veya eşit' },
          { value: 'lt', label: 'Önce' },
          { value: 'lte', label: 'Önce veya eşit' },
          { value: 'between', label: 'Arasında' }
        ];
      case 'select':
      case 'boolean':
      default:
        return [{ value: 'equals', label: 'Eşittir' }];
    }
  };

  const handleAddFilter = () => {
    if (newFilter.key && newFilter.value !== undefined) {
      const config = filterConfigs.find(c => String(c.key) === newFilter.key);
      onAddFilter({
        key: newFilter.key,
        value: newFilter.value,
        operator: newFilter.operator || 'equals'
      });
      setNewFilter({});
      setShowFilterModal(false);
    }
  };

  const formatFilterValue = (filter: FilterValue) => {
    const config = filterConfigs.find(c => String(c.key) === filter.key);
    if (config?.format) {
      return config.format(filter.value);
    }
    if (Array.isArray(filter.value)) {
      return filter.value.join(' - ');
    }
    return String(filter.value);
  };

  const renderFilterInput = (config: FilterConfig<T>) => {
    switch (config.type) {
      case 'text':
        return (
          <Input
            placeholder={config.placeholder}
            value={newFilter.value || ''}
            onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
          />
        );
      
      case 'number':
        if (newFilter.operator === 'between') {
          return (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={newFilter.value?.[0] || ''}
                onChange={(e) => setNewFilter(prev => ({
                  ...prev,
                  value: [e.target.value, prev.value?.[1] || '']
                }))}
              />
              <Input
                type="number"
                placeholder="Max"
                value={newFilter.value?.[1] || ''}
                onChange={(e) => setNewFilter(prev => ({
                  ...prev,
                  value: [prev.value?.[0] || '', e.target.value]
                }))}
              />
            </div>
          );
        }
        return (
          <Input
            type="number"
            placeholder={config.placeholder}
            value={newFilter.value || ''}
            onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
          />
        );
      
      case 'date':
        if (newFilter.operator === 'between') {
          return (
            <div className="flex gap-2">
              <Input
                type="date"
                value={newFilter.value?.[0] || ''}
                onChange={(e) => setNewFilter(prev => ({
                  ...prev,
                  value: [e.target.value, prev.value?.[1] || '']
                }))}
              />
              <Input
                type="date"
                value={newFilter.value?.[1] || ''}
                onChange={(e) => setNewFilter(prev => ({
                  ...prev,
                  value: [prev.value?.[0] || '', e.target.value]
                }))}
              />
            </div>
          );
        }
        return (
          <Input
            type="date"
            value={newFilter.value || ''}
            onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
          />
        );
      
      case 'select':
        return (
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newFilter.value || ''}
            onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
          >
            <option value="">Seçin...</option>
            {config.options?.map(option => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'boolean':
        return (
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newFilter.value || ''}
            onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value === 'true' }))}
          >
            <option value="">Seçin...</option>
            <option value="true">Evet</option>
            <option value="false">Hayır</option>
          </select>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilterModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Filtre Ekle
        </Button>

        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            leftIcon={<X className="w-4 h-4" />}
            className="text-red-600 hover:text-red-700"
          >
            Tümünü Temizle
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => {
            const config = filterConfigs.find(c => String(c.key) === filter.key);
            return (
              <div
                key={filter.key}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {getFilterIcon(config?.type || 'text')}
                <span className="font-medium">{config?.label}:</span>
                <span>{formatFilterValue(filter)}</span>
                <button
                  onClick={() => onRemoveFilter(filter.key)}
                  className="ml-1 hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => {
          setShowFilterModal(false);
          setNewFilter({});
        }}
        title="Filtre Ekle"
      >
        <div className="space-y-4">
          {/* Field Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alan
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newFilter.key || ''}
              onChange={(e) => setNewFilter({ key: e.target.value, value: '', operator: 'equals' })}
            >
              <option value="">Alan seçin...</option>
              {filterConfigs.map(config => (
                <option key={String(config.key)} value={String(config.key)}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Operator Selection */}
          {newFilter.key && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operatör
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newFilter.operator || 'equals'}
                onChange={(e) => setNewFilter(prev => ({ ...prev, operator: e.target.value as any }))}
              >
                {getOperatorOptions(filterConfigs.find(c => String(c.key) === newFilter.key)?.type || 'text')
                  .map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Value Input */}
          {newFilter.key && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Değer
              </label>
              {renderFilterInput(filterConfigs.find(c => String(c.key) === newFilter.key)!)}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowFilterModal(false);
                setNewFilter({});
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleAddFilter}
              disabled={!newFilter.key || newFilter.value === undefined || newFilter.value === ''}
            >
              Filtre Ekle
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
