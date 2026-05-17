"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface ImageViewerProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  alt?: string;
}

export default function ImageViewer({
  images,
  initialIndex,
  onClose,
  alt = "Photo",
}: ImageViewerProps) {
  const total = images.length;
  const safeInitial =
    initialIndex >= 0 && initialIndex < total ? initialIndex : 0;
  const [currentIndex, setCurrentIndex] = useState(safeInitial);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const programmaticScrollRef = useRef(false);

  const scrollToIndex = useCallback(
    (idx: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollerRef.current;
      if (!el) return;
      programmaticScrollRef.current = true;
      el.scrollTo({ left: el.clientWidth * idx, behavior });
      setCurrentIndex(idx);
      // Release the lock after the scroll animation likely settles
      window.setTimeout(() => {
        programmaticScrollRef.current = false;
      }, behavior === "smooth" ? 400 : 0);
    },
    [],
  );

  // Initial position — run synchronously before paint so we never flash image 0
  useLayoutEffect(() => {
    scrollToIndex(safeInitial, "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = useCallback(() => {
    if (programmaticScrollRef.current) return;
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setCurrentIndex((prev) => (prev === idx ? prev : idx));
  }, []);

  // Lock body scroll + keyboard navigation
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        setCurrentIndex((i) => {
          const next = Math.max(0, i - 1);
          scrollToIndex(next);
          return next;
        });
      }
      if (e.key === "ArrowRight") {
        setCurrentIndex((i) => {
          const next = Math.min(total - 1, i + 1);
          scrollToIndex(next);
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, scrollToIndex, total]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 select-none pb-safe"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onClick={onClose}
        className="h-full w-full overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
      >
        {images.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="relative flex-shrink-0 w-full h-full snap-center snap-always flex items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${alt} ${idx + 1}`}
              className="max-w-full max-h-full object-contain"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ))}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
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
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scrollToIndex(currentIndex - 1);
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
      {currentIndex < total - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scrollToIndex(currentIndex + 1);
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
      {total > 1 && (
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/15 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full pointer-events-none">
          {currentIndex + 1} / {total}
        </span>
      )}
    </div>
  );
}
