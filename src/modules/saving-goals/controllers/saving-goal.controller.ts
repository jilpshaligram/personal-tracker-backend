import { Controller } from '@nestjs/common';
import { SavingGoalService } from '../services/saving-goal.service';

@Controller('saving-goals')
export class SavingGoalController {
  constructor(private readonly savingGoalService: SavingGoalService) {}
}
