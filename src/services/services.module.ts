import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { Web3Service } from "src/web3.service";
import { CronService } from "./cron/cron.service";
import { NonceService } from "./nonce/nonce.service";
import { PlayFabService } from "./playfab/playfab.service";
import { SignatureService } from "./signature/signature.service";
import { UserService } from "./user/user.service";
import { NotificationService } from "./notification/notification.service";

@Module({
  providers: [
    PrismaService,
    CronService,
    NonceService,
    PlayFabService,
    SignatureService,
    UserService,
    Web3Service,
    NotificationService,
  ],
  exports: [
    PrismaService,
    CronService,
    NonceService,
    PlayFabService,
    SignatureService,
    UserService,
    Web3Service,
    NotificationService,
  ],
})
export class ServicesModule {}
