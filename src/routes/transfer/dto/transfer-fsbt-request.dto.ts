import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class TransferFsbtRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  sessionTicket: string;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  itemIds: number[];

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  entitlementIds: number[];
}
