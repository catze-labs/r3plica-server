import { Body, Controller, Patch } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { PlayFabService } from "src/services/playfab/playfab.service";
import { PatchUserWalletDto } from "./dto/patch-user-wallet.dto";
import { linkWalletApiResponse } from "./schema";

@Controller("user")
@ApiTags("User")
export class UserController {
  constructor(private readonly PlayFabService: PlayFabService) {}

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
