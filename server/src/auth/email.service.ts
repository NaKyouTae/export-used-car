import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>("SMTP_HOST");
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>("SMTP_PORT", 587),
        secure: this.config.get<boolean>("SMTP_SECURE", false),
        auth: {
          user: this.config.get<string>("SMTP_USER"),
          pass: this.config.get<string>("SMTP_PASS"),
        },
      });
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[DEV] Verification code for ${email}: ${code}`);
      return;
    }

    await this.transporter.sendMail({
      from:
        this.config.get<string>("SMTP_FROM") || "noreply@export-used-car.com",
      to: email,
      subject: "Your verification code",
      text: `Your verification code is: ${code}\n\nThis code expires in 5 minutes.`,
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 5 minutes.</p>`,
    });
  }
}
