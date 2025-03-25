import { z } from 'zod'

// Константи за валидация
const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 100
const MIN_PHONE_LENGTH = 5
const MAX_PHONE_LENGTH = 20
const MAX_ADDRESS_LENGTH = 200
const MAX_INFO_LENGTH = 500

// Основна схема за профил
export const profileSchema = z.object({
  full_name: z.string()
    .min(MIN_NAME_LENGTH, `Името трябва да е поне ${MIN_NAME_LENGTH} символа`)
    .max(MAX_NAME_LENGTH, `Името не може да е повече от ${MAX_NAME_LENGTH} символа`)
    .optional(),
  company_name: z.string()
    .min(MIN_NAME_LENGTH, `Името на компанията трябва да е поне ${MIN_NAME_LENGTH} символа`)
    .max(MAX_NAME_LENGTH, `Името на компанията не може да е повече от ${MAX_NAME_LENGTH} символа`)
    .optional(),
  phone: z.string()
    .min(MIN_PHONE_LENGTH, `Телефонният номер трябва да е поне ${MIN_PHONE_LENGTH} символа`)
    .max(MAX_PHONE_LENGTH, `Телефонният номер не може да е повече от ${MAX_PHONE_LENGTH} символа`)
    .optional(),
  company_address: z.string()
    .max(MAX_ADDRESS_LENGTH, `Адресът не може да е повече от ${MAX_ADDRESS_LENGTH} символа`)
    .optional(),
  additional_info: z.string()
    .max(MAX_INFO_LENGTH, `Допълнителната информация не може да е повече от ${MAX_INFO_LENGTH} символа`)
    .optional(),
  specialization: z.string()
    .max(MAX_NAME_LENGTH, `Специализацията не може да е повече от ${MAX_NAME_LENGTH} символа`)
    .optional(),
  experience: z.string()
    .max(MAX_INFO_LENGTH, `Информацията за опит не може да е повече от ${MAX_INFO_LENGTH} символа`)
    .optional(),
  building_address: z.string()
    .max(MAX_ADDRESS_LENGTH, `Адресът на сградата не може да е повече от ${MAX_ADDRESS_LENGTH} символа`)
    .optional(),
  apartments_count: z.string()
    .max(50, `Броят апартаменти не може да е повече от 50 символа`)
    .optional(),
  building_info: z.string()
    .max(MAX_INFO_LENGTH, `Информацията за сградата не може да е повече от ${MAX_INFO_LENGTH} символа`)
    .optional(),
  avatar_url: z.string().optional(),
})

// Тип, генериран от схемата
export type ProfileFormData = z.infer<typeof profileSchema>

// Схема за валидация на форма за профил
export const profileFormSchema = profileSchema 