import { BadRequestException } from "@nestjs/common";
import type { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";

/** 이미지 업로드 상한. 클라이언트에서 압축해 올리므로 정상 요청은 1MB 를 넘지 않는다. */
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * multer 는 memoryStorage 라 업로드 파일이 통째로 Node 힙에 올라간다.
 * 상한이 없으면 큰 파일 몇 개로 인스턴스가 죽을 수 있어 스트리밍 단계에서 끊는다.
 * (서비스 레이어 검증은 파일을 다 받은 뒤라 너무 늦다.)
 */
export const imageUploadOptions: MulterOptions = {
  limits: {
    fileSize: MAX_IMAGE_UPLOAD_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype?.startsWith("image/")) {
      callback(new BadRequestException("Only image files are allowed"), false);
      return;
    }
    callback(null, true);
  },
};
