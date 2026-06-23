import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const GOOGLE_TRANSLATE_URL =
  "https://translation.googleapis.com/language/translate/v2";

export interface TranslateResult {
  translatedText: string;
  detectedSourceLanguage: string; // ISO 코드 (예: ru / en / ko)
}

@Injectable()
export class TranslationService {
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>("GOOGLE_TRANSLATE_API_KEY", "");
  }

  /**
   * Google Cloud Translation(v2)으로 text를 target 언어(ISO 코드)로 번역한다.
   * 원문 언어는 자동 감지되어 detectedSourceLanguage로 반환된다.
   */
  async translate(text: string, target: string): Promise<TranslateResult> {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        "GOOGLE_TRANSLATE_API_KEY is not configured",
      );
    }

    const res = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, target, format: "text" }),
    });

    if (!res.ok) {
      throw new InternalServerErrorException("Translation request failed");
    }

    const json = (await res.json()) as {
      data?: {
        translations?: Array<{
          translatedText: string;
          detectedSourceLanguage?: string;
        }>;
      };
    };

    const t = json.data?.translations?.[0];
    if (!t) {
      throw new InternalServerErrorException("Translation response was empty");
    }

    return {
      translatedText: t.translatedText,
      detectedSourceLanguage: t.detectedSourceLanguage ?? "",
    };
  }
}
