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
import { Web3Service } from "src/web3.service";

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly playFabService: PlayFabService,
    private readonly web3Service: Web3Service
  ) {}

  private async getTransactionStatus(txHash: string) {
    const url = `https://api-testnet.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${process.env.BSCAN_API_KEY}`;

    let response: any;
    try {
      const { data } = await axios.get(url);

      response = data;
    } catch (error) {
      response = error.response;
    }

    return axiosReturnOrThrow(response);
  }

  @Cron("*/3 * * * *")
  async updateTransactionStatus() {
    // Update profile mint tx status
    const profileMints = await this.prismaService.profileMint.findMany({
      where: {
        txStatus: null,
      },
    });

    for (const profileMint of profileMints) {
      const parsedData = await this.getTransactionStatus(profileMint.txHash);
      const txStatus = parsedData["result"]["status"] == "1";
      await this.prismaService.profileMint.update({
        where: {
          id: profileMint.id,
        },
        data: {
          txStatus,
        },
      });
      if (txStatus) {
        //  TODO: create profileToken record
      } else {
        //  TODO: retry - send profileMint tx again
      }
    }

    // Update profile transfer tx status
    const profileTransfers = await this.prismaService.profileTransfer.findMany({
      where: {
        txStatus: null,
      },
    });

    for (const profileTransfer of profileTransfers) {
      const parsedData = await this.getTransactionStatus(
        profileTransfer.txHash
      );

      await this.prismaService.profileTransfer.update({
        where: {
          id: profileTransfer.id,
        },
        data: {
          txStatus: parsedData["result"]["status"] == "1",
        },
      });
    }

    // Update item transfer tx status
    const itemTransfers = await this.prismaService.itemTransfer.findMany({
      where: {
        txStatus: null,
      },
    });

    for (const itemTransfer of itemTransfers) {
      const parsedData = await this.getTransactionStatus(itemTransfer.txHash);

      await this.prismaService.itemTransfer.update({
        where: {
          id: itemTransfer.id,
        },
        data: {
          txStatus: parsedData["result"]["status"] == "1",
        },
      });
    }

    // Update entitlement transfer tx status
    const entitlementTransfers =
      await this.prismaService.entitlementTransfer.findMany({
        where: {
          txStatus: null,
        },
      });

    for (const entitlementTransfer of entitlementTransfers) {
      const parsedData = await this.getTransactionStatus(
        entitlementTransfer.txHash
      );

      await this.prismaService.itemTransfer.update({
        where: {
          id: entitlementTransfer.id,
        },
        data: {
          txStatus: parsedData["result"]["status"] == "1",
        },
      });
    }

    // Update profile token - item token mapping tx status
    const itemMappings = await this.prismaService.itemMapping.findMany({
      where: {
        txStatus: null,
      },
    });

    for (const itemMapping of itemMappings) {
      const parsedData = await this.getTransactionStatus(itemMapping.txHash);

      await this.prismaService.itemMapping.update({
        where: {
          id: itemMapping.id,
        },
        data: {
          txStatus: parsedData["result"]["status"] == "1",
        },
      });
    }

    // Update profile token - entitlement token mapping tx status
    const entitlementMappings =
      await this.prismaService.entitlementMapping.findMany({
        where: {
          txStatus: null,
        },
      });

    for (const entitlementMapping of entitlementMappings) {
      const parsedData = await this.getTransactionStatus(
        entitlementMapping.txHash
      );
      await this.prismaService.entitlementMapping.update({
        where: {
          id: entitlementMapping.id,
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
      const profileToken = await this.prismaService.profileToken.findFirst({
        where: {
          playFabId: user.playFabId,
        },
      });

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

        await this.web3Service.mappingIfsbt(
          profileToken.tokenId,
          itemToken.tokenId
        );
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
        await this.web3Service.mappingQfsbt(
          profileToken.tokenId,
          entitlementToken.tokenId
        );
      }
    }
  }
}
