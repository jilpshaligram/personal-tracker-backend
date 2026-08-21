import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OtpService } from '@/modules/otp/otp.service';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}
}
