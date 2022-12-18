import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Web3Service } from "src/web3.service";

@Controller("metadata")
@ApiTags("Metadata")
export class MetadataController {
  constructor(private web3Service: Web3Service) {}

  @Get("/items/:tokenId")
  async getItemTokenMetadata(@Param("tokenId") tokenId: string) {
    return this.web3Service.getItemTokenMetadata(tokenId);
  }

  @Get("/entitlements/:tokenId")
  async getEntitlementTokenMetadata(@Param("tokenId") tokenId: string) {
    return this.web3Service.getEntitlementTokenMetadata(tokenId);
  }

  @Get("/profiles/:tokenId")
  async getProfileTokenMetadata(@Param("tokenId") tokenId: string) {
    return this.web3Service.getProfileTokenMetadata(tokenId);
  }
}
