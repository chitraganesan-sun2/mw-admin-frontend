"use client";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import SectionCard from "./SectionCard";
import { navIcon } from "./navIcons";
import { SignOutIcon } from "@/assets/icons";
import { useRouter } from "next/navigation";
import { clearSessionCookies } from "@/utils/session";
import React from "react";
import { FiSearch } from "react-icons/fi";
import { WINGTIME_ENABLED } from "@/config/wingtime";
import { NAV_GROUPS, visibleNavGroups } from "@/config/nav";
import { useQueryClient } from "@tanstack/react-query";
import { useStaff } from "@/hooks/useStaff";
import { openQuickJump } from "@/components/common/QuickJump";

interface SidebarProps {
  // "rail" is the permanent desktop column; "drawer" is the same menu inside the phone slide-out.
  variant?: "rail" | "drawer";
  // Called when a link is followed, so the phone menu can close itself.
  onNavigate?: () => void;
}

const Sidebar = ({ variant = "rail", onNavigate }: SidebarProps) => {
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: staff, isLoading: staffLoading } = useStaff();
  const queryClient = useQueryClient();

  // Only the pages this account may open, by what the server says it may do. Hidden links are a
  // convenience: the APIs enforce the same permissions.
  const groups = staff
    ? visibleNavGroups(
        { permissions: staff.permissions ?? [], role: staff.role, wingtimeEnabled: WINGTIME_ENABLED },
        NAV_GROUPS
      )
    : [];

  const handleSignOut = () => {
    queryClient.clear();
    clearSessionCookies();
    router.replace("/");
  };

  return (
    <nav
      aria-label="Main"
      className={`bg-white w-full flex flex-col justify-between overflow-y-auto ${
        variant === "drawer" ? "h-full p-4" : "h-screen px-4 py-6"
      }`}
    >
      <div className="w-full">
        <Link href="/" className="block px-2">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            openQuickJump();
          }}
          className="mt-6 flex w-full items-center gap-2 rounded-lg border border-stroke bg-background px-3 py-2 text-sm text-gray-medium hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <FiSearch aria-hidden />
          <span className="flex-1 text-left">Jump to…</span>
          <kbd className="hidden rounded border border-stroke bg-white px-1.5 text-[11px] text-gray-light lg:inline">
            Ctrl K
          </kbd>
        </button>
        <div className="mt-5 flex flex-col gap-4">
          {staffLoading && <p className="px-3 text-sm text-gray-light">Loading...</p>}
          {groups.map((group) => (
            <div key={group.label ?? "top"} className="flex flex-col gap-0.5">
              {group.label ? (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-light">
                  {group.label}
                </p>
              ) : null}
              {group.items.map((item) => (
                <SectionCard
                  key={item.href}
                  href={item.href}
                  text={item.text}
                  icon={navIcon(item.icon)}
                  onClick={onNavigate}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 flex w-full flex-col gap-2 border-t border-stroke pt-4">
        {staff && (
          <p className="px-3 text-xs text-gray-light" data-testid="staff-role">
            {staff.username ? `${staff.username} · ` : ""}
            {staff.role === "support" ? "Support" : "Admin"}
          </p>
        )}
        {isClient && (
          <button
            onClick={handleSignOut}
            type="button"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#B91C1C] hover:bg-error-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <SignOutIcon />
            <span>Log Out</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;
