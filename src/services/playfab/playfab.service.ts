import {
  BadRequestException,
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
import { SignatureService } from "../signature/signature.service";
import { UserService } from "../user/user.service";

@Injectable()
export class PlayFabService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly signatureService: SignatureService,
    private readonly userService: UserService,
    private readonly web3Service: Web3Service
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

    const user: user = await this.prismaService.user.create({
      data: {
        playFabId: parsedData["PlayFabId"],
        email: email,
      },
    });

    parsedData["profileTokenMintTxHash"] = await this.web3Service.mintPAFSBT(
      user
    );
    return parsedData;
  }

  async login(email: string, password: string) {
    const path = "/Client/LoginWithEmailAddress";
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

    // Transfer history
    const itemTransfers = await this.prismaService.itemTransfer.findMany({
      where: {
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
      };

      // Compare transferred item to user already have item
      for (const itemTransfer of itemTransfers) {
        if (itemTransfer.itemId === userItem.itemID && itemTransfer.txStatus) {
          wrappedItem.isTransferred = true;
          wrappedItem.transfer = itemTransfer;
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
    const userAchievements: UserAchievement[] =
      axiosReturnOrThrow(response)["FunctionResult"] || [];

    // Transfer history
    const achievementTransfers =
      await this.prismaService.achievementTransfer.findMany({
        where: {
          playFabId,
        },
      });

    return userAchievements.map((userAchievement) => {
      const wrappedItem: UserAchievementWrapper = {
        ...userAchievement,
        isTransferred: false,
        transfer: null,
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

      return wrappedItem;
    });
  }
}
