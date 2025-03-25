import { z } from 'zod';

// Константи за валидация
const MIN_VALID_DATE = new Date('2000-01-01'); // Най-стара допустима дата

// Функции за валидация на дати
const validateNotFutureDate = (date: Date) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Края на деня
  return date <= today;
};

const validateFutureDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Началото на деня
  return date >= today;
};

// Схема за валидация на формата за асансьори с допълнителни полета за сградата
export const elevatorFormSchema = z.object({
  // Полета за сградата
  building_id: z.string().uuid('Трябва да е валиден UUID').or(z.literal('')),
  building_name: z.string().min(2, 'Името на сградата трябва да е поне 2 символа'),
  building_address: z.string().min(5, 'Адресът трябва да е поне 5 символа'),
  
  // Полета за асансьора
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
    // Ако е избрана съществуваща сграда, не изискваме име и адрес
    if (data.building_id && data.building_id.length > 0) {
      return true;
    }
    // Иначе проверяваме дали има име и адрес
    return data.building_name.length >= 2 && data.building_address.length >= 5;
  },
  {
    message: "Трябва да изберете съществуваща сграда или да въведете данни за нова",
    path: ["building_id"],
  }
).refine(
  (data) => {
    // Проверка дали next_inspection_date е след last_inspection_date
    return data.next_inspection_date > data.last_inspection_date;
  },
  {
    message: 'Датата на следваща инспекция трябва да бъде след датата на последна инспекция',
    path: ['next_inspection_date'],
  }
);

// Тип, извлечен от схемата
export type ElevatorFormValues = z.infer<typeof elevatorFormSchema>;

// Функция за форматиране на дата за input полето
export const formatDateForInput = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  // Форматиране на датата във формат YYYY-MM-DD
  return date.toISOString().split('T')[0];
}; 