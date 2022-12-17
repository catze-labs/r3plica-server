import { BadRequestException, Injectable, NotFoundException, } from "@nestjs/common";
import { user } from "@prisma/client";
import Web3 from "web3";
import { TESTNET_IMPL_CONTRACT_ABI, TESTNET_PROXY_CONTRACT_ADDRESS, } from "./constants";
import { PrismaService } from "./prisma.service";
import { PlayFabService } from "./services/playfab/playfab.service";

@Injectable()
export class Web3Service {
  private provider = new Web3.providers.HttpProvider(
    process.env.BSC_TEST_PROVIDER
  );
  private web3 = new Web3(this.provider);

  constructor(
    private prismaService: PrismaService,
    private playFabService: PlayFabService
  ) {
  }

  async getFsbtTransferList(playFabId: string) {
    const itemTransfers = await this.prismaService.itemTransfer.findMany({
      where: {
        playFabId,
      },
    });

    const entitlementTransfers =
      await this.prismaService.entitlementTransfer.findMany({
        where: {
          playFabId,
        },
      });

    return {
      itemTransfers,
      entitlementTransfers,
    };
  }

  async fsbtTransferToWallet(
    playFabId: string,
    itemIds: number[],
    entitlementIds: number[]
  ) {
    const user: user = await this.prismaService.user.findUnique({
      where: {
        playFabId,
      },
    });

    if (!user) {
      throw new NotFoundException({
        message: "User Not found",
        playFabId,
      });
    }

    const walletAddress = user.walletAddress;
    if (!walletAddress) {
      throw new NotFoundException({
        message: "User wallet is not linked",
        playFabId,
      });
    }

    // TODO: Call contract
    //
    // const contract = new this.web3.eth.Contract(
    //   TESTNET_IMPL_CONTRACT_ABI,
    //   TESTNET_PROXY_CONTRACT_ADDRESS
    // );
    //
    // // TODO : Inject data in contract
    // // Encode the function call
    // const encoded = contract.methods.attest(walletAddress, 1).encodeABI();
    //
    // // Get the gas limit
    // const block = await this.web3.eth.getBlock("latest");
    // const gasLimit = Math.round(block.gasLimit / block.transactions.length);
    //
    // // Create the transaction
    // const tx = {
    //   gas: gasLimit,
    //   to: TESTNET_PROXY_CONTRACT_ADDRESS,
    //   data: encoded,
    // };
    //
    // try {
    //   // Sign the transaction
    //   this.web3.eth.accounts
    //     .signTransaction(tx, process.env.PRIVATE_KEY)
    //     .then((signed) => {
    //       // TODO : Insert Transfer row in DB
    //       this.web3.eth
    //         .sendSignedTransaction(signed.rawTransaction)
    //         .on("receipt", console.log);
    //     });
    // } catch (err) {
    //   console.log(err);
    // }
  }
}
