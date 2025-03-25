import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Tooltip } from 'react-tooltip';
import { toast } from 'react-toastify';

/**
 * Система за постоянни известия с дропдаун меню
 * 
 * ВАЖНО: Този компонент е специализиран само за постоянните известия в дропдаун меню и
 * е напълно отделен от временните toast нотификации в Notifications.tsx.
 * 
 * Архитектура и сигурност:
 * - Всички операции с нотификации използват RPC функции вместо директни SQL заявки
 * - Логиката е централизирана в базата данни за по-добра сигурност и консистентност
 * - Клиентският код само визуализира и взаимодейства с нотификациите
 * 
 * Използвани RPC функции:
 * - get_user_notifications - зарежда нотификации с пагинация и настройки
 * - mark_notifications_as_read - маркира нотификации като прочетени
 * - delete_notification - изтрива нотификация
 * 
 * Защо са необходими два отделни файла:
 * 1. Различна цел и постоянност на данните:
 *    - NotificationCenter (този файл): Управлява постоянни известия, които се съхраняват в 
 *      базата данни и изискват действия от потребителя (маркиране като прочетено, изтриване).
 *      Те се показват в специален дропдаун интерфейс, достъпен от главното меню.
 * 
 *    - Notifications.tsx: Управлява временни toast известия, които се показват автоматично
 *      след определени действия и изчезват сами. Не се съхраняват постоянно и служат
 *      само за моментна обратна връзка.
 * 
 * 2. Различен жизнен цикъл:
 *    - Постоянните известия имат дълъг живот и статус (прочетено/непрочетено)
 *    - Toast известията са краткотрайни и нямат състояние
 * 
 * 3. Различна техническа имплементация:
 *    - Постоянните известия изискват работа с база данни, групиране, пагинация
 *    - Toast известията използват библиотеката react-toastify с прости API извиквания
 * 
 * NotificationsManager.tsx служи като обединител на двете системи, предоставяйки единен
 * интерфейс за другите компоненти в приложението.
 */

// Интерфейси
interface Notification {
  id: string;
  user_id: string;
  type: 'system' | 'elevator' | 'request' | 'profile';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  is_important: boolean;
  created_at: string;
  read_at?: string | null;
  elevator_id?: string;
  request_id?: string;
  metadata?: any;
}

interface NotificationGroup {
  title: string;
  notifications: Notification[];
}

// Добавяме функция за определяне на линк въз основа на типа и ID-то на свързания обект
const determineLink = (entityType?: string, entityId?: string) => {
  if (!entityType || !entityId) return undefined;
  
  switch (entityType) {
    case 'elevator':
      return `/elevators/${entityId}`;
    case 'maintenance':
      return `/maintenance/${entityId}`;
    case 'request':
      return `/requests/${entityId}`;
    case 'profile':
      return `/profile`;
    default:
      return undefined;
  }
};

// Хук за известия
export const useNotifications = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, setSubscribedChannel] = useState<any>(null);
  const [userNotificationSettings, setUserNotificationSettings] = useState<Record<string, boolean>>({
    maintenance_due: true,
    maintenance_completed: true,
    elevator_issue: true,
    new_service_request: true,
    account_updates: true
  });
  
  // Предишна заявка за времето
  const lastRequestTime = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Зарежда известия с подобрен дебаунсинг и кеширане
  const loadNotifications = useCallback(
    async (offset = 0, limit = 20, forceRefresh = false) => {
      if (!user) {
        console.log('Няма влязъл потребител, прескачаме зареждането на известия');
        return;
      }
      
      const now = Date.now();
      const MIN_REQUEST_INTERVAL = 1500; // 1.5 секунди минимално време между заявките
      
      // Проверяваме дали е прекалено скоро след предишната заявка
      if (!forceRefresh && now - lastRequestTime.current < MIN_REQUEST_INTERVAL) {
        console.log('Заявката е отхвърлена - твърде скоро след предишната');
        return;
      }
      
      // Проверяваме дали вече имаме заявка в процес на изпълнение
      if (isLoadingRef.current) {
        console.log('Заявката е отхвърлена - предишна заявка все още се изпълнява');
        return;
      }
      
      try {
        setLoading(true);
        isLoadingRef.current = true;
        lastRequestTime.current = now;
        
        console.log(`Зареждане на известия: offset=${offset}, limit=${limit}, forceRefresh=${forceRefresh}`);
        
        // Запазваме старите известия при пагинация, в противен случай започваме начисто
        if (offset > 0 && !forceRefresh) {
          // При пагинация запазваме старите известия
          setNotifications(prev => [...prev]);
        } else {
          // При първоначално зареждане или принудително опресняване изчистваме
          setNotifications([]);
        }
        
        // Изпълняваме RPC функцията с параметри за пагинация
        const { data, error } = await supabase.rpc('get_user_notifications', {
          page_size: limit,
          page_num: offset,
        });
        
        console.log('RPC get_user_notifications отговор:', data);
        
        if (error) {
          console.error('Supabase RPC грешка:', error);
          throw error;
        }
        
        // Проверяваме дали операцията е успешна
        if (!data || !data.success) {
          console.error('Неуспешна операция:', data);
          throw new Error(data?.message || 'Грешка при зареждане на известия');
        }
        
        console.log(`Получени ${data.notifications?.length || 0} известия от базата данни`);
        
        // Трансформираме данните, за да съответстват на интерфейса Notification
        const transformedNotifications: Notification[] = (data.notifications || []).map((note: any) => ({
          id: note.id,
          user_id: note.user_id,
          type: note.notification_type || 'system',
          title: note.title,
          message: note.message,
          link: determineLink(note.related_entity_type, note.related_entity_id),
          is_read: note.is_read || false,
          is_important: note.is_important || note.notification_type === 'system',
          created_at: note.created_at,
          read_at: note.read_at,
          elevator_id: note.elevator_id,
          request_id: note.request_id,
          metadata: note.metadata
        }));
        
        if (offset > 0 && !forceRefresh) {
          // При пагинация добавяме новите известия към края на списъка
          setNotifications(prev => {
            // Премахваме дубликати
            const uniqueNotifications = [...prev];
            
            transformedNotifications.forEach(newNote => {
              if (!uniqueNotifications.some(note => note.id === newNote.id)) {
                uniqueNotifications.push(newNote);
              }
            });
            
            return uniqueNotifications;
          });
        } else {
          // При първоначално зареждане или принудително опресняване заместваме целия списък
          setNotifications(transformedNotifications);
        }
        
        // Обновяваме брояча непрочетени известия директно от резултата
        setCount(data.unread_count || 0);
        
        // Задаваме настройките за известия, ако са върнати
        if (data.user_settings) {
          setUserNotificationSettings(data.user_settings);
        }
      } catch (error) {
        console.error('Грешка при зареждане на известия:', error);
        // Показваме конкретната грешка на потребителя
        const errorMessage = error instanceof Error ? error.message : 'Неизвестна грешка';
        setError(`Грешка при зареждане на известия: ${errorMessage}`);
        toast.error(`Грешка при зареждане на известия: ${errorMessage}`);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    },
    [user, supabase]
  );
  
  // Маркира известие като прочетено с оптимистично UI обновяване
  const markAsRead = useCallback(
    async (id: string) => {
      if (!user) return;
      
      // Намираме известието, което ще маркираме
      const notification = notifications.find(note => note.id === id);
      if (!notification || notification.is_read) return; // Не прави нищо ако вече е прочетено
      
      // Оптимистично обновяване на UI
      setNotifications(prev => 
        prev.map(note => 
          note.id === id 
            ? { ...note, is_read: true, read_at: new Date().toISOString() } 
            : note
        )
      );
      
      // Намаляваме брояча непрочетени известия
      setCount(prev => Math.max(0, prev - 1));
      
      try {
        const { data, error } = await supabase.rpc('mark_notifications_as_read', { 
          notification_ids: [id] 
        });
        
        if (error) throw error;
        
        // Проверяваме успешно ли е маркирана нотификацията
        if (!data || !data.success) {
          throw new Error(data?.message || 'Неуспешно маркиране на известието като прочетено');
        }
        
        // Не правим нищо при успех - вече обновихме UI оптимистично
        
      } catch (error) {
        console.error('Грешка при маркиране на известието като прочетено:', error);
        
        // Връщаме оригиналното състояние
        setNotifications(prev => 
          prev.map(note => 
            note.id === id 
              ? { ...note, is_read: false, read_at: null } 
              : note
          )
        );
        
        // Увеличаваме брояча обратно
        setCount(prev => prev + 1);
        
        // ЗАБЕЛЕЖКА: Това е изключение от правилото да не смесваме системите
        // Тук използваме toast само за известяване за грешка при операцията
        toast.error('Грешка при маркиране на известието като прочетено');
      }
    },
    [user, notifications, supabase]
  );
  
  // Маркира всички известия като прочетени с оптимистично UI обновяване
  const markAllAsRead = useCallback(
    async () => {
      if (!user) return;
      
      // Броим непрочетените известия преди операцията
      const unreadCount = notifications.filter(note => !note.is_read).length;
      if (unreadCount === 0) return; // Не прави нищо ако няма непрочетени
      
      // Вземаме ID-тата на всички непрочетени известия
      const unreadIds = notifications
        .filter(note => !note.is_read)
        .map(note => note.id);
      
      // Оптимистично обновяване на UI
      setNotifications(prev => 
        prev.map(note => 
          note.is_read 
            ? note 
            : { ...note, is_read: true, read_at: new Date().toISOString() }
        )
      );
      
      // Нулираме брояча непрочетени известия
      setCount(0);
      
      try {
        const { data, error } = await supabase.rpc('mark_notifications_as_read', {
          notification_ids: unreadIds
        });
        
        if (error) throw error;
        
        // Проверяваме успешно ли са маркирани нотификациите
        if (!data || !data.success) {
          throw new Error(data?.message || 'Неуспешно маркиране на всички известия като прочетени');
        }
        
        // Не правим нищо при успех - вече обновихме UI оптимистично
        
      } catch (error) {
        console.error('Грешка при маркиране на всички известия като прочетени:', error);
        
        // Връщаме оригиналното състояние и презареждаме известията
        loadNotifications(0, 20, true);
        
        // ЗАБЕЛЕЖКА: Това е изключение от правилото да не смесваме системите
        // Тук използваме toast само за известяване за грешка при операцията
        toast.error('Грешка при маркиране на всички известия като прочетени');
      }
    },
    [user, notifications, supabase, loadNotifications]
  );
  
  // Опресняваме известията когато табът получи фокус
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications(0, 20, true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadNotifications]);
  
  // Зареждане на настройките за известия от потребителския профил
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('notification_settings')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Грешка при зареждане на настройки за известия:', error);
          return;
        }
        
        if (data?.notification_settings) {
          setUserNotificationSettings(data.notification_settings);
        }
      } catch (error) {
        console.error('Грешка при зареждане на настройки за известия:', error);
      }
    };
    
    loadUserSettings();
  }, [user]);
  
  // Добавяме стратегия за опресняване при смяна на таба/връщане на страницата
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Опресняваме известията когато табът стане видим
        setTimeout(() => loadNotifications(0, 20), 100);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadNotifications]);
  
  // Изтриване на известие с оптимистично UI обновяване
  const deleteNotification = async (id: string) => {
    if (!user) return;
    
    // Запазваме оригиналното известие за възстановяване при грешка
    const originalNotification = notifications.find(note => note.id === id);
    const wasUnread = originalNotification?.is_read === false;
    
    // Оптимистично изтриване от UI
    setNotifications(prev => prev.filter(note => note.id !== id));
    
    // Актуализиране на брояча, ако известието е било непрочетено
    if (wasUnread) {
      setCount(prev => Math.max(0, prev - 1));
    }
    
    try {
      const { data, error } = await supabase.rpc('delete_notification', { 
        notification_id: id 
      });
      
      if (error) throw error;
      
      // Проверяваме успешно ли е изтрита нотификацията
      if (!data || !data.success) {
        throw new Error(data?.message || 'Неуспешно изтриване на известието');
      }
      
      // Не правим нищо при успех - вече обновихме UI оптимистично
      
    } catch (error) {
      console.error('Грешка при изтриване на известието:', error);
      
      // Връщаме известието обратно при грешка (ако имаме копие)
      if (originalNotification) {
        setNotifications(prev => [...prev, originalNotification]);
        
        // Връщаме брояча, ако известието е било непрочетено
        if (wasUnread) {
          setCount(prev => prev + 1);
        }
      }
      
      // ЗАБЕЛЕЖКА: Това е изключение от правилото да не смесваме системите
      // Тук използваме toast само за известяване за грешка при операцията
      toast.error('Грешка при изтриване на известието');
    }
  };
  
  // При получаване на ново известие, проверяваме дали потребителят е настроил да получава този тип известия
  useEffect(() => {
    if (!user) return;
    
    // Абонираме се за нови известия
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as any;
          
          // Трансформираме данните, за да съответстват на интерфейса Notification
          const transformedNotification: Notification = {
            id: newNotification.id,
            user_id: newNotification.user_id,
            type: newNotification.notification_type || 'system',
            title: newNotification.title,
            message: newNotification.message,
            link: determineLink(newNotification.related_entity_type, newNotification.related_entity_id),
            is_read: newNotification.is_read || false,
            is_important: newNotification.notification_type === 'system',
            created_at: newNotification.created_at,
            read_at: newNotification.read_at,
            elevator_id: newNotification.elevator_id,
            request_id: newNotification.request_id,
            metadata: newNotification.metadata
          };
          
          console.log('Получено ново известие в реално време:', transformedNotification);
          
          // Добавяме новото известие в началото на списъка с известия
          setNotifications(prev => {
            // Проверяваме дали известието вече не е в списъка
            const exists = prev.some(n => n.id === transformedNotification.id);
            if (exists) return prev;
            
            return [transformedNotification, ...prev];
          });
          
          // Увеличаваме брояча непрочетени известия
          if (!transformedNotification.is_read) {
            setCount(prev => prev + 1);
          }
          
          // Показваме toast нотификация за новото известие
          if (transformedNotification.is_important) {
            toast.info(`🔔 ${transformedNotification.title}: ${transformedNotification.message}`);
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as any;
          
          console.log('Обновено известие в реално време:', updatedNotification);
          
          // Обновяваме известието в списъка
          setNotifications(prev => 
            prev.map(note => 
              note.id === updatedNotification.id 
                ? { 
                    ...note, 
                    is_read: updatedNotification.is_read,
                    read_at: updatedNotification.read_at
                  } 
                : note
            )
          );
          
          // Актуализираме брояча ако статусът прочетено/непрочетено е променен
          if (updatedNotification.is_read) {
            const wasUnread = notifications.find(n => n.id === updatedNotification.id)?.is_read === false;
            if (wasUnread) {
              setCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedId = payload.old.id;
          
          console.log('Изтрито известие в реално време:', deletedId);
          
          // Изтриваме известието от списъка
          const wasUnread = notifications.find(n => n.id === deletedId)?.is_read === false;
          setNotifications(prev => prev.filter(note => note.id !== deletedId));
          
          // Актуализираме брояча ако известието е било непрочетено
          if (wasUnread) {
            setCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();
    
    setSubscribedChannel(channel);
    
    // Автоматично опресняване на известията всеки 5 минути, ако табът е активен
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadNotifications(0, 20, true);
      }
    }, 5 * 60 * 1000); // 5 минути
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(refreshInterval);
    };
  }, [user?.id, loadNotifications, notifications]);
  
  // Връщаме обект с всички функции и данни
  return {
    notifications,
    count,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    userNotificationSettings,
    error
  };
};

// Компонент за икона на известие
const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
  let icon;

  switch (type) {
    case 'system':
      icon = (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      break;
    case 'elevator':
      icon = (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
      break;
    case 'request':
      icon = (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
      break;
    case 'profile':
      icon = (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
      break;
    default:
      icon = (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }

  return (
    <div className={`flex-shrink-0 p-2 rounded-full ${getTypeColor(type)}`}>
      {icon}
    </div>
  );
};

// Помощна функция за определяне на цвета според типа известие
const getTypeColor = (type: string) => {
  switch (type) {
    case 'system':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
    case 'elevator':
      return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300';
    case 'request':
      return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
    case 'profile':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
  }
};

// Помощни функции за работа с дати
const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
};

// Форматиране на дата
const formatNotificationDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return `Днес, ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
  } else if (isYesterday(date)) {
    return `Вчера, ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
  } else {
    // Изчисляване на разликата във времето
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `Преди ${diffDays} ${diffDays === 1 ? 'ден' : 'дни'}`;
    } else {
      const monthNames = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 
                         'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];
      return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
  }
};

// Помощна функция за добавяне на водеща нула
const padZero = (num: number): string => num < 10 ? `0${num}` : `${num}`;

// Функция за групиране на известия по дата
const groupNotificationsByDate = (notifications: Notification[]): NotificationGroup[] => {
  // Подготвяме празните групи
  const groups: NotificationGroup[] = [
    { title: 'Днес', notifications: [] },
    { title: 'Вчера', notifications: [] },
    { title: 'Тази седмица', notifications: [] },
    { title: 'По-стари', notifications: [] }
  ];
  
  // Текуща дата за сравнение
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  
  // Групиране на известията
  notifications.forEach(notification => {
    const date = new Date(notification.created_at);
    
    if (isToday(date)) {
      groups[0].notifications.push(notification);
    } else if (isYesterday(date)) {
      groups[1].notifications.push(notification);
    } else if (date >= oneWeekAgo) {
      groups[2].notifications.push(notification);
    } else {
      groups[3].notifications.push(notification);
    }
  });
  
  // Филтриране на празните групи
  return groups.filter(group => group.notifications.length > 0);
};

// Компонент за единично известие
const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ notification, onMarkAsRead, onDelete }) => {
  
  // Спираме разпространение на събитието, за да не затваряме панела
  const handleActionClick = (event: React.MouseEvent, action: () => void) => {
    event.stopPropagation();
    action();
  };
  
  return (
    <div 
      className={`relative flex items-start py-1.5 px-1 ${
        !notification.is_read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div 
        className="flex-shrink-0 pt-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <NotificationIcon type={notification.type} />
      </div>
      
      <div 
        className="ml-2 flex-1"
      >
        <div 
          className="flex justify-between items-start"
          onClick={(e) => e.stopPropagation()}
        >
          <p 
            className={`text-xs font-medium truncate ${
              !notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {notification.title}
            {notification.is_important && (
              <span 
                className="ml-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs px-1 py-0.5 rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                Важно
              </span>
            )}
          </p>
          
          <div 
            className="flex space-x-1"
            onClick={(e) => e.stopPropagation()}
          >
            {!notification.is_read && (
              <button
                onClick={(e) => handleActionClick(e, () => onMarkAsRead(notification.id))}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Маркирай като прочетено"
              >
                <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            
            <button
              onClick={(e) => handleActionClick(e, () => onDelete(notification.id))}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Изтрий"
            >
              <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <p 
          className={`mt-0.5 text-xs line-clamp-2 ${
            !notification.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {notification.message}
        </p>
        
        <p 
          className="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
          onClick={(e) => e.stopPropagation()}
        >
          {formatNotificationDate(notification.created_at)}
        </p>
      </div>
    </div>
  );
};

// Променяме бутона за известия и неговата логика
export const NotificationButton: React.FC = () => {
  const { count, loadNotifications, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef<boolean>(false);
  
  const handleClosePanel = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  // Ефект, който ще презарежда известията при отваряне на панела
  useEffect(() => {
    if (isOpen && !wasOpenRef.current && !loading) {
      // Презареждаме известията само при отваряне на панела, не при всяка промяна
      loadNotifications(0);
      wasOpenRef.current = true;
    } else if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen, loadNotifications, loading]);
  
  useEffect(() => {
    if (isOpen) {
      // Добавяме малко закъснение преди да добавим слушателя
      const timeoutId = setTimeout(() => {
        const handleClickOutside = (event: MouseEvent) => {
          // Проверяваме дали е затворено междувременно
          if (!isOpen) return;
          
          // Проверяваме дали кликът е върху бутона или панела
          const isClickInsideButton = buttonRef.current && buttonRef.current.contains(event.target as Node);
          const isClickInsidePanel = panelRef.current && panelRef.current.contains(event.target as Node);
          
          // Затваряме панела само ако кликът е извън бутона И извън панела
          if (!isClickInsideButton && !isClickInsidePanel) {
            handleClosePanel();
          }
        };
        
        // Важно: добавяме към body, не към document
        document.body.addEventListener('click', handleClickOutside);
        
        return () => {
          document.body.removeEventListener('click', handleClickOutside);
        };
      }, 100); // Малко забавяне за да не се задейства веднага
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isOpen, handleClosePanel]);
  
  const handleButtonClick = (e: React.MouseEvent) => {
    // Спираме разпространението на събитието
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        id="notifications-btn"
        className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
        data-tooltip-content="Известия"
        data-tooltip-place="bottom"
        onClick={handleButtonClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        )}
      </button>
      
      {!isOpen && (
        <Tooltip
          anchorSelect="#notifications-btn"
          className="tooltip-custom"
          place="bottom"
          positionStrategy="fixed"
          style={{ zIndex: 9999 }}
        />
      )}
      
      {isOpen && <NotificationPanel ref={panelRef} onClose={handleClosePanel} />}
    </div>
  );
};

// Променяме NotificationPanel да приема ref
type NotificationPanelProps = {
  onClose: () => void;
};

export const NotificationPanel = React.forwardRef<HTMLDivElement, NotificationPanelProps>(
  ({ onClose }, ref) => {
    const { notifications, loading, loadNotifications, markAsRead, deleteNotification, error } = useNotifications();
    
    const [currentTab, setCurrentTab] = useState<'all' | 'unread' | 'important'>('all');
    const [currentPage, setCurrentPage] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Презареждане при всяко отваряне на панела
    useEffect(() => {
      // Нулираме страницата и зареждаме известията отново
      setCurrentPage(0);
      loadNotifications(0);
    }, [loadNotifications]);

    const loadMore = useCallback(() => {
      const nextPage = currentPage + 1;
      loadNotifications(nextPage);
      setCurrentPage(nextPage);
    }, [currentPage, loadNotifications]);

    // Добавям useMemo за филтрираните известия
    const filteredNotifications = useMemo(() => {
      return notifications.filter(notification => {
        if (currentTab === 'unread') return !notification.is_read;
        if (currentTab === 'important') return notification.is_important;
        return true; // 'all' tab
      });
    }, [notifications, currentTab]);

    // useMemo за групираните известия
    const groupedNotifications = useMemo(() => {
      return groupNotificationsByDate(filteredNotifications);
    }, [filteredNotifications]);

    // Логика за превенция на безкрайни рендери при промяна на таб
    const handleTabClick = useCallback((e: React.MouseEvent, tab: 'all' | 'unread' | 'important') => {
      e.preventDefault();
      e.stopPropagation();
      
      if (tab !== currentTab) {
        setCurrentTab(tab);
      }
    }, [currentTab]);

    // Функция за обработка на клик върху известие
    const handleNotificationSelection = useCallback((notification: Notification) => {
      // Маркираме като прочетено
      if (!notification.is_read) {
        markAsRead(notification.id);
      }
      
      // Ако има линк в известието, преминаваме към него и затваряме панела
      if (notification.link) {
        navigate(notification.link);
        onClose(); 
      }
    }, [markAsRead, navigate, onClose]);

    // Логика за скрол
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      if (loading) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        loadMore();
      }
    }, [loading, loadMore]);

    return (
      <div className="fixed inset-0 z-50" onClick={(e) => {
        // Спираме разпространението, за да не затваряме панела веднага
        e.stopPropagation();
      }}>
        <div 
          ref={ref}
          className="absolute right-0 top-[3.4rem] sm:right-2 sm:w-80 w-full max-h-[80vh] bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          onClick={(e) => {
            // Спираме разпространението за да не затваряме панела при клик в него
            e.stopPropagation();
          }}
        >
          <div className="flex items-center justify-between p-2.5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold flex items-center text-gray-900 dark:text-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              Известия
            </h2>
            <button 
              onClick={(e) => {
                // Спираме разпространението
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`flex-1 px-2 py-1.5 text-xs font-medium ${
                currentTab === 'all'
                  ? 'text-primary-500 border-b-2 border-primary-500 dark:text-primary-400 dark:border-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={(e) => handleTabClick(e, 'all')}
            >
              Всички
            </button>
            <button
              className={`flex-1 px-2 py-1.5 text-xs font-medium ${
                currentTab === 'unread'
                  ? 'text-primary-500 border-b-2 border-primary-500 dark:text-primary-400 dark:border-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={(e) => handleTabClick(e, 'unread')}
            >
              Непрочетени
            </button>
            <button
              className={`flex-1 px-2 py-1.5 text-xs font-medium ${
                currentTab === 'important'
                  ? 'text-primary-500 border-b-2 border-primary-500 dark:text-primary-400 dark:border-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={(e) => handleTabClick(e, 'important')}
            >
              Важни
            </button>
          </div>

          <div 
            className="flex-1 overflow-y-auto px-1.5 py-1.5 max-h-[400px]"
            ref={containerRef}
            onScroll={handleScroll}
          >
            {loading && currentPage === 0 && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500 mb-2"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Зареждане на известия...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                  {error}
                </p>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    loadNotifications(0, 20, true);
                  }}
                  className="text-xs px-3 py-1 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
                >
                  Опитай отново
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500 dark:text-gray-400 p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm font-medium">
                  {notifications.length === 0 
                    ? (currentTab === 'all' 
                      ? 'Няма известия' 
                      : currentTab === 'unread' 
                      ? 'Няма непрочетени известия' 
                      : 'Няма важни известия')
                    : 'Няма известия, отговарящи на текущия филтър'}
                </p>
              </div>
            ) : (
              groupedNotifications.map((group, index) => (
                <div key={index} className="mb-2">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-1">{group.title}</h3>
                  <div className="space-y-1">
                    {group.notifications.map(notification => (
                      <div 
                        key={notification.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleNotificationSelection(notification);
                        }}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 relative"
                      >
                        <NotificationItem 
                          notification={notification} 
                          onMarkAsRead={(id) => {
                            markAsRead(id);
                          }} 
                          onDelete={(id) => {
                            deleteNotification(id);
                          }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {loading && currentPage > 0 && (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate('/notifications');
                onClose();
              }}
              className="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Виж всички известия
            </button>
          </div>
        </div>
      </div>
    );
  }
);

// Основен компонент
const NotificationCenter: React.FC = () => {
  // Не връщаме NotificationButton тук, защото ще го използваме директно
  return null;
};

export default NotificationCenter; 