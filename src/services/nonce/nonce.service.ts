import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { makeRandomAlphaNumericString } from "src/utils";
import { Md5 } from "ts-md5";

@Injectable()
export class NonceService {
  constructor(private readonly prismaService: PrismaService) {}

  async createAndGetNonce(walletAddress: string) {
    const randomStr: string = Md5.hashStr(
      Date.now().toString() + makeRandomAlphaNumericString(6)
    );
    const value: string =
      "\x19Signed Message:\n" + randomStr.length + randomStr;
    const nonce = await this.prismaService.nonce.create({
      data: {
        address: walletAddress,
        value,
      },
    });

    return { nonce: nonce.value };
  }

  async getNotUsedLatestNonce(walletAddress: string) {
    return this.prismaService.nonce.findFirst({
      where: {
        address: walletAddress,
        used: false,
      },
      orderBy: {
        id: "desc",
      },
    });
  }

  async updateNonceToUsed(id: number) {
    await this.prismaService.nonce.update({
      where: {
        id,
      },
      data: {
        used: true,
      },
    });
  }
}
