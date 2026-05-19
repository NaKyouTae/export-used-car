"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function MyPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isSeller = isAuthenticated && user?.role === "SELLER";

  return (
    <div className="flex-1 bg-white flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center h-12 px-4">
          <h1 className="text-lg font-semibold text-gray-900">My Page</h1>
        </div>
      </header>

      {/* User Info */}
      <div className="px-4 pt-4">
        {isAuthenticated ? (
          <Link href="/mypage/profile" className="bg-white rounded-xl py-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-main-50 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-main-600">
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-900 truncate">
                {user?.companyName || user?.name || user?.email}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isSeller ? "Seller" : "User"}
                {user?.email && ` · ${user.email}`}
              </p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <Link href="/login" className="bg-white rounded-xl py-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" strokeWidth="2" />
                <path d="M20 21a8 8 0 1 0-16 0" strokeWidth="2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-900">Login</p>
              <p className="text-xs text-gray-400 mt-0.5">Log in to access all features</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Seller-only section */}
        {isSeller && (
          <MenuSection title="My Deals">
            <MenuItem href="/seller/cars" icon={<CarIcon />} label="My Cars" />
          </MenuSection>
        )}

        {/* Common section */}
        <MenuSection title="History">
          <MenuItem href="/wishlist" icon={<HeartIcon />} label="Wishlist" />
          <MenuItem href="/recent" icon={<ClockIcon />} label="Recently Viewed" />
        </MenuSection>

        {isAuthenticated && (
          <MenuSection title="Chat">
            <MenuItem
              href="/mypage/quick-phrases"
              icon={<ChatBubbleIcon />}
              label="Quick Phrases"
            />
          </MenuSection>
        )}

        <MenuSection title="Legal">
          <MenuItem
            href="/terms"
            icon={<DocumentIcon />}
            label="Terms of Service"
          />
          <MenuItem
            href="/privacy"
            icon={<ShieldIcon />}
            label="Privacy Policy"
          />
        </MenuSection>
      </div>

      {/* Logout / Delete Account */}
      {isAuthenticated && (
        <div className="flex items-center justify-center gap-0 px-4 pt-6">
          <button
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className="py-3 px-4 text-sm text-gray-400"
          >
            Logout
          </button>
          <span className="text-gray-200">|</span>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                // TODO: call delete account API
              }
            }}
            className="py-3 px-4 text-sm text-gray-400"
          >
            Delete Account
          </button>
        </div>
      )}

      {/* Business Info */}
      <div className="mt-auto -mb-[88px] bg-gray-100 px-4 pt-6 pb-28">
        <div className="text-[11px] leading-relaxed text-gray-400 space-y-1">
          <p className="text-xs font-semibold text-gray-500">Dubai Trading Co., Ltd.</p>
          <p>CEO: Hae-gi Choi</p>
          <p>Business Registration No.: 897-88-01852</p>
          <p>Corporate Registration No.: 230111-0326346</p>
          <p>Established: February 21, 2020</p>
          <p>
            Address: #1127, Bldg. 1, 16 Jinjangyutong-ro, Buk-gu,
            <br />
            Ulsan, Republic of Korea (Jinjang-dong, Jinjang D-Plex)
          </p>
          <p>Business Type: Wholesale &amp; Retail, Transportation &amp; Warehousing</p>
          <p>Items: Used Car Export Sales, Trading, Packaging &amp; Filling</p>
        </div>
      </div>
    </div>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function MenuItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 h-8 active:bg-gray-50">
      <span className="text-gray-500">{icon}</span>
      <span className="flex-1 text-sm font-medium text-gray-900">{label}</span>
      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function CarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14M5 17a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1h1.4a1 1 0 0 0 .8-.4l2-2.67A1 1 0 0 1 9 4.5h6a1 1 0 0 1 .8.43l2 2.67a1 1 0 0 0 .8.4H20a1 1 0 0 1 1 1v6a2 2 0 0 1-2 2" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
    </svg>
  );
}
