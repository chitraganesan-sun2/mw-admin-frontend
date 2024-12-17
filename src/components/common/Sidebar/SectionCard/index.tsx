"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
interface SectionCardProps {
  href: string;
  text: string;
  icon: React.ReactNode;
  textColor?: string;
  onClick?: () => void;
}

const SectionCard = ({
  href,
  text,
  icon,
  textColor,
  onClick,
}: SectionCardProps) => {
  const pathname = usePathname();
  const isActive = pathname.includes(href);
  const role = Cookies.get("role");

  return (
    <div className="w-full flex items-center justify-center ">
      <Link
        href={`/${role}/${href}`}
        onClick={onClick}
        className="flex items-start gap-2 max-w-[125px] w-full ml-[-1rem]"
      >
        <span
          className={`text-[1.25rem] transition-all duration-300 ${
            isActive ? "" : "text-gray-light"
          }   `}
        >
          {icon}
        </span>
        <p
          className={`!text-[${textColor}] transition-all duration-300 font-medium ${
            isActive && !textColor ? "" : "text-gray-light"
          }`}
        >
          {text}
        </p>
      </Link>
    </div>
  );
};

export default SectionCard;
