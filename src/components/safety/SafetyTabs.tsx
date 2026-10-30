"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// Safety Monitoring is one sidebar entry with several screens; this is the way between them.
const TABS = [
  { href: "/safety", label: "Reports" },
  { href: "/safety/upload", label: "New analysis" },
  { href: "/safety/analytics", label: "Analytics" },
  { href: "/safety/compare", label: "Compare" },
  { href: "/safety/google-drive", label: "Google Drive" },
];

export default function SafetyTabs() {
  const pathname = usePathname();
  // A report page belongs to the Reports tab.
  const isActive = (href: string) =>
    href === "/safety" ? pathname === "/safety" || pathname.startsWith("/safety/report/") : pathname.startsWith(href);

  return (
    <nav aria-label="Safety Monitoring sections" className="flex flex-wrap gap-2 mb-5">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={isActive(tab.href) ? "page" : undefined}
          className={clsx(
            "px-4 py-2 rounded-full text-sm font-medium border transition-colors",
            isActive(tab.href)
              ? "bg-[#1F2937] text-white border-[#1F2937]"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
