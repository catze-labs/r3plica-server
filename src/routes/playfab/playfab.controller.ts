import { Body, Controller, Get, Patch, Post, Query } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { PlayFabService } from "src/services/playfab/playfab.service";
import { Web3Service } from "src/web3.service";
import { PatchUserWalletDto } from "./dto/patch-user-wallet.dto";
import { UserLoginDto } from "./dto/user-login.dto";
import { UserRegisterDto } from "./dto/user-register.dto";
import {
  linkWalletApiResponse,
  loginApiResponse,
  registerApiResponse,
} from "./schema";
@Controller("playfab")
@ApiTags("PlayFab")
export class PlayFabController {
  constructor(
    private readonly PlayFabService: PlayFabService,
    private readonly web3Service: Web3Service
  ) {}

  @Post("register")
  @ApiResponse(registerApiResponse)
  async register(@Body() userRegisterDto: UserRegisterDto) {
    const { email, password } = userRegisterDto;
    return await this.PlayFabService.registerPlayFabUser(email, password);
  }

  @Post("login")
  @ApiResponse(loginApiResponse)
  async login(@Body() userLoginDto: UserLoginDto) {
    const { email, password } = userLoginDto;
    return await this.PlayFabService.login(email, password);
  }

  @Patch("link-wallet")
  @ApiResponse(linkWalletApiResponse)
  async walletLink(@Body() patchUserWalletDto: PatchUserWalletDto) {
    const { sessionTicket, walletAddress, signature } = patchUserWalletDto;

    const userInfo =
      await this.PlayFabService.validateAndGetUserInfoBySessionTicket(
        sessionTicket
      );

    return await this.PlayFabService.updateUserWalletAddress(
      userInfo.PlayFabId,
      walletAddress,
      signature
    );
  }
}
