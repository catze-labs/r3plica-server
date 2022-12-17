import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { RoutesModule } from './routes/routes.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [RoutesModule, ServicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
