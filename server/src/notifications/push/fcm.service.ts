import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { App, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

export interface FcmMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface FcmSendResult {
  token: string;
  success: boolean;
  /** FCM이 토큰 무효(UNREGISTERED 등)를 알려줄 때 true → 호출측에서 비활성화 */
  invalidToken: boolean;
}

/**
 * firebase-admin 래퍼.
 * 서비스 계정 자격증명은 환경변수로 주입한다:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * 자격증명이 없으면 발송을 건너뛴다(개발 환경에서 크래시 방지).
 */
@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app: App | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get<string>("FIREBASE_PROJECT_ID");
    const clientEmail = this.config.get<string>("FIREBASE_CLIENT_EMAIL");
    // .env에 \n 이스케이프로 저장된 private key를 실제 개행으로 복원
    const privateKey = this.config
      .get<string>("FIREBASE_PRIVATE_KEY")
      ?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        "FIREBASE_* 환경변수 미설정 → 푸시 발송을 건너뜁니다(인앱 알림은 정상 기록).",
      );
      return;
    }

    this.app = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
    this.logger.log("FCM 초기화 완료");
  }

  get isEnabled(): boolean {
    return this.app !== null;
  }

  /** 단일 토큰 발송. 자격증명 미설정 시 no-op으로 success=false 반환. */
  async send(message: FcmMessage): Promise<FcmSendResult> {
    if (!this.app) {
      return { token: message.token, success: false, invalidToken: false };
    }

    try {
      await getMessaging(this.app).send({
        token: message.token,
        notification: { title: message.title, body: message.body },
        data: message.data,
        apns: {
          payload: { aps: { sound: "default", badge: 1 } },
        },
        android: {
          priority: "high",
          notification: { sound: "default" },
        },
      });
      return { token: message.token, success: true, invalidToken: false };
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      const invalidToken =
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token" ||
        code === "messaging/invalid-argument";
      if (!invalidToken) {
        this.logger.error(`FCM 발송 실패 (${code})`, err as Error);
      }
      return { token: message.token, success: false, invalidToken };
    }
  }
}
