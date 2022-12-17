import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GetTransferDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  sessionTicket: string;
}
