import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { Web3Service } from "src/web3.service";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private web3Service: Web3Service
  ) {}

  @Get("/health")
  @ApiTags("Server")
  async getHealth() {
    await this.web3Service.getProfileTokenId("8EA94BEC5C76F576");
    return true;
  }
}
