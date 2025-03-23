import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { registerSchema, type RegisterFormData } from '../schemas/registerSchema';
import { notify } from './Notifications';
import { z } from 'zod';
import { useAuth } from '../App';

// Използваме същия тип, който е дефиниран в схемата
type RoleType = z.infer<typeof registerSchema>['role'];

const Register = () => {
  const navigate = useNavigate();
  const { role: initialRole } = useParams<{ role?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Анимация при зареждане
  const [isVisible, setIsVisible] = useState(false);
  const { session } = useAuth(); // Използваме useAuth хука за достъп до текущата сесия
  
  useEffect(() => {
    setIsVisible(true);
    
    // Проверяваме дали потребителят вече е логнат
    if (session) {
      navigate('/dashboard'); // Ако е логнат, пренасочваме към dashboard
    }
  }, [session, navigate]);

  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors }, 
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: initialRole as RoleType || 'company',
      email: '',
      fullName: '',
      phone: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      companyAddress: '',
      taxId: '',
      specialization: '',
      experience: '',
      additionalInfo: '',
      buildingAddress: '',
      apartmentsCount: '',
      buildingInfo: '',
    }
  });

  // Задаваме ролята от URL параметъра, ако е подадена
  useEffect(() => {
    if (initialRole && ['company', 'technician', 'building_manager'].includes(initialRole as RoleType)) {
      setValue('role', initialRole as RoleType);
    }
  }, [initialRole, setValue]);

  const role = watch('role');

  // Функция за генериране на сигурна случайна парола
  const generateRandomPassword = () => {
    const length = 12; // Дължина на паролата
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    const allChars = lowerChars + upperChars + numbers + specialChars;
    
    // Гарантиране, че има поне по един символ от всеки тип
    let randomPassword = 
      lowerChars.charAt(Math.floor(Math.random() * lowerChars.length)) +
      upperChars.charAt(Math.floor(Math.random() * upperChars.length)) +
      numbers.charAt(Math.floor(Math.random() * numbers.length)) +
      specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    
    // Допълване на останалите символи
    for (let i = 4; i < length; i++) {
      randomPassword += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Разбъркване на символите
    randomPassword = randomPassword
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
    
    // Задаване на паролата в полетата
    setValue('password', randomPassword);
    setValue('confirmPassword', randomPassword);
    
    // Показваме паролата временно
    setShowPassword(true);
    setShowConfirmPassword(true);
    
    // След 3 секунди скриваме паролата отново
    setTimeout(() => {
      setShowPassword(false);
      setShowConfirmPassword(false);
    }, 3000);
    
    notify.success('Генерирана е случайна парола!');
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      
      // Преобразуваме role стойността към съответната стойност в базата данни
      const dbRole = getDbRole(data.role);
      
      // Регистрация на потребителя чрез Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: dbRole, // Използваме преобразуваната роля
          },
        },
      });

      if (authError) throw authError;

      // Съхраняваме допълнителна информация в profiles таблицата
      if (authData.user) {
        const roleSpecificData = getRoleSpecificData(data);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            phone: data.phone,
            role: dbRole, // Използваме преобразуваната роля
            ...roleSpecificData,
          });

        if (profileError) throw profileError;
      }

      // Директно навигиране със state параметър, за да укажем, че идваме от регистрация
      navigate('/email-verification', { state: { fromRegistration: true } });
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Възникна грешка при регистрацията';
      notify.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Функция за преобразуване на ролята към съвместима с базата данни стойност
  const getDbRole = (role: RoleType): string => {
    switch (role) {
      case 'company':
        return 'company_admin';
      case 'technician':
        return 'technician';
      case 'building_manager':
        return 'building_manager';
      default:
        return 'user';
    }
  };

  // Извличаме специфичните данни според типа потребител
  const getRoleSpecificData = (data: RegisterFormData) => {
    switch (data.role) {
      case 'company':
        return {
          company_name: data.companyName,
          company_address: data.companyAddress,
          tax_id: data.taxId,
        };
      case 'technician':
        return {
          specialization: data.specialization,
          experience: data.experience,
          additional_info: data.additionalInfo,
        };
      case 'building_manager':
        return {
          building_address: data.buildingAddress,
          apartments_count: data.apartmentsCount,
          building_info: data.buildingInfo,
        };
      default:
        return {};
    }
  };

  // Описания за всеки тип потребител
  const roleDescriptions = {
    company: "Фирма за поддръжка и ремонт на асансьори",
    technician: "Извършва ремонти и поддръжка на асансьори",
    building_manager: "Отговаря за поддръжката на асансьорите в една или повече сгради"
  };

  return (
    <div className="form-background">
      <div className={`form-container max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-500`}>
        <h1 className="form-title text-center">Регистрация</h1>
        <p className="form-subtitle text-center">Създайте своя акаунт в платформата за управление на асансьори</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Тип потребител */}
          <div className="form-field">
            <label htmlFor="role" className="form-label text-center block mb-3">
              Тип потребител <span className="form-required">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <div>
                <div 
                  className={`border rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${role === 'company' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}`}
                  onClick={() => setValue('role', 'company')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mx-auto mb-2 ${role === 'company' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className={`font-medium ${role === 'company' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>Фирма</div>
                  <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{roleDescriptions.company}</p>
                </div>
              </div>
              
              <div>
                <div 
                  className={`border rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${role === 'technician' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}`}
                  onClick={() => setValue('role', 'technician')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mx-auto mb-2 ${role === 'technician' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <div className={`font-medium ${role === 'technician' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>Техник</div>
                  <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{roleDescriptions.technician}</p>
                </div>
              </div>
              
              <div>
                <div 
                  className={`border rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${role === 'building_manager' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}`}
                  onClick={() => setValue('role', 'building_manager')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mx-auto mb-2 ${role === 'building_manager' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <div className={`font-medium ${role === 'building_manager' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>Управител</div>
                  <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{roleDescriptions.building_manager}</p>
                </div>
              </div>
              
              <input type="hidden" {...register('role')} />
            </div>
            {errors.role && (
              <p className="form-error text-center mt-2">{errors.role.message}</p>
            )}
          </div>
          
          {/* Основна информация */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Основна информация</h3>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="form-field group">
                <label htmlFor="email" className="form-label group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400">
              Имейл <span className="form-required">*</span>
            </label>
                <div className="input-group">
                  <div className="input-group-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
            <input
              type="email"
              id="email"
                    className={`form-input input-with-icon ${errors.email ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200' : ''}`}
                    placeholder="вашият@имейл.com"
              {...register('email')}
            />
                </div>
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </div>

              <div className="form-field group">
                <label htmlFor="fullName" className="form-label group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400">
              {role === 'company' ? 'Име на контактно лице' : 'Пълно име'} <span className="form-required">*</span>
            </label>
                <div className="input-group">
                  <div className="input-group-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
            <input
              type="text"
              id="fullName"
                    className={`form-input input-with-icon ${errors.fullName ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200' : ''}`}
                    placeholder={role === 'company' ? 'Иван Петров' : 'Име Фамилия'}
              {...register('fullName')}
            />
                </div>
            {errors.fullName && (
              <p className="form-error">{errors.fullName.message}</p>
            )}
          </div>

              <div className="form-field group">
                <label htmlFor="phone" className="form-label group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400">
              Телефон <span className="form-required">*</span>
            </label>
                <div className="input-group">
                  <div className="input-group-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
            <input
              type="tel"
              id="phone"
                    className={`form-input input-with-icon ${errors.phone ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200' : ''}`}
                    placeholder="+359 888 123 456"
              {...register('phone')}
            />
                </div>
            {errors.phone && (
              <p className="form-error">{errors.phone.message}</p>
            )}
          </div>

              <div className="form-field group">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="form-label group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400">
              Парола <span className="form-required">*</span>
            </label>
                  <button 
                    type="button" 
                    onClick={generateRandomPassword} 
                    className="text-xs text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    Генерирай парола
                  </button>
                </div>
                <div className="input-group">
                  <div className="input-group-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
            <input
                    type={showPassword ? "text" : "password"}
              id="password"
                    className={`form-input input-with-icon input-with-icon-right ${errors.password ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200' : ''}`}
                    placeholder="••••••••"
              {...register('password')}
            />
                  <div className="input-group-icon-right" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </div>
                </div>
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Минимум 8 символа, включително главна буква, малка буква, цифра и специален символ.
                </p>
          </div>

              <div className="form-field group">
                <label htmlFor="confirmPassword" className="form-label group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400">
              Потвърдете паролата <span className="form-required">*</span>
            </label>
                <div className="input-group">
                  <div className="input-group-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
            <input
                    type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
                    className={`form-input input-with-icon input-with-icon-right ${errors.confirmPassword ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200' : ''}`}
                    placeholder="••••••••"
              {...register('confirmPassword')}
            />
                  <div className="input-group-icon-right" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </div>
                </div>
            {errors.confirmPassword && (
              <p className="form-error">{errors.confirmPassword.message}</p>
            )}
              </div>
            </div>
          </div>

          {/* Показваме специфични полета според типа потребител */}
          {role === 'company' && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Информация за фирмата</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="form-field">
                <label htmlFor="companyName" className="form-label">
                  Име на фирмата <span className="form-required">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  className="form-input"
                  {...register('companyName')}
                />
                {errors.companyName && (
                  <p className="form-error">{errors.companyName.message}</p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="companyAddress" className="form-label">
                  Адрес на фирмата <span className="form-required">*</span>
                </label>
                <input
                  type="text"
                  id="companyAddress"
                  className="form-input"
                  {...register('companyAddress')}
                />
                {errors.companyAddress && (
                  <p className="form-error">{errors.companyAddress.message}</p>
                )}
              </div>

                <div className="md:col-span-2">
                <label htmlFor="taxId" className="form-label">
                  ЕИК/Булстат <span className="form-required">*</span>
                </label>
                <input
                  type="text"
                  id="taxId"
                  className="form-input"
                  {...register('taxId')}
                />
                {errors.taxId && (
                  <p className="form-error">{errors.taxId.message}</p>
                )}
              </div>
              </div>
            </div>
          )}

          {role === 'technician' && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Професионална информация</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="form-field">
                <label htmlFor="specialization" className="form-label">
                  Специализация <span className="form-required">*</span>
                </label>
                <input
                  type="text"
                  id="specialization"
                  className="form-input"
                  {...register('specialization')}
                  placeholder="Напр. Електрически асансьори, Хидравлични системи"
                />
                {errors.specialization && (
                  <p className="form-error">{errors.specialization.message}</p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="experience" className="form-label">
                  Години опит <span className="form-required">*</span>
                </label>
                <input
                  type="number"
                  id="experience"
                  className="form-input"
                  {...register('experience')}
                  min="0"
                />
                {errors.experience && (
                  <p className="form-error">{errors.experience.message}</p>
                )}
              </div>

                <div className="md:col-span-2">
                <label htmlFor="additionalInfo" className="form-label">
                  Допълнителна информация
                </label>
                <textarea
                  id="additionalInfo"
                  className="form-input"
                  {...register('additionalInfo')}
                  rows={3}
                  placeholder="Сертификати, квалификации, специални умения..."
                />
                {errors.additionalInfo && (
                  <p className="form-error">{errors.additionalInfo.message}</p>
                )}
              </div>
              </div>
            </div>
          )}

          {role === 'building_manager' && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Информация за сградата</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="form-field">
                <label htmlFor="buildingAddress" className="form-label">
                  Адрес на сградата <span className="form-required">*</span>
                </label>
                <input
                  type="text"
                  id="buildingAddress"
                  className="form-input"
                  {...register('buildingAddress')}
                />
                {errors.buildingAddress && (
                  <p className="form-error">{errors.buildingAddress.message}</p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="apartmentsCount" className="form-label">
                  Брой апартаменти <span className="form-required">*</span>
                </label>
                <input
                  type="number"
                  id="apartmentsCount"
                  className="form-input"
                  {...register('apartmentsCount')}
                  min="1"
                />
                {errors.apartmentsCount && (
                  <p className="form-error">{errors.apartmentsCount.message}</p>
                )}
              </div>

                <div className="md:col-span-2">
                <label htmlFor="buildingInfo" className="form-label">
                  Допълнителна информация за сградата
                </label>
                <textarea
                  id="buildingInfo"
                  className="form-input"
                  {...register('buildingInfo')}
                  rows={3}
                  placeholder="Година на строеж, вид асансьор, последен ремонт..."
                />
                {errors.buildingInfo && (
                  <p className="form-error">{errors.buildingInfo.message}</p>
                )}
              </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center pt-2">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Съгласен съм с <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">условията за ползване</a> и <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">политиката за поверителност</a>
            </label>
          </div>
          
            <button
              type="submit"
            className={`form-button mt-4 ${isLoading ? 'animate-pulse' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Регистрация...
              </div>
              ) : (
              'Регистрация'
              )}
            </button>
          
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Вече имате акаунт?{' '}
            <Link 
              to="/login" 
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors dark:text-primary-400 dark:hover:text-primary-300"
            >
              Влезте в системата
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register; 