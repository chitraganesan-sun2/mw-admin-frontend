
import Logo from "@/components/common/Logo";
import SectionCard from "./SectionCard";
import { CommunityIcon, ResourceIcon, SignOutIcon } from "@/assets/icons";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { DashBoardIcon, VolunteerIcon, ReportIcon } from "@/assets/icons";

const Sidebar = () => {
  const router = useRouter();

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
    // {
    //   href: "/reports",
    //   text: "Reports",
    //   icon: <ReportIcon />,
    // },
    // {
    //   href: "/resources",
    //   text: "Resources",
    //   icon: <ResourceIcon />,
    // },
    // {
    //   href: "/community",
    //   text: "Community",
    //   icon: <CommunityIcon />,
    // },
  ];

  const handleSignOut = () => {
    Cookies.remove("token");
    router.push("/");
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
      <SectionCard
        href="/"
        text="Sign Out"
        icon={<SignOutIcon />}
        textColor="#B91C1C"
        onClick={handleSignOut}
      />
    </div>
  );
};

export default Sidebar;
