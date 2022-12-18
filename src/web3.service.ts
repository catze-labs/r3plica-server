import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { entitlementToken, itemToken, user } from "@prisma/client";
import Web3 from "web3";
import {
  TESTNET_IAFSBT_IMPL_CONTRACT_ABI,
  TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
  TESTNET_PAFSBT_IMPL_CONTRACT_ABI,
  TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
  TESTNET_QAFSBT_IMPL_CONTRACT_ABI,
  TESTNET_QAFSBT_PROXY_CONTRACT_ADDRESS,
} from "./constants";
import { PrismaService } from "./prisma.service";

@Injectable()
export class Web3Service {
  private provider = new Web3.providers.HttpProvider(
    process.env.BSC_TEST_PROVIDER
  );
  private web3 = new Web3(this.provider);

  constructor(private prismaService: PrismaService) {}

  async getItemTokenMetadata(tokenId: string) {
    return this.prismaService.itemToken.findUnique({
      where: {
        tokenId,
      },
    });
  }

  async getEntitlementTokenMetadata(tokenId: string) {
    return this.prismaService.entitlementToken.findUnique({
      where: {
        tokenId,
      },
    });
  }

  async getProfileTokenMetadata(tokenId: string) {
    //
  }

  async getFsbtTransfers(playFabId: string) {
    const profileTransfers = await this.prismaService.profileTransfer.findMany({
      where: {
        playFabId,
      },
    });

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
      profileTransfers,
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

    const itemTxList = [];
    const entitlementTxList = [];
    const itemTokens: itemToken[] = await this.prismaService.itemToken.findMany(
      {
        where: {
          playFabId: playFabId,
          itemId: {
            in: itemIds,
          },
        },
      }
    );
    const itemContract = new this.web3.eth.Contract(
      TESTNET_IAFSBT_IMPL_CONTRACT_ABI,
      TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS
    );

    for (const itemToken of itemTokens) {
      const encoded = itemContract.methods
        .limitedTransfer(walletAddress, 1)
        .encodeABI();

      // Get the gas limit
      const block = await this.web3.eth.getBlock("latest");
      const gasLimit = Math.round(block.gasLimit / block.transactions.length);

      // Create the transaction
      const tx = {
        gas: gasLimit,
        to: TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
        data: encoded,
      };

      try {
        // Sign the transaction
        const signedTx = await this.web3.eth.accounts.signTransaction(
          tx,
          process.env.PRIVATE_KEY
        );

        // Get tx receipt
        const receipt = await this.web3.eth.sendSignedTransaction(
          signedTx.rawTransaction
        );

        // Create itemTransfer history
        await this.prismaService.itemTransfer.create({
          data: {
            playFabId: playFabId,
            txHash: receipt.transactionHash,
            contractAddress: TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
            itemId: itemToken.itemId,
          },
        });

        itemTxList.push({
          itemId: itemToken.itemId,
          txHash: receipt.transactionHash,
        });
      } catch (err) {
        console.log(err);
      }
    }

    // Entitlements
    const entitlementTokens: entitlementToken[] =
      await this.prismaService.entitlementToken.findMany({
        where: {
          playFabId: playFabId,
          entitlementId: {
            in: entitlementIds,
          },
        },
      });
    const entitlementContract = new this.web3.eth.Contract(
      TESTNET_QAFSBT_IMPL_CONTRACT_ABI,
      TESTNET_QAFSBT_PROXY_CONTRACT_ADDRESS
    );

    for (const entitlementToken of entitlementTokens) {
      const encoded = entitlementContract.methods
        .limitedTransfer(walletAddress, 1)
        .encodeABI();

      // Get the gas limit
      const block = await this.web3.eth.getBlock("latest");
      const gasLimit = Math.round(block.gasLimit / block.transactions.length);

      // Create the transaction
      const tx = {
        gas: gasLimit,
        to: TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
        data: encoded,
      };

      try {
        // Sign the transaction
        const signedTx = await this.web3.eth.accounts.signTransaction(
          tx,
          process.env.PRIVATE_KEY
        );

        // Get tx receipt
        const receipt = await this.web3.eth.sendSignedTransaction(
          signedTx.rawTransaction
        );

        // Create itemTransfer history
        await this.prismaService.entitlementTransfer.create({
          data: {
            playFabId: playFabId,
            txHash: receipt.transactionHash,
            contractAddress: TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
            entitlementId: entitlementToken.entitlementId,
          },
        });

        entitlementTxList.push({
          itemId: entitlementToken.entitlementId,
          txHash: receipt.transactionHash,
        });
      } catch (err) {
        console.log(err);
      }
    }

    return {
      itemTxList,
      entitlementTxList,
    };
  }

  async bindIfsbtToProfile(profileTokenId: string, itemTokenId: string) {
    const contract = new this.web3.eth.Contract(
      TESTNET_IAFSBT_IMPL_CONTRACT_ABI,
      TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS
    );

    const encoded = contract.methods
      .setItemIdAndProfileId(Number(profileTokenId), Number(itemTokenId))
      .encodeABI();

    // Get the gas limit
    const block = await this.web3.eth.getBlock("latest");
    const gasLimit = Math.round(block.gasLimit / block.transactions.length);

    // Create the transaction
    const tx = {
      gas: gasLimit,
      to: TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
      data: encoded,
    };

    try {
      // Sign the transaction
      const signedTx = await this.web3.eth.accounts.signTransaction(
        tx,
        process.env.PRIVATE_KEY
      );

      // Get tx receipt
      const receipt = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );
    } catch (err) {
      console.log(err);
    }
  }

  async bindQfsbtToProfile(profileTokenId: string, entitlementTokenId: string) {
    const contract = new this.web3.eth.Contract(
      TESTNET_QAFSBT_IMPL_CONTRACT_ABI,
      TESTNET_QAFSBT_PROXY_CONTRACT_ADDRESS
    );

    const encoded = contract.methods
      .setQuestIdAndProfileId(
        Number(profileTokenId),
        Number(entitlementTokenId)
      )
      .encodeABI();

    // Get the gas limit
    const block = await this.web3.eth.getBlock("latest");
    const gasLimit = Math.round(block.gasLimit / block.transactions.length);

    // Create the transaction
    const tx = {
      gas: gasLimit,
      to: TESTNET_QAFSBT_PROXY_CONTRACT_ADDRESS,
      data: encoded,
    };

    try {
      // Sign the transaction
      const signedTx = await this.web3.eth.accounts.signTransaction(
        tx,
        process.env.PRIVATE_KEY
      );

      // Get tx receipt
      const receipt = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );
    } catch (err) {
      console.log(err);
    }
  }

  async mintPAFSBT(user: user) {
    const contract = new this.web3.eth.Contract(
      TESTNET_PAFSBT_IMPL_CONTRACT_ABI,
      TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS
    );

    const address = this.web3.eth.accounts.privateKeyToAccount(
      process.env.PRIVATE_KEY
    ).address;

    // Encode the function call
    const encoded = contract.methods
      .attest(
        address,
        1,
        this.web3.utils.asciiToHex(user.playFabId),
        this.web3.utils.asciiToHex(user.created.valueOf().toString())
      )
      .encodeABI();

    // Get the gas limit
    const block = await this.web3.eth.getBlock("latest");
    const gasLimit = Math.round(block.gasLimit / block.transactions.length);

    // Create the transaction
    const tx = {
      gas: gasLimit,
      to: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
      data: encoded,
    };

    try {
      // Sign the transaction
      const signedTx = await this.web3.eth.accounts.signTransaction(
        tx,
        process.env.PRIVATE_KEY
      );

      const receipt = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );

      await this.prismaService.profileMint.create({
        data: {
          playFabId: user.playFabId,
          txHash: receipt.transactionHash,
          contractAddress: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
        },
      });

      Logger.debug(`PAFSBT mint request Tx sended for user ${user.playFabId}`);

      return receipt.transactionHash;
    } catch (err) {
      console.log(err);
    }
  }

  async profileFsbtToWallet(playFabId: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        playFabId,
      },
    });

    if (!user.walletAddress) {
      throw new NotFoundException("User wallet is not linked");
    }

    const profileToken = await this.prismaService.profileToken.findFirst({
      where: {
        playFabId,
      },
    });

    if (!profileToken) {
      throw new NotFoundException("User has not minted PAFSBT token");
    }

    const contract = new this.web3.eth.Contract(
      TESTNET_PAFSBT_IMPL_CONTRACT_ABI,
      TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS
    );

    // Encode the function call
    const encoded = contract.methods
      .limitedTransfer(profileToken.tokenId)
      .encodeABI();

    // Get the gas limit
    const block = await this.web3.eth.getBlock("latest");
    const gasLimit = Math.round(block.gasLimit / block.transactions.length);

    // Create the transaction
    const tx = {
      gas: gasLimit,
      to: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
      data: encoded,
    };

    try {
      // Sign the transaction
      const signedTx = await this.web3.eth.accounts.signTransaction(
        tx,
        process.env.PRIVATE_KEY
      );

      const receipt = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );

      await this.prismaService.profileTransfer.create({
        data: {
          playFabId: user.playFabId,
          txHash: receipt.transactionHash,
          contractAddress: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
        },
      });

      Logger.debug(`mint PAFSBT tx is sent for user ${user.playFabId}`);

      return { txHash: receipt.transactionHash };
    } catch (err) {
      console.log(err);
    }
  }
}
