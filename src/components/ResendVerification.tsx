import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { notify } from './Notifications';
import { resendVerificationSchema, type ResendVerificationFormData } from '../schemas/resendVerificationSchema';

const ResendVerification = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResendVerificationFormData>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: {
      email: '',
    }
  });

  const onSubmit = async (data: ResendVerificationFormData) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: data.email
      });

      if (error) throw error;

      navigate('/email-verification', { state: { fromResend: true } });
    } catch (error) {
      console.error('Error resending verification:', error);
      notify.error(error instanceof Error ? error.message : 'Грешка при изпращане на имейл');
    }
  };

  return (
    <div className="form-background">
      <div className="form-container max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        <h2 className="form-title">Изпращане на нов линк за потвърждение</h2>
        
        <p className="form-subtitle">
          Въведете имейл адреса, с който сте се регистрирали, и ще Ви изпратим нов линк за потвърждение.
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
              'Изпрати повторно'
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

export default ResendVerification; 