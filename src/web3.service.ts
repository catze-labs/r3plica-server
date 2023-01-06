import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { user } from "@prisma/client";
import Web3 from "web3";
import {
  TESTNET_PAFSBT_IMPL_CONTRACT_ABI,
  TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
} from "./constants";
import { PrismaService } from "./prisma.service";
import { ethers } from "ethers";
import { axiosReturnOrThrow } from "./utils";
import axios from "axios";

@Injectable()
export class Web3Service {
  private provider = new Web3.providers.HttpProvider(
    process.env.BSC_TEST_PROVIDER
  );
  private web3 = new Web3(this.provider);

  constructor(private prismaService: PrismaService) {}

  async getFsbtTransfers(playFabId: string) {
    const profileTransfers = await this.prismaService.profileTransfer.findMany({
      where: {
        chain: "BNB",
        playFabId,
      },
    });

    const itemTransfers = await this.prismaService.itemTransfer.findMany({
      where: {
        chain: "BNB",
        playFabId,
      },
    });

    const achievementTransfers =
      await this.prismaService.achievementTransfer.findMany({
        where: {
          chain: "BNB",
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

    if (user.chain !== "BNB") {
      throw new NotFoundException({
        message: "Not r3plica BNB user",
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

    const deployAddress = this.web3.eth.accounts.privateKeyToAccount(
      process.env.PRIVATE_KEY
    ).address;

    const contract = new this.web3.eth.Contract(
      TESTNET_PAFSBT_IMPL_CONTRACT_ABI,
      TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS
    );

    const achievementTokens =
      await this.prismaService.achievementToken.findMany({
        where: {
          chain: "BNB",
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
      profileIdsByAchievementIds.push(
        ethers.utils.formatBytes32String(playFabId)
      );
    }

    const itemTokens = await this.prismaService.itemToken.findMany({
      where: {
        chain: "BNB",
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
      profileIdsByItemIds.push(ethers.utils.formatBytes32String(playFabId));
    }

    const nonce = await this.web3.eth.getTransactionCount(
      deployAddress,
      "latest"
    );
    const gas = Number(await this.web3.eth.getGasPrice());
    const gasLimit = 6000000;

    // Create the transactions and estimate gas fee
    const setAchievementIdsAndProfileIdsTx = {
      to: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
      data: contract.methods
        .setAchievementIdsAndProfileIds(
          achievementTokenIds,
          profileIdsByAchievementIds
        )
        .encodeABI(),
      nonce,
      gas: gas * 2 + "",
      gasLimit,
    };

    const setItemIdsAndProfileIdsTx = {
      to: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
      data: contract.methods
        .setItemIdsAndProfileIds(itemTokenIds, profileIdsByItemIds)
        .encodeABI(),
      nonce: nonce + 1,
      gas: gas * 2 + "",
      gasLimit,
    };

    // sign and send Tx
    let setAchievementIdsAndProfileIdsTxHash;
    let setItemIdsAndProfileIdsTxHash;
    try {
      // Sign the transaction
      const [
        signedSetAchievementIdsAndProfileIdsTx,
        signedSetItemIdsAndProfileIdsTx,
      ] = await Promise.all([
        this.web3.eth.accounts.signTransaction(
          setAchievementIdsAndProfileIdsTx,
          process.env.PRIVATE_KEY
        ),
        this.web3.eth.accounts.signTransaction(
          setItemIdsAndProfileIdsTx,
          process.env.PRIVATE_KEY
        ),
      ]);

      //  tx receipt
      const [
        setAchievementIdsAndProfileIdsTxReceipt,
        setItemIdsAndProfileIdsTxReceipt,
      ] = await Promise.all([
        this.web3.eth.sendSignedTransaction(
          signedSetAchievementIdsAndProfileIdsTx.rawTransaction
        ),
        this.web3.eth.sendSignedTransaction(
          signedSetItemIdsAndProfileIdsTx.rawTransaction
        ),
      ]);

      setAchievementIdsAndProfileIdsTxHash =
        setAchievementIdsAndProfileIdsTxReceipt.transactionHash;
      setItemIdsAndProfileIdsTxHash =
        setItemIdsAndProfileIdsTxReceipt.transactionHash;

      let achievementTransferCreateData = [];
      let itemTransferCreateData = [];
      for (const achievementToken of achievementTokens) {
        achievementTransferCreateData.push({
          chain: "BNB",
          playFabId: playFabId,
          txHash: setAchievementIdsAndProfileIdsTxHash,
          contractAddress: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
          achievementId: achievementToken.achievementId,
        });
      }
      for (const itemToken of itemTokens) {
        itemTransferCreateData.push({
          chain: "BNB",
          playFabId: playFabId,
          txHash: setItemIdsAndProfileIdsTxHash,
          contractAddress: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
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
      console.log("error");
      console.log(err);
    }

    return {
      achievementTxHash: setAchievementIdsAndProfileIdsTxHash,
      itemTxHash: setItemIdsAndProfileIdsTxHash,
    };
  }

  async bindItemIdsToProfileIds(
    itemTokenIds: string[],
    profileTokenIds: string[]
  ) {
    const contract = new this.web3.eth.Contract(
      TESTNET_PAFSBT_IMPL_CONTRACT_ABI,
      TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS
    );

    const encoded = contract.methods
      .setItemIdsAndProfileIds(itemTokenIds, profileTokenIds)
      .encodeABI();

    // Create the transaction
    const tx = {
      to: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
      data: encoded,
    };

    tx["gas"] = await this.web3.eth.estimateGas(tx);

    try {
      // Sign the transaction
      const signedTx = await this.web3.eth.accounts.signTransaction(
        tx,
        process.env.PRIVATE_KEY
      );

      await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    } catch (err) {
      console.log(err);
    }
  }

  async bindAchievementIdsToProfileIds(
    achievementTokenIds: string[],
    profileTokenIds: string[]
  ) {
    const contract = new this.web3.eth.Contract(
      TESTNET_PAFSBT_IMPL_CONTRACT_ABI,
      TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS
    );

    const encoded = contract.methods
      .setAchievementIdsAndProfileIds(achievementTokenIds, profileTokenIds)
      .encodeABI();

    const tx = {
      to: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
      data: encoded,
    };

    // get estimated gas
    tx["gas"] = await this.web3.eth.estimateGas(tx);

    // Create the transaction

    try {
      // Sign the transaction
      const signedTx = await this.web3.eth.accounts.signTransaction(
        tx,
        process.env.PRIVATE_KEY
      );

      await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    } catch (err) {
      console.log(err);
    }
  }

  async mintPAFSBT(playFabId: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        playFabId,
      },
    });

    if (user.chain !== "BNB") {
      throw new NotFoundException({
        message: "Not r3plica BNB user",
        playFabId,
      });
    }

    const contract = new this.web3.eth.Contract(
      TESTNET_PAFSBT_IMPL_CONTRACT_ABI,
      TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS
    );

    const address = this.web3.eth.accounts.privateKeyToAccount(
      process.env.PRIVATE_KEY
    ).address;

    // Encode the function call
    const encoded = contract.methods
      .batchAttest(
        [address],
        [1],
        [ethers.utils.formatBytes32String(user.playFabId)],
        [ethers.utils.formatBytes32String(user.created.valueOf().toString())]
      )
      .encodeABI();

    // Create the transaction
    const tx = {
      from: address,
      to: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
      data: encoded,
    };
    tx["gas"] = await this.web3.eth.estimateGas(tx);

    try {
      // Sign the transaction
      const signedTx = await this.web3.eth.accounts.signTransaction(
        tx,
        process.env.PRIVATE_KEY
      );

      const receipt = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );
      const tokenId = await this.getProfileTokenId(user.playFabId);
      await this.prismaService.profileMint.create({
        data: {
          chain: "BNB",
          playFabId: user.playFabId,
          tokenId,
          txHash: receipt.transactionHash,
          contractAddress: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
        },
      });

      Logger.debug(
        `BNB PAFSBT mint request Tx sended - User ${user.playFabId} : Tx ${receipt["transactionHash"]}`
      );

      return receipt["transactionHash"];
    } catch (err) {
      console.log("error", err);
    }
  }

  async transferProfileFsbtToWallet(playFabId: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        playFabId,
      },
    });

    if (user.chain !== "BNB") {
      throw new NotFoundException({
        message: "Not r3plica BNB user",
        playFabId,
      });
    }

    if (!user.walletAddress) {
      throw new NotFoundException("User wallet is not linked");
    }

    const profileToken = await this.prismaService.profileToken.findFirst({
      where: {
        chain: "BNB",
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

    const deployAddress = this.web3.eth.accounts.privateKeyToAccount(
      process.env.PRIVATE_KEY
    ).address;

    // Encode the function call
    const encoded = contract.methods
      .limitedTransfer(deployAddress, user.walletAddress, profileToken.tokenId)
      .encodeABI();

    // Create the transaction
    const tx = {
      to: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
      data: encoded,
    };

    // get estimated gas
    tx["gas"] = await this.web3.eth.estimateGas(tx);

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
          chain: "BNB",
          playFabId: user.playFabId,
          txHash: receipt.transactionHash,
          contractAddress: TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS,
        },
      });

      Logger.debug(`BNB - PAFSBT is sent for user ${user.playFabId}`);

      return { txHash: receipt["transactionHash"] };
    } catch (err) {
      console.log(err);
    }
  }

  async getProfileTokenId(playFabId: string): Promise<string> {
    const contract = new this.web3.eth.Contract(
      TESTNET_PAFSBT_IMPL_CONTRACT_ABI,
      TESTNET_PAFSBT_PROXY_CONTRACT_ADDRESS
    );

    const result = await contract.methods
      .getProfileId(ethers.utils.formatBytes32String(playFabId))
      .call();

    if (Array.isArray(result)) {
      return result[0];
    }

    return "0";
  }

  async getTransactionStatus(txHash: string) {
    const url = `https://api-testnet.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${process.env.BSCAN_API_KEY}`;

    let response: any;
    try {
      const { data } = await axios.get(url);

      response = data;
    } catch (error) {
      response = error.response;
    }

    return axiosReturnOrThrow(response);
  }
}
