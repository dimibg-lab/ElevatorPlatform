import { z } from 'zod';

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, 'Имейлът е задължителен')
    .email('Невалиден имейл формат'),
});

export type ResendVerificationFormData = z.infer<typeof resendVerificationSchema>; 