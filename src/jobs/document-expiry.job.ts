import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DocumentExpiryJob {
  private readonly logger = new Logger(DocumentExpiryJob.name);

  async execute() {
    this.logger.log('Executing Document Expiry job...');
  }
}
