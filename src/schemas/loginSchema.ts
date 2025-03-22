import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Невалиден имейл адрес'),
  password: z.string().min(1, 'Паролата е задължителна'),
});

export type LoginFormData = z.infer<typeof loginSchema>; 