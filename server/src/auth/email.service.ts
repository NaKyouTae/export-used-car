import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isIP } from "node:net";
import { resolve4 } from "node:dns/promises";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporterPromise: Promise<nodemailer.Transporter> | null = null;
  private readonly host?: string;

  constructor(private readonly config: ConfigService) {
    this.host = this.config.get<string>("SMTP_HOST");
  }

  /**
   * nodemailer 8은 호스트를 IPv4/IPv6 둘 다 resolve한 뒤 랜덤으로 하나를 골라 접속한다.
   * 실행 환경에 IPv6 외부 라우팅이 없으면 IPv6가 선택될 때마다 ENETUNREACH가 발생하므로,
   * 우리가 직접 IPv4로 resolve해 IP 리터럴을 host로 넘겨 nodemailer의 내부 DNS를 건너뛴다.
   * TLS(STARTTLS) SNI 검증을 위해 원래 호스트명은 servername으로 유지한다.
   */
  private async createTransporter(
    host: string,
  ): Promise<nodemailer.Transporter> {
    let connectHost = host;
    if (!isIP(host)) {
      const [ipv4] = await resolve4(host);
      if (ipv4) {
        connectHost = ipv4;
      }
    }

    // 포트가 TLS 방식을 결정한다: 465=암시적 TLS(secure), 587/25=STARTTLS(평문 시작).
    // SMTP_SECURE를 별도로 두면 포트와 어긋나 "wrong version number"가 나기 쉬우므로
    // 포트에서 secure를 유도한다. (잘못된 SMTP_SECURE 값이 있어도 자동 교정)
    const port = Number(this.config.get<string>("SMTP_PORT", "587"));
    const secure = port === 465;

    this.logger.log(
      `SMTP transport: ${host} (${connectHost}):${port} secure=${secure}`,
    );

    return nodemailer.createTransport({
      host: connectHost,
      port,
      secure,
      auth: {
        user: this.config.get<string>("SMTP_USER"),
        pass: this.config.get<string>("SMTP_PASS"),
      },
      tls: { servername: host },
    });
  }

  private getTransporter(host: string): Promise<nodemailer.Transporter> {
    if (!this.transporterPromise) {
      this.transporterPromise = this.createTransporter(host);
    }
    return this.transporterPromise;
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    if (!this.host) {
      this.logger.log(`[DEV] Verification code for ${email}: ${code}`);
      return;
    }

    const transporter = await this.getTransporter(this.host);

    const fromAddress =
      this.config.get<string>("EMAIL_FROM") || "ajucar0510@naver.com";

    await transporter.sendMail({
      from: `"Ajucar" <${fromAddress}>`,
      to: email,
      subject: `[Ajucar] Your verification code: ${code}`,
      text: this.buildVerificationText(code),
      html: this.buildVerificationHtml(code),
    });
  }

  private buildVerificationText(code: string): string {
    return [
      "Ajucar — Email Verification",
      "",
      "Use the verification code below to continue.",
      "",
      `Verification code: ${code}`,
      "This code will expire in 5 minutes.",
      "",
      "If you did not request this code, you can safely ignore this email.",
      "For your security, never share this code with anyone.",
      "",
      "— Ajucar",
      "Premium Korean used cars for international buyers",
    ].join("\n");
  }

  private buildVerificationHtml(code: string): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ajucar — Email Verification</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Your Ajucar verification code is ${code}. It expires in 5 minutes.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(15,23,42,0.06);overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:28px 32px;color:#ffffff;">
                <div style="font-size:20px;font-weight:700;letter-spacing:-0.01em;">Ajucar</div>
                <div style="margin-top:4px;font-size:13px;color:#dbeafe;">Premium Korean used cars for international buyers</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0f172a;">Verify your email</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
                  Enter the verification code below to continue signing in to Ajucar.
                  This code will expire in <strong style="color:#0f172a;">5 minutes</strong>.
                </p>
                <div style="margin:0 0 24px;padding:20px;background-color:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;text-align:center;">
                  <div style="font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Verification code</div>
                  <div style="margin-top:8px;font-size:32px;font-weight:700;letter-spacing:0.2em;color:#1e3a8a;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;">${code}</div>
                </div>
                <div style="padding:16px;background-color:#fff7ed;border:1px solid #fed7aa;border-radius:10px;font-size:13px;line-height:1.6;color:#9a3412;">
                  <strong style="color:#7c2d12;">Security tip.</strong>
                  Ajucar will never ask for this code by phone or chat. Do not share it with anyone.
                </div>
                <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
                  If you did not request this code, you can safely ignore this email — no changes will be made to your account.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">
                © ${new Date().getFullYear()} Ajucar. All rights reserved.<br />
                This is an automated message — please do not reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }
}
