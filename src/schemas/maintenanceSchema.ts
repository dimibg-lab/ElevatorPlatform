import { z } from 'zod';

// Константи за валидация
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_PARTS_LENGTH = 500;
const MAX_COST = 1000000; // 1 милион лева като максимална стойност
const MIN_MAINTENANCE_DATE = new Date('2000-01-01'); // Най-стара допустима дата

// Функция за валидация на датата - не трябва да е по-нова от днес
const validateNotFutureDate = (date: Date) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Края на деня
  return date <= today;
};

// Схема за валидация на форма за поддръжка
export const maintenanceSchema = z.object({
  id: z.string().uuid('Невалиден идентификатор').optional(),
  
  elevator_id: z.string()
    .min(1, { message: 'Полето е задължително' })
    .uuid({ message: 'Моля, изберете валиден асансьор' }),
  
  technician_id: z.string()
    .min(1, { message: 'Полето е задължително' })
    .uuid({ message: 'Моля, изберете валиден техник' }),
  
  maintenance_type: z.enum(['regular', 'emergency', 'inspection', 'repair'], { 
    required_error: 'Изберете тип на поддръжката',
    invalid_type_error: 'Невалиден тип на поддръжката'
  }).refine(value => value !== undefined, {
    message: 'Полето е задължително'
  }),
  
  description: z.string()
    .min(5, { message: 'Описанието трябва да бъде поне 5 символа' })
    .max(MAX_DESCRIPTION_LENGTH, { 
      message: `Описанието не може да бъде по-дълго от ${MAX_DESCRIPTION_LENGTH} символа` 
    })
    .trim()
    .refine(val => val.length > 0, { 
      message: 'Описанието не може да съдържа само интервали' 
    }),
  
  parts_replaced: z.string()
    .max(MAX_PARTS_LENGTH, { 
      message: `Описанието на частите не може да бъде по-дълго от ${MAX_PARTS_LENGTH} символа` 
    })
    .optional()
    .transform(val => val === '' ? undefined : val)
    .nullable(),
  
  cost: z.coerce.number({ 
    required_error: 'Въведете сума',
    invalid_type_error: 'Сумата трябва да бъде число' 
  })
    .min(0, { message: 'Сумата не може да бъде отрицателна' })
    .max(MAX_COST, { message: `Сумата не може да надвишава ${MAX_COST.toLocaleString('bg-BG')} лв.` })
    .refine(val => !isNaN(val), { message: 'Моля, въведете валидно число' })
    .refine(val => Number.isFinite(val), { message: 'Стойността е извън допустимите граници' }),
  
  maintenance_date: z.coerce.date({ 
    required_error: 'Моля, въведете дата на поддръжката',
    invalid_type_error: 'Невалидна дата'
  })
    .refine(date => date >= MIN_MAINTENANCE_DATE, {
      message: `Датата не може да бъде преди ${MIN_MAINTENANCE_DATE.toLocaleDateString('bg-BG')}`
    })
    .refine(validateNotFutureDate, {
      message: 'Датата не може да бъде в бъдещето'
    }),
  
  service_request_id: z.string()
    .uuid('Невалиден идентификатор на заявка')
    .optional()
    .nullable()
    .transform(val => val === '' ? null : val),
  
  company_id: z.string()
    .uuid('Невалиден идентификатор на компания')
    .optional(), // Автоматично определено от elevator_id
  
  updated_at: z.date().optional(), // За автоматично обновяване
  created_at: z.date().optional(), // За автоматично създаване
}).refine(
  data => {
    // Ако е избран service_request_id, уверяваме се, че maintenance_type е подходящ
    if (data.service_request_id && data.maintenance_type === 'regular') {
      return false;
    }
    return true;
  },
  {
    message: 'За заявка за обслужване, типът на поддръжката не може да бъде планова',
    path: ['maintenance_type']
  }
);

// Тип, извлечен от схемата
export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

// Функция за форматиране на дата към ISO string без часова зона
export const formatDateForSubmit = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Константи за видовете поддръжка на български
export const MAINTENANCE_TYPES = {
  regular: 'Планова',
  emergency: 'Аварийна',
  inspection: 'Инспекция',
  repair: 'Ремонт'
};

// Схема за филтриране на поддръжка
export const maintenanceFilterSchema = z.object({
  searchTerm: z.string().optional(),
  
  maintenanceType: z.enum(['regular', 'emergency', 'inspection', 'repair', ''])
    .optional()
    .transform(val => val === '' ? undefined : val),
    
  dateFrom: z.coerce.date().optional()
    .transform(val => val instanceof Date && !isNaN(val.getTime()) ? val : undefined),
    
  dateTo: z.coerce.date().optional()
    .transform(val => val instanceof Date && !isNaN(val.getTime()) ? val : undefined),
    
  technicianId: z.string().optional()
    .transform(val => val === '' ? undefined : val),
    
  elevatorId: z.string().optional()
    .transform(val => val === '' ? undefined : val),
}).refine(
  data => {
    // Ако имаме dateFrom и dateTo, уверяваме се, че dateTo е след dateFrom
    if (data.dateFrom && data.dateTo && data.dateTo < data.dateFrom) {
      return false;
    }
    return true;
  },
  {
    message: 'Крайната дата трябва да бъде след началната дата',
    path: ['dateTo']
  }
);

// Тип за филтриране
export type MaintenanceFilterValues = z.infer<typeof maintenanceFilterSchema>; 