import Link from "next/link";
import NotificationBell from "./NotificationBell";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 pt-safe">
      <div className="px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Ajucar
        </Link>
        <NotificationBell />
      </div>
    </header>
  );
}
