import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class UserLoginDto {
  @ApiProperty({
    example: "test@testtest.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "1234qwer!",
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
