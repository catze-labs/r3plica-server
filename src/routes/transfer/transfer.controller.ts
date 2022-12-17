import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@Controller("transfer")
@ApiTags("Transfer")
export class TransferController {}
