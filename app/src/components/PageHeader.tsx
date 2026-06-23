"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
  rightAction?: React.ReactNode;
}

export default function PageHeader({ title, showBack = true, backHref, rightAction }: PageHeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-safe">
      <div className="flex items-center h-12 px-4 ">
        {showBack && (
          <button
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            className="mr-2 -ml-1 p-1 text-gray-700"
            aria-label={t("Go back")}
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
