import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { SlackMessageField } from "src/types";

export class PostSlackNotificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  ts?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  fields?: SlackMessageField[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  footer?: string;

  @ApiProperty({
    description: "Enable markdown parsing",
  })
  @IsBoolean()
  @IsOptional()
  mrkdwn?: boolean;
}
