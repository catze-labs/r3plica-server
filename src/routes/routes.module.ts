import { Module } from "@nestjs/common";
import { PlayFabController } from "./playfab/playfab.controller";
import { UserController } from "./user/user.controller";
import { NonceController } from "./nonce/nonce.controller";
import { TransferController } from "./transfer/transfer.controller";
import { ServicesModule } from "src/services/services.module";
import { MetadataController } from "./metadata/metadata.controller";

@Module({
  imports: [ServicesModule],
  controllers: [
    PlayFabController,
    UserController,
    NonceController,
    TransferController,
    MetadataController,
  ],
})
export class RoutesModule {}
