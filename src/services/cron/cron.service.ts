import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  @Cron('*/3 * * * *')
  indexerCron() {
    // TODO : Indexer logic here
    this.logger.debug(`Indexer Running ${new Date().toString()}`);
  }
}
