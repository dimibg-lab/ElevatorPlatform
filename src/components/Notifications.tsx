import React, { useContext, useEffect, ReactNode } from 'react';
import { ToastContainer, toast, ToastOptions, cssTransition } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeContext, isDarkThemeActive } from '../App';

/**
 * Система за Toast нотификации (временни съобщения)
 * 
 * ВАЖНО: Този компонент управлява САМО временните toast съобщения и е напълно 
 * отделен от постоянните нотификации, които се показват в дропдаун меню (NotificationCenter.tsx).
 * 
 * Характеристики на toast нотификациите в този файл:
 * - Временни: появяват се и изчезват автоматично след няколко секунди
 * - Не се съхраняват в база данни, а са само визуални индикатори
 * - Използват се за бърза обратна връзка след действия (успех, грешка, предупреждение)
 * - Имплементирани чрез библиотеката react-toastify
 * 
 * За постоянните нотификации, които изискват действие от потребителя,
 * използвайте NotificationCenter.tsx.
 * 
 * За работа и с двата вида нотификации, използвайте NotificationsManager.tsx,
 * който предоставя унифициран интерфейс за всички видове известия.
 * 
 * Връзка между компонентите:
 * - Notifications.tsx (този файл): Временни toast съобщения с react-toastify
 * - NotificationCenter.tsx: Постоянни нотификации в дропдаун меню от базата данни
 * - NotificationsManager.tsx: Обединява двете системи с единен API
 */

// Типове
type NotificationType = 'success' | 'error' | 'info' | 'warning';
type ToastId = string | number;

// Плавна анимация за появяване и изчезване
const toastAnimation = cssTransition({
  enter: 'animate-toast-enter',
  exit: 'animate-toast-exit',
});

// Базов компонент за икони, приемащ SVG path
const IconBase = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <div className={`shrink-0 mr-3 ${className}`} aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      {children}
    </svg>
  </div>
);

// Дефиниране на икони за различните типове нотификации
const NotificationIcons = {
  success: (
    <IconBase>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </IconBase>
  ),
  error: (
    <IconBase>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </IconBase>
  ),
  info: (
    <IconBase>
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </IconBase>
  ),
  warning: (
    <IconBase>
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </IconBase>
  )
};

// Настройки на цветовете според типа нотификация и темата
const getColorClasses = (type: NotificationType, isDark: boolean): { 
  background: string,
  border: string, 
  text: string,
  progress: string,
  hover: string
} => {
  const mode = isDark ? 'dark' : 'light';
  
  const colors = {
    light: {
      success: {
        background: 'bg-green-50/95',
        border: 'border-green-500',
        text: 'text-green-800',
        progress: 'bg-green-500',
        hover: 'hover:bg-green-100/80'
      },
      error: {
        background: 'bg-red-50/95',
        border: 'border-red-500',
        text: 'text-red-800',
        progress: 'bg-red-500',
        hover: 'hover:bg-red-100/80'
      },
      info: {
        background: 'bg-blue-50/95',
        border: 'border-blue-500',
        text: 'text-blue-800',
        progress: 'bg-blue-500',
        hover: 'hover:bg-blue-100/80'
      },
      warning: {
        background: 'bg-amber-50/95',
        border: 'border-amber-500',
        text: 'text-amber-800',
        progress: 'bg-amber-500',
        hover: 'hover:bg-amber-100/80'
      }
    },
    dark: {
      success: {
        background: 'bg-teal-900/90',
        border: 'border-teal-600',
        text: 'text-teal-100',
        progress: 'bg-teal-500',
        hover: 'hover:bg-teal-800/90'
      },
      error: {
        background: 'bg-red-900/85',
        border: 'border-red-500',
        text: 'text-red-100',
        progress: 'bg-red-400',
        hover: 'hover:bg-red-800/90'
      },
      info: {
        background: 'bg-blue-900/85',
        border: 'border-blue-500',
        text: 'text-blue-100',
        progress: 'bg-blue-400',
        hover: 'hover:bg-blue-800/90'
      },
      warning: {
        background: 'bg-amber-900/85',
        border: 'border-amber-500',
        text: 'text-amber-100',
        progress: 'bg-amber-400',
        hover: 'hover:bg-amber-800/90'
      }
    }
  };
  
  return colors[mode][type];
};

// Функция за създаване на настройки по подразбиране за всеки тип нотификация
const getDefaultOptions = (type: NotificationType, isDarkMode: boolean): ToastOptions => {
  const colors = getColorClasses(type, isDarkMode);
  const baseClasses = `rounded-lg shadow-lg border-l-4 transition-all duration-300 ${colors.background} ${colors.border} ${colors.text} ${colors.hover} group`;
  const iconColor = isDarkMode ? 'text-opacity-90' : '';
  
  return {
    position: 'top-right',
    autoClose: type === 'error' ? 2500 : 2000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    className: baseClasses,
    progressClassName: `${colors.progress}`,
    style: { 
      padding: '12px 16px',
      maxWidth: '400px',
      minWidth: '300px'
    },
    icon: (
      <div className={`${colors.text} ${iconColor}`}>
        {NotificationIcons[type]}
      </div>
    ),
    role: type === 'info' ? 'status' : 'alert',
    transition: toastAnimation,
    toastId: `${type}-${Date.now()}`
  };
};

// Интерфейс за нотификационните функции
interface NotifyFunctions {
  success: (message: ReactNode, options?: ToastOptions) => ToastId;
  error: (message: ReactNode, options?: ToastOptions) => ToastId;
  info: (message: ReactNode, options?: ToastOptions) => ToastId;
  warning: (message: ReactNode, options?: ToastOptions) => ToastId;
  custom: (message: ReactNode, options: ToastOptions) => ToastId;
  dismiss: (id?: ToastId) => void;
  dismissAll: () => void;
}

// Създаваме хук за използване на нотификации в компоненти
export const useNotify = (): NotifyFunctions => {
  const { darkMode } = useContext(ThemeContext);
  
  return {
    success: (message, options = {}) => 
      toast.success(message, { ...getDefaultOptions('success', darkMode), ...options }),
    error: (message, options = {}) => 
      toast.error(message, { ...getDefaultOptions('error', darkMode), ...options }),
    info: (message, options = {}) => 
      toast.info(message, { ...getDefaultOptions('info', darkMode), ...options }),
    warning: (message, options = {}) => 
      toast.warning(message, { ...getDefaultOptions('warning', darkMode), ...options }),
    custom: (message, options) => toast(message, options),
    dismiss: (id) => toast.dismiss(id),
    dismissAll: () => toast.dismiss()
  };
};

// Функция за създаване на нотификации с прилагане на правилните класове
const createNotification = (
  type: NotificationType,
  message: ReactNode,
  options = {}
): ToastId => {
  const isDarkMode = isDarkThemeActive();
  const toastId = `${type}-${Date.now()}`;
  const defaultOptions = getDefaultOptions(type, isDarkMode);
  
  // Добавяме функция за настройка на DOM елемента след създаване
  const onOpen = () => {
    const element = document.getElementById(`${toastId}`);
    if (element) {
      element.setAttribute('data-type', type);
      element.classList.add(`${type}-toast`);
      
      // Прилагаме правилните класове за темата
      if (isDarkMode) {
        element.classList.add('dark-mode-toast');
        element.classList.remove('light-mode-toast');
      } else {
        element.classList.add('light-mode-toast');
        element.classList.remove('dark-mode-toast');
      }
    }
  };
  
  // Комбинираме опциите
  const mergedOptions = { 
    ...defaultOptions,
    ...options,
    toastId,
    onOpen
  };
  
  let result;
  switch (type) {
    case 'success':
      result = toast.success(message, mergedOptions);
      break;
    case 'error':
      result = toast.error(message, mergedOptions);
      break;
    case 'info':
      result = toast.info(message, mergedOptions);
      break;
    case 'warning':
      result = toast.warning(message, mergedOptions);
      break;
    default:
      result = toast(message, { ...options, toastId });
      break;
  }

  return result;
};

// Експортираме обект с функции за глобално използване
export const notify: NotifyFunctions = {
  success: (message, options = {}) => createNotification('success', message, options),
  error: (message, options = {}) => createNotification('error', message, options),
  info: (message, options = {}) => createNotification('info', message, options),
  warning: (message, options = {}) => createNotification('warning', message, options),
  custom: (message, options) => toast(message, options),
  dismiss: (id) => toast.dismiss(id),
  dismissAll: () => toast.dismiss()
};

// Компонент за заглавие на нотификация
interface NotificationTitleProps {
  title: string;
  description?: string;
}

const NotificationTitle: React.FC<NotificationTitleProps> = ({ title, description }) => {
  if (!description) {
    return <span>{title}</span>;
  }
  
  return (
    <div className="flex flex-col">
      <span className="font-semibold text-sm">{title}</span>
      <span className="text-xs opacity-90 mt-0.5">{description}</span>
    </div>
  );
};

// Хелпър функция за показване на нотификация със заглавие и описание
export const notifyWithTitle = {
  success: (title: string, description?: string, options = {}) => {
    return notify.success(<NotificationTitle title={title} description={description} />, options);
  },
  error: (title: string, description?: string, options = {}) => {
    return notify.error(<NotificationTitle title={title} description={description} />, options);
  },
  info: (title: string, description?: string, options = {}) => {
    return notify.info(<NotificationTitle title={title} description={description} />, options);
  },
  warning: (title: string, description?: string, options = {}) => {
    return notify.warning(<NotificationTitle title={title} description={description} />, options);
  }
};

// Допълнителни стилове за позициониране на нотификациите
const notificationsStyles = `
  .Toastify__toast-container--top-right {
    top: 1rem;
    right: 1rem;
    width: auto;
    max-width: 500px;
    padding: 0;
    z-index: 9999;
  }
  
  .Toastify__toast {
    padding: 12px 16px;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    position: relative;
    min-height: 0;
    justify-content: space-between;
  }
  
  .Toastify__toast-body {
    flex: 1;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
  }
  
  .Toastify__toast-icon {
    margin-right: 10px;
    width: 20px;
    flex-shrink: 0;
  }
  
  /* Коригиране на позицията на бутона за затваряне */
  .Toastify__close-button {
    position: relative !important;
    right: auto !important;
    top: auto !important;
    opacity: 0.7;
    padding: 0;
    margin-left: 10px !important;
    align-self: center;
  }
  
  .Toastify__close-button:hover {
    opacity: 1;
  }
  
  .success-toast .Toastify__close-button {
    color: var(--toastify-color-success);
  }
  
  .error-toast .Toastify__close-button {
    color: var(--toastify-color-error);
  }
  
  .info-toast .Toastify__close-button {
    color: var(--toastify-color-info);
  }
  
  .warning-toast .Toastify__close-button {
    color: var(--toastify-color-warning);
  }
`;

// Функция за инжектиране на глобални стилове
const injectGlobalStyles = () => {
  if (typeof window !== 'undefined' && !document.getElementById('toast-custom-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-custom-styles';
    style.innerHTML = `
      ${notificationsStyles}
      .Toastify__toast-container {
        width: auto;
        max-width: 400px;
        padding: 0;
      }
      
      .Toastify__toast {
        margin-bottom: 16px;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        box-shadow: 0 10px 15px -3px rgba(var(--color-shadow), 0.1), 0 4px 6px -2px rgba(var(--color-shadow), 0.05);
      }
      
      .Toastify__toast-body {
        font-weight: 500;
        font-size: 0.875rem;
        line-height: 1.5;
        padding: 0;
        display: flex;
        align-items: flex-start;
      }
      
      .Toastify__toast-icon {
        margin-right: 12px;
      }
      
      /* Стилизация на прогрес бара */
      .Toastify__progress-bar {
        height: 3px;
        opacity: 0.7;
        bottom: 0;
        position: absolute;
      }
      
      .Toastify__toast.success-toast .Toastify__progress-bar {
        background: var(--color-success, rgb(16, 185, 129)) !important;
      }
      
      .Toastify__toast.error-toast .Toastify__progress-bar {
        background: var(--color-error, rgb(239, 68, 68)) !important;
      }
      
      .Toastify__toast.info-toast .Toastify__progress-bar {
        background: var(--color-info, rgb(59, 130, 246)) !important;
      }
      
      .Toastify__toast.warning-toast .Toastify__progress-bar {
        background: var(--color-warning, rgb(245, 158, 11)) !important;
      }
      
      .Toastify__close-button {
        opacity: 0;
        transition: all 0.2s ease;
        color: currentColor;
        align-self: flex-start;
        background: transparent;
        padding: 4px;
        border-radius: 9999px;
      }
      
      .Toastify__toast:hover .Toastify__close-button {
        opacity: 0.7;
      }
      
      .Toastify__toast .Toastify__close-button:hover {
        opacity: 1;
        background-color: rgba(0, 0, 0, 0.1);
      }
      
      .Toastify__toast .Toastify__close-button:focus {
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }
      
      /* Стилове за тъмен режим */
      html.dark .Toastify__toast,
      body.dark-theme .Toastify__toast,
      .dark-mode-toast {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -2px rgba(0, 0, 0, 0.2) !important;
      }
      
      /* Специфични стилове за типовете нотификации */
      .dark-mode-toast.success-toast {
        background-color: rgba(15, 118, 110, 0.9) !important;
        border-left-color: rgb(13, 148, 136) !important;
        color: rgb(204, 251, 241) !important;
      }
      
      .dark-mode-toast.error-toast {
        background-color: rgba(127, 29, 29, 0.95) !important;
        border-left-color: rgb(239, 68, 68) !important;
        color: rgb(254, 226, 226) !important;
      }
      
      .dark-mode-toast.info-toast {
        background-color: rgba(30, 58, 138, 0.95) !important;
        border-left-color: rgb(59, 130, 246) !important;
        color: rgb(219, 234, 254) !important;
      }
      
      .dark-mode-toast.warning-toast {
        background-color: rgba(120, 53, 15, 0.95) !important;
        border-left-color: rgb(245, 158, 11) !important;
        color: rgb(255, 237, 213) !important;
      }
      
      /* Стилове за светъл режим */
      .light-mode-toast.success-toast {
        background-color: rgba(240, 253, 250, 0.95) !important;
        border-left-color: rgb(20, 184, 166) !important;
        color: rgb(17, 94, 89) !important;
      }
      
      .light-mode-toast.error-toast {
        background-color: rgba(254, 242, 242, 0.95) !important;
        border-left-color: rgb(239, 68, 68) !important;
        color: rgb(153, 27, 27) !important;
      }
      
      .light-mode-toast.info-toast {
        background-color: rgba(239, 246, 255, 0.95) !important;
        border-left-color: rgb(59, 130, 246) !important;
        color: rgb(30, 64, 175) !important;
      }
      
      .light-mode-toast.warning-toast {
        background-color: rgba(255, 251, 235, 0.95) !important;
        border-left-color: rgb(245, 158, 11) !important;
        color: rgb(146, 64, 14) !important;
      }
      
      /* Анимации */
      @keyframes toast-enter {
        0% { transform: translateY(-10px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes toast-exit {
        0% { transform: translateX(0); opacity: 1; }
        100% { transform: translateX(120%); opacity: 0; }
      }
      
      .animate-toast-enter {
        animation: toast-enter 0.3s ease-out forwards;
      }
      
      .animate-toast-exit {
        animation: toast-exit 0.3s ease-out forwards;
      }
      
      /* Гарантиране вярното оцветяване на съдържанието */
      .dark-mode-toast * {
        color: inherit !important;
      }
      
      .light-mode-toast * {
        color: inherit !important;
      }
      
      /* Коректно оцветяване на иконите */
      .success-toast svg,
      .error-toast svg,
      .info-toast svg,
      .warning-toast svg {
        fill: currentColor !important;
      }
      
      /* Адаптивност за мобилни устройства */
      @media (max-width: 480px) {
        .Toastify__toast-container {
          width: 100%;
          max-width: none;
          padding: 0 16px;
        }
        
        .Toastify__toast {
          margin-bottom: 8px;
          border-radius: 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }
};

// Функция за обновяване на темата на нотификациите
const updateToastsTheme = () => {
  const isDarkMode = isDarkThemeActive();
  
  // Обновяваме контейнера
  const toastContainer = document.querySelector('.Toastify');
  if (toastContainer) {
    if (isDarkMode) {
      toastContainer.classList.add('dark-theme');
      toastContainer.classList.remove('light-theme');
    } else {
      toastContainer.classList.add('light-theme');
      toastContainer.classList.remove('dark-theme');
    }
  }
  
  // Обновяваме всяка нотификация
  document.querySelectorAll('.Toastify__toast').forEach((toast: Element) => {
    // Добавяме основния клас за тема
    if (isDarkMode) {
      toast.classList.add('dark-mode-toast');
      toast.classList.remove('light-mode-toast');
    } else {
      toast.classList.add('light-mode-toast');
      toast.classList.remove('dark-mode-toast');
    }
    
    // Проверяваме/задаваме типа
    const type = toast.getAttribute('data-type') as NotificationType | null;
    if (type && !toast.classList.contains(`${type}-toast`)) {
      toast.classList.add(`${type}-toast`);
    }
  });
};

// Функция за настройка на слушателите за промени в темата
const setupThemeChangeListener = () => {
  if (typeof window === 'undefined') return () => {};
  
  // Слушаме за промени в localStorage
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'theme') updateToastsTheme();
  };
  
  // Слушаме за персонализираното събитие themeChange
  const handleThemeChange = () => updateToastsTheme();
  
  // Добавяме слушатели
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('themeChange', handleThemeChange);
  
  // Създаваме MutationObserver за HTML класовете
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.target === document.documentElement &&
        mutation.attributeName === 'class'
      ) {
        updateToastsTheme();
      }
    });
  });
  
  // Следим за промени в класа на документа
  observer.observe(document.documentElement, { attributes: true });
  
  // Първоначално обновяване
  updateToastsTheme();
  
  // Функция за почистване
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('themeChange', handleThemeChange);
    observer.disconnect();
  };
};

// Главен компонент за нотификации
const Notifications: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  
  // Инжектираме стиловете и настройваме слушателите при монтиране
  useEffect(() => {
    injectGlobalStyles();
    return setupThemeChangeListener();
  }, []);
  
  // Определяне на позицията според размера на екрана
  const [, setPosition] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 480 ? 'bottom-center' : 'top-right';
    }
    return 'top-right';
  });
  
  // Следим за промяна в размера на екрана
  useEffect(() => {
    const handleResize = () => {
      setPosition(window.innerWidth <= 480 ? 'bottom-center' : 'top-right');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <ToastContainer
      position="top-right"
      autoClose={2000}
      hideProgressBar={true}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss={false}
      pauseOnHover={false}
      draggable
      theme={darkMode ? "dark" : "light"}
      className={`fixed mt-1 mr-1 z-50 ${darkMode ? 'dark-theme' : 'light-theme'}`}
      toastClassName={(context) => {
        const { type = 'default' } = context || {};
        const baseClasses = 'Toastify__toast';
        const themeClass = darkMode ? 'dark-mode-toast' : 'light-mode-toast';
        const typeClass = type !== 'default' ? `${type}-toast` : '';
        
        return `${baseClasses} ${themeClass} ${typeClass}`;
      }}
      closeButton={({ closeToast }) => (
        <button
          onClick={closeToast}
          className={`flex items-center justify-center p-1.5 rounded-full opacity-70 hover:opacity-100 focus:outline-none ${darkMode ? 'text-gray-300 hover:bg-white/10' : 'text-gray-600 hover:bg-black/10'}`}
          aria-label="Затвори нотификацията"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    />
  );
};

export default Notifications;