import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "src/prisma.service";
import { PlayFabService } from "../playfab/playfab.service";
import { TESTNET_AFSBT_PROXY_CONTRACT_ADDRESS, TESTNET_QFSBT_PROXY_CONTRACT_ADDRESS } from "../../constants";

@Injectable()
export class CronService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly playFabService: PlayFabService
  ) {
  }

  private readonly logger = new Logger(CronService.name);

  @Cron("*/3 * * * *")
  async indexerCron() {
    // TODO : Indexer logic here
    this.logger.debug(`Indexer Running ${new Date().toString()}`);

    // await this.prismaService.itemToken.create({});
    // await this.prismaService.entitlementToken.create({});
  }

  @Cron("*/3 * * * *")
  async updateUserItemAndEntitlement() {
    const users = await this.prismaService.user.findMany({});

    for (let user of users) {
      let items = await this.playFabService.getUserItems(user.playFabId);
      items = items.filter(
        (item) => item.rarity === "Epic" || item.rarity === "Legendary"
      );

      for (const item of items) {
        const itemToken = await this.prismaService.itemToken.findFirst(
          {
            where: {
              contractAddress: TESTNET_AFSBT_PROXY_CONTRACT_ADDRESS,
              itemId: item.itemID,
              playFabId: null
            }
          }
        );
        await this.prismaService.itemToken.update({
          where: {
            tokenId: itemToken.tokenId
          },
          data: {
            playFabId: user.playFabId
          }
        });
      }

      let entitlements = await this.playFabService.getUserEntitlements(
        user.playFabId
      );
      for (const entitlement of entitlements) {
        const entitlementToken = await this.prismaService.entitlementToken.findFirst(
          {
            where: {
              contractAddress: TESTNET_QFSBT_PROXY_CONTRACT_ADDRESS,
              entitlementId: entitlement.questID,
              playFabId: null
            }
          }
        );
        await this.prismaService.entitlementToken.update({
          where: {
            tokenId: entitlementToken.tokenId
          },
          data: {
            playFabId: user.playFabId
          }
        });
      }
    }
  }
}
