import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class PatchUserWalletDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  sessionTicket: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  signature: string;
}
