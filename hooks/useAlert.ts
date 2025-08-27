// hooks/useAlert.ts
import { useState, useCallback } from 'react';
import { AlertType, AlertAction } from '../components/CustomAllert';

interface AlertConfig {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  actions?: AlertAction[];
  autoClose?: number;
  dismissible?: boolean;
}

const initialAlertConfig: AlertConfig = {
  visible: false,
  type: 'info',
  title: '',
  message: '',
  actions: [],
  autoClose: undefined,
  dismissible: true,
};

export const useAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(initialAlertConfig);

  const showAlert = useCallback((
    type: AlertType,
    title: string,
    message?: string,
    actions?: AlertAction[],
    options?: {
      autoClose?: number;
      dismissible?: boolean;
    }
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      actions,
      autoClose: options?.autoClose,
      dismissible: options?.dismissible ?? true,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((
    title: string,
    message?: string,
    autoClose?: number
  ) => {
    showAlert('success', title, message, undefined, { autoClose });
  }, [showAlert]);

  const showError = useCallback((
    title: string,
    message?: string,
    actions?: AlertAction[]
  ) => {
    showAlert('error', title, message, actions);
  }, [showAlert]);

  const showWarning = useCallback((
    title: string,
    message?: string,
    actions?: AlertAction[]
  ) => {
    showAlert('warning', title, message, actions);
  }, [showAlert]);

  const showInfo = useCallback((
    title: string,
    message?: string,
    actions?: AlertAction[]
  ) => {
    showAlert('info', title, message, actions);
  }, [showAlert]);

  const showConfirm = useCallback((
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      destructive?: boolean;
    }
  ) => {
    const actions: AlertAction[] = [
      {
        text: options?.cancelText || 'Batal',
        style: 'cancel',
        onPress: () => {
          onCancel?.();
          hideAlert();
        },
      },
      {
        text: options?.confirmText || 'OK',
        style: options?.destructive ? 'destructive' : 'default',
        onPress: () => {
          onConfirm?.();
          hideAlert();
        },
      },
    ];

    showAlert('warning', title, message, actions, { dismissible: false });
  }, [showAlert, hideAlert]);

  return {
    alertConfig,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
};