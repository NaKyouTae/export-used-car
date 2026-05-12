import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="px-4 h-14 flex items-center">
        <Link href="/" className="text-xl font-bold text-gray-900">
          AutoExport
        </Link>
      </div>
    </header>
  );
}
