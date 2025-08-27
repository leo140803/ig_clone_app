// components/CustomAlert.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  StatusBar,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

const { width, height } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  actions?: AlertAction[];
  onClose?: () => void;
  autoClose?: number; // auto close after X milliseconds
  dismissible?: boolean; // can dismiss by tapping outside
}

const ALERT_COLORS = {
  success: {
    icon: 'checkmark-circle',
    color: '#4CAF50',
    background: '#E8F5E8',
  },
  error: {
    icon: 'close-circle',
    color: '#F44336',
    background: '#FFEBEE',
  },
  warning: {
    icon: 'warning',
    color: '#FF9800',
    background: '#FFF3E0',
  },
  info: {
    icon: 'information-circle',
    color: '#2196F3',
    background: '#E3F2FD',
  },
} as const;

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type = 'info',
  title,
  message,
  actions = [],
  onClose,
  autoClose,
  dismissible = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);

  const alertConfig = ALERT_COLORS[type];

  // Default actions if none provided
  const defaultActions: AlertAction[] = actions.length > 0 ? actions : [
    {
      text: 'OK',
      onPress: onClose,
      style: 'default',
    },
  ];

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close timer
      if (autoClose && autoClose > 0) {
        autoCloseTimer.current = setTimeout(() => {
          handleClose();
        }, autoClose);
      }

      // Handle Android back button
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (dismissible) {
          handleClose();
          return true;
        }
        return true;
      });

      return () => {
        backHandler.remove();
        if (autoCloseTimer.current) {
          clearTimeout(autoCloseTimer.current);
        }
      };
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, autoClose, dismissible]);

  const handleClose = () => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
    }
    
    // Animate out
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  const handleBackdropPress = () => {
    if (dismissible) {
      handleClose();
    }
  };

  const getButtonStyle = (buttonStyle: AlertAction['style']) => {
    switch (buttonStyle) {
      case 'cancel':
        return [styles.actionButton, styles.cancelButton];
      case 'destructive':
        return [styles.actionButton, styles.destructiveButton];
      default:
        return [styles.actionButton, styles.defaultButton];
    }
  };

  const getButtonTextStyle = (buttonStyle: AlertAction['style']) => {
    switch (buttonStyle) {
      case 'cancel':
        return [styles.actionButtonText, { color: theme.colors.muted }];
      case 'destructive':
        return [styles.actionButtonText, { color: '#fff' }];
      default:
        return [styles.actionButtonText, { color: '#fff' }];
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismissible ? handleClose : undefined}
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.5)" barStyle="light-content" />
      <Pressable 
        style={styles.overlay} 
        onPress={handleBackdropPress}
        disabled={!dismissible}
      >
        <Animated.View
          style={[
            styles.alertContainer,
            {
              backgroundColor: theme.colors.surface,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Prevent touch events from bubbling to backdrop */}
          <Pressable onPress={() => {}}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: alertConfig.background }]}>
              <Ionicons
                name={alertConfig.icon as any}
                size={64}
                color={alertConfig.color}
              />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>

            {/* Message */}
            {message && (
              <Text style={[styles.message, { color: theme.colors.muted }]}>
                {message}
              </Text>
            )}

            {/* Actions */}
            <View style={styles.actionsContainer}>
              {defaultActions.map((action, index) => (
                <Pressable
                  key={index}
                  style={getButtonStyle(action.style)}
                  onPress={() => {
                    action.onPress?.();
                    if (!action.onPress) {
                      handleClose();
                    }
                  }}
                  android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <Text style={getButtonTextStyle(action.style)}>
                    {action.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    display: 'flex',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 28,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  defaultButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButton: {
    backgroundColor: theme.colors.border,
  },
  destructiveButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomAlert;