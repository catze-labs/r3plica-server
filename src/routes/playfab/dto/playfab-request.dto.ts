import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class PlayFabRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  sessionTicket: string;
}
