"use client";

import { useRef, useState } from "react";

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

export default function CarImageUploader({
  images,
  onChange,
  maxImages = 20,
}: CarImageUploaderProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);

  const handleAddClick = () => {
    setSourceSheetOpen(true);
  };

  const handlePickFromGallery = () => {
    setSourceSheetOpen(false);
    galleryInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    setSourceSheetOpen(false);
    cameraInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) return;

    setUploading(true);

    const newImages: UploadedImage[] = [];
    const filesToProcess = Array.from(files).slice(0, remaining);

    for (const file of filesToProcess) {
      const url = URL.createObjectURL(file);
      newImages.push({ url, file, isNew: true });
    }

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
    if (currentIndex >= updated.length && updated.length > 0) {
      setCurrentIndex(updated.length - 1);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const width = el.clientWidth;
    const index = Math.round(el.scrollLeft / width);
    setCurrentIndex(index);
  };

  const canAdd = images.length < maxImages;

  return (
    <div>
      {/* Hidden file inputs: gallery (no capture) + camera (capture) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Carousel */}
      {images.length > 0 ? (
        <div className="relative -mx-4">
          {/* Scrollable images */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          >
            {images.map((img, index) => (
              <div
                key={img.url}
                className="snap-center flex-shrink-0 w-full relative"
              >
                <div className="aspect-square bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-3 right-3 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center text-sm backdrop-blur-sm"
                >
                  ×
                </button>
                {/* Cover badge */}
                {index === 0 && (
                  <span className="absolute bottom-3 left-3 bg-main-500 text-white text-xs px-2 py-0.5 rounded font-medium">
                    Cover
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Indicator */}
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="aspect-video bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400">
          <svg
            className="w-10 h-10 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm">No photos yet</p>
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={handleAddClick}
        disabled={!canAdd || uploading}
        className="mt-3 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:border-main-400 hover:text-main-500 disabled:opacity-40 transition-colors bg-white"
      >
        {uploading ? (
          <div className="w-5 h-5 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-sm font-medium">
              Add Photos ({images.length}/{maxImages})
            </span>
          </>
        )}
      </button>

      {/* Source selection bottom sheet */}
      {sourceSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setSourceSheetOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-2xl pb-[env(safe-area-inset-bottom)] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="px-4 pb-2 text-center text-sm font-medium text-gray-500">
              Add Photos
            </div>
            <button
              type="button"
              onClick={handleTakePhoto}
              className="w-full flex items-center gap-3 px-5 py-4 border-t border-gray-100 text-left active:bg-gray-50"
            >
              <svg
                className="w-6 h-6 text-main-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-base text-gray-900">Take Photo</span>
            </button>
            <button
              type="button"
              onClick={handlePickFromGallery}
              className="w-full flex items-center gap-3 px-5 py-4 border-t border-gray-100 text-left active:bg-gray-50"
            >
              <svg
                className="w-6 h-6 text-main-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-base text-gray-900">Choose from Gallery</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceSheetOpen(false)}
              className="w-full px-5 py-4 mt-2 border-t border-gray-100 text-base text-gray-500 active:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
