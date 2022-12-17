import { Body, Controller, Post } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { NonceService } from "src/services/nonce/nonce.service";
import { GetNonceDto } from "./dto/get-nonce.dto";
import { nonceApiResponse } from "./schema";

@Controller("nonce")
@ApiTags("Nonce")
export class NonceController {
  constructor(private readonly nonceService: NonceService) {
  }

  @Post()
  @ApiResponse(nonceApiResponse)
  async createAndGetNonce(@Body() getNonceDto: GetNonceDto) {
    const { walletAddress } = getNonceDto;
    return await this.nonceService.createAndGetNonce(walletAddress);
  }
}
