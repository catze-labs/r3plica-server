import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CronService } from './cron/cron.service';
import { NonceService } from './nonce/nonce.service';
import { PlayFabService } from './playfab/playfab.service';
import { SignatureService } from './signature/signature.service';
import { UserService } from './user/user.service';

@Module({
  providers: [
    PrismaService,
    CronService,
    NonceService,
    PlayFabService,
    SignatureService,
    UserService,
  ],
  exports: [
    PrismaService,
    CronService,
    NonceService,
    PlayFabService,
    SignatureService,
    UserService,
  ],
})
export class ServicesModule {}
