import { z } from 'zod';
import type { Database } from '../lib/database.types';

// Константи за валидация
const MIN_VALID_DATE = new Date('2000-01-01'); // Най-стара допустима дата
const MAX_DAYS_INSPECTION_PERIOD = 365 * 2; // Максимален период между инспекции (2 години)

// Функция за валидация на датата - не трябва да е по-нова от днес
const validateNotFutureDate = (date: Date) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Края на деня
  return date <= today;
};

// Функция за валидация на бъдеща дата - трябва да е след днес
const validateFutureDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Началото на деня
  return date >= today;
};

// Функция за валидация на периода между инспекции
const validateInspectionPeriod = (nextDate: Date, lastDate: Date) => {
  const daysDiff = Math.floor((nextDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > 0 && daysDiff <= MAX_DAYS_INSPECTION_PERIOD;
};

// Извличане на типовете за асансьор от database.types.ts
export type Elevator = Database['public']['Tables']['elevators']['Row'];
export type InsertElevator = Database['public']['Tables']['elevators']['Insert'];
export type UpdateElevator = Database['public']['Tables']['elevators']['Update'];

// Създаване на схема за валидация въз основа на типовете
export const elevatorSchema = z.object({
  building_id: z.string().min(1, { message: 'Сградата е задължителна' }),

  serial_number: z.string()
    .min(2, { message: 'Серийният номер трябва да съдържа поне 2 символа' })
    .max(50, { message: 'Серийният номер не може да надвишава 50 символа' })
    .trim()
    .refine(val => val.length > 0, { message: 'Серийният номер не може да съдържа само интервали' }),

  model: z.string()
    .min(2, { message: 'Моделът трябва да съдържа поне 2 символа' })
    .max(100, { message: 'Моделът не може да надвишава 100 символа' })
    .trim()
    .refine(val => val.length > 0, { message: 'Моделът не може да съдържа само интервали' }),

  capacity: z.number()
    .min(1, { message: 'Капацитетът трябва да е положително число' })
    .max(5000, { message: 'Капацитетът не може да надвишава 5000 кг' })
    .refine(val => !isNaN(val), { message: 'Моля, въведете валидно число' })
    .refine(val => Number.isFinite(val), { message: 'Стойността е извън допустимите граници' }),

  installation_date: z.coerce.date({ 
    required_error: 'Датата на инсталация е задължителна',
    invalid_type_error: 'Невалидна дата на инсталация'
  })
    .refine(date => date >= MIN_VALID_DATE, {
      message: `Датата не може да бъде преди ${MIN_VALID_DATE.toLocaleDateString('bg-BG')}`
    })
    .refine(validateNotFutureDate, {
      message: 'Датата на инсталация не може да бъде в бъдещето'
    }),

  last_inspection_date: z.coerce.date({ 
    required_error: 'Датата на последна инспекция е задължителна',
    invalid_type_error: 'Невалидна дата на последна инспекция'
  })
    .refine(date => date >= MIN_VALID_DATE, {
      message: `Датата не може да бъде преди ${MIN_VALID_DATE.toLocaleDateString('bg-BG')}`
    })
    .refine(validateNotFutureDate, {
      message: 'Датата на последна инспекция не може да бъде в бъдещето'
    }),

  next_inspection_date: z.coerce.date({ 
    required_error: 'Датата на следваща инспекция е задължителна',
    invalid_type_error: 'Невалидна дата на следваща инспекция'
  })
    .refine(validateFutureDate, {
      message: 'Датата на следваща инспекция трябва да бъде в бъдещето'
    }),

  status: z.enum(['operational', 'maintenance', 'out_of_order'], {
    errorMap: () => ({ message: 'Невалиден статус' }),
  }).default('operational'),
}).refine(
  (data) => {
    // Проверка дали next_inspection_date е след last_inspection_date
    return data.next_inspection_date > data.last_inspection_date;
  },
  {
    message: 'Датата на следваща инспекция трябва да бъде след датата на последна инспекция',
    path: ['next_inspection_date'],
  }
).refine(
  (data) => {
    // Проверка за максимален период между инспекциите
    return validateInspectionPeriod(data.next_inspection_date, data.last_inspection_date);
  },
  {
    message: `Периодът между инспекциите не може да надвишава ${MAX_DAYS_INSPECTION_PERIOD / 365} години`,
    path: ['next_inspection_date'],
  }
);

export type ElevatorFormValues = z.infer<typeof elevatorSchema>;

// Схема за филтриране на асансьори
export const elevatorFilterSchema = z.object({
  searchTerm: z.string().optional(),
  status: z.enum(['all', 'operational', 'maintenance', 'out_of_order']).default('all'),
});

// Помощни константи за превод на статусите
export const ELEVATOR_STATUSES = {
  operational: 'В експлоатация',
  maintenance: 'В поддръжка',
  out_of_order: 'Извън експлоатация'
};

export type ElevatorFilterValues = z.infer<typeof elevatorFilterSchema>; 