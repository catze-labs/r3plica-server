import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { PrismaService } from "./prisma.service";
import { Web3Service } from "./web3.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // initialize token count
  const web3Service = app.get(Web3Service);
  await web3Service.initializeTokenCount();

  app.useGlobalPipes(new ValidationPipe());

  if (process.env.ENVIRONMENT !== "prod") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("r3plica")
      .setDescription("r3plica API")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("/docs", app, document);
  }

  app.enableCors({
    origin: "*",
  });
  await app.listen(process.env.PORT);
}

bootstrap();
