"use client";

import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function PageHeader({ title, showBack = true, rightAction }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-safe">
      <div className="flex items-center h-12 px-4 ">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="mr-2 -ml-1 p-1 text-gray-700"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="flex-1 text-lg font-semibold text-gray-900 truncate">
          {title}
        </h1>
        {rightAction && <div className="ml-2">{rightAction}</div>}
      </div>
    </header>
  );
}
