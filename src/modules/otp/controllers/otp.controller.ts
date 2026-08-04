import { Controller } from '@nestjs/common';
import { OtpService } from '../services/otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}
}
