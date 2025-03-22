import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { notify } from './Notifications';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../schemas/forgotPasswordSchema';

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    }
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      notify.success('Изпратен е имейл за възстановяване на паролата');
    } catch (error) {
      console.error('Error resetting password:', error);
      notify.error(error instanceof Error ? error.message : 'Грешка при изпращане на имейл');
    }
  };

  return (
    <div className="form-background">
      <div className="form-container max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        </div>
        
        <h2 className="form-title">Забравена парола</h2>
        
        <p className="form-subtitle">
          Въведете имейл адреса, с който сте се регистрирали, и ще Ви изпратим линк за промяна на паролата.
        </p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
          <div className="form-field">
            <label htmlFor="email" className="form-label">
              Имейл адрес <span className="form-required">*</span>
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
                Изпращане...
              </span>
            ) : (
              'Промяна на парола'
            )}
          </button>
          
          <div className="text-center text-gray-600">
            <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">Назад към вход</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword; 