import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { PlayFabService } from "src/services/playfab/playfab.service";
import { PlayFabRequestDto } from "./dto/playfab-request.dto";
import { UserLoginDto } from "./dto/user-login.dto";
import { UserRegisterDto } from "./dto/user-register.dto";
import {
  entitlementsApiResponse,
  itemsApiResponse,
  loginApiResponse,
  registerApiResponse,
} from "./schema";

@Controller("playfab")
@ApiTags("PlayFab")
export class PlayFabController {
  constructor(private readonly PlayFabService: PlayFabService) {}

  @Post("register")
  @ApiResponse(registerApiResponse)
  async register(@Body() userRegisterDto: UserRegisterDto) {
    const { email, password } = userRegisterDto;
    return await this.PlayFabService.registerPlayFabUser(email, password);
  }

  @Post("login")
  @ApiResponse(loginApiResponse)
  @HttpCode(200)
  async login(@Body() userLoginDto: UserLoginDto) {
    const { email, password } = userLoginDto;
    return await this.PlayFabService.login(email, password);
  }

  @Get("items")
  @ApiResponse(itemsApiResponse)
  async getItems(@Query() playFabRequestDto: PlayFabRequestDto) {
    const { sessionTicket } = playFabRequestDto;
    const userInfo =
      await this.PlayFabService.validateAndGetUserInfoBySessionTicket(
        sessionTicket
      );

    return {
      items: await this.PlayFabService.getUserItems(userInfo.PlayFabId),
    };
  }

  @Get("entitlements")
  @ApiResponse(entitlementsApiResponse)
  async getEntitlements(@Query() playFabRequestDto: PlayFabRequestDto) {
    const { sessionTicket } = playFabRequestDto;
    const userInfo =
      await this.PlayFabService.validateAndGetUserInfoBySessionTicket(
        sessionTicket
      );

    return {
      entitlements: await this.PlayFabService.getUserEntitlements(
        userInfo.PlayFabId
      ),
    };
  }
}
