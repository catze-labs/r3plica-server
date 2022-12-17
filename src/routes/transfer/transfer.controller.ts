import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { PlayFabService } from "src/services/playfab/playfab.service";
import { Web3Service } from "src/web3.service";
import { EntitlementFsbtTransferRequestDto } from "./dto/entitlement-fsbt-transfer-request.dto copy";
import { ItemFsbtTransferRequestDto } from "./dto/item-fsbt-transfer-request.dto";
import { GetTransferDto } from "./dto/get-transfer.dto";
import { getTransferResponse, postTransferResponse } from "./schema";

@Controller("transfer")
@ApiTags("Transfer")
export class TransferController {
  constructor(
    private playFabService: PlayFabService,
    private web3Service: Web3Service
  ) {}

  @Get()
  @ApiResponse(getTransferResponse)
  async getTransfers(@Query() getTransferDto: GetTransferDto) {
    const { sessionTicket } = getTransferDto;

    const userInfo =
      await this.playFabService.validateAndGetUserInfoBySessionTicket(
        sessionTicket
      );

    return await this.web3Service.getFsbtTransferList(userInfo.PlayFabId);
  }

  @Post("item-transfer-request")
  @ApiResponse(postTransferResponse)
  async itemFSBTTransferRequest(
    @Body() itemFsbtTransferRequestDto: ItemFsbtTransferRequestDto
  ) {
    const { sessionTicket, itemIds } = itemFsbtTransferRequestDto;

    const userInfo =
      await this.playFabService.validateAndGetUserInfoBySessionTicket(
        sessionTicket
      );

    return await this.web3Service.enQueueItemFsbtTransfer(
      userInfo.PlayFabId,
      itemIds
    );
  }

  @Post("entitlement-transfer-request")
  @ApiResponse(postTransferResponse)
  async entitlementFSBTTransferRequest(
    @Body() entitlementFsbtTransferRequestDto: EntitlementFsbtTransferRequestDto
  ) {
    const { sessionTicket, entitlementIds } = entitlementFsbtTransferRequestDto;

    const userInfo =
      await this.playFabService.validateAndGetUserInfoBySessionTicket(
        sessionTicket
      );

    return await this.web3Service.enQueueEntitlementFsbtTransfer(
      userInfo.PlayFabId,
      entitlementIds
    );
  }
}
