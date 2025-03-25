import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import { elevatorFilterSchema, type ElevatorFilterValues } from '../../schemas/elevatorSchema';
import ElevatorForm from './ElevatorForm';
import type { Database } from '../../lib/database.types';
import { useAuth } from '../../context/AuthContext';
import { z } from 'zod';

// Типови дефиниции от database.types.ts
type Elevator = Database['public']['Tables']['elevators']['Row'];
type Building = Database['public']['Tables']['buildings']['Row'];
type ElevatorPart = Database['public']['Tables']['elevator_parts']['Row'];

// Схема за валидация на формата за части
const elevatorPartSchema = z.object({
  name: z.string().min(1, 'Името е задължително').max(255, 'Името е твърде дълго'),
  part_number: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  installation_date: z.string().nullable().optional(),
  last_maintenance_date: z.string().nullable().optional(),
  next_maintenance_date: z.string().nullable().optional(),
  status: z.enum(['operational', 'needs_maintenance', 'defective']).default('operational'),
  description: z.string().nullable().optional()
});

type ElevatorPartFormValues = z.infer<typeof elevatorPartSchema>;

// Компонент за модален диалог за потвърждение
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-auto p-6 animate-fade-in">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
          >
            Отказ
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            Изтрий
          </button>
        </div>
      </div>
    </div>
  );
};

// Компонент за форма за добавяне/редактиране на части
interface ElevatorPartFormProps {
  elevatorId: string;
  part?: ElevatorPart | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ElevatorPartForm: React.FC<ElevatorPartFormProps> = ({ 
  elevatorId, 
  part, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Използваме react-hook-form за управление на формата
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ElevatorPartFormValues>({
    resolver: zodResolver(elevatorPartSchema),
    defaultValues: part ? {
      name: part.name,
      part_number: part.part_number,
      manufacturer: part.manufacturer,
      installation_date: part.installation_date ? part.installation_date.split('T')[0] : null,
      last_maintenance_date: part.last_maintenance_date ? part.last_maintenance_date.split('T')[0] : null,
      next_maintenance_date: part.next_maintenance_date ? part.next_maintenance_date.split('T')[0] : null,
      status: part.status as any || 'operational',
      description: part.description
    } : {
      name: '',
      part_number: null,
      manufacturer: null,
      installation_date: null,
      last_maintenance_date: null,
      next_maintenance_date: null,
      status: 'operational',
      description: null
    }
  });
  
  // Рестартираме формата при промяна на частта или отваряне/затваряне
  useEffect(() => {
    if (isOpen) {
      reset(part ? {
        name: part.name,
        part_number: part.part_number,
        manufacturer: part.manufacturer,
        installation_date: part.installation_date ? part.installation_date.split('T')[0] : null,
        last_maintenance_date: part.last_maintenance_date ? part.last_maintenance_date.split('T')[0] : null,
        next_maintenance_date: part.next_maintenance_date ? part.next_maintenance_date.split('T')[0] : null,
        status: part.status as any || 'operational',
        description: part.description
      } : {
        name: '',
        part_number: null,
        manufacturer: null,
        installation_date: null,
        last_maintenance_date: null,
        next_maintenance_date: null,
        status: 'operational',
        description: null
      });
    }
  }, [isOpen, part, reset]);
  
  // Обработчик на формата при изпращане
  const onSubmit = async (values: ElevatorPartFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (part) {
        // Редактираме съществуваща част
        const { data, error } = await supabase.rpc('update_elevator_part', {
          part_id_param: part.id,
          name_param: values.name,
          part_number_param: values.part_number || null,
          manufacturer_param: values.manufacturer || null,
          installation_date_param: values.installation_date || null,
          last_maintenance_date_param: values.last_maintenance_date || null,
          next_maintenance_date_param: values.next_maintenance_date || null,
          status_param: values.status,
          description_param: values.description || null
        });
        
        if (error) throw error;
        
        if (data && data.success) {
          toast.success('Частта е успешно обновена');
          onSuccess();
          onClose();
        } else {
          toast.error(data?.message || 'Грешка при обновяване на частта');
        }
      } else {
        // Добавяме нова част
        const { data, error } = await supabase.rpc('add_elevator_part', {
          elevator_id_param: elevatorId,
          name_param: values.name,
          part_number_param: values.part_number || null,
          manufacturer_param: values.manufacturer || null,
          installation_date_param: values.installation_date || null,
          last_maintenance_date_param: values.last_maintenance_date || null,
          next_maintenance_date_param: values.next_maintenance_date || null,
          status_param: values.status,
          description_param: values.description || null
        });
        
        if (error) throw error;
        
        if (data && data.success) {
          toast.success('Частта е успешно добавена');
          onSuccess();
          onClose();
        } else {
          toast.error(data?.message || 'Грешка при добавяне на частта');
        }
      }
    } catch (error: any) {
      console.error('Грешка при запазване на част:', error);
      toast.error(`Грешка: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-auto animate-fade-in">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {part ? 'Редактиране на част' : 'Добавяне на нова част'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Име на част *
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="part_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Партиден номер
                </label>
                <input
                  type="text"
                  id="part_number"
                  {...register('part_number')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Производител
                </label>
                <input
                  type="text"
                  id="manufacturer"
                  {...register('manufacturer')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="installation_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Дата на монтаж
                  </label>
                  <input
                    type="date"
                    id="installation_date"
                    {...register('installation_date')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="last_maintenance_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Последна поддръжка
                  </label>
                  <input
                    type="date"
                    id="last_maintenance_date"
                    {...register('last_maintenance_date')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="next_maintenance_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Следваща поддръжка
                  </label>
                  <input
                    type="date"
                    id="next_maintenance_date"
                    {...register('next_maintenance_date')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Статус
                </label>
                <select
                  id="status"
                  {...register('status')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="operational">Работеща</option>
                  <option value="needs_maintenance">Нуждае се от поддръжка</option>
                  <option value="defective">Дефектна</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Описание
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                ></textarea>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:hover:bg-gray-500"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Запазване...' : part ? 'Обнови' : 'Добави'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Компонент за списък с части на асансьор
interface ElevatorPartsListProps {
  elevatorId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ElevatorPartsList: React.FC<ElevatorPartsListProps> = ({ elevatorId, isOpen, onClose }) => {
  const [parts, setParts] = useState<ElevatorPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Състояния за управление на модалните прозорци
  const [partFormOpen, setPartFormOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<ElevatorPart | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<string | null>(null);
  
  // Зареждане на частите
  const fetchParts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_elevator_parts', {
        elevator_uuid: elevatorId
      });
      
      if (error) {
        console.error('Грешка при зареждане на части:', error);
        setError(`Грешка при зареждане: ${error.message}`);
        return;
      }
      
      if (data && data.success) {
        console.log('Части заредени успешно:', data.parts?.length || 0);
        setParts(data.parts || []);
      } else {
        setError(data?.message || 'Грешка при зареждане на части');
      }
    } catch (err) {
      console.error('Неочаквана грешка при зареждане на части:', err);
      setError('Неочаквана грешка при зареждане на части');
    } finally {
      setIsLoading(false);
    }
  }, [elevatorId]);
  
  useEffect(() => {
    if (isOpen && elevatorId) {
      fetchParts();
    }
  }, [isOpen, elevatorId, fetchParts]);
  
  // Обработчик на добавяне на част
  const handleAddPart = () => {
    setSelectedPart(null);
    setPartFormOpen(true);
  };
  
  // Обработчик на редактиране на част
  const handleEditPart = (part: ElevatorPart) => {
    setSelectedPart(part);
    setPartFormOpen(true);
  };
  
  // Обработчик на изтриване на част
  const handleDeletePart = (partId: string) => {
    setPartToDelete(partId);
    setConfirmDialogOpen(true);
  };
  
  // Потвърждаване на изтриването
  const confirmDeletePart = async () => {
    if (!partToDelete) return;
    
    try {
      const { data, error } = await supabase.rpc('delete_elevator_part', {
        part_id_param: partToDelete
      });
      
      if (error) {
        console.error('Грешка при изтриване на част:', error);
        toast.error(`Грешка при изтриване: ${error.message}`);
        return;
      }
      
      if (data && data.success) {
        toast.success('Частта е успешно изтрита');
        fetchParts();
      } else {
        toast.error(data?.message || 'Неуспешно изтриване на частта');
      }
    } catch (err: any) {
      console.error('Неочаквана грешка при изтриване на част:', err);
      toast.error(`Неочаквана грешка: ${err.message}`);
    } finally {
      setConfirmDialogOpen(false);
      setPartToDelete(null);
    }
  };
  
  // Отказ от изтриването
  const cancelDeletePart = () => {
    setConfirmDialogOpen(false);
    setPartToDelete(null);
  };
  
  // Форматиране на дата
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Не е зададена';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('bg-BG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return dateString;
    }
  };
  
  // Получаване на статус бадж
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Работеща</span>;
      case 'needs_maintenance':
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">Нуждае се от поддръжка</span>;
      case 'defective':
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Дефектна</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">Неизвестен</span>;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-auto animate-fade-in">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Части на асансьора</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAddPart}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Добави част
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : parts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Наименование
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Партиден номер
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Производител
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Дата на монтаж
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Последна поддръжка
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {parts.map((part) => (
                    <tr key={part.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {part.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {part.part_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {part.manufacturer || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {formatDate(part.installation_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {formatDate(part.last_maintenance_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(part.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <button
                          onClick={() => handleEditPart(part)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Редактирай
                        </button>
                        <button
                          onClick={() => handleDeletePart(part.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Изтрий
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Няма добавени части за този асансьор.
            </div>
          )}
          
          {/* Модален прозорец за добавяне/редактиране на част */}
          {partFormOpen && (
            <ElevatorPartForm
              elevatorId={elevatorId}
              part={selectedPart}
              isOpen={partFormOpen}
              onClose={() => {
                setPartFormOpen(false);
                setSelectedPart(null);
              }}
              onSuccess={fetchParts}
            />
          )}
          
          {/* Диалог за потвърждение при изтриване */}
          <ConfirmDialog
            isOpen={confirmDialogOpen}
            title="Потвърждение за изтриване"
            message="Сигурни ли сте, че искате да изтриете тази част? Това действие не може да бъде отменено."
            onConfirm={confirmDeletePart}
            onCancel={cancelDeletePart}
          />
        </div>
      </div>
    </div>
  );
};

// Компонент за списък с асансьори
const ElevatorList: React.FC = () => {
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [filteredElevators, setFilteredElevators] = useState<Elevator[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Променяме на false за избягване на ненужно първоначално зареждане
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedElevator, setSelectedElevator] = useState<Elevator | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Състояние за модалния диалог за потвърждение
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [elevatorToDelete, setElevatorToDelete] = useState<string | null>(null);
  
  // Състояние за модалния прозорец с частите
  const [partsModalOpen, setPartsModalOpen] = useState(false);
  const [selectedElevatorForParts, setSelectedElevatorForParts] = useState<string | null>(null);
  
  // Използваме глобалния контекст за потребителя
  const { user } = useAuth();

  // Настройка на формата за филтриране
  const { register, watch } = useForm<ElevatorFilterValues>({
    resolver: zodResolver(elevatorFilterSchema),
    defaultValues: {
      searchTerm: '',
      status: 'all'
    }
  });

  // Наблюдавани стойности от филтъра
  const searchTerm = watch('searchTerm');
  const statusFilter = watch('status');

  // Кеширане на данни
  const elevatorDataCache = React.useRef<{data: Elevator[] | null, timestamp: number}>({
    data: null,
    timestamp: 0
  });

  // Проверка дали кешът е актуален (валиден за 2 минути)
  const isCacheValid = useCallback(() => {
    return elevatorDataCache.current.data !== null && 
           (Date.now() - elevatorDataCache.current.timestamp) < 120000;
  }, []);

  // Зареждане на асансьорите с useCallback
  const fetchElevators = useCallback(async () => {
    // Проверка дали имаме кеширани данни
    if (isCacheValid()) {
      console.log("Използване на кеширани данни за асансьори");
      setElevators(elevatorDataCache.current.data!);
      setFilteredElevators(elevatorDataCache.current.data!);
      return;
    }
    
    // Не зареждаме, ако вече се зарежда
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Проверка дали имаме потребител
      if (!user) {
        console.log("Няма автентикиран потребител");
        setIsLoading(false);
        return;
      }
      
      console.log("Зареждане на асансьори за потребител:", user.id);
      
      // Проверка дали потребителят има профил
      if (!user.profile) {
        console.log("Изчакване профилните данни да се заредят");
        setIsLoading(false);
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
        setError(`Грешка при зареждане: ${error.message}`);
        setIsLoading(false);
        return;
      }
      
      if (!result || !result.data) {
        console.log('Няма данни за асансьори');
        setElevators([]);
        setFilteredElevators([]);
        setIsLoading(false);
        return;
      }
      
      console.log('Асансьори заредени успешно:', result.data.length);
      
      // Актуализираме кеша
      elevatorDataCache.current = {
        data: result.data,
        timestamp: Date.now()
      };
      
      // Обновяваме състоянието
      setElevators(result.data);
      setFilteredElevators(result.data);
      
    } catch (unexpectedError) {
      console.error('Неочаквана грешка при зареждане на асансьори:', unexpectedError);
      setError('Неочаквана грешка при зареждане на асансьори');
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading, isCacheValid]);
  
  // Функция за филтриране на асансьорите
  const applyFilters = useCallback(() => {
    if (!elevators || elevators.length === 0) return;
    
    // Прилагаме филтрите само ако има промяна в критериите
    // или ако имаме нови данни
    let filtered = [...elevators];
    
    // Филтриране по търсене
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        elevator => 
          elevator.serial_number.toLowerCase().includes(term) || 
          elevator.model.toLowerCase().includes(term)
      );
    }
    
    // Филтриране по статус
    if (statusFilter !== 'all') {
      filtered = filtered.filter(elevator => elevator.status === statusFilter);
    }
    
    // Обновяваме състоянието само ако има реална промяна
    setFilteredElevators(filtered);
  }, [elevators, searchTerm, statusFilter]);

  // Получаваме информация за достъпните асансьори
  const canManageElevators = user?.profile?.role === 'company' || user?.profile?.role === 'company_admin';

  // Зареждаме асансьорите само когато потребителят се промени
  // Това предотвратява ненужни презареждания
  useEffect(() => {
    if (user && user.profile) {
      fetchElevators();
    }
  }, [user, fetchElevators]);

  // Прилагаме филтрите при промяна на критериите
  useEffect(() => {
    if (elevators.length > 0) {
      applyFilters();
    }
  }, [elevators, searchTerm, statusFilter, applyFilters]);
  
  // Функция за зареждане на сгради
  const fetchBuildings = useCallback(async () => {
    try {
      if (!user || !user.profile) {
        console.log('Потребителят няма профил');
        return;
      }
      
      // Кратко съобщение за дебъгване
      console.log('Зареждане на сгради с RPC функция');
      
      // Извличаме ID на сградите от асансьорите
      const buildingIds = elevators
        .map(elevator => elevator.building_id)
        .filter((id): id is string => id !== null);
      
      // Извличаме ID на компанията на потребителя (ако е от компания)
      const companyIds = user.profile.company_id ? [user.profile.company_id] : [];
      
      // Използваме RPC функцията, която вече работи коректно
      const { data, error } = await supabase.rpc('get_buildings_for_elevators', {
        building_ids: buildingIds,
        company_ids: companyIds
      });
      
      if (error) {
        console.error('Грешка при зареждане на сградите:', error);
        return;
      }
      
      console.log(`Успешно заредени ${data?.length || 0} сгради`);
      setBuildings(data || []);
      
    } catch (err) {
      console.error('Неочаквана грешка при зареждане на сградите:', err);
    }
  }, [user, elevators]);

  // Зареждане при монтиране и промяна на потребителя или асансьорите
  useEffect(() => {
    if (user && user.profile && elevators.length > 0) {
      fetchBuildings();
    }
  }, [user, fetchBuildings, elevators]);
  
  // Обработчик за успешно добавяне/редактиране на асансьор
  const handleSuccess = useCallback(() => {
    // Изчистваме кеша при успешно обновяване
    elevatorDataCache.current = {
      data: null,
      timestamp: 0
    };
    fetchElevators();
  }, [fetchElevators]);
  
  // Обработка на изтриване
  const handleDelete = async (id: string) => {
    // Запазваме ID на асансьора, който ще се изтрива и отваряме диалога
    setElevatorToDelete(id);
    setConfirmDialogOpen(true);
  };
  
  // Потвърждаване на изтриването
  const confirmDelete = async () => {
    if (!elevatorToDelete) return;
    
    try {
      const { error } = await supabase
        .from('elevators')
        .delete()
        .eq('id', elevatorToDelete);
        
      if (error) {
        console.error('Грешка при изтриване на асансьор:', error);
        toast.error(`Грешка при изтриване: ${error.message}`);
        return;
      }
      
      toast.success('Асансьорът е успешно изтрит');
      fetchElevators();
    } catch (err: any) {
      console.error('Грешка при изтриване на асансьор:', err);
      toast.error(`Неочаквана грешка: ${err.message}`);
    } finally {
      // Затваряме диалога и изчистваме ID-то
      setConfirmDialogOpen(false);
      setElevatorToDelete(null);
    }
  };
  
  // Отказ от изтриването
  const cancelDelete = () => {
    setConfirmDialogOpen(false);
    setElevatorToDelete(null);
  };
  
  // Обработка на редактиране
  const handleEdit = (elevator: Elevator) => {
    setSelectedElevator(elevator);
    setIsModalOpen(true);
  };
  
  // Обработка на добавяне
  const handleAdd = () => {
    setSelectedElevator(null);
    setIsModalOpen(true);
  };
  
  // Получаване на стилизирани бадж според статуса
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Работещ</span>;
      case 'maintenance':
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">В поддръжка</span>;
      case 'out_of_order':
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Неизправен</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">Неизвестен</span>;
    }
  };
  
  // Форматиране на дата
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Не е зададена';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('bg-BG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return dateString;
    }
  };
  
  // Получаване на информация за сградата
  const getBuildingName = (buildingId: string | null) => {
    if (!buildingId) return 'Несвързан с сграда';
    
    // Проверка дали сградите са заредени
    if (buildings.length === 0) {
      // Сградите трябва да се заредят от useEffect, а не оттук
      return 'Зареждане на данни...';
    }
    
    const building = buildings.find(b => b.id === buildingId);
    
    if (building) {
      return building.name;
    } else {
      // Показваме полезна информация и ID-то на сградата
      return `Сграда (${buildingId.substring(0, 8)}...)`;
    }
  };

  // Функция за отваряне на модалния прозорец с частите
  const handleViewParts = (elevatorId: string) => {
    setSelectedElevatorForParts(elevatorId);
    setPartsModalOpen(true);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Управление на асансьори</h2>
        
        {canManageElevators && (
          <button
            onClick={handleAdd}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Добави асансьор
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Филтри</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="searchTerm" className="block text-sm text-gray-700 dark:text-gray-300">
              Търсене
            </label>
            <input
              id="searchTerm"
              type="text"
              {...register('searchTerm')}
              placeholder="Търсене по сериен номер или модел"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm text-gray-700 dark:text-gray-300">
              Статус
            </label>
            <select
              id="status"
              {...register('status')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            >
              <option value="all">Всички</option>
              <option value="operational">Работещи</option>
              <option value="maintenance">В поддръжка</option>
              <option value="out_of_order">Неизправни</option>
            </select>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        filteredElevators.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Сериен номер
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Модел
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Сграда
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Капацитет
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Последна инспекция
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Следваща инспекция
                  </th>
                  {canManageElevators && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Действия
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {filteredElevators.map((elevator) => (
                  <tr key={elevator.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {elevator.serial_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {elevator.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {getBuildingName(elevator.building_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {elevator.capacity} кг
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(elevator.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {formatDate(elevator.last_inspection_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {formatDate(elevator.next_inspection_date)}
                    </td>
                    {canManageElevators && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <button
                          onClick={() => handleViewParts(elevator.id)}
                          className="text-blue-600 hover:text-blue-900 mr-4 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Части
                        </button>
                        <button
                          onClick={() => handleEdit(elevator)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Редактирай
                        </button>
                        <button
                          onClick={() => handleDelete(elevator.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Изтрий
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {elevators.length > 0 
              ? 'Няма намерени асансьори, отговарящи на критериите.' 
              : canManageElevators
                ? 'Няма добавени асансьори. Добавете първия си асансьор от бутона по-горе.'
                : 'Нямате достъп до асансьори или няма добавени асансьори в системата.'}
          </div>
        )
      )}
      
      {isModalOpen && (
        <ElevatorForm
          elevator={selectedElevator}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
      
      {/* Диалог за потвърждение при изтриване */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        title="Потвърждение за изтриване"
        message="Сигурни ли сте, че искате да изтриете този асансьор? Това действие не може да бъде отменено."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      
      {/* Модален прозорец с частите на асансьора */}
      {partsModalOpen && selectedElevatorForParts && (
        <ElevatorPartsList 
          elevatorId={selectedElevatorForParts}
          isOpen={partsModalOpen}
          onClose={() => {
            setPartsModalOpen(false);
            setSelectedElevatorForParts(null);
          }}
        />
      )}
    </div>
  );
};

export default ElevatorList; 