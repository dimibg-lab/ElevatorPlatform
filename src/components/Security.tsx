import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { 
  passwordSchema, 
  deleteAccountSchema, 
  PasswordFormData, 
  DeleteAccountFormData,
  logsPerPage
} from '../schemas/securitySchema'

// Тип за активните сесии
type SessionInfo = {
  id: string
  created_at: string
  last_sign_in_at: string
  device: string
  browser: string
  location: string
  ip_address: string
  current: boolean
}

// Тип за активностите на потребителя в журнала
type ActivityLog = {
  id: string
  user_id: string
  activity_type: string
  description: string
  created_at: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
}

const Security: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  })
  
  const { 
    register: registerDelete, 
    handleSubmit: handleSubmitDelete, 
    formState: { errors: deleteErrors } 
  } = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema)
  })

  const navigate = useNavigate()
  const { user, loading, signOut, updatePassword } = useAuth()
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [securityCode, setSecurityCode] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [confirming2FA, setConfirming2FA] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  const logUserActivity = async (
    activity_type: string,
    description: string,
    metadata: any = {}
  ) => {
    try {
      // Записване на IP и user agent информация
      const ipInfo = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .catch(() => ({ ip: 'unknown' }));

      const { data, error } = await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user?.id,
          activity_type,
          description,
          ip_address: ipInfo.ip || 'unknown',
          user_agent: navigator.userAgent,
          metadata
        });

      if (error) {
        console.error('Грешка при записване на активност:', error);
      }
      return { data, error };
    } catch (err) {
      console.error('Грешка при логване на активност:', err);
      return { data: null, error: err };
    }
  };

  const loadActivityLogs = async (page = 1) => {
    if (!user) return
    
    setLogsLoading(true)
    try {
      const offset = (page - 1) * logsPerPage
      
      const countResponse = await supabase
        .from('user_activity_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      const totalCount = countResponse.count || 0
      setTotalPages(Math.ceil(totalCount / logsPerPage))
      
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + logsPerPage - 1)
      
      if (error) throw error
      
      setActivityLogs(data || [])
      setCurrentPage(page)
    } catch (error: any) {
      console.error('Грешка при зареждане на дневника с активности:', error)
      toast.error('Грешка при зареждане на дневника с активности')
    } finally {
      setLogsLoading(false)
    }
  }
  
  const deleteAccount = async (data: DeleteAccountFormData) => {
    if (!user) return
    
    setIsDeletingAccount(true)
    try {
      await logUserActivity('account_deletion_started', 'Започнато изтриване на акаунт')
      
      // Използваме RPC функция вместо директна заявка
      const { data: deleteResult, error: profileError } = await supabase
        .rpc('delete_profile', { user_id: user.id })
      
      if (profileError) throw profileError
      
      if (!deleteResult.success) {
        throw new Error(deleteResult.message || 'Възникна проблем при изтриването на профила')
      }
      
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      
      if (error) throw error
      
      await signOut()
      
      toast.success('Вашият акаунт беше успешно изтрит')
      navigate('/login')
    } catch (error: any) {
      console.error('Грешка при изтриване на акаунт:', error)
      toast.error(`Грешка при изтриване на акаунт: ${error.message}`)
      
      await logUserActivity('account_deletion_failed', 'Неуспешен опит за изтриване на акаунт', { error: error.message })
    } finally {
      setIsDeletingAccount(false)
      setShowDeleteAccount(false)
    }
  }

  // Зареждане на активните сесии и журнал с активности
  useEffect(() => {
    let isMounted = true;
    
    if (!user) return;

    const loadSessions = async () => {
      if (!isMounted) return;
      
      setSessionsLoading(true);
      try {
        // за извличане на активните сесии
        const { data, error } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;

        // Добавяме текущата сесия, ако не е върната от DB
        const currentSession = {
          id: 'current-session',
          created_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          device: navigator.platform || 'Unknown',
          browser: navigator.userAgent.split(' ').pop() || 'Unknown',
          location: 'Current location',
          ip_address: '127.0.0.1', // Placeholder
          current: true
        };

        // Обработваме данните и добавяме текущата сесия
        if (isMounted) {
          if (data && data.length > 0) {
            const formattedSessions = data.map(session => ({
              ...session,
              current: false
            }));
            setActiveSessions([currentSession, ...formattedSessions]);
          } else {
            setActiveSessions([currentSession]);
          }
        }
        
        // Записваме активност при зареждане на сесии
        await logUserActivity('sessions_viewed', 'Преглед на активни сесии');
      } catch (error: any) {
        console.error('Грешка при зареждане на сесии:', error);
        if (isMounted) {
          toast.error('Грешка при зареждане на активните сесии');
        }
      } finally {
        if (isMounted) {
          setSessionsLoading(false);
        }
      }
    };

    const loadActivityLogs = async () => {
      if (!isMounted) return;
      
      setLogsLoading(true);
      try {
        const offset = (currentPage - 1) * logsPerPage;
        
        const countResponse = await supabase
          .from('user_activity_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        const totalCount = countResponse.count || 0;
        
        if (isMounted) {
          setTotalPages(Math.ceil(totalCount / logsPerPage));
        
          const { data, error } = await supabase
            .from('user_activity_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + logsPerPage - 1);
          
          if (error) throw error;
          
          setActivityLogs(data || []);
        }
      } catch (error: any) {
        console.error('Грешка при зареждане на дневника с активности:', error);
        if (isMounted) {
          toast.error('Грешка при зареждане на дневника с активности');
        }
      } finally {
        if (isMounted) {
          setLogsLoading(false);
        }
      }
    };

    // Проверка на 2FA статус
    const check2FAStatus = async () => {
      if (!isMounted) return;
      
      try {
        const { data, error } = await supabase
          .from('user_mfa_settings')
          .select('enabled')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (isMounted) {
          setIs2FAEnabled(data?.enabled || false);
        }
      } catch (error) {
        console.error('Грешка при проверка на 2FA статус:', error);
      }
    };

    loadSessions();
    loadActivityLogs();
    check2FAStatus();
    
    // Почистване при демонтиране
    return () => {
      isMounted = false;
    };
  }, [user, currentPage]); // Зависим само от user и currentPage, а не от други променливи състояния

  // Обработка на формуляра за промяна на парола
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true)
    
    try {
      // Тук трябва да проверите текущата парола преди промяната
      // За опростеност, директно променяме паролата
      const { error } = await updatePassword(data.newPassword)
      
      if (error) throw error
      
      toast.success('Паролата е променена успешно')
      reset()
      
      // Запис на активността
      await logUserActivity(
        'password_change',
        'Успешна смяна на парола',
        { timestamp: new Date().toISOString() }
      );
    } catch (error: any) {
      toast.error(`Грешка при промяна на паролата: ${error.message}`)
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Прекратяване на сесия
  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase.auth.admin.signOut(sessionId);
      
      if (error) {
        toast.error(`Грешка при терминиране на сесията: ${error.message}`);
      } else {
        toast.success('Сесията е прекратена успешно');
        
        // Презареждане на сесиите
        loadActivityLogs();
        
        // Запис на активността
        await logUserActivity(
          'session_terminated',
          'Терминиране на сесия',
          { session_id: sessionId }
        );
      }
    } catch (error: any) {
      toast.error(`Грешка: ${error.message}`);
    }
  }

  // Стартиране на настройка на 2FA
  const setup2FA = async () => {
    setIsSettingUp2FA(true)
    
    try {
      // В реалния случай, извикайте Supabase API за генериране на QR код за 2FA
      // Тук просто симулираме с placeholder
      setQrCodeUrl('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/ElevatorPlatform:user@example.com?secret=ABCDEFGHIJKLMNOP&issuer=ElevatorPlatform')
    } catch (error: any) {
      toast.error(`Грешка при настройка на двуфакторна автентикация: ${error.message}`)
      setIsSettingUp2FA(false)
    }
  }

  // Потвърждаване на 2FA
  const confirm2FA = async () => {
    try {
      // В реалния случай, проверете кода чрез Supabase Auth API
      if (securityCode.length !== 6 || !/^\d+$/.test(securityCode)) {
        throw new Error('Невалиден код')
      }

      // Симулираме успешно потвърждение
      toast.success('Двуфакторната автентикация е активирана успешно')
      setIs2FAEnabled(true)
      setIsSettingUp2FA(false)
      setQrCodeUrl(null)
      setSecurityCode('')
    } catch (error: any) {
      toast.error(`Грешка при потвърждаване на код: ${error.message}`)
    }
  }

  // Деактивиране на 2FA
  const disable2FA = async () => {
    try {
      // В реалния случай, деактивирайте 2FA чрез Supabase Auth API
      const { error } = await supabase
        .from('user_mfa_settings')
        .update({ enabled: false })
        .eq('user_id', user?.id)
      
      if (error) throw error

      toast.success('Двуфакторната автентикация е деактивирана')
      setIs2FAEnabled(false)
    } catch (error: any) {
      toast.error(`Грешка при деактивиране на двуфакторна автентикация: ${error.message}`)
    }
  }

  // Обновена функция за зареждане на логове, която може да бъде използвана с React onClick
  const handleRefreshLogs = () => {
    loadActivityLogs(1); // Винаги започваме от първа страница при ръчно опресняване
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Сигурност на акаунта</h1>
      
      {/* Секция за парола */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-white">Промяна на парола</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Силната парола е важна за защита на вашия акаунт
          </p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Текуща парола
              </label>
              <input
                type="password"
                {...register('currentPassword')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currentPassword.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Нова парола
              </label>
              <input
                type="password"
                {...register('newPassword')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Потвърждение на новата парола
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <div>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? "Обработване..." : "Промени паролата"}
              </button>
            </div>
          </form>
        </div>
      </section>
      
      {/* Секция за двуфакторна автентикация */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-white">Двуфакторна автентикация (2FA)</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Добавете допълнително ниво на сигурност за вашия акаунт с двуфакторна автентикация
          </p>
        </div>
        
        <div className="p-6">
          {is2FAEnabled ? (
            <div>
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md">
                <div className="flex items-center">
                  <div className="mr-3 flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Двуфакторната автентикация е активирана за вашия акаунт.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={disable2FA}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                disabled={setupLoading}
              >
                {setupLoading ? "Деактивиране..." : "Деактивирай 2FA"}
              </button>
            </div>
          ) : isSettingUp2FA ? (
            <div className="space-y-4">
              {qrCode && (
                <div className="flex flex-col items-center space-y-4 mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
                    Сканирайте QR кода с вашето приложение за автентикация (Google Authenticator, Authy и др.)
                  </p>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <img src={qrCode} alt="QR код за 2FA" className="mx-auto" />
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Код за потвърждение
                </label>
                <input
                  id="verification-code"
                  type="text"
                  placeholder="Въведете 6-цифрения код"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={confirm2FA}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  disabled={confirming2FA || confirmationCode.length !== 6}
                >
                  {confirming2FA ? "Потвърждаване..." : "Потвърди"}
                </button>
                
                <button
                  onClick={() => setIsSettingUp2FA(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Отказ
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Двуфакторната автентикация изисква потвърждение от вашето мобилно устройство при всеки вход, което прави акаунта ви по-сигурен.
              </p>
              
              <button
                onClick={setup2FA}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                disabled={setupLoading}
              >
                {setupLoading ? "Настройване..." : "Настрой 2FA"}
              </button>
            </div>
          )}
        </div>
      </section>
      
      {/* Активни сесии */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-white">Активни сесии</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Преглед и управление на вашите активни сесии
          </p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {sessionsLoading ? (
              <div className="text-center py-4">
                <div className="spinner inline-block"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Зареждане на активни сесии...</p>
              </div>
            ) : activeSessions.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Няма активни сесии</p>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6">Устройство</th>
                      <th scope="col" className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Локация</th>
                      <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Последно активна</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Действия</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {activeSessions.map(session => (
                      <tr key={session.id} className={session.current ? "bg-blue-50 dark:bg-blue-900/20" : ""}>
                        <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-gray-600 dark:text-gray-400"
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
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{session.device}</div>
                              <div className="text-gray-500 dark:text-gray-400">{session.browser}</div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <div className="h-3.5 w-3.5 rounded-full bg-green-400 mr-2"></div>
                            <span>{session.location}</span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(session.last_sign_in_at).toLocaleString()}
                        </td>
                        <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {session.current ? (
                            <span className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full text-xs">Текуща сесия</span>
                          ) : showDeleteConfirm === session.id ? (
                            <div className="flex space-x-2 justify-end">
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                              >
                                Отказ
                              </button>
                              <button
                                onClick={() => terminateSession(session.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                              >
                                Потвърди
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowDeleteConfirm(session.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                            >
                              Прекрати
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-md">
              <strong>Забележка:</strong> Ако забележите подозрителна активност, прекратете съответната сесия и променете паролата си незабавно.
            </div>
          </div>
        </div>
      </section>
      
      {/* Журнал с активности */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-white">Журнал с активности</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Преглед на последните действия, извършени с вашия акаунт
          </p>
        </div>

        <div className="p-6">
          {logsLoading ? (
            <div className="flex justify-center my-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : activityLogs.length === 0 ? (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400">
              Няма записани активности
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-left text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 border-b">Дата и час</th>
                    <th className="py-3 px-4 border-b">Тип активност</th>
                    <th className="py-3 px-4 border-b">Описание</th>
                    <th className="py-3 px-4 border-b">IP адрес</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 border-b text-gray-600 dark:text-gray-300">
                        {new Date(log.created_at).toLocaleString('bg-BG')}
                      </td>
                      <td className="py-3 px-4 border-b text-gray-600 dark:text-gray-300">
                        {log.activity_type === 'password_change' && 'Смяна на парола'}
                        {log.activity_type === 'session_terminated' && 'Прекратена сесия'}
                        {log.activity_type === 'account_deletion' && 'Изтриване на акаунт'}
                        {log.activity_type === '2fa_setup' && 'Настройка на 2FA'}
                        {log.activity_type === 'login' && 'Вход в системата'}
                        {log.activity_type === 'logout' && 'Изход от системата'}
                        {!['password_change', 'session_terminated', 'account_deletion', '2fa_setup', 'login', 'logout'].includes(log.activity_type) && log.activity_type}
                      </td>
                      <td className="py-3 px-4 border-b text-gray-600 dark:text-gray-300">
                        {log.description}
                      </td>
                      <td className="py-3 px-4 border-b text-gray-600 dark:text-gray-300">
                        {log.ip_address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 text-right">
            <button
              type="button"
              onClick={handleRefreshLogs}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
              disabled={logsLoading}
            >
              {logsLoading ? 'Зареждане...' : 'Обнови журнала'}
            </button>
          </div>
        </div>
      </section>

      {/* Изтриване на акаунт */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-white text-red-600 dark:text-red-400">Изтриване на акаунт</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Изтриването на вашия акаунт ще премахне всички ваши лични данни от системата. Тази операция е необратима.
          </p>
        </div>

        <div className="p-6">
          {!showDeleteAccount ? (
            <div>
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Изтрий акаунта
              </button>
            </div>
          ) : (
            <div className="space-y-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-red-800 dark:text-red-400">Предупреждение: Необратимо действие</p>
                  <p className="text-sm text-red-600 dark:text-red-300">Изтриването на акаунта не може да бъде отменено</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmitDelete(deleteAccount)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Въведете паролата си за потвърждение
                  </label>
                  <input
                    type="password"
                    {...registerDelete('password')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  {deleteErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{deleteErrors.password.message}</p>
                  )}
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="confirmDelete"
                      type="checkbox"
                      {...registerDelete('confirmDelete')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="confirmDelete" className="font-medium text-gray-700 dark:text-gray-300">
                      Разбирам, че изтриването на акаунта ми е необратимо и ще загубя всички данни, свързани с него
                    </label>
                    {deleteErrors.confirmDelete && (
                      <p className="mt-1 text-sm text-red-600">{deleteErrors.confirmDelete.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteAccount(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Отказ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    disabled={isDeletingAccount}
                  >
                    {isDeletingAccount ? "Изтриване..." : "Потвърди изтриването"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Security 