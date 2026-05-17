"use client";

import { useEffect, useRef, useState } from "react";

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
  const viewerOpen = safeViewerIndex !== null;

  // Lock body scroll + keyboard navigation while viewer is open
  useEffect(() => {
    if (!viewerOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerIndex(null);
      if (e.key === "ArrowLeft")
        setViewerIndex((i) => (i === null || i <= 0 ? i : i - 1));
      if (e.key === "ArrowRight")
        setViewerIndex((i) =>
          i === null || i >= images.length - 1 ? i : i + 1,
        );
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [viewerOpen, images.length]);

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
              <span className="text-[11px] font-medium">사진 추가</span>
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
                    aria-label={`View photo ${index + 1}`}
                    className="absolute inset-0 w-full h-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  {index === 0 && (
                    <span className="pointer-events-none absolute bottom-1.5 left-1.5 bg-main-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    aria-label="Remove photo"
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
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center select-none"
          onClick={() => setViewerIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[safeViewerIndex].url}
            alt={`Photo ${safeViewerIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Close */}
          <button
            type="button"
            onClick={() => setViewerIndex(null)}
            aria-label="Close viewer"
            className="absolute top-4 right-4 w-10 h-10 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Prev */}
          {safeViewerIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewerIndex(safeViewerIndex - 1);
              }}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Next */}
          {safeViewerIndex < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewerIndex(safeViewerIndex + 1);
              }}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* Counter */}
          {images.length > 1 && (
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/15 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
              {safeViewerIndex + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
