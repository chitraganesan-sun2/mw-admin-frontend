import {
  CommunityIcon,
  DashBoardIcon,
  HiringIcon,
  MailIcon,
  ReportIcon,
  ResourceIcon,
  VolunteerIcon,
} from "@/assets/icons";

export const getHeaderTitle = (pathname: string) => {
  const path = pathname.split("/")?.[1];
  return path;
};

//TODO: Need Redandunt work here
export const getHeaderIcon = (pathname: string) => {
  switch (getHeaderTitle(pathname)) {
    case "dashboard":
      return <DashBoardIcon />;
    case "volunteer":
      return <VolunteerIcon />;
    case "learner":
      return <VolunteerIcon />;
    case "reports":
      return <ReportIcon />;
    case "resources":
      return <ResourceIcon />;
    case "community":
      return <CommunityIcon />;
    case "broadcast":
      return <MailIcon />;
    case "hiring":
      return <HiringIcon />;
    default:
      return null;
  }
};
