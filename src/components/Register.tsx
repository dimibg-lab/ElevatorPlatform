import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { notify } from './Notifications';
import { supabase } from '../supabaseClient';
import { registerSchema, type RegisterFormData } from '../schemas/registerSchema';

const Register = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'company',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phone: '',
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

  const role = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Регистрация с Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: data.role,
            full_name: data.fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Създаваме запис с допълнителна информация според ролята
        const profileData: Record<string, any> = {
          id: authData.user.id,
          role: data.role,
          full_name: data.fullName,
          created_at: new Date().toISOString(),
        };

        // Добавяме специфични полета според ролята
        if (data.role === 'company') {
          profileData.company_name = data.companyName;
          profileData.company_address = data.companyAddress;
          profileData.tax_id = data.taxId;
        } else if (data.role === 'technician') {
          profileData.specialization = data.specialization;
          profileData.experience = data.experience;
          profileData.additional_info = data.additionalInfo;
        } else if (data.role === 'building_manager') {
          profileData.building_address = data.buildingAddress;
          profileData.apartments_count = data.apartmentsCount;
          profileData.building_info = data.buildingInfo;
        }

        const { error: profileError } = await supabase.from('profiles').insert(profileData);

        if (profileError) throw profileError;

        notify.success('Регистрацията е успешна! Моля, проверете имейла си за потвърждение.');
        navigate('/email-verification');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Възникна грешка при регистрацията';
      notify.error(errorMessage);
    }
  };

  return (
    <div className="form-background">
      <div className="form-container">
        <h1 className="form-title">Регистрация</h1>
        <p className="form-subtitle">Моля, попълнете информацията по-долу</p>

        <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
          {/* Тип потребител */}
          <div className="form-field-full">
            <label htmlFor="role" className="form-label">
              Тип потребител <span className="form-required">*</span>
            </label>
            <select
              id="role"
              className="form-input"
              {...register('role')}
            >
              <option value="company">Фирма</option>
              <option value="technician">Техник</option>
              <option value="building_manager">Управител на сграда</option>
            </select>
            {errors.role && (
              <p className="form-error">{errors.role.message}</p>
            )}
          </div>
          
          {/* Основна информация */}
          <div className="form-section-title">Основна информация</div>
          
          <div className="form-field">
            <label htmlFor="email" className="form-label">
              Имейл <span className="form-required">*</span>
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              {...register('email')}
            />
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="fullName" className="form-label">
              {role === 'company' ? 'Име на контактно лице' : 'Пълно име'} <span className="form-required">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              className="form-input"
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="form-error">{errors.fullName.message}</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="phone" className="form-label">
              Телефон <span className="form-required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              className="form-input"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="form-error">{errors.phone.message}</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password" className="form-label">
              Парола <span className="form-required">*</span>
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              {...register('password')}
            />
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
            <p className="form-hint">Минимум 6 символа</p>
          </div>

          <div className="form-field">
            <label htmlFor="confirmPassword" className="form-label">
              Потвърдете паролата <span className="form-required">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="form-error">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Специфична информация за различните типове потребители */}
          {role && (
            <div className="form-divider">
              <div className="form-divider-text">
                <span className="form-divider-label">
                  {role === 'company' 
                    ? 'Информация за фирмата' 
                    : role === 'technician' 
                    ? 'Информация за техника' 
                    : 'Информация за сградата'}
                </span>
              </div>
            </div>
          )}

          {role === 'company' && (
            <>
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

              <div className="form-field-full">
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
            </>
          )}

          {role === 'technician' && (
            <>
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

              <div className="form-field-full">
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
            </>
          )}

          {role === 'building_manager' && (
            <>
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

              <div className="form-field-full">
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
            </>
          )}

          <div className="form-actions">        
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
                  Регистрация...
                </span>
              ) : (
                'Регистрирай се'
              )}
            </button>
          </div>
          
          <div className="form-field-full text-center mt-4">
            Вече имате акаунт? <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">Вход</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 