import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const PUBLIC_PATH = "/storage/v1/object/public";

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    // 기본값을 두면 버킷명이 틀려도 부팅은 되고 업로드 시점에만
    // NoSuchBucket 이 나므로, 미설정이면 부팅 자체를 실패시킨다.
    const bucket = config.get<string>("SUPABASE_S3_BUCKET");
    if (!bucket) {
      throw new Error("SUPABASE_S3_BUCKET is not configured");
    }
    this.bucket = bucket;
    const rawPublicUrl = config.get<string>("SUPABASE_PUBLIC_URL", "");
    this.publicBaseUrl = StorageService.buildPublicBase(rawPublicUrl);

    this.s3 = new S3Client({
      region: "auto",
      endpoint: config.get<string>("SUPABASE_S3_ENDPOINT", ""),
      credentials: {
        accessKeyId: config.get<string>("SUPABASE_ACCESS_KEY", ""),
        secretAccessKey: config.get<string>("SUPABASE_SECRET_KEY", ""),
      },
      forcePathStyle: true,
    });
  }

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const ext = file.originalname.split(".").pop() || "jpg";
    const key = `${folder}/${randomUUID()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `${this.publicBaseUrl}/${this.bucket}/${key}`;
  }

  async delete(url: string): Promise<void> {
    const normalized = this.normalizeUrl(url);
    const prefix = `${this.publicBaseUrl}/${this.bucket}/`;
    if (!normalized.startsWith(prefix)) return;

    const key = normalized.slice(prefix.length);
    await this.s3
      .send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      )
      .catch(() => {});
  }

  // Legacy URLs were saved when SUPABASE_PUBLIC_URL was just the project root
  // (without /storage/v1/object/public). Inject the missing segment so the
  // returned URL actually resolves on Supabase.
  normalizeUrl(url: string): string {
    if (!url) return url;
    if (url.includes(PUBLIC_PATH + "/")) return url;
    try {
      const parsed = new URL(url);
      if (!parsed.pathname || parsed.pathname === "/") return url;
      return `${parsed.origin}${PUBLIC_PATH}${parsed.pathname}`;
    } catch {
      return url;
    }
  }

  private static buildPublicBase(rawPublicUrl: string): string {
    const trimmed = rawPublicUrl.replace(/\/+$/, "");
    if (!trimmed) return "";
    if (trimmed.includes(PUBLIC_PATH)) return trimmed;
    return `${trimmed}${PUBLIC_PATH}`;
  }
}
