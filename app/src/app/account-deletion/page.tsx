import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account & Data Deletion — Ajucar",
  description:
    "How to delete your Ajucar account and associated personal data.",
};

// Google Play 데이터 삭제 요건용 공개 안내 페이지 (인증 불필요, 영어 고정).
export default function AccountDeletionPage() {
  return (
    <div className="bg-white">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-safe">
        <div className="flex items-center h-12 px-4">
          <h1 className="text-lg font-semibold text-gray-900">
            Account &amp; Data Deletion
          </h1>
        </div>
      </header>

      <article className="px-5 pt-6 pb-10 text-[13px] leading-relaxed text-gray-600 space-y-6">
        <section>
          <p>
            This page explains how to delete your account and personal data
            from <strong>Ajucar</strong>, the used-car export platform operated
            by Dubai Trading Co., Ltd. (&quot;Ajucar&quot;, &quot;we&quot;).
          </p>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-gray-900 mb-2">
            Option 1 — Delete in the app
          </h2>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Sign in to the Ajucar app.</li>
            <li>
              Go to <strong>My Page</strong>.
            </li>
            <li>
              Tap <strong>Delete Account</strong> at the bottom of the screen
              and confirm.
            </li>
            <li>
              Your account and associated personal data are permanently deleted
              immediately (see retention exceptions below).
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-gray-900 mb-2">
            Option 2 — Request deletion by email
          </h2>
          <p>
            If you cannot access the app, email us from the address registered
            to your account and we will delete it within 30 days:
          </p>
          <div className="mt-3 rounded-xl bg-gray-50 p-4 text-[12px] leading-relaxed text-gray-600">
            <p className="font-semibold text-gray-800">
              Dubai Trading Co., Ltd.
            </p>
            <p>Email: ajucar0510@naver.com</p>
            <p>Subject: &quot;Account deletion request&quot;</p>
          </div>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-gray-900 mb-2">
            Data that is deleted
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Account and profile (email, name, phone, country, company)</li>
            <li>Seller business details, if any</li>
            <li>Your vehicle listings and uploaded photos</li>
            <li>Chat messages and conversations</li>
            <li>Wishlist, saved phrases, and keyword alerts</li>
            <li>Device tokens and in-app notifications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-gray-900 mb-2">
            Data that may be retained
          </h2>
          <p>
            After deletion we remove your personal data within 30 days, except
            where a longer period is required by law:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>
              Access logs and IP addresses: up to 3 months (Korean
              Communications Privacy Act).
            </li>
            <li>
              Records we are legally required to keep: for the period mandated
              by applicable law.
            </li>
          </ul>
          <p className="mt-2">
            For full details, see our{" "}
            <a href="/privacy" className="text-main-600 underline">
              Privacy Policy
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
