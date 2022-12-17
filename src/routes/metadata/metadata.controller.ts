import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Web3Service } from "src/web3.service";

@Controller("metadata")
@ApiTags("Metadata")
export class MetadataController {
  constructor(private web3Service: Web3Service) {}

  @Get("/item/:id")
  async getItemTokenMetadata(@Param("id") id: string) {
    return this.web3Service.getItemTokenMetadata(id);
  }

  @Get("/entitlement/:id")
  async getEntitlementTokenMetadata(@Param("id") id: string) {
    return this.web3Service.getEntitlementTokenMetadata(id);
  }

  @Get("/profile/:id")
  async getProfileTokenMetadata(@Param("id") id: string) {
    return this.web3Service.getProfileTokenMetadata(id);
  }
}
