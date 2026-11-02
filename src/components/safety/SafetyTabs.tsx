"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { FiBarChart2, FiFileText, FiGitMerge, FiHardDrive, FiUploadCloud } from "react-icons/fi";

// Safety Monitoring is one sidebar entry with several screens; this is the way between them. On a phone the
// strip scrolls sideways (instead of wrapping onto three rows) and keeps the active tab in view.
const TABS = [
  { href: "/safety", label: "Reports", icon: FiFileText },
  { href: "/safety/upload", label: "New analysis", icon: FiUploadCloud },
  { href: "/safety/analytics", label: "Analytics", icon: FiBarChart2 },
  { href: "/safety/compare", label: "Compare", icon: FiGitMerge },
  { href: "/safety/google-drive", label: "Google Drive", icon: FiHardDrive },
];

export default function SafetyTabs() {
  const pathname = usePathname();
  // A report page belongs to the Reports tab.
  const isActive = (href: string) =>
    href === "/safety" ? pathname === "/safety" || pathname.startsWith("/safety/report/") : pathname.startsWith(href);

  return (
    <nav
      aria-label="Safety Monitoring sections"
      className="-mx-4 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="m-0 flex w-max list-none gap-1 rounded-full border border-stroke bg-white p-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                ref={(el) => {
                  if (active && el) el.scrollIntoView({ block: "nearest", inline: "center" });
                }}
                className={clsx(
                  "inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  active ? "bg-primary text-dark" : "text-[#4F4F4F] hover:bg-gray-100"
                )}
              >
                <Icon size={16} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
