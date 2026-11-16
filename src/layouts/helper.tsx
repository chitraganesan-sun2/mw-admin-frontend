import {
  CommunityIcon,
  HiringIcon,
  MailIcon,
  ReportIcon,
  ResourceIcon,
  VolunteerIcon,
  DonationIcon,
  SafetyIcon,
  DashBoardIcon,
} from "@/assets/icons";
import { MdOutlineGroups } from "react-icons/md";
import { findNavItem } from "@/config/nav";
import { navIcon } from "@/components/common/Sidebar/navIcons";

export const getHeaderTitle = (pathname: string) => {
  const path = pathname.split("/")?.[1];
  return path;
};

export const getHeaderIcon = (pathname: string) => {
  switch (getHeaderTitle(pathname)) {
    case "dashboard":
      return <DashBoardIcon />;
    case "volunteer":
      return <VolunteerIcon />;
    case "learner":
    case "accounts":
      return <VolunteerIcon />;
    case "reports":
      return <ReportIcon />;
    case "resources":
      return <ResourceIcon />;
    case "community":
      return <CommunityIcon />;
    case "donations":
      return <DonationIcon />;
    case "broadcast":
    case "notifications":
      return <MailIcon />;
    case "hiring":
      return <HiringIcon />;
    case "safety":
      return <SafetyIcon />;
    case "wingtime":
      return <MdOutlineGroups />;
    default: {
      // Pages added after this switch (Audit Log, Session Feedback...) take their icon from the nav config.
      const hit = findNavItem(pathname);
      return hit ? navIcon(hit.item.icon) : null;
    }
  }
};
