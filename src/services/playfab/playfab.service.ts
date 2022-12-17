import { BadRequestException, Injectable, UnauthorizedException, } from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "src/prisma.service";
import { UserEntitlement, UserEntitlementWrapper, UserItem, UserItemWrapper, } from "src/types";
import { axiosReturnOrThrow } from "src/utils";
import { SignatureService } from "../signature/signature.service";
import { UserService } from "../user/user.service";

@Injectable()
export class PlayFabService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly signatureService: SignatureService,
    private readonly userService: UserService
  ) {
  }

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

    // post 요청
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

    // 세션 티켓이 만료되었는지 확인
    if (parsedData["IsSessionTicketExpired"]) {
      throw new UnauthorizedException({
        message: "Session ticket expired",
        data: { IsSessionTicketExpired: parsedData.IsSessionTicketExpired },
      });
    }

    const playFabId = parsedData.UserInfo.PlayFabId;

    // 유저가 존재하는지 확인
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

    // parsing axios response data
    let list: UserItem[] = axiosReturnOrThrow(response)["FunctionResult"] || [];

    // transfer history
    const userItemTransferList = await this.prismaService.itemTransfer.findMany(
      {
        where: {
          playFabId,
        },
      }
    );

    list = list.filter(
      (item) => item.rarity === "Epic" || item.rarity === "Legendary"
    );

    return list.map((item) => {
      const wrappedItem: UserItemWrapper = {
        ...item,
        isTransferred: false,
        transfer: null,
      };

      // 유저가 transfer 한 아이템과 현재 가지고 있는 아이템을 비교해서 wrapping 함
      for (let transfer of userItemTransferList) {
        if (transfer.item["itemId"] === item.itemID) {
          wrappedItem.isTransferred = true;
          wrappedItem.transfer = transfer;
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

    // parsing axios response data
    let list: UserEntitlement[] =
      axiosReturnOrThrow(response)["FunctionResult"] || [];

    // transfer history
    const userEntitlementTransferList =
      await this.prismaService.entitlementTransfer.findMany({
        where: {
          playFabId,
        },
      });

    const wrappedList: UserEntitlementWrapper[] = list.map((quest) => {
      const wrappedItem: UserEntitlementWrapper = {
        ...quest,
        isTransferred: false,
        transfer: null,
      };

      for (let transfer of userEntitlementTransferList) {
        if (transfer.entitlement["questId"] === quest.questID) {
          wrappedItem.isTransferred = true;
          wrappedItem.transfer = transfer;
        }
      }

      return wrappedItem;
    });

    return wrappedList;
  }
}
