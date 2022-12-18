import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "src/prisma.service";

@Controller("metadata")
@ApiTags("Metadata")
export class MetadataController {
  constructor(private prismaService: PrismaService) {}

  @Get("/items/:tokenId")
  async getItemTokenMetadata(@Param("tokenId") tokenId: string) {
    return await this.prismaService.itemMetadata.findUnique({
      select: {
        itemId: true,
        itemName: true,
        itemRarity: true,
      },
      where: {
        tokenId: Number(tokenId),
      },
    });
  }

  @Get("/entitlements/:tokenId")
  async getEntitlementTokenMetadata(@Param("tokenId") tokenId: string) {
    return await this.prismaService.entitlementMetadata.findUnique({
      select: {
        entitlementId: true,
        entitlementDescription: true,
      },
      where: {
        tokenId: Number(tokenId),
      },
    });
  }

  @Get("/profiles/:tokenId")
  async getProfileTokenMetadata(@Param("tokenId") tokenId: string) {
    const metadata = await this.prismaService.profileMetatdata.findUnique({
      where: {
        tokenId: Number(tokenId),
      },
      include: {
        user: true,
      },
    });

    return {
      playFabId: metadata.playFabId,
      created: metadata.created.valueOf().toString(),
    };
  }
}
