import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "src/prisma.service";
import { PlayFabService } from "../playfab/playfab.service";
import {
  TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
  TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
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
        await this.prismaService.profileToken.create({
          data: {
            tokenId: profileMint.tokenId,
            txHash: profileMint.txHash,
            txStatus,
            contractAddress: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
            playFabId: profileMint.playFabId,
          },
        });
      } else {
        await this.web3Service.mintPAFSBT(profileMint.playFabId);
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

    // Update achievement transfer tx status
    const achievementTransfers =
      await this.prismaService.achievementTransfer.findMany({
        where: {
          txStatus: null,
        },
      });

    for (const achievementTransfer of achievementTransfers) {
      const parsedData = await this.getTransactionStatus(
        achievementTransfer.txHash
      );

      await this.prismaService.itemTransfer.update({
        where: {
          id: achievementTransfer.id,
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

    // Update profile token - achievement token mapping tx status
    const achievementMappings =
      await this.prismaService.achievementMapping.findMany({
        where: {
          txStatus: null,
        },
      });

    for (const achievementMapping of achievementMappings) {
      const parsedData = await this.getTransactionStatus(
        achievementMapping.txHash
      );
      await this.prismaService.achievementMapping.update({
        where: {
          id: achievementMapping.id,
        },
        data: {
          txStatus: parsedData["result"]["status"] == "1",
        },
      });
    }
  }

  @Cron("*/3 * * * *")
  async updateUserItemAndAchievement() {
    const users = await this.prismaService.user.findMany({});

    for (const user of users) {
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

        await this.web3Service.bindIfsbtToProfile(
          profileToken.tokenId,
          itemToken.tokenId
        );
      }

      const achievements = await this.playFabService.getUserAchievements(
        user.playFabId
      );
      for (const achievement of achievements) {
        const achievementToken =
          await this.prismaService.achievementToken.findFirst({
            where: {
              contractAddress: TESTNET_QAFSBT_PROXY_CONTRACT_ADDRESS,
              achievementId: achievement.questID,
              playFabId: null,
            },
          });
        await this.prismaService.achievementToken.update({
          where: {
            tokenId: achievementToken.tokenId,
          },
          data: {
            playFabId: user.playFabId,
          },
        });
        await this.web3Service.bindQfsbtToProfile(
          profileToken.tokenId,
          achievementToken.tokenId
        );
      }
    }
  }
}
