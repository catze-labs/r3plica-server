import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { user } from "@prisma/client";
import Web3 from "web3";
import {
  TESTNET_IAFSBT_IMPLEMENT_CONTRACT_ABI,
  TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
  TESTNET_QAFSBT_IMPLEMENT_CONTRACT_ABI,
  TESTNET_QAFSBT_PROXY_CONTRACT_ADDRESS,
} from "./constants";
import { PrismaService } from "./prisma.service";
import { PlayFabService } from "./services/playfab/playfab.service";
import {
  ItemTransferRequest,
  EntitlementTransferRequest,
  UserEntitlementWrapper,
  UserItemWrapper,
} from "./types";

@Injectable()
export class Web3Service {
  private readonly logger = new Logger(Web3Service.name);
  private provider = new Web3.providers.HttpProvider(
    process.env.BSC_TEST_PROVIDER
  );
  private web3 = new Web3(this.provider);

  private itemTransferRequestQ: ItemTransferRequest[] = [];
  private entitlementTransferRequestQ: EntitlementTransferRequest[] = [];

  constructor(
    private prismaService: PrismaService,
    private playFabService: PlayFabService
  ) {}

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

  async enQueueItemFsbtTransfer(playFabId: string, itemIds: number[]) {
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
        message: "User wallet not registered",
        playFabId,
      });
    }

    // Get Item List and Check all items are transferable
    const itemList = await this.playFabService.getUserItems(user.playFabId);
    for (let item of itemList) {
      const isTransferable =
        itemIds.find((v) => v === item.itemID) && item.isTransferred === false;

      if (!isTransferable) {
        throw new BadRequestException({
          itemId: item.itemID,
        });
      }
    }

    for (let item of itemList) {
      this.itemTransferRequestQ.push({
        playFabId,
        walletAddress,
        itemId: item.itemID,
        itemName: item.itemName,
        itemRarity: item.rarity,
      });
    }
  }

  async enQueueEntitlementFsbtTransfer(
    playFabId: string,
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
        message: "User wallet not registered",
        playFabId,
      });
    }

    // Get entitlements list and Check all entitlements are transferable
    const entitlementsList = await this.playFabService.getUserEntitlements(
      user.playFabId
    );
    for (let entitlement of entitlementsList) {
      const isTransferable =
        entitlementIds.find((v) => v === entitlement.questID) &&
        entitlement.isTransferred === false;

      if (!isTransferable) {
        throw new BadRequestException({
          entitlementId: entitlement.questID,
        });
      }
    }

    for (let entitlement of entitlementsList) {
      this.entitlementTransferRequestQ.push({
        playFabId,
        walletAddress,
        entitlementId: entitlement.questID,
        entitlementTitle: entitlement.questTitle,
        entitlementDescription: entitlement.description,
      });
    }
  }

  async callIAFSBTContract() {
    const itemTransferRequests: ItemTransferRequest[] = [];
    const itemTransferRequestCounts = this.itemTransferRequestQ.length;
    for (let i = 1; i <= itemTransferRequestCounts; i++) {
      itemTransferRequests.push(this.itemTransferRequestQ.shift());
    }

    const from = this.web3.eth.accounts.privateKeyToAccount(
      process.env.PRIVATE_KEY
    ).address;

    // Call contract
    const contract = new this.web3.eth.Contract(
      TESTNET_IAFSBT_IMPLEMENT_CONTRACT_ABI,
      TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS
    );

    for (let request of itemTransferRequests) {
      let transferItemTokenId = 1;
      let lastTransferredItemToken =
        await this.prismaService.lastTransferredItemToken.findFirst({
          where: {
            itemId: request.itemId,
          },
          orderBy: {
            created: "desc",
          },
        });

      if (!lastTransferredItemToken) {
        transferItemTokenId = lastTransferredItemToken.tokenId + 1;
      }

      // Encode the function call
      const encoded = contract.methods
        .limitedTransfer(from, request.walletAddress, transferItemTokenId)
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

        const receipt = await this.web3.eth.sendSignedTransaction(
          signedTx.rawTransaction
        );

        console.log(receipt);

        await this.prismaService.lastTransferredItemToken.create({
          data: {
            itemId: request.itemId,
            tokenId: transferItemTokenId,
          },
        });

        await this.prismaService.itemTransfer.create({
          data: {
            txHash: receipt.transactionHash,
            item: {
              itemId: request.itemId,
              name: request.itemName,
              rarity: request.itemRarity,
            },
            playFabId: request.playFabId,
            contractAddress: TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
          },
        });

        const itemToken = await this.prismaService.itemToken.findFirst({
          where: {
            itemId: request.itemId,
          },
        });

        const updateCount = itemToken.count - 1;
        await this.prismaService.itemToken.update({
          where: {
            itemId: request.itemId,
          },
          data: {
            count: updateCount,
          },
        });
      } catch (err) {
        console.log(err);
      }
    }
  }

  async callQAFSBTContract() {
    const entitlementTransferRequests: EntitlementTransferRequest[] = [];
    const entitlementTransferRequestCounts =
      this.entitlementTransferRequestQ.length;
    for (let i = 1; i <= entitlementTransferRequestCounts; i++) {
      entitlementTransferRequests.push(
        this.entitlementTransferRequestQ.shift()
      );
    }

    const from = this.web3.eth.accounts.privateKeyToAccount(
      process.env.PRIVATE_KEY
    ).address;

    // Call contract
    const contract = new this.web3.eth.Contract(
      TESTNET_QAFSBT_IMPLEMENT_CONTRACT_ABI,
      TESTNET_QAFSBT_PROXY_CONTRACT_ADDRESS
    );

    for (let request of entitlementTransferRequests) {
      let transferEntitlementTokenId = 1;
      let lastTransferredEntitlementToken =
        await this.prismaService.lastTransferredEntitlementToken.findFirst({
          where: {
            entitlementId: request.entitlementId,
          },
          orderBy: {
            created: "desc",
          },
        });

      if (!lastTransferredEntitlementToken) {
        transferEntitlementTokenId =
          lastTransferredEntitlementToken.tokenId + 1;
      }

      // Encode the function call
      const encoded = contract.methods
        .limitedTransfer(
          from,
          request.walletAddress,
          transferEntitlementTokenId
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

        const receipt = await this.web3.eth.sendSignedTransaction(
          signedTx.rawTransaction
        );

        console.log(receipt);

        await this.prismaService.lastTransferredEntitlementToken.create({
          data: {
            entitlementId: request.entitlementId,
            tokenId: transferEntitlementTokenId,
          },
        });

        await this.prismaService.entitlementTransfer.create({
          data: {
            txHash: receipt.transactionHash,
            entitlement: {
              entitlementId: request.entitlementId,
              entitlementTitle: request.entitlementTitle,
              entitlementDescription: request.entitlementDescription,
            },
            playFabId: request.playFabId,
            contractAddress: TESTNET_IAFSBT_PROXY_CONTRACT_ADDRESS,
          },
        });

        const itemToken = await this.prismaService.entitlementToken.findFirst({
          where: {
            entitlementId: request.entitlementId,
          },
        });

        const updateCount = itemToken.count - 1;
        await this.prismaService.entitlementToken.update({
          where: {
            entitlementId: request.entitlementId,
          },
          data: {
            count: updateCount,
          },
        });
      } catch (err) {
        console.log(err);
      }
    }
  }

  async initializeTokenCount() {
    await this.prismaService.itemToken.deleteMany();
    await this.prismaService.entitlementToken.deleteMany();
    await this.prismaService.itemToken.createMany({
      data: [
        { itemId: 31, count: 200 },
        { itemId: 34, count: 200 },
        { itemId: 27, count: 800 },
        { itemId: 18, count: 800 },
      ],
    });

    await this.prismaService.entitlementToken.createMany({
      data: [
        { entitlementId: 0, count: 100 },
        { entitlementId: 1, count: 100 },
        { entitlementId: 2, count: 100 },
        { entitlementId: 3, count: 100 },
      ],
    });
  }
}
