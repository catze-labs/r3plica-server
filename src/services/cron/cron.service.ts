import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "src/prisma.service";
import { PlayFabService } from "../playfab/playfab.service";

@Injectable()
export class CronService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly playFabService: PlayFabService
  ) {}
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
      let entitlement = await this.playFabService.getUserEntitlements(
        user.playFabId
      );

      items = items.filter(
        (item) => item.rarity === "Epic" || item.rarity === "Legendary"
      );

      const itemsCreateArray = items.map((item) => {
        return {
          playFabId: user.playFabId,
          itemId: item.itemID,
        };
      });

      const entitlementCreateArray = entitlement.map((entitlement) => {
        return {
          playFabId: user.playFabId,
          entitlementId: entitlement.questID,
        };
      });

      await this.prismaService.userItem.deleteMany({
        where: {
          playFabId: user.playFabId,
        },
      });

      await this.prismaService.userItem.createMany({
        data: itemsCreateArray,
      });

      await this.prismaService.userEntitlement.deleteMany({
        where: {
          playFabId: user.playFabId,
        },
      });

      await this.prismaService.userEntitlement.createMany({
        data: entitlementCreateArray,
      });
    }
  }
}
