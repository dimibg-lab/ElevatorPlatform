import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import type { Database } from '../../lib/database.types';
import { maintenanceSchema, MaintenanceFormValues } from '../../schemas/maintenanceSchema';

// Типове за поддръжките
type MaintenanceRecord = {
  id: string;
  elevator_id: string;
  technician_id: string;
  company_id: string;
  service_request_id?: string | null;
  maintenance_type: 'regular' | 'emergency' | 'inspection' | 'repair';
  description: string;
  parts_replaced?: string | null;
  cost: number;
  maintenance_date: string;
  status?: 'completed' | 'pending' | 'in_progress';
  created_at: string;
  updated_at: string;
};

type Elevator = Database['public']['Tables']['elevators']['Row'];

type Technician = {
  id: string;
  user_id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  certification?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Building = {
  id: string;
  name: string;
  address: string;
  floors: number;
  entrances: number;
  company_id: string;
  created_at: string;
  updated_at: string;
};

type ServiceRequest = {
  id: string;
  elevator_id: string;
  building_manager_id: string;
  technician_id?: string; 
  company_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'scheduled' | 'completed' | 'cancelled';
  requested_date: string;
  scheduled_date?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
};

// Интерфейс за формата
interface MaintenanceFormProps {
  maintenanceRecord: MaintenanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ maintenanceRecord, isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  
  // Използваме глобалния контекст за потребителя
  const { user } = useAuth();
  
  // Инициализиране на формата с react-hook-form и zod валидатора
  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors },
    setValue,
    watch
  } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      id: undefined,
      elevator_id: '',
      technician_id: '',
      maintenance_type: 'regular',
      description: '',
      parts_replaced: '',
      cost: 0,
      maintenance_date: new Date(),
      service_request_id: null
    }
  });
  
  // Текущо избраният асансьор
  const selectedElevatorId = watch('elevator_id');
  
  // Зареждане на данни за асансьорите
  const fetchElevators = useCallback(async () => {
    try {
      // Проверка дали потребителят е влязъл и има профил
      if (!user?.profile) {
        console.error('Потребителят няма профил');
        return;
      }
      
      // Използваме RPC функция вместо директна заявка
      const { data: result, error } = await supabase.rpc('get_elevators', {
        in_company_id: user.profile?.role === 'company' || user.profile?.role === 'company_admin' 
          ? user.profile.company_id 
          : null
      });
      
      if (error) {
        console.error('Грешка при зареждане на асансьори:', error);
        return;
      }
      
      if (result && result.data) {
        setElevators(result.data);
      } else {
        setElevators([]);
      }
    } catch (err) {
      console.error('Грешка при зареждане на асансьори:', err);
    }
  }, [user]);
  
  // Зареждане на данни за техниците
  const fetchTechnicians = useCallback(async () => {
    try {
      let query = supabase.from('technicians').select('*');
      
      if (user?.profile?.role === 'company' || user?.profile?.role === 'company_admin') {
        query = query.eq('company_id', user.profile.company_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Грешка при зареждане на техници:', error);
        return;
      }
      
      setTechnicians(data || []);
    } catch (err) {
      console.error('Грешка при зареждане на техници:', err);
    }
  }, [user]);
  
  // Зареждане на сгради
  const fetchBuildings = useCallback(async () => {
    try {
      if (!user?.profile) {
        console.error('Потребителят няма профил');
        return;
      }
      
      console.log('Зареждане на всички сгради без филтриране');
      
      // Директна заявка към таблицата buildings без филтриране
      let query = supabase.from('buildings').select('*');
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Грешка при зареждане на сградите:', error);
        return;
      }
      
      console.log(`Заредени ${data?.length || 0} сгради`);
      setBuildings(data || []);
      
    } catch (err) {
      console.error('Грешка при зареждане на сградите:', err);
    }
  }, [user]);
  
  // Зареждане на данни за заявките за обслужване
  const fetchServiceRequests = useCallback(async () => {
    try {
      // Ако имаме избран асансьор, филтрираме заявките само за него
      let query = supabase.from('service_requests').select('*');
      
      if (selectedElevatorId) {
        query = query.eq('elevator_id', selectedElevatorId);
      }
      
      if (user?.profile?.role === 'company' || user?.profile?.role === 'company_admin') {
        query = query.eq('company_id', user.profile.company_id);
      }
      
      // Показваме само отворени/чакащи заявки
      query = query.in('status', ['open', 'in_progress', 'scheduled']);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Грешка при зареждане на заявки за обслужване:', error);
        return;
      }
      
      setServiceRequests(data || []);
    } catch (err) {
      console.error('Грешка при зареждане на заявки за обслужване:', err);
    }
  }, [user, selectedElevatorId]);
  
  // Зареждане на данни при отваряне на модала
  useEffect(() => {
    if (isOpen) {
      // Зареждаме данните за формата
      Promise.all([
        fetchElevators(),
        fetchTechnicians(),
        fetchBuildings()
      ]);
      
      // Ако редактираме съществуващ запис, попълваме формата
      if (maintenanceRecord) {
        reset({
          id: maintenanceRecord.id,
          elevator_id: maintenanceRecord.elevator_id,
          technician_id: maintenanceRecord.technician_id,
          maintenance_type: maintenanceRecord.maintenance_type,
          description: maintenanceRecord.description,
          parts_replaced: maintenanceRecord.parts_replaced || '',
          cost: maintenanceRecord.cost,
          maintenance_date: new Date(maintenanceRecord.maintenance_date),
          service_request_id: maintenanceRecord.service_request_id
        });
      } else {
        // Ако създаваме нов запис, поставяме настойки по подразбиране
        if (user?.profile?.role === 'technician') {
          // Ако потребителят е техник, автоматично го избираме
          setValue('technician_id', user.profile.id);
        }
        
        // Задаваме днешната дата по подразбиране
        setValue('maintenance_date', new Date());
      }
    }
  }, [isOpen, maintenanceRecord, reset, user, fetchElevators, fetchTechnicians, fetchBuildings, setValue]);
  
  // Зареждане на заявки за обслужване при промяна на избрания асансьор
  useEffect(() => {
    if (isOpen && selectedElevatorId) {
      fetchServiceRequests();
    }
  }, [isOpen, selectedElevatorId, fetchServiceRequests]);
  
  // Обработка на изпращането на формата
  const onSubmit = async (data: MaintenanceFormValues) => {
    setIsSubmitting(true);
    setGeneralError(null);
    
    try {
      // Получаваме детайлите за асансьора
      const elevator = elevators.find(e => e.id === data.elevator_id);
      if (!elevator) {
        setGeneralError('Избраният асансьор не е намерен. Моля, опитайте отново.');
        return;
      }
      
      // Проверка за правата на потребителя
      if (user?.profile?.role !== 'company' && 
          user?.profile?.role !== 'company_admin' && 
          user?.profile?.role !== 'technician') {
        setGeneralError('Нямате необходимите права за тази операция');
        return;
      }
      
      // Подготовка на данните за API заявката
      const maintenanceData = {
        id: data.id || crypto.randomUUID(),
        elevator_id: data.elevator_id,
        technician_id: data.technician_id,
        company_id: elevator.company_id, // Използваме company_id от асансьора
        service_request_id: data.service_request_id,
        maintenance_type: data.maintenance_type,
        description: data.description,
        parts_replaced: data.parts_replaced || null,
        cost: data.cost,
        maintenance_date: new Date(data.maintenance_date).toISOString(),
      };
      
      if (maintenanceRecord) {
        // Редактиране на съществуващ запис
        console.log("Редактиране на запис за поддръжка с ID:", maintenanceRecord.id);
        const { error } = await supabase
          .from('maintenance_records')
          .update(maintenanceData)
          .eq('id', maintenanceRecord.id);
          
        if (error) {
          console.error('Грешка при редактиране на запис за поддръжка:', error);
          setGeneralError(`Грешка при обновяване: ${error.message}`);
          return;
        }
        
        // Ако има свързана заявка за обслужване, маркираме я като завършена
        if (data.service_request_id) {
          await supabase
            .from('service_requests')
            .update({ 
              status: 'completed',
              completed_date: new Date().toISOString()
            })
            .eq('id', data.service_request_id);
        }
        
        toast.success('Записът за поддръжка е успешно обновен');
      } else {
        // Добавяне на нов запис
        console.log("Добавяне на нов запис за поддръжка");
        const { error } = await supabase
          .from('maintenance_records')
          .insert(maintenanceData);
          
        if (error) {
          console.error('Грешка при добавяне на запис за поддръжка:', error);
          setGeneralError(`Грешка при добавяне: ${error.message}`);
          return;
        }
        
        // Ако има свързана заявка за обслужване, маркираме я като завършена
        if (data.service_request_id) {
          await supabase
            .from('service_requests')
            .update({ 
              status: 'completed',
              completed_date: new Date().toISOString()
            })
            .eq('id', data.service_request_id);
        }
        
        toast.success('Записът за поддръжка е успешно добавен');
      }
      
      // Затваряме модала и изчистваме формата
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Грешка при запазване на запис за поддръжка:', error);
      setGeneralError(`Възникна грешка: ${error.message || 'Неизвестна грешка'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Получаване на име на асансьор за показване в select полето
  const getElevatorInfo = (elevatorId: string) => {
    const elevator = elevators.find(e => e.id === elevatorId);
    if (!elevator) return 'Непознат асансьор';
    
    const building = buildings.find(b => b.id === elevator.building_id);
    
    // Ако сградата не е намерена, показваме само данните на асансьора
    if (!building) {
      console.log(`Не е намерена сграда за асансьор ${elevator.serial_number} (building_id: ${elevator.building_id})`);
      return `Асансьор ${elevator.serial_number} (${elevator.model})`;
    }
    
    // Проверка дали има кирилица в името на сградата
    const hasCyrillic = /[А-Яа-я]/.test(building.name);
    console.log(`Сграда: "${building.name}", съдържа кирилица: ${hasCyrillic}`);
    
    // Връщаме комбинирана информация за сградата и асансьора
    return `${building.name} - ${elevator.serial_number}`;
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-auto p-6 animate-fade-in overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {maintenanceRecord ? 'Редактиране на запис за поддръжка' : 'Добавяне на нов запис за поддръжка'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              aria-label="Затвори"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {generalError && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md dark:bg-red-900/30 dark:text-red-300">
              {generalError}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Избор на асансьор */}
              <div className="space-y-2">
                <label htmlFor="elevator_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Асансьор <span className="text-red-500">*</span>
                </label>
                <select
                  id="elevator_id"
                  className={`w-full px-3 py-2 border ${errors.elevator_id ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
                  {...register('elevator_id')}
                  disabled={isSubmitting}
                >
                  <option value="">-- Изберете асансьор --</option>
                  {elevators.map(elevator => (
                    <option key={elevator.id} value={elevator.id}>
                      {getElevatorInfo(elevator.id)}
                    </option>
                  ))}
                </select>
                {errors.elevator_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.elevator_id.message}</p>
                )}
              </div>
              
              {/* Избор на техник */}
              <div className="space-y-2">
                <label htmlFor="technician_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Техник <span className="text-red-500">*</span>
                </label>
                <select
                  id="technician_id"
                  className={`w-full px-3 py-2 border ${errors.technician_id ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
                  {...register('technician_id')}
                  disabled={isSubmitting || user?.profile?.role === 'technician'}
                >
                  <option value="">-- Изберете техник --</option>
                  {technicians.map(technician => (
                    <option key={technician.id} value={technician.id}>
                      {technician.first_name} {technician.last_name}
                    </option>
                  ))}
                </select>
                {errors.technician_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.technician_id.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Тип на поддръжката */}
              <div className="space-y-2">
                <label htmlFor="maintenance_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Тип на поддръжката <span className="text-red-500">*</span>
                </label>
                <select
                  id="maintenance_type"
                  className={`w-full px-3 py-2 border ${errors.maintenance_type ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
                  {...register('maintenance_type')}
                  disabled={isSubmitting}
                >
                  <option value="regular">Планова</option>
                  <option value="emergency">Аварийна</option>
                  <option value="inspection">Инспекция</option>
                  <option value="repair">Ремонт</option>
                </select>
                {errors.maintenance_type && (
                  <p className="text-red-500 text-xs mt-1">{errors.maintenance_type.message}</p>
                )}
              </div>
              
              {/* Дата на поддръжката */}
              <div className="space-y-2">
                <label htmlFor="maintenance_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Дата на поддръжката <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="maintenance_date"
                  className={`w-full px-3 py-2 border ${errors.maintenance_date ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
                  {...register('maintenance_date')}
                  disabled={isSubmitting}
                />
                {errors.maintenance_date && (
                  <p className="text-red-500 text-xs mt-1">{errors.maintenance_date.message}</p>
                )}
              </div>
            </div>
            
            {/* Избор на свързана заявка */}
            {selectedElevatorId && serviceRequests.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="service_request_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Свързана заявка за обслужване
                </label>
                <select
                  id="service_request_id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  {...register('service_request_id')}
                  disabled={isSubmitting}
                >
                  <option value="">-- Няма свързана заявка --</option>
                  {serviceRequests.map(request => (
                    <option key={request.id} value={request.id}>
                      {request.title} ({request.status}) - {new Date(request.created_at).toLocaleDateString('bg-BG')}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Свързването със заявка ще я маркира като завършена автоматично.
                </p>
              </div>
            )}
            
            {/* Описание */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Описание <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
                placeholder="Опишете извършената работа..."
                {...register('description')}
                disabled={isSubmitting}
              ></textarea>
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>
            
            {/* Сменени части */}
            <div className="space-y-2">
              <label htmlFor="parts_replaced" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Сменени части
              </label>
              <textarea
                id="parts_replaced"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="Опишете сменените части, ако има такива..."
                {...register('parts_replaced')}
                disabled={isSubmitting}
              ></textarea>
            </div>
            
            {/* Сума */}
            <div className="space-y-2">
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Сума <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  id="cost"
                  className={`w-full pl-10 pr-3 py-2 border ${errors.cost ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
                  placeholder="0.00"
                  {...register('cost')}
                  disabled={isSubmitting}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400">лв.</span>
                </div>
              </div>
              {errors.cost && (
                <p className="text-red-500 text-xs mt-1">{errors.cost.message}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                disabled={isSubmitting}
              >
                Отказ
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Запазване...' : maintenanceRecord ? 'Обнови' : 'Добави'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceForm; 