"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";

interface SectionCardProps {
  href: string;
  text: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

const SectionCard = ({ href, text, icon, onClick }: SectionCardProps) => {
  const pathname = usePathname();
  // Exact/prefix match, not a bare substring check - `.includes(href)` would treat e.g.
  // "/report" as a match for pathname "/reports".
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
        isActive
          ? "bg-learner-background font-semibold text-dark"
          : "font-medium text-gray-medium hover:bg-background hover:text-dark"
      }`}
    >
      <span
        aria-hidden
        className={`text-[1.15rem] transition-colors ${isActive ? "text-primary" : "text-gray-light group-hover:text-dark"}`}
      >
        {icon}
      </span>
      <span className="truncate">{text}</span>
    </Link>
  );
};

export default SectionCard;
