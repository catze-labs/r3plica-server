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
    if (tokenIdNumber > 0 && tokenIdNumber < 3) {
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
    } else if (tokenIdNumber > 10 && tokenIdNumber < 19) {
      return {
        name: "Cloth Shoulders",
        description: "Cloth Shoulders - item of r3plica",
        image: "https://r3plica-web.vercel.app/assets/27.png",
      };
    } else if (tokenIdNumber > 18 && tokenIdNumber < 21) {
      return {
        name: "Wind Staff",
        description: "Wind Staff - item of r3plica",
        image: "https://r3plica-web.vercel.app/assets/34.png",
      };
    }
  }

  @Get("/achievements/:tokenId")
  async getAchievementTokenMetadata(@Param("tokenId") tokenId: string) {
    const tokenIdNumber = Number(tokenId);
    switch (tokenIdNumber) {
      case 1: {
        return {
          name: "The Butcher",
          description: "You hunted 5 wild boars - achievement of r3plica",
          image: "https://r3plica-web.vercel.app/assets/medal.gif",
        };
      }
      case 2: {
        return {
          name: "Decent Hunter",
          description: "You achieved 10 level - achievement of r3plica",
          image: "https://r3plica-web.vercel.app/assets/medal.gif",
        };
      }
      case 3: {
        return {
          name: "Brutal Slaughter",
          description:
            "You killed 10 boars and one bear - achievement of r3plica",
          image: "https://r3plica-web.vercel.app/assets/medal.gif",
        };
      }
      case 4: {
        return {
          name: "The Greatest Hunter",
          description: "You killed boss bear - achievement of r3plica",
          image: "https://r3plica-web.vercel.app/assets/medal.gif",
        };
      }
    }
  }

  @Get("/profiles/:tokenId")
  async getProfileTokenMetadata(@Param("tokenId") tokenId: string) {
    return {
      name: "Genesis PAFSBT",
      description: "Profile by Assetized Future SBT - by r3plica-XDC",
      image: "https://r3plica-web.vercel.app/fsbt.png",
    };
  }
}
