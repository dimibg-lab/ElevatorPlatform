import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import React, { useEffect, useState, createContext, useCallback } from 'react'
import 'react-toastify/dist/ReactToastify.css'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import EmailVerification from './components/EmailVerification'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import ResendVerification from './components/ResendVerification'
import Notifications from './components/Notifications'
import CompanyDashboard from './components/dashboard/CompanyDashboard'
import NotFound from './components/NotFound'
import { supabase } from './supabaseClient'

// Тип за контекста на темата с разширени функционалности
type ThemeContextType = {
  darkMode: boolean
  toggleDarkMode: () => void
  setDarkMode: (isDark: boolean) => void
  isDarkThemeActive: () => boolean
}

// Тип за контекста за автентикацията
type AuthContextType = {
  session: any | null
  user: any | null
  loading: boolean
  signOut: () => Promise<void>
}

// Създаваме контекст с подразбиращи се стойности
export const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
  setDarkMode: () => {},
  isDarkThemeActive: () => false,
})

// Създаваме контекст за автентикацията
export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
})

// Функция за проверка на тъмната тема от localStorage и системните предпочитания
export const isDarkThemeActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  return savedTheme === 'dark' || (!savedTheme && prefersDark);
};

// Компонент за защитен маршрут
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>;
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Хук за използване на контекста за автентикация
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth трябва да се използва в AuthProvider');
  }
  return context;
};

// Главен компонент на приложението
const App = () => {
  const [darkMode, setDarkModeState] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Функция за актуализиране на тъмния режим с пълна синхронизация
  const applyDarkMode = useCallback((isDark: boolean) => {
    // Актуализираме състоянието
    setDarkModeState(isDark)
    
    // Актуализираме HTML класа
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark-theme')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark-theme')
    }
    
    // Актуализираме localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    
    // Изпращаме персонализирано събитие за другите компоненти
    const event = new CustomEvent('themeChange', { detail: { isDark } })
    window.dispatchEvent(event)
  }, [])
  
  // Функция за превключване на тъмния режим
  const toggleDarkMode = useCallback(() => {
    applyDarkMode(!darkMode)
  }, [darkMode, applyDarkMode])
  
  // Слушател за системни промени на темата
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Променяме темата само ако потребителят не е задал изрично тема
      if (!localStorage.getItem('theme')) {
        applyDarkMode(e.matches)
      }
    }
    
    // Добавяме слушател за промени в системната тема
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    // Проверяваме и задаваме началната тема
    applyDarkMode(isDarkThemeActive())
    
    // Почистваме слушателя при размонтиране
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [applyDarkMode])
  
  // Функция за изход от системата
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Грешка при излизане:', error);
    }
  };
  
  // Проверяваме автентикацията при зареждане на приложението
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        
        if (currentSession?.user) {
          setUser(currentSession.user);
        }
        
        // Слушаме за промени в автентикацията
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user ?? null);
          }
        );
        
        return () => {
          authListener?.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Грешка при проверка на автентикацията:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Създаваме обект с всички функции и стойности за контекста
  const themeContextValue = {
    darkMode,
    toggleDarkMode,
    setDarkMode: applyDarkMode,
    isDarkThemeActive: () => darkMode,
  }
  
  // Създаваме обект с всички стойности за контекста за автентикация
  const authContextValue = {
    session,
    user,
    loading,
    signOut,
  }
  
  return (
    <ThemeContext.Provider value={themeContextValue}>
      <AuthContext.Provider value={authContextValue}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/10 to-indigo-50/20 dark:from-gray-900 dark:via-blue-950/10 dark:to-indigo-950/20 transition-colors duration-300">
          <Router>
            <Notifications />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/:role" element={<Register />} />
              <Route path="/email-verification" element={<EmailVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/resend-verification" element={<ResendVerification />} />
              
              {/* Защитени маршрути */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <CompanyDashboard />
                </ProtectedRoute>
              } />
              
              {/* 404 страница */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </div>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}

export default App