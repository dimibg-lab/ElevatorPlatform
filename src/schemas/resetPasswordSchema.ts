import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Паролата е задължителна')
      .min(8, 'Паролата трябва да бъде поне 8 символа')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/,
        'Паролата трябва да съдържа поне една главна буква, една малка буква, една цифра и един специален символ'
      ),
    confirmPassword: z.string().min(1, 'Моля, потвърдете паролата'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Паролите не съвпадат',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>; 