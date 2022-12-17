import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "src/prisma.service";
import { PlayFabService } from "../playfab/playfab.service";
import { TESTNET_AFSBT_PROXY_CONTRACT_ADDRESS, TESTNET_QFSBT_PROXY_CONTRACT_ADDRESS } from "../../constants";
import axios from "axios";
import { axiosReturnOrThrow } from "../../utils";

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly playFabService: PlayFabService
  ) {
  }

  @Cron("*/3 * * * *")
  async updateTransactionStatus() {
    const itemTransfers = await this.prismaService.itemTransfer.findMany({
      where: {
        txStatus: null
      }
    });

    for (const itemTransfer of itemTransfers) {
      const url = "https://api-testnet.bscscan.com/api" +
        "?module=transaction" +
        "&action=gettxreceiptstatus" +
        "&txhash=" + itemTransfer.txHash +
        "&apikey=" + process.env.BSCAN_API_KEY;

      // Send get request
      let response: any;
      try {
        const { data } = await axios.get(url);

        response = data;
      } catch (error) {
        response = error.response;
      }

      const parsedData = axiosReturnOrThrow(response);
      await this.prismaService.itemTransfer.update({
        where: {
          id: itemTransfer.id
        },
        data: {
          txStatus: parsedData["result"]["status"] == "1"
        }
      });
    }

    const entitlementTransfers = await this.prismaService.entitlementTransfer.findMany({
      where: {
        txStatus: null
      }
    });

    for (const entitlementTransfer of entitlementTransfers) {
      const url = "https://api-testnet.bscscan.com/api" +
        "?module=transaction" +
        "&action=gettxreceiptstatus" +
        "&txhash=" + entitlementTransfer.txHash +
        "&apikey=" + process.env.BSCAN_API_KEY;

      // Send get request
      let response: any;
      try {
        const { data } = await axios.get(url);

        response = data;
      } catch (error) {
        response = error.response;
      }

      const parsedData = axiosReturnOrThrow(response);
      await this.prismaService.itemTransfer.update({
        where: {
          id: entitlementTransfer.id
        },
        data: {
          txStatus: parsedData["result"]["status"] == "1"
        }
      });
    }
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
        //  TODO: contract call
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
        //  TODO: contract call
      }
    }
  }
}
