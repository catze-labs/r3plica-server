import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { NonceService } from "../nonce/nonce.service";
import { verifyMessage } from "@ethersproject/wallet";
@Injectable()
export class SignatureService {
  constructor(
    private readonly nonceService: NonceService,
    private readonly prismaService: PrismaService
  ) {}

  public async validateUserAddress(
    apiCallerAddress: string | undefined,
    compareWalletAddress: string | undefined
  ) {
    if (
      !apiCallerAddress ||
      !compareWalletAddress ||
      apiCallerAddress !== compareWalletAddress
    ) {
      throw new UnauthorizedException({
        message: "Permission denied",
        data: {
          apiCallerAddress,
          compareWalletAddress,
        },
      });
    }
  }

  public async getAddress(
    walletAddress: string,
    signature: string
  ): Promise<string | undefined> {
    const nonce = await this.nonceService.getNotUsedLatestNonce(walletAddress);

    if (nonce !== null) {
      await this.nonceService.updateNonceToUsed(nonce.id);

      let recoveredAddress: string | undefined;
      recoveredAddress = verifyMessage(nonce.value, signature);

      return recoveredAddress;
    }
  }
}
