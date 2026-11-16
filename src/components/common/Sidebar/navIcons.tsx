import type { ReactNode } from "react";
import {
  FiActivity,
  FiAward,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiClipboard,
  FiDollarSign,
  FiEdit3,
  FiFlag,
  FiHeadphones,
  FiHome,
  FiLayers,
  FiList,
  FiMail,
  FiMessageSquare,
  FiShield,
  FiShuffle,
  FiSmile,
  FiUserCheck,
  FiUsers,
  FiVideo,
} from "react-icons/fi";
import type { NavIconKey } from "@/config/nav";

// One distinct icon per page (the old sidebar reused the same three for most links).
const ICONS: Record<NavIconKey, ReactNode> = {
  dashboard: <FiHome />,
  support: <FiHeadphones />,
  volunteers: <FiUsers />,
  learners: <FiSmile />,
  accounts: <FiUserCheck />,
  "profile-changes": <FiEdit3 />,
  matching: <FiShuffle />,
  wingtime: <FiVideo />,
  safety: <FiShield />,
  reports: <FiFlag />,
  community: <FiMessageSquare />,
  resources: <FiBookOpen />,
  feedback: <FiActivity />,
  donations: <FiDollarSign />,
  hiring: <FiBriefcase />,
  broadcast: <FiMail />,
  notifications: <FiBell />,
  tutorials: <FiLayers />,
  lov: <FiList />,
  audit: <FiClipboard />,
};

export const navIcon = (key: NavIconKey): ReactNode => ICONS[key] ?? <FiAward />;
