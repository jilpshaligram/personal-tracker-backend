import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import type { ZodSchema, ZodIssue } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = (
        (result.error as unknown as { issues: ZodIssue[] }).issues ?? []
      ).map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new BadRequestException({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    return result.data;
  }
}
