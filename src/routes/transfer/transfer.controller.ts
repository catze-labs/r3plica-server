import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { PlayFabService } from "src/services/playfab/playfab.service";
import { Web3Service } from "src/web3.service";
import { TransferFsbtRequestDto } from "./dto/transfer-fsbt-request.dto";
import { TransferFsbtDto } from "./dto/transfer-fsbt.dto";
import { getTransferHistoryResponse, postTransferResponse } from "./schema";

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

  // TODO : Add ApiResponse
  @Post("transfer")
  @ApiResponse(postTransferResponse)
  async transferFsbtToUser(
    @Body() transferFsbtRequestDto: TransferFsbtRequestDto
  ) {
    const { sessionTicket, itemIds, entitlementIds } = transferFsbtRequestDto;

    const userInfo =
      await this.playFabService.validateAndGetUserInfoBySessionTicket(
        sessionTicket
      );

    return await this.web3Service.fsbtTransferToWallet(
      userInfo.PlayFabId,
      itemIds,
      entitlementIds
    );
  }

  @Post("profile-transfer")
  @ApiResponse(postTransferResponse)
  async transferProfileFsbtToUser(@Body() transferFsbtDto: TransferFsbtDto) {
    const { sessionTicket } = transferFsbtDto;

    const userInfo =
      await this.playFabService.validateAndGetUserInfoBySessionTicket(
        sessionTicket
      );

    return await this.web3Service.profileFsbtToWallet(userInfo.PlayFabId);
  }
}
