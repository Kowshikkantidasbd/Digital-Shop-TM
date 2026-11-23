import React from 'react';
import { ChevronDown } from 'lucide-react';

export type BadgeVariant = 'amber' | 'green' | 'rose' | 'grey' | 'blue' | 'purple' | 'default';

export interface CountBadgeProps {
  count?: number | string;
  variant?: BadgeVariant;
  isActive?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  variant = 'grey',
  isActive = false,
  theme = 'dark',
  className = '',
}) => {
  if (count === undefined || count === null) return null;

  // Active state styling: solid high-contrast chip against brand orange
  if (isActive) {
    return (
      <span
        className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-bold ${
          theme === 'light' ? 'bg-black/20 text-white' : 'bg-black/30 text-white'
        } shrink-0 tracking-normal ${className}`}
      >
        {count}
      </span>
    );
  }

  // Theme-aware semantic pill count styles
  const darkVariantStyles: Record<BadgeVariant, string> = {
    amber: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    green: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    rose: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    grey: 'bg-white/10 text-gray-300 border border-white/5',
    default: 'bg-white/10 text-gray-300 border border-white/5',
    blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  };

  const lightVariantStyles: Record<BadgeVariant, string> = {
    amber: 'bg-amber-50 text-amber-800 border border-amber-200',
    green: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    rose: 'bg-rose-50 text-rose-800 border border-rose-200',
    grey: 'bg-slate-100 text-slate-700 border border-slate-200',
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    blue: 'bg-blue-50 text-blue-800 border border-blue-200',
    purple: 'bg-purple-50 text-purple-800 border border-purple-200',
  };

  const variantStyles = theme === 'light' ? lightVariantStyles : darkVariantStyles;

  return (
    <span
      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-bold shrink-0 tracking-normal transition-colors duration-150 ${
        variantStyles[variant] || variantStyles.grey
      } ${className}`}
    >
      {count}
    </span>
  );
};

export interface FilterTabItem<T = string> {
  id: T;
  label: string;
  count?: number | string;
  badgeVariant?: BadgeVariant;
  icon?: React.ReactNode;
}

export interface FilterTabGroupProps<T = string> {
  tabs: FilterTabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md';
  wrap?: boolean;
  className?: string;
  pillClassName?: string;
  ariaLabel?: string;
}

export function FilterTabGroup<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  variant = 'dark',
  size = 'md',
  wrap = false,
  className = '',
  pillClassName = '',
  ariaLabel,
}: FilterTabGroupProps<T>) {
  const isDark = variant === 'dark';
  const isSm = size === 'sm';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex items-center gap-2 select-none ${
        wrap ? 'flex-wrap' : 'overflow-x-auto pb-1 lg:pb-0.5 no-scrollbar'
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={String(tab.id)}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`rounded-xl font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 ${
              isSm ? 'px-3 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'
            } ${
              isActive
                ? 'bg-brand-orange text-white shadow-sm shadow-brand-orange/25 border border-brand-orange'
                : isDark
                ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-2xs'
            } ${pillClassName}`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <CountBadge
                count={tab.count}
                variant={tab.badgeVariant || 'grey'}
                isActive={isActive}
                theme={variant}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface FilterDropdownOption {
  value: string;
  label: string;
}

export interface FilterDropdownProps {
  label?: string;
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md';
  className?: string;
  selectClassName?: string;
  ariaLabel?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  icon,
  variant = 'dark',
  size = 'md',
  className = '',
  selectClassName = '',
  ariaLabel,
}) => {
  const isDark = variant === 'dark';
  const isSm = size === 'sm';

  return (
    <div className={`flex items-center gap-2 shrink-0 ${className}`}>
      {label && (
        <span
          className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          {label}
        </span>
      )}
      <div className="relative inline-flex items-center">
        {icon && (
          <span
            className={`absolute left-3 pointer-events-none z-10 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {icon}
          </span>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel || label}
          className={`appearance-none rounded-xl font-bold cursor-pointer transition-all outline-none pr-8 select-none ${
            isSm ? 'px-3 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'
          } ${icon ? 'pl-8' : ''} ${
            isDark
              ? 'bg-black/40 border border-white/10 text-white focus:border-brand-orange hover:border-white/20'
              : 'bg-white border border-gray-200 text-gray-800 shadow-xs focus:border-brand-orange hover:border-gray-300'
          } ${selectClassName}`}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className={isDark ? 'bg-[#12121a] text-white' : 'bg-white text-gray-900'}
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={isSm ? 13 : 14}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}
        />
      </div>
    </div>
  );
};
