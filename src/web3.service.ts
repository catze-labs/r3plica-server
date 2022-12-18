import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { user } from "@prisma/client";
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

  async getAchievementTokenMetadata(tokenId: string) {
    return this.prismaService.achievementToken.findUnique({
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

    const achievementTransfers =
      await this.prismaService.achievementTransfer.findMany({
        where: {
          playFabId,
        },
      });

    return {
      profileTransfers,
      itemTransfers,
      achievementTransfers,
    };
  }

  async transferFsbtToWallet(
    playFabId: string,
    itemIds: number[],
    achievementIds: number[]
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

    const achievementTokens =
      await this.prismaService.achievementToken.findMany({
        where: {
          playFabId,
          achievementId: {
            in: achievementIds,
          },
        },
      });

    let achievementTokenIds = [];
    let profileIdsByAchievementIds = [];
    for (const achievementToken of achievementTokens) {
      achievementTokenIds.push(achievementToken.tokenId);
      profileIdsByAchievementIds.push(playFabId);
    }

    const itemTokens = await this.prismaService.itemToken.findMany({
      where: {
        playFabId,
        itemId: {
          in: itemIds,
        },
      },
    });
    let itemTokenIds = [];
    let profileIdsByItemIds = [];
    for (const itemToken of itemTokens) {
      itemTokenIds.push(itemToken.tokenId);
      profileIdsByItemIds.push(playFabId);
    }

    const contract = new this.web3.eth.Contract(
      TESTNET_PAFSBT_IMPL_CONTRACT_ABI,
      TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS
    );
    const encoded = contract.methods
      .batchSetQuestAndItemMaps(
        achievementIds,
        profileIdsByAchievementIds,
        itemIds,
        profileIdsByItemIds
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

    let txHash;
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
      txHash = receipt.transactionHash;

      let achievementTransferCreateData = [];
      let itemTransferCreateData = [];
      for (const achievementToken of achievementTokens) {
        achievementTransferCreateData.push({
          playFabId: playFabId,
          txHash,
          contractAddress: TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
          achievementId: achievementToken.achievementId,
        });
      }
      for (const itemToken of itemTokens) {
        itemTransferCreateData.push({
          playFabId: playFabId,
          txHash,
          contractAddress: TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
          itemId: itemToken.itemId,
        });
      }

      await Promise.all([
        this.prismaService.achievementTransfer.createMany({
          data: achievementTransferCreateData,
          skipDuplicates: true,
        }),
        this.prismaService.itemTransfer.createMany({
          data: itemTransferCreateData,
          skipDuplicates: true,
        }),
      ]);
    } catch (err) {
      console.log(err);
    }

    return { txHash };
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

  async bindQfsbtToProfile(profileTokenId: string, achievementTokenId: string) {
    const contract = new this.web3.eth.Contract(
      TESTNET_QAFSBT_IMPL_CONTRACT_ABI,
      TESTNET_QAFSBT_PROXY_CONTRACT_ADDRESS
    );

    const encoded = contract.methods
      .setQuestIdAndProfileId(
        Number(profileTokenId),
        Number(achievementTokenId)
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

  async transferProfileFsbtToWallet(playFabId: string) {
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
