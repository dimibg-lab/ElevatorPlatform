import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import React, { useEffect, useState, createContext, useCallback } from 'react'
import 'react-toastify/dist/ReactToastify.css'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import EmailVerification from './components/EmailVerification'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import ResendVerification from './components/ResendVerification'
import CompanyDashboard from './components/dashboard/CompanyDashboard'
import ElevatorList from './components/dashboard/ElevatorList'
import MaintenanceDashboard from './components/dashboard/MaintenanceDashboard'
import NotFound from './components/NotFound'
import DashboardLayout from './components/layouts/DashboardLayout'
import { useAuth as importedUseAuth } from './context/AuthContext'
import Notifications from './components/Notifications'
import Profile from './components/Profile'
import Settings from './components/Settings'
import Security from './components/Security'
import NotificationsProvider from './components/NotificationsManager'
import ToastContainer from './components/Notifications'

// Тип за контекста на темата с разширени функционалности
type ThemeContextType = {
  darkMode: boolean
  toggleDarkMode: () => void
  setDarkMode: (isDark: boolean) => void
  isDarkThemeActive: () => boolean
}

// Създаваме контекст с подразбиращи се стойности
export const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
  setDarkMode: () => {},
  isDarkThemeActive: () => false,
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
  const { session, loading } = importedUseAuth();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Използваме useEffect за да отбележим първоначалното зареждане
  useEffect(() => {
    if (!loading) {
      setInitialLoadComplete(true);
    }
  }, [loading]);
  
  // Показваме зареждаща индикация само при първоначално зареждане
  if (loading && !initialLoadComplete) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>;
  }
  
  // Пренасочваме само ако сме сигурни, че няма сесия след пълно зареждане
  if (initialLoadComplete && !session) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Главен компонент на приложението
const App = () => {
  const [darkMode, setDarkModeState] = useState(false)
  
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
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { isDark } }))
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
  
  // Създаваме обект с всички функции и стойности за контекста
  const themeContextValue = React.useMemo(() => ({
    darkMode,
    toggleDarkMode,
    setDarkMode: applyDarkMode,
    isDarkThemeActive: () => darkMode,
  }), [darkMode, toggleDarkMode, applyDarkMode]);
  
  return (
    <ThemeContext.Provider value={themeContextValue}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/10 to-indigo-50/20 dark:from-gray-900 dark:via-blue-950/10 dark:to-indigo-950/20 transition-colors duration-300">
        <NotificationsProvider>
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
            <Route element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Outlet />
                </DashboardLayout>
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<CompanyDashboard />} />
              <Route path="/elevators" element={<ElevatorList />} />
              <Route path="/maintenance" element={<MaintenanceDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/security" element={<Security />} />
            </Route>
            
            {/* Маршрут за грешка 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastContainer />
        </NotificationsProvider>
      </div>
    </ThemeContext.Provider>
  )
}

export default App