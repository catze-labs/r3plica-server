import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { PlayFabService } from "src/services/playfab/playfab.service";
import { Web3Service } from "src/web3.service";
import { TransferFsbtRequestDto } from "./dto/transfer-fsbt-request.dto";
import { TransferFsbtDto } from "./dto/transfer-fsbt.dto";
import {
  getTransferHistoryResponse,
  postItemsAndAchievementsTransferResponse,
  postProfileTransferResponse,
} from "./schema";

@Controller("")
@ApiTags("Transfer")
export class TransferController {
  constructor(
    private playFabService: PlayFabService,
    private web3Service: Web3Service
  ) {}

  @Get("transfer-history")
  @ApiResponse(getTransferHistoryResponse)
  async getTransferHistory(@Query() transferFsbtDto: TransferFsbtDto) {
    const { sessionTicket } = transferFsbtDto;

    const userInfo =
      await this.playFabService.validateAndGetUserInfoBySessionTicket(
        sessionTicket
      );

    return await this.web3Service.getFsbtTransfers(userInfo.PlayFabId);
  }

  @Post("transfer")
  @ApiResponse(postItemsAndAchievementsTransferResponse)
  async transferFsbtToUser(
    @Body() transferFsbtRequestDto: TransferFsbtRequestDto
  ) {
    const { sessionTicket, itemIds, achievementIds } = transferFsbtRequestDto;

    const userInfo =
      await this.playFabService.validateAndGetUserInfoBySessionTicket(
        sessionTicket
      );

    return await this.web3Service.transferFsbtToWallet(
      userInfo.PlayFabId,
      itemIds,
      achievementIds
    );
  }

  @Post("profile-transfer")
  @ApiResponse(postProfileTransferResponse)
  async transferProfileFsbtToUser(@Body() transferFsbtDto: TransferFsbtDto) {
    const { sessionTicket } = transferFsbtDto;

    const userInfo =
      await this.playFabService.validateAndGetUserInfoBySessionTicket(
        sessionTicket
      );

    return await this.web3Service.transferProfileFsbtToWallet(
      userInfo.PlayFabId
    );
  }
}
