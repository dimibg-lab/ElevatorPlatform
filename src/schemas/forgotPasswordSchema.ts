import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Имейлът е задължителен')
    .email('Невалиден имейл формат'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>; 