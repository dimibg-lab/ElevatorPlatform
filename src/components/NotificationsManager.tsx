import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import NotificationCenter, { useNotifications } from './NotificationCenter';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

/**
 * Мениджър компонент за всички видове нотификации в приложението
 * 
 * Този компонент има две ключови функции:
 * 1. Обединява и унифицира достъпа до двете отделни системи за нотификации:
 *    - Временни toast нотификации (react-toastify) - за моментна обратна връзка
 *    - Постоянни нотификации в дропдаун меню - съхранявани в базата данни
 * 
 * 2. Предоставя единен и опростен API за всички останали компоненти в приложението
 *    чрез React Context, така че не е нужно да се грижат за конкретната имплементация.
 * 
 * Важно: Всички операции с постоянни нотификации (създаване, маркиране като прочетено, 
 * изтриване, зареждане) използват RPC функции в базата данни вместо директни SQL заявки.
 * Това осигурява:
 *  - По-добра сигурност чрез централизирана валидация и проверка на правата
 *  - Логика на ниво база данни, която не зависи от клиента
 *  - По-лесна поддръжка и разширяване на функционалността
 * 
 * Използвани RPC функции за нотификации:
 * - create_notification - създава нова нотификация с проверка на настройките
 * - get_user_notifications - зарежда нотификации с пагинация
 * - mark_notifications_as_read - маркира нотификации като прочетени
 * - delete_notification - изтрива нотификация
 * 
 * Правилна употреба на системите за нотификации:
 * - Toast нотификации (showSuccess, showError, showInfo, showWarning):
 *   * Използвайте ги за мимолетна обратна връзка след действия (успех/грешка)
 *   * Например: "Данните са запазени успешно", "Грешка при запазване"
 * 
 * - Постоянни нотификации (createNotification):
 *   * Използвайте ги за важни съобщения, които изискват внимание
 *   * Те остават видими докато потребителят не ги маркира като прочетени
 *   * Например: "Нова заявка за поддръжка", "Предстоящ планов преглед"
 * 
 * - Комбинирани (showToastAndCreateNotification):
 *   * В редки случаи, когато искате и временно съобщение, и постоянен запис
 *   * Например: Критично предупреждение, което е както спешно, така и важно
 * 
 * Защо е необходим този отделен файл:
 * - Разделя логиката: NotificationCenter.tsx се фокусира върху UI компонента за
 *   дропдаун менюто и заявките към базата данни
 * - Този файл осигурява единна точка за управление на всички видове известия
 * - Следва принципа за единична отговорност, като всеки компонент има ясна роля
 * - Позволява лесна промяна на една система без да се засяга другата
 * 
 * В приложението трябва да използвате само този компонент (useNotificationsManager),
 * а не директните методи от NotificationCenter или toast.
 */

// Интерфейси за типовете нотификации
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastNotification {
  message: string;
  type: ToastType;
  duration?: number;
  options?: any;
}

interface PersistentNotification {
  title: string;
  message: string;
  type: 'system' | 'elevator' | 'request' | 'profile';
  link?: string;
  is_important?: boolean;
  elevator_id?: string;
  request_id?: string;
  metadata?: any;
}

interface NotificationsContextType {
  // Toast нотификации (временни)
  showToast: (message: string, type: ToastType, duration?: number, options?: any) => void;
  showSuccess: (message: string, options?: any) => void;
  showError: (message: string, options?: any) => void;
  showInfo: (message: string, options?: any) => void;
  showWarning: (message: string, options?: any) => void;
  dismissAllToasts: () => void;
  
  // Постоянни нотификации (в базата данни)
  createNotification: (notification: PersistentNotification) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  
  // Комбинирана функционалност
  showToastAndCreateNotification: (
    notification: PersistentNotification, 
    toastType?: ToastType
  ) => Promise<void>;
  
  // Достъп до данните за нотификации
  notifications: any[];
  count: number;
  loading: boolean;
  userNotificationSettings: Record<string, boolean>;
}

// Създаване на контекст за нотификациите
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

/**
 * Главен компонент за управление на всички видове нотификации в приложението
 * 
 * Този компонент обединява функционалността за:
 * 1. Toast нотификации (чрез react-toastify) - временни съобщения
 * 2. Постоянни нотификации (от базата данни) - чрез NotificationCenter
 * 
 * Всички компоненти в приложението трябва да използват този контекст за показване на нотификации.
 */
export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Използваме хука за постоянни нотификации от NotificationCenter
  const { 
    notifications, 
    count, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    userNotificationSettings
  } = useNotifications();

  // Функции за Toast нотификации
  const showToast = (message: string, type: ToastType, duration?: number, options?: any) => {
    const toastOptions = {
      autoClose: duration || (type === 'error' ? 5000 : 3000),
      ...options
    };
    
    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'info':
        toast.info(message, toastOptions);
        break;
      case 'warning':
        toast.warning(message, toastOptions);
        break;
      default:
        toast(message, toastOptions);
    }
  };
  
  const showSuccess = (message: string, options?: any) => showToast(message, 'success', undefined, options);
  const showError = (message: string, options?: any) => showToast(message, 'error', undefined, options);
  const showInfo = (message: string, options?: any) => showToast(message, 'info', undefined, options);
  const showWarning = (message: string, options?: any) => showToast(message, 'warning', undefined, options);
  const dismissAllToasts = () => toast.dismiss();
  
  // Функция за създаване на постоянна нотификация в базата данни
  const createNotification = async (notification: PersistentNotification) => {
    if (!user) {
      console.warn('Опит за създаване на нотификация без влязъл потребител');
      return;
    }
    
    // Проверката за настройките на нотификациите е преместена в RPC функцията
    try {
      const { data, error } = await supabase.rpc('create_notification', {
        p_title: notification.title,
        p_message: notification.message,
        p_notification_type: notification.type,
        p_is_important: notification.is_important || false,
        p_link: notification.link,
        p_elevator_id: notification.elevator_id,
        p_request_id: notification.request_id,
        p_metadata: notification.metadata,
        p_related_entity_type: notification.type === 'elevator' ? 'elevator' : 
                            notification.type === 'request' ? 'request' : 
                            notification.type === 'profile' ? 'profile' : null,
        p_related_entity_id: notification.type === 'elevator' ? notification.elevator_id : 
                           notification.type === 'request' ? notification.request_id : 
                           notification.type === 'profile' ? user.id : null
      });
      
      if (error) {
        throw error;
      }
      
      // Ако нотификацията не е създадена, защото типът е изключен в настройките
      if (data && !data.success && data.type_disabled) {
        console.info(`Нотификацията не беше създадена, защото типът ${notification.type} е изключен в настройките`);
        
        // ВАЖНО: Дори ако постоянните нотификации са изключени за този тип,
        // можем да покажем toast съобщение, ако е наистина важно (напр. критична системна грешка)
        // Това е изключение и трябва да се използва само за критични съобщения
        if (notification.is_important) {
          showToast(notification.message, 'warning', 5000);
        }
      }
    } catch (error) {
      console.error('Грешка при създаване на нотификация:', error);
      showError('Грешка при създаване на нотификация');
    }
  };
  
  // Функция за комбинирана нотификация - и toast, и постоянна
  const showToastAndCreateNotification = async (
    notification: PersistentNotification, 
    toastType: ToastType = 'info'
  ) => {
    // Първо показваме toast за незабавна обратна връзка
    showToast(notification.message, toastType);
    
    // След това създаваме постоянно известие в базата
    await createNotification(notification);
  };
  
  // Създаваме обект с всички функции и данни
  const contextValue: NotificationsContextType = {
    // Toast нотификации
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    dismissAllToasts,
    
    // Постоянни нотификации
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    
    // Комбинирана функционалност
    showToastAndCreateNotification,
    
    // Данни
    notifications,
    count,
    loading,
    userNotificationSettings
  };
  
  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
      <NotificationCenter />
    </NotificationsContext.Provider>
  );
};

/**
 * Hook за достъп до функциите за управление на нотификации
 * 
 * Пример за използване:
 * ```
 * const { showSuccess, showError, createNotification } = useNotificationsManager();
 * 
 * // За показване на временна нотификация:
 * showSuccess('Операцията е успешна!');
 * 
 * // За създаване на постоянна нотификация в базата:
 * createNotification({
 *   title: 'Нова заявка',
 *   message: 'Имате нова заявка за обслужване.',
 *   type: 'request',
 *   link: '/requests/123',
 *   is_important: true
 * });
 * ```
 */
export const useNotificationsManager = () => {
  const context = useContext(NotificationsContext);
  
  if (context === undefined) {
    throw new Error('useNotificationsManager трябва да се използва в компонент обвит от NotificationsProvider');
  }
  
  return context;
};

export default NotificationsProvider;
