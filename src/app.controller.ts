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
  getHello(): boolean {
    this.web3Service.getProfileTokenId("C4903B215B0AA563");
    return true;
  }
}
