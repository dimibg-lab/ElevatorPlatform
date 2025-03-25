import { z } from 'zod'

// Схема за валидация на формуляра за промяна на парола
export const passwordSchema = z.object({
  currentPassword: z.string()
    .min(6, 'Паролата трябва да е поне 6 символа')
    .max(100, 'Паролата не може да е повече от 100 символа'),
  newPassword: z.string()
    .min(8, 'Новата парола трябва да е поне 8 символа')
    .max(100, 'Паролата не може да е повече от 100 символа')
    .regex(/[A-Z]/, 'Паролата трябва да съдържа поне една главна буква')
    .regex(/[a-z]/, 'Паролата трябва да съдържа поне една малка буква')
    .regex(/[0-9]/, 'Паролата трябва да съдържа поне една цифра')
    .regex(/[^A-Za-z0-9]/, 'Паролата трябва да съдържа поне един специален символ'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Паролите не съвпадат',
  path: ['confirmPassword']
})

// Схема за валидация при изтриване на профил
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Моля, въведете паролата си за потвърждение'),
  confirmDelete: z.literal(true, {
    errorMap: () => ({ message: 'Трябва да потвърдите, че разбирате последствията' })
  })
})

// Изнасяме типовете, базирани на схемите
export type PasswordFormData = z.infer<typeof passwordSchema>
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>

// Константа за брой елементи на страница при логовете за активност
export const logsPerPage = 10 