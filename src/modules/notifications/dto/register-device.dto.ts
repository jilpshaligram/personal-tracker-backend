import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  deviceToken: string;

  @IsString()
  @IsIn(['WEB', 'ANDROID', 'IOS'])
  platform: string;
}