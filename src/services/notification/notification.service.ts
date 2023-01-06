import { Injectable } from "@nestjs/common";
import axios from "axios";
import dayjs from "dayjs";
import { SlackColor, SlackMessage } from "src/types";

@Injectable()
export class NotificationService {
  constructor() {}

  async sendSlackNotify(message: SlackMessage) {
    if (!message) return;

    if (!message.ts) message.ts = dayjs().unix();
    if (!message.footer)
      message.footer = `r3plica BNB-${process.env.ENVIRONMENT}`;
    if (!message.color) message.color = SlackColor.info;

    const data: any = {
      attachments: [message],
    };

    try {
      await axios({
        url: process.env.SLACK_WEBHOOK_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data,
      });
    } catch (err) {
      console.log(err);
    }
  }
}
