"use client";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import SectionCard from "./SectionCard";
import {
  CommunityIcon,
  MailIcon,
  ResourceIcon,
  SignOutIcon,
  DonationIcon,
  SafetyIcon,
  DashBoardIcon,
} from "@/assets/icons";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { VolunteerIcon, ReportIcon, HiringIcon } from "@/assets/icons";
import React from "react";
import { MdOutlineGroups } from "react-icons/md";
import { WINGTIME_ENABLED } from "@/config/wingtime";
import { useQueryClient } from "@tanstack/react-query";
import { useStaff } from "@/hooks/useStaff";
import { canAccessPath } from "@/constants/access";

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

  const allLinks = [
    {
      href: "/dashboard",
      text: "Dashboard",
      icon: <DashBoardIcon />,
    },
    {
      href: "/support",
      text: "Support",
      icon: <ReportIcon />,
    },
    {
      href: "/volunteer",
      text: "Volunteers",
      icon: <VolunteerIcon />,
    },
    {
      href: "/learner",
      text: "Learners",
      icon: <VolunteerIcon />,
    },
    {
      href: "/reports",
      text: "Reports",
      icon: <ReportIcon />,
    },
    {
      href: "/resources",
      text: "Resources",
      icon: <ResourceIcon />,
    },
    {
      href: "/community",
      text: "Community",
      icon: <CommunityIcon />,
    },
    {
      href: "/donations",
      text: "Donations",
      icon: <DonationIcon />,
    },
    {
      href: "/broadcast",
      text: "Email Broadcast",
      icon: <MailIcon />,
    },
    {
      href: "/hiring",
      text: "Hiring",
      icon: <HiringIcon />,
    },
    {
      href: "/safety",
      text: "Safety Monitoring",
      icon: <SafetyIcon />,
    },
    {
      href: "/tutorial-links",
      text: "Tutorial Links",
      icon: <ResourceIcon />,
    },
    {
      href: "/list-of-values",
      text: "List of Values",
      icon: <ResourceIcon />,
    },
    {
      href: "/notifications",
      text: "Notifications",
      icon: <MailIcon />,
    },
    {
      href: "/accounts",
      text: "Accounts",
      icon: <VolunteerIcon />,
    },
    {
      href: "/profile-changes",
      text: "Profile Changes",
      icon: <VolunteerIcon />,
    },
    {
      href: "/matching",
      text: "Matching",
      icon: <VolunteerIcon />,
    },
    // WingTime approvals - only shown where the feature is switched on.
    ...(WINGTIME_ENABLED ? [{ href: "/wingtime", text: "WingTime", icon: <MdOutlineGroups size={22} /> }] : []),
  ];

  // Only the pages this account may open, by what the server says it may do. The "Support" home
  // is for support accounts (admins land on the admin screens). Hidden links are a convenience:
  // the APIs enforce the same permissions.
  const linksData = (staff ? allLinks : []).filter(
    (link) =>
      (link.href !== "/support" || staff?.role === "support") &&
      canAccessPath(link.href, staff?.permissions ?? [])
  );

  const handleSignOut = () => {
    queryClient.clear();
    Cookies.remove("token", { path: "/" });
    Cookies.remove("role", { path: "/" });
    Cookies.remove("onboarded_status", { path: "/" });
    Cookies.remove("learner_id", { path: "/" });
    Cookies.remove("volunteer_id", { path: "/" });
    Cookies.remove("lastActivity", { path: "/" });
    router.replace("/");
  };

  return (
    <div
      className={`bg-white w-full flex flex-col items-center justify-between overflow-y-auto ${
        variant === "drawer" ? "h-full p-4" : "h-screen p-6"
      }`}
    >
      <div className="w-full">
        <Link href="/">
          <Logo />
        </Link>
        <div className={`flex flex-col items-center w-full ${variant === "drawer" ? "gap-6 mt-8" : "gap-[2.2rem] mt-20"}`}>
          {staffLoading && <p className="text-sm text-gray-light">Loading...</p>}
          {linksData.map((link) => (
            <SectionCard key={link.href} {...link} onClick={onNavigate} />
          ))}
        </div>
      </div>
      <div className="w-full flex flex-col items-center gap-2">
        {staff && (
          <p className="text-xs text-gray-light text-center" data-testid="staff-role">
            {staff.username ? `${staff.username} · ` : ""}
            {staff.role === "support" ? "Support" : "Admin"}
          </p>
        )}
        {isClient && (
        <button
          onClick={handleSignOut}
            type="button"
          className="flex items-center gap-2 text-[#B91C1C] px-4 py-2 rounded-md"
        >
          <SignOutIcon />
          <span>Log Out</span>
        </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
