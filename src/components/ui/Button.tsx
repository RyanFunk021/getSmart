import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  className?: string;
}

const variantClasses = {
  primary:   'bg-brand-500 active:bg-brand-600',
  secondary: 'bg-brand-100 active:bg-brand-200',
  ghost:     'bg-transparent border border-brand-300',
  danger:    'bg-accent-red active:bg-red-600',
};

const textClasses = {
  primary:   'text-white font-semibold',
  secondary: 'text-brand-700 font-semibold',
  ghost:     'text-brand-600 font-semibold',
  danger:    'text-white font-semibold',
};

const sizeClasses = {
  sm: 'px-4 py-2',
  md: 'px-6 py-3',
  lg: 'px-8 py-4',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  style,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-xl items-center justify-center ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || loading ? 'opacity-50' : ''}`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#6366f1'} />
      ) : (
        <Text className={`${textClasses[variant]} ${textSizeClasses[size]}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
