"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ImageViewer from "./ImageViewer";

interface UploadedImage {
  id?: string;
  url: string;
  file?: File;
  isNew?: boolean;
}

interface CarImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

const TILE_SIZE = 96;

export default function CarImageUploader({
  images,
  onChange,
  maxImages = 20,
}: CarImageUploaderProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) return;

    setUploading(true);

    const newImages: UploadedImage[] = Array.from(files)
      .slice(0, remaining)
      .map((file) => ({
        url: URL.createObjectURL(file),
        file,
        isNew: true,
      }));

    onChange([...images, ...newImages]);
    setUploading(false);

    if (e.target) {
      e.target.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const updated = [...images];
    const removed = updated.splice(index, 1)[0];
    if (removed.isNew && removed.url.startsWith("blob:")) {
      URL.revokeObjectURL(removed.url);
    }
    onChange(updated);
  };

  const canAdd = images.length < maxImages;
  // Clamp to a safe index in case images shrink while the viewer is open
  const safeViewerIndex =
    viewerIndex !== null && viewerIndex >= 0 && viewerIndex < images.length
      ? viewerIndex
      : null;

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex">
        {/* Fixed left: Add button */}
        <button
          type="button"
          onClick={handleAddClick}
          disabled={!canAdd || uploading}
          style={{ width: TILE_SIZE, height: TILE_SIZE }}
          className="flex-shrink-0 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center gap-1 text-gray-400 hover:bg-gray-100 hover:text-main-500 disabled:opacity-40 transition-colors"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 5v14M5 12h14"
                />
              </svg>
              <span className="text-[11px] font-medium">{t("Add photo")}</span>
            </>
          )}
        </button>

        {/* Horizontal scrolling thumbnails */}
        {images.length > 0 && (
          <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pl-2">
              {images.map((img, index) => (
                <div
                  key={img.url}
                  style={{ width: TILE_SIZE, height: TILE_SIZE }}
                  className="relative flex-shrink-0 rounded-2xl overflow-hidden bg-gray-100"
                >
                  <button
                    type="button"
                    onClick={() => setViewerIndex(index)}
                    aria-label={t("View photo {{number}}", { number: index + 1 })}
                    className="absolute inset-0 w-full h-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={t("Photo {{number}}", { number: index + 1 })}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  {index === 0 && (
                    <span className="pointer-events-none absolute bottom-1.5 left-1.5 bg-main-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {t("Cover")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    aria-label={t("Remove photo")}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-white shadow-md rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen image viewer */}
      {safeViewerIndex !== null && (
        <ImageViewer
          images={images.map((img) => img.url)}
          initialIndex={safeViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}
