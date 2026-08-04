import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DocumentExpiryJob {
  private readonly logger = new Logger(DocumentExpiryJob.name);

  execute() {
    this.logger.log('Executing Document Expiry job...');
  }
}
