import { z } from 'zod';

export const updateSavingGoalSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title is too long')
      .optional(),

    targetAmount: z
      .number()
      .positive('Target amount must be greater than 0')
      .optional(),

    targetDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format')
      .refine(
        (date) => new Date(date) > new Date(),
        'Target date must be in the future',
      )
      .optional(),

    status: z
      .preprocess(
        (val) => (typeof val === 'string' ? val.toUpperCase() : val),
        z.enum(['ACTIVE', 'CANCELLED'], {
          message: 'Status can only be set to ACTIVE or CANCELLED',
        }),
      )
      .optional(),

    autoReminder: z.boolean().optional(),

    reminderFrequency: z
      .preprocess(
        (val) => (typeof val === 'string' ? val.toUpperCase() : val),
        z.enum(['DAILY', 'WEEKLY', 'MONTHLY'], {
          message: 'Reminder frequency must be DAILY, WEEKLY, or MONTHLY',
        }),
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.autoReminder === true && !data.reminderFrequency) {
        return false;
      }
      return true;
    },
    {
      message: 'reminderFrequency is required when autoReminder is true',
      path: ['reminderFrequency'],
    },
  );

export type UpdateSavingGoalDto = z.infer<typeof updateSavingGoalSchema>;
