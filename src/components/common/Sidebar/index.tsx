"use client";
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

const Sidebar = () => {
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const linksData = [
    // {
    //   href: "/dashboard",
    //   text: "Dashboard",
    //   icon: <DashBoardIcon />,
    // },
    {
      href: "/volunteer",
      text: "Volunteer",
      icon: <VolunteerIcon />,
    },
    {
      href: "/learner",
      text: "Learner",
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
      text: "Broadcast",
      icon: <MailIcon />,
    },
    // Hiring hidden on mobile and desktop
    {
      href: "/hiring",
      text: "Hiring",
      icon: <HiringIcon />,
    },
    {
      href: "/safety",
      text: "Safety",
      icon: <SafetyIcon />,
    },
    {
      href: "/tutorial-links",
      text: "Tutorials",
      icon: <ResourceIcon />,
    },
    {
      href: "/list-of-values",
      text: "List of Values",
      icon: <ResourceIcon />,
    },
  ];

  const handleSignOut = () => {
    Cookies.remove("token");
    router.replace("/login");
  };

  return (
    <div className="bg-white w-full h-screen flex flex-col items-center justify-between p-6">
      <div>
        <Logo />
        <div className="flex flex-col items-center gap-[2.2rem] w-full mt-20">
          {linksData.map((link) => (
            <SectionCard key={link.href} {...link} />
          ))}
        </div>
      </div>
      <div>
        {isClient && (
        <button
          onClick={handleSignOut}
            type="button"
          className="flex items-center gap-2 text-[#B91C1C] px-4 py-2 rounded-md"
        >
          <SignOutIcon />
          <span>Sign Out</span>
        </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
