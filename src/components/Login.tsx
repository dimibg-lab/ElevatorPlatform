import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { notify } from './Notifications';
import { supabase } from '../supabaseClient';
import { loginSchema, type LoginFormData } from '../schemas/loginSchema';
import { useState, useEffect } from 'react';
import { useAuth } from '../App';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { session } = useAuth();
  
  useEffect(() => {
    setIsVisible(true);
    
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const email = watch('email');

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      notify.success('Успешен вход!');
      
      // Пренасочване към таблото
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      notify.error('Невалиден имейл или парола');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = () => {
    if (!email) {
      notify.warning('Моля, въведете имейл адрес');
      return;
    }

    supabase.auth.resetPasswordForEmail(email)
      .then(({ error }) => {
        if (error) {
          notify.error(error.message);
        } else {
          notify.success('Изпратен е имейл за възстановяване на паролата');
        }
      });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSocialLogin = (provider: string) => {
    // Реална интеграция би използвала supabase.auth.signInWithOAuth
    notify.info(`Вход с ${provider} скоро ще бъде наличен`);
  };

  return (
    <div className="form-background">
      <div className={`form-container max-w-md w-full ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-500`}>
        <div className="text-center">
          <h2 className="form-title">Вход в системата</h2>
          <p className="form-subtitle">Добре дошли отново в платформата за управление на асансьори</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            className="flex items-center justify-center py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all duration-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin('Facebook')}
            className="flex items-center justify-center py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all duration-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
          >
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>

        <div className="form-separator">
          <div className="form-separator-line"></div>
          <p className="form-separator-text">Или с имейл</p>
          <div className="form-separator-line"></div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
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
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="form-label group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400">
                Парола <span className="form-required">*</span>
              </label>
              <button 
                type="button" 
                onClick={handleResetPassword}
                className="text-sm text-primary-600 hover:text-primary-500 focus:outline-none dark:text-primary-400 dark:hover:text-primary-300 transition-colors font-medium"
              >
                Забравена парола?
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
              <div className="input-group-icon-right" onClick={togglePasswordVisibility}>
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
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className={`form-button ${isLoading ? 'animate-pulse' : ''}`}
              disabled={isSubmitting || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Влизане...
                </div>
              ) : (
                'Вход в системата'
              )}
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Нямате профил?{' '}
            <Link 
              to="/register" 
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors dark:text-primary-400 dark:hover:text-primary-300"
            >
              Регистрирайте се
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login; 