import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "src/prisma.service";
import { PlayFabService } from "../playfab/playfab.service";
import { TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS } from "../../constants";
import axios from "axios";
import { axiosReturnOrThrow } from "../../utils";
import { Web3Service } from "src/web3.service";
import { profileMint } from "@prisma/client";
import { NotificationService } from "../notification/notification.service";
import { SlackColor } from "src/types";

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly playFabService: PlayFabService,
    private readonly web3Service: Web3Service,
    private readonly notificationService: NotificationService
  ) {}

  @Cron("*/1 * * * *")
  async updateTransactionStatus() {
    this.logger.log("updateTransactionStatus");

    // Update profile mint tx status
    const profileMints: profileMint[] =
      await this.prismaService.profileMint.findMany({
        where: {
          chain: "BNB",
          txStatus: null,
        },
      });

    for (const profileMint of profileMints) {
      const parsedData = await this.web3Service.getTransactionStatus(
        profileMint.txHash
      );
      const txStatus = parsedData["status"] == "1";
      await this.prismaService.profileMint.update({
        where: {
          id: profileMint.id,
        },
        data: {
          txStatus,
        },
      });
      if (txStatus) {
        const tokenId = await this.web3Service.getProfileTokenId(
          profileMint.playFabId
        );
        await this.prismaService.profileToken.create({
          data: {
            chain: "BNB",
            tokenId,
            contractAddress: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
            playFabId: profileMint.playFabId,
          },
        });
      }

      await this.notificationService.sendSlackNotify({
        title: "r3plica BNB updateTransactionStatus Cron Job",
        text: `PAFSBT Minting Request #${profileMint.id}\rHash ${
          profileMint.txHash
        }\r${txStatus ? "succeed" : "failed"}`,
        color: txStatus ? SlackColor.success : SlackColor.danger,
      });
    }

    // Update profile transfer tx status
    const profileTransfers = await this.prismaService.profileTransfer.findMany({
      where: {
        chain: "BNB",
        txStatus: null,
      },
    });

    for (const profileTransfer of profileTransfers) {
      const parsedData = await this.web3Service.getTransactionStatus(
        profileTransfer.txHash
      );

      const txStatus = parsedData["status"] == "1";

      await this.prismaService.profileTransfer.update({
        where: {
          id: profileTransfer.id,
        },
        data: {
          txStatus,
        },
      });

      await this.notificationService.sendSlackNotify({
        title: "r3plica BNB updateTransactionStatus Cron Job",
        text: `PAFSBT Transfer #${profileTransfer.id}\rHash ${
          profileTransfer.txHash
        })\r${txStatus ? "succeed" : "failed"}`,
        color: txStatus ? SlackColor.success : SlackColor.danger,
      });
    }

    // Update item transfer tx status
    const itemTransfers = await this.prismaService.itemTransfer.findMany({
      where: {
        chain: "BNB",
        txStatus: null,
      },
    });

    for (const itemTransfer of itemTransfers) {
      const parsedData = await this.web3Service.getTransactionStatus(
        itemTransfer.txHash
      );

      const txStatus = parsedData["status"] == "1";
      await this.prismaService.itemTransfer.update({
        where: {
          id: itemTransfer.id,
        },
        data: {
          txStatus,
        },
      });

      await this.notificationService.sendSlackNotify({
        title: "r3plica BNB updateTransactionStatus Cron Job",
        text: `IAFSBT Transfer #${itemTransfer.id}\rHash ${
          itemTransfer.txHash
        }\r${txStatus ? "succeed" : "failed"}`,
        color: txStatus ? SlackColor.success : SlackColor.danger,
      });
    }

    // Update achievement transfer tx status
    const achievementTransfers =
      await this.prismaService.achievementTransfer.findMany({
        where: {
          chain: "BNB",
          txStatus: null,
        },
      });

    for (const achievementTransfer of achievementTransfers) {
      const parsedData = await this.web3Service.getTransactionStatus(
        achievementTransfer.txHash
      );

      const txStatus = parsedData["status"] == "1";
      await this.prismaService.itemTransfer.update({
        where: {
          id: achievementTransfer.id,
        },
        data: {
          txStatus,
        },
      });

      await this.notificationService.sendSlackNotify({
        title: "r3plica BNB updateTransactionStatus Cron Job",
        text: `AAFSBT Transfer #${achievementTransfer.id}\rHash ${
          achievementTransfer.txHash
        }\r${txStatus ? "succeed" : "failed"}`,
        color: txStatus ? SlackColor.success : SlackColor.danger,
      });
    }
  }

  @Cron("*/2 * * * *")
  async updateUserItemAndAchievement() {
    this.logger.log("updateUserItemAndAchievement");
    const users = await this.prismaService.user.findMany({});

    for (const user of users) {
      const profileToken = await this.prismaService.profileToken.findFirst({
        where: {
          chain: "BNB",
          playFabId: user.playFabId,
        },
      });

      // Mapping Items
      let items = await this.playFabService.getUserItems(user.playFabId);

      if (items.length > 0) {
        const itemIdCandidates = [31, 18, 27, 34];

        items = items.filter((item) => itemIdCandidates.includes(item.itemID));

        let itemTokenIds = [];
        let profileTokenIdsByItemTokenIds = [];

        for (const item of items) {
          const itemToken = await this.prismaService.itemToken.findFirst({
            where: {
              chain: "BNB",
              contractAddress: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
              itemId: item.itemID,
              playFabId: null,
            },
          });

          if (!itemToken) continue;

          itemTokenIds.push(itemToken.tokenId);
          profileTokenIdsByItemTokenIds.push(profileToken.tokenId);

          await this.prismaService.itemToken.update({
            where: {
              tokenId: itemToken.tokenId,
            },
            data: {
              playFabId: user.playFabId,
            },
          });

          await this.notificationService.sendSlackNotify({
            title: "r3plica BNB updateUserItemAndAchievement Cron Job",
            text: `IAFSBT #${item.itemID} (${item.itemName} / ${item.rarity})\rTokenized for USER #${user.playFabId}`,
          });
        }
      }

      // await this.web3Service.bindItemIdsToProfileIds(
      //   itemTokenIds,
      //   profileTokenIdsByItemTokenIds
      // );

      // Mapping Achievements
      let achievements = await this.playFabService.getUserAchievements(
        user.playFabId
      );

      if (achievements.length > 0) {
        const questIdCandidates = [0, 1, 2, 3];

        achievements = achievements.filter(
          (achievement) =>
            questIdCandidates.includes(achievement.questID) &&
            achievement.state === 4
        );

        let achievementTokenIds = [];
        let profileTokenIdsByAchievementTokenIds = [];

        for (const achievement of achievements) {
          const achievementToken =
            await this.prismaService.achievementToken.findFirst({
              where: {
                chain: "BNB",
                contractAddress: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
                achievementId: achievement.questID,
                playFabId: null,
              },
            });

          if (!achievementToken) continue;

          achievementTokenIds.push(achievementToken.tokenId);
          profileTokenIdsByAchievementTokenIds.push(profileToken.tokenId);

          await this.prismaService.achievementToken.update({
            where: {
              tokenId: achievementToken.tokenId,
            },
            data: {
              playFabId: user.playFabId,
            },
          });

          await this.notificationService.sendSlackNotify({
            title: "r3plica BNB updateUserItemAndAchievement Cron Job",
            text: `AAFSBT ${achievement.questID} (${achievement.questTitle})\rTokenized for USER #${user.playFabId}`,
          });
        }
      }

      // await this.web3Service.bindAchievementIdsToProfileIds(
      //   achievementTokenIds.map(String),
      //   profileTokenIdsByAchievementTokenIds.map(String)
      // );
    }
  }

  @Cron("*/1 * * * *")
  async mintProfileTokenForced() {
    this.logger.log("mintProfileTokenForced");
    let users = await this.prismaService.user.findMany({
      where: {
        chain: "BNB",
      },
      include: {
        profileToken: true,
      },
    });

    users = users.filter((user) => !user.profileToken);
    for (const user of users) {
      const profileMint = await this.prismaService.profileMint.findFirst({
        where: {
          chain: "BNB",
          playFabId: user.playFabId,
          OR: [
            {
              txStatus: null,
            },
            {
              txStatus: true,
            },
          ],
        },
      });
      if (profileMint != null) {
        continue;
      }
      await this.web3Service.mintPAFSBT(user.playFabId);

      await this.notificationService.sendSlackNotify({
        title: "r3plica BNB mintProfileTokenForced Cron Job",
        text: `PAFSBT Force Minted\rUSER #${user.playFabId}`,
      });
    }
  }
}
