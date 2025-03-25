import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import type { Database } from '../../lib/database.types';
import { maintenanceFilterSchema, MaintenanceFilterValues } from '../../schemas/maintenanceSchema';
import MaintenanceForm from '../../components/dashboard/MaintenanceForm';

// Типове данни
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

// Тип, който включва релационните данни от заявката
type MaintenanceWithRelations = MaintenanceRecord & {
  elevators?: {
    id: string;
    serial_number: string;
    model: string;
    status: string;
  };
  profiles?: {
    id: string;
    full_name: string;
    company_id: string;
  };
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

// Компонент за диалог за потвърждение при изтриване
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 max-w-md w-full rounded-lg p-6 shadow-xl animate-fade-in">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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

// Основен компонент за поддръжка
const MaintenanceDashboard: React.FC = () => {
  // Състояния за данни
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceWithRelations[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceWithRelations[]>([]);
  const [elevatorOptions, setElevatorOptions] = useState<Elevator[]>([]);
  const [technicianOptions, setTechnicianOptions] = useState<Technician[]>([]);
  const [buildingOptions, setBuildingOptions] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceWithRelations | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<MaintenanceWithRelations | null>(null);
  
  // Използваме контекста за потребителя
  const { user } = useAuth();

  // Настройка на формата за филтриране
  const { register, reset, watch } = useForm<MaintenanceFilterValues>({
    resolver: zodResolver(maintenanceFilterSchema),
    defaultValues: {
      searchTerm: '',
      maintenanceType: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      technicianId: '',
      elevatorId: '',
    },
  });

  // Добавяме кеш за данните
  const maintenanceCache = React.useRef<{data: any[] | null, timestamp: number}>({
    data: null,
    timestamp: 0
  });

  // Добавяме кеш за грешки при търсене на сгради, за да предотвратим многократно логване на едни и същи съобщения
  const buildingErrorsCache = React.useRef<Set<string>>(new Set());
  
  // Флаг указващ, че инициалното зареждане е завършило
  const initialLoadDone = React.useRef<boolean>(false);

  // Логика за зареждане на поддръжки с кеширане
  const fetchMaintenanceData = useCallback(async () => {
    // Проверка на кеша (валиден за 2 минути)
    if (maintenanceCache.current.data !== null && 
        (Date.now() - maintenanceCache.current.timestamp) < 120000) {
      console.log("Използване на кеширани данни за поддръжки");
      setMaintenanceRecords(maintenanceCache.current.data);
      setFilteredRecords(maintenanceCache.current.data);
      return;
    }

    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user) {
        console.log("Няма автентикиран потребител");
        setIsLoading(false);
        return;
      }
      
      if (!user.profile) {
        console.log("Изчакване профилните данни да се заредят");
        setIsLoading(false);
        return;
      }
      
      console.log("Зареждане на записи за поддръжка от таблица maintenance_records");
      
      // Използваме основна заявка без JOIN, за да избегнем проблеми с релациите
      let query = supabase.from('maintenance_records').select('*');
      
      // Филтриране според ролята
      if (user.profile.role === 'company' || user.profile.role === 'company_admin') {
        query = query.eq('company_id', user.profile.company_id);
      } else if (user.profile.role === 'technician') {
        query = query.eq('technician_id', user.id);
      } else {
        // Други роли нямат достъп до данни за поддръжка
        setMaintenanceRecords([]);
        setFilteredRecords([]);
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Грешка при зареждане на поддръжки:', error);
        setError(`Грешка при зареждане: ${error.message}`);
        setIsLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log("Няма намерени записи за поддръжка");
        setMaintenanceRecords([]);
        setFilteredRecords([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`Заредени ${data.length} записа за поддръжка`);
      
      // Запазваме в кеша
      maintenanceCache.current = {
        data,
        timestamp: Date.now()
      };
      
      // Задаваме данните
      setMaintenanceRecords(data);
      setFilteredRecords(data);
    } catch (err) {
      console.error('Неочаквана грешка при зареждане на поддръжки:', err);
      setError('Възникна неочаквана грешка. Моля, опитайте отново.');
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading]);

  // Извличане на асансьори с кеширане
  const fetchElevators = useCallback(async () => {
    try {
      if (!user?.profile) return;
      
      // Запитване според ролята на потребителя
      let query = supabase.from('elevators').select('*');
      
      if (user.profile.role === 'company' || user.profile.role === 'company_admin') {
        query = query.eq('company_id', user.profile.company_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Грешка при зареждане на асансьори:', error);
        return;
      }
      
      setElevatorOptions(data || []);
    } catch (err) {
      console.error('Неочаквана грешка при зареждане на асансьори:', err);
    }
  }, [user]);

  // Извличане на техници
  const fetchTechnicians = useCallback(async () => {
    try {
      if (!user?.profile) return;
      
      // Използваме таблицата technicians вместо profiles
      let query = supabase.from('technicians').select('*');
      
      if (user.profile.role === 'company' || user.profile.role === 'company_admin') {
        query = query.eq('company_id', user.profile.company_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Грешка при извличане на техници:', error);
        return;
      }
      
      setTechnicianOptions(data || []);
    } catch (err) {
      console.error('Грешка при извличане на техници:', err);
    }
  }, [user]);

  // Извличане на сгради - зареждаме всички сгради без ограничение за компания
  const fetchBuildings = useCallback(async () => {
    try {
      // Зареждане на всички сгради за избягване на проблеми с релационни данни
      const { data, error } = await supabase.from('buildings').select('*');
      
      if (error) {
        console.error('Грешка при извличане на сградите:', error);
        return;
      }
      
      console.log(`Заредени ${data.length} сгради`);
      setBuildingOptions(data || []);
    } catch (err) {
      console.error('Грешка при извличане на сградите:', err);
    }
  }, []);

  // Филтриране на записи за поддръжка
  const handleFilter = (data: MaintenanceFilterValues) => {
    let filtered = [...maintenanceRecords];

    // Филтриране по текст за търсене
    if (data.searchTerm) {
      const searchTermLower = data.searchTerm.toLowerCase();
      filtered = filtered.filter((record) => {
        // Извличане на данни за асансьора
        const elevator = elevatorOptions.find((e) => e.id === record.elevator_id);
        // Извличане на данни за техника
        const technician = technicianOptions.find((t) => t.id === record.technician_id);
        // Извличане на данни за сградата
        const building = elevator
          ? buildingOptions.find((b) => b.id === elevator.building_id)
          : null;

        return (
          record.description.toLowerCase().includes(searchTermLower) ||
          (record.parts_replaced &&
            record.parts_replaced.toLowerCase().includes(searchTermLower)) ||
          (elevator && elevator.serial_number.toLowerCase().includes(searchTermLower)) ||
          (elevator && elevator.model.toLowerCase().includes(searchTermLower)) ||
          (technician &&
            `${technician.first_name} ${technician.last_name}`
              .toLowerCase()
              .includes(searchTermLower)) ||
          (building && building.name.toLowerCase().includes(searchTermLower)) ||
          (building && building.address.toLowerCase().includes(searchTermLower))
        );
      });
    }

    // Филтриране по тип на поддръжката
    if (data.maintenanceType) {
      filtered = filtered.filter(
        (record) => record.maintenance_type === data.maintenanceType
      );
    }

    // Филтриране по дата от
    if (data.dateFrom) {
      filtered = filtered.filter(
        (record) =>
          new Date(record.maintenance_date) >= new Date(data.dateFrom as Date)
      );
    }

    // Филтриране по дата до
    if (data.dateTo) {
      filtered = filtered.filter(
        (record) => new Date(record.maintenance_date) <= new Date(data.dateTo as Date)
      );
    }

    // Филтриране по техник
    if (data.technicianId) {
      filtered = filtered.filter(
        (record) => record.technician_id === data.technicianId
      );
    }

    // Филтриране по асансьор
    if (data.elevatorId) {
      filtered = filtered.filter((record) => record.elevator_id === data.elevatorId);
    }

    setFilteredRecords(filtered);
  };

  // Ресетиране на филтрите
  const handleResetFilters = () => {
    reset({
      searchTerm: '',
      maintenanceType: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      technicianId: '',
      elevatorId: '',
    });
    setFilteredRecords(maintenanceRecords);
  };

  // Отваряне на формата за добавяне на нов запис
  const handleAddNew = () => {
    setSelectedRecord(null);
    setIsFormOpen(true);
  };

  // Отваряне на формата за редактиране на съществуващ запис
  const handleEdit = (record: MaintenanceWithRelations) => {
    setSelectedRecord(record);
    setIsFormOpen(true);
  };

  // Отваряне на диалога за потвърждение при изтриване
  const handleDeleteConfirm = (record: MaintenanceWithRelations) => {
    setConfirmDialogOpen(true);
    setRecordToDelete(record);
  };

  // Изтриване на запис
  const handleDelete = async () => {
    if (!recordToDelete) return;

    try {
      const { error } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('id', recordToDelete.id);

      if (error) {
        console.error('Грешка при изтриване на запис:', error);
        toast.error(`Грешка при изтриване: ${error.message}`);
        return;
      }

      // Актуализиране на списъка след изтриване
      setMaintenanceRecords(
        maintenanceRecords.filter((record) => record.id !== recordToDelete.id)
      );
      setFilteredRecords(
        filteredRecords.filter((record) => record.id !== recordToDelete.id)
      );

      toast.success('Записът е успешно изтрит');
    } catch (err: any) {
      console.error('Грешка при изтриване на запис:', err);
      toast.error(`Възникна грешка: ${err.message}`);
    } finally {
      // Затваряне на диалога за потвърждение
      setConfirmDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  // Форматиране на дата
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG');
  };

  // Получаване на име на асансьор
  const getElevatorInfo = useCallback((elevatorId: string) => {
    const elevator = elevatorOptions.find((e) => e.id === elevatorId);
    if (!elevator) {
      const errorKey = `missing_elevator_${elevatorId}`;
      if (!buildingErrorsCache.current.has(errorKey)) {
        console.log(`Не е намерен асансьор с ID: ${elevatorId}`);
        buildingErrorsCache.current.add(errorKey);
      }
      return 'Непознат асансьор';
    }

    const building = buildingOptions.find((b) => b.id === elevator.building_id);
    
    // Ако сградата не е намерена, показваме само данните на асансьора
    if (!building) {
      const errorKey = `missing_building_for_elevator_${elevator.serial_number}`;
      if (!buildingErrorsCache.current.has(errorKey)) {
        console.log(`Не е намерена сграда за асансьор ${elevator.serial_number} (building_id: ${elevator.building_id})`);
        buildingErrorsCache.current.add(errorKey);
      }
      return `Асансьор ${elevator.serial_number} (${elevator.model})`;
    }
    
    // Връщаме комбинирана информация за сградата и асансьора
    return `${building.name} - ${elevator.serial_number}`;
  }, [elevatorOptions, buildingOptions]);

  // Получаване на име на техник
  const getTechnicianName = useCallback((technicianId: string) => {
    const technician = technicianOptions.find((t) => t.id === technicianId);
    if (!technician) {
      const errorKey = `missing_technician_${technicianId}`;
      if (!buildingErrorsCache.current.has(errorKey)) {
        console.log(`Не е намерен техник с ID: ${technicianId}`);
        buildingErrorsCache.current.add(errorKey);
      }
      return 'Непознат техник';
    }

    return `${technician.first_name} ${technician.last_name}`;
  }, [technicianOptions]);

  // Получаване на тип на поддръжката
  const getMaintenanceTypeName = (type: string) => {
    const types: Record<string, string> = {
      regular: 'Планова',
      emergency: 'Аварийна',
      inspection: 'Инспекция',
      repair: 'Ремонт',
    };

    return types[type] || type;
  };

  // Филтър за наблюдение на промените в полетата
  const watchedFilters = watch();

  // Прилагане на филтри автоматично при промяна
  useEffect(() => {
    // Предотвратяваме изпълнение при първоначално зареждане с празни филтри
    const isEmpty = Object.values(watchedFilters).every(
      value => value === '' || value === undefined || value === null
    );
    
    // Прилагаме филтрите само ако има активни филтри или ако масивът с данни се е променил
    if (!isEmpty || maintenanceRecords.length > 0) {
      handleFilter(watchedFilters);
    }
  }, [
    watchedFilters.searchTerm,
    watchedFilters.maintenanceType,
    watchedFilters.dateFrom,
    watchedFilters.dateTo, 
    watchedFilters.technicianId,
    watchedFilters.elevatorId
  ]);

  // Отделен useEffect за актуализиране на филтрираните записи при промяна на основните данни
  useEffect(() => {
    setFilteredRecords(maintenanceRecords);
  }, [maintenanceRecords]);

  // Функция за нулиране на филтрите
  const resetMaintenanceCache = useCallback(() => {
    maintenanceCache.current = {
      data: null,
      timestamp: 0
    };
  }, []);

  // Обработчик за успешно добавяне/редактиране/изтриване
  const handleSuccess = useCallback(() => {
    resetMaintenanceCache();
    fetchMaintenanceData();
  }, [fetchMaintenanceData, resetMaintenanceCache]);

  // Общо зареждане на всички данни
  useEffect(() => {
    if (user && user.profile && !initialLoadDone.current) {
      // Предотвратяваме многократни зареждания
      console.log("Започва първоначално зареждане на данните");
      
      // Изрично изпълняваме заявките и обработваме резултатите
      const loadData = async () => {
        setIsLoading(true);
        try {
          initialLoadDone.current = true;
          
          // Първо зареждаме справочните данни паралелно
          await Promise.all([
            fetchBuildings(),
            fetchElevators(),
            fetchTechnicians()
          ]);
          
          // След това зареждаме записите за поддръжка
          await fetchMaintenanceData();
        } catch (err) {
          console.error('Грешка при зареждане на данните:', err);
          setError('Възникна грешка при зареждане на данните. Моля, опитайте отново.');
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    }
  }, [user, fetchMaintenanceData, fetchElevators, fetchTechnicians, fetchBuildings]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Филтри */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Филтри</h3>
          <button
            onClick={handleResetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Изчисти филтрите
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Търсене */}
          <div>
            <label
              htmlFor="searchTerm"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Търсене
            </label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Търсене..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              {...register('searchTerm')}
            />
          </div>

          {/* Тип на поддръжката */}
          <div>
            <label
              htmlFor="maintenanceType"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Тип на поддръжката
            </label>
            <select
              id="maintenanceType"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              {...register('maintenanceType')}
            >
              <option value="">Всички типове</option>
              <option value="regular">Планова</option>
              <option value="emergency">Аварийна</option>
              <option value="inspection">Инспекция</option>
              <option value="repair">Ремонт</option>
            </select>
          </div>

          {/* Техник */}
          <div>
            <label
              htmlFor="technicianId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Техник
            </label>
            <select
              id="technicianId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              {...register('technicianId')}
            >
              <option value="">Всички техници</option>
              {technicianOptions.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.first_name} {technician.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Асансьор */}
          <div>
            <label
              htmlFor="elevatorId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Асансьор
            </label>
            <select
              id="elevatorId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              {...register('elevatorId')}
            >
              <option value="">Всички асансьори</option>
              {elevatorOptions.map((elevator) => (
                <option key={elevator.id} value={elevator.id}>
                  {getElevatorInfo(elevator.id)}
                </option>
              ))}
            </select>
          </div>

          {/* Дата от */}
          <div>
            <label
              htmlFor="dateFrom"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Дата от
            </label>
            <input
              type="date"
              id="dateFrom"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              {...register('dateFrom')}
            />
          </div>

          {/* Дата до */}
          <div>
            <label
              htmlFor="dateTo"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Дата до
            </label>
            <input
              type="date"
              id="dateTo"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              {...register('dateTo')}
            />
          </div>
        </div>
      </div>

      {/* Бутон за добавяне */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Записи за поддръжка ({filteredRecords.length})
        </h2>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Добави нов запис
        </button>
      </div>

      {/* Съобщение за грешка */}
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md dark:bg-red-900/30 dark:text-red-300 mb-4">
          {error}
        </div>
      )}

      {/* Таблица с данни */}
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          {maintenanceRecords.length === 0
            ? 'Все още няма записи за поддръжка. Добавете първия!'
            : 'Няма намерени записи, отговарящи на зададените филтри.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Асансьор
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Техник
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Тип
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Описание
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Сума (лв.)
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(record.maintenance_date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {getElevatorInfo(record.elevator_id)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {getTechnicianName(record.technician_id)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {getMaintenanceTypeName(record.maintenance_type)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                    {record.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {record.cost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(record)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                    >
                      Редактирай
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(record)}
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
      )}

      {/* Форма за добавяне/редактиране */}
      <MaintenanceForm
        maintenanceRecord={selectedRecord}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* Диалог за потвърждение при изтриване */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        title="Потвърдете изтриването"
        message="Сигурни ли сте, че искате да изтриете този запис за поддръжка? Това действие не може да бъде отменено."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDialogOpen(false)}
      />
    </div>
  );
};

export default MaintenanceDashboard; 