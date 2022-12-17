import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "src/prisma.service";
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
}
