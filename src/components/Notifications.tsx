import React from 'react';
import { ToastContainer, toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Типове нотификации
type NotificationType = 'success' | 'error' | 'info' | 'warning';

// Настройки по подразбиране за всеки тип нотификация
const defaultOptions: Record<NotificationType, ToastOptions> = {
  success: {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: 'notification-success',
  },
  error: {
    position: 'top-right',
    autoClose: 7000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: 'notification-error',
  },
  info: {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: 'notification-info',
  },
  warning: {
    position: 'top-right',
    autoClose: 6000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: 'notification-warning',
  },
};

// Интерфейс за функциите, които показват различни типове нотификации
interface NotifyFunctions {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  custom: (message: string, options: ToastOptions) => void;
  dismiss: (id?: string | number) => void;
  dismissAll: () => void;
}

// Обект с функции за показване на нотификации
export const notify: NotifyFunctions = {
  success: (message, options = {}) => {
    toast.success(message, { ...defaultOptions.success, ...options });
  },
  error: (message, options = {}) => {
    toast.error(message, { ...defaultOptions.error, ...options });
  },
  info: (message, options = {}) => {
    toast.info(message, { ...defaultOptions.info, ...options });
  },
  warning: (message, options = {}) => {
    toast.warning(message, { ...defaultOptions.warning, ...options });
  },
  custom: (message, options) => {
    toast(message, options);
  },
  dismiss: (id) => {
    toast.dismiss(id);
  },
  dismissAll: () => {
    toast.dismiss();
  },
};

// Компонент, който трябва да се инсталира във вашето приложение
const Notifications: React.FC = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      className="custom-toast-container"
    />
  );
};

export default Notifications; 