import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ThemeContext } from '../App'
import { supabase } from '../supabaseClient'
import { useNotificationsManager } from './NotificationsManager'

/**
 * Компонент за настройки на потребителския профил
 * 
 * Включва следните настройки:
 * - Тема (светла/тъмна/системна)
 * - Език (информативно - винаги български)
 * - Известия (настройки за различните типове постоянни известия)
 * 
 * ВАЖНО ЗА НОТИФИКАЦИИТЕ:
 * Настройките за известия тук се отнасят САМО за постоянните известия,
 * които се показват в дропдаун меню (NotificationCenter.tsx).
 * Тези настройки НЕ засягат toast нотификациите (Notifications.tsx),
 * които винаги се показват за важни системни съобщения.
 * 
 * Когато потребителят изключи определен тип известия, само постоянните
 * известия от този тип спират да се създават в базата данни, но
 * временните toast съобщения продължават да се показват нормално.
 */

type NotificationSetting = {
  key: string
  title: string
  description: string
  enabled: boolean
}

const Settings = () => {
  const { user, loading } = useAuth()
  const { setDarkMode } = useContext(ThemeContext)
  const navigate = useNavigate()
  const { showSuccess, showError, userNotificationSettings } = useNotificationsManager()
  
  const [isSaving, setIsSaving] = useState(false)
  const [userSettings, setUserSettings] = useState<any>(null)
  const [themePreference, setThemePreference] = useState<'system' | 'light' | 'dark'>('system')
  
  // Състояние за свиване/разширяване на категориите с известия
  const [expandedSections, setExpandedSections] = useState({
    elevators: true,
    maintenance: true,
    requests: true,
    profile: true
  });
  
  // Функция за превключване на секциите
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Примерни настройки за известия
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      key: 'maintenance_due',
      title: 'Предстояща поддръжка',
      description: 'Известия за предстояща планова поддръжка',
      enabled: true
    },
    {
      key: 'maintenance_completed',
      title: 'Завършена поддръжка',
      description: 'Известия при завършена поддръжка',
      enabled: true
    },
    {
      key: 'elevator_issue',
      title: 'Проблеми с асансьор',
      description: 'Известия при регистриран проблем с асансьор',
      enabled: true
    },
    {
      key: 'new_service_request',
      title: 'Нова заявка за услуга',
      description: 'Известия при нова заявка за услуга',
      enabled: true
    },
    {
      key: 'account_updates',
      title: 'Промени по акаунта',
      description: 'Известия при промени по профила или настройките',
      enabled: false
    }
  ])

  // Зареждане на настройките на потребителя
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 е код за "no rows returned" - няма проблем в случая
          console.error('Грешка при зареждане на настройки:', error)
          return
        }

        if (data) {
          setUserSettings(data)
          // Зареждаме запазените настройки
          if (data.theme_preference) {
            setThemePreference(data.theme_preference)
          }
          if (data.notification_settings) {
            setNotificationSettings(prev => 
              prev.map(setting => ({
                ...setting,
                enabled: data.notification_settings[setting.key] !== false
              }))
            )
          }
        } else {
          // Ако нямаме настройки, използваме настройките от контекста за нотификации
          setNotificationSettings(prev => 
            prev.map(setting => ({
              ...setting,
              enabled: userNotificationSettings[setting.key] !== false
            }))
          )
        }
      } catch (error) {
        console.error('Грешка при зареждане на настройки:', error)
        showError('Неуспешно зареждане на настройките')
      }
    }

    loadUserSettings()
  }, [user, userNotificationSettings, showError])

  // Актуализиране на настройката за тема
  useEffect(() => {
    if (themePreference === 'light') {
      setDarkMode(false)
    } else if (themePreference === 'dark') {
      setDarkMode(true)
    } else {
      // Ако е 'system', следваме системните предпочитания
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
    }
  }, [themePreference, setDarkMode])

  // Ако потребителят не е автентикиран и зареждането е приключило, пренасочване към вход
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  const handleNotificationToggle = (key: string) => {
    setNotificationSettings(prev => 
      prev.map(setting => 
        setting.key === key ? { ...setting, enabled: !setting.enabled } : setting
      )
    )
  }

  const handleThemeChange = (value: 'system' | 'light' | 'dark') => {
    setThemePreference(value)
  }

  const saveSettings = async () => {
    if (!user) return

    setIsSaving(true)

    try {
      // Форматираме настройките за известията
      const notificationObject = notificationSettings.reduce((acc, setting) => {
        acc[setting.key] = setting.enabled
        return acc
      }, {} as Record<string, boolean>)

      const settingsData = {
        user_id: user.id,
        theme_preference: themePreference,
        language: 'bg', // Винаги използваме български език
        notification_settings: notificationObject,
        updated_at: new Date().toISOString()
      }

      // Проверяваме дали вече съществуват настройки
      if (userSettings?.id) {
        const { error } = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('id', userSettings.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert([settingsData])

        if (error) throw error
      }

      showSuccess('Настройките са запазени успешно')
    } catch (error: any) {
      console.error('Грешка при запазване на настройки:', error)
      showError(`Грешка при запазване на настройките: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Настройки</h2>
          
          <div className="space-y-8">
            {/* Секция за тема */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Настройки на темата</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    themePreference === 'system'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                  onClick={() => handleThemeChange('system')}
                >
                  <div className="flex items-center mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-medium text-gray-800 dark:text-white">Системна</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Автоматично следва настройките на вашето устройство
                  </p>
                </div>
                
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    themePreference === 'light'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                  onClick={() => handleThemeChange('light')}
                >
                  <div className="flex items-center mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-yellow-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="font-medium text-gray-800 dark:text-white">Светла</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Винаги използвай светла тема
                  </p>
                </div>
                
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    themePreference === 'dark'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <div className="flex items-center mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                    <span className="font-medium text-gray-800 dark:text-white">Тъмна</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Винаги използвай тъмна тема
                  </p>
                </div>
              </div>
            </div>
            
            {/* Информация за езика */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Език</h3>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-600 dark:text-green-400 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                  <span className="font-medium text-gray-800 dark:text-white">Български</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Интерфейсът е настроен на български език
                </p>
              </div>
            </div>
            
            {/* Секция за известия */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Настройки на известията</h3>
              
              {/* Групиране по категории */}
              <div className="space-y-4">
                {/* Секция за асансьори */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => toggleSection('elevators')}
                    className="w-full p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 flex justify-between items-center"
                  >
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Асансьори
                    </h4>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${expandedSections.elevators ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className={`transition-all duration-300 ${expandedSections.elevators ? 'max-h-96' : 'max-h-0 overflow-hidden'}`}>
                    <div className="p-3 space-y-2">
                      {notificationSettings
                        .filter(setting => ['elevator_issue'].includes(setting.key))
                        .map(setting => (
                          <div 
                            key={setting.key}
                            className="flex items-center justify-between p-3"
                          >
                            <div className="text-gray-700 dark:text-gray-300">
                              <div className="font-medium">{setting.title}</div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={setting.enabled}
                                onChange={() => handleNotificationToggle(setting.key)}
                              />
                              <div className="relative w-11 h-6 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Секция за поддръжка */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => toggleSection('maintenance')}
                    className="w-full p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 flex justify-between items-center"
                  >
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Поддръжка
                    </h4>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${expandedSections.maintenance ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className={`transition-all duration-300 ${expandedSections.maintenance ? 'max-h-96' : 'max-h-0 overflow-hidden'}`}>
                    <div className="p-3 space-y-2">
                      {notificationSettings
                        .filter(setting => ['maintenance_due', 'maintenance_completed'].includes(setting.key))
                        .map(setting => (
                          <div 
                            key={setting.key}
                            className="flex items-center justify-between p-3"
                          >
                            <div className="text-gray-700 dark:text-gray-300">
                              <div className="font-medium">{setting.title}</div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={setting.enabled}
                                onChange={() => handleNotificationToggle(setting.key)}
                              />
                              <div className="relative w-11 h-6 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Секция за заявки */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => toggleSection('requests')}
                    className="w-full p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 flex justify-between items-center"
                  >
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Заявки
                    </h4>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${expandedSections.requests ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className={`transition-all duration-300 ${expandedSections.requests ? 'max-h-96' : 'max-h-0 overflow-hidden'}`}>
                    <div className="p-3 space-y-2">
                      {notificationSettings
                        .filter(setting => ['new_service_request'].includes(setting.key))
                        .map(setting => (
                          <div 
                            key={setting.key}
                            className="flex items-center justify-between p-3"
                          >
                            <div className="text-gray-700 dark:text-gray-300">
                              <div className="font-medium">{setting.title}</div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={setting.enabled}
                                onChange={() => handleNotificationToggle(setting.key)}
                              />
                              <div className="relative w-11 h-6 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Секция за профил */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => toggleSection('profile')}
                    className="w-full p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 flex justify-between items-center"
                  >
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Профил
                    </h4>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${expandedSections.profile ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className={`transition-all duration-300 ${expandedSections.profile ? 'max-h-96' : 'max-h-0 overflow-hidden'}`}>
                    <div className="p-3 space-y-2">
                      {notificationSettings
                        .filter(setting => ['account_updates'].includes(setting.key))
                        .map(setting => (
                          <div 
                            key={setting.key}
                            className="flex items-center justify-between p-3"
                          >
                            <div className="text-gray-700 dark:text-gray-300">
                              <div className="font-medium">{setting.title}</div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={setting.enabled}
                                onChange={() => handleNotificationToggle(setting.key)}
                              />
                              <div className="relative w-11 h-6 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Универсален превключвател за всички известия */}
                <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      Всички известия
                      <p className="text-xs font-normal text-gray-500 dark:text-gray-400">Включва или изключва всички известия наведнъж</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={notificationSettings.every(s => s.enabled)}
                        onChange={() => {
                          const allEnabled = notificationSettings.every(s => s.enabled);
                          const newValue = !allEnabled;
                          setNotificationSettings(prev => 
                            prev.map(setting => ({ ...setting, enabled: newValue }))
                          );
                        }}
                      />
                      <div className="relative w-11 h-6 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Бутони */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                disabled={isSaving}
              >
                Отказ
              </button>
              <button
                type="button"
                onClick={saveSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={isSaving}
              >
                {isSaving ? 'Запазване...' : 'Запази настройки'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings 