// components/TextField.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

type Props = {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: TextInputProps['keyboardType'];
  textContentType?: TextInputProps['textContentType'];
  autoComplete?: TextInputProps['autoComplete'];
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
};

export default function TextField(props: Props) {
  const { 
    label, 
    showPasswordToggle, 
    onTogglePassword, 
    secureTextEntry,
    error,
    disabled,
    multiline,
    numberOfLines,
    maxLength,
    leftIcon,
    rightIcon,
    onRightIconPress,
    ...inputProps 
  } = props;

  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;
  const hasLeftIcon = !!leftIcon;
  const hasRightContent = showPasswordToggle || rightIcon;

  return (
    <View style={styles.container}>
      <Text style={[
        styles.label,
        hasError && styles.labelError,
        disabled && styles.labelDisabled
      ]}>
        {label}
        {maxLength && props.value && (
          <Text style={styles.counter}> ({props.value.length}/{maxLength})</Text>
        )}
      </Text>
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        hasError && styles.inputContainerError,
        disabled && styles.inputContainerDisabled
      ]}>
        {hasLeftIcon && (
          <View style={styles.leftIcon}>
            <Ionicons
              name={leftIcon!}
              size={20}
              color={hasError ? theme.colors.error : (isFocused ? theme.colors.primary : theme.colors.muted)}
            />
          </View>
        )}
        
        <TextInput
          {...inputProps}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={!disabled}
          style={[
            styles.input,
            hasLeftIcon && styles.inputWithLeftIcon,
            hasRightContent && styles.inputWithRightIcon,
            multiline && styles.inputMultiline,
            disabled && styles.inputDisabled
          ]}
          placeholderTextColor={disabled ? theme.colors.disabled : theme.colors.muted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {hasRightContent && (
          <View style={styles.rightContent}>
            {showPasswordToggle && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onTogglePassword}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={disabled}
              >
                <Ionicons
                  name={secureTextEntry ? 'eye-off' : 'eye'}
                  size={20}
                  color={disabled ? theme.colors.disabled : theme.colors.muted}
                />
              </TouchableOpacity>
            )}
            
            {rightIcon && !showPasswordToggle && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onRightIconPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={disabled || !onRightIconPress}
              >
                <Ionicons
                  name={rightIcon}
                  size={20}
                  color={disabled ? theme.colors.disabled : theme.colors.muted}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      {hasError && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    gap: 6 
  },
  label: { 
    color: theme.colors.muted, 
    fontSize: 14,
    fontWeight: '500'
  },
  labelError: {
    color: theme.colors.error,
  },
  labelDisabled: {
    color: theme.colors.disabled,
  },
  counter: {
    fontSize: 12,
    fontWeight: '400',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: theme.colors.disabled + '20',
    borderColor: theme.colors.disabled,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  inputWithLeftIcon: {
    paddingLeft: 44,
  },
  inputWithRightIcon: {
    paddingRight: 44,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputDisabled: {
    color: theme.colors.disabled,
  },
  leftIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightContent: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 2,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 2,
  },
});