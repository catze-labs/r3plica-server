import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { user } from "@prisma/client";
import axios from "axios";
import { PrismaService } from "src/prisma.service";
import {
  UserAchievement,
  UserAchievementWrapper,
  UserItem,
  UserItemWrapper,
} from "src/types";
import { axiosReturnOrThrow } from "src/utils";
import { Web3Service } from "src/web3.service";
import { NotificationService } from "../notification/notification.service";
import { SignatureService } from "../signature/signature.service";
import { UserService } from "../user/user.service";

@Injectable()
export class PlayFabService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly signatureService: SignatureService,
    private readonly userService: UserService,
    private readonly web3Service: Web3Service,
    private readonly notificationService: NotificationService
  ) {}

  async validateEmail(email: string) {
    const count = await this.prismaService.user.count({
      where: {
        email: email,
      },
    });

    if (count > 0) {
      throw new BadRequestException({
        message: "Email address already exists",
        data: { email },
      });
    }
  }

  async validateAndGetUserInfoBySessionTicket(sessionTicket: string) {
    const path = "/Server/AuthenticateSessionTicket";
    const params = {
      SessionTicket: sessionTicket,
    };

    // Send post request
    let response: any;
    try {
      const { data } = await axios.post(
        process.env.PLAY_FAB_HOST + path,
        params,
        {
          headers: {
            "X-SecretKey": process.env.PLAY_FAB_X_SECRET_KEY,
          },
        }
      );

      response = data;
    } catch (error) {
      response = error.response;
    }

    const parsedData = axiosReturnOrThrow(response);

    // Check sessionTicket expiry
    if (parsedData["IsSessionTicketExpired"]) {
      throw new UnauthorizedException({
        message: "Session ticket expired",
        data: { IsSessionTicketExpired: parsedData.IsSessionTicketExpired },
      });
    }

    const playFabId = parsedData.UserInfo.PlayFabId;

    // Check user existence
    await this.userService.getUser(playFabId);

    return parsedData.UserInfo;
  }

  async registerPlayFabUser(email: string, password: string) {
    await this.validateEmail(email);
    const path = "/Client/RegisterPlayFabUser";
    const params = {
      TitleId: process.env.PLAY_FAB_TITLE_ID,
      Email: email,
      Password: password,
      RequireBothUsernameAndEmail: false,
    };

    let response: any;
    try {
      const { data } = await axios.post(
        process.env.PLAY_FAB_HOST + path,
        params
      );
      response = data;
    } catch (error) {
      response = error.response;
    }

    const parsedData = axiosReturnOrThrow(response);
    const playFabId: string = parsedData["PlayFabId"];
    const user: user = await this.prismaService.user.create({
      data: {
        chain: "BNB",
        playFabId: parsedData["PlayFabId"],
        email: email,
      },
    });

    try {
      const txHash = await this.web3Service.mintPAFSBT(playFabId);
      parsedData["txHash"] = txHash;

      if (txHash)
        await this.notificationService.sendSlackNotify({
          title: "r3plica BNB Registered & Mint PAFSBT",
          text: `User Register & PAFSBT Minted\rUSER #${user.playFabId}\rHash: ${txHash}`,
        });
    } catch (err) {
      console.log("Error", err);
      return parsedData;
    }

    return parsedData;
  }

  async login(email: string, password: string) {
    const path = "/Client/LoginWithEmailAddress";

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException({
        message: "Email address does not exist",
        data: { email },
      });
    }

    if (user.chain !== "BNB") {
      throw new BadRequestException({
        message: "User is not registered with BNB r3plica",
        data: { email },
      });
    }

    const params = {
      TitleId: process.env.PLAY_FAB_TITLE_ID,
      Email: email,
      Password: password,
    };
    let response: any;
    try {
      const { data } = await axios.post(
        process.env.PLAY_FAB_HOST + path,
        params
      );
      response = data;
    } catch (error) {
      response = error.response;
    }

    return axiosReturnOrThrow(response);
  }

  async updateUserWalletAddress(
    playFabId: string,
    walletAddress: string,
    signature: string
  ) {
    const user = await this.prismaService.user.findUnique({
      where: {
        playFabId,
      },
    });

    if (user.chain !== "BNB")
      throw new ForbiddenException({
        message: "User is not registered with BNB r3plica",
      });

    const userAddress: string | undefined =
      await this.signatureService.getAddress(walletAddress, signature);

    await this.signatureService.validateUserAddress(userAddress, walletAddress);

    await this.prismaService.user.update({
      where: {
        playFabId: playFabId,
      },
      data: {
        walletAddress: userAddress,
      },
    });

    await this.web3Service.transferProfileFsbtToWallet(playFabId);
  }

  async getUserItems(playFabId: string) {
    const path = "/Server/ExecuteCloudScript";

    const params = {
      FunctionName: "getPlayerItems",
      PlayFabId: playFabId,
      GeneratePlayStreamEvent: true,
    };

    let response: any;
    try {
      const { data } = await axios.post(
        process.env.PLAY_FAB_HOST + path,
        params,
        {
          headers: {
            "X-SecretKey": process.env.PLAY_FAB_X_SECRET_KEY,
          },
        }
      );
      response = data;
    } catch (error) {
      response = error.response;
    }

    // Parse axios response data
    let userItems: UserItem[] =
      axiosReturnOrThrow(response)["FunctionResult"] || [];

    // Is item token mapped to user
    const itemTokens = await this.prismaService.itemToken.findMany({
      where: {
        chain: "BNB",
        playFabId,
      },
    });

    // Transfer history
    const itemTransfers = await this.prismaService.itemTransfer.findMany({
      where: {
        chain: "BNB",
        playFabId,
      },
    });

    userItems = userItems.filter(
      (userItem) =>
        userItem.rarity === "Epic" || userItem.rarity === "Legendary"
    );

    return userItems.map((userItem) => {
      const wrappedItem: UserItemWrapper = {
        ...userItem,
        isTransferred: false,
        transfer: null,
        isTokenized: false,
      };

      // Compare transferred item to user already have item
      for (const itemTransfer of itemTransfers) {
        if (itemTransfer.itemId === userItem.itemID && itemTransfer.txStatus) {
          wrappedItem.isTransferred = true;
          wrappedItem.transfer = itemTransfer;
        }
      }

      // Compare item token to user already have
      for (const itemToken of itemTokens) {
        if (itemToken.itemId === userItem.itemID) {
          wrappedItem.isTokenized = true;
        }
      }

      return wrappedItem;
    });
  }

  async getUserAchievements(playFabId: string) {
    const path = "/Server/ExecuteCloudScript";

    const params = {
      FunctionName: "getPlayerEntitlements",
      PlayFabId: playFabId,
      GeneratePlayStreamEvent: true,
    };

    let response: any;
    try {
      const { data } = await axios.post(
        process.env.PLAY_FAB_HOST + path,
        params,
        {
          headers: {
            "X-SecretKey": process.env.PLAY_FAB_X_SECRET_KEY,
          },
        }
      );
      response = data;
    } catch (error) {
      response = error.response;
    }

    // Parse axios response data
    let userAchievements: UserAchievement[] =
      axiosReturnOrThrow(response)["FunctionResult"] || [];

    userAchievements.filter((achievement) => achievement.state === 4);

    // Tokenized history
    const achievementTokens =
      await this.prismaService.achievementToken.findMany({
        where: {
          chain: "BNB",
          playFabId,
        },
      });

    // Transfer history
    const achievementTransfers =
      await this.prismaService.achievementTransfer.findMany({
        where: {
          chain: "BNB",
          playFabId,
        },
      });

    return userAchievements.map((userAchievement) => {
      const wrappedItem: UserAchievementWrapper = {
        ...userAchievement,
        isTransferred: false,
        transfer: null,
        isTokenized: false,
      };

      for (const achievementTransfer of achievementTransfers) {
        if (
          achievementTransfer.achievementId === userAchievement.questID &&
          achievementTransfer.txStatus
        ) {
          wrappedItem.isTransferred = true;
          wrappedItem.transfer = achievementTransfer;
        }
      }

      for (const achievementToken of achievementTokens) {
        if (achievementToken.achievementId === userAchievement.questID) {
          wrappedItem.isTokenized = true;
        }
      }

      return wrappedItem;
    });
  }
}
