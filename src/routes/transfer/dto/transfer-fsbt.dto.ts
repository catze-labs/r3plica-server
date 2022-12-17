import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class TransferFsbtDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  sessionTicket: string;
}
