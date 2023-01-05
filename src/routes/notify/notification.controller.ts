import { Controller } from "@nestjs/common";
import { NotificationService } from "src/services/notification/notification.service";

@Controller("notification")
export class NotificationController {
  constructor(private readonly notifyService: NotificationService) {}

  // @Post()
  // async sendSlackNotify(@Body() message: PostSlackNotificationDto) {
  //   await this.notifyService.sendSlackNotify(message);
  // }
}
