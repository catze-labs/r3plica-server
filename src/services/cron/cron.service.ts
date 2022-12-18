import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "src/prisma.service";
import { PlayFabService } from "../playfab/playfab.service";
import {
  TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
  TESTNET_QAFSBT_PROXY_CONTRACT_ADDRESS,
} from "../../constants";
import axios from "axios";
import { axiosReturnOrThrow } from "../../utils";

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly playFabService: PlayFabService
  ) {}

  getBSCScanUrl(txHash: string) {
    return `https://api-testnet.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${process.env.BSCAN_API_KEY}`;
  }

  @Cron("*/3 * * * *")
  async updateTransactionStatus() {
    // profile minting tx status update
    const profileMints = await this.prismaService.profileMint.findMany({
      where: {
        txStatus: null,
      },
    });

    for (const profileMint of profileMints) {
      const url = this.getBSCScanUrl(profileMint.txHash);

      // Send get request
      let response: any;
      try {
        const { data } = await axios.get(url);

        response = data;
      } catch (error) {
        response = error.response;
      }

      const parsedData = axiosReturnOrThrow(response);
      await this.prismaService.profileMint.update({
        where: {
          id: profileMint.id,
        },
        data: {
          txStatus: parsedData["result"]["status"] == "1",
        },
      });
    }

    // profile transfer tx status update
    const profileTransfers = await this.prismaService.profileTransfer.findMany({
      where: {
        txStatus: null,
      },
    });

    for (const profileTransfer of profileTransfers) {
      const url = this.getBSCScanUrl(profileTransfer.txHash);

      // Send get request
      let response: any;
      try {
        const { data } = await axios.get(url);

        response = data;
      } catch (error) {
        response = error.response;
      }

      const parsedData = axiosReturnOrThrow(response);
      await this.prismaService.profileTransfer.update({
        where: {
          id: profileTransfer.id,
        },
        data: {
          txStatus: parsedData["result"]["status"] == "1",
        },
      });
    }

    // Item transfer tx status update
    const itemTransfers = await this.prismaService.itemTransfer.findMany({
      where: {
        txStatus: null,
      },
    });

    for (const itemTransfer of itemTransfers) {
      const url = this.getBSCScanUrl(itemTransfer.txHash);

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
          id: itemTransfer.id,
        },
        data: {
          txStatus: parsedData["result"]["status"] == "1",
        },
      });
    }

    // Entitlement transfer tx status update
    const entitlementTransfers =
      await this.prismaService.entitlementTransfer.findMany({
        where: {
          txStatus: null,
        },
      });

    for (const entitlementTransfer of entitlementTransfers) {
      const url = this.getBSCScanUrl(entitlementTransfer.txHash);

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
          id: entitlementTransfer.id,
        },
        data: {
          txStatus: parsedData["result"]["status"] == "1",
        },
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
        const itemToken = await this.prismaService.itemToken.findFirst({
          where: {
            contractAddress: TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
            itemId: item.itemID,
            playFabId: null,
          },
        });

        await this.prismaService.itemToken.update({
          where: {
            tokenId: itemToken.tokenId,
          },
          data: {
            playFabId: user.playFabId,
          },
        });
        //  TODO: contract call
      }

      let entitlements = await this.playFabService.getUserEntitlements(
        user.playFabId
      );
      for (const entitlement of entitlements) {
        const entitlementToken =
          await this.prismaService.entitlementToken.findFirst({
            where: {
              contractAddress: TESTNET_QAFSBT_PROXY_CONTRACT_ADDRESS,
              entitlementId: entitlement.questID,
              playFabId: null,
            },
          });
        await this.prismaService.entitlementToken.update({
          where: {
            tokenId: entitlementToken.tokenId,
          },
          data: {
            playFabId: user.playFabId,
          },
        });
        //  TODO: contract call
      }
    }
  }
}
