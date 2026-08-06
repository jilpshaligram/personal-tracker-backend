import { plainToInstance } from 'class-transformer';
import {
  validateSync,
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  type ValidationError,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  DB_HOST: string;

  @IsNumber()
  DB_PORT: number;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  ACCESS_TOKEN_EXPIRY: string;

  @IsString()
  REFRESH_TOKEN_EXPIRY: string;
}

export function validate(config: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  }) as EnvironmentVariables;

  const errors: ValidationError[] = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const message = errors
      .map((error) => {
        const constraints = error.constraints ?? {};
        return Object.values(constraints).join(', ');
      })
      .filter(Boolean)
      .join('; ');

    throw new Error(message);
  }

  return validatedConfig;
}
