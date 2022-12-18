import { Injectable, UnauthorizedException } from "@nestjs/common";
import { NonceService } from "../nonce/nonce.service";
import { verifyMessage } from "@ethersproject/wallet";

@Injectable()
export class SignatureService {
  constructor(private readonly nonceService: NonceService) {}

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
  ): Promise<string> {
    const nonce = await this.nonceService.getNotUsedLatestNonce(walletAddress);

    if (nonce !== null) {
      await this.nonceService.updateNonceToUsed(nonce.id);
      return verifyMessage(nonce.value, signature);
    }
  }
}
