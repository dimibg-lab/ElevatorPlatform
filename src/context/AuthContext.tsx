import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { toast } from 'react-toastify'

// Дефиниция на типа за профилни данни
type ProfileData = {
  id: string
  full_name?: string
  company_name?: string
  phone?: string
  role?: 'company' | 'technician' | 'building_manager' | 'admin' | 'company_admin'
  created_at?: string
  updated_at?: string
  avatar_url?: string
  company_address?: string
  additional_info?: string
  specialization?: string
  experience?: string
  building_address?: string
  apartments_count?: string
  building_info?: string
  company_id?: string
}

// Разширяване на типа User със свойство за профилни данни
export type UserWithProfile = User & {
  profile?: ProfileData | null
}

// Дефиниция на типа за контекста за автентикация
type AuthContextType = {
  session: Session | null
  user: UserWithProfile | null
  loading: boolean
  error: Error | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null; data: Session | null }>
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<{ error: Error | null; data: Session | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null; data: {} | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null; data: {} | null }>
  refreshSession: () => Promise<void>
  getSession: () => Promise<Session | null>
}

// Константи за управление на сесията
const SESSION_EXPIRY_MARGIN = 60 * 1000; // 1 минута в милисекунди - безопасен интервал за опресняване преди изтичане
const LOCAL_STORAGE_KEYS = {
  SESSION: 'elevator-platform-auth', // Съвпада с предишния ключ на Supabase
  CURRENT_USER: 'elevator-platform-auth-user' // Съответен ключ за потребителски данни
};

// Създаване на контекста с подразбиращи се стойности
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  error: null,
  signIn: async () => ({ error: null, data: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null, data: null }),
  updatePassword: async () => ({ error: null, data: null }),
  refreshSession: async () => {},
  getSession: async () => null
})

// Hook за използване на контекста за автентикация
export const useAuth = () => useContext(AuthContext)

// Помощна функция за извличане на профилни данни
const fetchProfileData = async (userId: string): Promise<ProfileData | null> => {
  try {
    // Използваме директно RPC извикване, което избягва проблемите с RLS рекурсията
    const { data, error } = await supabase.rpc('get_profile_by_id', { user_id: userId })
      
    if (error) {
      console.error('Грешка при извличане на профил:', error)
      return null
    }
      
    if (data) {
      console.log('Профилни данни успешно извлечени')
      return data as ProfileData
    } else {
      console.warn('Не са намерени профилни данни за потребител:', userId)
      return null
    }
  } catch (error) {
    console.error('Грешка при извличане на профилни данни:', error)
    return null
  }
}

// Запазване на сесията в localStorage
const persistSession = (session: Session | null, user: UserWithProfile | null) => {
  try {
    if (session) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION, JSON.stringify(session))
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION)
    }
    
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENT_USER)
    }
  } catch (e) {
    console.error('Грешка при запазване на сесията в localStorage:', e)
  }
}

// Получаване на сесията от localStorage
const getPersistedSession = (): { session: Session | null, user: UserWithProfile | null } => {
  try {
    const sessionStr = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION)
    const userStr = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER)
    
    // Проверка за стара сесия (когато сме използвали supabase вграден механизъм)
    const oldSessionStr = localStorage.getItem('supabase.auth.token')
    if (!sessionStr && oldSessionStr) {
      try {
        // Опитваме да мигрираме старата сесия към новия формат
        console.log('Мигриране на сесия от стар формат...')
        const oldSession = JSON.parse(oldSessionStr)
        if (oldSession?.currentSession) {
          // Запазваме сесията в новия формат
          localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION, JSON.stringify(oldSession.currentSession))
          return {
            session: oldSession.currentSession,
            user: null // Потребителските данни ще се заредят по-късно
          }
        }
      } catch (e) {
        console.error('Грешка при миграция на стара сесия:', e)
      }
    }
    
    return {
      session: sessionStr ? JSON.parse(sessionStr) : null,
      user: userStr ? JSON.parse(userStr) : null
    }
  } catch (e) {
    console.error('Грешка при получаване на сесията от localStorage:', e)
    return { session: null, user: null }
  }
}

// Изтичане на JWT токена
const getTokenExpiryTime = (session: Session | null): number | null => {
  if (!session?.expires_at) return null
  
  // expires_at е в секунди, преобразуваме в милисекунди
  return session.expires_at * 1000
}

// Проверка дали токенът е близо до изтичане
const isTokenExpiringSoon = (session: Session | null): boolean => {
  const expiryTime = getTokenExpiryTime(session)
  if (!expiryTime) return false
  
  // Проверка дали токенът ще изтече в рамките на безопасния интервал
  return Date.now() + SESSION_EXPIRY_MARGIN > expiryTime
}

// Помощна функция за бамортизиране (debounce) на функции
const debounce = <F extends (...args: any[]) => any>(func: F, wait: number): F => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
  
  return debounced as F;
};

// AuthProvider компонент
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<UserWithProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Флагове за контрол
  const [isMounted, setIsMounted] = useState(true)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  
  // Референция за таймера за опресняване на сесията
  const refreshTimerRef = useRef<number | null>(null)
  
  // Добавяме променлива за следене на фокус/видимост на таба
  const [isTabVisible, setIsTabVisible] = useState(
    typeof document !== 'undefined' ? !document.hidden : true
  );

  // Добавяме променлива за следене на последния известен sessionId
  const [lastKnownSessionId, setLastKnownSessionId] = useState<string | null>(null);
  
  // Планирайте опресняване на сесията преди изтичане
  const scheduleSessionRefresh = (currentSession: Session | null) => {
    // Изчистете съществуващия таймер
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
    
    if (!currentSession) return
    
    const expiryTime = getTokenExpiryTime(currentSession)
    if (!expiryTime) return
    
    // Колко време остава до изтичането в милисекунди
    const timeToExpiry = expiryTime - Date.now()
    
    // Планирайте опресняване малко преди изтичане
    const refreshTime = Math.max(timeToExpiry - SESSION_EXPIRY_MARGIN, 0)
    
    // Задайте таймер за опресняване на сесията
    console.log(`Планирано опресняване на сесията след ${refreshTime / 1000} секунди`)
    refreshTimerRef.current = window.setTimeout(refreshSession, refreshTime)
  }
  
  // Функция за обработка на промени във видимостта на таба
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isNowVisible = !document.hidden;
      console.log('AuthContext: Промяна на видимостта', { 
        wasVisible: isTabVisible, 
        isNowVisible, 
        timestamp: new Date().toISOString(),
        sessionId: session?.access_token?.slice(-10) || 'няма'
      });
      
      setIsTabVisible(isNowVisible);
      
      // Ако табът е станал видим, проверяваме състоянието на сесията
      if (isNowVisible) {
        console.log('AuthContext: Табът е станал видим, проверка на сесията');
        // Проверяваме сесията, когато табът стане видим
        getSession().then(currentSession => {
          if (currentSession) {
            console.log('AuthContext: Налична сесия след видимост', {
              sessionId: currentSession.access_token?.slice(-10) || 'непълна',
              expiresAt: currentSession.expires_at ? new Date(currentSession.expires_at * 1000).toISOString() : 'неизвестно'
            });
            
            // Ако имаме запазена последна известна сесия, проверяваме дали е различна
            if (lastKnownSessionId && currentSession.access_token && 
                lastKnownSessionId !== currentSession.access_token) {
              console.log('AuthContext: Открита разлика в сесията след връщане на видимост', {
                oldSession: lastKnownSessionId.slice(-10),
                newSession: currentSession.access_token.slice(-10)
              });
              
              // Обновяваме потребителя и профила
              checkAuth();
            }
          } else {
            console.log('AuthContext: Няма сесия след връщане на видимост');
          }
        }).catch(err => {
          console.error('AuthContext: Грешка при проверка на сесията след видимост', err);
        });
      }
    };
    
    // Бамортизирана версия на обработчика за предотвратяване на многократни извиквания
    const debouncedVisibilityHandler = debounce(handleVisibilityChange, 300);

    // Добавяме слушател за промени във видимостта
    document.addEventListener('visibilitychange', debouncedVisibilityHandler);

    // Почистваме при размонтиране
    return () => {
      document.removeEventListener('visibilitychange', debouncedVisibilityHandler);
    };
  }, []);
  
  // Функция за вход в системата
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setError(error)
        return { error, data: null }
      }
      
      // Запазване на сесията в localStorage
      if (data.session) {
        setSession(data.session)
        
        // Извлечете профилните данни и актуализирайте потребителя
        if (data.session.user) {
          const profileData = await fetchProfileData(data.session.user.id)
          const userWithProfile = { ...data.session.user, profile: profileData }
          setUser(userWithProfile)
          persistSession(data.session, userWithProfile)
        }
        
        // Планирайте опресняване на сесията
        scheduleSessionRefresh(data.session)
      }
      
      return { error: null, data: data.session }
    } catch (err: any) {
      setError(err)
      return { error: err, data: null }
    }
  }
  
  // Функция за регистрация
  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      
      if (error) {
        setError(error)
        return { error, data: null }
      }
      
      return { error: null, data: data.session }
    } catch (err: any) {
      setError(err)
      return { error: err, data: null }
    }
  }
  
  // Функция за изход от системата
  const signOut = async () => {
    try {
      // Изчистете таймера за опресняване
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      persistSession(null, null)
    } catch (err: any) {
      setError(err)
      toast.error('Грешка при излизане от системата')
    }
  }
  
  // Функция за възстановяване на парола
  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) {
        setError(error)
        return { error, data: null }
      }
      
      return { error: null, data: data }
    } catch (err: any) {
      setError(err)
      return { error: err, data: null }
    }
  }
  
  // Функция за актуализиране на парола
  const updatePassword = async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        setError(error)
        return { error, data: null }
      }
      
      return { error: null, data: data }
    } catch (err: any) {
      setError(err)
      return { error: err, data: null }
    }
  }
  
  // Функция за обновяване на сесията
  const refreshSession = async () => {
    try {
      console.log('AuthContext: Опит за опресняване на сесията', {
        hasCurrentSession: !!session,
        sessionId: session?.access_token?.slice(-10) || 'няма',
        timestamp: new Date().toISOString()
      });
      
      // Проверяваме дали имаме текуща сесия
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (!currentSession) {
        console.log('Няма активна сесия за опресняване')
        if (isMounted) {
          setSession(null)
          setUser(null)
          persistSession(null, null)
        }
        return
      }
      
      // Използваме refreshSession метода от Supabase
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Грешка при опресняване на сесията:', error)
        // При грешка правим нова проверка на автентикацията
        checkAuth()
        return
      }
      
      const { session: refreshedSession } = data
      
      if (refreshedSession) {
        console.log('Сесията е успешно опреснена')
        
        if (isMounted) {
          // Извличаме профилните данни отново
          const profileData = await fetchProfileData(refreshedSession.user.id)
          const userWithProfile = { ...refreshedSession.user, profile: profileData }
          
          // Актуализираме състоянието
          setSession(refreshedSession)
          setUser(userWithProfile)
          
          // Запазваме опреснената сесия в localStorage
          persistSession(refreshedSession, userWithProfile)
          
          // Запазваме последния известен идентификатор на сесията
          if (currentSession?.access_token) {
            setLastKnownSessionId(currentSession.access_token);
            console.log('AuthContext: Запазен нов идентификатор на сесията', {
              sessionId: currentSession.access_token.slice(-10),
              timestamp: new Date().toISOString()
            });
          }
          
          // Планирайте следващото опресняване
          scheduleSessionRefresh(refreshedSession)
        }
      } else {
        console.log('Неуспешно опресняване на сесията')
        if (isMounted) {
          setSession(null)
          setUser(null)
          persistSession(null, null)
        }
      }
    } catch (err: any) {
      console.error('AuthContext: Грешка при обновяване на сесията:', err)
      if (isMounted) setError(err)
      
      // При неочаквана грешка правим пълна проверка на автентикацията
      checkAuth()
    }
  }
  
  // Функция за извличане на текущата сесия
  const getSession = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      
      // Ако сесията скоро ще изтече, опреснете я
      if (data.session && isTokenExpiringSoon(data.session)) {
        await refreshSession()
        return session
      }
      
      return data.session
    } catch (err) {
      console.error('Грешка при извличане на сесията:', err)
      return null
    }
  }
  
  // Функция за проверка на автентикацията
  const checkAuth = async () => {
    // Ако компонентът не е монтиран, не правим нищо
    if (!isMounted) {
      console.log('AuthContext: checkAuth прекратен - компонентът не е монтиран');
      return;
    }
    
    console.log('AuthContext: Започване на проверка на автентикацията', {
      timestamp: new Date().toISOString(),
      hasSession: !!session,
      isVisible: isTabVisible,
      sessionId: session?.access_token?.slice(-10) || 'няма'
    });
    
    try {
      // Променяме състоянието на зареждане само ако компонентът е активен
      if (isMounted) {
        setLoading(true)
      }
      
      // Извлича сесията директно от Supabase
      const { data, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Грешка при извличане на сесията:', sessionError)
        if (isMounted) setError(sessionError)
        setLoading(false)
        return
      }
      
      // Използваме let вместо const, за да можем да променяме стойността
      let currentSession = data.session
      
      // Ако няма сесия, изчистваме състоянието
      if (!currentSession) {
        console.log('Няма активна сесия')
        if (isMounted) {
          setSession(null)
          setUser(null)
          persistSession(null, null)
          setLoading(false)
        }
        return
      }
      
      // Записваме ID-то на текущата сесия, за да избегнем дублирани обработки
      setCurrentSessionId(currentSession.user.id)
      
      // Ако имаме сесия, проверяваме дали е валидна и изтичаща скоро
      if (isTokenExpiringSoon(currentSession)) {
        console.log('Сесията изтича скоро, опресняване...')
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error('Грешка при опресняване на сесия:', refreshError)
          if (isMounted) setError(refreshError)
          setLoading(false)
          return
        }
        
        if (!refreshedSession) {
          console.log('Невалидна сесия след опресняване')
          if (isMounted) {
            setSession(null)
            setUser(null)
            persistSession(null, null)
            setLoading(false)
          }
          return
        }
        
        // Използваме опреснената сесия
        currentSession = refreshedSession
      }
      
      // Извличаме профилните данни
      const profileData = await fetchProfileData(currentSession.user.id)
      const userWithProfile = { ...currentSession.user, profile: profileData }
      
      // Актуализираме състоянието
      if (isMounted) {
        setSession(currentSession)
        setUser(userWithProfile)
        
        // Запазваме сесията в localStorage
        persistSession(currentSession, userWithProfile)
        
        // Запазваме последния известен идентификатор на сесията
        if (currentSession?.access_token) {
          setLastKnownSessionId(currentSession.access_token);
          console.log('AuthContext: Запазен нов идентификатор на сесията', {
            sessionId: currentSession.access_token.slice(-10),
            timestamp: new Date().toISOString()
          });
        }
        
        // Планирайте опресняване на сесията
        scheduleSessionRefresh(currentSession)
      }
    } catch (error: any) {
      console.error('AuthContext: Грешка при проверка на автентикацията:', error)
      if (isMounted) setError(error)
    } finally {
      // Премахваме индикатора за зареждане само ако компонентът е активен
      if (isMounted) {
        setLoading(false)
      }
    }
  }
  
  // Слушател за автентикационни събития
  useEffect(() => {
    // Първоначална проверка на автентикацията
    checkAuth();
    
    console.log('AuthContext: Регистриране на слушателите за автентикация');
    
    // Слушател за събития от Supabase Auth
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`AuthContext: Събитие за промяна на автентикацията: ${event}`, new Date().toISOString());
        
        // Игнорираме първоначалните събития, за да избегнем дублиране
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          // Проверка дали това е първоначално зареждане и имаме ли вече текуща сесия
          if (session && currentSessionId) {
            console.log('AuthContext: Игнориране на събитие', event, 'при първоначално зареждане');
            return;
          }
          
          // ... existing code ...
        }
      }
    );
    
    // Добавяме слушател за случаите, когато прозорецът се връща от заспиване
    const handleOnline = () => {
      console.log('AuthContext: Връзката е възстановена, проверка на сесията', {
        timestamp: new Date().toISOString(),
        hasSession: !!session,
        sessionId: session?.access_token?.slice(-10) || 'няма'
      });
      
      // Правим проверка на сесията и настройките
      checkAuth();
    };
    
    window.addEventListener('online', handleOnline);
    
    // ... existing code ...
    
    return () => {
      console.log('AuthContext: Почистване на слушателите за автентикация');
        authListener.subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, []);
  
  // Добавяме отделен ефект за следене на видимостта на таба
  useEffect(() => {
    // Когато табът отново е видим, проверяваме валидността на сесията
    if (isTabVisible && session) {
      // Проверяваме дали сесията скоро ще изтече
      if (isTokenExpiringSoon(session)) {
        console.log('Табът е отново активен, опресняване на сесията...');
        refreshSession();
      } else {
        // Проверка за актуалност с лека интервал от време
        const checkSessionTimeout = setTimeout(() => {
          getSession();
        }, 1000);
        
        return () => clearTimeout(checkSessionTimeout);
      }
    }
  }, [isTabVisible, session]);
  
  // Предоставяме контекста за автентикация на дъщерните компоненти
  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        refreshSession,
        getSession
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext 