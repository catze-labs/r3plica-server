import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RoutesModule } from "./routes/routes.module";
import { ServicesModule } from "./services/services.module";

@Module({
  imports: [RoutesModule, ServicesModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
