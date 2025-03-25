import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import type { Database } from '../../lib/database.types';
import { InsertElevator as SchemaInsertElevator } from '../../schemas/elevatorSchema';
import { elevatorFormSchema, ElevatorFormValues } from '../../schemas/elevatorFormSchema';

// Типове за асансьор от database.types.ts
type Elevator = Database['public']['Tables']['elevators']['Row'];
type Building = {
  id: string;
  name: string;
  address: string;
};

interface ElevatorFormProps {
  elevator: Elevator | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ElevatorForm: React.FC<ElevatorFormProps> = ({ elevator, isOpen, onClose, onSuccess }) => {
  // Използваме глобалния контекст за потребителя
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isCreatingBuilding, setIsCreatingBuilding] = useState(false);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null); // За общи грешки, които не са свързани с конкретно поле
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { register, reset, setValue, watch, setError, formState: { errors, isSubmitting } } = useForm<ElevatorFormValues>({
    resolver: zodResolver(elevatorFormSchema),
    defaultValues: {
      building_id: '',
      building_name: '',
      building_address: '',
      serial_number: '',
      model: '',
      capacity: 1000,
      installation_date: new Date(),
      last_inspection_date: new Date(),
      next_inspection_date: new Date(),
      status: 'operational', // Използваме актуализираната стойност от схемата
    },
  });
  
  // Избраната сграда
  const selectedBuildingId = watch('building_id');
  
  // Зареждане на сградите с useCallback
  const fetchBuildings = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingBuildings(true);
    
    try {
      console.log('Зареждане на сгради с RPC функция');
      
      // Извличаме ID на компанията на потребителя (ако е от компания)
      const companyIds = user.profile?.company_id ? [user.profile.company_id] : [];
      
      // Използваме оптимизираната RPC функция
      const { data, error } = await supabase.rpc('get_buildings_for_elevators', {
        building_ids: [],
        company_ids: companyIds
      });
      
      if (error) {
        console.error('Грешка при зареждане на сградите:', error);
        throw error;
      }
      
      console.log(`Успешно заредени ${data?.length || 0} сгради`);
      setBuildings(data || []);
    } catch (error: any) {
      console.error('Грешка при зареждане на сградите:', error.message);
      toast.error(`Грешка при зареждане на сградите: ${error.message}`);
    } finally {
      setIsLoadingBuildings(false);
    }
  }, [user]);
  
  // Използваме useEffect с fetchBuildings като зависимост
  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);
  
  // Актуализиране на формата при редактиране на съществуващ асансьор
  useEffect(() => {
    if (elevator) {
      // Форматираме датите в YYYY-MM-DD формат, който се изисква от HTML input type="date"
      const formatDateForInput = (dateStr: string | null): string => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // Форматиране на датата във формат YYYY-MM-DD
        return date.toISOString().split('T')[0];
      };

      // Подготвяме форматирани дати за input полетата
      const installation = formatDateForInput(elevator.installation_date);
      const lastInspection = formatDateForInput(elevator.last_inspection_date);
      const nextInspection = formatDateForInput(elevator.next_inspection_date);

      // Първо правим ресет на формата
      reset({
        building_id: elevator.building_id,
        building_name: '',  // Ще бъде попълнено, ако намерим сградата
        building_address: '',  // Ще бъде попълнено, ако намерим сградата
        serial_number: elevator.serial_number,
        model: elevator.model,
        capacity: elevator.capacity,
        installation_date: new Date(),
        last_inspection_date: new Date(),
        next_inspection_date: new Date(),
        status: elevator.status as 'operational' | 'maintenance' | 'out_of_order',
      });
      
      // Намиране и попълване на данни за сградата
      const building = buildings.find(b => b.id === elevator.building_id);
      if (building) {
        setValue('building_name', building.name);
        setValue('building_address', building.address);
      }

      // Изчакваме малко и директно манипулираме input полетата
      setTimeout(() => {
        // Директен достъп до input елементите и задаване на стойности в правилния формат
        const installationInput = document.getElementById('installation_date') as HTMLInputElement;
        if (installationInput && installation) installationInput.value = installation;
        
        const lastInspectionInput = document.getElementById('last_inspection_date') as HTMLInputElement;
        if (lastInspectionInput && lastInspection) lastInspectionInput.value = lastInspection;
        
        const nextInspectionInput = document.getElementById('next_inspection_date') as HTMLInputElement;
        if (nextInspectionInput && nextInspection) nextInspectionInput.value = nextInspection;
      }, 100);
    } else {
      reset({
        building_id: '',
        building_name: '',
        building_address: '',
        serial_number: '',
        model: '',
        capacity: 1000,
        installation_date: new Date(),
        last_inspection_date: new Date(),
        next_inspection_date: new Date(),
        status: 'operational',
      });
    }
  }, [elevator, reset, buildings, setValue]);
  
  // Създаване на сграда
  const createBuilding = async (data: any) => {
    // Проверяваме дали user и user.profile съществуват
    if (!user || !user.profile) {
      setGeneralError("Трябва да сте влезли в системата с валиден профил, за да създадете сграда");
      return null;
    }

    try {
      console.log("Създаване на нова сграда:", data);
      
      // Използваме RPC функция вместо директна заявка
      const { data: result, error } = await supabase.rpc('create_building', {
        building_data: {
          name: data.building_name,
          address: data.building_address,
          company_id: user.profile.company_id,
          floors: data.building_floors || 1,
          entrances: data.building_entrances || 1
        }
      });
        
      if (error) {
        console.error('Грешка при създаване на сграда:', error);
        setGeneralError(`Грешка при създаване на сграда: ${error.message}`);
        return null;
      }
      
      if (!result.success) {
        console.error('Неуспешно създаване на сграда:', result.message);
        setGeneralError(`Неуспешно създаване на сграда: ${result.message}`);
        return null;
      }
      
      console.log('Сградата е създадена успешно:', result.data);
      return result.data.id;
    } catch (error: any) {
      console.error('Неочаквана грешка при създаване на сграда:', error);
      setGeneralError(`Неочаквана грешка при създаване на сграда: ${error.message}`);
      return null;
    }
  };

  const onSubmit = async (data: ElevatorFormValues) => {
    try {
      console.log("Извикване на onSubmit с данни:", data);
      
      // Изчистваме предишни грешки
      setGeneralError(null);
      
      // Проверка за наличие на потребител
      if (!user) {
        console.error("Липсва потребител");
        setGeneralError("Трябва да сте влезли в системата");
        return;
      }
      
      // Проверка дали потребителят има профил
      if (!user.profile) {
        console.error("Липсва профил на потребителя");
        console.log("Изчакване профилните данни да се заредят...");
        setGeneralError("Моля, изчакайте докато профилните данни се заредят");
        return;
      }
      
      // Дебъг информация за потребителя
      console.log("Данни за потребителя:", {
        id: user.id,
        role: user.profile.role,
        company_id: user.profile.company_id
      });
      
      // Проверка за ролята на потребителя
      if (user.profile.role !== 'company' && user.profile.role !== 'company_admin') {
        setGeneralError("Само компании могат да управляват асансьори");
        return;
      }
      
      // Проверка за наличие на company_id
      if (!user.profile.company_id) {
        console.error("Липсващ company_id в профила на потребителя:", user.profile);
        setGeneralError("Липсва ID на компанията във вашия профил. Моля, свържете се с администратор.");
        return;
      }
      
      // Проверка дали е избрана съществуваща сграда или трябва да се създаде нова
      let buildingId = data.building_id;
      
      if (!buildingId) {
        // Създаване на нова сграда
        const newBuildingId = await createBuilding(data);
        if (!newBuildingId) {
          // Грешката вече е показана в createBuilding
          return;
        }
        buildingId = newBuildingId;
      }
      
      console.log("Подготовка на данни за запазване на асансьор", data);
      
      // Уверяваме се, че имаме валидни обекти за дати
      const installation_date = data.installation_date || new Date();
      const last_inspection_date = data.last_inspection_date || new Date();
      const next_inspection_date = data.next_inspection_date || new Date();
      
      // Проверка и подготовка на данните за асансьора с валидно ID
      const elevatorData: SchemaInsertElevator = {
        id: crypto.randomUUID(), // Винаги генерираме ID, за да няма проблеми
        building_id: buildingId,
        company_id: user.profile.company_id,
        serial_number: data.serial_number,
        model: data.model,
        capacity: data.capacity,
        // Конвертираме Date обекти в ISO string за API заявката
        installation_date: installation_date.toISOString(),
        last_inspection_date: last_inspection_date.toISOString(),
        next_inspection_date: next_inspection_date.toISOString(),
        status: data.status,
      };
      
      if (elevator) {
        // Редактиране на съществуващ асансьор
        console.log("Редактиране на асансьор с ID:", elevator.id);
        const { data: result, error } = await supabase.rpc('upsert_elevator', {
          elevator_data: {
            id: elevator.id,
            building_id: buildingId,
            company_id: user.profile.company_id,
            serial_number: data.serial_number,
            model: data.model,
            capacity: data.capacity,
            installation_date: installation_date.toISOString(),
            last_inspection_date: last_inspection_date.toISOString(),
            next_inspection_date: next_inspection_date.toISOString(),
            status: data.status
          }
        });
          
        if (error) {
          console.error('Грешка при редактиране на асансьор:', error);
          
          // Проверка за различни типове грешки
          setGeneralError(`Грешка при обновяване: ${error.message}`);
          return;
        }
        
        if (!result.success) {
          console.error('Неуспешно редактиране на асансьор:', result.message);
          setGeneralError(`Неуспешно редактиране на асансьор: ${result.message}`);
          return;
        }
        
        console.log('Асансьорът е редактиран успешно');
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
          onSuccess();
        }, 2000);
      } else {
        // Добавяне на нов асансьор
        console.log("Създаване на нов асансьор");
        const { data: result, error } = await supabase.rpc('upsert_elevator', {
          elevator_data: {
            building_id: buildingId,
            company_id: user.profile.company_id,
            serial_number: data.serial_number,
            model: data.model,
            capacity: data.capacity,
            installation_date: installation_date.toISOString(),
            last_inspection_date: last_inspection_date.toISOString(),
            next_inspection_date: next_inspection_date.toISOString(),
            status: data.status
          }
        });
        
        if (error) {
          console.error('Грешка при създаване на асансьор:', error);
          setGeneralError(`Грешка при създаване: ${error.message}`);
          return;
        }
        
        if (!result.success) {
          console.error('Неуспешно създаване на асансьор:', result.message);
          setGeneralError(`Неуспешно създаване на асансьор: ${result.message}`);
          return;
        }
        
        console.log('Асансьорът е създаден успешно');
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
          onSuccess();
        }, 2000);
      }
      
      // Изчистване на формата ПРЕДИ да затворим модала и да извикаме onSuccess
      reset({
        building_id: '',
        building_name: '',
        building_address: '',
        serial_number: '',
        model: '',
        capacity: 1000,
        installation_date: new Date(),
        last_inspection_date: new Date(),
        next_inspection_date: new Date(),
        status: 'operational',
      });
      
      // Затваряне на модала и извикване на функцията за успех след малко закъснение
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 100);
    } catch (error: any) {
      console.error('Грешка при запазване на асансьор:', error);
      setGeneralError(`Възникна грешка: ${error.message || 'Неизвестна грешка'}`);
    }
  };

  // Проверка дали компонентът е монтиран - това ще предотврати грешки при асинхронни операции
  const isMounted = React.useRef(true);

  // Следим монтирането и демонтирането на компонента
  useEffect(() => {
    isMounted.current = true;
    console.log("ElevatorForm: компонентът е монтиран");
    
    return () => {
      isMounted.current = false;
      console.log("ElevatorForm: компонентът е демонтиран");
    };
  }, []);
  
  // Референция към формата
  const formRef = React.useRef<HTMLFormElement>(null);
  
  // Промяна в начина на валидация при изпращане на формата
  const handleSubmitForm = () => {
    console.log("[DEBUG] Започва директна валидация на формата");
    
    // Директно вземаме стойностите от формата и валидираме
    const rawFormData = {
      building_id: selectedBuildingId,
      building_name: (formRef.current?.querySelector('#building_name') as HTMLInputElement)?.value || '',
      building_address: (formRef.current?.querySelector('#building_address') as HTMLInputElement)?.value || '',
      serial_number: (formRef.current?.querySelector('#serial_number') as HTMLInputElement)?.value || '',
      model: (formRef.current?.querySelector('#model') as HTMLInputElement)?.value || '',
      capacity: parseInt((formRef.current?.querySelector('#capacity') as HTMLInputElement)?.value || '0'),
      // Конвертиране на string в Date за полетата на дати
      installation_date: (formRef.current?.querySelector('#installation_date') as HTMLInputElement)?.value 
        ? new Date((formRef.current?.querySelector('#installation_date') as HTMLInputElement).value) 
        : new Date(),
      last_inspection_date: (formRef.current?.querySelector('#last_inspection_date') as HTMLInputElement)?.value 
        ? new Date((formRef.current?.querySelector('#last_inspection_date') as HTMLInputElement).value) 
        : new Date(),
      next_inspection_date: (formRef.current?.querySelector('#next_inspection_date') as HTMLInputElement)?.value 
        ? new Date((formRef.current?.querySelector('#next_inspection_date') as HTMLInputElement).value) 
        : new Date(),
      status: (formRef.current?.querySelector('#status') as HTMLSelectElement)?.value as 'operational' | 'maintenance' | 'out_of_order',
    };
    
    console.log("[DEBUG] Събрани данни от формата:", rawFormData);
    
    // Ако има избрана съществуваща сграда, игнорираме полетата за името и адреса на сградата
    const finalFormData = rawFormData.building_id ? {
      ...rawFormData,
      building_name: 'Временно име', // Заобикаляме валидацията на building_name при избрана сграда
      building_address: 'Временен адрес' // Заобикаляме валидацията на building_address при избрана сграда
    } : rawFormData;
    
    console.log("[DEBUG] Подготвени данни за валидация:", finalFormData);
    
    // Валидиране с Zod
    const validationResult = elevatorFormSchema.safeParse(finalFormData);
    
    if (!validationResult.success) {
      console.error("[DEBUG] Грешки при валидиране:", validationResult.error);
      
      // Безопасен начин за извличане на грешките
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach(err => {
        const field = err.path[0]?.toString();
        if (field) {
          if (!fieldErrors[field]) fieldErrors[field] = [];
          fieldErrors[field].push(err.message);
        }
      });
      
      console.log("[DEBUG] Извлечени грешки по полета:", fieldErrors);
      
      // Показваме грешките към полетата
      Object.entries(fieldErrors).forEach(([field, messages]) => {
        if (messages.length > 0) {
          setError(field as keyof ElevatorFormValues, { 
            type: 'manual', 
            message: messages[0] 
          });
        }
      });
      
      return;
    }
    
    console.log("[DEBUG] Валидацията е успешна, продължаване към onSubmit");
    
    // Използваме оригиналните данни за изпращане към сървъра
    onSubmit(rawFormData);
  };

  // Ръчно извикване на submit
  const manualSubmit = (e: React.MouseEvent) => {
    // Спираме стандартното поведение на бутона
    e.preventDefault();
    e.stopPropagation();
    
    console.log("[DEBUG] Бутонът за добавяне/редактиране е натиснат", e.type);
    
    if (formRef.current) {
      console.log("[DEBUG] Формата е намерена, стартиране на директна валидация");
      handleSubmitForm();
    } else {
      console.error("[DEBUG] Формата не е намерена!");
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="min-h-screen px-4 text-center flex items-center justify-center">
        <div className="fixed inset-0 bg-black opacity-30" />

        <div className="inline-block w-full max-w-xl p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-y-auto max-h-[85vh] relative z-20">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white border-b pb-3 mb-4">
            {elevator ? 'Редактиране на асансьор' : 'Добавяне на нов асансьор'}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Затвори"
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </h3>
          
          {/* Показване на общи грешки, които не са свързани с конкретно поле */}
          {generalError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-600 dark:text-red-400 text-sm">{generalError}</p>
              </div>
            </div>
          )}
          
          <form ref={formRef} 
            onSubmit={(e) => { 
              console.log("[DEBUG] Опит за стандартно изпращане на формата");
              e.preventDefault();
              handleSubmitForm();
            }} 
            className="space-y-5">
            {/* Секция за сградата */}
            <div className="rounded-md p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Информация за сградата</h4>
              
              {buildings.length > 0 ? (
                <div className="mb-3">
                  <label htmlFor="building_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Изберете съществуваща сграда
                  </label>
                  <select
                    id="building_id"
                    {...register('building_id')}
                    className={`block w-full px-3 py-2 border ${
                      errors.building_id ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm focus:outline-none dark:bg-gray-700 dark:text-white`}
                  >
                    <option value="">-- Създаване на нова сграда --</option>
                    {buildings.map(building => (
                      <option key={building.id} value={building.id}>
                        {building.name} - {building.address}
                      </option>
                    ))}
                  </select>
                  {errors.building_id && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.building_id.message}</p>
                  )}
                </div>
              ) : (
                isLoadingBuildings ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Зареждане на сградите...</p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Няма налични сгради. Създайте нова.</p>
                )
              )}
              
              {!selectedBuildingId && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="building_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Име на сградата*
                    </label>
                    <input
                      id="building_name"
                      type="text"
                      {...register('building_name')}
                      className={`block w-full px-3 py-2 border ${
                        errors.building_name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-md shadow-sm focus:outline-none dark:bg-gray-700 dark:text-white`}
                      placeholder="Въведете име на сградата"
                    />
                    {errors.building_name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.building_name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="building_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Адрес на сградата*
                    </label>
                    <input
                      id="building_address"
                      type="text"
                      {...register('building_address')}
                      className={`block w-full px-3 py-2 border ${
                        errors.building_address ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                      } rounded-md shadow-sm focus:outline-none dark:bg-gray-700 dark:text-white`}
                      placeholder="Въведете адрес на сградата"
                    />
                    {errors.building_address && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.building_address.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Секция за асансьор */}
            <div className="rounded-md p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Данни за асансьора</h4>
            
              <div className="space-y-3">
                <div>
                  <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Сериен номер*
                  </label>
                  <input
                    id="serial_number"
                    type="text"
                    {...register('serial_number')}
                    className={`block w-full px-3 py-2 border ${
                      errors.serial_number ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm focus:outline-none dark:bg-gray-700 dark:text-white`}
                  />
                  {errors.serial_number && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.serial_number.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Модел
                  </label>
                  <input
                    id="model"
                    type="text"
                    {...register('model')}
                    className={`block w-full px-3 py-2 border ${
                      errors.model ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm focus:outline-none dark:bg-gray-700 dark:text-white`}
                  />
                  {errors.model && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.model.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Вместимост
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    {...register('capacity')}
                    className={`block w-full px-3 py-2 border ${
                      errors.capacity ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm focus:outline-none dark:bg-gray-700 dark:text-white`}
                  />
                  {errors.capacity && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.capacity.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="installation_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Дата на инсталация
                  </label>
                  <input
                    id="installation_date"
                    type="date"
                    {...register('installation_date')}
                    className={`block w-full px-3 py-2 border ${
                      errors.installation_date ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm focus:outline-none dark:bg-gray-700 dark:text-white`}
                  />
                  {errors.installation_date && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.installation_date.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="last_inspection_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Дата на последно обслужване
                  </label>
                  <input
                    id="last_inspection_date"
                    type="date"
                    {...register('last_inspection_date')}
                    className={`block w-full px-3 py-2 border ${
                      errors.last_inspection_date ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm focus:outline-none dark:bg-gray-700 dark:text-white`}
                  />
                  {errors.last_inspection_date && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.last_inspection_date.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="next_inspection_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Предстояща дата на обслужване
                  </label>
                  <input
                    id="next_inspection_date"
                    type="date"
                    {...register('next_inspection_date')}
                    className={`block w-full px-3 py-2 border ${
                      errors.next_inspection_date ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm focus:outline-none dark:bg-gray-700 dark:text-white`}
                  />
                  {errors.next_inspection_date && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.next_inspection_date.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Статус
                  </label>
                  <select
                    id="status"
                    {...register('status')}
                    className={`block w-full px-3 py-2 border ${
                      errors.status ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md shadow-sm focus:outline-none dark:bg-gray-700 dark:text-white`}
                  >
                    <option value="operational">Оперативен</option>
                    <option value="maintenance">За обслужване</option>
                    <option value="out_of_order">Извънреден</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
                  )}
                </div>
              </div>
            </div>
          </form>
          
          {/* Добавяне на бутони за действия */}
          <div className="mt-5 sm:mt-6 flex justify-end space-x-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Отказ
            </button>
            <button
              type="button"
              onClick={manualSubmit}
              disabled={isSubmitting || isCreatingBuilding}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {isSubmitting || isCreatingBuilding ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Запазване...
                </>
              ) : (
                'Запази'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElevatorForm;