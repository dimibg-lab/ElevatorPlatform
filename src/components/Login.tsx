import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { notify } from './Notifications';
import { supabase } from '../supabaseClient';
import { loginSchema, type LoginFormData } from '../schemas/loginSchema';

const Login = () => {
  const navigate = useNavigate();
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
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      notify.success('Успешен вход!');
      
      // Пренасочване според ролята на потребителя
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        // Ако има грешка при взимането на ролята, просто пренасочваме към общ дашборд
        navigate('/dashboard');
      } else {
        // Пренасочване според ролята
        switch (profileData.role) {
          case 'company':
            navigate('/company-dashboard');
            break;
          case 'technician':
            navigate('/technician-dashboard');
            break;
          case 'building_manager':
            navigate('/building-dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      notify.error('Невалиден имейл или парола');
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

  return (
    <div className="form-background">
      <div className="form-container max-w-md w-full">
        <h2 className="form-title">Вход в системата</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="form-field">
            <label htmlFor="email" className="form-label">
              Имейл <span className="form-required">*</span>
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="example@mail.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </div>
          
          <div className="form-field">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="form-label">
                Парола <span className="form-required">*</span>
              </label>
              <button 
                type="button" 
                onClick={handleResetPassword}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Забравена парола?
              </button>
            </div>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="form-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Влизане...
              </span>
            ) : (
              'Вход'
            )}
          </button>
          
          <div className="text-center text-gray-600">
            Нямате акаунт? <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700">Регистрация</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 