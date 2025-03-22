import { z } from 'zod';

// Базова схема
const baseSchema = z.object({
  email: z.string().email('Невалиден имейл адрес'),
  password: z.string().min(6, 'Паролата трябва да бъде поне 6 символа'),
  confirmPassword: z.string(),
  role: z.enum(['company', 'technician', 'building_manager']),
  fullName: z.string().min(2, 'Името трябва да бъде поне 2 символа'),
  phone: z.string().regex(/^[0-9+\s-]{10,}$/, 'Невалиден телефонен номер'),
  
  // Полета за компании
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  taxId: z.string().optional(),
  
  // Полета за техници
  specialization: z.string().optional(),
  experience: z.string().optional(),
  additionalInfo: z.string().optional(),
  
  // Полета за управители
  buildingAddress: z.string().optional(),
  apartmentsCount: z.string().optional(),
  buildingInfo: z.string().optional(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Паролите не съвпадат",
    path: ["confirmPassword"],
  }
).refine(
  (data) => {
    if (data.role === 'company') {
      return !!data.companyName && !!data.companyAddress && !!data.taxId;
    }
    return true;
  },
  {
    message: "Задължителни полета за фирма",
    path: ["companyName"],
  }
).refine(
  (data) => {
    if (data.role === 'company' && data.taxId) {
      return /^[0-9]{9,13}$/.test(data.taxId);
    }
    return true;
  },
  {
    message: "Невалиден ЕИК/Булстат",
    path: ["taxId"],
  }
).refine(
  (data) => {
    if (data.role === 'technician') {
      return !!data.specialization && !!data.experience;
    }
    return true;
  },
  {
    message: "Задължителни полета за техник",
    path: ["specialization"],
  }
).refine(
  (data) => {
    if (data.role === 'technician' && data.experience) {
      return /^[0-9]+$/.test(data.experience);
    }
    return true;
  },
  {
    message: "Въведете валиден брой години",
    path: ["experience"],
  }
).refine(
  (data) => {
    if (data.role === 'building_manager') {
      return !!data.buildingAddress && !!data.apartmentsCount;
    }
    return true;
  },
  {
    message: "Задължителни полета за управител",
    path: ["buildingAddress"],
  }
).refine(
  (data) => {
    if (data.role === 'building_manager' && data.apartmentsCount) {
      return /^[0-9]+$/.test(data.apartmentsCount);
    }
    return true;
  },
  {
    message: "Въведете валиден брой апартаменти",
    path: ["apartmentsCount"],
  }
);

export const registerSchema = baseSchema;
export type RegisterFormData = z.infer<typeof registerSchema>; 