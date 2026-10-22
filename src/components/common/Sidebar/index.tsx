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
} from "@/assets/icons";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { VolunteerIcon, ReportIcon, HiringIcon } from "@/assets/icons";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStaff } from "@/hooks/useStaff";
import { canAccessPath } from "@/constants/access";

const Sidebar = () => {
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: staff, isLoading: staffLoading } = useStaff();
  const queryClient = useQueryClient();

  const allLinks = [
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
    <div className="bg-white w-full h-screen flex flex-col items-center justify-between p-6 overflow-y-auto">
      <div className="w-full">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex flex-col items-center gap-[2.2rem] w-full mt-20">
          {staffLoading && <p className="text-sm text-gray-light">Loading...</p>}
          {linksData.map((link) => (
            <SectionCard key={link.href} {...link} />
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
