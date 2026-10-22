import {
  CommunityIcon,
  HiringIcon,
  MailIcon,
  ReportIcon,
  ResourceIcon,
  VolunteerIcon,
  DonationIcon,
} from "@/assets/icons";

export const getHeaderTitle = (pathname: string) => {
  const path = pathname.split("/")?.[1];
  return path;
};

export const getHeaderIcon = (pathname: string) => {
  switch (getHeaderTitle(pathname)) {
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
    default:
      return null;
  }
};
