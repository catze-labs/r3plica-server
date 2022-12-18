import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "src/prisma.service";
import {
  UserEntitlement,
  UserEntitlementWrapper,
  UserItem,
  UserItemWrapper,
} from "src/types";
import { axiosReturnOrThrow } from "src/utils";
import { SignatureService } from "../signature/signature.service";
import { UserService } from "../user/user.service";

@Injectable()
export class PlayFabService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly signatureService: SignatureService,
    private readonly userService: UserService
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

    await this.prismaService.user.create({
      data: {
        playFabId: parsedData["PlayFabId"],
        email: email,
      },
    });

    // TODO : contract call
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

    // Parsing axios response data
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
      for (let itemTransfer of itemTransfers) {
        if (itemTransfer.itemId === userItem.itemID && itemTransfer.txStatus) {
          wrappedItem.isTransferred = true;
          wrappedItem.transfer = itemTransfer;
        }
      }

      return wrappedItem;
    });
  }

  async getUserEntitlements(playFabId: string) {
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

    // Parsing axios response data
    let userEntitlements: UserEntitlement[] =
      axiosReturnOrThrow(response)["FunctionResult"] || [];

    // Transfer history
    const entitlementTransfers =
      await this.prismaService.entitlementTransfer.findMany({
        where: {
          playFabId,
        },
      });

    return userEntitlements.map((quest) => {
      const wrappedItem: UserEntitlementWrapper = {
        ...quest,
        isTransferred: false,
        transfer: null,
      };

      for (let entitlementTransfer of entitlementTransfers) {
        if (
          entitlementTransfer.entitlementId === quest.questID &&
          entitlementTransfer.txStatus
        ) {
          wrappedItem.isTransferred = true;
          wrappedItem.transfer = entitlementTransfer;
        }
      }

      return wrappedItem;
    });
  }
}
