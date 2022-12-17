import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class EntitlementFsbtTransferRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  sessionTicket: string;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  entitlementIds: number[];
}
