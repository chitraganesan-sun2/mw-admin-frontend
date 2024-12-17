import { CommunityIcon, ResourceIcon } from "@/assets/icons";

export const getHeaderTitle = (pathname: string) => {
  const path = pathname.split("/")?.[2];
  return path;
};

//TODO: Need Redandunt work here
export const getHeaderIcon = (pathname: string) => {
  switch (getHeaderTitle(pathname)) {
    case "resources":
      return <ResourceIcon />;
    case "community":
      return <CommunityIcon />;
    default:
      return null;
  }
};
