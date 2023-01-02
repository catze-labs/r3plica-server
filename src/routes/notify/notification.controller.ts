import { Body, Controller, Post } from "@nestjs/common";
import { NotificationService } from "src/services/notification/notification.service";
import { PostSlackNotificationDto } from "./dto/post-slack-notification.dto";

@Controller("notification")
export class NotificationController {
  constructor(private readonly notifyService: NotificationService) {}

  // @Post()
  // async sendSlackNotify(@Body() message: PostSlackNotificationDto) {
  //   await this.notifyService.sendSlackNotify(message);
  // }
}
