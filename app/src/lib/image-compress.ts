/**
 * 업로드 전 이미지 리사이즈/재인코딩.
 *
 * 요즘 폰 사진은 장당 3~6MB 라 원본 그대로 올리면 스토리지 용량과 전송량이
 * 그대로 비용이 된다. 긴 변을 MAX_DIMENSION 으로 줄이고 WebP 로 다시 인코딩하면
 * 모바일(390px 고정 레이아웃) 화질 손해 없이 보통 80~95% 가 줄어든다.
 *
 * 어떤 이유로든 실패하면 원본 File 을 그대로 돌려준다 — 압축은 최적화일 뿐이라
 * 여기서 업로드 자체를 막지 않는다.
 */

const MAX_DIMENSION = 1600;
const QUALITY = 0.8;
const PREFERRED_TYPE = "image/webp";
const FALLBACK_TYPE = "image/jpeg";

type ImageSource = ImageBitmap | HTMLImageElement;

export async function compressImage(file: File): Promise<File> {
  if (typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  // GIF 는 재인코딩하면 애니메이션이 첫 프레임으로 날아간다
  if (file.type === "image/gif") return file;

  let source: ImageSource | null = null;
  try {
    source = await loadImage(file);
    const [sourceWidth, sourceHeight] = getSize(source);
    const [width, height] = fitWithin(sourceWidth, sourceHeight, MAX_DIMENSION);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(source, 0, 0, width, height);

    let blob = await toBlob(canvas, PREFERRED_TYPE, QUALITY);
    // WebP 인코딩을 지원하지 않는 브라우저는 요청을 무시하고 PNG 를 돌려준다.
    // 그대로 쓰면 원본보다 커지므로 JPEG 로 다시 시도한다.
    if (!blob || blob.type !== PREFERRED_TYPE) {
      blob = await toBlob(canvas, FALLBACK_TYPE, QUALITY);
    }
    // 이미 충분히 작거나 압축이 손해면 원본을 쓴다
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], replaceExtension(file.name, blob.type), {
      type: blob.type,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  } finally {
    if (source && "close" in source) source.close();
  }
}

async function loadImage(file: File): Promise<ImageSource> {
  // createImageBitmap 은 EXIF 회전 정보를 반영해준다 (세로로 찍은 사진 대응)
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // 옵션 미지원 브라우저 — 아래 <img> 경로로 폴백
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function getSize(source: ImageSource): [number, number] {
  return source instanceof HTMLImageElement
    ? [source.naturalWidth, source.naturalHeight]
    : [source.width, source.height];
}

/** 비율을 유지하며 긴 변을 max 이하로 맞춘다. 확대는 하지 않는다. */
function fitWithin(width: number, height: number, max: number): [number, number] {
  const longest = Math.max(width, height);
  if (longest <= max) return [width, height];
  const ratio = max / longest;
  return [Math.round(width * ratio), Math.round(height * ratio)];
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function replaceExtension(name: string, mimeType: string): string {
  const ext = mimeType === PREFERRED_TYPE ? "webp" : "jpg";
  const base = name.replace(/\.[^./\\]+$/, "") || "image";
  return `${base}.${ext}`;
}
