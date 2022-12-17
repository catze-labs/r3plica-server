import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import path from "path";
import { AppModule } from "./app.module";
import { PrismaService } from "./prisma.service";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(path.join(__dirname, "..", "images"), {
    prefix: `/images/`,
  });

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

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
