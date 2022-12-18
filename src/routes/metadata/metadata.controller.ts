import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "src/prisma.service";

@Controller("metadata")
@ApiTags("Metadata")
export class MetadataController {
  constructor(private prismaService: PrismaService) {}

  @Get("/items/:tokenId")
  async getItemTokenMetadata(@Param("tokenId") tokenId: string) {
    const tokenIdNumber = Number(tokenId);
    if (tokenIdNumber < 3) {
      return {
        name: "Lava Axe",
        description: "Lava Axe - item of r3plica",
        image: "https://r3plica-web.vercel.app/assets/31.png",
      };
    } else if (tokenIdNumber > 2 && tokenIdNumber < 11) {
      return {
        name: "Plate Helmet",
        description: "Plate Helmet - item of r3plica",
        image: "https://r3plica-web.vercel.app/assets/18.png",
      };
    } else if (tokenIdNumber > 10 && tokenIdNumber < 13) {
      return {
        name: "Cloth Shoulders",
        description: "Cloth Shoulders - item of r3plica",
        image: "https://r3plica-web.vercel.app/assets/27.png",
      };
    } else {
      return {
        name: "Wind Staff",
        description: "Cloth Shoulders - item of r3plica",
        image: "https://r3plica-web.vercel.app/assets/34.png",
      };
    }
  }

  @Get("/entitlements/:tokenId")
  async getEntitlementTokenMetadata(@Param("tokenId") tokenId: string) {
    const tokenIdNumber = Number(tokenId);
    switch (tokenIdNumber) {
      case 1: {
        return {
          name: "The Butcher",
          description: "You hunted 5 wild boars - entitlement of r3plica",
          image: "https://r3plica-web.vercel.app/assets/medal.gif",
        };
      }
      case 2: {
        return {
          name: "Decent Hunter",
          description: "You achieved 10 level - entitlement of r3plica",
          image: "https://r3plica-web.vercel.app/assets/medal.gif",
        };
      }
      case 3: {
        return {
          name: "Brutal Slaughter",
          description:
            "You killed 10 boars and one bear - entitlement of r3plica",
          image: "https://r3plica-web.vercel.app/assets/medal.gif",
        };
      }
      case 4: {
        return {
          name: "The Greatest Hunter",
          description: "You killed boss bear - entitlement of r3plica",
          image: "https://r3plica-web.vercel.app/assets/medal.gif",
        };
      }
    }
  }

  @Get("/profiles/:tokenId")
  async getProfileTokenMetadata(@Param("tokenId") tokenId: string) {
    return {
      name: "Genesis PAFSBT",
      description: "Profile by Assetized Future SBT - by r3plica",
      image: "https://r3plica-web.vercel.app/fsbt.png",
    };
  }
}
