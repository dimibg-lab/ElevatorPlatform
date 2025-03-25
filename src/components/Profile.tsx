import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileFormData } from '../schemas/profileSchema'

const Profile = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const formRenderedRef = useRef(false)
  
  console.log('Profile компонент рендериран', { 
    hasUser: !!user, 
    loading, 
    formVisible: formRenderedRef.current, 
    isEditing,
    documentVisible: !document.hidden,
    timestamp: new Date().toISOString()
  })

  // Настройка на формата с React Hook Form и Zod валидация
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.profile?.full_name || '',
      company_name: user?.profile?.company_name || '',
      phone: user?.profile?.phone || '',
      company_address: user?.profile?.company_address || '',
      // Използваме правилните полета от базата данни
      additional_info: user?.profile?.additional_info || '',
      specialization: user?.profile?.specialization || '',
      experience: user?.profile?.experience || '',
      building_address: user?.profile?.building_address || '',
      apartments_count: user?.profile?.apartments_count || '',
      building_info: user?.profile?.building_info || '',
    }
  })

  // Зареждане на профилната снимка
  useEffect(() => {
    if (user?.profile?.avatar_url) {
      const fetchAvatar = async () => {
        try {
          const { data } = await supabase
            .storage
            .from('avatars')
            .download(user.profile?.avatar_url || '')
          
          if (data) {
            const url = URL.createObjectURL(data)
            setAvatarUrl(url)
          }
        } catch (error) {
          console.error('Грешка при зареждане на профилна снимка:', error)
        }
      }
      
      fetchAvatar()
    }
  }, [user])

  // Актуализиране на стойностите на формата при промяна на потребителя
  useEffect(() => {
    if (user?.profile) {
      console.log('Актуализиране на формата с потребителските данни', {
        hasProfile: !!user.profile,
        userId: user.id,
        timestamp: new Date().toISOString()
      })
      
      reset({
        full_name: user.profile.full_name || '',
        company_name: user.profile.company_name || '',
        phone: user.profile.phone || '',
        company_address: user.profile.company_address || '',
        // Използваме правилните полета от базата данни
        additional_info: user.profile.additional_info || '',
        specialization: user.profile.specialization || '',
        experience: user.profile.experience || '',
        building_address: user.profile.building_address || '',
        apartments_count: user.profile.apartments_count || '',
        building_info: user.profile.building_info || '',
      })
    }
  }, [user, reset])

  // Добавяме ефект за проследяване на видимостта на таба
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('Промяна във видимостта на документа:', {
        hidden: document.hidden,
        timestamp: new Date().toISOString()
      })
      
      // Опитваме да подновим формата, ако табът е станал видим
      if (!document.hidden && user?.profile) {
        console.log('Принудително обновяване на формата след връщане видимост')
        reset({
          full_name: user.profile.full_name || '',
          company_name: user.profile.company_name || '',
          phone: user.profile.phone || '',
          company_address: user.profile.company_address || '',
          additional_info: user.profile.additional_info || '',
          specialization: user.profile.specialization || '',
          experience: user.profile.experience || '',
          building_address: user.profile.building_address || '',
          apartments_count: user.profile.apartments_count || '',
          building_info: user.profile.building_info || '',
        })
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    console.log('Регистриран слушател за видимост на документа')
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      console.log('Премахнат слушател за видимост на документа')
    }
  }, [user, reset])

  // Ако потребителят не е автентикиран и зареждането е приключило, пренасочване към вход
  useEffect(() => {
    if (!loading && !user) {
      console.log('Пренасочване към вход - няма потребител след зареждане')
      navigate('/login')
    }
  }, [user, loading, navigate])

  // Обработка на качване на снимка
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Размерът на файла трябва да е под 2MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = () => {
        setAvatarUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
      setAvatarFile(file)
    }
  }

  // Запазване на профилните данни
  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      console.log('Опит за запазване без потребител, прекратяване')
      return
    }
    
    console.log('Започване на запазване на профилни данни', {
      timestamp: new Date().toISOString(),
      hasAvatar: !!avatarFile
    })
    
    setIsSaving(true)
    
    try {
      let avatarPath = user.profile?.avatar_url
      
      // Качване на нова профилна снимка, ако има такава
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            upsert: true
          })
          
        if (uploadError) {
          throw uploadError
        }
        
        avatarPath = uploadData.path
      }
      
      console.log('Запазване на профилни данни чрез директна SQL заявка');
      
      // Директна SQL заявка за обновяване на профила
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name || null,
          company_name: data.company_name || null,
          phone: data.phone || null,
          company_address: data.company_address || null,
          additional_info: data.additional_info || null,
          specialization: data.specialization || null,
          experience: data.experience || null,
          building_address: data.building_address || null,
          apartments_count: data.apartments_count || null,
          building_info: data.building_info || null,
          avatar_url: avatarPath,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Грешка при обновяване на профила:', updateError);
        throw updateError;
      }
      
      toast.success('Профилът е актуализиран успешно');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Грешка при обновяване на профила:', error);
      toast.error(`Грешка при актуализиране на профила: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  // Добавяме ефект за следене на монтиране/демонтиране на компонента
  useEffect(() => {
    console.log('Profile компонент монтиран', { 
      timestamp: new Date().toISOString() 
    })
    formRenderedRef.current = true
    
    return () => {
      console.log('Profile компонент демонтиран', { 
        timestamp: new Date().toISOString() 
      })
      formRenderedRef.current = false
    }
  }, [])

  if (loading) {
    console.log('Показване на индикатор за зареждане', {
      timestamp: new Date().toISOString()
    })
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  console.log('Рендериране на профилната форма', {
    timestamp: new Date().toISOString(),
    hasUser: !!user,
    hasProfile: !!user?.profile
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Профил</h2>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Профилна снимка */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-blue-500">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Профилна снимка" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <span className="text-3xl font-bold text-gray-500 dark:text-gray-400">
                      {user?.profile?.full_name?.[0] || user?.email?.[0] || '?'}
                    </span>
                  </div>
                )}
                
                {isEditing && (
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 left-0 right-0 bg-blue-500 bg-opacity-75 text-white text-center py-1 cursor-pointer"
                  >
                    Промяна
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarChange}
                    />
                  </label>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
                  {user?.profile?.full_name || 'Потребител'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {user?.profile?.role === 'company' && 'Компания за поддръжка'}
                  {user?.profile?.role === 'company_admin' && 'Администратор на компания'}
                  {user?.profile?.role === 'technician' && 'Техник'}
                  {user?.profile?.role === 'building_manager' && 'Управител на сграда'}
                  {user?.profile?.role === 'admin' && 'Администратор'}
                </p>
              </div>
            </div>
            
            {/* Форма за профилни данни */}
            <div className="flex-1">
              <form 
                onSubmit={handleSubmit(onSubmit)} 
                className="space-y-4"
                ref={(el) => {
                  if (el) {
                    console.log('Формата е рендерирана в DOM', {
                      timestamp: new Date().toISOString(),
                      formId: el.id || 'profile-form'
                    })
                    formRenderedRef.current = true
                  }
                }}
              >
                {/* Име */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Име
                  </label>
                  <input
                    type="text"
                    {...register('full_name')}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                  )}
                </div>
                
                {/* Телефон */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
                
                {/* Полета, специфични за ролята */}
                {(user?.profile?.role === 'company' || user?.profile?.role === 'company_admin') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Име на компания
                      </label>
                      <input
                        type="text"
                        {...register('company_name')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      {errors.company_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Адрес на компания
                      </label>
                      <textarea
                        {...register('company_address')}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      {errors.company_address && (
                        <p className="mt-1 text-sm text-red-600">{errors.company_address.message}</p>
                      )}
                    </div>
                  </>
                )}
                
                {user?.profile?.role === 'technician' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Специализация
                      </label>
                      <input
                        type="text"
                        {...register('specialization')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      {errors.specialization && (
                        <p className="mt-1 text-sm text-red-600">{errors.specialization.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Опит
                      </label>
                      <textarea
                        {...register('experience')}
                        disabled={!isEditing}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      {errors.experience && (
                        <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Допълнителна информация
                      </label>
                      <textarea
                        {...register('additional_info')}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      {errors.additional_info && (
                        <p className="mt-1 text-sm text-red-600">{errors.additional_info.message}</p>
                      )}
                    </div>
                  </>
                )}
                
                {user?.profile?.role === 'building_manager' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Адрес на сграда
                      </label>
                      <textarea
                        {...register('building_address')}
                        disabled={!isEditing}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      {errors.building_address && (
                        <p className="mt-1 text-sm text-red-600">{errors.building_address.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Брой апартаменти
                      </label>
                      <input
                        type="text"
                        {...register('apartments_count')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      {errors.apartments_count && (
                        <p className="mt-1 text-sm text-red-600">{errors.apartments_count.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Информация за сградата
                      </label>
                      <textarea
                        {...register('building_info')}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      {errors.building_info && (
                        <p className="mt-1 text-sm text-red-600">{errors.building_info.message}</p>
                      )}
                    </div>
                  </>
                )}
                
                {/* Бутони */}
                <div className="flex justify-end space-x-3 mt-6">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false)
                          reset()
                          if (avatarFile) {
                            setAvatarFile(null)
                            setAvatarUrl(user?.profile?.avatar_url ? `${supabase.storage.from('avatars').getPublicUrl(user.profile.avatar_url || '').data.publicUrl}` : null)
                          }
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                        disabled={isSaving}
                      >
                        Отказ
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        disabled={isSaving}
                      >
                        {isSaving ? 'Запазване...' : 'Запази'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Редактирай
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile 